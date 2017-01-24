var http = require('http'),
    twilio = require('twilio');
var express = require('express');
var app = express();


app.post('/', function(req, res){
    //Create TwiML response
    var twiml = new twilio.TwimlResponse();
    twiml.say("Por favor deje su mensaje después del tono",{
    		voice: "woman",
    		language: "es-MX"
		})
    	.play("", {
    		digits: 'www3'
    	})
    	.record("",{
    		timeout : 10,
    		action: "/recording-available",
    		recordingStatusCallback :"./recording-ready"
    	}).hangup();

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());

});

app.post('/recording-ready', function(req, res){
	console.log("READY");
	console.log(req.body);
});

app.post('/recording-available', function(req, res){
	console.log("AVAILABLE");
	console.log(req.body);
});


app.listen(1337);

console.log('TwiML servin\' server running at http://127.0.0.1:1337/');