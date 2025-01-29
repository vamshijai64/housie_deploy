const games = require('../models/games')
const User = require('../models/users');
var jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
var moment = require('moment');
const Redis = require('ioredis');
let objectId = require('mongodb').ObjectID;
const numberGenerator = require('tambola-generator');
const red = new Redis(6379, process.env.REDIS_URI);
const gamesRecord = require('../models/gameRecord')
const newGenerator = require('../tambola-gen');
const ticketAudit = require('../models/ticketsAudit.model');
const prizeModels = require('../models/prizes.model');
const numbersCrossedModel = require('../models/numbersCrossed.model');
const admin = require('../models/admin');
const nodemailer = require('nodemailer');
const { update } = require('../models/games');
const transaction = require('../models/transaction');
const usernotification = require('../models/usernotification');
// red.on('connect', function () {
//   //   console.log('Redis Connected!');
// });

// red.connect()
// red.on('error', err => {
//   console.log('Error ' + err);
// });

exports.getOnGoingGames = async (socket, io, data) => {
  console.log("Inside GET ONGOING GAMESSS---------------")
  console.log(data)
  var now = new Date();
  var today  = moment();
  var endOfday = today.startOf('day').toISOString();
  endOfday = new Date(endOfday);
  // var gameEndTime = new Date(now.getTime() + 30*60000);
  // var gameEndTime = now. 
  let finalRes = await games.aggregate([
    {$match:{$or: [ { status: 'active'}, { status: 'inprogress' } ]},

  },
  { $sort : { _id : -1 } },
  {$match:{gameStartDateTime: {$gt:endOfday}}},
  {$lookup:{
    from:'ticketaudits',
    localField: "_id",
    foreignField: "gameId",
    as:'alltickets'
  }},
  {$lookup:{
    from:'ticketaudits',
    localField: "_id",
    foreignField: "gameId",
    pipeline:[
      {$match:{
        'userId':data
      }}
    ],
    as:'userTicketsss'

  }},{$match:{"$expr":{$gte:[{$size:"$userTicketsss"},1]}}},
  {
    $set: {
      remainingTicket: { $cond: { if: { $isArray: "$alltickets" }, then: { $size: "$alltickets" }, else: "0"} },
   }
  // $project: {
  //   _id:1,
  //   remainingTicket: { $cond: { if: { $isArray: "$alltickets" }, then: { $size: "$alltickets" }, else: "0"} }
  // }
 }
  ]);

  console.log("Fetched On GOING GAMES_________",finalRes.length);
  // console.log(finalRes[0].userTicketsss)
  io.to(socket.id).emit('getOnGoingGames', { status: true, name: "On going games", game: finalRes });

  // games.find({
  //   gameStartDateTime: {$gt:endOfday},
  //   // $and:[{gameStartDateTime:{$not:{$gt:now}}},{gameStartDateTime:{$lt:endOfday}}],
  //   status: "active"
  // }, (err, docs) => {
  //   console.log("Fetched On GOING GAMES_________");
  //   // socket.emit('getOnGoingGames', { status: false, msg: "On Going Game", data: docs })
  //   if (!err) io.to(socket.id).emit('getOnGoingGames', { status: true, name: "On going games", game: docs });
  //   else io.to(socket.id).emit('getOnGoingGames', { status: false, msg: `Something Went Wrong`, err: err });
  // })

}
exports.getUpcomingGames = async (socket, io, data,flag=0) => {
  //console.log(typeof data,"dataa=======================>>>>>>>>>>>",data,!data,data==null)
  var now = new Date();
  var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var today  = moment();
  var endOfday = today.startOf('day').toISOString();
  endOfday = new Date(endOfday);
  console.log(startOfToday,"dateee",endOfday,"dateee",now)
  let upcomingGames;
  if(typeof data=='object'){
    console.log("iam in iffff")
  upcomingGames = await games.find({ gameStartDate: { $gte: startOfToday },gameStartDateTime: {$gte: now}, status: 'active' }).sort({gameStartDateTime:1}).lean();

  }
  else{
    console.log(" iam in else")
     upcomingGames = await games.aggregate([
      {$match:{status:"active"},
  
    },
    { $sort : { _id : -1 } },
    {$match:{gameStartDateTime: {$gte: now}}},
    {$lookup:{
      from:'ticketaudits',
      localField: "_id",
      foreignField: "gameId",
      as:'alltickets'
    }},
    {$lookup:{
      from:'ticketaudits',
      localField: "_id",
      foreignField: "gameId",
      pipeline:[
        {$match:{
          'userId':data
        }}
      ],
      as:'userTicketsss'
  
    }},{$match:{"$expr":{$gte:[{$size:"$userTicketsss"},1]}}},
    {
      $set: {
        remainingTicket: { $cond: { if: { $isArray: "$alltickets" }, then: { $size: "$alltickets" }, else: "0"} },
     }
    // $project: {
    //   _id:1,
    //   remainingTicket: { $cond: { if: { $isArray: "$alltickets" }, then: { $size: "$alltickets" }, else: "0"} }
    // }
   }
    ]);
  
  }

  console.log(upcomingGames,"=================================>>>>>>>>>>>>")
  
  
  
  
  
  let newGameArray = []
  let firstLineRank = []
  let secondLineRank = []
  let thirdLineRank = []
  let fullHousieRank = []
  let jldiRank = []
  let cornerRank = []
  for (const iterator of upcomingGames) {
    const getTotalCountTicket = await ticketAudit.find({ gameId: iterator._id }).count();
   // console.log(upcomingGames,"getTotalCountTicket'''''''''''''''''''''''''")
    const firstLineAmount = parseFloat(iterator.firstLinePrizeAmount / iterator.firstLineWinners)
    const secondLineAmount = parseFloat(iterator.secondLinePrizeAmount / iterator.secondLineWinners)
    const thirdLineAmount = parseFloat(iterator.thirdLinePrizeAmount / iterator.thirdLineWinners)
    const fullHousieAmount = parseFloat(iterator.fullHousiePrizeAmount / iterator.fullHousieWinners)
    const cornerAmount = parseFloat(iterator.cornerPrizeAmount / iterator.cornerWinners)
    const jldiAmount = parseFloat(iterator.jaldiPrizeAmount / iterator.jaldiWinners)
    // for (let index = 0; index < iterator.firstLine.length; index++) {
    //   const rank = index + 1;
    //   let numbss = iterator.firstLine[index].secondCol - iterator.firstLine[index].firstCol;
    //   // console.log("val:",numbss)
    //   if(numbss==0){
    //     firstLineRank.push({
    //       rank: iterator.firstLine[index].firstCol,
    //       amount: iterator.firstLine[index].thirdCol
    //       // [rank]: firstLineAmount
    //     })
    //   }
    //   else{
    //     for(let i=0;i<numbss+1;i++){
    //       // console.log("came in")
    //       firstLineRank.push({
    //         rank: iterator.firstLine[index].firstCol+i,
    //         amount: iterator.firstLine[index].thirdCol
    //         // [rank]: firstLineAmount
    //       })
    //     }
    //   }
      
    // }
    // for (let index = 0; index < iterator.secondLine.length; index++) {
    //   const rank = index + 1
    //   // console.log(iterator.secondLine)
    //   let numbss = iterator.secondLine[index].secondCol - iterator.secondLine[index].firstCol;
    //   // console.log("val:",numbss)
    //   if(numbss==0){
    //     secondLineRank.push({
    //       rank: iterator.secondLine[index].firstCol,
    //       amount: iterator.secondLine[index].thirdCol
    //       // [rank]: secondLineAmount
    //     })
    //   }
    //   else{
    //     for(let i=0;i<numbss+1;i++){
    //       // console.log("came in")
    //       secondLineRank.push({
    //         rank: iterator.secondLine[index].firstCol+i,
    //         amount: iterator.secondLine[index].thirdCol
    //         // [rank]: firstLineAmount
    //       })
    //     }
    //   }
    // }
    // for (let index = 0; index < iterator.thirdLine.length; index++) {
    //   const rank = index + 1
    //   let numbss = iterator.thirdLine[index].secondCol - iterator.thirdLine[index].firstCol;
    //   // console.log("val:",numbss)
    //   if(numbss==0){
    //     thirdLineRank.push({
    //       rank: iterator.thirdLine[index].firstCol,
    //       amount: iterator.thirdLine[index].thirdCol
    //       // [rank]: thirdLineAmount
    //     })
    //   }
    //   else{
    //     for(let i=0;i<numbss+1;i++){
    //       // console.log("came in")
    //       thirdLineRank.push({
    //         rank: iterator.thirdLine[index].firstCol+i,
    //         amount: iterator.thirdLine[index].thirdCol
    //         // [rank]: firstLineAmount
    //       })
    //     }
    //   }
    // }
    // for (let index = 0; index < iterator.fullHousie.length; index++) {
    //   const rank = index + 1
    //   let numbss = iterator.fullHousie[index].secondCol - iterator.fullHousie[index].firstCol;
    //   // console.log("val:",numbss)
    //   if(numbss==0){
    //     fullHousieRank.push({
    //       rank: iterator.fullHousie[index].firstCol,
    //       amount: iterator.fullHousie[index].thirdCol
    //       // [rank]: fullHousieAmount
    //     })
    //   }
    //   else{
    //     for(let i=0;i<numbss+1;i++){
    //       // console.log("came in")
    //       fullHousieRank.push({
    //         rank: iterator.fullHousie[index].firstCol+i,
    //         amount: iterator.fullHousie[index].thirdCol
    //         // [rank]: firstLineAmount
    //       })
    //     }
    //   }
    // }
    // for (let index = 0; index < iterator.fourCorners.length; index++) {
    //   const rank = index + 1
    //   let numbss = iterator.fourCorners[index].secondCol - iterator.fourCorners[index].firstCol;
    //   // console.log("val:",numbss)
    //   if(numbss==0){
    //     cornerRank.push({
    //       rank: iterator.fourCorners[index].firstCol,
    //       amount: iterator.fourCorners[index].thirdCol
    //       // [rank]: fourCornersAmount
    //     })
    //   }
    //   else{
    //     for(let i=0;i<numbss+1;i++){
    //       // console.log("came in")
    //       cornerRank.push({
    //         rank: iterator.fourCorners[index].firstCol+i,
    //         amount: iterator.fourCorners[index].thirdCol
    //         // [rank]: firstLineAmount
    //       })
    //     }
    //   }
    // }
    // for (let index = 0; index < iterator.jaldiFive.length; index++) {
    //   const rank = index + 1
    //   let numbss = iterator.jaldiFive[index].secondCol - iterator.jaldiFive[index].firstCol;
    //   // console.log("val:",numbss)
    //   if(numbss==0){
    //     jldiRank.push({
    //       rank: iterator.jaldiFive[index].firstCol,
    //       amount: iterator.jaldiFive[index].thirdCol
    //       // [rank]: jaldiFiveAmount
    //     })
    //   }
    //   else{
    //     for(let i=0;i<numbss+1;i++){
    //       // console.log("came in")
    //       jldiRank.push({
    //         rank: iterator.jaldiFive[index].firstCol+i,
    //         amount: iterator.jaldiFive[index].thirdCol
    //         // [rank]: firstLineAmount
    //       })
    //     }
    //   }
    // }
    for (let index = 0; index < iterator.firstLine.length; index++){

      firstLineRank.push({
        rank: (Number(iterator.firstLine[index].firstCol)===Number(iterator.firstLine[index].secondCol))?`${iterator.firstLine[index].firstCol}`:`${iterator.firstLine[index].firstCol}-${iterator.firstLine[index].secondCol}`,
        amount: iterator.firstLine[index].thirdCol
        // [rank]: firstLineAmount
      })
    }
    for (let index = 0; index < iterator.secondLine.length; index++){
    secondLineRank.push({
      rank: (Number(iterator.secondLine[index].firstCol)===Number(iterator.secondLine[index].secondCol))?`${iterator.secondLine[index].firstCol}`:`${iterator.secondLine[index].firstCol}-${iterator.secondLine[index].secondCol}`,
      amount: iterator.secondLine[index].thirdCol
      // [rank]: firstLineAmount
    })
  }
  for (let index = 0; index < iterator.thirdLine.length; index++){
    thirdLineRank.push({
      rank: (Number(iterator.thirdLine[index].firstCol)===Number(iterator.thirdLine[index].secondCol))?`${iterator.thirdLine[index].firstCol}`:`${iterator.thirdLine[index].firstCol}-${iterator.thirdLine[index].secondCol}`,
      amount: iterator.thirdLine[index].thirdCol
      // [rank]: firstLineAmount
    })
  }
  for (let index = 0; index < iterator.fullHousie.length; index++){
    fullHousieRank.push({
      rank: (Number(iterator.fullHousie[index].firstCol)===Number(iterator.fullHousie[index].secondCol))?`${iterator.fullHousie[index].firstCol}`:`${iterator.fullHousie[index].firstCol}-${iterator.fullHousie[index].secondCol}`,
      amount: iterator.fullHousie[index].thirdCol
      // [rank]: firstLineAmount
    })
  }
  for (let index = 0; index < iterator.jaldiFive.length; index++){
    jldiRank.push({
      rank: (Number(iterator.jaldiFive[index].firstCol)===Number(iterator.jaldiFive[index].secondCol))?`${iterator.jaldiFive[index].firstCol}`:`${iterator.jaldiFive[index].firstCol}-${iterator.jaldiFive[index].secondCol}`,
      amount: iterator.jaldiFive[index].thirdCol
      // [rank]: firstLineAmount
    })
  }
  for (let index = 0; index < iterator.fourCorners.length; index++){
    cornerRank.push({
      rank: (Number(iterator.fourCorners[index].firstCol)===Number(iterator.fourCorners[index].secondCol))?`${iterator.fourCorners[index].firstCol}`:`${iterator.fourCorners[index].firstCol}-${iterator.fourCorners[index].secondCol}`,
      amount: iterator.fourCorners[index].thirdCol
      // [rank]: firstLineAmount
    })
  }
    let winningBreakUp = {
      firstLineWinningBreakup: {
        totalCountOfWinners: iterator.firstLineWinners,
        totalPrizeAmount: iterator.firstLinePrizeAmount,
        perHeadAmount: firstLineRank
      },
      secondLineWinningBreakup: {
        totalCountOfWinners: iterator.secondLineWinners,
        totalPrizeAmount: iterator.secondLinePrizeAmount,
        perHeadAmount: secondLineRank
      },
      thirdLineWinningBreakup: {
        totalCountOfWinners: iterator.thirdLineWinners,
        totalPrizeAmount: iterator.thirdLinePrizeAmount,
        perHeadAmount: thirdLineRank
      },
      fullHousieWinningBreakup: {
        totalCountOfWinners: iterator.fullHousieWinners,
        totalPrizeAmount: iterator.fullHousiePrizeAmount,
        perHeadAmount: fullHousieRank
      },
      cornerWinningBreakup: {
        totalCountOfWinners: iterator.cornerWinners,
        totalPrizeAmount: iterator.cornerPrizeAmount,
        perHeadAmount: cornerRank
      },
      jldiWinningBreakup: {
        totalCountOfWinners: iterator.jaldiWinners,
        totalPrizeAmount: iterator.jaldiPrizeAmount,
        perHeadAmount: jldiRank
      }
    }
    newGameArray.push({ ...iterator, winnerBreakup: winningBreakUp, remainingTicket: iterator.totalTickets - getTotalCountTicket })
    firstLineRank = []
    secondLineRank = []
    thirdLineRank = []
    fullHousieRank = []
    jldiRank = []
    cornerRank = []
  }
  //console.log("upcomming games --------")
// console.log("gameeeee",socket.id)
  io.to(socket.id).emit('getUpcomingGames', { status: true, name: "Upcoming games", game: newGameArray });
  if(flag==1){
    io.sockets.emit('getUpcomingGames', { status: true, name: "Upcoming games", game: newGameArray });
  }

}
exports.getPreviousGames = async (socket, io, data) => {
  var startOfToday = new Date();
  // const getPreviousGames = await games.find({ gameStartDate: { $lte: startOfToday } }).lean();
  const getPreviousGames = await games.aggregate([
    {$match:{status:"completed"},
  },
  // { $sort : { _id : 1 } },
  {$lookup:{
    from:'ticketaudits',
    localField: "_id",
    foreignField: "gameId",
    as:'alltickets'
  }},
  {$lookup:{
    from:'ticketaudits',
    localField: "_id",
    foreignField: "gameId",
    pipeline:[
      {$match:{
        'userId':data
      }}
    ],
    as:'userTicketsss'

  }},{$match:{"$expr":{$gte:[{$size:"$userTicketsss"},1]}}},
  {$lookup:{
    from:'prizes',
    localField: "_id",
    foreignField: "gameId",
    as:'claimprizesCount',
    pipeline: [
      {
        $match:{
          userId:objectId(data)
        }
      }
    ]
  }},
  {
    $set: {
      remainingTicket: { $cond: { if: { $isArray: "$alltickets" }, then: { $size: "$alltickets" }, else: "0"} },
   }
 },
 {
  $set: {
    noOfUsersWon: { $cond: { if: { $isArray: "$claimprizesCount" }, then: { $size: "$claimprizesCount" }, else: "0"} },
 }
}
  ]);
 // console.log('get previous games called=========>');
  for(let i = 0;i<getPreviousGames.length;i++){
 //   console.log("gameID:",getPreviousGames[i]._id);
  //  console.log("new ____________",getPreviousGames[i].claimprizesCount)
  }
  io.to(socket.id).emit('getPreviousGames', { status: true, name: "Previous games", game: getPreviousGames });
}


exports.generateTicket = (socket, data) => {
  //console.log(data)
  TICKET = numberGenerator.getTickets(1)
  socket.emit('generateTicket', { status: true, data: TICKET[0] })

}
const addNumberOfTickets = async (userId,  gameId, newTicket,amountCut,gamename) => {
  const userData = await getUser(userId)
  const ticketCount = await ticketAudit.find({gameId:gameId,userId:userId}).count()
  
  await User.findByIdAndUpdate(userId, { $push: { tickets: { gameId: gameId, ticketName:`${user.name}(T${ticketCount+1})`,ticket: newTicket } } });
  const getTickets = await getUserTickets(userId, gameId);
  if (getTickets.length > 0) {
    for (const iterator of getTickets) {
      const isExist = await ticketAudit.findOne({ ticketId: iterator.tickets._id }).lean();
      if (!isExist) {
        const createAudit = new ticketAudit({
          userId: userId,
          ticketId: iterator.tickets._id,
          tickets: iterator.tickets.ticket,
          ticketName:`${user.name}(T${ticketCount+1})`,
          gameId: gameId
        })
        Promise.resolve(createAudit.save())
        const getTranscation = await transaction.find({user_id:userId,gameId:gameId}).count()
      
        if(getTranscation>0){
         
          await transaction.findOneAndUpdate({ user_id: userId, gameId:gameId }, {  $inc: { bonusAmount: amountCut.bonus, BalanceAmount:amountCut.balanceWallet,
            winAmount:amountCut.winAmount, amount:amountCut.bonus+amountCut.balanceWallet+amountCut.winAmount},
            description:`You have purchased ${ticketCount+1} tickets for game ${gamename}`
             })
            
        }else{
         
          const createTransactionRecord=new transaction({
            user_id:userId,
            ticket_id:iterator.tickets._id,
            bonusAmount:amountCut.bonus,
            gameId:gameId,
            BalanceAmount:amountCut.balanceWallet,
            winAmount:amountCut.winAmount,
            amount:amountCut.bonus+amountCut.balanceWallet+amountCut.winAmount,
            type:'debit',
            status:'accept',
            description:`You have purchased ticket for game ${gamename}`
  
          })

          Promise.resolve(createTransactionRecord.save())
         
        }
        
        //await createAudit.save();
      }
    }
  }
  addParticipants(gameId)
}

exports.buyTicket = async (socket, io, data) => {
  console.log('buy ticket======>', data)
  // console.log('token=>',socket.handshake.headers.token)
  if (process.env.logging) console.log(data);
  const decoded = jwt.decode(socket.handshake.headers.token, "housie");
  
  

  //console.log('user_tickets_count=========>', user_cash)
  const gameDetails = await getGames(data.gameId);
  // let bonusPercentage = gameDetails.bonusPercentage;
  // let userBonusCash = user.bonusWallet;
  // let userWinCash = user.winAmount;
  // let userBalCash = user.balanceWallet; 
  game_fees = gameDetails.fees
  
  let ticketCount=0;
  ticketArray = []
  for(let i=1;i<=Number(data.number);i++){
    user = await getUser(data.userId)
    user_tickets_count = await getUserTickets(data.userId, data.gameId)
    console.log(user_tickets_count,"user_tickets_count")

  //console.log(user,"user")

 // user_cash = user.winAmount;
    const getTotalCountTicket = await ticketAudit.find({ gameId: data.gameId }).count();
    console.log("count=============",getTotalCountTicket,gameDetails.totalTickets);

    if (getTotalCountTicket+1 <= gameDetails.totalTickets) { 
      console.log(user_tickets_count.length,"----------->",gameDetails.multipleEntry)
      if (user_tickets_count.length < 5 && gameDetails.multipleEntry) {
  
        let game_ticket_fees=game_fees * 1;
        let balance = user.winAmount+user.balanceWallet
        let bonus_percent=(game_ticket_fees/100)*gameDetails.bonusPercentage;
        let update_data;
        let amountCut;
        
        // if(user_cash>=game_ticket_fees){
        //   if(user.bonusWallet>=bonus_percent){
        //     update_data={
        //       winAmount:user_cash-(game_ticket_fees-bonus_percent),
        //       bonusWallet:user.bonusWallet-bonus_percent
        //     }
        //   }
        //   else{
        //     update_data={
        //       winAmount:user_cash-game_ticket_fees
        //     }
        //   }
        // }
        // else if(user_cash<game_ticket_fees&&user.balanceWallet>=game_ticket_fees){
        //   if(user.bonusWallet>=bonus_percent){
        //     update_data={
        //       balanceWallet:user.balanceWallet-(game_ticket_fees-bonus_percent),
        //         bonusWallet:user.bonusWallet-bonus_percent
        //       }
        //     }
        //     else{
        //       update_data={
        //         balanceWallet:user_cash-game_ticket_fees
        //       }
        //     }
        // }
        if(balance>=game_ticket_fees){
          if(user.bonusWallet>=bonus_percent){
            const finalAmount=game_ticket_fees-bonus_percent 
            if(user.balanceWallet>=finalAmount){
              update_data={
                bonusWallet:user.bonusWallet-bonus_percent,
                balanceWallet:user.balanceWallet-finalAmount
            }
            amountCut={
              bonus:bonus_percent,
              winAmount:0,
              balanceWallet:finalAmount
            }
            }
            else{
              
                update_data={
                  bonusWallet:user.bonusWallet-bonus_percent,
                  winAmount:user.winAmount-(finalAmount-user.balanceWallet),
                  balanceWallet:0
              }
              amountCut={
                bonus:bonus_percent,
                winAmount:finalAmount-user.balanceWallet,
                balanceWallet:user.balanceWallet
              }
            }

          }
          else{
            if(user.balanceWallet>=game_ticket_fees){
              update_data={
               
                balanceWallet:bonus_percent>0?user.balanceWallet-(game_ticket_fees-user.bonusWallet):user.balanceWallet-game_ticket_fees,
                bonusWallet:bonus_percent>0?0:user.bonusWallet
            }
            amountCut={
              bonus:bonus_percent>0?user.bonusWallet:0,
              winAmount:0,
              balanceWallet:bonus_percent>0?game_ticket_fees-user.bonusWallet:game_ticket_fees
            }
            
            }
            else{
              
                update_data={
                  winAmount:bonus_percent>0?user.winAmount-((game_ticket_fees-user.bonusWallet)-user.balanceWallet):user.winAmount-(game_ticket_fees-user.balanceWallet),
                  balanceWallet:0,
                  bonusWallet:bonus_percent>0?0:user.bonusWallet
              }
              amountCut={
                bonus:bonus_percent>0?user.bonusWallet:0,
                winAmount:bonus_percent>0?(game_ticket_fees-user.bonusWallet)-user.balanceWallet:game_ticket_fees-user.balanceWallet,
                balanceWallet:user.balanceWallet
              }
            }
          }
        }

       
        else{
          socket.emit('buyTicket', { status: false, msg: 'You do not have sufficient points.' })
          return
        }
  
        // if (user_cash >= game_fees * data.number) {
  
        //   await User.findByIdAndUpdate(data.userId, { winAmount: user_cash - game_fees * data.number })
        //   ticketArray = []
        //   let newTicket
        //   for (let j = 0; j < data.number; j++) {
        //     newTicket = newGenerator.generateTicket()
        //     console.log(newTicket,"newTicket")
        //     ticketArray.push(newTicket)
        //     await addNumberOfTickets(data.userId, user_cash, game_fees, data.gameId, newTicket)
        //   }
        //   socket.emit('buyTicket', { status: true, msg: 'You have successfully bought the ticket.', tickets: ticketArray, userId: data.userId, gameId: data.gameId });
        //   // console.log();
        //  setTimeout(()=>{this.getUpcomingGames(setSocketClient,setSocketIo,{});},2000) 
          
  
        // }
        // if (user_cash >= game_fees) {
        //     let newTicket = tambola.getTickets(1)[0]
        //     ticketArray.push(newTicket)
  
        //     socket.emit('buyTicket', { status: true, msg: 'You have successfully bought the ticket.' })
        // }
        // if (user_cash < game_fees * data.number) {
        //   socket.emit('buyTicket', { status: false, msg: 'You do not have sufficient points.' })
        //   return
        // 
        
            await User.findByIdAndUpdate(data.userId, update_data)
                  
                  let newTicket
                  
                    newTicket = newGenerator.generateTicket()
                    console.log(newTicket,"newTicket")
                    ticketArray.push(newTicket)
                    await addNumberOfTickets(data.userId,  data.gameId, newTicket,amountCut,gameDetails.name)
                    ticketCount=ticketCount+1;
                 
  
                 // socket.emit('buyTicket', { status: true, msg: 'You have successfully bought the ticket.', tickets: ticketArray, userId: data.userId, gameId: data.gameId });
                  // console.log();

                  
                  
      }
      else if (user_tickets_count.length < 1 && !gameDetails.multipleEntry) {
  
                  let game_ticket_fees=game_fees * 1;
                  let balance = user.winAmount+user.balanceWallet
                  
                  let bonus_percent=(game_ticket_fees/100)*gameDetails.bonusPercentage;
                  let update_data;
                  let amountCut;
                  
                  // if(user_cash>=game_ticket_fees){
                  //   if(user.bonusWallet>=bonus_percent){
                  //     update_data={
                  //       winAmount:user_cash-(game_ticket_fees-bonus_percent),
                  //       bonusWallet:user.bonusWallet-bonus_percent
                  //     }
                  //   }
                  //   else{
                  //     update_data={
                  //       winAmount:user_cash-game_ticket_fees
                  //     }
                  //   }
                  // }
                  // else if(user_cash<game_ticket_fees&&user.balanceWallet>=game_ticket_fees){
                  //   if(user.bonusWallet>=bonus_percent){
                  //     update_data={
                  //       balanceWallet:user.balanceWallet-(game_ticket_fees-bonus_percent),
                  //         bonusWallet:user.bonusWallet-bonus_percent
                  //       }
                  //     }
                  //     else{
                  //       update_data={
                  //         balanceWallet:user_cash-game_ticket_fees
                  //       }
                  //     }
                  // }
                  if(balance>=game_ticket_fees){
                    if(user.bonusWallet>=bonus_percent){
                      const finalAmount=game_ticket_fees-bonus_percent 
                      if(user.balanceWallet>=finalAmount){
                        update_data={
                          bonusWallet:user.bonusWallet-bonus_percent,
                          balanceWallet:user.balanceWallet-finalAmount
                      }
                      amountCut={
                        bonus:bonus_percent,
                        winAmount:0,
                        balanceWallet:finalAmount
                      }
                      }
                      else{
                        
                          update_data={
                            bonusWallet:user.bonusWallet-bonus_percent,
                            winAmount:user.winAmount-(finalAmount-user.balanceWallet),
                            balanceWallet:0
                        }
                        amountCut={
                          bonus:bonus_percent,
                          winAmount:finalAmount-user.balanceWallet,
                          balanceWallet:user.balanceWallet
                        }
                      }
          
                    }
                    else{
                      if(user.balanceWallet>=game_ticket_fees){
                        update_data={
                         
                          balanceWallet:bonus_percent>0?user.balanceWallet-(game_ticket_fees-user.bonusWallet):user.balanceWallet-game_ticket_fees,
                          bonusWallet:bonus_percent>0?0:user.bonusWallet
                      }
                      amountCut={
                        bonus:bonus_percent>0?user.bonusWallet:0,
                        winAmount:0,
                        balanceWallet:bonus_percent>0?game_ticket_fees-user.bonusWallet:game_ticket_fees
                      }
                      
                      }
                      else{
                        
                          update_data={
                            winAmount:bonus_percent>0?user.winAmount-((game_ticket_fees-user.bonusWallet)-user.balanceWallet):user.winAmount-(game_ticket_fees-user.balanceWallet),
                            balanceWallet:0,
                            bonusWallet:bonus_percent>0?0:user.bonusWallet
                        }
                        amountCut={
                          bonus:bonus_percent>0?user.bonusWallet:0,
                          winAmount:bonus_percent>0?(game_ticket_fees-user.bonusWallet)-user.balanceWallet:game_ticket_fees-user.balanceWallet,
                          balanceWallet:user.balanceWallet
                        }
                      }
                    }
                  }
          

                  else{
                    socket.emit('buyTicket', { status: false, msg: 'You do not have sufficient points.' })
                    return
                  }
            
                  // if (user_cash >= game_fees * data.number) {
            
                  //   await User.findByIdAndUpdate(data.userId, { winAmount: user_cash - game_fees * data.number })
                  //   ticketArray = []
                  //   let newTicket
                  //   for (let j = 0; j < data.number; j++) {
                  //     newTicket = newGenerator.generateTicket()
                  //     console.log(newTicket,"newTicket")
                  //     ticketArray.push(newTicket)
                  //     await addNumberOfTickets(data.userId, user_cash, game_fees, data.gameId, newTicket)
                  //   }
                  //   socket.emit('buyTicket', { status: true, msg: 'You have successfully bought the ticket.', tickets: ticketArray, userId: data.userId, gameId: data.gameId });
                  //   // console.log();
                  //  setTimeout(()=>{this.getUpcomingGames(setSocketClient,setSocketIo,{});},2000) 
                    
            
                  // }
                  // if (user_cash >= game_fees) {
                  //     let newTicket = tambola.getTickets(1)[0]
                  //     ticketArray.push(newTicket)
            
                  //     socket.emit('buyTicket', { status: true, msg: 'You have successfully bought the ticket.' })
                  // }
                  // if (user_cash < game_fees * data.number) {
                  //   socket.emit('buyTicket', { status: false, msg: 'You do not have sufficient points.' })
                  //   return
                  // }
                  
                      await User.findByIdAndUpdate(data.userId, update_data)
                            
                            let newTicket
                            
                              newTicket = newGenerator.generateTicket()
                              console.log(newTicket,"newTicket")
                              ticketArray.push(newTicket)
                              await addNumberOfTickets(data.userId,  data.gameId, newTicket)
                           
                              ticketCount=ticketCount+1;
            
                           // socket.emit('buyTicket', { status: true, msg: 'You have successfully bought the ticket.', tickets: ticketArray, userId: data.userId, gameId: data.gameId });
                            // console.log();
          
                            
                            
      }
      else {
        socket.emit('buyTicket', { status: false, msg: `You Cannot Buy More Then ${gameDetails.multipleEntry?'5':'1'} Tickets` })
        break;
        
      }
    } else {
      socket.emit('buyTicket', { status: false, msg: 'Total ticket purchased count reached.' })
      break;
    }
  }
if(ticketCount>0){
  let notification = new usernotification({
    userId: data.userId,
    gameId: data.gameId,
    message: `You have purchased ${data.number} ${Number(data.number)===1 ? 'ticket':'tickets'} for game ${gameDetails.name}`,

  });
 await notification.save()
  socket.emit('buyTicket', { status: true, msg: `You have successfully bought the ticket.`, tickets: ticketArray, userId: data.userId, gameId: data.gameId });
}
                  
  const socketIORoute = require('../socket-io');
                

  setTimeout(()=>{
    if(setSocketClient){socketIORoute.getUpcomingGamesOut(setSocketClient)}},2000) 
  
  


  // console.log(typeof(decoded.user.userId))
  // gameFees=await Games.findById(data.gameId,(err,docs)=>{
  //     return docs
  // })
  //console.log(game_fees, user_cash);
  // {$push:{question:question}}
  // User.findByIdAndUpdate({_id:decoded.user.userId,'ticket.id':data.gameId},{$push:{ticket:{...data}}},(err,docs)=>{
  //     if(!err){
  //         console.log(docs)
  //     }
  //     else{
  //         console.log(err)
  //     }
  // })

}



exports.disconnect = async (socket) => {
  console.log('<====================into disconnect====================> ', socket.id);
}
// get All tickets of user of any game
// need to work
exports.userTickets = async (socket, io, data) => {
  console.log('data in userTickets===========>', data)
  const ticket = await User.aggregate([{ "$match": { _id: objectId(data.userId), "tickets.gameId": data.gameId } },
  { "$unwind": "$tickets" },
  { "$unwind": "$tickets.gameId" },

  { "$match": { _id: objectId(data.userId), "tickets.gameId": data.gameId } },
  
  { $project: { _id: 1, tickets: 1 } }])
  socket.emit('userTickets', { status: true, tickets: ticket })
}
exports.getSingleTicket = async (socket, io, data) => {
  console.log('iam hereeeeeeeeeeeeeeeeeeeeeeeee',data)

		let ticketData = await ticketAudit.aggregate([
			{ "$match": {gameId:data.gameId,userId:data.userId,ticketId:data.ticketId} },
			{ "$project": { "ticket":"$tickets"} }
		   
		  ])
		  
		
		const numberCross = await numbersCrossedModel.find({gameId:data.gameId,userId:data.userId,ticketId:data.ticketId});
		
		 const data1 = ticketData[0]
		
		data1.gameId=data.gameId;
		//  console.log([{tickets:data1,_id:data.userId}],"ticketData[0]")
    if(numberCross.length){
      let numbersCro = numberCross[0].numbersCrossed;
      if(data.type == "jldi"){
       numbersCro = numbersCro.splice(0,5);
      }
      if(data.type == 'firstLine' || data.type == 'secondLine' || data.type == 'thirdLine'){
        let firstRowEle = data1.ticket[data.type=='firstLine' ? 0: data.type=='secondLine'?1:2];
        let dup = [];
        console.log(firstRowEle)
        for(let i=0;i<firstRowEle.length;i++){
        let ind = numbersCro.findIndex(x=>x==firstRowEle[i]);
        if(ind!=-1){
        dup.push(numbersCro[ind]);
        }
        }
        numbersCro = dup;
      }
      if(data.type == 'corner'){
        let dum2 = [];
        let firstR = data1.ticket[0];
        let lastR = data1.ticket[2];
        for(let i=0;i<firstR.length;i++){
          if(firstR[i] !=0){
            dum2.push(firstR[i]);
            break;
          }
        }
        for(let i=firstR.length-1;i>0;i--){
          if(firstR[i] !=0){
            dum2.push(firstR[i]);
            break;
          }
        }
        for(let i=0;i<lastR.length;i++){
          if(lastR[i] !=0){
            dum2.push(lastR[i]);
            break;
          }
        }
        for(let i=lastR.length-1;i>0;i--){
          if(lastR[i] !=0){
            dum2.push(lastR[i]);
            break;
          }
        }
        let dup = [];
        console.log(dum2)
        for(let i=0;i<dum2.length;i++){
        let ind = numbersCro.findIndex(x=>x==dum2[i]);
        if(ind!=-1){
        dup.push(numbersCro[ind]);
        }
        }
        numbersCro = dup;
        
      }
      console.log(numbersCro)
      console.log({ status: true,tickets: [{tickets:data1,_id:data.userId}],numberCrossed:numberCross[0].numbersCrossed},"hiiii123")
    socket.emit('getSingleTicket', { status: true,tickets: [{tickets:data1,_id:data.userId}],numberCrossed:numbersCro})

    }else{
      console.log({ status: true,tickets: [{tickets:data1,_id:data.userId}]},"hiiii")
    socket.emit('getSingleTicket', { status: true,tickets: [{tickets:data1,_id:data.userId}]})
    }
}
exports.gameMailReminder = async (socket, io, data) => {
  const auth ={
    user: 'bhanuprasad@pronteff.com',
    pass: 'bhanu@1234',
  }

  let requests = await admin.find({ isBlocked: 0 }).sort({ createdAt: -1 }).exec();
  let gameDetails= await games.findById(data.gameId).lean()
  console.log(gameDetails,"requests",data)
  if(!gameDetails.conformationLeague){
  requests.length ? requests.map(item=>{
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: auth,
    })
  
    var mailOptions = {
      from: auth.user,
      to: item.email,
      subject: 'Game Registration close Reminder',
  
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Rushividyabhyasam</title>
      </head>
      <body style="padding:0;text-align:center;">
          <table align="center" style="text-align: center; padding:0; width:600px; border-spacing:0; border: 1px solid #F4C80B;
              border-radius: 5px; margin: 0 auto;">
              <tbody>
                 
                  <tr>
                      <td>
                          <table align="left" style="padding:0; width:536px; border-spacing:0; margin: 15px 30px 30px 30px;">
                              <tbody>
                                  <tr>
                                      <td align="left"
                                          style="padding:30px 30px 0px 30px; font-family:Arial, sans-serif; font-size: 16px; line-height:20px;">
                                          
                                          <h3 style="color:#fffff;">Hi <span
                                                  style="font-weight: 700; color: #222222;">${
                                                   item.name
                                                  },</span></h3>
                                          <p>The game <span
                                                  style="color: #EE0000; font-weight: 700;">${
                                                    gameDetails.name 
                                                  }</span>
                                              registration time has been closed if you want to cancel the game please cancel before game starts<span
                                              style="font-weight: 700; color: #222222;">(If you forget to cancel, game runs asusual and prizes can be distributed)</span> 
      </p>
                                          
                                          <br><br>
                                          <hr style="height: 0.4px; border: 0.25px solid #CA2221;">
                                      </td>
                                  </tr>
                                  <tr>
                                      <td align="left"
                                          
                                          <p style="font-weight: 600; font-size: 14px;
                                          color: #102043;"> Regards, </p>
                                          <P style="color: #E32E32;">Dream Housie Management</P>
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
                      </td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>
     
      
      `,
    }
    transporter.sendMail(mailOptions,(err,res)=>{
      console.log(err,'err')
    })

  }):''
}
  socket.emit('gameMailReminder', {})

   
}

exports.gameTickets = async (socket, io, data,flag,res) => {
  console.log('data in gameTickets===========>', data)
  let ticket = await User.aggregate([{ "$match": { "tickets.gameId": data.gameId } },
  { "$unwind": "$tickets" },
  { "$unwind": "$tickets.gameId" },

  { "$match": { "tickets.gameId": data.gameId } },
  { $project: { name: 1,profile_image:1, tickets: 1,_id:1 } }]);

  let ticketUnique = await User.aggregate([{ "$match": { "tickets.gameId": data.gameId } },
  { "$unwind": "$tickets" },
  { "$unwind": "$tickets.gameId" },

  { "$match": { "tickets.gameId": data.gameId } },
  { "$group" : {_id:"$_id"}},
  { $project: { _id:1,name:1} }]);

  let finalArray = await new Promise(async (resolve)=>{
    if(ticketUnique.length==0){
      resolve([])
    }
    let arrayRef = [];
    for(let i=0;i<ticketUnique.length;i++){
       let dum = await ticket.filter(x=>objectId(x._id).toString()==objectId(ticketUnique[i]._id).toString());
      //  console.log("dum",dum)
       for(let j=0;j<dum.length;j++){
        
        dum[j].ticketName = dum[j].name + ` (T${j+1})`;
       }
       arrayRef = [...arrayRef,...dum];
      //  console.log("array ref-----",arrayRef)
       if(i==ticketUnique.length-1){
        resolve(arrayRef)
       }
    }
  });
  let userTicketss = await finalArray.filter(x=>objectId(x._id).toString()==data.userId);
  let remainingTicketss = await finalArray.filter(x=>objectId(x._id).toString()!=data.userId);
  finalArray = [...userTicketss,...remainingTicketss]
  console.log('============finalArray before========================');
  console.log(finalArray);
  console.log('====================================');
  const d1 = await User.find({ _id: new mongoose.Types.ObjectId(data.userId) })
  console.log('=====================logged user===============')
  console.log(d1[0].name)
  console.log('====================================')
  

  const specificName = d1[0].name

  const sortedArray = finalArray
    .filter(user => user.name === specificName)
    .concat(
      finalArray
        .filter(user => user.name !== specificName)
        .sort((a, b) => a.name.localeCompare(b.name))
    );

  console.log(sortedArray);


  // finalArray.sort((a, b) => {
  //   const ticketNameA = a.ticketName.toUpperCase();
  //   const ticketNameB = b.ticketName.toUpperCase();
  
  //   if (ticketNameA < ticketNameB) {
  //     return -1;
  //   }
  //   if (ticketNameA > ticketNameB) {
  //     return 1;
  //   }
  //   return 0;
  // });
  // console.log("tickets unique ----------",ticketUnique)
  // console.log("tickets ----------",finalArray)
  // this.getUpcomingGames(socket,io,{});
  if(flag!=1){
    socket.emit('gameTickets', { status: true, tickets: sortedArray });
  }
  //console.log({ status: true, tickets: finalArray })
  if(res){
  return res.status(200).json({
    title: 'Transaction List',
    error: false,
    details: { status: true, tickets: sortedArray }
});
  }

}


const getUserTickets = async (userId, gameId) => {
  const ticket = await User.aggregate([{ "$match": { _id: objectId(userId), "tickets.gameId": gameId } },
  { "$unwind": "$tickets" },
  { "$unwind": "$tickets.gameId" },

  { "$match": { _id: objectId(userId), "tickets.gameId": gameId } },
  { $project: { _id: 1, tickets: 1 } }])
  return ticket
}
// get all tickets of user
exports.getUserTickets = async (userId, gameId) => {
  console.log('ticket1111111=========>', userId, gameId)
  const ticket = await User.aggregate([{ "$match": { _id: objectId(userId), "tickets.gameId": gameId } },
  { "$unwind": "$tickets" },
  { "$unwind": "$tickets.gameId" },

  { "$match": { _id: objectId(userId), "tickets.gameId": gameId } },
  { $project: { _id: 1, tickets: 1 } }])
  return ticket
}


function recurse() {
  min = 1
  max = 99
  const TicketNumber = []
  for (let i = 0; i < 15; i++) {
    let newNumber = Math.floor(Math.random() * (max - min + 1) + min)
    let index = Math.floor(Math.random() * (max - min + 1) + min)
    TicketNumber.push({ index: index, number: newNumber })
  }
  console.log(TicketNumber)

  // let uniqueList = new Set(TicketNumber)

  // console.log("uniqueList==>>", uniqueList, uniqueList.length)

  // console.log("2222", TicketNumber.some(el => el !== null))

  // return TicketNumber.sort(function (a, b) { return a - b });
  // if(TicketNumber.some(el => el !== null)){
  //   console.log()
  // }
}

function myRandomInts(quantity) {
  max = 99
  const arr = []
  while (arr.length < quantity) {
    var candidateInt = Math.floor(Math.random() * max) + 1
    if (arr.indexOf(candidateInt) === -1) arr.push(candidateInt)
  }
  let op = new Array(3)
    .fill(0)
    .map(arr => (new Array(9)
      .fill(0)
      .map(arr => Math.floor(Math.random() * 99))))

  console.log(op)
}

const ticket = () => {
  min = 1
  max = 99
  var arr = [];
  while (arr.length < 15) {
    var r = Math.floor(Math.random() * (max - min + 1) + min);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  if (arr.length < 27) {
    for (let i = 0; i < 12; i++) {
      arr.push(0)
    }
  }
  shuffleTicket = shuffle(arr.sort(function (a, b) { return a - b }))
  // console.log(splitToChunks(shuffleTicket,3));
  return splitToChunks(shuffleTicket, 3)
}

const splitToChunks = (array, parts) => {
  let result = [];
  for (let i = parts; i > 0; i--) {
    result.push(array.splice(0, Math.ceil(array.length / i)));
  }
  return result;
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

// utils----------------------------
const getUser = async id => {
  console.log(id,"id1111111111111111111111111")
  let user = await User.findById(id).lean()
  return user
};

const getGames = async (id) => {
  if (id == null) {
    let gamee = await games.find().lean()
    return gamee
  } else {
    let gamee = await games.findById(id).lean()
    return gamee
  }

};

const addParticipants = (id) => {
  console.log('==@@>>>', id)
  // games.findByIdAndUpdate(id,{Participants:{$push:{id}}})
  games.findByIdAndUpdate(id, { $push: { Participants: { id } } })
}

exports.timeCalculate = async(gameTime)=>{
  const { Duration } = require('luxon');
  var x = new Date(gameTime);
        var y = new Date();
  const timeDifferenceMilliseconds = y - x;

        const hours = Math.floor(timeDifferenceMilliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifferenceMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifferenceMilliseconds % (1000 * 60)) / 1000);
        const milliseconds = timeDifferenceMilliseconds % 1000;

        const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;

        console.log(`Time difference: ${formattedTime}`);


        // const zeroDuration = Duration.fromObject({
        // days: 0,
        // hours: hours,
        // minutes: minutes,
        // seconds: seconds,
        // milliseconds: milliseconds,
        // });

      console.log(typeof formattedTime,"jai ravi",formattedTime); // Output: "PT0S" (zero seconds)
      return formattedTime
}
