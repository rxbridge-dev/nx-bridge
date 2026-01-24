const admin = require("firebase-admin");
const serviceAccount = require("./king-ranux.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://king-ranux-pro-default-rtdb.firebaseio.com"
});

module.exports = admin.database();