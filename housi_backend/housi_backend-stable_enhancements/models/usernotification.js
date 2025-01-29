const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  message: {
    type: String
  },
  userId : {
    type: Schema.Types.ObjectId,
    ref: 'users'
  },
  gameId : {
    type: String,
    default:0
  },
  type : {
    type: String,
    default:""
  }
  
},{
  timestamps: true
});

module.exports = mongoose.model('usernotification', schema);