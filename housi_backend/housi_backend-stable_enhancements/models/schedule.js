
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var game = require('./games');
var user = require('./users');

var schema = new Schema ({
    name : {
        type: String
    },
    game_id: {
        type: Schema.ObjectId,
        ref: 'game'
    },
    user_id: {
        type: Schema.ObjectId,
        ref: 'user'
    },
    startTime : {
        type : Date
    }
});

module.exports = mongoose.model('Schedule', schema);