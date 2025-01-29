const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  userId: {
    type: String,
    ref: 'users',
    required: true
  },
  ticketId: {
      type: String,
      required: true
  },
  tickets: {
      type: Array,
      required: true
  },
  gameId: {
      type: String,
      ref: 'games'
  },
 ticketName:{
  type: String,
  required: true
 }
},
{
  timestamps: true
});

module.exports = mongoose.model('ticketAudit', schema);