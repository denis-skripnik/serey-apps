const methods = require(process.cwd() + '/js_modules/methods');
let lng = {};
lng['Русский'] = require('./languages/ru.json');
lng['English'] = require('./languages/en.json');
const botjs = require("./bot");
const adb = require(process.cwd() + "/databases/serey_stakebot/accountsdb");
const udb = require(process.cwd() + "/databases/serey_stakebot/usersdb");
const pdb = require(process.cwd() + "/databases/serey_stakebot/postsdb");
const helpers = require(process.cwd() + "/js_modules/helpers");
const conf = require(process.cwd() + "/config.json");
var sjcl = require('sjcl');

// Клавиатура
async function keybord(lang, variant) {
    var buttons = [];
if (variant === 'lng') {
        buttons = [["English", "Русский"]];
    } else if (variant === 'home') {
        buttons = [[lng[lang].add_account, lng[lang].accounts, lng[lang].change_tags], [lng[lang].help, lng[lang].lang]];
    } else if (variant === 'on_off') {
        buttons = [[lng[lang].on, lng[lang].off, lng[lang].back, lng[lang].home]];
    } else if (variant.indexOf('@') > -1 && variant.indexOf('accounts_buttons') === -1 && variant.indexOf('unvote') === -1 && variant.indexOf('upvote_button') === -1) {
        let login = variant.split('@')[1];
        buttons = [[lng[lang].change_posting, lng[lang].auto_curator, lng[lang].delete], [lng[lang].back, lng[lang].home]];
    } else if (variant === 'auto_curator') {
        buttons = [[lng[lang].min_energy, lng[lang].curators, lng[lang].favorits, lng[lang].curators_mode], [lng[lang].exclude_authors, lng[lang].favorits_percent, lng[lang].back, lng[lang].home]];
    } else if (variant.indexOf('unvote@') > -1) {
        let post = variant.split('@')[1];
        buttons = [[[lng[lang].unvote + post, lng[lang].unvote_button]]];
    } else if (variant.indexOf('accounts_buttons') > -1) {
        buttons = JSON.parse(variant.split('accounts_buttons')[1]);
    }     else if (variant.indexOf('upvote_button@') > -1) {
        let post = variant.split('@')[1];
        buttons = [[[`${lng[lang].vote} ${post}`, lng[lang].vote]]];
    }     else if (variant === 'back') {
    buttons = [[lng[lang].back, lng[lang].home]];
}     else if (variant === 'favorits_buttons') {
    buttons = [[lng[lang].cancel, lng[lang].import_subs]];
}     else if (variant === 'send_vote') {
    buttons = [[['-100', '-100'], ['-75', '-75'], ['-50', '-50'], ['-25', '-25'], ['-10', '-10']], [['10', '10'], ['25', '25'], ['50', '50'], ['75', '75'], ['100', '100']], [[lng[lang].cancel, lng[lang].cancel]]];
}     else if (variant === 'cancel') {
        buttons = [[lng[lang].cancel]];
    }
    return buttons;
}

// Команды
async function main(id, my_name, message, status) {
    let user = await udb.getUser(id);
    if (!user) {
                await udb.addUser(id, '', '', 'start', '');
    } else {
        if (lng[user.lng] && message !== lng[user.lng].back) {            
        await udb.updateUser(id, user.lng, user.status, message, user.tags);
        } else {
            await udb.updateUser(id, user.lng, user.prev_status, user.status, user.tags);
        }        
    }
    
    if (message.indexOf('start') > -1 || user && user.lng && message.indexOf(lng[user.lng].lang) > -1) {
let text = '';
let btns;
if (message.indexOf('start') > -1 && user && user.lng && user.lng !== '') {
    await main(id, my_name, lng[user.lng].auth, status);
} else {
    text = `Select language: Выберите язык.`;
    btns = await keybord('', 'lng');
    await botjs.sendMSG(id, text, btns, false);
}
    } else if (user && user.lng && message.indexOf(lng[user.lng].auth) > -1) {
        let text = '';
        let btns;
        let my_accounts = await adb.getAccounts(id);
        if (my_accounts.length === 0) {
            text = lng[user.lng].enter_login;
            btns = await keybord(user.lng, 'cancel');
            await botjs.sendMSG(id, text, btns, false);
        } else {
            await main(id, my_name, lng[user.lng].home, status);
        }
    } else if (user && user.lng && message.indexOf(lng[user.lng].add_account) > -1) {
            let text = lng[user.lng].enter_login;
            let btns = await keybord(user.lng, 'cancel');
            await botjs.sendMSG(id, text, btns, false);
    } else if (user && user.lng && message.indexOf(lng[user.lng].home) > -1) {
        let text = lng[user.lng].home_message;
        let btns = await keybord(user.lng, 'home');
        await botjs.sendMSG(id, text, btns, false);        
    } else if (user && user.lng && message.indexOf(lng[user.lng].accounts) > -1) {
                                let text = lng[user.lng].accounts_list;
                                let accs = await adb.getAccounts(id);
                                if (accs && accs.length > 0) {
                                    let btns;
                                    if (accs.length > 12) {
                                        for (let acc of accs) {
                                            text += `
            @${acc.login}`;
                                                }
                                                                            btns = await keybord(user.lng, 'home');
                                                } else {
                                                    let n = 1;
let key = 0;
let buttons = [];
for (let acc of accs) {
if (!buttons[key]) {
buttons[key] = [];
}
buttons[key].push([`@${acc.login}`, `@${acc.login}`]);
if (n % 2 == 0) {
key++;
}
n++;
}
text = lng[user.lng].select_account;
btns = await keybord(user.lng, 'accounts_buttons' + JSON.stringify(buttons));
await botjs.sendMSG(id, text, btns, true);
}
                                                        } else {
                                                            text += lng[user.lng].account_list_is_empty;
                                                            btns = await keybord(user.lng, 'home');
                                                            await botjs.sendMSG(id, text, btns, false);
                                                        }
                                                                        } else if (user && user.lng && message === lng[user.lng].delete && user.status.indexOf('@') > -1) {
                                                                            let login = user.status.split('@')[1];
                                                                            if (message.split('@')[2]) {
                                                                                login += '@' + message.split('@')[2];
                                                                                    }
                                                                            await udb.updateUser(id, user.lng, user.status, 'delete_' + login, user.tags);
                                                                            let text = lng[user.lng].delete_conferm + login;
                                                    let btns = await keybord(user.lng, 'on_off');
                                                    await botjs.sendMSG(id, text, btns, false);
                                                } else if (user && user.lng && message.indexOf(lng[user.lng].change_tags) > -1) {
                                                    let text = lng[user.lng].enter_tags + user.tags;
                                                    let btns = await keybord(user.lng, 'cancel');
                                                    await botjs.sendMSG(id, text, btns, false);
                                                } else if (message.indexOf('@') > -1 && user.status.indexOf(lng[user.lng].news) === -1 && message.indexOf(lng[user.lng].vote) === -1) {
                                                                            let login = message.split('@')[1];
                                                                            let acc = await adb.getAccount(login);
                                                                            if (acc && acc.id === id) {
                                                                                let text = lng[user.lng].change_account + `<a href="https://dpos.space/serey/profiles/${login}">${message}</a>`;
                                                                                let btns = await keybord(user.lng, message);
                                                                                                    await botjs.sendMSG(id, text, btns, false);
                                                                            }
                                                                                    } else if (user && user.lng && message === lng[user.lng].change_posting && user.status.indexOf('@') > -1) {
                                                                                        let login = user.status.split('@')[1];
                                                                                        let my_acc = await adb.getAccount(login);
                                                                                        let text = '';
                                                                                        let btns;
                                                                                        if (my_acc && my_acc.id === id) {
                                                                                        let get_account = await methods.getAccount(login);
                                                                                        let acc = get_account[0]
                                                                                        if (get_account && get_account.length > 0) {
                                                                                            let posting_public_keys = [];
                                                                                        for (key of acc.posting.key_auths) {
                                                                                        posting_public_keys.push(key[0]);
                                                                                        }
                                                                                            text = lng[user.lng].type_posting;
                                                                                            btns = await keybord(user.lng, 'cancel');
                                                                                            await udb.updateUser(id, user.lng, user.status, 'changed_posting_' + login + '_' + JSON.stringify(posting_public_keys), user.tags);
                                                                                        } else {
                                                                                            await udb.updateUser(id, user.lng, user.status, 'change_account', user.tags);
                                                                                            text = lng[user.lng].not_account;
                                                                                            btns = await keybord(user.lng, 'home');
                                                                                        }
                                                                                    } else {
                                                                                        text = lng[user.lng].account_not_add;
                                                                                        btns = await keybord(user.lng, 'home');
                                                                                    }
                                                                                        await botjs.sendMSG(id, text, btns, false);
                                                            } else if (user && user.lng && message === lng[user.lng].auto_curator && user.status.indexOf('@') > -1) {
                                                                let login = user.status.split('@')[1];
                                                                let acc = await adb.getAccount(login);
    if (acc && acc.id === id) {
        let text = `${lng[user.lng].auto_curator_text}:
${lng[user.lng].min_energy}: ${acc.min_energy},
${lng[user.lng].curators}:
<code>${acc.curators}</code>

${lng[user.lng].exclude_authors}:
<code>${acc.exclude_authors}</code>

${lng[user.lng].favorits}:
<code>${acc.favorits}</code>

${lng[user.lng].curators_mode}: ${acc.curators_mode},
${lng[user.lng].favorits_percent}: ${acc.favorits_percent}.`;
                                                                    let btns = await keybord(user.lng, 'auto_curator');
                                                                await botjs.sendMSG(id, text, btns, false);
                                                                await udb.updateUser(id, user.lng, user.status, 'auto_curator@' + login, user.tags);
    }
                                                            } else if (user && user.lng && message === lng[user.lng].min_energy && user.status.indexOf('auto_curator@') > -1) {
                                                                let login = user.status.split('@')[1];
                                                                    let text = lng[user.lng].enter_min_energy;
                                                                    let btns = await keybord(user.lng, 'cancel');
                                                                await botjs.sendMSG(id, text, btns, false);
                                                                await udb.updateUser(id, user.lng, user.status, 'minEnergy_' + login, user.tags);
                                                            } else if (user && user.lng && message.indexOf(lng[user.lng].unvote) > -1) {
                                                             let unvote_data = message.split(' ')[1];
                                                             let unvote_arr = unvote_data.split('_');
                                                             let login = unvote_arr[0];
                                                                    let post_id = parseInt(unvote_arr[1]);
                                                                                                                                 let text = lng[user.lng].unvote_failed;
                                                                    let acc = await adb.getAccount(login);
                                                                    if (acc && acc.id === id) {
                                                                        if (acc.posting_key !== '') {
                                                                            let posting = sjcl.decrypt(acc.login + '_postingKey_stakebot', acc.posting_key);
                                                                        try {
    let post = await pdb.getPost(post_id);
                                                                            var operations = [];
    operations.push(["vote",{"voter": login, "author": post.author, "permlink": post.permlink, "weight": 0}]);
    await methods.send(operations, posting);
    text = lng[user.lng].unvote_ok;
} catch(er) {
    console.error(er);
}
                                                                        }
}
                                                                    let btns = await keybord(user.lng, 'home');
                                                                await botjs.sendMSG(id, text, btns, false);
                                                            } else if (user && user.lng && message === lng[user.lng].curators && user.status.indexOf('auto_curator@') > -1) {
                                                                let login = user.status.split('@')[1];
                                                                    let text = lng[user.lng].curators_text;
                                                                    let btns = await keybord(user.lng, 'cancel');
                                                                await botjs.sendMSG(id, text, btns, false);
                                                                await udb.updateUser(id, user.lng, user.status, 'curators_' + login, user.tags);
                                                            } else if (user && user.lng && message === lng[user.lng].curators_mode && user.status.indexOf('auto_curator@') > -1) {
                                                                let login = user.status.split('@')[1];
                                                                    let text = lng[user.lng].curators_mode_text;
                                                                    let btns = await keybord(user.lng, 'on_off');
                                                                await botjs.sendMSG(id, text, btns, false);
                                                                await udb.updateUser(id, user.lng, user.status, 'curatorsMode_' + login, user.tags);
                                                            } else if (user && user.lng && message === lng[user.lng].favorits && user.status.indexOf('auto_curator@') > -1) {
                                                                let login = user.status.split('@')[1];
                                                                    let text = lng[user.lng].favorits_text;
                                                                    let btns = await keybord(user.lng, 'favorits_buttons');
                                                                await botjs.sendMSG(id, text, btns, false);
                                                                await udb.updateUser(id, user.lng, user.status, 'favorits_' + login, user.tags);
                                                            } else if (user && user.lng && message === lng[user.lng].favorits_percent && user.status.indexOf('auto_curator@') > -1) {
                                                                let login = user.status.split('@')[1];
                                                                    let text = lng[user.lng].favorits_percent_text;
                                                                    let btns = await keybord(user.lng, 'cancel');
                                                                await botjs.sendMSG(id, text, btns, false);
                                                                await udb.updateUser(id, user.lng, user.status, 'favoritsPercent_' + login, user.tags);
                                                            } else if (user && user.lng && message === lng[user.lng].exclude_authors && user.status.indexOf('auto_curator@') > -1) {
                                                                let login = user.status.split('@')[1];
                                                                    let text = lng[user.lng].exclude_authors_text;
                                                                    let btns = await keybord(user.lng, 'cancel');
                                                                await botjs.sendMSG(id, text, btns, false);
                                                                await udb.updateUser(id, user.lng, user.status, 'excludeAuthors_' + login, user.tags);
                                                            } else if (user && user.lng && message.indexOf('юзеры') > -1) {
                                                                if (status === 2) {
let serey_accs = await adb.findAllAccounts();
let text = '';
let counter = 0;
for (let serey_acc of serey_accs) {
    counter++;
text += `${counter}. <a href="https://serey.in/@${serey_acc.login}">${serey_acc.login}</a>
`;
}
let btns = await keybord(user.lng, 'home');
await botjs.sendMSG(364096327, text, btns, false);                                                                
}
} else if (user && user.lng && message.indexOf(lng[user.lng].vote) > -1) {
    let link = message.split(' ')[1];
    let text = '';
    let btns;
    let accs = await adb.getAccounts(id);
        if (accs && accs.length > 0) {
        let account = accs[0];
        let get_account = await methods.getAccount(account.login);
    if (get_account && get_account.length > 0) {
        let acc = get_account[0];
        let config_mass = await methods.getConfig();
        let props = await methods.getProps();
        let last_vote_time = acc.last_vote_time;
            let current_time = new Date(props.time).getTime();
            let last_vote_seconds = new Date(last_vote_time).getTime();
            let fastpower = 10000 / config_mass.STEEMIT_VOTE_REGENERATION_SECONDS;
             let volume_not = (acc.voting_power + ((current_time-last_vote_seconds)/1000)* fastpower)/100; //расчет текущей Voting Power
             volume = volume_not.toFixed(2); // Округление до двух знаков после запятой
             let charge = 0;
            if (volume>=100) {
            charge = 100;
            }
            else {
                charge=volume;
            }
        let award_data = {};
        award_data.login = account.login;
        award_data.postingKey = account.posting_key;
        award_data.link = link;
            text = `${lng[user.lng].type_vote} ${account.login}. ${lng[user.lng].type_vote_percent}: ${charge}%`;
                btns = await keybord(user.lng, 'send_vote');
                await udb.updateUser(id, user.lng, user.status, 'voteing_' + JSON.stringify(award_data), user.tags);                
    } else {
        text = lng[user.lng].not_connection;
        btns = await keybord(user.lng, 'back');
    }
} else {
    text = lng[user.lng].not_account;
    btns = await keybord(user.lng, 'no');
}
    await botjs.sendMSG(id, text, btns, true);
} else if (user && user.lng && message.indexOf(lng[user.lng].news) > -1) {
                                                                if (status === 2) {
                                                                    let text = lng[user.lng].type_news;
                                                                    let btns = await keybord(user.lng, 'cancel');
                                                                                await botjs.sendMSG(id, text, btns, false);
                                                                }                                                            
                                                            } else if (user && user.lng && message.indexOf(lng[user.lng].help) > -1) {
                                                                let text = lng[user.lng].help_text;
                                                                let btns = await keybord(user.lng, 'home');
                                                                            await botjs.sendMSG(id, text, btns, false);
                                                            } else if (typeof lng[message] !== "undefined") {
                        let text = lng[message].selected_language;
        let btns = await keybord(message, '');
                    await udb.updateUser(id, message, user.status, message, user.tags);
                    await botjs.sendMSG(id, text, btns, false);
                    await helpers.sleep(3000);
                    await main(id, my_name, lng[message].auth, status);
                } else if (user && user.lng && user.lng !== '' && message.indexOf(lng[user.lng].back) > -1 || user && user.lng && user.lng !== '' && message.indexOf(lng[user.lng].cancel) > -1) {
                    await main(id, my_name, user.prev_status, status);
                } else {
                    if (user.lng && lng[user.lng] && user.status === lng[user.lng].auth || lng[user.lng] && user.status === lng[user.lng].add_account) {
let get_account = await methods.getAccount(message);
let text = '';
let btns;
if (get_account && get_account.length > 0) {
    let acc = get_account[0]
    let posting_public_keys = [];
for (key of acc.posting.key_auths) {
posting_public_keys.push(key[0]);
}
    text = lng[user.lng].type_posting;
    btns = await keybord(user.lng, 'cancel');
    await udb.updateUser(id, user.lng, user.status, 'login_' + message + '_' + JSON.stringify(posting_public_keys), user.tags);
} else {
    await udb.updateUser(id, user.lng, user.status, 'add_account', user.tags);
    text = lng[user.lng].not_account;
    btns = await keybord(user.lng, 'home');
}
await botjs.sendMSG(id, text, btns, false);
                    } else if (user.lng && lng[user.lng] && user.status.indexOf('login_') > -1) {
let login = user.status.split('_')[1];
let posting_public_keys = user.status.split('_')[2];
let text = '';
let btns;
try {
const public_wif = await methods.wifToPublic(message);
if (posting_public_keys.indexOf(public_wif) > -1) {
await adb.updateAccount(id, login, sjcl.encrypt(login + '_postingKey_stakebot', message), 100, '', '', 'replay', 0, '');
await udb.updateUser(id, user.lng, user.status, 'posting_' + login, user.tags);
                        text = lng[user.lng].saved_true;
btns = await keybord(user.lng, 'home');
await botjs.sendMSG(id, text, btns, false);
} else {
    await udb.updateUser(id, user.lng, user.status, lng[user.lng].home, user.tags);
    text = lng[user.lng].posting_not_found;
    btns = await keybord(user.lng, 'home');
    await botjs.sendMSG(id, text, btns, false);
    await helpers.sleep(1000);
    await main(id, my_name, lng[user.lng].change_posting + '@' + login, status);
}
} catch(e) {
    await udb.updateUser(id, user.lng, user.status, lng[user.lng].home, user.tags);
    text = lng[user.lng].posting_not_valid;
    btns = await keybord(user.lng, 'home');
    await botjs.sendMSG(id, text, btns, false);
    await helpers.sleep(1000);
    await main(id, my_name, lng[user.lng].change_posting + '@' + login, status);
}    
} else if (user.lng && lng[user.lng] && user.status.indexOf('changed_posting_') > -1) {
    let arr = user.status.split('@')[1];
    let login = arr.split('_')[0];
    let text = '';
let btns;
try {
    const public_wif = await methods.wifToPublic(message);
    let posting_public_keys = user.status.split('_')[3];
    console.log(JSON.stringify(posting_public_keys), public_wif);
    if (posting_public_keys.indexOf(public_wif) > -1) {
    await adb.updateAccount(id, login, sjcl.encrypt(login + '_postingKey_stakebot', message), 100, '', '', 'replay', 0, '');
                            await udb.updateUser(id, user.lng, user.status, 'added_posting_key', user.tags);
                            text = lng[user.lng].saved_posting_key + login;
    btns = await keybord(user.lng, 'home');
    await botjs.sendMSG(id, text, btns, false);
} else {
    await udb.updateUser(id, user.lng, user.status, lng[user.lng].home, user.tags);
    text = lng[user.lng].posting_not_found;
    btns = await keybord(user.lng, 'home');
    await botjs.sendMSG(id, text, btns, false);
    await helpers.sleep(1000);
    await main(id, my_name, lng[user.lng].change_posting + '@' + login, status);
}
    } catch(e) {
        await udb.updateUser(id, user.lng, user.status, lng[user.lng].home, user.tags);
        console.log(JSON.stringify(e));
        text = lng[user.lng].posting_not_valid;
        btns = await keybord(user.lng, 'home');
        await botjs.sendMSG(id, text, btns, false);
    }    
} else if (user.lng && lng[user.lng] && user.status.indexOf('minEnergy_') > -1) {
    let login = user.status.split('_')[1];
    let acc = await adb.getAccount(login);
    let text = '';
    if (acc && acc.id === id) {
    let energy = parseFloat(message);
if (energy && energy > 0) {
    await adb.updateAccount(id, login, acc.posting_key, energy, acc.curators, acc.favorits, acc.curators_mode, acc.favorits_percent, acc.exclude_authors);
    text = lng[user.lng].min_energy_saved;
} else {
    text = lng[user.lng].min_energy_not_valid;
}
} else {
    text = lng[user.lng].account_not_add;
}
let btns = await keybord(user.lng, 'home');
await botjs.sendMSG(id, text, btns, false);
} else if (user.lng && lng[user.lng] && user.status.indexOf('curators_') > -1) {
    let login = user.status.split('_')[1];
    let acc = await adb.getAccount(login);
    let text = '';
    if (acc && acc.id === id) {
let curators = message.split(',');
let accs = await methods.getAccounts(curators);
if (accs && accs.length === curators.length) {
    await adb.updateAccount(id, login, acc.posting_key, acc.min_energy, message, acc.favorits, acc.curators_mode, acc.favorits_percent, acc.exclude_authors);
    text = lng[user.lng].curators_saved;
} else {
    text = lng[user.lng].curators_not_valid;
}
} else {
    text = lng[user.lng].account_not_add;
}
let btns = await keybord(user.lng, 'home');
await botjs.sendMSG(id, text, btns, false);
} else if (user.lng && lng[user.lng] && user.status.indexOf('curatorsMode_') > -1) {
    let login = user.status.split('_')[1];
    if (user.status.split('_')[2]) {
login += ' @' + user.status.split('_')[2];
    }
    let acc = await adb.getAccount(login);
    let text = '';
    if (acc && acc.id === id) {
        let mode = 'no';
        text = lng[user.lng].curators_mode_off;
        if (message === lng[user.lng].on) {
    text = lng[user.lng].curators_mode_on;
    mode = 'replay';
}
await adb.updateAccount(id, login, acc.posting_key, acc.min_energy, acc.curators, acc.favorits, mode, acc.favorits_percent, acc.exclude_authors);
}                        
    await udb.updateUser(id, user.lng, user.status, 'auto_curator@' + login, user.tags);
    let btns = await keybord(user.lng, 'home');
    await botjs.sendMSG(id, text, btns, false);
} else if (user.lng && lng[user.lng] && user.status.indexOf('favorits_') > -1) {
    let login = user.status.split('_')[1];
    let acc = await adb.getAccount(login);
    let text = '';
    if (acc && acc.id === id && message === lng[user.lng].import_subs) {
        let following = await methods.getFollowingList(login);
        if (following !== 'error') {
            await adb.updateAccount(id, login, acc.posting_key, acc.min_energy, acc.curators, following.join(), acc.curators_mode, acc.favorits_percent, acc.exclude_authors);
        text = lng[user.lng].import_ok;
        } else {
            text = lng[user.lng].import_failed;
        }
} else if (acc && acc.id === id && message !== lng[user.lng].import_subs) {
let favorits = message.split(',');
let logins = [];
for (let favorite of favorits) {
    let login = favorite.split(':')[0];
    logins.push(login);
}
let accs = await methods.getAccounts(logins);
if (accs && accs.length === favorits.length) {
    await adb.updateAccount(id, login, acc.posting_key, acc.min_energy, acc.curators, message, acc.curators_mode, acc.favorits_percent, acc.exclude_authors);
    text = lng[user.lng].favorits_saved;
} else {
    text = lng[user.lng].favorits_not_valid;
}
} else {
    text = lng[user.lng].account_not_add;
}
let btns = await keybord(user.lng, 'home');
await botjs.sendMSG(id, text, btns, false);
} else if (user.lng && lng[user.lng] && user.status.indexOf('favoritsPercent_') > -1) {
    let login = user.status.split('_')[1];
    let acc = await adb.getAccount(login);
    let text = '';
    if (acc && acc.id === id) {
    let percent = parseFloat(message);
if (percent && percent > 0) {
    await adb.updateAccount(id, login, acc.posting_key, acc.min_energy, acc.curators, acc.favorits, acc.curators_mode, percent, acc.exclude_authors);
    text = lng[user.lng].favorits_percent_saved;
} else {
    text = lng[user.lng].favorits_percent_not_valid;
}
} else {
    text = lng[user.lng].account_not_add;
}
let btns = await keybord(user.lng, 'home');
await botjs.sendMSG(id, text, btns, false);
} else if (user.lng && lng[user.lng] && user.status.indexOf('excludeAuthors_') > -1) {
    let login = user.status.split('_')[1];
    let acc = await adb.getAccount(login);
    let text = '';
    if (acc && acc.id === id) {
let authors = message.split(',');
let accs = await methods.getAccounts(authors);
if (accs && accs.length === authors.length) {
    await adb.updateAccount(id, login, acc.posting_key, acc.min_energy, acc.curators, acc.favorits, acc.curators_mode, acc.favorits_percent, message);
    text = lng[user.lng].exclude_authors_saved;
} else {
    text = lng[user.lng].exclude_authors_not_valid;
}
} else {
    text = lng[user.lng].account_not_add;
}
let btns = await keybord(user.lng, 'home');
await botjs.sendMSG(id, text, btns, false);
} else if (user.lng && lng[user.lng] && user.status.indexOf('delete_') > -1) {
    let login = user.status.split('_')[1];
    if (user.status.split('_')[2]) {
login += ' @' + user.status.split('_')[2];
    }
    let acc = await adb.getAccount(login);
    let text = '';
    if (acc) {
        text = lng[user.lng].delete_false;
        if (message === lng[user.lng].on) {
    text = lng[user.lng].delete_true;
    let res = await adb.removeAccount(id, login);
console.log('Результат: ' + JSON.stringify(res));
}
    }                        
    await udb.updateUser(id, user.lng, user.status, 'delet_account', user.tags);
    let btns = await keybord(user.lng, 'home');
    await botjs.sendMSG(id, text, btns, false);
    await helpers.sleep(3000);
    await main(id, my_name, lng[user.lng].home, status);
} else if (user && user.lng && lng[user.lng] && user.status.indexOf('voteing_') > -1) {
    let json = user.status.split('voteing_')[1];
    let data = JSON.parse(json);
    let link = data.link;
    let [author, permlink] = link.split('/');
    let wif = sjcl.decrypt(data.login + '_postingKey_stakebot', data.postingKey);
    let text = '';
    try {
        await methods.vote(wif, data.login, author, permlink, parseFloat(message));
    text = lng[user.lng].vote_sended;
    await udb.updateUser(id, user.lng, user.status, '/start', user.tags);
    } catch(e) {
        text = lng[user.lng].vote_error + e;
        await udb.updateUser(id, user.lng, user.status, '/start', user.tags);
    }
            let btns = await keybord(user.lng, 'home');
            await botjs.sendMSG(id, text, btns, false);
} else if (user.lng && lng[user.lng] && user.status === lng[user.lng].change_tags) {
    const searchRegExp = /—/g;
const replaceWith = '--';

const result = message.replace(searchRegExp, replaceWith);
await udb.updateUser(id, user.lng, user.status, '/start', result);
    let text = lng[user.lng].tags_changed;
            let btns = await keybord(user.lng, 'home');
                await botjs.sendMSG(id, text, btns, false);
} else if (user.lng && lng[user.lng] && user.status.indexOf(lng[user.lng].news) > -1 && status === 2) {
    let btns = await keybord(user.lng, 'home');
let all_users = await udb.findAllUsers();
for (let one_user of all_users) {
try {
await botjs.sendMSG(one_user.id, message, btns, false);
} catch(e) {
continue;
}
await helpers.sleep(1000);
}
}
                    }
}

async function sendClaimNotify(members) {
    for (let id in members) {
        try {
        let user = await udb.getUser(parseInt(id));
if (user) {
    let text = lng[user.lng].send_claim + `
`;
    text += members[id];
                                        btns = await keybord(user.lng, 'no');
await botjs.sendMSG(id, text, btns, true);
}
} catch(e) {
    console.log(e);
    continue;
}
}
}

async function sendReplayVoteNotify(members) {
    for (let id in members) {
            try {
            let user = await udb.getUser(parseInt(id));
    if (user) {
        let info = members[id].text;
        let post = members[id].unvote_data;
        let text = `${info}`;
let btns = await keybord(user.lng, 'unvote@' + post);
await botjs.sendMSG(parseInt(id), text, btns, true);
}    
    await helpers.sleep(500);
    } catch(e) {
        console.log(e);
        continue;
    }
        }       
    }

    async function sendFavoritsVoteNotify(members) {
        for (let id in members) {
            try {
            let user = await udb.getUser(parseInt(id));
    if (user) {
        let info = members[id].text;
        let post = members[id].unvote_data;
                let text = `${info}`;
let btns = await keybord(user.lng, 'unvote@' + post);
        await botjs.sendMSG(parseInt(id), text, btns, true);
    }
        await helpers.sleep(500);
    } catch(e) {
        console.log(JSON.stringify(e));
        continue;
    }
        }       
    }

    async function runScanner(content, op, opbody, timestamp) {
        let ok = 0;
        let users = await udb.findAllUsers();
        if (content && content.code === 1 && content.created === timestamp && users && users.length > 0 && opbody.json_metadata) {
            let metadata = JSON.parse(opbody.json_metadata);
            if (metadata && metadata.tags && metadata.tags.length > 0) {
        let tags = metadata.tags;
        let tags_list = '';
    for (let tag of tags) {
        tags_list += ` <a href="https://golos.id/created/${tag}">#${tag}</a>`;
    }
        for (let user of users) {
            if (user.tags && user.tags !== '') {
                let user_tags = user.tags.split(',');
                if (user_tags && tags.some(item => user_tags.includes(item)) || user_tags.indexOf(opbody.parent_permlink) > -1) {
                    let text = `${lng[user.lng].post_from_tag} <a href="https://dpos.space/golos/profiles/${opbody.author}">${opbody.author}</a>
        <a href="https://serey.io/authors/${opbody.author}/${opbody.permlink}">${opbody.title}</a>
        ${lng[user.lng].tags}:${tags_list}`;
                               let btns = await keybord(user.lng, `upvote_button@${opbody.author}/${opbody.permlink}`);
                    await botjs.sendMSG(user.id, text, btns, true);            
                ok += 1;
                }
            }
    }
    }
        }
    return ok;
    }
    
        module.exports.main = main;
        module.exports.sendClaimNotify = sendClaimNotify;
        module.exports.sendReplayVoteNotify = sendReplayVoteNotify;
        module.exports.sendFavoritsVoteNotify = sendFavoritsVoteNotify;
        module.exports.runScanner = runScanner;