const express = require('express');
const app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const port = 4000;

const firebase = require('./firebase-config');

//socket variables
//username
//gid(game id)
//roomcode
//credentials(the user)



server.listen(4000, () => {
	console.log('Listening on port 4000');
});


io.on('connection', (socket) => {
	console.log('Successful connection');

	socket.on('set room', (roomcode) => {
		// Make sure room code is in correct format
		var rc = roomcode.toUpperCase();
		// Store it
		socket.roomcode = rc;
		console.log('Room code is %s', socket.roomcode);

		if(socket.username && socket.roomCode){
			console.log('that ran');
			socket.gid = connectFn();
		}
	});

	socket.on('set username', (username) => {
		socket.username = username;
		console.log('Displayname  set to %s', socket.username);

	});

	socket.on('move', (direction) => {
		switch(direction) {
			case 'up':
				sendMove(arrows[0]);
				break;
			case 'upRight':
				sendMove(arrows[1]);
				break;
			case 'right':
				sendMove(arrows[2]);
				break;
			case 'downRight':
				sendMove(arrows[3]);
				break;
			case 'down':
				sendMove(arrows[4]);
				break;
			case 'downLeft':
				sendMove(arrows[5]);
				break;
			case 'left':
				sendMove(arrows[6]);
				break;
			case 'upLeft':
				sendMove(arrows[7]);
				break;

		}  //end switch
	}); //end send move

	socket.gid = connectFn();



	//Util functions
	async function connectFn() {

		
		while(!(socket.username && socket.roomcode)){
		 	console.log('Not set yet.')
		 	await sleep(1000);
		}

		socket.credentials = await loginAnonymously();
		console.log(socket.credentials);
		joinRoom(socket.credentials, socket.username, socket.roomcode);
	}

	function sendMove(element){
		let requestedMove = {};
        requestedMove.x = element.x;
		requestedMove.y = element.y*-1;
		if(socket.credentials && socket.roomcode){
			sendMoveToFirebase(socket.credentials, socket.roomcode, requestedMove)
		}

	}
}); //End of io.on

io.on('disconnect', (socket) => {
	console.log('Client disconnected');
});


const joinRoom = (authState, displayName, roomCode) => {firebase.database().ref('games').orderByChild('code').equalTo(roomCode).on("value", (snapshot) => {
	let id
	if(snapshot && snapshot.val()){
		snapshot.forEach(function(data) {
			id = data.key
		})

		firebase.database().ref('games/' + id + '/connected_players/' + authState.uid).set({name: displayName})
		return id
	}
})
};

const sendMoveToFirebase = (authState, roomCode, requestedMove) => {
	firebase.database().ref('games').orderByChild('code').equalTo(roomCode).limitToFirst(1).once('value', data => {
        const gameId = Object.keys(data.val())[0]
        if (data.val()[gameId].player_state && data.val()[gameId].player_state[authState.uid] && data.val()[gameId].player_state[authState.uid].current_position) {
            const state = data.val()[gameId].player_state[authState.uid]
            requestedMove.x += state.current_position.x
            requestedMove.y += state.current_position.y
        }

        firebase.database().ref('games/' + gameId + '/player_state/' + authState.uid + '/requested_position').set(requestedMove)
    })
}

const loginAnonymously =  () => firebase.auth().signInAnonymously();


arrows = [
	{angle: -90, direction: 'up', x: 0, y: 1}, //0
	{angle: -45, direction: 'upRight', x: 1, y: 1}, //1
	{angle: 0, direction: 'right', x: 1, y: 0}, //2
	{angle: -315, direction: 'downRight', x: 1, y: -1}, //3
	{angle: -270, direction: 'down', x: 0, y: -1}, //4
	{angle: -225, direction: 'downLeft', x: -1, y: -1}, //5
	{angle: -180, direction: 'left', x: -1, y: 0}, //6
	{angle: -135, direction: 'upLeft', x: -1, y: 1}, //7

]


//For waiting for variables to be set

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms), reject => setTimeout(reject, ms));
}


