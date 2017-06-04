var TelegramBot = require('node-telegram-bot-api');
var token = '262661836:AAEmdq-GrjxdMRzpewQvF99kjScCSdYf6iE';

// Create a bot that uses 'polling' to fetch new updates
var bot = new TelegramBot(token, { polling: true });
var Redis = require('ioredis');
var redis = new Redis();


var https = require('https');
var fs = require('fs');

/*
// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, function (msg, match) {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  var chatId = msg.chat.id;
  var resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
  bot.sendAudio(chatId, "path/to/audio.mp3");
});
*/

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = https.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
  };

bot.onText(/\/start/, function (msg, match) {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
    var chatId = msg.chat.id;

/*
  download("https://api.twilio.com/2010-04-01/Accounts/AC3731ecdfb08a847a5413e163d9a59442/Recordings/RE841cdee217af0de52958ba1d70517704.mp3", "./test.mp3", function(err){
    if(err){
      console.error("ERROR ", err);
      return;
    }
    bot.sendAudio(chatId, "./test.mp3",{
      title: "Correo de voz",
      performer: "+114542611",
      duration: 2
    });
}); 
  */
    bot.sendMessage(chatId, `Bienvenido! A partir de ahora, te enviaremos los mensajes de voz que recibas en tu casilla. 
    Por favor envianos tu numero para continuar.`,{
    reply_markup: { keyboard: [[{ text: "Enviar mi contacto", request_contact : true}]],
          one_time_keyboard: true, resize_keyboard: true}
  });
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  console.log(JSON.stringify(msg));
});

bot.on('contact', function (msg) {
  var chatId = msg.chat.id;
  console.log(JSON.stringify(msg));
  console.log("Subscribiendo nuevo usuario: " + JSON.stringify(msg.contact.phone_number) + " to chat id: " + chatId);
  redis.set(msg.contact.phone_number, chatId);
  redis.set(chatId, msg.contact);
});