'use strict';
var express = require('express');
var request = require ('request');
var bot = require('bot');

const app = express();
const port = process.env.PORT;
const token = process.env.TOKEN;
const chatID = 123;

app.use('/bot', bot)

app.get('/favicon.ico', (req, res) => {
  res.send('');
});

app.post('/:app', (req, res) => {
  const trackingData =
    '*App name:* `' + req.params.app + '`\n' +
    '*IP:* `' + req.headers['x-forwarded-for'] +'`\n' +
    '*User-Agent:* `' + req.headers['user-agent'] + '`\n' +
    '*Referer:* `' + req.headers['referer'] + '`';
    request("https://api.telegram.org/bot"+ token + "/sendDocument").form({})
    res.send('');
});

app.get('/:app', (req, res) => {
  const trackingData =
    '*App name:* `' + req.params.app + '`\n' +
    '*IP:* `' + req.headers['x-forwarded-for'] +'`\n' +
    '*User-Agent:* `' + req.headers['user-agent'] + '`\n' +
    '*Referer:* `' + req.headers['referer'] + '`';
  console.log(trackingData);
  request("https://api.telegram.org/bot"+ token +
  "/sendMessage?chat_id=" + chatID +
  "&parse_mode=Markdown" +
  "&text="+ encodeURIComponent(trackingData));

  if (req.params.app.endsWith(".png"))
    res.sendFile(__dirname+"/zhdun.png")
  else
    res.send('');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));