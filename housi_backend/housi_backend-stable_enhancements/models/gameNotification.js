const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user = require('./users');

const schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users'
      },
      gameId: {
        type: String,
        ref: 'games'
      },
      deviceToken:{
        type:String
        
      }
  
   
},
  {
    timestamps: true
  });

module.exports = mongoose.model('gameNotification', schema);