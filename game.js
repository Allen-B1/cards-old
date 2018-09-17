"use strict";
// Handles players and starts
class Game {
	/* Move.
	 *
	 * player - player index
	 * move - array of cards
	 * move can be null; in which case this is a pass
	 *
	 * Returns: true if won null otherwise
	 */
	/*abstract*/ move(player, move) {
		return null;
	}

	/* Remove a player */
	/*abstract*/ remove(player) {
		return null;
	}

	/* Deal cards. To be used internally. Creates this.hands */
	deal() {
		// Create a hand for each player
		this.hands = {};
		for(let uid in this.players) {
			this.hands[uid] = [];
		}

		// Deal out deck
		// TODO: Jokers
		var deck = Cards.createFullDeck();
		Cards.shuffle(deck);

		var index = 0;
		while(deck.length) {
			this.hands[this.players[index]].push(deck.pop());
			index = (index + 1) % this.nplayers;
		}
	}

	/* Creates a new game.*/
	constructor(uids) {
		this.players = uids;
	}

	/* Return number of players left in the game */
	get nplayers() {
		return this.players.length;
	}
}

class PresGame extends Game {
	constructor(uids) {
		super(uids);
		this.turn = uids[0]; // whose turn it is

		this.stack = []; // current stack of cards
		this.mode = null; // # of cards (e.g. singles, doubles, triples)
		this.passes = new Set(); // # of passes

		this.deal();
	}

	moveTurn(nturns) {
		this.turn = this.players[(this.players.indexOf(this.turn) + nturns) % this.players.length];
	}

	move(player, move) {
		if(this.turn !== player)
			throw "Out of turn";

		// Deal with passes
		if(move == null) {
			this.passes.add(player);
			// If everyone passes, bomb
			if(this.passes.size >= this.nplayers) {
				this.bomb();
			} else { // Otherwise go to next player
				this.moveTurn(1);
			}
			return null;
		}
		// If not a pass clear passes
		this.passes.clear();

		// If cards are not in hand
		for(let card of move) {
			if(this.hands[player].indexOf(card) === -1) {
				throw "Cannot summon cards out of thin air";
			}
		}

		if(PresGame.isValid(move, this.mode, this.stack)) {
			this.stack.push(move);

			if(this.mode === null) {
				this.mode = move.length;
			}

			// bombs bomb
			if(move[0][0] === "2") {
				this.bomb();
			} else { // otherwise go to next player // TODO: Add skip
				this.moveTurn(1);
			}

			// Remove cards from hand
			for(let card of move) {
				var index = this.hands[player].indexOf(card);
				this.hands[player].splice(index, 1);
			}

			// If no more cards won
			if(this.hands[player].length === 0) {
				this.remove(player);
				return true;
			}

			super.move(player, move);
			return null;
		} else {
			throw "Bad play";
		}
	}

	remove(player) {
		let index = this.players.indexOf(player);
		if(index >= 0)
			this.players.splice(index, 1);
		return super.remove(player);
	}

	bomb() {
		this.passes.clear();
		this.mode = null;
		this.stack = [];
	}

	static isValid(move, mode, stack) {
		// If wrong number of cards and not bomb, return
		if(move.length !== mode && mode !== null && move[0][0] !== "2")
			return false;

		// Check if all the card(s) have the same face value
		for(var i = 1; i < move.length; i++) {
			if(move[i][0] !== move[i - 1][0]) {
				return false;
			}
		}

		// Bombs
		if(move[0][0] === "2") {
			// Return true if one and only one bomb
			return move.length === 1;
		}

		// Check if card(s) are greater/equal than previous card(s)
		if(stack.length !== 0 && Cards.compare(move[0], stack[stack.length - 1][0]) < 0) {
			return false;
		}
		return true;
	}
}

const Cards = {
	VALS: [2,3,4,5,6,7,8,9,10,"J","Q","K","A"],
	// create a full deck, excluding jokers
	createFullDeck: function() {
		var deck = [];
		for(let val of this.VALS) {
			for(let suitname in Suit) {
				let suit = Suit[suitname];
				deck.push(this.createCard(val, suit));
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
		var j, x, i;
		for (i = a.length - 1; i > 0; i--) {
		    j = Math.floor(Math.random() * (i + 1));
		    x = a[i];
		    a[i] = a[j];
		    a[j] = x;
		}
		return a;
	},
	compare: function(a, b) {
		var valA = a.slice(0, -1);
		var valB = b.slice(0, -1);
		var key = {
			2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,"J":11,"Q":12,"K":13,"A":14};
		return key[valA] - key[valB];
	}
};

const Suit = {
	SPADES: "S",
	CLUBS: "C",
	HEARTS: "H",
	DIAMONDS: "D"
};

module.exports = {Suit: Suit, Cards:Cards, Game:Game, PresGame:PresGame};
