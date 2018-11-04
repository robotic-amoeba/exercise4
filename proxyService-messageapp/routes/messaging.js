const express = require('express');
const router = express.Router();
const DBservice = require('../database-service/DBservice');
const myDBservice = new DBservice();
const uuidv1 = require('uuid/v1');
const axios = require('axios');
const messageAPP = axios.create({
  baseURL: 'http://messageapp:3000',
  timeout: 3000
});


router.post('/', (req, res) => {
  const { destination, body } = req.body;
  if (!validateRequestParams(destination, body)) {
    res.status(400).send("Bad format: destination and message should be strings");
    return;
  }
  const messageID = uuidv1();
  const message = createInitialMessage(destination, body, messageID);
  myDBservice.createMessageAttempt(message)
  .then((success)=>{
    if (success) {
      reqToMessageAPP(destination, body)
        .then((messageStatus) => {
          myDBservice.updateMessageStatus(messageID, messageStatus)
          .then(()=>{
            res.status(200).send(messageStatus);
          })
        })
    } else {
      res.status(500).send("Server unavailable. Try again later");
    }
  })
});

router.get('/', (req, res, next) => {
  myDBservice.getMessages()
    .then((messages) => {
      res.status(200).send(messages)
    })
    .catch(next);
});

function validateRequestParams(destination, body) {
  if (!destination || !body) {
    return false;
  } else if (typeof destination !== "string" || typeof body !== "string") {
    return false;
  }
  return true;
}

function createInitialMessage(destination, body, messageID){
  const message = {
    destination,
    body,
    messageID,
    status: "Created from request"
  }
  return message;
}

function reqToMessageAPP(destination, body) {
  return messageAPP.post('/message', {
    destination,
    body
  })
    .then((response) => {
      return messageStatus = `Deliver confirmed. Response: ${response.data}`;
    })
    .catch((error) => {
      let customError;
      if (error.response || error.request) {
        customError = "Error in messageapp";
        messageStatus = "Not sent";
        if (error.code && error.code === 'ECONNABORTED') {
          customError = "Error in messageapp. Timeout";
          messageStatus = "Sent. Not confirmed.";
        }
      } else {
        customError = "Server error";
        messageStatus = "Not sent";
      }
      console.log(customError);
      return messageStatus;
    });
}


module.exports = router;


