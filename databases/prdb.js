const pool = require('./@db.js')

async function getWitness(login) {
  let client = await pool.getClient()

    if (!client) {
        return;
    }

    try {

        const db = client.db("serey-chainserey-chain");

        let collection = db.collection('witnesses');

        let query = {login}

        let res = await collection.findOne(query);

return res;

    } catch (err) {

        console.error(err);
    return err;
      } finally {


    }
}

async function updateWitness(login, old_monthly_profit, now_monthly_profit, old_daily_profit, now_daily_profit, timestamp) {
  let client = await pool.getClient()

  if (!client) {
      return;
  }

  try {

      const db = client.db("serey-chainserey-chain");

      let collection = db.collection('witnesses');

      let res = await collection.updateOne({login}, {$set: {login, old_monthly_profit, now_monthly_profit, old_daily_profit, now_daily_profit, timestamp}}, { upsert: true });

return res;

  } catch (err) {

      console.error(err);
  return err;
    } finally {

  }
}

async function findAllWitnesses() {
  let client = await pool.getClient()

  if (!client) {
      return;
  }

  try {

      const db = client.db("serey-chainserey-chain");

      let collection = db.collection('witnesses');

      const res = [];
      let cursor = await collection.find({}).sort({now_daily_profit: -1}).limit(500);
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

module.exports.getWitness = getWitness;
module.exports.updateWitness = updateWitness;
module.exports.findAllWitnesses = findAllWitnesses;