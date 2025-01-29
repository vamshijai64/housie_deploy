const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const winners = new Schema({
    userId: {
        type: String,
        ref: 'users'
    },
    gameId: String,
    ticketId: String,
    firstRow: {
        type: Boolean,
        default: false
    },
    secondRow: {
        type: Boolean,
        default: false
    },
    thirdRow: {
        type: Boolean,
        default: false
    },
    fullHouse: {
        type: Boolean,
        default: false
    },
    jldi: {
        type: Boolean,
        default: false
    },
    corner: {
        type: Boolean,
        default: false
    },
    amount: {
        type: Number,
        default: 0
    }
    
},
    {
        timestamps: true
    });

module.exports = mongoose.model('winners', winners);