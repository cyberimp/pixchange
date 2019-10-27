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

app.use('/bot', bot);
app.use('/img', express.static('img'));
app.set('view engine', 'pug');

app.get('/favicon.ico', (req, res) => {
  res.sendFile(__dirname+'/favicon.png');
});

app.get('/', (req, res) => {
  var client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });
  client.connect().then(()=>{
    client.query("SELECT COUNT (DISTINCT chat_id) FROM images;", (err, result) => {
      var clientCount = err?"lots":result.rows[0].count;
      res.render("index",{title: "Pixchange Bot: bot for exchanging images", clients: clientCount});
    })
  }).catch((err) => console.log(err));
})

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
            var messageID = res.rows[0].message_id;
            const trackingData =
              '*IP:* `' + req.headers['x-forwarded-for'] +'`\n' +
              '*User-Agent:* `' + req.headers['user-agent'] + '`\n' +
              '*Referer:* `' + req.headers['referer'] + '`';
            console.log(trackingData);
            request("https://api.telegram.org/bot"+ token +
            "/sendMessage?chat_id=" + chatID +
            "&parse_mode=Markdown" +
            "&reply_to_message_id=" + messageID +
            "&text="+ encodeURIComponent(trackingData));
          }        
        });
      });
    }
  }); 
});

app.listen(port, () => console.log(`Bot listening on port ${port}!`));