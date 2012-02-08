var config = require('./config.js');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var port =  process.env.PORT || config.port || 3000;
var hamljs = require('hamljs');

var chats = {};

io.configure(function () {
    io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
    io.set("polling duration", 10);
});

//io.sockets.on('connection', default_socket );

var default_socket = function( socket ){
    console.log('Connection!');

    var message = hamljs.render('.message User connected');
    socket.emit('join', message );
    socket.broadcast.emit('join', message );

    socket.on('post', function( data ) {
        if(!data){return;}
        var nickname = socket.id;
        socket.get( 'nickname' , function (err, name) {
            if(name){ nickname = name; }
        });
        if ( !nickname) {
            return; // don't handle posts if no nickname and chatroom are defined
        }
        var message = nickname + " : " + data;
        message = hamljs.render('.message ' + message );
        socket.emit('message', message); // Send message to sender
        socket.broadcast.emit('message', message ); // Send message to everyone BUT sender
    });

    socket.on('disconnect', function() {
        var message = hamljs.render('.message User disconnected');
        socket.broadcast.emit('part', message );
    });

    socket.on('set nickname', function (name) {
        console.log("Set nickname %s for socket with id %s", name, socket.id );
        socket.set('nickname', name, function () { socket.emit('message', "changed nickname to " + name); });
    });

};

// haml
app.register('.haml', hamljs );
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.get('/chat/:id', function(req, res){
    var chatroom = req.params.id;
    res.render('chat.haml', {
        title: config.title + " - " + chatroom
    } );
    if (!chats[chatroom]){
        
        start_chatroom( chatroom );
    }
});

function start_chatroom( id ){
    var chat = io.of('/chat/' + id).on('connection', default_socket );
    chats[id] = chat;
}


// log config
app.configure('development', function() {
    io.set('log level', 5);
    app.use(express.errorHandler({
        dumpExceptions : true,
        showStack : true
    }));
});

app.configure('production', function() {
    io.set('log level', 1);
    app.use(express.errorHandler());
});

app.listen(port);
console.log("Express server listening on port %d in %s mode",
        app.address().port, app.settings.env);
