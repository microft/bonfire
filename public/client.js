var socket = io.connect(window.location.pathname);

socket.on( 'join', function( data ) {
    $('#conversation').append( data );
});

socket.on( 'part', function( data ) {
    $('#conversation').append( data );
});

socket.on( 'message', function( data ) {
    $('#conversation').append(data);
});


function post(msg){
    socket.emit('post', msg);
}

function nick( name ){
    socket.emit('set nickname', name);
}
