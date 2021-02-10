const { TexasHoldem } = require("poker-odds-calc");

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

function mapToStringValue(card) {
  console.log("card::", card);
  const { rank, suit } = card;

  return rank === '10' ? `T${suit[0]}` : `${rank}${suit[0]}`;
}

const dummyPlayers = [["2d", "3d"]];

function getProbableWinner(tableResult) {
  let winningPercentage = 0;
  let winningHand = [];

  tableResult.getPlayers().forEach((player) => {
    if (player.getWinsPercentage() > winningPercentage) {
      winningPercentage = player.getWinsPercentage();
      winningHand = player.getHand();
    }
  });

  return [winningPercentage, winningHand];
}

function check(gameState) {
  return gameState.current_buy_in - gameState.players[gameState.in_action].bet;
}

function evaluateBoard(gameState) {
  const Table = new TexasHoldem();
  const ourCards = readCards(gameState).map(mapToStringValue);
  console.log("ourCards::", ourCards);
  let otherCards = getOtherPlayersCards(gameState).map((playerCards) =>
    playerCards.map(mapToStringValue)
  );

  console.log("otherCards:;mapped::", otherCards);
  const board = (gameState.community_cards || []).map(mapToStringValue);

  Table.addPlayer(ourCards).setBoard(board);

  otherCards = otherCards.length ? otherCards : dummyPlayers;
  otherCards.forEach((cards) => {
    try {
      Table.addPlayer(cards);
    } catch (e) {
      console.log("e::", e.message);
    }
  });

  let Result = null;

  try {
    Result = Table.calculate();
  } catch (err) {
    console.log("err::", err.message);

    return 0;
  }

  const ourResult = Result.getPlayers()
    .find((player) => player.getHand() === ourCards.join(""))
    .getWinsPercentage();
  console.log("ourResult::", ourResult);
  const [winningPercentage, winningHand] = getProbableWinner(Result);

  const player = getPlayer(gameState);

  if (winningHand === ourCards.join("")) {
    return player.stack;
  }

  if (ourResult >= 50) {
    const minRaise = getMinimumRaiseAmount(gameState);

    return Math.floor(Math.min(player.stack, minRaise / (ourResult / 100)));
  }

  return check(gameState);

  console.log(
    "winningPercentage, winningHand::",
    winningPercentage,
    winningHand
  );

  console.log(Result.getWinner());
  Result.getPlayers().forEach((player) => {
    console.log(
      `${player.getName()} - ${player.getHand()} - Wins: ${player.getWinsPercentageString()} - Ties: ${player.getTiesPercentageString()} ${player.getWinsPercentage()}`
    );
  });

  console.log(`Board: ${Result.getBoard()}`);
  console.log(`Iterations: ${Result.getIterations()}`);
  console.log(`Time takes: ${Result.getTime()}ms`);
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
  console.log("first round community cards::", gameState.community_cards);
  return (
    !gameState.community_cards ||
    (gameState.community_cards && gameState.community_cards.length === 0)
  );
}

function getOtherPlayersCards(gameState) {
  const otherCards = gameState.players
    .filter(
      (player, idx) =>
        idx !== gameState.in_action && (player.hole_cards || []).length
    )
    .map(({ hole_cards }) => hole_cards);

  console.log("otherCards::", otherCards);
  return otherCards;
}

function readCards(gameState) {
  const { hole_cards } = gameState.players[gameState.in_action];

  return hole_cards;
}

function getPlayer(gameState) {
  return gameState.players[gameState.in_action];
}

function getMinimumRaiseAmount(gameState) {
  const player = getPlayer(gameState);
  return gameState.current_buy_in - player.bet + gameState.minimum_raise;
}

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
  const fullHand = [...cards, ...communityCards];

  if (isFirstRound(gameState)) {
    return evalFirstRound(gameState);
  } else {
    try {
      const res = evaluateBoard(gameState);
      return res;
    } catch (error) {
      console.log("error with npm module::", error.message);
      return check(gameState);
    }
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

const Poker = { playHand };

module.exports = Poker;
