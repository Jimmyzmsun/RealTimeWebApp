var express = require('express');
var bodyParse = require('body-parser');
var morgan = require('morgan');
//config information in config.js, if in parent folder ('../config')
var config = require('./config');
var mongoose =require('mongoose');
//1.connect express
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

//connect database
mongoose.connect(config.database,function(err){
    if(err){
        console.log(err);
    }else{
        console.log('connected to the database');
    }
})

//true can put image, string and other, false means string
app.use(bodyParse.urlencoded({extended:true}))
app.use(bodyParse.json());

app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));

var api = require('./app/routes/api')(app,express,io);// from module.exports = function(app,express){}
app.use('/api',api); // /api is prefix of the routes/api

//* get any router
app.get('*', function(req,res){
    res.sendFile(__dirname +'/public/app/views/index.html');
})

http.listen(config.port, function(err){
        if(err){
        console.log(err);
    }else{
        console.log("listening on port 3000");
    }
});
