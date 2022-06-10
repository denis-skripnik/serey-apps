const db = require('./@db.js');

async function getTop(type, page) {

    const client = await db.getClient();

    if (!client) {
        return;
    }

    try {

        const db = client.db("serey-chain");

        let collection = db.collection('serey_top');
        if (isNaN(page) || !isNaN(page) && page <= 0) return;
        const query = {}
        query[type] = { $exists: true }
        const sorting = {};
        sorting[type] = -1;
        let skip = page * 100 - 100;

        collection.createIndex(sorting, function (err) {
            if (err) {
                console.error(JSON.stringify(err));
            }
              });

        const res = [];
        let cursor = await collection.find(query).sort(sorting).skip(skip).limit(100);
        let doc = null;
        while(null != (doc = await cursor.next())) {
            res.push(doc);
        }
    return res;
      } catch (err) {
  
        console.log(err);
    return err;
      } finally {
  
        
    }
}

async function updateTop(name, sp, sp_percent, delegated_sp, received_sp, effective_sp, serey, serey_percent) {

    const client = await db.getClient();

    if (!client) {
        return;
    }

    try {

        const db = client.db("serey-chain");

        let collection = db.collection('serey_top');
        collection.createIndex({ name: -1 }, function (err) {
            if (err) {
                console.error(JSON.stringify(err));
            }
              });

              let res = await collection.updateOne({name}, {$set: {name, sp, sp_percent, delegated_sp, received_sp, effective_sp, serey, serey_percent}}, { upsert: true });

return res;
    } catch (err) {

        console.log(err);
    return err;
      } finally {

        
    }
}

module.exports.getTop = getTop;
module.exports.updateTop = updateTop;