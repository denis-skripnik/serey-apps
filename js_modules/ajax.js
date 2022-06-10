const fs = require("fs");
let express = require('express');
let app = express();
const helpers = require("./helpers");
const methods = require("./methods");
const sudb = require("../databases/serey_usersdb");
const asdb = require("../databases/asdb");
const prdb = require("../databases/prdb");
const pdb = require(process.cwd() + "/databases/serey_stakebot/postsdb");
const conf = require('../config.json');

app.get('/serey-api/', async function (req, res) {
    let service = req.query.service;
    let type = req.query.type;
    let page = req.query.page;
let date = req.query.date; // получили параметр date из url
let token = req.query.token; // получили параметр date из url
if (token) {
    token = token.toUpperCase();
}
let login = req.query.login; // получили параметр login из url
let permlink = req.query.permlink; // получили параметр user из url
if (type === 'posts' && token) {
    if (!date) {
        date = new Date().getMonth()+1 + '_' + new Date().getFullYear();
    let posts = await pdb.findAllPosts(token, date);
posts.sort(helpers.comparePosts);
let postsArray = [];
for (let post of posts) {
    postsArray.push({link: `<a href="https://serey.io/authors/${post.author}/${post.permlink}" target="_blank">${post.title}</a>`, amount: post.amount});
}
res.send(JSON.stringify(postsArray));
} else {
    let posts = await pdb.findAllPosts(token, date);
posts.sort(helpers.comparePosts);
let postsArray = [];
for (let post of posts) {
    postsArray.push({link: `<a href="https://serey.io/authors/${post.author}/${post.permlink}" target="_blank">${post.title}</a>`, amount: post.amount});
}
res.send(JSON.stringify(postsArray));
}
} else if (service === 'top' && type && page) {
    let data = await sudb.getTop(type, page);
    let users = [];
    if (data && data.length > 0) {
        let collums = {};
        collums['sp'] = ['sp', 'sp_percent', 'delegated_sp', 'received_sp', 'effective_sp', 'serey', 'serey_percent'];
        collums['delegated_sp'] = ['delegated_sp', 'sp', 'sp_percent', 'received_sp', 'effective_sp', 'serey', 'serey_percent'];
        collums['received_sp'] = ['received_sp', 'sp', 'sp_percent', 'delegated_sp', 'effective_sp', 'serey', 'serey_percent'];
        collums['effective_sp'] = ['effective_sp', 'sp', 'sp_percent', 'delegated_sp', 'received_sp', 'serey', 'serey_percent'];
        collums['serey'] = ['serey', 'serey_percent', 'sp', 'sp_percent', 'delegated_sp', 'received_sp', 'effective_sp'];
        let users_count = 0;
        for (let user of data) {
                users[users_count] = {};
                users[users_count]['name'] = user['name'];
for (let collum of collums[type]) {
    users[users_count][collum] = user[collum];
}
        users_count++;
        } // end for.
    } // end if data.
    res.send(users);
} else if (service === 'activity_stats') {
        let data = await asdb.findAllActivityStats();
        if (data && data.length > 0) {
            res.send(data);
        } else {
            res.send({});
        }
} else if (service === 'witnesses') {
    let data = await prdb.findAllWitnesses();
    if (data && data.length > 0) {
        res.send(data);
    } else {
        res.send({});
    }
}
});
app.listen(3179, function () {
});