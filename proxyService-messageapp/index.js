const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 9001;
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "1MB" }));
app.use(limiter);

const messaging = require("./routes/messaging");
app.use("/message", messaging);

const accounting = require("./routes/accounting");
app.use("/credit", accounting);

app.use(function(err, req, res, next) {
  console.log("Error catched in middleware: ", err);
  if (err instanceof SyntaxError) {
    res.status(400).send("Error. Check the request format. (Sytax error)");
  } else {
    res.status(500).send("Server error");
  }
});

app.listen(PORT);
console.log(`Running on http://localhost:${PORT}`);
