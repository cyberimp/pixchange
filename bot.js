'use strict';
var express = require('express');
var request = require ('request');
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
var uuid = require('uuid/v4');
var { Client } = require('pg');

var router = express.Router();

router.use(bodyParser.json());

const token = process.env.TOKEN;
const hookURI = process.env.HOOK;
const bucket = process.env.S3_BUCKET;
AWS.config.update({region:'us-west-2'});
var S3 = new AWS.S3();

// router.get('/setup', function(req, res){
//     request("https://api.telegram.org/bot"+ token +
//     "/setWebhook?url="+encodeURIComponent(hookURI + token),function (error,response,body){
//         console.error('error:', error); // Print the error if one occurred
//         console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//         console.log('body:', body); // Print the HTML for the Google homepage.
//         res.status(200).send(body);
//     });
//     res.status(200).send('bot setup done');
// })

router.post('/' + token, function(req,res){
        if (!('message' in req.body)){
            if(!('edited_message' in req.body)){
                res.sendStatus(200);
                return;
            }
            var chatID = req.body.edited_message.chat.id;
            if (!('photo' in req.body.edited_message)){
                request("https://api.telegram.org/bot"+ token +
                "/sendMessage?chat_id=" + chatID +
                "&text="+encodeURIComponent("Please attach a photo to update image on link."));
                res.sendStatus(200);
                return;
            }
            var client = new Client({
                connectionString: process.env.DATABASE_URL,
                ssl: true,
              });
            var query = 'SELECT image_id FROM images WHERE chat_id='+chatID+
            ' AND message_id='+req.body.edited_message.message_id+';';
            console.log(query);
            client.connect((err)=>{
                client.query(query,function(err,res){
                    console.log(err);
                    console.log(res);
                    if(err == null && res.rows.length>0){
                        var largest = req.body.edited_message.photo.slice(-1).pop();
                        var imagename = res.rows[0].image_id;
                        request("https://api.telegram.org/bot"+ token +
                        "/getFile?file_id="+largest.file_id,function (error,response,body){
                            console.error('error:', error); // Print the error if one occurred
                            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                            console.log('body:', body); // Print the HTML for the Google homepage.
                            var result = JSON.parse(body);
                            console.log(result.result);
                            request("https://api.telegram.org/file/bot"+ token +"/"+result.result.file_path).on("response",function(resp){
                                if(200 == resp.statusCode){
                                    S3.upload({Body: resp, Bucket: bucket, Key: imagename},function(err, data) {
                                        console.log(err);
                                        var message = 'Uploaded new version.';
                                        request("https://api.telegram.org/bot"+ token +
                                        "/sendMessage?chat_id=" + chatID +
                                        "&parse_mode=Markdown" +
                                        "&reply_to_message_id="+ message_id+
                                        "&text="+ encodeURIComponent(message)).on("complete",function(resp){
                                            client.end();
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            });
            res.sendStatus(200);
            return;

        } 
        var chatID = req.body.message.chat.id;
        if (!('photo' in req.body.message)){
            if (!('text') in req.body.message){
                res.sendStatus(200);
                return;
            }
            var text = req.body.message.text;
            if (text == '/start'){
                var client = new Client({
                    connectionString: process.env.DATABASE_URL,
                    ssl: true,
                  });
                client.connect(function(err){
                    console.log(err);
                    var query = 'SELECT image_id FROM images WHERE chat_id='+chatID+';';
                    client.query(query,(err, res) =>{
                        res.rows.forEach(element => {
                            var image = element.image_id;
                            S3.deleteObject({Bucket: bucket, Key: image});        
                        });
                        query = 'DELETE FROM images WHERE chat_id='+chatID+';';
                        client.query(query,(err, res) =>{
                            client.end();
                        });
                    });
                    res.sendStatus(200);

                    request("https://api.telegram.org/bot"+ token +
                    "/sendMessage?chat_id=" + chatID +
                    "&text="+encodeURIComponent("Your records are now clear, send images for tracking."));
                });
                return;
            }
            var command = req.body.message.text.toLowerCase().replace(/[^a-zа-я]/g,'');
            if (['хватит', 'stop', 'заебал', 'выруби', 'off', 'вырубай'].indexOf(command)!=-1){
                if (!('reply_to_message' in req.body.message)){
                    var client = new Client({
                        connectionString: process.env.DATABASE_URL,
                        ssl: true,
                      });
                    client.connect(function(err){
                        console.log(err);
                        var query = 'UPDATE images SET push=false WHERE chat_id='+chatID+';';
                        console.log(query);
                        res.sendStatus(200);
                        client.query(query,function(err,res){
                            client.end();
                        });
                    });
                    request("https://api.telegram.org/bot"+ token +
                    "/sendMessage?chat_id=" + chatID +
                    "&text="+encodeURIComponent("Turned off push messages globally."));
                    return;
                }
                var client = new Client({
                    connectionString: process.env.DATABASE_URL,
                    ssl: true,
                  });
                client.connect(function(err){
                    console.log(err);
                    var query = 'UPDATE images SET push=false WHERE chat_id='+chatID+
                    ' AND message_id='+req.body.message.reply_to_message.message_id+';';
                    console.log(query);
                    res.sendStatus(200);
                    client.query(query,function(err,res){
                        client.end();
                    });
                });
                request("https://api.telegram.org/bot"+ token +
                "/sendMessage?chat_id=" + chatID +
                "&text="+encodeURIComponent("Turned off push messages for image."));
                return;
            }

            if (['on', 'включи', 'заеби', 'запускай'].indexOf(command)!=-1){
                if (!('reply_to_message' in req.body.message)){
                    var client = new Client({
                        connectionString: process.env.DATABASE_URL,
                        ssl: true,
                      });
                    client.connect(function(err){
                        console.log(err);
                        var query = 'UPDATE images SET push=true WHERE chat_id='+chatID+';';
                        console.log(query);
                        res.sendStatus(200);
                        client.query(query,function(err,res){
                            client.end();
                        });
                    });
                    request("https://api.telegram.org/bot"+ token +
                    "/sendMessage?chat_id=" + chatID +
                    "&text="+encodeURIComponent("Turned on push messages globally."));
                    return;
                }
                var client = new Client({
                    connectionString: process.env.DATABASE_URL,
                    ssl: true,
                  });
                client.connect(function(err){
                    console.log(err);
                    var query = 'UPDATE images SET push=true WHERE chat_id='+chatID+
                    ' AND message_id='+req.body.message.reply_to_message.message_id+';';
                    console.log(query);
                    res.sendStatus(200);
                    client.query(query,function(err,res){
                        client.end();
                    });
                });
                request("https://api.telegram.org/bot"+ token +
                "/sendMessage?chat_id=" + chatID +
                "&text="+encodeURIComponent("Turned on push messages for image."));
                return;
            }

            request("https://api.telegram.org/bot"+ token +
            "/sendMessage?chat_id=" + chatID +
            "&text="+encodeURIComponent("Send pic pls!"));
            res.sendStatus(200);
            return;
        }
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
                        var client = new Client({
                            connectionString: process.env.DATABASE_URL,
                            ssl: true,
                          });
                        client.connect(function(err){
                            console.log(err);
                            var query = 'INSERT INTO images(image_id, message_id, chat_id, push) VALUES (\''+
                            imagename+'\','+message_id+','+chatID+',true);';
                            console.log(query);
                            client.query(query,function(err,res){
                                console.log(err);
                                console.log(res);
                                var message = 'your link is: \n`https://pixchange.herokuapp.com/'+ imagename+'`\n'+
                                'use it wisely!';
                                request("https://api.telegram.org/bot"+ token +
                                "/sendMessage?chat_id=" + chatID +
                                "&parse_mode=Markdown" +
                                "&reply_to_message_id="+ message_id+
                                "&text="+ encodeURIComponent(message)).on("complete",function(resp){
                                    client.end();
                                });
                            });
                        });
                        console.log(err, data);
                      });
                }
            });

        });
    res.status(200).send('ok'); 
});

module.exports = router;