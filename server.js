/* ==========================================================================================
 imports
 ========================================================================================== */

var bodyParser = require('body-parser');
var cors = require('express-cors');
var errorHandler = require('errorhandler');
var express = require('express');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');

/* ==========================================================================================
 instantiate the app
 ========================================================================================== */

var app = express();

/* ==========================================================================================
 config
 ========================================================================================== */

var config = {
    app: {
        port: process.env.PORT || 4711,
        cors: {
            allowedOrigins: [
                'http://localhost:8080',
                'https://davidsmith2.github.io'
            ]
        }
    },
    db: {
        options: {
            server: {
                socketOptions: {
                    keepAlive: 1,
                    connectTimeoutMS: 30000
                }
            },
            replset: {
                socketOptions: {
                    keepAlive: 1,
                    connectTimeoutMS: 30000
                }
            }
        },
        url: {
            development: uriUtil.formatMongoose('mongodb://admin:admin@ds153677.mlab.com:53677/numbers-up-local'),
            production: uriUtil.formatMongoose('mongodb://admin:admin@ds155097.mlab.com:55097/numbers-up')
        }
    }
};

/* ==========================================================================================
 db setup
 ========================================================================================== */

var Guesses = new mongoose.Schema({
    guess: Number
});

var Game = new mongoose.Schema({
    guessesAllowed: Number,
    guessesMade: Number,
    result: String,
    secretNumber: Number,
    tiles: Number,
    user: String
});

var Player = new mongoose.Schema({
    inid: String,
    firstName: String,
    lastName: String
});

var GameModel = mongoose.model('Game', Game);
var PlayerModel = mongoose.model('Player', Player);

mongoose.connection.on('error', console.error.bind(console, 'Mongoose connection error'));
mongoose.connection.once('open', console.log.bind(console, 'Mongoose connection open'));
mongoose.connect(config.db.url[app.settings.env], config.db.options);

/* ==========================================================================================
 app setup
 ========================================================================================== */

app.use(cors(config.app.cors));

app.use(bodyParser.json());

app.use(methodOverride());

app.use(errorHandler());

/* ==========================================================================================
 routes
 ========================================================================================== */

app.get('/api/games', function (request, response) {
    return GameModel.find(function (error, games) {
        if (error) {
            return console.log(error);
        }
        return response.json(games);
    });
});

app.post('/api/games', bodyParser.json(), function (request, response) {
    var game = new GameModel(request.body);
    game.save(function (error, game) {
        if (error) {
            return console.log(error);
        }
        response.json(game);
    });
});

app.get('/api/players', function (request, response) {
    return PlayerModel.find(function (error, players) {
        if (!error) {
            return response.send(players);
        } else {
            return console.log(error);
        }
    });
});

app.post('/api/players', function (request, response) {
    var player = new PlayerModel({
        inid: request.body.inid,
        firstName: request.body.firstName,
        lastName: request.body.lastName
    });

    player.save(function (error) {
        if (!error) {
            return console.log('player created');
        } else {
            return console.log(error);
        }
    });

    return response.send(player);

});

app.put('/api/players/:id', function (request, response) {
    return PlayerModel.findById(request.params.id, function (err, player) {
        player.firstName = request.body.firstName;
        player.lastName = request.body.lastName;
        return player.save(function (err) {
            if (!err) {
                console.log('player updated');
            } else {
                console.log(err);
            }
            return response.send(player);
        });
    });
});

app['delete']('/api/players/:id', function (request, response) {
    return PlayerModel.findById(request.params.id, function (err, player) {
        return player.remove(function (err) {
            if (!err) {
                console.log('player deleted');
                return response.send('');
            } else {
                console.log(err);
            }
        });
    });
});

/* ==========================================================================================
 start the server
 ========================================================================================== */

app.listen(config.app.port, function(){
    var message = 'Express server listening on port %d in %s mode.';
    console.log(message, config.app.port, app.settings.env);
});
