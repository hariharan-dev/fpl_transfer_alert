"use strict";
const axios = require("axios");
const EMAIL = require("./mail");
const MY_PLAYERS_DATA = require("./players");
const PLAYER_DANGER_VALUE = -80;

function findTop8Buys(completePlayersData) {
  console.log("Finding Top 8 Buys....");
  let sortedPlayers = completePlayersData
    .sort((a, b) => a[12] - b[12])
    .reverse();
  sortedPlayers = sortedPlayers.slice(0, 8);
  console.log("---------------");
  console.log("Top 8 Buys");
  console.table(sortedPlayers);
  return sortedPlayers;
}

function findTop5PlayersInPosition(playerPosition, completePlayersData) {
  let filteredPlayers = completePlayersData.filter(
    (player) => playerPosition === player[3]
  );
  filteredPlayers.sort((a, b) => a[12] - b[12]).reverse();
  return filteredPlayers.slice(0, 5);
}

function findUnsafePositions(unsafePlayers) {
  const unsafePositions = new Set();
  unsafePlayers.forEach((player) => unsafePositions.add(player[3]));
  return unsafePositions;
}

function findBestReplacements(unsafePlayers, completePlayersData) {
  let unsafePositions = findUnsafePositions(unsafePlayers);
  let bestReplacementOptions = {};
  unsafePositions.forEach(
    (position) =>
      (bestReplacementOptions[position] = findTop5PlayersInPosition(
        position,
        completePlayersData
      ))
  );
  console.log("---------------");
  console.log("Best Replacement Options");
  console.table(bestReplacementOptions);
  return bestReplacementOptions;
}

function findUnsafePlayers(players) {
  console.log("Finding Unsafe Players...");
  let unsafePlayers = players.filter(
    (player) => player[12] < PLAYER_DANGER_VALUE
  );
  if (unsafePlayers.length) {
    console.log("Unsafe Players");
    console.log("------------------------");
    console.table(unsafePlayers);
    return unsafePlayers;
  }
  console.log("All players are safe.");
  return unsafePlayers;
}

function lastNameMatches(playerA, playerB) {
  return playerA[1].toLowerCase() === playerB.last_name.toLowerCase();
}

function findPlayer(player, completePlayersList) {
  let lastNameMatchingPlayers = completePlayersList.filter((availablePlayer) =>
    lastNameMatches(availablePlayer, player)
  );
  if (lastNameMatchingPlayers.length > 1) {
    lastNameMatchingPlayers = lastNameMatchingPlayers.filter(
      (clubPlayer) => clubPlayer[2] === player.club
    );
  }
  return lastNameMatchingPlayers[0];
}

function findMyPlayers(completePlayersData) {
  console.log("Finding My Players...");
  let myPlayers = [];
  MY_PLAYERS_DATA.forEach((player) =>
    myPlayers.push(findPlayer(player, completePlayersData))
  );
  console.log("------------------------");
  console.table(myPlayers);
  return myPlayers;
}

function getData(reqObj) {
  let name = encodeURIComponent(reqObj.name);
  let value = encodeURIComponent(reqObj.value);
  let reqUrl = `http://www.fplstatistics.co.uk/Home/AjaxPricesEHandler?${name}=${value}`;
  console.log("fetching players data...");
  reqUrl = reqUrl + "&_=" + new Date().getTime();
  axios
    .get(reqUrl)
    .then((response) => {
      console.log("got players data");
      console.log(response.data);
      let completePlayersData = response.data.aaData;
      let myPlayers = findMyPlayers(completePlayersData);
      let unsafePlayers = findUnsafePlayers(myPlayers);
      let bestReplacements;
      if (unsafePlayers.length) {
        bestReplacements = findBestReplacements(
          unsafePlayers,
          completePlayersData
        );
      }
      let top8Buys = findTop8Buys(completePlayersData);
      EMAIL.sendMail(myPlayers, unsafePlayers, top8Buys);
    })
    .catch((err) => {
      console.log("got error while fetching players data");
      console.log(err);
      EMAIL.sendErrorMail(err);
    });
}

console.log("fetching html data");

// TODO:
// document how the scraping works
// document how you are parsing the html input
axios
  .get("http://www.fplstatistics.co.uk/Home/IndexAndroid")
  .then((response) => {
    console.log("got html data");
    // console.log(response)
    var str = response.data;
    var strStartIndex = str.search("aoData.push");
    str = str.slice(strStartIndex + 12, strStartIndex + 500);
    var strEndIndex = str.search("}");
    str = str.slice(0, strEndIndex + 1);
    console.log(str);
    const resultObj = JSON.parse(str);
    console.log("calling players data fetcher fn...");
    getData(resultObj);
  })
  .catch((err) => {
    console.log("got error while fetching html data");
    console.log(err);
  });
