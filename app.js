var config = require('./config.js');
var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var port =  process.env.PORT || config.port || 3000;


var wrapper = require('bigode.js').handlebars();

var chats = {};

io.configure(function () {
    io.set('transports', ['websocket', 'xhr-polling']);
    io.set("polling duration", 10);
});

var default_socket = function( socket ){
    console.log('Connection!');

    var chat = socket.namespace.name.split('/',3).pop();
    socket.set('chatroom', chat);

    load_backlog( chat, socket );

    var message = 'User connected';
    log_message( 'join', message, chat, socket);

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
        log_message( 'message', message, chat, socket);
    });

    socket.on('disconnect', function() {
        var message = 'User disconnected';
        log_message( 'part', message, chat, socket);

    });

    socket.on('set nickname', function (name) {
        console.log("Set nickname %s for socket with id %s", name, socket.id );
        socket.set('nickname', name, function () { socket.emit('message', "changed nickname to " + name); });
    });

};

function log_message(type, message, chat, socket){
    chats[chat]['log'].push( [type, message] );
    socket.emit(type, message );
    socket.broadcast.emit(type, message );
    emitter.emit(type, message);
}

function load_backlog( chat, socket ){
    var log = chats[chat]['log'];
    console.log("backlog ", chat, log);
    for (m in log){
        x = log[m];
        socket.emit(x[0],x[1]);
    }
};
    


emitter.addListener('post', function(data){
    

});

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.register('.hbs', wrapper);   // <<<-- using wrapper to process .hbs files
});

app.get('/chat/:id', function(req, res){
    var chatroom = req.params.id;
    res.render('chat.hbs', {
        title: config.title + " - " + chatroom
    } );
    if (!chats[chatroom]){
        start_chatroom( chatroom );
    }
});

function start_chatroom( id ){
    var chat = io.of('/chat/' + id).on('connection', default_socket );
    chats[id] = { 
        chat: chat,
        log: [] };
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
