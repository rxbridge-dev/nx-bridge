const db = require("../firebase");
const localConfig = require(process.cwd() + "/config.js");

function getNum(jid) {
  return jid.split("@")[0];
}

async function getSetting(jid, key) {
  const num = getNum(jid);
  const snap = await db.ref("users/" + num + "/" + key).once("value");
  if (snap.exists()) return snap.val();
  return localConfig[key];
}

async function setSetting(jid, key, value) {
  const num = getNum(jid);
  await db.ref("users/" + num + "/" + key).set(value);
}

async function resetUser(jid) {
  const num = getNum(jid);
  await db.ref("users/" + num).remove();
}

module.exports = { getSetting, setSetting, resetUser };