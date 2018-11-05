const mongoose = require("mongoose");
const Message = require("./models/Message");
const Account = require("./models/Account");
let retryCount = 5;

class DBservice {
  constructor(DBurl, accountID, messagePrice, initialCredit) {
    this.conection = mongoose
      .connect(
        DBurl,
        { useNewUrlParser: true }
      )
      .then(x => {
        console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
      })
      .catch(err => {
        console.error("Error connecting to mongo", err);
      });
    this.messagePrice = messagePrice;
    this.creditBalance = initialCredit;
    this.accountID = accountID;
    this.setInitialBalance(this.accountID);
  }

  createMessageAttempt(message) {
    const { destination, body, messageID, status } = message;
    return Message.create({
      destination,
      body,
      messageID,
      status
    })
      .then(data => {
        //console.log("created entry: ", data);
        return true;
      })
      .catch(error => {
        if (retryCount > 0) {
          retryCount -= 1;
          console.log(retryCount);
          this.createMessageAttempt(message);
        } else {
          console.log("MONGO Error: ", error);
          retryCount = 5;
          return false;
        }
      });
  }

  updateMessageStatus(messageID, messageStatus) {
    return Message.findOneAndUpdate({ messageID }, { status: messageStatus }, { new: true })
      .then(data => {
        console.log("updated entry: ", data);
      })
      .catch(e => console.log(e));
  }

  getMessages() {
    return Message.find().catch(e => console.log(e));
  }

  setInitialBalance(accountID) {
    return Account.findOne({ accountID }).then(wallet => {
      if (wallet) {
        //console.log("Wallet found in DB: ", wallet);
        return;
      } else {
        return Account.create({
          accountID: this.accountID,
          credit: this.creditBalance,
          locked: false
        })
          .then(data => {
            //console.log("Opened new wallet: ", data);
          })
          .catch(e => console.log(e));
      }
    });
  }

  checkIfEnoughCredit() {
    const accountID = this.accountID;
    return Account.findOne({ accountID }).then(wallet => {
      if (wallet.credit >= this.messagePrice) {
        this.creditBalance = wallet.credit;
        console.log("Enough credit found: ", wallet.credit);
        return true;
      } else {
        console.log("Not enough credit");
        return false;
      }
    });
  }

  chargeMessageInAccount() {
    const accountID = this.accountID;
    const price = this.messagePrice;
    const finalBalance = this.creditBalance - price;
    return Account.findOneAndUpdate({ accountID }, { credit: finalBalance }, { new: true }).catch(
      e => console.log(e)
    );
  }

  incrementCredit(deposit) {
    const accountID = this.accountID;
    return Account.findOneAndUpdate({ accountID }, { locked: true }, { new: true })
      .then(wallet => {
        const oldBalance = wallet.credit;
        const newBalance = oldBalance + deposit;
        Account.findOneAndUpdate(
          { accountID },
          { credit: newBalance, locked: false },
          { new: true }
        ).then(newWallet => console.log("New balance in account: ", newWallet.credit));
      })
      .catch(e => console.log(e));
  }

  checkAccountLock() {
    const accountID = this.accountID;
    return Account.findOneAndUpdate({ accountID }, { locked: true })
      .then(oldAccount => {
        console.log("Check if lock: ", oldAccount.locked);
        return oldAccount;
      })
      .catch(e => console.log(e));
  }

  unlockAccount() {
    const accountID = this.accountID;
    return Account.findOneAndUpdate({ accountID }, { locked: false })
      .then(() => console.log("Unlocked"))
      .catch(e => console.log(e));
  }
}

const accountID = "secretAndUniqueIDHere";
const myDBservice = new DBservice("mongodb://localhost:27017/messagingCabify", accountID, 1, 5);
module.exports = myDBservice;
