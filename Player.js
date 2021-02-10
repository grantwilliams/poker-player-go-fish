const Poker = require('./checkHand');

class Player {
  static get VERSION() {
    return "0.1";
  }

  static get name() {
    return 'Go Fish'
  }

  static betRequest(gameState, bet) {
    // bet(0);
    const { current_buy_in, in_action, players } = gameState;

    const betAmount = current_buy_in - players[in_action].bet;
    bet(Poker.playHand(gameState));
  }

  static showdown(gameState) {}

  readCards(gameState) {
    const { hole_cards } = gameState.players[gameState.in_action];

    return hole_cards;
  }

  communityCards(gameState) {
    const { community_cards } = gameState;

    return community_cards;
  }
}

module.exports = Player;
