'use strict';
var express = require('express');
var request = require ('request');
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var uuid = require('uuid/v4');
const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

var router = express.Router();

router.use(bodyParser.json());

const token = process.env.TOKEN;
const hookURI = process.env.HOOK;
const bucket = process.env.S3_BUCKET;
AWS.config.update({region:'us-west-2'});
var S3 = new AWS.S3();

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
        var message_id = req.body.message.message_id;
        console.log(chatID);
        console.log(req.body);
        console.log(largest);
        request("https://api.telegram.org/bot"+ token +
        "/getFile?file_id="+largest.file_id,function (error,response,body){
            console.error('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
            var result = JSON.parse(body);
            console.log(result.result);
            request("https://api.telegram.org/file/bot"+ token +"/"+result.result.file_path).on("response",function(resp){
                if(200 == resp.statusCode){
                    var ext = result.result.file_path.split('.').pop();
                    var imagename = uuid() +'.'+ ext;
                    S3.upload({Body: resp, Bucket: bucket, Key: imagename},function(err, data) {
                        client.connect();
                        client.query('INSERT INTO images(image_id, message_id, chat_id, push) VALUES ("'+
                        imagename+'",'+message_id+','+chatID+',true);',function(err,res){
                            console.log(err);
                            console.log(res);
                            client.end();
                            var message = 'your link is: \n`https://pixchange.herokuapp.com/'+ imagename+'`\n'+
                            'use it wisely!';
                            request("https://api.telegram.org/bot"+ token +
                            "/sendMessage?chat_id=" + chatID +
                            "&parse_mode=Markdown" +
                            "&text="+ encodeURIComponent(message));
                        });
                        console.log(err, data);
                      });
                }
            });

        });
    res.status(200).send('ok'); 
});

module.exports = router;