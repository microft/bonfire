

var config = require('./config.js');
var express = require('express');

var app = express.createServer();
var io = require('socket.io').listen(app);


var port =  process.env.PORT || config.port || 3000;
