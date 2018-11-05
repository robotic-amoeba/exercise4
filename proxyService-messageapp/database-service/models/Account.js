const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const accountSchema = new Schema({
  accountID: { type: String, unique: true },
  credit: Number,
  locked: Boolean
});

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
