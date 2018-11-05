const axios = require("axios");

class ClientService {
  constructor() {
    this.service = axios.create({
      baseURL: "http://localhost:9001",
      withCredentials: true
    });
  }

  sendMessage(destination, body) {
    return this.service
      .post("/message", { destination, body })
      .then(response => console.log(response.data))
      .catch(error => console.log("error: ", error.response.data));
  }
}

module.exports = ClientService;
