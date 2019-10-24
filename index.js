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
const chatID = 123;

app.use('/bot', bot)

app.get('/favicon.ico', (req, res) => {
  res.send('');
});

app.get('/:img', (req, res) => {
  S3.getObject({Bucket: bucket, Key: req.params.img}).on("httpHeaders",(code,headers,resp, message) =>{
    res.status.code(code).headers(headers)})
    .on("httpData",(chunk) => {res.send(chunk)})
    .on("complete",(resp) =>{
      console.log("Done!");
    })
  var client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  // const trackingData =
  //   '*App name:* `' + req.params.app + '`\n' +
  //   '*IP:* `' + req.headers['x-forwarded-for'] +'`\n' +
  //   '*User-Agent:* `' + req.headers['user-agent'] + '`\n' +
  //   '*Referer:* `' + req.headers['referer'] + '`';
  // console.log(trackingData);
  // request("https://api.telegram.org/bot"+ token +
  // "/sendMessage?chat_id=" + chatID +
  // "&parse_mode=Markdown" +
  // "&text="+ encodeURIComponent(trackingData));

  // if (req.params.app.endsWith(".png"))
  //   res.sendFile(__dirname+"/zhdun.png")
  // else
  //   res.send('');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));