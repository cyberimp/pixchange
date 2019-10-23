'use strict';
var express = require('express');
var request = require ('request');

var router = express.Router();

const token = process.env.TOKEN;

router.get('/', function(req, res){
    res.status(200).send(process.env);
})

router.post('/' + token, function(req,res){

});

module.exports(router);