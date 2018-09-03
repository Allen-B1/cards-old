"use strict";
// Handles players and starts
class Game {
	/* Move.
	 *
	 * player - player index
	 * move - array of cards
	 * move can be null; in which case this is a pass
	 *
	 * Returns: the error as a string or null if none or true if won
	 */
	move(player, move) {
		return null;
	}

	/* Deal cards. To be used internally. Creates this.hands */
	deal() {
		// Create a hand for each player
		this.hands = Array(this.players);
		this.hands.fill(null);
		this.hands.forEach((hand, player) => {
			this.hands[player] = [];
		});

		// Deal out deck
		// TODO: Jokers
		var deck = Cards.createFullDeck();
		Cards.shuffle(deck);
		var player = 0;
		while(deck.length) {
			this.hands[player].push(deck.pop());
			player = (player + 1) % this.players;
		}

		this.turn = 0;
	}

	/* Creates a new game. Players is the number of players */
	constructor(players) {
		this.turn = 0;
		this.players = players;
	}
}

class PresGame extends Game {
	constructor(players) {
		super(players);
		this.stack = [];
		this.mode = null;
		this.winners = [];
		this.deal();
	}

	move(player, move) {
		if(move == null) {
			this.turn = (this.turn + 1) % this.players;
			return null;
		}

		if(this.turn !== player)
			return "Out of turn";

		// If cards are not in hand, return false
		for(let card of move) {
			if(this.hands[player].indexOf(card) === -1) {
				return "Cannot summon cards out of thin air";
			}
		}

		// Remove cards from hand
		for(let card of move) {
			var index = this.hands[player].indexOf(card);
			this.hands[player].splice(index, 1);
		}

		if(PresGame.isValid(move, this.mode, this.stack)) {
			this.stack.push(move);

			if(this.mode === null) {
				this.mode = move.length;
			}

			if(move[0][0] === "2") {
				bomb();
			} else {
				this.turn = (this.turn + 1) % this.players;
			}

			// If no more cards won
			if(this.hands[player].length === 0) {
				this.winners.push(player);
				return true;
			}

			super.move(player, move);
			return null;
		} else {
			return "Bad play";
		}
	}

	bomb() {
		this.mode = null;
		this.stack = [];
	}

	static isValid(move, mode, stack) {
		console.log(stack, move);
		// If wrong number of cards and not bomb, return
		if(move.length !== mode && mode !== null && move[0][0] !== "2")
			return false;

		// Cannot bomb multiple times
		if(move[0][0] === "2" && move.length > 1)
			return false;

		// Check if all the card(s) have the same face value
		for(var i = 1; i < move.length; i++) {
			if(move[i][0] !== move[i - 1][0]) {
				return false;
			}
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
