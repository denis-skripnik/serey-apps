require('./databases/@db.js').initialize({
    url: 'mongodb://localhost:27017',
    poolSize: 15
})

require("./js_modules/ajax");
const CronJob = require('cron').CronJob;
const conf = require("./config.json");
const top = require("./js_modules/serey_top");
const stakebot = require("./js_modules/stake_bot");
const as = require("./js_modules/activity_stats");
const wr = require("./js_modules/witness_rewards");
const helpers = require("./js_modules/helpers");
const methods = require("./js_modules/methods");
const asdb = require("./databases/asdb");
const gsbpdb = require("./databases/serey_stakebot/postsdb");
const bdb = require("./databases/blocksdb");
const LONG_DELAY = 12000;
const SHORT_DELAY = 3000;
const SUPER_LONG_DELAY = 1000 * 60 * 15;

async function processBlock(bn, props) {
    const block = await methods.getOpsInBlock(bn);
    let ok_ops_count = 0;
    let posts = {};
    for(let tr of block) {
        const [op, opbody] = tr.op;
        switch(op) {
            case "comment":
                if (!posts[`${opbody.author}/${opbody.permlink}`]) {
                    posts[`${opbody.author}/${opbody.permlink}`] = await methods.getContent(opbody.author, opbody.permlink)
                }
            ok_ops_count += await as.commentOperation(posts[`${opbody.author}/${opbody.permlink}`], op, opbody, tr.timestamp);
            ok_ops_count += await stakebot.runScanner(posts[`${opbody.author}/${opbody.permlink}`], op, opbody, tr.timestamp);
            ok_ops_count += await stakebot.commentOperation(posts[`${opbody.author}/${opbody.permlink}`], opbody);
            break;
            case "vote":
            ok_ops_count += await as.voteOperation(op, opbody, tr.timestamp);
            if (opbody.permlink !== '') {
                if (!posts[`${opbody.author}/${opbody.permlink}`]) {
                    posts[`${opbody.author}/${opbody.permlink}`] = await methods.getContent(opbody.author, opbody.permlink)
                }
                ok_ops_count += await stakebot.voteOperation(posts[`${opbody.author}/${opbody.permlink}`], opbody);
            }
            break;
case "producer_reward":
ok_ops_count += await wr.producerRewardOperation(opbody, props.total_vesting_fund_steem, props.total_vesting_shares, tr.timestamp);
break;
            default:
                    //неизвестная команда
            }
        }
        return ok_ops_count;
    }

let PROPS = null;

let bn = 0;
let last_bn = 0;
let delay = SHORT_DELAY;

async function getNullTransfers() {
    PROPS = await methods.getProps();
            const block_n = await bdb.getBlock(PROPS.last_irreversible_block_num);
bn = block_n.last_block;

delay = SHORT_DELAY;
while (true) {
    try {
        if (bn > PROPS.last_irreversible_block_num) {
            // console.log("wait for next blocks" + delay / 1000);
            await helpers.sleep(delay);
            PROPS = await methods.getProps();
        } else {
            if(0 < await processBlock(bn, PROPS)) {
                delay = SHORT_DELAY;
            } else {
                delay = LONG_DELAY;
            }
            bn++;
            await bdb.updateBlock(bn);
        }
    } catch (e) {
        console.log("error in work loop" + e);
        await helpers.sleep(1000);
        }
    }
}

setInterval(() => {
    if(last_bn == bn) {

        try {
                process.exit(1);
        } catch(e) {
            process.exit(1);
        }
    }
    last_bn = bn;
}, SUPER_LONG_DELAY);

getNullTransfers()

new CronJob('0 30 * * * *', top.run, null, true);
new CronJob('0 0 0 * * *', stakebot.run, null, true);
new CronJob('0 0 12 * * *', stakebot.run, null, true);    

new CronJob('0 0 0 * * *', asdb.removeactivityStats, null, true);    
new CronJob('0 0 0 * * 0', gsbpdb.removePosts, null, true);    
new CronJob('0 0 3 * * *', wr.producersDay, null, true);    
new CronJob('0 0 3 1 * *', wr.producersMonth, null, true);

const cleanup = require("./databases/@db.js").cleanup;
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);