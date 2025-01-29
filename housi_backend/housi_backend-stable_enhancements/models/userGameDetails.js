const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const game = require('./games');
const user = require('./users');

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  game_id: {
    type: Schema.Types.ObjectId,
    ref: 'games',
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users',
  },
  winning: {
    type: Array,
    "default": [],
    required: false
  },
  game_digits: {
    type: Array,
    "default": [],
    required: false
  },
  status: {
    type: String,
    enum: ['participated', 'played','not_played','cancelled'],
    default:'active'
  },
},
{
  timestamps: true
});

module.exports = mongoose.model('userGameDetails', schema);