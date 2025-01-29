const socketControllers = require('./socketControllers')
var adminController = require("./adminController");
const games = require("../models/games");
const user = require("../models/users");
const gameRecords = require("../models/gameNumbers.model");
// const socketControllers = require("../controllers/socketControllers");
const questions = require("../models/quiz");
const claimsPrize = require("../models/claim-prize.model");
const winners = require("../models/winners");
const userDetails = [];
const gameCount = [];
const numberCross = require("../models/numbersCrossed.model");
const ticketAudit = require("../models/ticketsAudit.model");
const prizes = require('../models/prizes.model');
// const redis = require('redis');
const usernotification = require('../models/usernotification');
const Transaction = require('../models/transaction');

// const client = redis.createClient();
let objectId = require('mongodb').ObjectID;


// let socket = setSocketClient;
// let io = setSocketIo;

exports.startGame = async (data) => {
  const { sendGameUsers } = require('../socket-io');
  console.log("================> Inside CRON GAME START <======================");
  console.log("GAME ID ::==", data.gameId);
  const isExist = gameCount.findIndex((x) => x.gameId === data.gameId);
  if (isExist > -1) {
    return false;
  }
  if (isExist === -1) {
    gameCount.push({ gameId: data.gameId });
  }
  if (process.env.logging)
    console.log("gameId in throw numbers=========>", data.gameId);
  const isGameValid = await games.findById(data.gameId).lean();
  if (process.env.logging) console.log("isGameValid========>", isGameValid);

  const getQuestion = await questions
    .findOne({ name: isGameValid.questionSet })
    .select("question")
    .lean();

  let isGameRecordCreated = await gameRecords
    .findOne({ gameId: data.gameId })
    .lean();
  if (isGameRecordCreated) {
    if (isGameRecordCreated.status === "started") {
      await games.updateOne(
        { _id: data.gameId },
        {
          $set: { status: "inprogress" },
        }
      );
      if (setSocketIo) {
        setSocketIo.to(setSocketClient.id).emit("throwNumbers", {
          msg: "Game already started. You can receive Numbers By Joining the game.",
        });
      }
    } else {
      if (setSocketIo) {
        setSocketIo.to(setSocketClient.id).emit("throwNumbers", {
          msg: "Game Already Completed",
        });
      }
      // io.sockets.in(data.gameId).emit('throwNumbers', { msg: 'Game Already Completed' })
    }
    return false;
  }
  if (!isGameRecordCreated || isGameRecordCreated == null) {
    const gameRecordSave = new gameRecords({
      gameId: data.gameId,
    });
    await gameRecordSave.save();
  }

  if (!isGameValid) {
    sendGameUsers(data.gameId, {
      msg: `Game doesn't exist Please contact to admin.`,
    });
    // if(setSocketIo){
    // setSocketIo.sockets
    // .in(data.gameId)
    // .emit("throwNumbers", {
    //   msg: `Game doesn't exist Please contact to admin.`,
    // });
    // }
  }
  let randomNumber = [];
  for (let index = 1; index <= 90; index++) {
    randomNumber.push(index);
  }
  randomNumber = randomNumber.sort(() => Math.random() - 0.5);


  let count = 0;
  var x = new Date(isGameValid.gameStartDateTime);
  var y = new Date();
  let seconds = Math.abs(x.getTime() - y.getTime()) / 1000;
  const timecalulated= await socketControllers.timeCalculate(isGameValid.gameStartDateTime)
  if (count === 0) {
    let question;
    // const randomConst =
    //   randomNumber.length === 0 ? 90 : randomNumber.length - 1;
    // const numberIndex = Math.floor(Math.random() * randomConst);
    await games.updateOne(
      { _id: data.gameId },
      {
        $set: { status: "inprogress" },
      }
    );
    const throwRandomNumber = randomNumber[0];
    // randomNumber.splice(numberIndex, 1);
    count = count + 1;
    console.log("count", count);
    // console.log(getQuestion.question)
    question = getQuestion.question[throwRandomNumber - 1];
    console.log("here", [{ gameId: data.gameId },
    {
      $push: { numbersSend: throwRandomNumber },
    }]);
    // sendGameUsers(data.gameId,{
    //   Numbers: throwRandomNumber,
    //   numberCount: count,
    //   Question: question,
    // });
    //     if(setSocketIo){
    //     setSocketIo.sockets
    //     .in(data.gameId)
    //     .emit("throwNumbers", {
    //       Numbers: throwRandomNumber,
    //       numberCount: count,
    //       Question: question,
    //     });
    // }
    await gameRecords.updateOne(
      { gameId: data.gameId },
      {
        $push: { numbersSend: { sendNumber: throwRandomNumber, timestamps: "" } },
      }
    );


    sendGameUsers(data.gameId, {
      Numbers: throwRandomNumber,
      seconds: Math.round(seconds % 20),
      numberCount: count,
      Question: question,
      time:timecalulated
    });

    //   if(setSocketIo){
    //   setSocketIo.sockets
    //     .in(data.gameId)
    //     .emit("throwNumbers", {
    //       Numbers: throwRandomNumber,
    //       numberCount: count,
    //       Question: question,
    //     });
    // }
  }
  let timerId = setInterval(async () => {
    console.log("count in interval======>", count);
    let question;
    // const randomConst =
    //   randomNumber.length === 0 ? 90 : randomNumber.length - 1;
    // const numberIndex = Math.floor(Math.random() * randomConst);
    const throwRandomNumber = randomNumber[count];
    // console.log(throwRandomNumber)
    // randomNumber.splice(numberIndex, 1);
    count = count + 1;
    if (count <= 90) {

      question = getQuestion.question[throwRandomNumber - 1];
      await gameRecords.updateOne(
        { gameId: data.gameId },
        {
          $push: { numbersSend: { sendNumber: throwRandomNumber, timestamps: "" } },
        }
      );
    }
    let checkClaimStatus = false;
    if (count > 15) {
      let gameDetails = await games.find({ _id: data.gameId });
      let totalPrizes = Number(gameDetails[0].jaldiWinners) + Number(gameDetails[0].cornerWinners) + Number(gameDetails[0].firstLineWinners) + Number(gameDetails[0].secondLineWinners) + Number(gameDetails[0].thirdLineWinners) + Number(gameDetails[0].fullHousieWinners);
      let claimPrizes = await prizes.find({ gameId: data.gameId });
      let countClaimPrizes = claimPrizes.length;
      if (totalPrizes == countClaimPrizes) {
        checkClaimStatus = true;
      }
    }
    if (count === 90 || checkClaimStatus) {
      await gameRecords.updateOne(
        { gameId: data.gameId },
        {
          $set: { status: "completed", claimStatus: true },
        }
      );
      await games.updateOne(
        { _id: data.gameId },
        {
          $set: { status: "completed" },
        }
      );
      clearInterval(timerId);
      sendGameUsers(data.gameId, {
        msg: "Game is completed",
        numberCount: 90,
        Numbers: throwRandomNumber,
        Question: question,
      });
      // if(setSocketIo){
      // setSocketIo.sockets
      //   .in(data.gameId)
      //   .emit("throwNumbers", {
      //     msg: "Game is completed",
      //     numberCount: 90,
      //     Numbers: throwRandomNumber,
      //     Question: question,
      //   });}
      setTimeout(() => {
        postGameCompletion(data.gameId);
      }, 22 * 1000)
      return true;
    } else {
      if (process.env.logging)
        console.log("count inc==🛬🛬🛬 ", count, throwRandomNumber);
      sendGameUsers(data.gameId, {
        Numbers: throwRandomNumber,
        seconds: Math.round(seconds % 20),
        numberCount: count,
        Question: question,
        time:timecalulated
      });
      //   if(setSocketIo){
      //     console.log("after Joining into game ************************************ logs");
      //     console.log(setSocketIo.sockets
      //    .in(data.gameId).adapter.rooms);
      //   setSocketIo.sockets
      //   .in(data.gameId)
      //   .emit("throwNumbers", {
      //     Numbers: throwRandomNumber,
      //     numberCount: count,
      //     Question: question,
      //   });
      // }
    }
  }, 20 * 1000);
}

exports.test = async (req, res) => {
  postGameCompletion(req.body.id)
}

exports.test2 = async (gameId) => {
  postGameCompletion(gameId)
}

async function postGameCompletion(gameId) {
  let gameDetails = await games.find({ _id: gameId });
  console.log(gameDetails, "gameDetails")
  let iterator = gameDetails[0];
  if (gameDetails[0].prizeClaim && gameDetails[0].prizeClaim == "1") {
    return
  }
  await games.updateOne(
    { _id: gameId },
    {
      $set: { prizeClaim: "1", status: "completed" },
    }
  );
  let { jaldiPrizeAmount, cornerPrizeAmount, firstLinePrizeAmount, secondLinePrizeAmount, thirdLinePrizeAmount, fullHousiePrizeAmount } = gameDetails[0];
  // let claimPrizes = await prizes.find({gameId:gameId}).toArray().map(doc => {
  //   doc._id = doc._id.toString();
  //   return doc;
  // });


  let claimPrizes = await prizes.aggregate([
    { "$match": { gameId: gameId } },
    {
      "$project": {
        "_id": { "$toString": "$_id" }, "userId": { "$toString": "$userId" }, "gameId": 1, "jaldiWinner": 1,
        "cornerWinner": 1,
        "firstRowWinner": 1,
        "secondRowWinner": 1,
        "thirdRowWinner": 1,
        "fullHousiWinner": 1,
        "prize": 1,
        "ticketId": 1

      }
    }

  ])
  // console.log(claimPrizes)
  let jaldiWinner = await claimPrizes.filter(x => x.jaldiWinner == 1);
  let cornerWinner = await claimPrizes.filter(x => x.cornerWinner);
  let firstRowWinner = await claimPrizes.filter(x => x.firstRowWinner == 1);
  let secondRowWinner = await claimPrizes.filter(x => x.secondRowWinner);
  let thirdRowWinner = await claimPrizes.filter(x => x.thirdRowWinner == 1);
  let fullHousiWinner = await claimPrizes.filter(x => x.fullHousiWinner);

  let deleteObj = [];
  cornerWinner = Object.values(cornerWinner.reduce((acc, obj) => {
    const key = obj.ticketId + "|" + obj.userId;
    console.log(key)
    if (!acc[key]) {
      acc[key] = obj;
    }
    else {
      deleteObj.push(obj)
    }
    return acc;
  }, {}));
  jaldiWinner = Object.values(jaldiWinner.reduce((acc, obj) => {
    const key = obj.ticketId + "|" + obj.userId;

    if (!acc[key]) {
      acc[key] = obj;
    }
    else {
      deleteObj.push(obj)
    }
    return acc;
  }, {}));
  firstRowWinner = Object.values(firstRowWinner.reduce((acc, obj) => {
    const key = obj.ticketId + "|" + obj.userId;
    if (!acc[key]) {
      acc[key] = obj;
    }
    else {
      deleteObj.push(obj)
    }
    return acc;
  }, {}));
  secondRowWinner = Object.values(secondRowWinner.reduce((acc, obj) => {
    const key = obj.ticketId + "|" + obj.userId;
    if (!acc[key]) {
      acc[key] = obj;
    }
    else {
      deleteObj.push(obj)
    }
    return acc;
  }, {}));
  thirdRowWinner = Object.values(thirdRowWinner.reduce((acc, obj) => {
    const key = obj.ticketId + "|" + obj.userId;
    if (!acc[key]) {
      acc[key] = obj;
    }
    else {
      deleteObj.push(obj)
    }
    return acc;
  }, {}));
  fullHousiWinner = Object.values(fullHousiWinner.reduce((acc, obj) => {
    const key = obj.ticketId + "|" + obj.userId;
    if (!acc[key]) {
      acc[key] = obj;
    }
    else {
      deleteObj.push(obj)
    }
    return acc;
  }, {}));

  console.log(jaldiWinner.length, "cornerWinner", iterator.jaldiWinners)
  if (cornerWinner.length > iterator.cornerWinners) {
    deleteObj.push(...cornerWinner.splice(iterator.cornerWinners))
  }
  if (jaldiWinner.length > iterator.jaldiWinners) {
    deleteObj.push(...jaldiWinner.splice(iterator.jaldiWinners))
  }
  if (firstRowWinner.length > iterator.firstLineWinners) {
    deleteObj.push(...firstRowWinner.splice(iterator.firstLineWinners))
  }
  if (secondRowWinner.length > iterator.secondLineWinners) {
    deleteObj.push(...secondRowWinner.splice(iterator.secondLineWinners))
  }
  if (thirdRowWinner.length > iterator.thirdLineWinners) {
    deleteObj.push(...thirdRowWinner.splice(iterator.thirdLineWinners))
  }
  if (fullHousiWinner.length > iterator.fullHousieWinners) {
    deleteObj.push(...fullHousiWinner.splice(iterator.fullHousieWinners))
  }

  console.log(deleteObj)
  deleteObj.map(async (item) => {
    await prizes.deleteOne({ _id: item._id })
  })

  let firstLineRank = []
  let secondLineRank = []
  let thirdLineRank = []
  let fullHousieRank = []
  let jldiRank = []
  let cornerRank = []
  // const getTotalCountTicket = await ticketAudit.find({ gameId: iterator._id }).count();
  // console.log(upcomingGames,"getTotalCountTicket'''''''''''''''''''''''''")
  for (let index = 0; index < iterator.firstLine.length; index++) {
    const rank = index + 1;
    let numbss = iterator.firstLine[index].secondCol - iterator.firstLine[index].firstCol;
    // console.log("val:",numbss)
    if (numbss == 0) {
      firstLineRank.push({
        rank: iterator.firstLine[index].firstCol,
        amount: iterator.firstLine[index].thirdCol
        // [rank]: firstLineAmount
      })
    }
    else {
      for (let i = 0; i < numbss + 1; i++) {
        // console.log("came in")
        firstLineRank.push({
          rank: iterator.firstLine[index].firstCol + i,
          amount: iterator.firstLine[index].thirdCol
          // [rank]: firstLineAmount
        })
      }
    }

  }
  for (let index = 0; index < iterator.secondLine.length; index++) {
    const rank = index + 1
    // console.log(iterator.secondLine)
    let numbss = iterator.secondLine[index].secondCol - iterator.secondLine[index].firstCol;
    // console.log("val:",numbss)
    if (numbss == 0) {
      secondLineRank.push({
        rank: iterator.secondLine[index].firstCol,
        amount: iterator.secondLine[index].thirdCol
        // [rank]: secondLineAmount
      })
    }
    else {
      for (let i = 0; i < numbss + 1; i++) {
        // console.log("came in")
        secondLineRank.push({
          rank: iterator.secondLine[index].firstCol + i,
          amount: iterator.secondLine[index].thirdCol
          // [rank]: firstLineAmount
        })
      }
    }
  }
  for (let index = 0; index < iterator.thirdLine.length; index++) {
    const rank = index + 1
    let numbss = iterator.thirdLine[index].secondCol - iterator.thirdLine[index].firstCol;
    // console.log("val:",numbss)
    if (numbss == 0) {
      thirdLineRank.push({
        rank: iterator.thirdLine[index].firstCol,
        amount: iterator.thirdLine[index].thirdCol
        // [rank]: thirdLineAmount
      })
    }
    else {
      for (let i = 0; i < numbss + 1; i++) {
        // console.log("came in")
        thirdLineRank.push({
          rank: iterator.thirdLine[index].firstCol + i,
          amount: iterator.thirdLine[index].thirdCol
          // [rank]: firstLineAmount
        })
      }
    }
  }
  for (let index = 0; index < iterator.fullHousie.length; index++) {
    const rank = index + 1
    let numbss = iterator.fullHousie[index].secondCol - iterator.fullHousie[index].firstCol;
    // console.log("val:",numbss)
    if (numbss == 0) {
      fullHousieRank.push({
        rank: iterator.fullHousie[index].firstCol,
        amount: iterator.fullHousie[index].thirdCol
        // [rank]: fullHousieAmount
      })
    }
    else {
      for (let i = 0; i < numbss + 1; i++) {
        // console.log("came in")
        fullHousieRank.push({
          rank: iterator.fullHousie[index].firstCol + i,
          amount: iterator.fullHousie[index].thirdCol
          // [rank]: firstLineAmount
        })
      }
    }
  }
  for (let index = 0; index < iterator.fourCorners.length; index++) {
    const rank = index + 1
    let numbss = iterator.fourCorners[index].secondCol - iterator.fourCorners[index].firstCol;
    // console.log("val:",numbss)
    if (numbss == 0) {
      cornerRank.push({
        rank: iterator.fourCorners[index].firstCol,
        amount: iterator.fourCorners[index].thirdCol
        // [rank]: fourCornersAmount
      })
    }
    else {
      for (let i = 0; i < numbss + 1; i++) {
        // console.log("came in")
        cornerRank.push({
          rank: iterator.fourCorners[index].firstCol + i,
          amount: iterator.fourCorners[index].thirdCol
          // [rank]: firstLineAmount
        })
      }
    }
  }
  for (let index = 0; index < iterator.jaldiFive.length; index++) {
    const rank = index + 1
    let numbss = iterator.jaldiFive[index].secondCol - iterator.jaldiFive[index].firstCol;
    // console.log("val:",numbss)
    if (numbss == 0) {
      jldiRank.push({
        rank: iterator.jaldiFive[index].firstCol,
        amount: iterator.jaldiFive[index].thirdCol
        // [rank]: jaldiFiveAmount
      })
    }
    else {
      for (let i = 0; i < numbss + 1; i++) {
        // console.log("came in")
        jldiRank.push({
          rank: iterator.jaldiFive[index].firstCol + i,
          amount: iterator.jaldiFive[index].thirdCol
          // [rank]: firstLineAmount
        })
      }
    }
  }

  for (let i = 0; i < firstRowWinner.length; i++) {
    firstRowWinner[i].winCashh = firstLineRank[i].amount;
  }
  for (let i = 0; i < secondRowWinner.length; i++) {
    secondRowWinner[i].winCashh = secondLineRank[i].amount;
  }
  for (let i = 0; i < thirdRowWinner.length; i++) {
    thirdRowWinner[i].winCashh = thirdLineRank[i].amount;
  }
  for (let i = 0; i < fullHousiWinner.length; i++) {
    fullHousiWinner[i].winCashh = fullHousieRank[i].amount;
  }
  for (let i = 0; i < cornerWinner.length; i++) {
    cornerWinner[i].winCashh = cornerRank[i].amount;
  }
  for (let i = 0; i < jaldiWinner.length; i++) {
    jaldiWinner[i].winCashh = jldiRank[i].amount;
  }

  let lastData = [...firstRowWinner, ...secondRowWinner, ...thirdRowWinner, ...fullHousiWinner, ...cornerWinner, ...jaldiWinner];
  //console.log(lastData, "lastData")

  // const totalAmountById = lastData.reduce((acc, obj) => {
  //   acc[obj.userId] = (acc[obj.userId] || 0) + obj.winCashh;
  //  // console.log(acc,"acc")
  //   return acc;
  // }, {});

  //console.log(lastData, "lastData")
  for (let i = 0; i < lastData.length; i++) {
    let eachUser = lastData[i];

     let updatePrize = await prizes.updateOne({_id:eachUser._id},{prize:eachUser.winCashh});
    // if(eachUser.winCashh>=10000){
    //   eachUser.winCashh=eachUser.winCashh-(eachUser.winCashh*30/100)

    // }
    let updatedUser = await user.updateOne({_id:eachUser.userId},{$inc:{winAmount: eachUser.winCashh}})

  }
  const userSums = {};

  lastData.forEach((result) => {
    const userId = result.userId;
    const winCashh = result.winCashh;

    if (userId in userSums) {
      userSums[userId] += winCashh;
    } else {
      userSums[userId] = winCashh;
    }
  });
 (Object.keys(userSums)).forEach(async function (item){
    const notificationFlag= await usernotification.find({gameId:gameId,userId:item,type:"game"}).count();
    let notification = new usernotification({
      userId: item,
      message: `By taking part in a ${iterator.name} game, you have earned ${userSums[item]} rupees.`,
     gameId:gameId,
     type:"game"

    });
    if(notificationFlag===0){
      await notification.save()

    }
    console.log("came in")
    const transaction_id = [{
      amount: userSums[item],
      type: "credit",
      status: "accept",
      description: `You have won ${userSums[item]} rupees in ${iterator.name} game.`,
      user_id: item,
      gameId:gameId
    }]

    const options = { ordered: true };

    await Transaction.insertMany(transaction_id, options);
   })
  // console.log(totalAmountById,"hhhh")
  //  const keys = Object.keys(totalAmountById)
  //  console.log(keys,"keys")
  // for(let key of keys){

  //   if(totalAmountById[key]>10000){
  //     console.log(totalAmountById[key]*30/100,"tdsss")
  //     let updatedUser = await user.updateOne({_id:key},{$inc:{winAmount: -totalAmountById[key]*30/100}})
  //   }
  // }
}