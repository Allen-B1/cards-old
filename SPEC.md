# Docs
## Send: `player_join`
```js
socket.emit("player_join", name, roomId);
```
Join a room.

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


## Recieve: `player_left`
```js
socket.on("player_left", function(uid) {
	...
});
```
Sent by the server when a player leaves.

## Recieve: `join_error`
```js
socket.on("join_error", function(msg) {

});
```
Sent by the server when an error occurs while joining (e.g. the game already started).

## Send: `set_start`
```js
socket.on("start", function() {

});
```

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
socket.on("game_start", function(names, hands) {
	// where uid is the player's uid
	const hand = hands[uid];
	...
})
```
Sent by the server when the game starts.

`hands` is an array that contains all of the game's hands. If the player is not allowed to see another person's hand, all of the cards in that hand will be replaced with `null`.

`names` is a map of all the names.

## Recieve: `game_move`
```js
socket.on("game_move", function(uid, move) {
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
	...
});
```
Sent by the server when the player has made an error. (e.g. Bad play, Out of turn)

## Recieve: `game_win`
```js
socket.on("game_win", function(uid) {

});
```
Sent by the server when a player "wins".

## Recieve `game_end`
```js
socket.on("game_end", function() {
	...
});
```
Send by the server when the game ends.

## Send: `chat`
```js
socket.emit("chat", msg);
```
Send a message.

## Recieve: `chat`
```js
socket.on("chat", function(msg, uid) {
	...
});
```
Sent by the server when a chat message is sent.
