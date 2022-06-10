const fs = require("fs");
const botjs = require("./bot/bot");
const methods = require("../methods");
const i = require("./bot/interface");
const udb = require(process.cwd() + "/databases/serey_stakebot/usersdb");
const adb = require(process.cwd() + "/databases/serey_stakebot/accountsdb");
const pdb = require(process.cwd() + "/databases/serey_stakebot/postsdb");
const bdb = require(process.cwd() + "/databases/blocksdb");
const helpers = require("../helpers");
const conf = require(process.cwd() + '/config.json');

var sjcl = require('sjcl');

Number.prototype.toFixedNoRounding = function(n) {
	const reg = new RegExp(`^-?\\d+(?:\\.\\d{0,${n}})?`, 'g')
	const a = this.toString().match(reg)[0];
	const dot = a.indexOf('.');
  
	if (dot === -1) {
	  return a + '.' + '0'.repeat(n);
	}
  
	const b = n - (a.length - dot) + 1;
  
	return b > 0 ? (a + '0'.repeat(b)) : a;
  }

async function run() {
	let accounts = await adb.findAllAccounts();
let users = await udb.findAllUsers();
if (accounts && accounts.length > 0) {
	var members = {};
	for (let user of accounts) {
		console.log('claim для пользователя ' + user.login)
				try {
			if (user.posting_key !== '') {
				let posting = sjcl.decrypt(user.login + '_postingKey_stakebot', user.posting_key);
				let get_account = await methods.getAccount(user.login);
				let acc = get_account[0];
				let temp_balance = parseFloat(acc.reward_steem_balance) + parseFloat(acc.reward_vesting_balance);
if (parseFloat(temp_balance) >= 0.1) {
var operations = [];
operations.push(["claim_reward_balance",{"account": user.login, "reward_steem": acc.reward_steem_balance, "reward_vests": acc.reward_vesting_balance}]);
console.log('Операции: ' + JSON.stringify(operations));
try {
await methods.send(operations, posting);
if (!members[user.id]) {
	members[user.id] = '';
	members[user.id] += `${user.login}: ${temp_balance} (${acc.reward_steem_balance} & ${acc.reward_vesting_balance})
`;
} else {
	members[user.id] += `${user.login}: ${temp_balance} (${acc.reward_steem_balance} & ${acc.reward_vesting_balance})
`;
}
} catch(error) {
	console.error('Ошибка отправки: ' + error);
}
await helpers.sleep(1000);
}
} else {
	console.log('Постинг ключ пустой.');
}
} catch(e) {
	console.error('claining error: ' + e);
		continue;
	}
}
await i.sendClaimNotify(members);
}
}

async function voteOperation(content, opbody) {
	let ok_ops_count = 0;
if (!content || content && content.code !== 1 || content && content.ended === true) {
return ok_ops_count;
}
let accounts = await adb.findAllAccounts();
	if (accounts && accounts.length > 0) {
		var members = {};
		for (let acc of accounts) {
			try {
				if (acc.posting_key !== '' && acc.curators && acc.curators !== '') {
					let posting = sjcl.decrypt(acc.login + '_postingKey_stakebot', acc.posting_key);
					if (acc.exclude_authors && acc.exclude_authors.indexOf(opbody.author) > -1) {
						continue;
					}
					let get_account = await methods.getAccount(acc.login);
					let account = get_account[0];
					let config_mass = await methods.getConfig();
					let props = await methods.getProps();
					let last_vote_time = account.last_vote_time;
						let current_time = new Date(props.time).getTime();
						let last_vote_seconds = new Date(last_vote_time).getTime();
						let fastpower = 10000 / config_mass.STEEMIT_VOTE_REGENERATION_SECONDS;
						 let volume_not = (account.voting_power + ((current_time-last_vote_seconds)/1000)* fastpower)/100; //расчет текущей Voting Power
						volume = volume_not.toFixed(2); // Округление до двух знаков после запятой
						 let charge = 0;
						if (volume>=100) {
						charge = 100;
						}
						else {
							charge=volume;
						}
						if (acc.min_energy && charge >= acc.min_energy || !acc.min_energy && charge === 100) {
							let curators = acc.curators.split(',');
							let votes = content.votes;
													if (curators && curators.length > 0 && curators.indexOf(opbody.voter) > -1 && content.votes && votes.indexOf(acc.login) === -1) {
														var operations = [];
	let weight = opbody.weight;
	if (weight > 0) {
		if (acc.curators_mode && acc.curators_mode !== 'replay') {
			weight = 10000;
		}
		operations.push(["vote",{"voter": acc.login, "author": opbody.author, "permlink": opbody.permlink, "weight": weight}]);
		try {
console.log('test4');
			await methods.send(operations, posting);
		if (!members[acc.id]) {
		members[acc.id] = {};
		members[acc.id]['unvote_data'] = `${acc.login}_${content.id}`;
		members[acc.id]['text'] = `🔁 <a href="https://dpos.space/serey/profiles/${opbody.voter}/votes">${opbody.voter}</a>
	${acc.login} ➡ <a href="https://serey.io/authors/${opbody.author}/${opbody.permlink}">@${opbody.author}/${content.title}</a>  ${weight / 100}%.
	`;
		} else {
			members[acc.id] = {};
			members[acc.id]['unvote_data'] = `${acc.login}_${content.id}`;
			members[acc.id]['text'] = `🔁 <a href="https://dpos.space/serey/profiles/${opbody.voter}/votes">${opbody.voter}</a>
		${acc.login} ➡ <a href="https://serey.io/authors/${opbody.author}/${opbody.permlink}">@${opbody.author}/${content.title}</a>  ${weight / 100}%.
		`;
	}
	await pdb.updatePost(content.id, opbody.author, opbody.permlink);
} catch(error) {
		console.error('send vote', error);
		continue;	
	}
	
	}
	
}
await helpers.sleep(1000);
}
	}
	} catch(e) {
		console.error(e);
			continue;
		}
	}
	if (Object.keys(members).length > 0) {
		await i.sendReplayVoteNotify(members);
		ok_ops_count += 1;
	}
}
return ok_ops_count;
}

	async function commentOperation(content, opbody) {
		let ok_ops_count = 0
		if (!content || content && content.code !== 1 || content && content.code !== 1 && content.edit !== false || content && content.code === 1 && content.edit !== false || content && content.ended === true) {
		return ok_ops_count;
		}
		let accounts = await adb.findAllAccounts();
		if (accounts && accounts.length > 0) {
			var members = {};
			for (let acc of accounts) {
						try {
					if (acc.posting_key !== '' && acc.favorits && acc.favorits !== '') {
						let posting = sjcl.decrypt(acc.login + '_postingKey_stakebot', acc.posting_key);
						let get_account = await methods.getAccount(acc.login);
						let account = get_account[0];
						let config_mass = await methods.getConfig();
						let props = await methods.getProps();
						let last_vote_time = account.last_vote_time;
							let current_time = new Date(props.time).getTime();
							let last_vote_seconds = new Date(last_vote_time).getTime();
							let fastpower = 10000 / config_mass.STEEMIT_VOTE_REGENERATION_SECONDS;
							 let volume_not = (account.voting_power + ((current_time-last_vote_seconds)/1000)* fastpower)/100; //расчет текущей Voting Power
							volume = volume_not.toFixed(2); // Округление до двух знаков после запятой
							 let charge = 0;
							if (volume>=100) {
							charge = 100;
							}
							else {
								charge=volume;
							}
							if (acc.min_energy && charge >= acc.min_energy || !acc.min_energy && charge === 100) {
		let favorits = acc.favorits.split(',');
	let content = await methods.getContent(opbody.author, opbody.permlink)
	let favorite_number = favorits.findIndex(el => el.split(':').indexOf(opbody.author) > -1);
	if (favorite_number > -1) {
		var operations = [];
		let weight = (acc.favorits_percent ? acc.favorits_percent : 1) * 100;
		let favorite_percent = favorits[favorite_number].split(':')[1];
		if (favorite_percent) weight = parseInt(parseFloat(favorite_percent) * 100);
		operations.push(["vote",{"voter": acc.login, "author": opbody.author, "permlink": opbody.permlink, "weight": weight}]);
		try {
			await methods.send(operations, posting);
		if (!members[acc.id]) {
			members[acc.id] = {};
			members[acc.id]['unvote_data'] = `${acc.login}_${content.id}`;
			members[acc.id]['text'] = `💕 ${acc.login} ➡ <a href="https://serey.io/authors/${opbody.author}/${opbody.permlink}">@${opbody.author}/${opbody.title}</a>  ${weight / 100}%.
		`;
		} else {
			members[acc.id] = {};
			members[acc.id]['unvote_data'] = `${acc.login}_${content.id}`;
			members[acc.id]['text'] = `💕 ${acc.login} ➡ <a href="https://serey.io/authors/${opbody.author}/${opbody.permlink}">@${opbody.author}/${opbody.title}</a>  ${weight / 100}%.
		`;
	}
	await pdb.updatePost(content.id, opbody.author, opbody.permlink);
	ok_ops_count += 1;
} catch(error) {
		console.error(error);
		}
		
	}
		await helpers.sleep(1000);
	}
		}
		} catch(e) {
			console.error('claining error: ' + e);
				continue;
			}
		}
		if (Object.keys(members).length > 0) {
			await i.sendFavoritsVoteNotify(members);
		}
		}
		return ok_ops_count;
	}

	botjs.allCommands();

module.exports.run = run;
module.exports.voteOperation = voteOperation;
module.exports.commentOperation = commentOperation;
module.exports.runScanner = i.runScanner;