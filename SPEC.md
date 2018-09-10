# socketio events
## Receive: `player_uid`
```js
socket.on("player_uid", function(uid) {
	...
});
```
Sent by the server after the client sends `player_join`. `uid` is the player's unqiue id.

## Recieve: `player_join`
```js
socket.on("player_join", function(uid, name) {
	...
})
```

Sent by the server when a player joins.

## Recieve: `set_start`
```js
socket.on("player_join", function(data) {
	let nstarted = data[0];
	let nrequired = data[1];
	...
});
```
Sent by the server when a player sets start. `data[0]` is the number of people who have force started. `data[1]` is the number of people that is required. If `data[0] >= data[1]` then the game will have started, and the `game_start` event will be emitted shortly.

## Recieve: `game_start`
```js
socket.on("game_start", function(uids, hands) {
	// where uid is the player's uid
	const playerIndex = uids.indexOf(uid);
	const hand = hands[playerIndex];
	...
})
```
Sent by the server when the game starts. `uids` is an array of the uids in the game.

`hands` is an array that contains, for each player except for the one represented by `playerIndex`, an array of `null`s with the length of the number of cards.

## Recieve: `game_move`
```js
socket.on("game_move", function(playerIndex, move) {
	...
});
```
Sent by the server when a player has made a move.

## Send: `game_move`
```js
socket.emit("game_move", move);
```
Make a move.

## Recieve: `game_error`
```js
socket.on("game_error", function(error) {

});
```
Sent by the server when the player has made an error. (e.g. Bad play, Out of turn)
