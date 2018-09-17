"use strict";
const EventEmitter = require("events");
/* Room
 *
 * Manages players, leaving, starts, and winnners
 */
class Room extends EventEmitter {
	constructor() {
		super();
		this.starts = new Set();
		this.clear();
	}

	clear() {
		this.emit("clear");
		this.names = {};
		this.starts.clear();
		this.game = null;
		this.winners = [];
	}

	new_id() {
		this._ctr = this._ctr | 0;
		return String(this._ctr++);
	}

	/* --- Players --- */

	/* Add player. Returns its id */
	addPlayer(name) {
		if(this.started)
			return null;

		var uid = this.new_id();
		this.names[uid] = name;
	
		return uid;
	}

	/* Remove a player */
	leave(uid) {
		this.emit("player_left", uid);

		delete this.names[uid];
		this.starts.delete(uid);

		if(this.game) {
			this.game.remove(uid);
		}
	}


	get nplayers() {
		return Object.keys(this.names).length;
	}

	/* --- STARTS --- */
	/* Returns whether the game should start */
	setStart(uid) {
		if(this.started)
			return null;

		this.starts.add(uid);

		return this.nstarts >= this.nstartsRequired;
	}

	get nstarts() {
		return this.starts.size;
	}

	get nstartsRequired() {
		return Math.max(this.nplayers >= 4 ? this.nplayers - 1 : this.nplayers, 2);
	}


	/* When start, should set game to something */
	start() {
		this.emit("game_start");
	}

	get started() {
		return this.game !== null;
	}

	/* --- GAMES --- */
	move(player, move) {
		if(this.game) {
			if(this.game.move(player, move)) {
				this.winners.push(player);
				delete this.names[player];
				return true;
			}
			return false;
		}
	}

	get gameHands() {
		return this.game.hands;
	}
}

module.exports = Room;
