var express = require('express');
var router = express.Router();
var adminController = require("../controllers/adminController");
var socketController=require('../controllers/socketControllers')
var gameNumbers = require("../controllers/gameNumbers");
var expressValidator = require('express-validator');
const helper = require('../lib/helperFunction');
router.use(expressValidator());
let objectId = require('mongodb').ObjectID;
var passport = require("passport")
const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const Redis = require('ioredis');
const client = new Redis(6379, process.env.REDIS_URI);
const users = require('../models/users')
const gameRecords = require('../models/gameNumbers.model');
const claimPrize = require('../models/claim-prize.model');
const winners = require('../models/winners')
const { create } = require('connect-mongo');

const leader = require('../helper/leaderboard');
const leaderBoard = new leader()

//const socket = require('../controllers/socketControllers')

// client.on('connect', function () {
//   console.log('Redis Connected! to admin');
// });

// client.connect()
// client.on('error', err => {
//   console.log('Error ' + err);
// });
router.get('/', function (req, res) {
  res.send('respond with a resources');
});

router.post('/login', (req, res) => {
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();
  adminController.loginUser(req, res);
});
/* Admin */
router.post('/add-admin', (req, res) => {
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('mobile', 'Mobile is required').notEmpty();
  adminController.addAdmin(req, res);
});
router.get('/getAdmin', helper.AuthenticateAdmin, function (req, res) {
  adminController.getAdmin(req, res);
});
router.post('/updateAdmin', helper.AuthenticateAdmin, function (req, res) {
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('mobile', 'Mobile is required').notEmpty();
  req.checkBody('name', 'Name is required').notEmpty();
  adminController.updateAdmin(req, res);
});
router.post('/deleteAdmin', helper.AuthenticateAdmin, function (req, res) {
  adminController.deleteAdmin(req, res);
});
router.post('/updateUserWallet', helper.AuthenticateAdmin, (req, res) => {
  adminController.updateUserWallet(req, res)
})


router.post('/forgotPassword', function (req, res) {
  adminController.forgotPassword(req, res);
});
router.post('/resetPassword', function (req, res) {
  adminController.resetPassword(req, res);
});
router.post('/changePassword', helper.AuthenticateAdmin, (req, res) => {
  adminController.changePassword(req, res);
});
router.post('/editProfile', helper.AuthenticateAdmin, (req, res) => {
  adminController.editProfile(req, res);
});
/* Front End User */
router.post('/getUsers', helper.AuthenticateAdmin, function (req, res) {
  adminController.getUsers(req, res);
});
router.get('/getuserTransactions', helper.AuthenticateAdmin, function (req, res) {
  adminController.getuserTransactions(req, res);
});
router.post('/getuserDetails', helper.AuthenticateAdmin, function (req, res) {
  adminController.getuserDetails(req, res);
});
router.post('/updateUser', helper.AuthenticateAdmin, function (req, res) {
  adminController.updateUser(req, res);
});
router.post('/deleteUser', helper.AuthenticateAdmin, function (req, res) {
  adminController.deleteUser(req, res);
});
router.get('/getCounts', helper.AuthenticateAdmin, function (req, res) {
  adminController.getAllCounts(req, res);
});
/* Banners APIS */
router.get('/getBanners', helper.AuthenticateAdmin, function (req, res) {
  adminController.getBanners(req, res);
});
router.post('/addBanner', helper.AuthenticateAdmin, function (req, res) {
  adminController.addBanner(req, res);
});
router.post('/updateBanner', helper.AuthenticateAdmin, function (req, res) {
  adminController.updateBanner(req, res);
});
router.post('/deleteBanner', helper.AuthenticateAdmin, function (req, res) {
  adminController.deleteBanner(req, res);
});

/* Bonus */
router.get('/getBonus', helper.AuthenticateAdmin, function (req, res) {
  adminController.getBonus(req, res);
});
router.post('/addBonus', helper.AuthenticateAdmin, function (req, res) {
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('amount', 'Amount is required').notEmpty();
  req.checkBody('amount', 'Amount must be number').optional().isDecimal();
  adminController.addBonus(req, res);
});
router.post('/updateBonus', helper.AuthenticateAdmin, function (req, res) {
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('amount', 'Amount is required').notEmpty();
  req.checkBody('amount', 'Amount must be number').optional().isDecimal();
  adminController.updateBonus(req, res);
});
router.post('/deleteBonus', helper.AuthenticateAdmin, function (req, res) {
  adminController.deleteBonus(req, res);
});
/*Notifications*/
router.get('/getNotification', helper.AuthenticateAdmin, function (req, res) {
  adminController.getNotification(req, res)
})
router.post('/addNotification', helper.AuthenticateAdmin, function (req, res) {
  adminController.addNotification(req, res)
})
router.post('/updateNotification', helper.AuthenticateAdmin, (req, res) => {
  adminController.updateNotification(req, res)
})
router.post('/deleteNotification', helper.AuthenticateAdmin, (req, res) => {
  adminController.deleteNotification(req, res)
})
router.post('/pushNotification', (req, res) => {
  adminController.pushNotification(req, res)
})
/* Quiz */
router.get('/getSet', helper.AuthenticateAdmin, function (req, res) {
  adminController.getSet(req, res);
});
router.post('/addSet', helper.AuthenticateAdmin, function (req, res) {
  req.checkBody('name', 'Name is required').notEmpty();
  adminController.addSet(req, res);
});
router.post('/updateQuiz', helper.AuthenticateAdmin, function (req, res) {
  req.checkBody('name', 'Name is required').notEmpty();
  adminController.updateQuiz(req, res);
});
router.post('/deleteSet', helper.AuthenticateAdmin, function (req, res) {
  adminController.deleteSet(req, res);
});

/* Questions */
router.post('/getQuestions', helper.AuthenticateAdmin, function (req, res) {
  adminController.getQuestions(req, res);
});
router.post('/addQuestion', helper.AuthenticateAdmin, (req, res) => {
  adminController.addQuestion(req, res);
});
// router.post('/addQuestion', helper.AuthenticateAdmin, function (req, res) {
//     console.log(req)
//   adminController.addQuestion(req, res);
// });
router.post('/updateQuestion', helper.AuthenticateAdmin, function (req, res) {
  adminController.updateQuestion(req, res);
});
router.post('/deleteQuestion', helper.AuthenticateAdmin, function (req, res) {
  adminController.deleteQuestion(req, res);
});
router.post('/getWithdrawRequests', helper.AuthenticateAdmin, function (req, res) {
  adminController.getWithdrawRequests(req, res);
});
router.post('/updateWithdrawRequests', helper.AuthenticateAdmin, function (req, res) {
  req.checkBody('withdraw_id', 'Withdraw id is required').notEmpty();
  req.checkBody('description', 'Reason for cancelling request').notEmpty();
  adminController.updateWithdrawRequests(req, res);
});
router.post('/deleteWithdrawRequests', helper.AuthenticateAdmin, function (req, res) {
  adminController.deleteWithdrawRequests(req, res);
});

/*router.get('/getQuestion', helper.AuthenticateAdmin, function (req, res) {
  adminController.getQuestion(req, res);
});*/
// router.post('/addQuestion', helper.AuthenticateAdmin, function (req, res) {
//   req.checkBody('name', 'Name is required').notEmpty();
//   req.checkBody('amount', 'Amount is required').notEmpty();
//   req.checkBody('amount', 'Amount must be number').optional().isDecimal();
//   adminController.addQuestion(req, res);
// });
// router.post('/updateQuestion', helper.AuthenticateAdmin, function (req, res) {
//   adminController.updateQuestion(req, res);
// });
// router.post('/deleteQuestion', helper.AuthenticateAdmin, function (req, res) {
//   adminController.deleteQuestion(req, res);
// });
router.post('/uploadAppAndroid', helper.AuthenticateAdmin, (req, res) => {
  adminController.uploadAppAndroid(req, res);
});
router.post('/uploadAppIOS', helper.AuthenticateAdmin, (req, res) => {
  adminController.uploadAppIOS(req, res);
});
router.post('/updateKYC',  (req, res) => {
  adminController.updateKYC(req, res);
});
router.get('/logout', helper.AuthenticateAdmin, (req, res) => {
  adminController.logout(req, res);
});

//content Management
router.post('/addGame', helper.AuthenticateAdmin, (req, res) => {
  adminController.addGame(req, res);
});

router.post('/updateGame', helper.AuthenticateAdmin, (req, res) => {
  adminController.updateGame(req, res)
})

router.post('/cancelGame', helper.AuthenticateAdmin, (req, res) => {
  adminController.cancelGame(req, res)
})
router.post('/deleteGame', helper.AuthenticateAdmin, (req, res) => {
  adminController.deleteGame(req, res);
});
router.get('/getGame',helper.AuthenticateAdmin,  (req, res) => {
  adminController.getGame(req, res);
});
router.post('/getGameByStatus', helper.AuthenticateAdmin, (req, res) => {
  adminController.getGameByStatus(req, res);
});
router.get('/searchgetGame',  (req, res) => {
  adminController.searchgetGame(req, res);
});
router.post('/getGameById', helper.AuthenticateAdmin, (req, res) => {
  adminController.getGameById(req, res);
});

router.post('/addCount', (req, res) => {
  adminController.addCount(req, res);
})

// router.post('/gameMailReminder', (req, res) => {
//   socketController.gameMailReminder('','',{gameId:req.body.id});
// })

router.post('/testTimer', async (req, res) => {
  const randomNumber = []
  for (let index = 1; index < 90; index++) {
    randomNumber.push(index)
  }
  let isGameRecordCreated = await gameRecords.findOne({ gameId: req.body.gameId, status: 'completed' }).lean();
  if (process.env.logging) console.log('isGameRecordCreated===>', isGameRecordCreated)
  if (!isGameRecordCreated) {
    const gameRecordSave = new gameRecords({
      gameId: req.body.gameId,
    })
    await gameRecordSave.save();
  } else {
    return res.send('Game already completed');
  }

  let count = 0
  let timerId = setInterval(async () => {
    count = count + 1
    const numberIndex = Math.floor((Math.random() * 90) + 1);
    let throwRandomNumber = randomNumber[numberIndex]
    randomNumber.splice(numberIndex, 1)

    if (count <= 10) {
      await gameRecords.updateOne({ gameId: req.body.gameId }, {
        $push: { numbersSend: throwRandomNumber }
      })
    }
    client.set('save', JSON.stringify(throwRandomNumber))
    if (count > 10) {
      await gameRecords.updateOne({ gameId: req.body.gameId }, {
        $set: { status: 'completed' }
      })
      clearInterval(timerId);
      return true
    } else {
      console.log('count inc==🛬🛬🛬 ', count, throwRandomNumber)
    }
  }, 2000);
})

router.post('/editTicket', async (req, res) => {
  // data need to send 
  // {
  //   "ticketId": "6246cd3fa6368f945bf42fa5",
  //   "userId": "622c8309203d2a4052c0216a",
  //   "lineIndex": "0",
  //   "numberIndex": "0"
  // }
  let tickets = await users.aggregate([{ "$match": { 'tickets._id': objectId(req.body.ticketId) } },
  { "$unwind": "$tickets" },
  { "$unwind": "$tickets.gameId" },

  { "$match": { "tickets._id": objectId(req.body.ticketId) } },
  { $project: { _id: 1, 'tickets': 1 } }])
  if (process.env.logging) console.log('tickets====>😇😇 ', tickets);

  const getUserTicket = await users.findById(req.body.userId).select('tickets name').lean()
  const getCurrentTicketIndex = getUserTicket.tickets.findIndex(x => x._id.toString() === req.body.ticketId)

  if (process.env.logging) console.log('getTicketIndex❌❌ ', getCurrentTicketIndex);

  const list = await users.updateOne({ _id: objectId(req.body.userId), ['tickets.' + getCurrentTicketIndex + '.ticket.' + req.body.lineIndex + '.' + req.body.numberIndex + '']: 65 }, {
    $set: {
      ['tickets.' + getCurrentTicketIndex + '.ticket.' + req.body.lineIndex + '.' + req.body.numberIndex + '']: 0
    }
  });
  if (process.env.logging) console.log('list======>', list);
  // checking for row house
  const isRowCompleted = tickets[0].tickets.ticket[req.body.lineIndex].find(x => x > 0)
  if (isRowCompleted) {
    return res.status(200).send({
      msg: 'Not completed'
    })
  }
  if (process.env.logging) console.log('isRowCompleted=====>', isRowCompleted);
  return res.status(200).send({
    status: true,
    tickets: tickets
  })
})

router.post('/checkTicket', async (req, res) => {
  const ticket = await users.aggregate([{ "$match": { "tickets.gameId": req.body.gameId } },
  { "$unwind": "$tickets" },
  { "$unwind": "$tickets.gameId" },

  { "$match": { _id: objectId(req.body.userId), "tickets._id": objectId('6253e046ca20bbc372c4535d') } },
  { $project: { _id: 1, tickets: 1 } }])

  return res.send(ticket)
})

router.post('/addClaimPrize', async (req, res) => {

  const createClaim = new claimPrize({ ...req.body })
  await createClaim.save();
  return res.status(200).send({
    status: true,
    result: createClaim
  })
})

router.get('/getClaimList', async (req, res) => {
  const gamesList = await claimPrize.findOne({ gameId: req.body.gameId })
    .populate('firstLineClaimWinner', 'name credit_points')
    .populate('fullHouseClaimWinner', 'name credit_points')
    .lean()
  return res.send(gamesList)
})

router.get('/getUpComingGame', async (req, res) => {
  adminController.getUpComingGame(req, res)
})

router.post('/createWinner', async (req, res) => {
  const createWinner = new winners({
    ...req.body
  })
  await createWinner.save();
  return res.status(200).send({
    status: true,
    result: createWinner
  })
})


router.post('/fielter_user_list', async (req, res) => {
  adminController.fielter_user_list(req, res);


})

router.get('/jks', async (req, res) => {
  return res.status(200).send({
    status: true,
    result: 'jk fun call',
  })
});


router.post('/sumit', async (req, res) => {
  return res.status(200).send({
    status: true,
    result: 'sumit fun call',
  })

});

router.post('/raja/:name?', async (req, res) => {
  adminController.raja(req, res);
});


router.get('/think', async (req, res) => {
  adminController.ddmo(req, res);
});

router.post('/WithdrawRequestsFilter', async (req, res) => {
  adminController.withdrawRequestsFilter(req, res)
})

router.post('/transactionsFilter', async (req, res) => {
  adminController.transactionsFilter(req, res)
})

router.post("/getProfileById", helper.AuthenticateAdmin, (req, res) => {
  adminController.getProfileById(req, res);
});

router.post("/getUsersParticipated", async (req, res) => {
  adminController.getUsersParticipated(req, res);
});

router.post("/getUserTicketsByGameId", async (req, res) => {
  adminController.getUserTicketsByGameId(req, res);
});

router.post("/test", async (req, res) => {
  gameNumbers.test(req, res);
});

router.post("/getNumberDetailsByUserId", async (req, res) => {
  adminController.getNumberDetailsByUserId(req, res);
});

router.post("/getUsersByNumberCrossed", async (req, res) => {
  adminController.getUsersByNumberCrossed(req, res);
});

router.post("/getOverAllNumbers", async (req, res) => {
  adminController.getOverAllNumbers(req, res);
});

router.post("/getUsersWinningSingleApi", async (req, res) => {
  adminController.getUsersWinningSingleApi(req, res);
});
router.post("/downloadImage", async (req, res) => {
  adminController.downloadImage(req, res);
});
router.post("/testSchedule", async (req, res) => {
  adminController.testSchedule(req, res);
});
router.post("/fullgame/details", async (req, res) => {
  adminController.getGameFullDetails(req, res);
});
router.post("/fullgame/number/details", async (req, res) => {
  adminController.getGameNumberFullDetails(req, res);
});

router.post('/leaderboard', leaderBoard.getGameLeaderBoardAdmin);

router.post('/getGameNumbers', adminController.getGameNumbers);

// router.post('/buyTicket',async (req, res) => {
//   socket.buyTicket({userId:req.body.userId,gameId:req.body.gameId,number:req.body.number});
// })


// router.post('/sendNotification',async(req,res)=>{
// 	adminController.sendNotification('11583')
// })
router.post('/test123',async (req, res) => {
  socketController.timeCalculate()
})


router.post('/yearlyWithdrawls',async (req, res) => {
  adminController.yearlyWithdrawls(req, res)
})

router.post('/tdsDetails',async (req, res) => {
  adminController.tdsDetails(req, res)
})

router.post('/deposit/list',async (req, res) => {
  adminController.depositList(req, res)
})

router.post('/uploadForm16',async (req, res) => {
  adminController.uploadForm16(req, res)
})

router.post('/getForm16ForUser',async (req, res) => {
  adminController.getForm16ForUser(req, res)
})



module.exports = router;