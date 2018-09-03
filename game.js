"use strict";
// Handles players and starts
class Game {
	get playerNames() {
		return this._players;
	}
	addPlayer(playerName) {
		if(!this.started) {
			this._players.push(player);
			// Return index of player
			return this.playerNames.length - 1;
		} else {
			throw "game has started";
		}
	}
	/* Number of players */
	get players() {
		return this._players.length;
	}

	/* Whether the game has started */
	get started() {
		return this._started;
	}
	
	/* Start the game */
	start() {
		this._started = true;
	}

	/* Get whose turn it is (as an index) */
	get turn() {
		return this._turn;
	}

	// protected
	set turn(val) {
		this._turn = val;
	}

	/* Move. Returns true if valid, false if not */
	move(player, move) {
		return true;
	}

	constructor() {
		this._started = false;
		this._turn = 0;
		this._players = [];
	}
}

class PresGame extends Game {
	constructor() {
		super();
		this.stack = [];
		this.mode = null;
		this.playerHands = [];
	}
	/* Move.
	 *
	 * player - player index
	 * move - array of cards
	 * move can be null; in which case this is a pass
	 */
	move(player, move) {
		if(this.mode === null) {
			this.mode = move.length;
		}

		if(this.turn == player) {
			this.turn = (this.turn + 1) % this.players;
			this.stack.push(move);
			super.move(player, move);
			return true;
		} else {
			return false;
		}
	}
	static isValid(move, mode, stack) {
		// If wrong number of cards, return
		if(move.length !== mode)
			return false;
		// Check if all the card(s) have the same face value
		for(var i = 1; i < move.length; i++) {
			if(move[i][0] !== move[i - 1][0]) {
				return false;
			}
		}
		// Check if card(s) are greater than previous card(s)
		if(move[0] < stack[stack.length - 1]) {
			return false;
		}
		return true;
	}
	start() {
		// Create a hand for each player
		this.playerHands = [].repeat(this.players);

		// Deal out deck
		var deck = Cards.createFullDeckJokers();
		Cards.shuffle(deck);
		while(deck.length) {
			var player = 0;
			this.playerHands[player].push(deck.pop());
			player = (player + 1) % this.players;
		}
		super.start();
	}

}

const Cards = {
	VALS: [2,3,4,5,6,7,8,9,10,"J","Q","K","A"],
	// create a full deck, excluding jokers
	createFullDeck: function() {
		var deck = [];
		for(val of VALS) {
			for(suit in [1,2,3,4]) {
				deck.append(this.createCard(val, suit));
			}
		}
		return deck;
	},
	// create a full deck with jokers
	createFullDeckJokers: function() {
		// full deck + 2 jokers
		return this.createFullDeck().concat(["*", "*"]);
	},
	/* create a card
	 *
	 * val can be any number from 1-10, or "J", "Q", "K", "A" or "*" (jokers) */
	createCard: function(val, suit) {
		// If it's a joker, no suit
		if(val === "*")	
			return val;
		// 1 = A
		if(val === 1)
			val = "A";
		return String(val) + suit;
	},
	shuffle: function(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}
};

const Suit = {
	NONE: 0,
	SPADES: 1,
	CLUBS: 2,
	HEARTS: 3,
	DIAMONDS: 4
}
