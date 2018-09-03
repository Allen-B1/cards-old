"use strict";
// Handles players and starts
class Game {
	/* Move. Returns true if valid, false if not */
	move(player, move) {
		return true;
	}

	/* Called when starting */
	deal() {}

	constructor(players) {
		this.turn = 0;
		this.playerNames = players;
		this.deal();
	}
}

class PresGame extends Game {
	constructor(players) {
		super(players);
		this.stack = [];
		this.mode = null;
		this.hands = [];
	}
	/* Move.
	 *
	 * player - player index
	 * move - array of cards
	 * move can be null; in which case this is a pass
	 */
	move(player, move) {
		if(!this.started)
			return false;

		if(this.move == null) {
			this.turn = (this.turn + 1) % this.playerNames.length;
			return true;
		}

		if(this.mode === null) {
			this.mode = move.length;
		}
		// If cards are not in hand, return false
		for(let card of move) {
			if(!this.hands[player].includes(card)) {
				return false;
			}
		}
		// Remove cards from hand
		for(let card of move) {
			var index = this.hands[player].indexOf(card)
			this.hands[player].splice(index, 1);
		}

		if(this.turn == player && isValid(move, this.mode, this.stack)) {
			this.turn = (this.turn + 1) % this.playerNames.length;
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
	deal() {
		// Create a hand for each player
		this.hands = [].repeat(this.playerNames.length);

		// Deal out deck
		// TODO: Jokers
		var deck = Cards.createFullDeck();
		Cards.shuffle(deck);
		while(deck.length) {
			var player = 0;
			this.hands[player].push(deck.pop());
			player = (player + 1) % this.players;
		}

		this.turn = 0;
		super.deal();
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
		var j, x, i;
		for (i = a.length - 1; i > 0; i--) {
		    j = Math.floor(Math.random() * (i + 1));
		    x = a[i];
		    a[i] = a[j];
		    a[j] = x;
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
