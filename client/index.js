var controller = require('./controller');
var io = require('socket.io-client');
var uuid = require('uuid');
var socket = null;
var renderer = require('./renderer');
var jq = require('jquery');

var options = {
    transports: ['websocket'],
    'force new connection': true,
};  

/*
jq(document).on('keypress',function(event){
   event.preventDefault();
});*/
var mapId = 1;
var prevMapId = 0;
var characterId = uuid.v4();
function joinMap() {
    jq.ajax({
        method: 'GET',
        data: { id: mapId, from: prevMapId },
        dataType: 'jsonp',
        url: 'http://maps.rabbits:8000/mapInstanceUrl'
    }).done(function (result) {
        console.log('logueado ',result);
        var url = result.url
        var type = 'anonymous';
        socket = io(url,options);

        socket.on('snapshot', renderer.start);
        socket.on('characterUpdate', function (msg) {
            console.log('piece update',msg);
            if ( msg.result === 'warp') {
                prevMapId = mapId;
                mapId = msg.destination;
                renderer.stop();
                socket.disconnect();
                controller.detach();
                joinMap();
            } else renderer.update(msg);
        });
        socket.on('rmCharacter', function(msg) {
            renderer.removeCharacter(msg.id);
        });
        controller.attach(socket,characterId,controller.actions);
        renderer.attach(characterId);
        socket.emit('join',{character:characterId,type:type});
    });
}

joinMap();

