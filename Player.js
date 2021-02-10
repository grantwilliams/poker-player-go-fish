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
    bet(betAmount > 50 ? 0 : betAmount);
  }

  static showdown(gameState) {}

  static readCards(gameState) {
    const { hole_cards } = gameState.players.find(
      ({ name }) => name
    );

    return hole_cards;
  }
}

module.exports = Player;
