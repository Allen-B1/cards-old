"use strict";
const EventEmitter = require("events");
/* Manages players, force starts, and other things */
class Room extends EventEmitter {
	constructor() {
		super();
		this.names = {};
		this.starts = new Set();
		this.game = null;
	}

	new_id() {
		this._ctr = this._ctr | 0;
		return this._ctr++;
	}

	// uid = unique id, indexid is created when game starts
	addPlayer(name) {
		if(this.started)
			return null;

		var uid = this.new_id();
		this.names[uid] = name;
		
		return uid;
	}

	/* Returns whether the game should start */
	setStart(uid) {
		if(this.started)
			return null;

		this.starts.add(uid);

		return this.nstarts >= this.nstartsRequired;
	}

	/* When start, should set game to something */
	start() {
		this.emit("game_start");
	}

	// TODO
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

	get nstarts() {
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

module.exports = Room;
