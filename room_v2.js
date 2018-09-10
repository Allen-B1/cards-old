const EventEmitter = require("events");
/* Manages players, force starts, and other things */
class Room extends EventEmitter {
	constructor() {
		this.names = {};
		this.starts = new Set();
		this.game = null;
	}

	_ctr = 0;
	new_id() {
		return _ctr++;
	}

	// uid = unique id, indexid is created when game starts
	addPlayer(name) {
		if(this.started)
			return null;

		var uid = this.new_id();
		this.names[uid] = 0;
		
		return uid;
	}

	/* Returns whether the game should start */
	setStart(uid) {
		if(this.started)
			return null;

		this.starts.add(uid);

		return this.nstarted >= this.nstartsRequired;
	}

	/* When start, should set game to something */
	start() {
		this.emit("game_start");
	}

	clear() {
		this.emit("clear");
		this.names = {};
		this.starts.clear();
		this.started = false;
	}

	get nplayers() {
		return Object.keys(this.names).length;
	}

	get started() {
		return this.game !== null;
	}

	get nstarted() {
		return this.starts.size;
	}

	get nstartsRequired() {
		return Math.max(this.nplayers >= 4 ? this.nplayers - 1 : this.nplayers, 2);
	}

	leave(uid) {
		this.emit("player_left", uid);
		delete this.names[uid];
		this.starts.delete(uid);
	}
}
