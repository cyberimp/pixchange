'use strict';
var express = require('express');
var request = require ('request');
var AWS = require('aws-sdk');
AWS.config.update({region:'us-west-2'});
var S3 = new AWS.S3();

var bot = require('./bot');

var { Client } = require('pg');

const app = express();
const port = process.env.PORT;
const token = process.env.TOKEN;
const bucket = process.env.S3_BUCKET;

app.use('/bot', bot)

app.get('/favicon.ico', (req, res) => {
  res.send('');
});

app.get('/:img', (req, res) => {
  var img = req.params.img;
  var nopush = 'nopush' in req.params;
  S3.getObject({Bucket: bucket, Key: img},(err,data) =>{
    if (err != null)
    {
      res.sendStatus(404);
    }
    else
    {
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.end(data.Body);
      if(nopush) return;
      var client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
      });
      client.connect().then(()=>{
        client.query("SELECT * FROM images WHERE image_id='"+img+"';", (err, res) => {
          if(err==null){
            if (!res.rows[0].push) return;
            var chatID = res.rows[0].chat_id;
            var comment = res.rows[0].comment;
            const trackingData =
              '*Comment:* `' + comment + '`\n' +
              '*IP:* `' + req.headers['x-forwarded-for'] +'`\n' +
              '*User-Agent:* `' + req.headers['user-agent'] + '`\n' +
              '*Referer:* `' + req.headers['referer'] + '`';
            console.log(trackingData);
            request("https://api.telegram.org/bot"+ token +
            "/sendMessage?chat_id=" + chatID +
            "&parse_mode=Markdown" +
            "&text="+ encodeURIComponent(trackingData));
          }        
        });
      });
    }
  }); 
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));