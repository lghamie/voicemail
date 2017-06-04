var http = require('http'),
  twilio = require('twilio');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var TelegramBot = require('node-telegram-bot-api');
var token = '262661836:AAEmdq-GrjxdMRzpewQvF99kjScCSdYf6iE';
var https = require('https');
var fs = require('fs');

// Create a bot that uses 'polling' to fetch new updates
var bot = new TelegramBot(token, { polling: true });
var Redis = require('ioredis');
var redis = new Redis();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/', function(req, res) {
  //Create TwiML response
  var twiml = new twilio.TwimlResponse();
  twiml.say("Por favor deje su mensaje después del tono", {
      voice: "woman",
      language: "es-MX"
    })
    .record("", {
      timeout: 10,
      action: "http://www.preisst.com/api/recording-available",
      recordingStatusCallback: "http://www.preisst.com/api/recording-ready"
    }).hangup();

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());

});

app.post('/recording-ready', function(req, res) {
  console.log("Recording ready " + req.body);
  
});

var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(cb); // close() is async, call cb after close completes.
      });
    }).on('error', function(err) { // Handle errors
      fs.unlink(dest); // Delete the file async. (But we don't check the result)
      if (cb) cb(err.message);
    });
  };
app.post('/recording-available', function(req, res) {
  console.log("Available " + req.body);
  redis.get("541121594140").then(function(chatId) {
    var localFileName = "./" + req.body.RecordingSid + ".mp3";
    download(req.body.RecordingUrl + ".mp3", localFileName, function(err) {
      if (err) {
        console.error("ERROR ", err);
        return;
      }
      bot.sendAudio(chatId, localFileName, {
        title: "Voice message",
        performer: req.body.Caller,
      });
    });
  });
});

bot.onText(/\/start/, function(msg, match) {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  var chatId = msg.chat.id;

  bot.sendMessage(chatId, `Please send us your number to continue.`, {
    reply_markup: {
      keyboard: [
        [{ text: "Send my contact", request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', function(msg) {
  var chatId = msg.chat.id;
  console.log(JSON.stringify(msg));
});

bot.on('contact', function(msg) {
  var chatId = msg.chat.id;
  console.log("Subscribiendo nuevo usuario: " + JSON.stringify(msg.contact.phone_number) + " to chat id: " + chatId);
  redis.set(msg.contact.phone_number, chatId);
  redis.set(chatId, msg.contact);
  bot.sendMessage(chatId, `That's it! Now you'll receive all your voicemail through this chat. 
    If you want to unsubscribe at any time please send the word 'Cancel'`);
});


app.listen(1337);
console.log('Voicemail to Telegram server running at http://127.0.0.1:1337/');
