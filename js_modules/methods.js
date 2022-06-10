var conf = require('../config.json');
var serey = require('@sereynetwork/sereyjs');
serey.config.set('websocket',conf.node);
let keccak = require("keccak");
let BigI = require("big-integer");

async function getOpsInBlock(bn) {
    return await serey.api.getOpsInBlockAsync(bn, false);
  }

  async function getBlockHeader(block_num) {
  return await serey.api.getBlockHeaderAsync(block_num);
  }

  async function getTransaction(trxId) {
    return await serey.api.getTransactionAsync(trxId);
    }
  
    async function getConfig() {
        return await serey.api.getConfigAsync();
        }

  async function getProps() {
      return await serey.api.getDynamicGlobalPropertiesAsync();
      }

      async function updateAccount(service) {
let test_user = '';
let pk = '';
        let 					metadata={};
        metadata.profile={};
                if (service === 'votes') {
        metadata.profile.name = 'Опросы и референдумы';
            metadata.profile.about= `Опросы и референдумы на Голосе. Создание путём отправки к null от ${conf.vote_price} с определённым кодом (рекомендуем пользоваться интерфейсом на dpos.space)`;
            metadata.profile.website = 'https://dpos.space/serey-polls';
        test_user = conf[service].login;
        pk = conf[service].posting_key;
        }
            let json_metadata=JSON.stringify(metadata);
        return await serey.broadcast.accountMetadataAsync(pk,test_user,json_metadata);
    }
    
    async function getAccount(login) {
        return await serey.api.getAccountsAsync([login]);
        }
    
        async function getTicker() {
            return await serey.api.getTickerAsync();
            }
            
    async function getContent(author, permlink) {
try {
let post = await serey.api.getContentAsync(author, permlink);
if (post.author === '' && post.permlink === '') return {code: -1, error: 'Post or comment was not found'};
let edit = true;
if (post.created === post.active) edit = false;
let ended = false;
if (post.last_payout !== '1970-01-01T00:00:00') ended = true;
if (post.parent_author === '') {
let votes = [];
if (post.active_votes && post.active_votes.length > 0) {
    for (let vote of post.active_votes) {
        votes.push(vote.voter);
    }
}
return {code: 1, title: post.title, created: post.created, edit, ended, id: post.id, votes};
} else {
    return {code: 2, title: post.title, created: post.created, edit, ended};
}
} catch(e) {
return {code: -1, error: e};
}
}

async function publickPost(title, permlink, main_data, answers, end_date) {
    let wif = conf.votes.posting_key;
    let parentAuthor = conf.votes.login;
    let parentPermlink = 'votes-list';
    let author = conf.votes.login;
    let now = new Date();
    let body = `## ${title}
Опрос создан при помощи @${conf.login}.
Проголосовать можно [тут](https://dpos.space/serey-polls/voteing/${permlink}), а посмотреть предварительные или окончательные результаты [здесь](https://dpos.space/serey-polls/results/${permlink}) или ниже, если опрос завершён.
    
${main_data}

Сервис создан незрячим разработчиком @denis-skripnik.`;
    
    let json_metadata = {};
    json_metadata.app = 'serey-votes/1.0';
    json_metadata.answers = answers;
    json_metadata.end_date = end_date;
    let jsonMetadata = JSON.stringify(json_metadata);
    let post = await serey.broadcast.commentAsync(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata);
return post;
}

function getDelegations() {
    return new Promise((resolve, reject) => {
        serey.api.getVestingDelegations(conf.login, -1, 1000, 'received', function(err, data) {
            if(err) {
                reject(err);
         } else {
                resolve(data);
         }
        });
    });
}

async function lookupAccounts(curr_acc) {
    return await serey.api.lookupAccountsAsync(curr_acc, 100);
}

async function getAccounts(accs) {
    return await serey.api.getAccountsAsync(accs);
}

async function getReputation(reputation) {
    if (reputation[reputation.length-1] === 0) reputation /= 10;
    return serey.formatter.reputation(reputation, true);
}

async function send(operations, posting) {
    return await serey.broadcast.sendAsync({extensions: [], operations}, [posting]);
}

async function wifToPublic(key) {
    return serey.auth.wifToPublic(key);
}

async function donate(posting_key, account, donate_to, donate_amount, donate_memo) {
    return serey.broadcast.donateAsync(posting_key, account, donate_to, donate_amount, {app: 'serey-stake-bot', version: 1, comment: donate_memo, target: {type: 'personal_donate'}}, []);
}

async function getBlockSignature(block) {
    var b = await serey.api.getBlockAsync(block);
    if(b && b.witness_signature) {
        return b.witness_signature;
    } 
    throw "unable to retrieve signature for block " + block;
}

async function randomGenerator(start_block, end_block, maximum_number) {
    let hasher = new keccak("keccak256");
    let sig = await getBlockSignature(end_block);
    let prevSig = await getBlockSignature(start_block);
    hasher.update(prevSig + sig);
        let sha3 = hasher.digest().toString("hex");
    let random = BigI(sha3, 16).mod(maximum_number);
    return random;
}

async function getBalances(accounts) {
    try {
        let assets = await serey.api.getAccountsBalancesAsync(accounts);
if (assets && assets.length > 0) {
return assets;
} else {
    return false;
}
        } catch(e) {
        console.log('Uia error: ' + e);
    return false;
    }
                }

async function getFeed(login) {
let query = {
    tag: login,
    limit: 100
}
    return await serey.api.getDiscussionsByFeedAsync(query);
}

async function getFollowing(login, start, fl) {
    let f = await serey.api.getFollowingAsync(login, start, 'blog', 100);
    let index = 0;
if (start !== -1) index = 1;
let following = '';
    for (let i = index; i < f.length; i++) {
following = f[i].following;
fl.push(following);
    }
let l = fl;
if (f.length === 1) {
    l = await getFollowing(login, following, fl);
}
return l;
}

async function getFollowingList(login) {
try {
    return await getFollowing(login, -1, []);
} catch(e) {
    console.error(e);
    return 'error';
}
}

async function vote(posting_key, account, author, permlink, percent) {
    percent *= 100;
    percent = parseInt(percent);
    if (percent > 100) percent = 100;
    return serey.broadcast.voteAsync(posting_key, account, author, permlink, percent);
}

      module.exports.getOpsInBlock = getOpsInBlock;
module.exports.getBlockHeader = getBlockHeader;
module.exports.getTransaction = getTransaction;
module.exports.getConfig = getConfig;
module.exports.getProps = getProps;      
module.exports.updateAccount = updateAccount;
module.exports.getAccount = getAccount;
module.exports.getTicker = getTicker;
module.exports.getContent = getContent;
module.exports.publickPost = publickPost;
module.exports.getDelegations = getDelegations;
module.exports.lookupAccounts = lookupAccounts;
module.exports.getAccounts = getAccounts;
module.exports.getReputation = getReputation;
module.exports.send = send;
module.exports.wifToPublic = wifToPublic;
module.exports.donate = donate;
module.exports.randomGenerator = randomGenerator;
module.exports.getBalances = getBalances;
module.exports.getFeed = getFeed;
module.exports.getFollowingList = getFollowingList;
