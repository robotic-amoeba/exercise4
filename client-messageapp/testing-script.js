//this is a client trying to exploit flaws in the server error handling
const ClientService = require("./ClientService");
const client = new ClientService();

//should the api limit the length of the message?
const text =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
//client.sendMessage(text, "somebody");

//Requests/time should be limited to prevent attacks
setInterval(function() {
  client.sendMessage("usuario", "cn");
}, 1000);
