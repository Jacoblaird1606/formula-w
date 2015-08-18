/* 
 * Copyright 2015 Phillip Hayward <phil@pjhayward.net>.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

module.exports.bind = _bind;
module.exports.setPlayers = function (players) {
	_players = players;
}
module.exports.setIO = function (io) {
	_io = io;
}

var _games = [];
var _players;
var _io;
var _playerGames = {};

function _bind(socket) {
	socket.on('queryList', function () {
		console.log("retrieving list of games");
		socket.emit('gameList', _getList());
	});

	socket.on('newGame', function () {
		if (socket.userId) {
			var game;
			if (!_playerGames[socket.userId]) {
				game = _create(socket.userId);
				_playerGames[socket.userId] = game.id;
			} else {
				game = _findGame(_playerGames[socket.userId]);
			}
			if (game) {
				socket.emit('currentGame', game);
				socket.join(game.id);
			}
		}
		_io.emit("gameList", _getList());
	});

	socket.on('join', function (gameId) {
		if (socket.userId) {
			if (_playerGames[socket.userId]) {
				socket.leave(_playerGames[socket.userId]);
				_removeFromGame(_playerGames[socket.userId], socket.userId);
			}
			_playerGames[socket.userId] = gameId;
			socket.join(gameId);
			_joinGame(gameId, socket.userId);
		}
	});

	socket.on('userReady', function () {
		if (socket.userId && _playerGames[socket.userId]) {
			var game = _findGame(_playerGames[socket.userId]);
			if (game) {
				var playerIndex = _findPlayerIndex(game, socket.userId);
				if (playerIndex >= 0) {
					game.players[playerIndex].ready = 'Ready';
				} else {
					_playerGames[socket.userId] = null;
				}
				socket.join(game.id);
				_io.to(game.id).emit('currentGame', game);
			}
		}
	});


	socket.on('leave', function (gameId) {
		socket.leave(gameId);
		if (socket.userId) {
			_playerGames[socket.userId] = null;
			_removeFromGame(gameId, socket.userId);
		}
	});

	socket.on('kick', function (message) {
		_playerGames[message.userId] = null;
		_removeFromGame(message.gameId, message.userId);
	});

	socket.on('ban', function (message) {
		_playerGames[message.userId] = null;
		_banFromGame(message.gameId, message.userId);
	});

	socket.on('startGame', function () {
		if (socket.userId && _playerGames[socket.userId]) {
			var game = _findGame(_playerGames[socket.userId]);
			if (game) {
				game.running = true;
				_io.to(game.id).emit('startGame');
			}
		}
	});
}

function _create(hostUserId) {
	var time = Date.now();
	var game = {
		map: 'Monaco',
		players: [{id: hostUserId, name: _players.lookup(hostUserId), ready: 'Not Ready'}],
		banned: [],
		maxPlayers: 10,
		running: false,
		id: hostUserId + time
	};
	_games.push(game);
	return game;
}

function _getList() {
	return _games;
}

function _findGame(gameId) {
	var index = _findGameIndex(gameId);
	if (index !== null)
		return _games[index];
	return null;
}

function _findGameIndex(gameId) {
	for (var i = 0; i < _games.length; i++) {
		if (_games[i].id === gameId)
			return i;
	}
	return null;
}

function _findPlayerIndex(game, userId) {
	for (var i = 0; i < game.players.length; i++) {
		if (game.players[i].id === userId)
			return i;
	}
	return -1;
}

function _joinGame(gameId, userId) {
	var gameIndex = _findGameIndex(gameId);
	if (gameIndex !== null) {
		var game = _games[gameIndex];
		var playerIndex = _findPlayerIndex(game, userId);
		if (playerIndex < 0 && game.banned.indexOf(userId) < 0)
		{
			var playerName = _players.lookup(userId);
			game.players.push({id: userId, name: playerName, ready: 'Not Ready'});
		}
		_io.emit('gameList', _games);
		_io.to(gameId).emit('currentGame', game);
	}
}

function _removeFromGame(gameId, userId) {
	var gameIndex = _findGameIndex(gameId);
	if (gameIndex !== null) {
		var game = _games[gameIndex];
		var index = _findPlayerIndex(game, userId);
		if (index >= 0)
			game.players.splice(index, 1);
		if (!game.players.length)
			_games.splice(gameIndex, 1);
		_io.to(gameId).emit('currentGame', game);
		_io.emit('gameList', _games);
	}
}

function _banFromGame(gameId, userId) {
	var gameIndex = _findGameIndex(gameId);
	if (gameIndex !== null) {
		var game = _games[gameIndex];
		game.banned.push(userId);
		var index = _findPlayerIndex(game, userId);
		if (index >= 0)
			game.players.splice(index, 1);
		if (!game.players.length)
			_games.splice(gameIndex, 1);
		_io.to(gameId).emit('currentGame', game);
		_io.emit('gameList', _games);
	}
}