const express = require('express');
const router = express.Router();

const myDBservice = require('../database-service/DBservice');

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
  const message = conformInitialMessage(destination, body, messageID);

  const storeInDB = myDBservice.createMessageAttempt(message);
  const creditEnough = myDBservice.checkIfEnoughCredit();

  Promise.all([storeInDB, creditEnough])
  
    .then((results) => {
      if (results[0] && results[1]) {
        reqToMessageAPP(destination, body)
          .then((messageStatus) => {

            if (messageStatus.code = "OK") {
              const updateStatus = myDBservice.updateMessageStatus(messageID, messageStatus.status);
              const chargeMessage = myDBservice.chargeMessageInAccount();

              Promise.all([updateStatus, chargeMessage])
                .then(() => {
                  res.status(200).send(messageStatus.status);
                })

            } else {
              myDBservice.updateMessageStatus(messageID, messageStatus.status)
              .then(()=>{
                res.status(500).send(messageStatus.status);
              })
            }
          })

      } else {
        res.status(500).send("Unavailable. Check your credit and try again later");
      }
    })
    .catch((e)=>{
      console.log(e);
      res.status(500).send("Server error")
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

function conformInitialMessage(destination, body, messageID) {
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
      return messageStatus = { code: "OK", status: `Deliver confirmed. Response: ${response.data}` };
    })
    .catch((error) => {
      let customError;
      if (error.response || error.request) {
        customError = "Error in messageapp";
        messageStatus = { code: "KO", status: "Not sent" };
        if (error.code && error.code === 'ECONNABORTED') {
          customError = "Error in messageapp. Timeout";
          messageStatus = { code: "OK", code: "Sent. Not confirmed." };
        }
      } else {
        customError = "Server error";
        messageStatus = { code: "KO", status: "Not sent" };
      }
      console.log(customError);
      return messageStatus;
    });
}


module.exports = router;


