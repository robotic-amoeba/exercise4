const mongoose = require('mongoose');
const Message = require('./models/Message');
let retryCount = 5;

class DBservice {

  constructor() {
    this.conection = mongoose.connect('mongodb://mongodb:27017/messagingCabify', { useNewUrlParser: true })
      .then(x => {
        console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
      })
      .catch(err => {
        console.error('Error connecting to mongo', err);
      });
  }

  createMessageAttempt(message) {
    const { destination, body, messageID, status } = message;
    return Message.create({
      destination,
      body,
      messageID,
      status
    })
      .then((data) => {
        console.log("created entry: ", data)
        return true;
      })
      .catch((error) => {
        if (retryCount > 0) {
          retryCount -= 1;
          console.log(retryCount);
          this.createMessageAttempt(message);
        } else {
          console.log("MONGO Error: ", error);
          retryCount = 5;
          return false;
        }
      })
  }

  updateMessageStatus(messageID, messageStatus) {
    return Message.findOneAndUpdate({ messageID }, { status: messageStatus }, { new: true })
      .then((data) => {
        console.log("updated entry: ", data);
      })
      .catch()
  }

  getMessages() {
    return Message.find()
  }
}

module.exports = DBservice;


