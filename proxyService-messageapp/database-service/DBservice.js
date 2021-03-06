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
        return true;
      })
      .catch(error => {
        if (retryCount > 0) {
          retryCount -= 1;
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
      .then()
      .catch(e => console.log(e));
  }

  getMessages() {
    return Message.find().catch(e => console.log(e));
  }

  setInitialBalance(accountID) {
    return Account.findOne({ accountID }).then(wallet => {
      if (wallet) {
        return;
      } else {
        return Account.create({
          accountID: this.accountID,
          credit: this.creditBalance,
          locked: false
        })
          .then(data => {})
          .catch(e => console.log(e));
      }
    });
  }

  checkIfEnoughCredit() {
    const accountID = this.accountID;
    return Account.findOne({ accountID }).then(wallet => {
      if (wallet.credit >= this.messagePrice) {
        this.creditBalance = wallet.credit;
        return true;
      } else {
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
        ).then();
      })
      .catch(e => console.log(e));
  }

  checkAccountLock() {
    const accountID = this.accountID;
    return Account.findOneAndUpdate({ accountID }, { locked: true })
      .then(oldAccount => {
        return oldAccount;
      })
      .catch(e => console.log(e));
  }

  unlockAccount() {
    const accountID = this.accountID;
    return Account.findOneAndUpdate({ accountID }, { locked: false })
      .then()
      .catch(e => console.log(e));
  }
}

const accountID = "secretAndUniqueIDHere";
const myDBservice = new DBservice("mongodb://mongodb:27017/messagingCabify", accountID, 1, 5);
module.exports = myDBservice;
