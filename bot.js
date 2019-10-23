'use strict';
var express = require('express');
var request = require ('request');
var bodyParser = require('body-parser')

var router = express.Router();

router.use(bodyParser.json());

const token = process.env.TOKEN;
const hookURI = process.env.HOOK;

router.get('/setup', function(req, res){
    request("https://api.telegram.org/bot"+ token +
    "/setWebhook?url="+encodeURIComponent(hookURI + token),function (error,response,body){
        console.error('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
        res.status(200).send(body);
    });
    res.status(200).send('bot setup done');
})

router.post('/' + token, function(req,res){
        var chatID = req.body.message.chat.id;
        var largest = req.body.message.photo.slice(-1).pop();
        console.log(chatID);
        console.log(largest);
        request("https://api.telegram.org/bot"+ token +
        "/getFile?file_id="+largest.file_id,function (error,response,body){
            console.error('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
            var result = JSON.parse(body)
            request("https://api.telegram.org/bot"+ token +"/"+result.result.file_path,function (error,response,body){
                console.error('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log('body:', body); // Print the HTML for the Google homepage.
        });
        });
    res.status(200).send('ok'); 
});

module.exports = router;