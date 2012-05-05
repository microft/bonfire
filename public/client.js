var socket = io.connect(window.location.pathname);

socket.on( 'join', function( data ) {
    newMessage(data);
});

socket.on( 'part', function( data ) {
    newMessage(data);
});

socket.on( 'message', function( data ) {
    newMessage(data);
});

function newMessage( message ) {
    $('#conversation').append('<div class="message">' + message + '</div>');
}

function post(msg){
    socket.emit('post', msg);
}

function nick( name ){
    socket.emit('set nickname', name);
}
