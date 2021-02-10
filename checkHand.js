function getCardValue(card) {
  switch (card.rank) {
    case "J":
      return 11;
    case "Q":
      return 12;
    case "K":
      return 13;
    case "A":
      return 14;
    default:
      return parseInt(card.rank);
  }
}

function convertToNumber(cards) {
  return cards.map((card) => ({
    rank: getCardValue(card),
    suit: card.suit,
  }));
}

function highCard(cards, communityCards) {}

function sortCards(cards) {
  return cards.sort((a, b) => (getCardValue(a) < getCardValue(b) ? -1 : 1));
}

function isFirstRound(gameState) {
  return (
    !gameState.community_cards ||
    (gameState.communityCards && gameState.communityCards.length === 0)
  );
}

function readCards(gameState) {
  const { hole_cards } = gameState.players[gameState.in_action];

  return hole_cards;
}

function getPlayer(gameState) {
  return gameState.players[gameState.in_action];
}

function getMinimumRaiseAmount(gameState) {}

function evalFirstRound(gameState) {
  const ourCards = readCards(gameState);
  const player = getPlayer(gameState);
  if (havePair(ourCards)) {
    return player.stack;
  }

  if (ourCards.some((card) => getCardValue(card) >= 11)) {
    // current_buy_in - players[in_action][bet] + minimum_raise
    return gameState.current_buy_in - player.bet + gameState.minimum_raise;
  }

  return 0;
}

function playHand(gameState) {
  const [cards, communityCards] = [
    readCards(gameState),
    gameState.community_cards,
  ];
  const fullHand = [...card, ...communityCards];

  if (isFirstRound(gameState)) {
    return evalFirstRound(gameState);
  } else {
    return getPlayer(gameState).stack;
  }

  const havePair = havePair(cards);
  const havePairWithCommunity = havePairWithCommunity(cards, communityCards);
  const isStraight = isStraight(cards, communityCards);
}

function havePair(cards) {
  return cards[0].rank === cards[1].rank;
}

function havePairWithCommunity(cards, communityCards) {
  if (communityCards.some((card) => havePair([card, cards[0]]))) {
    return true;
  }

  if (communityCards.some((card) => havePair([card, cards[1]]))) {
    return true;
  }
  return false;
}

function isStraight(cards, communityCards) {
  cards = convertToNumber(cards);
  communityCards = convertToNumber(communityCards);
  const fullHand = [...cards, ...communityCards];
  const sorted = sortCards(fullHand);

  const numCards = fullHand.length;

  for (let i = 0; i <= numCards - 5; i++) {
    const slice = sorted.slice(i, i + 5);
    console.log(slice);
    const straight = slice.every(({ rank }, idx) =>
      idx === 0 ? true : rank - 1 === slice[idx - 1].rank
    );

    if (straight) {
      const includesOurCards = cards.every((card) =>
        slice.find(({ rank, suit }) => card.rank === rank && card.suit === suit)
      );

      return includesOurCards;
    }
  }

  return false;
}

const cards = [
  { rank: "8", suit: "hearts" },
  { rank: "J", suit: "diamonds" },
];
const communityCards = [
  { rank: "4", suit: "hearts" },
  { rank: "K", suit: "diamonds" },
  { rank: "Q", suit: "diamonds" },
  { rank: "10", suit: "diamonds" },
  { rank: "9", suit: "diamonds" },
];

console.log(isStraight(cards, communityCards));

module.exports = {
  playHand,
};
