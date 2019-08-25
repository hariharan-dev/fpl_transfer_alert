'use strict';
const axios = require('axios');
const EMAIL = require('./mail');
const MY_PLAYERS = require('./players');
const PLAYER_DANGER_VALUE = -80;

/**
 *  [
            "",(0)(unknown)
            "Mustafi",(1)(name)
            "Arsenal",(2)(team)
            "D",(3)(position)
            "A",(4)(status)
            "0.5",(5)(owned)
            "5.4",(6)
            "£5.4m",(7)(price)
            "0",(8)()
            "---",(9)
            "2525",(10)
            "-33.3",(11)
            "-33.3",(12)(target)
            "-2",(13)
            "-2",(14)
            "Mustafi",(15)
            "Spurs(H) Watford(A) Aston Villa(H) Man Utd(A) "(16)(opp teams)
    ]
 * @param {*} unsafePlayers
 */

function sendMail(unsafePlayers) {
  let msg = '';
  unsafePlayers.forEach(
    player =>
      (msg += `${player[1]} - ${player[2]}, ${player[12]}, Buffer: ${
        player[10]
      }\n`)
  );
  console.log('Calling Mail Fn');
  EMAIL.sendMail(msg);
}

function isUnSafePlayer(player) {
  return player[12] < PLAYER_DANGER_VALUE;
}

function findUnsafePlayers(players) {
  let unsafePlayers = players.filter(player => isUnSafePlayer(player));
  if (unsafePlayers.length) {
    console.log('Unsafe Players');
    console.log('------------------------');
    console.table(unsafePlayers);
    sendMail(unsafePlayers);
    return;
  }
  console.log('All players are safe.');
}

function lastNameMatches(playerA, playerB) {
  return playerA[1].toLowerCase() === playerB.second_name.toLowerCase();
}

function findPlayer(player, completePlayersList) {
  return completePlayersList.filter(availablePlayer =>
    lastNameMatches(availablePlayer, player)
  );
}

function findMyPlayers(completePlayersData) {
  console.log('Filtering Players...');
  let filteredPlayers = [];
  MY_PLAYERS.forEach(function(player) {
    let playersFound = findPlayer(player, completePlayersData);
    if (playersFound.length) {
      playersFound.forEach(player => filteredPlayers.push(player));
    }
  });
  console.log('My Players');
  console.log('------------------------');
  console.table(filteredPlayers);
  console.log('Finding Unsafe Players...');
  findUnsafePlayers(filteredPlayers);
}

function getData(iselRowValue) {
  console.log('fetching players data...');
  axios
    .get(
      'http://www.fplstatistics.co.uk/Home/AjaxPricesEHandler?iselRow= ' +
        iselRowValue +
        '&_=' +
        new Date().getTime()
    )
    .then(response => {
      console.log('got players data');
      findMyPlayers(response.data.aaData);
    })
    .catch(err => {
      console.log('got error while fetching players data');
      console.log(err);
    });
}

console.log('fetching html data');

axios
  .get('http://www.fplstatistics.co.uk/Home/IndexAndroid2')
  .then(response => {
    console.log('got html data');
    var str = response.data;
    var strStartIndex = str.search('{ "name": "iselRow"');
    str = str.slice(strStartIndex, strStartIndex + 50);
    var strEndIndex = str.search('}');
    str = str.slice(0, strEndIndex + 1);
    const resultObj = JSON.parse(str);
    console.log('calling players data fetcher fn...');
    getData(resultObj.value);
  })
  .catch(err => {
    console.log('got error while fetching html data');
    console.log(err);
  });
