const express = require("express");
const router = express.Router();

const myDBservice = require("../database-service/DBservice");

//add security meassures here!

router.post("/", (req, res, next) => {
  const deposit = req.body.amount;
  myDBservice
    .incrementCredit(deposit)
    .then(() => {
      res.status(200).send("Balanced updated");
    })
    .catch(e => {
      res.status(500).send("Server error");
      console.log(e);
    });
});

module.exports = router;
