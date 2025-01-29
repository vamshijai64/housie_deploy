const socketControllers = require('../controllers/socketControllers')
var adminController = require("../controllers/adminController");
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
const gameNumbers = require('../controllers/gameNumbers');
const Redis = require('ioredis');
const client = new Redis(6379, process.env.REDIS_URI);
let objectId = require('mongodb').ObjectID;

// client.on('connect', function () {
//     console.log('Redis Connected!');
//   });
  
//   client.connect()
//   client.on('error', err => {
//     console.log('Error ' + err);
//   });

const request = (socket, io) => {
    console.log(socket.id);

    socket.on("getOnGoingGames", (data) => {
      console.log(data);
      socketControllers.getOnGoingGames(socket, io, data);
    });
    socket.on("getUpcomingGames", (data) => {
      socketControllers.getUpcomingGames(socket, io, data);
    });
    socket.on("getPreviousGames", (data) => {
      socketControllers.getPreviousGames(socket, io, data);
    });

    socket.on("generateTicket", (data) => {
      socketControllers.generateTicket(socket, io, data);
    });
    socket.on("buyTicket", async (data) => {
      // console.log(data,socket.handshake.headers.token)
      await socketControllers.buyTicket(socket, io, data);
    });
    socket.on("userTickets", async (data) => {
      // console.log(data,socket.handshake.headers.token)
      await socketControllers.userTickets(socket, io, data);
    });
    socket.on("getSingleTicket", async (data) => {
      // console.log(data,socket.handshake.headers.token)
      await socketControllers.getSingleTicket(socket, io, data);
    });
    socket.on("gameMailReminder", async (data) => {
      // console.log(data,socket.handshake.headers.token)
      await socketControllers.gameMailReminder(socket, io, data);
    });
    socket.on("gameTickets", async (data) => {
      // console.log(data,socket.handshake.headers.token)
      await socketControllers.gameTickets(socket, io, data);
    });

    socket.on("joinGame", async (data) => {
      // date need to pass from frontend (gameId, userId)
      const isUserExist = await user.findById(data.userId).lean();
      // push the user details to the userDetails
      userDetails.push({
        gameId: data.gameId,
        userId: data.userId,
        socketId: socket.id,
      });

      if (!isUserExist) {
        io.to(socket.id).emit("joinGame", {
          msg: "user Not exist",
          gameId: data.gameId,
        });
        return false;
      }
      const isGameValid = await games.findById(data.gameId).lean();
      if (!isGameValid || isGameValid == null) {
        io.to(socket.id).emit("joinGame", {
          msg: "Game does not exist",
          gameId: data.gameId,
        });
        return false;
      }
      if (process.env.logging) console.log(isGameValid);
      // user join the room after all user info correct
      console.log("before Joining into game ************************************ logs");
      console.log(socket.id);
      const {joinRomm} = require("../socket-io");
        joinRomm(socket,isGameValid._id.toString());
      // socket.join(isGameValid._id.toString());
      console.log("after Joining into game ************************************ logs");
      console.log(io.sockets
        .in(isGameValid._id.toString()).adapter.rooms);
        // console.log("with app get",app);
          //  let ss = app.get('iodup');
          //  console.log(ss.sockets
          //   .in(data.gameId).adapter.rooms)
       global.setSocketClient = client;
       global.setSocketIo = io;
      console.log("after Joining into game 222222 ************************************ logs");
      console.log(setSocketIo.sockets
        .in(isGameValid._id.toString()).adapter.rooms);
      // client.set("socket-"+isGameValid._id.toString(), JSON.stringify(io));
      // let gettt = await client.get("socket-"+isGameValid._id.toString());
      // console.log("hh",gettt)
      // user set in redis
      let getGameUsers = await client.get(isGameValid._id.toString());
      // console.log("users ********************** *****************8",getGameUsers)
      if (getGameUsers !== null) {
        let gameUsersData = [];
        try{
           gameUsersData = typeof getGameUsers=='string'?JSON.parse(getGameUsers):getGameUsers;
          //  console.log("type of",typeof getGameUsers);
        }catch{
           console.log("Inside Game Users........")
        }
        gameUsersData.push({ userId: isUserExist._id, socketId: socket.id });
        // console.log("hereeeeeeee*************",gameUsersData);
        client.set(isGameValid._id.toString(), JSON.stringify(gameUsersData));
      } else if (getGameUsers === null) {
        getGameUsers = [];
        getGameUsers.push({ userId: isUserExist._id, socketId: socket.id });
        // console.log("hereeeeeeee 22222222222*************",getGameUsers);
        client.set(isGameValid._id.toString(), JSON.stringify(getGameUsers));
      }
      client.set(socket.id.toString(), JSON.stringify(isGameValid._id));
      const userTicket = await socketControllers.getUserTickets(
        data.userId,
        data.gameId
      );

      let crossedNumber = [];
      for (const iterator of userTicket) {
        let claimStatus = {
          firstRow: 0,
          secondRow: 0,
          thirdRow: 0,
          fullHousie: 0,
          jldi: 0,
          corner: 0,
        };
        const getClaimStatus = await winners
          .findOne({ ticketId: iterator.tickets._id })
          .lean();
        if (getClaimStatus) {
          if (getClaimStatus.firstRow) {
            claimStatus.firstRow++;
          }
          if (getClaimStatus.secondRow) {
            claimStatus.secondRow++;
          }
          if (getClaimStatus.thirdRow) {
            claimStatus.thirdRow++;
          }
          if (getClaimStatus.fullHouse) {
            claimStatus.fullHousie++;
          }
          if (getClaimStatus.jldi) {
            claimStatus.jldi++;
          }
          if (getClaimStatus.corner) {
            claimStatus.corner++;
          }
        }
        const getCrossedNumber = await numberCross
          .findOne({ ticketId: iterator.tickets._id })
          .select("numbersCrossed")
          .lean();
        if (getCrossedNumber) {
          const getTickets = await ticketAudit
            .findOne({ ticketId: iterator.tickets._id })
            .select("tickets")
            .lean();
          for (const num of getCrossedNumber.numbersCrossed) {
            const numberExistFirst = getTickets.tickets[0].findIndex(
              (x) => x === num
            );
            if (numberExistFirst > -1) {
              crossedNumber.push({
                crossedNumbers: num,
                lineIndex: 0,
                numberIndex: numberExistFirst,
                ticketId: iterator.tickets._id,
              });
            }
            const numberExistSecond = getTickets.tickets[1].findIndex(
              (x) => x === num
            );
            if (numberExistSecond > -1) {
              crossedNumber.push({
                crossedNumbers: num,
                lineIndex: 1,
                numberIndex: numberExistSecond,
                ticketId: iterator.tickets._id,
              });
            }
            const numberExistthird = getTickets.tickets[2].findIndex(
              (x) => x === num
            );
            if (numberExistthird > -1) {
              crossedNumber.push({
                crossedNumbers: num,
                lineIndex: 2,
                numberIndex: numberExistthird,
                ticketId: iterator.tickets._id,
              });
            }
          }
        }
        console.log("claimStatus=====>", claimStatus);
        iterator.crossed = crossedNumber;
        iterator.claimPrize = claimStatus;
        claimStatus = {
          firstRow: 0,
          secondRow: 0,
          thirdRow: 0,
          fullHousie: 0,
          jldi: 0,
          corner: 0,
        };
        crossedNumber = [];
      }
      // Response sent to the room


      io.to(socket.id).emit("joinGame", {
        msg: "You have joined the game",
        tickets: userTicket,
        gameId: data.gameId,
        userId: data.userId,
        crossedNumber: crossedNumber,
      });
      // io.sockets.in(isGameValid._id.toString()).emit('joinGame', { user: isUserExist, msg: `${isUserExist.name} has joined the Game`, tickets: userTicket })
      return true;
    });

    socket.on("throwNumbers", async (data) => {
      // const isGameValid = await games.findById(data.gameId).lean();
      // io.sockets
      // .in(data.gameId)
      // .emit("throwNumbers", {
      //   Numbers: throwRandomNumber,
      //   numberCount: count,
      //   Question: question,
      // });
      const {joinRomm} = require("../socket-io");
        joinRomm(socket,data.gameId.toString());
      let gameNumberData = await gameRecords.findOne({ gameId: data.gameId }).select('numbersSend').lean();
      //  let gameUsersData = [];
      //   try{
      //      gameUsersData = typeof getGameUsers=='string'?JSON.parse(getGameUsers):getGameUsers;
      //     //  console.log("type of",typeof getGameUsers);
      //   }catch{
      //      console.log("Inside Game Users........")
      //   }
      //   gameUsersData.push({ userId: isUserExist._id, socketId: socket.id });
    
      gameNumberData = gameNumberData.numbersSend.reduce((fin,ind)=>{
        return [...fin,ind.sendNumber]
      },[]);
      
      if(gameNumberData.length>0){
        const isGameValid = await games.findById(data.gameId).lean();
      if (process.env.logging) console.log("isGameValid========>", isGameValid);

      const getQuestion = await questions
        .findOne({ name: isGameValid.questionSet })
        .select("question")
        .lean();

        var x = new Date(isGameValid.gameStartDateTime);
        var y = new Date();
        let seconds = Math.abs(x.getTime() - y.getTime())/1000;
        const timecalulated=await socketControllers.timeCalculate(isGameValid.gameStartDateTime)
          console.log({
            Numbers: gameNumberData[gameNumberData.length-1],
            numberCount: gameNumberData.length-1,
            seconds:Math.round(seconds%20),
            Question: getQuestion.question[gameNumberData[gameNumberData.length-1]-1],
            time:typeof timecalulated,
            time1:timecalulated
          },"jai balayya")

        io.to(socket.id).emit("throwNumbers", {
        Numbers: gameNumberData[gameNumberData.length-1],
        numberCount: gameNumberData.length-1,
        seconds:Math.round(seconds%20),
        Question: getQuestion.question[gameNumberData[gameNumberData.length-1]-1],
        time:timecalulated
      });
      }



      return ;
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
          io.to(socket.id).emit("throwNumbers", {
            msg: "Game already started. You can receive Numbers By Joining the game.",
          });
        } else {
          io.to(socket.id).emit("throwNumbers", {
            msg: "Game Already Completed",
          });
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
        io.sockets
          .in(data.gameId)
          .emit("throwNumbers", {
            msg: `Game doesn't exist Please contact to admin.`,
          });
      }
      let randomNumber = [];
      for (let index = 1; index <= 90; index++) {
        randomNumber.push(index);
      }
      randomNumber = randomNumber.sort( ()=>Math.random()-0.5 );


      let count = 0;
      if (count === 0) {
        let question;
        // const randomConst =
        //   randomNumber.length === 0 ? 90 : randomNumber.length - 1;
        // const numberIndex = Math.floor(Math.random() * randomConst);
        const throwRandomNumber = randomNumber[0];
        // randomNumber.splice(numberIndex, 1);
        count = count + 1;
console.log("count",count);
// console.log(getQuestion.question)
        question = getQuestion.question[count];
        console.log("here",[{ gameId: data.gameId },
          {
            $push: { numbersSend: throwRandomNumber },
          }]);
          io.sockets
          .in(data.gameId)
          .emit("throwNumbers", {
            Numbers: throwRandomNumber,
            numberCount: count,
            Question: question,
          });
        await gameRecords.updateOne(
          { gameId: data.gameId },
          {
            $push: { numbersSend: {sendNumber:throwRandomNumber,timestamps:""} },
          }
        );

        io.sockets
          .in(data.gameId)
          .emit("throwNumbers", {
            Numbers: throwRandomNumber,
            numberCount: count,
            Question: question,
          });
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
          question = getQuestion.question[count];
          await gameRecords.updateOne(
            { gameId: data.gameId },
            {
              $push: { numbersSend: {sendNumber:throwRandomNumber,timestamps:""} },
            }
          );
        }
        let checkClaimStatus = false;
        if(count>15){
          let gameDetails = await games.find({_id:data.gameId});
          let totalPrizes = Number(gameDetails[0].jaldiWinners)+Number(gameDetails[0].cornerWinners)+Number(gameDetails[0].firstLineWinners)+Number(gameDetails[0].secondLineWinners)+Number(gameDetails[0].thirdLineWinners)+Number(gameDetails[0].fullHousieWinners);
          let claimPrizes = await prizes.find({gameId:data.gameId});
          let countClaimPrizes = claimPrizes.length;
          if(totalPrizes==countClaimPrizes){
            checkClaimStatus=true;
          }
        }
        if (count === 90 || checkClaimStatus) {
          await gameRecords.updateOne(
            { gameId: data.gameId },
            {
              $set: { status: "completed",claimStatus:true },
            }
          );
          await games.updateOne(
            { _id: data.gameId },
            {
              $set: { status: "completed" },
            }
          );
          clearInterval(timerId);
          io.sockets
            .in(data.gameId)
            .emit("throwNumbers", {
              msg: "Game is completed",
              numberCount: 90,
              Numbers: throwRandomNumber,
              Question: question,
            });
            postGameCompletion(data.gameId);
          return true;
        } else {
          if (process.env.logging)
            console.log("count inc==🛬🛬🛬 ", count, throwRandomNumber);
          io.sockets
            .in(data.gameId)
            .emit("throwNumbers", {
              Numbers: throwRandomNumber,
              numberCount: count,
              Question: question,
            });
        }
      }, 14 * 1000); //isGameValid.callTime
    });

    async function postGameCompletion(gameId){
      let gameDetails = await games.find({_id:gameId});
		let iterator = gameDetails[0];
		let {jaldiPrizeAmount,cornerPrizeAmount,firstLinePrizeAmount,secondLinePrizeAmount,thirdLinePrizeAmount,fullHousiePrizeAmount} = gameDetails[0];
		let claimPrizes = await prizes.find({gameId:gameId});
		console.log(claimPrizes.length)
		let jaldiWinner = await claimPrizes.filter(x=>x.jaldiWinner==1);
		let cornerWinner = await claimPrizes.filter(x=>x.cornerWinner);
		let firstRowWinner = await claimPrizes.filter(x=>x.firstRowWinner==1);
		let secondRowWinner = await claimPrizes.filter(x=>x.secondRowWinner);
		let thirdRowWinner = await claimPrizes.filter(x=>x.thirdRowWinner==1);
		let fullHousiWinner = await claimPrizes.filter(x=>x.fullHousiWinner);
		
  
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
		if(numbss==0){
		  firstLineRank.push({
			rank: iterator.firstLine[index].firstCol,
			amount: iterator.firstLine[index].thirdCol
			// [rank]: firstLineAmount
		  })
		}
		else{
		  for(let i=0;i<numbss+1;i++){
			// console.log("came in")
			firstLineRank.push({
			  rank: iterator.firstLine[index].firstCol+i,
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
		if(numbss==0){
		  secondLineRank.push({
			rank: iterator.secondLine[index].firstCol,
			amount: iterator.secondLine[index].thirdCol
			// [rank]: secondLineAmount
		  })
		}
		else{
		  for(let i=0;i<numbss+1;i++){
			// console.log("came in")
			secondLineRank.push({
			  rank: iterator.secondLine[index].firstCol+i,
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
		if(numbss==0){
		  thirdLineRank.push({
			rank: iterator.thirdLine[index].firstCol,
			amount: iterator.thirdLine[index].thirdCol
			// [rank]: thirdLineAmount
		  })
		}
		else{
		  for(let i=0;i<numbss+1;i++){
			// console.log("came in")
			thirdLineRank.push({
			  rank: iterator.thirdLine[index].firstCol+i,
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
		if(numbss==0){
		  fullHousieRank.push({
			rank: iterator.fullHousie[index].firstCol,
			amount: iterator.fullHousie[index].thirdCol
			// [rank]: fullHousieAmount
		  })
		}
		else{
		  for(let i=0;i<numbss+1;i++){
			// console.log("came in")
			fullHousieRank.push({
			  rank: iterator.fullHousie[index].firstCol+i,
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
		if(numbss==0){
		  cornerRank.push({
			rank: iterator.fourCorners[index].firstCol,
			amount: iterator.fourCorners[index].thirdCol
			// [rank]: fourCornersAmount
		  })
		}
		else{
		  for(let i=0;i<numbss+1;i++){
			// console.log("came in")
			cornerRank.push({
			  rank: iterator.fourCorners[index].firstCol+i,
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
		if(numbss==0){
		  jldiRank.push({
			rank: iterator.jaldiFive[index].firstCol,
			amount: iterator.jaldiFive[index].thirdCol
			// [rank]: jaldiFiveAmount
		  })
		}
		else{
		  for(let i=0;i<numbss+1;i++){
			// console.log("came in")
			jldiRank.push({
			  rank: iterator.jaldiFive[index].firstCol+i,
			  amount: iterator.jaldiFive[index].thirdCol
			  // [rank]: firstLineAmount
			})
		  }
		}
	  }
	  
	  for(let i=0;i<firstRowWinner.length;i++){
		firstRowWinner[i].winCashh = firstLineRank[i].amount;
	  }
	  console.log(thirdRowWinner)
	  for(let i=0;i<secondRowWinner.length;i++){
		secondRowWinner[i].winCashh = secondLineRank[i].amount;
	  }
	  for(let i=0;i<thirdRowWinner.length;i++){
		thirdRowWinner[i].winCashh = thirdLineRank[i].amount;
	  }
	  for(let i=0;i<fullHousiWinner.length;i++){
		fullHousiWinner[i].winCashh = fullHousieRank[i].amount;
	  }
	  for(let i=0;i<cornerWinner.length;i++){
		cornerWinner[i].winCashh = cornerRank[i].amount;
	  }
	  for(let i=0;i<jaldiWinner.length;i++){
		jaldiWinner[i].winCashh = jldiRank[i].amount;
	  }
  
  let lastData = [...firstRowWinner,...secondRowWinner,...thirdRowWinner,...fullHousiWinner,...cornerWinner,...jaldiWinner];
  
  
  
  
		for(let i=0;i<lastData.length;i++){
		  let eachUser = lastData[i];
		  let updatePrize = await prizes.updateOne({_id:eachUser._id},{prize:eachUser.winCashh});
		  let updatedUser = await user.updateOne({_id:eachUser.userId},{$inc:{winAmount: eachUser.winCashh}})
		}
    }

    socket.on("playGame", async (data) => {
      // data need to send. Send it like this in data object
      // {
      //   "ticketId": "6246cd3fa6368f945bf42fa5",
      //   "userId": "622c8309203d2a4052c0216a",
      //    "gameId": "11001"
      //   "lineIndex": "0",
      //   "numberIndex": "0"
      //    "selectedNumber": 45 // send in number only
      // }
      let fullHouseRowCount = false;
      if (process.env.logging) console.log("data in play game=======>", data);

      const getUserTicket = await user
        .findById(data.userId)
        .select("tickets name")
        .lean();
      if (process.env.logging)
        console.log("getUserTicket====> ", getUserTicket);

      const getCurrentTicketIndex = getUserTicket.tickets.findIndex(
        (x) => x._id.toString() === data.ticketId
      );
      if (process.env.logging)
        console.log("getCurrentTicketIndex❌❌ ", getCurrentTicketIndex);

      const sendNumbers = await gameRecords
        .findOne({ gameId: data.gameId })
        .lean(); // check if number is send to user exists or not
      const arrayOfNumbers = sendNumbers.numbersSend;
      // const finalArray = arrayOfNumbers.find(function (obj) {
      //   if (obj == data.selectedNumber) return true
      //   else return false
      // });
      // const lastNumber = arrayOfNumbers[arrayOfNumbers.length - 1]
      const isNumberSend = arrayOfNumbers.findIndex(
        (x) => x.sendNumber === parseInt(data.selectedNumber)
      );
      if (isNumberSend === -1) {
        io.to(socket.id).emit("playGame", {
          success: false,
          msg: "You have crossed wrong number.",
        });
        return false;
      }
      const list = await user.updateOne(
        {
          _id: objectId(data.userId),
          ["tickets." +
          getCurrentTicketIndex +
          ".ticket." +
          data.lineIndex +
          "." +
          data.numberIndex +
          ""]: parseInt(data.selectedNumber),
        },
        {
          $set: {
            ["tickets." +
            getCurrentTicketIndex +
            ".ticket." +
            data.lineIndex +
            "." +
            data.numberIndex +
            ""]: 0,
          },
        }
      );
      if (process.env.logging) console.log("list======>", list);
      if (list.modifiedCount == 1) {
        const isExist = await numberCross
          .findOne({
            gameId: data.gameId,
            ticketId: data.ticketId,
            userId: data.userId,
          })
          .lean();
        if (!isExist) {
          const cross_time =new Date();
          const createRec = new numberCross({
            userId: data.userId,
            ticketId: data.ticketId,
            numbersCrossed: [data.selectedNumber],
            numbersCrossed_admin:[
              {
                number: data.selectedNumber,
                timestamp: cross_time

              }
            ],
            gameId: data.gameId,
          });
          await createRec.save();
        } else {
          const cross_time =new Date();
          await numberCross.updateOne(
            { ticketId: data.ticketId },
            {
              $push: { numbersCrossed: data.selectedNumber },
            },
            {
              $push: { numbersCrossed_admin:
                {
                  number: data.selectedNumber,
                  timestamp: cross_time
  
                }
               },
            }
          );
        }
        io.to(socket.id).emit("playGame", { success: true });
      }

      // checking for row house
      const tickets = await user.aggregate([
        { $match: { "tickets.gameId": data.gameId } },
        { $unwind: "$tickets" },
        { $unwind: "$tickets.gameId" },

        {
          $match: {
            _id: objectId(data.userId),
            "tickets._id": objectId(data.ticketId),
          },
        },
        { $project: { _id: 1, tickets: 1 } },
      ]);
      console.log("tickets in row house=========>", tickets);
      //checking for full house
      const ticketsArray = tickets[0].tickets.ticket;
      if (process.env.logging)
        console.log("ticketsArray=======>", ticketsArray);
      for (let index = 0; index < ticketsArray.length; index++) {
        const isRowComplete = ticketsArray[index].find((x) => x > 0);
        if (isRowComplete) {
          fullHouseRowCount = true;
          break;
        }
      }
      if (!fullHouseRowCount) {
        if (process.env.logging) console.log("into full house");
        io.to(socket.id).emit("playGame", {
          msg: `${getUserTicket.name}Congratulations! You have completed Full House.`,
          claimType: "fullHousie",
          ticketId: data.ticketId,
          gameId: data.gameId,
          userId: data.userId,
        });
        return true;
      }
      if (process.env.logging) console.log("after break======>");
      const isRowCompleted = tickets[0].tickets.ticket[data.lineIndex].find(
        (x) => x > 0
      );
      if (process.env.logging)
        console.log("isRowCompleted======>", isRowCompleted);

      if (!isRowCompleted) {
        let claimType;
        if (data.lineIndex === 0) {
          claimType = "firstRow";
        }
        if (data.lineIndex === 1) {
          claimType = "secondRow";
        }
        if (data.lineIndex === 2) {
          claimType = "thirdRow";
        }
        io.to(socket.id).emit("playGame", {
          msg: `${getUserTicket.name} has completed the ${data.lineIndex} row`,
          lineIndex: data.lineIndex,
          claimType: claimType,
          ticketId: data.ticketId,
          gameId: data.gameId,
          userId: data.userId,
        });
        return true;
      }
      if (process.env.logging)
        console.log("isRowCompleted=====>", isRowCompleted);
      return true;
    });

    socket.on("disconnect", async (reason) => {
      try{
      if (process.env.logging)
        console.log("<=====================disconnect called =======================>", socket.id);
        console.log(reason);
      // remove user details from userDetails Array

      return;
      const isExist = userDetails.findIndex((x) => x.socketId === socket.id);
      if (isExist > -1) {
        userDetails.splice(isExist, 1);
      }
      const getGame = await client.get(socket.id.toString());
      console.log("gaa",getGame);
      if (getGame) {
        const gameIdUser = JSON.parse(getGame);
        const getRoomUser = await client.get(gameIdUser);

        if (getRoomUser) {
          const getUsers = JSON.parse(getRoomUser);
          const getCurrentUserIndex = getUsers.findIndex(
            (x) => x.socketId == socket.id
          );
          let userDetails;
          try{
            console.log("inside --- ",getUsers);
            console.log(getCurrentUserIndex);
            console.log(getUsers[getCurrentUserIndex]);
           userDetails = getUsers[getCurrentUserIndex].userId;
          }catch(errr){
            console.log("in err",errr);
          }
          console.log("detailsss-----",userDetails)
          getUsers.splice(getCurrentUserIndex, 1);
          await client.set(gameIdUser.toString(), JSON.stringify(getUsers));
          io.sockets
            .in(gameIdUser)
            .emit("disconnectMessage", {
              msg: `${userDetails} has disconnected from the game`,
            });
        }
      }
    }catch(err){
       console.log("errrrr",err)
    }
    });

    //Edit ticket before game starts
    socket.on("editTicket", async (data) => {
      //   "ticketId": "6246cd3fa6368f945bf42fa5",
      //   "userId": "622c8309203d2a4052c0216a",
      //   "lineIndex": "0",
      //   "numberIndex": "0"
      //    "selectedNumber": 45 // send in number only
      // updatedNumber: 46

      if (process.env.logging) console.log("data in play game=======>", data);

      const getUserTicket = await user
        .findById(data.userId)
        .select("tickets name")
        .lean();
      if (process.env.logging)
        console.log("getUserTicket====> ", getUserTicket);

      const getCurrentTicketIndex = getUserTicket.tickets.findIndex(
        (x) => x._id.toString() === data.ticketId
      );
      if (process.env.logging)
        console.log("getCurrentTicketIndex❌❌ ", getCurrentTicketIndex);

      const list = await user.updateOne(
        {
          _id: objectId(data.userId),
          ["tickets." +
          getCurrentTicketIndex +
          ".ticket." +
          data.lineIndex +
          "." +
          data.numberIndex +
          ""]: parseInt(data.selectedNumber),
        },
        {
          $set: {
            ["tickets." +
            getCurrentTicketIndex +
            ".ticket." +
            data.lineIndex +
            "." +
            data.numberIndex +
            ""]: parseInt(data.updatedNumber),
          },
        }
      );
      const ticketAuditUpdate = await ticketAudit.updateOne(
        {  userId: data.userId,
          ticketId:data.ticketId,
          ["tickets." +
            data.lineIndex +
            "." +
            data.numberIndex +
            ""]: parseInt(data.selectedNumber),
        },
        {
          $set: {
            ["tickets." +
            data.lineIndex +
            "." +
            data.numberIndex +
            ""]: parseInt(data.updatedNumber),
          },
        }
      )

      if (process.env.logging) console.log("list======>", list);
      if (list.modifiedCount === 1) {
        io.to(socket.id).emit("editTicket", {
          msg: "You have successfully updated your number",
          status: true,
        });
        return true;
      } else {
        io.to(socket.id).emit("editTicket", {
          msg: "Something went wrong",
          status: false,
        });
        return false;
      }
    });

    socket.on("getQuestionsReponse", async (data) => {
      // questionId,
      // gameId,
      // userId,
      // userSelectedOption
      if (process.env.logging)
        console.log("data in get Questions response", data);
      const isGameValid = await games.findById(data.gameId).lean();

      if (!isGameValid) {
        io.to(socket.id).emit("getQuestionsReponse", {
          msg: "Game Doesnt exist",
        });
      }

      const getQuestions = await questions.aggregate([
        { $match: { name: isGameValid.questionSet } },
        { $project: { question: 1 } },
        { $unwind: "$question" },
      ]);

      const getYourQuestion = getQuestions.find(
        (x) => x.question._id.toString() == data.questionId
      );

      if (
        getYourQuestion.question.answer == data.userSelectedOption.toString()
      ) {
        io.to(socket.id).emit("getQuestionsReponse", { success: true });
        return true;
      } else {
        io.to(socket.id).emit("getQuestionsReponse", { success: false });
        return true;
      }
    });
    socket.on("test", async () => {
      console.log("heee");
      if (process.env.logging) console.log("test socket called======>");
      io.to(socket.id).emit("test", { msg: "You got the socket Response" });
    });

    socket.on("claimPrize", async (data) => {
      console.log("inside claim prize soccc ------------")
      //claimType
      // firstLineWinners, secondLineWinners, thirdLineWinners, fullHousieWinners, jldiWinners, cornerWinners
      // roomId, userId, ticketId
      const ticketExist = await winners
        .findOne({ ticketId: data.ticketId })
        .lean();
      const isGameExist = await games.findOne({ _id: data.roomId }).lean();
      if (!isGameExist) {
        io.to(socket.id).emit("claimPrize", {
          msg: "Game Do not exists. Please contact with admin",
        });
        return false;
      }
      const users = await user.findOne({ _id: data.userId }).lean();
      const firstLineCount = isGameExist.firstLineWinners;
      const secondLineCount = isGameExist.secondLineWinners;
      const thirdLineCount = isGameExist.thirdLineWinners;
      const fullHouseCount = isGameExist.fullHousieWinners;
      const jldiCount = isGameExist.jaldiWinners;
      const cornerCount = isGameExist.cornerWinners;

      if (data.claimType === "firstLineWinners") {
        const getClaimStatus = await claimsPrize
          .findOne({ gameId: data.roomId })
          .select("firstLineWinners")
          .lean();
        if (getClaimStatus.firstLineWinners < isGameExist.firstLineWinners) {
          const claimCount = await prizes.find({ticketId:data.ticketId,gameId:data.roomId,firstRowWinner:1}).count()
          if(claimCount==0){
          let insertPrizes = new prizes({gameId:data.roomId,userId:objectId(data.userId),firstRowWinner:1,prize:isGameExist.firstLinePrizeAmount,ticketId:data.ticketId})
          await insertPrizes.save();
          await claimsPrize.updateOne(
            { gameId: data.roomId },
            {
              $inc: { firstLineWinners: 1 },
              $push: {
                firstLineClaimWinner: data.userId,
              },
            }
          );
          if (!ticketExist) {
            const createWinner = new winners({
              userId: data.userId,
              gameId: data.roomId,
              ticketId: data.ticketId,
              firstRow: true,
            });
            await createWinner.save();
          } else {
            await winners.updateOne(
              { _id: ticketExist._id },
              {
                firstRow: true,
              }
            );
          }
        }
          const getCount = await claimsPrize
            .findOne({ gameId: data.roomId })
            .select(
              "firstLineWinners secondLineWinners thirdLineWinners fullHousieWinners"
            )
            .lean();
          io.to(socket.id).emit("claimPrize", {
            msg: `Congratulations! ${users.name}.You have successfully claimed First Line`,
            firstLineCountRemaining:
              parseInt(firstLineCount) - parseInt(getCount.firstLineWinners),
            secondLineCountRemaining:
              parseInt(secondLineCount) - parseInt(getCount.secondLineWinners),
            thirdLineCountRemaining:
              parseInt(thirdLineCount) - parseInt(getCount.thirdLineWinners),
            fullHouseCountRemaining:
              parseInt(fullHouseCount) - parseInt(getCount.fullHousieWinners),
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return true;
        } else {
          io.to(socket.id).emit("claimPrize", {
            msg: `You can not claim first Line Winners because maximum limit reached`,
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return false;
        }
      } else if (data.claimType === "secondLineWinners") {
        const getClaimStatus = await claimsPrize
          .findOne({ gameId: data.roomId })
          .select("secondLineWinners")
          .lean();
        if (getClaimStatus.secondLineWinners < isGameExist.secondLineWinners) {
          const claimCount = await prizes.find({ticketId:data.ticketId,gameId:data.roomId,secondRowWinner:1}).count()
          if(claimCount==0){
          let insertPrizes = new prizes({gameId:data.roomId,userId:objectId(data.userId),secondRowWinner:1,prize:isGameExist.secondLinePrizeAmount,ticketId:data.ticketId});
          await insertPrizes.save();
          await claimsPrize.updateOne(
            { gameId: data.roomId },
            {
              $inc: { secondLineWinners: 1 },
              $push: {
                secondLineClaimWinner: data.userId,
              },
            }
          );
          if (!ticketExist) {
            const createWinner = new winners({
              userId: data.userId,
              gameId: data.roomId,
              ticketId: data.ticketId,
              secondRow: true,
            });
            await createWinner.save();
          } else {
            await winners.updateOne(
              { _id: ticketExist._id },
              {
                secondRow: true,
              }
            );
          }
        }
          const getCount = await claimsPrize
            .findOne({ gameId: data.roomId })
            .select(
              "firstLineWinners secondLineWinners thirdLineWinners fullHousieWinners"
            )
            .lean();
          io.to(socket.id).emit("claimPrize", {
            msg: `Congratulations! ${users.name}.You have successfully claimed Second Line`,
            firstLineCountRemaining:
              parseInt(firstLineCount) - parseInt(getCount.firstLineWinners),
            secondLineCountRemaining:
              parseInt(secondLineCount) - parseInt(getCount.secondLineWinners),
            thirdLineCountRemaining:
              parseInt(thirdLineCount) - parseInt(getCount.thirdLineWinners),
            fullHouseCountRemaining:
              parseInt(fullHouseCount) - parseInt(getCount.fullHousieWinners),
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return true;
        } else {
          io.to(socket.id).emit("claimPrize", {
            msg: `You can not claim second Line Winners because maximum limit reached`,
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return false;
        }
      } else if (data.claimType === "thirdLineWinners") {
        const getClaimStatus = await claimsPrize
          .findOne({ gameId: data.roomId })
          .select("thirdLineWinners")
          .lean();
        if (getClaimStatus.thirdLineWinners < isGameExist.thirdLineWinners) {
          const claimCount = await prizes.find({ticketId:data.ticketId,gameId:data.roomId,thirdRowWinner:1}).count()
          if(claimCount==0){
          let insertPrizes = new prizes({gameId:data.roomId,userId:objectId(data.userId),thirdRowWinner:1,prize:isGameExist.thirdLinePrizeAmount,ticketId:data.ticketId});
          await insertPrizes.save();
          await claimsPrize.updateOne(
            { gameId: data.roomId },
            {
              $inc: { thirdLineWinners: 1 },
              $push: {
                thirdLineClaimWinner: data.userId,
              },
            }
          );
          if (!ticketExist) {
            const createWinner = new winners({
              userId: data.userId,
              gameId: data.roomId,
              ticketId: data.ticketId,
              thirdRow: true,
            });
            await createWinner.save();
          } else {
            await winners.updateOne(
              { _id: ticketExist._id },
              {
                thirdRow: true,
              }
            );
          }
        }
          const getCount = await claimsPrize
            .findOne({ gameId: data.roomId })
            .select(
              "firstLineWinners secondLineWinners thirdLineWinners fullHousieWinners"
            )
            .lean();
          io.to(socket.id).emit("claimPrize", {
            msg: `Congratulations! ${users.name}.You have successfully claimed Third Line`,
            firstLineCountRemaining:
              parseInt(firstLineCount) - parseInt(getCount.firstLineWinners),
            secondLineCountRemaining:
              parseInt(secondLineCount) - parseInt(getCount.secondLineWinners),
            thirdLineCountRemaining:
              parseInt(thirdLineCount) - parseInt(getCount.thirdLineWinners),
            fullHouseCountRemaining:
              parseInt(fullHouseCount) - parseInt(getCount.fullHousieWinners),
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return true;
        } else {
          io.to(socket.id).emit("claimPrize", {
            msg: `You can not claim third Line Winners because maximum limit reached`,
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return false;
        }
      } else if (data.claimType === "fullHousieWinners") {
        const getClaimStatus = await claimsPrize
          .findOne({ gameId: data.roomId })
          .select("fullHousieWinners")
          .lean();
        if (getClaimStatus.fullHousieWinners < isGameExist.fullHousieWinners) {
          const claimCount = await prizes.find({ticketId:data.ticketId,gameId:data.roomId,fullHousiWinner:1}).count()
          if(claimCount==0){
          let insertPrizes = new prizes({gameId:data.roomId,userId:objectId(data.userId),fullHousiWinner:1,prize:isGameExist.fullHousiePrizeAmount,ticketId:data.ticketId});
          await insertPrizes.save();
          await claimsPrize.updateOne(
            { gameId: data.roomId },
            {
              $inc: { fullHousieWinners: 1 },
              $push: {
                fullHouseClaimWinner: data.userId,
              },
            }
          );
          const createWinner = new winners({
            userId: data.userId,
            gameId: data.roomId,
            ticketId: data.ticketId,
            fullHouse: true,
          });
          await createWinner.save();
          if (!ticketExist) {
            const createWinner = new winners({
              userId: data.userId,
              gameId: data.roomId,
              ticketId: data.ticketId,
              fullHouse: true,
            });
            await createWinner.save();
          } else {
            await winners.updateOne(
              { _id: ticketExist._id },
              {
                fullHouse: true,
              }
            );
          }
        }
          const getCount = await claimsPrize
            .findOne({ gameId: data.roomId })
            .select(
              "firstLineWinners secondLineWinners thirdLineWinners fullHousieWinners"
            )
            .lean();
          io.to(socket.id).emit("claimPrize", {
            msg: `Congratulations! ${users.name}. You have successfully claimed Full House`,
            firstLineCountRemaining:
              parseInt(firstLineCount) - parseInt(getCount.firstLineWinners),
            secondLineCountRemaining:
              parseInt(secondLineCount) - parseInt(getCount.secondLineWinners),
            thirdLineCountRemaining:
              parseInt(thirdLineCount) - parseInt(getCount.thirdLineWinners),
            fullHouseCountRemaining:
              parseInt(fullHouseCount) - parseInt(getCount.fullHousieWinners),
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return true;
        } else {
          io.to(socket.id).emit("claimPrize", {
            msg: `You can not claim full house because maximum limit reached`,
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return false;
        }
      } else if (data.claimType === "jldiWinners") {
        const getClaimStatus = await claimsPrize
          .findOne({ gameId: data.roomId })
          .select("jaldiWinners")
          .lean();
        if (getClaimStatus.jaldiWinners < isGameExist.jaldiWinners) {
          const claimCount = await prizes.find({ticketId:data.ticketId,gameId:data.roomId,jaldiWinner:1}).count()
          if(claimCount==0){
            let insertPrizes = new prizes({gameId:data.roomId,userId:objectId(data.userId),jaldiWinner:1,prize:isGameExist.jaldiPrizeAmount,ticketId:data.ticketId});
            await insertPrizes.save();
            await claimsPrize.updateOne(
              { gameId: data.roomId },
              {
                $inc: { jaldiWinners: 1 },
                $push: {
                  jaldiClaimWinners: data.userId,
                },
              }
            );
            if (!ticketExist) {
              const createWinner = new winners({
                userId: data.userId,
                gameId: data.roomId,
                ticketId: data.ticketId,
                jldi: true,
              });
              await createWinner.save();
            } else {
              await winners.updateOne(
                { _id: ticketExist._id },
                {
                  jldi: true,
                }
              );
            }

          }
          const getCount = await claimsPrize
            .findOne({ gameId: data.roomId })
            .select(
              "firstLineWinners secondLineWinners thirdLineWinners fullHousieWinners jaldiWinners cornerWinners"
            )
            .lean();
          io.to(socket.id).emit("claimPrize", {
            msg: `Congratulations! ${users.name}. You have successfully claimed Jaldi win`,
            firstLineCountRemaining:
              parseInt(firstLineCount) - parseInt(getCount.firstLineWinners),
            secondLineCountRemaining:
              parseInt(secondLineCount) - parseInt(getCount.secondLineWinners),
            thirdLineCountRemaining:
              parseInt(thirdLineCount) - parseInt(getCount.thirdLineWinners),
            fullHouseCountRemaining:
              parseInt(fullHouseCount) - parseInt(getCount.fullHousieWinners),
            jldiCountRemaning:
              parseInt(jldiCount) - parseInt(getCount.jaldiWinners),
            cornerCountRemaining:
              parseInt(cornerCount) - parseInt(getCount.cornerWinners),
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return true;
        } else {
          io.to(socket.id).emit("claimPrize", {
            msg: `You can not claim Jaldi Win because maximum limit reached`,
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return false;
        }
      } else if (data.claimType === "cornerWinners") {
        const getClaimStatus = await claimsPrize
          .findOne({ gameId: data.roomId })
          .select("cornerWinners")
          .lean();
        if (getClaimStatus.cornerWinners < isGameExist.cornerWinners) {
          const claimCount = await prizes.find({ticketId:data.ticketId,gameId:data.roomId,cornerWinner:1}).count()
          if(claimCount==0){
          let insertPrizes = new prizes({gameId:data.roomId,userId:objectId(data.userId),cornerWinner:1,prize:isGameExist.cornerPrizeAmount,ticketId:data.ticketId});
          await insertPrizes.save();
          await claimsPrize.updateOne(
            { gameId: data.roomId },
            {
              $inc: { cornerWinners: 1 },
              $push: {
                cornersClaimWinner: data.userId,
              },
            }
          );
          if (!ticketExist) {
            const createWinner = new winners({
              userId: data.userId,
              gameId: data.roomId,
              ticketId: data.ticketId,
              corner: true,
            });
            await createWinner.save();
          } else {
            await winners.updateOne(
              { _id: ticketExist._id },
              {
                corner: true,
              }
            );
          }
        }
          const getCount = await claimsPrize
            .findOne({ gameId: data.roomId })
            .select(
              "firstLineWinners secondLineWinners thirdLineWinners fullHousieWinners jaldiWinners cornerWinners"
            )
            .lean();
          io.to(socket.id).emit("claimPrize", {
            msg: `Congratulations! ${users.name}. You have successfully claimed four corner win`,
            firstLineCountRemaining:
              parseInt(firstLineCount) - parseInt(getCount.firstLineWinners),
            secondLineCountRemaining:
              parseInt(secondLineCount) - parseInt(getCount.secondLineWinners),
            thirdLineCountRemaining:
              parseInt(thirdLineCount) - parseInt(getCount.thirdLineWinners),
            fullHouseCountRemaining:
              parseInt(fullHouseCount) - parseInt(getCount.fullHousieWinners),
            jldiCountRemaning:
              parseInt(jldiCount) - parseInt(getCount.jaldiWinners),
            cornerCountRemaining:
              parseInt(cornerCount) - parseInt(getCount.cornerWinners),
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return true;
        } else {
          io.to(socket.id).emit("claimPrize", {
            msg: `You can not claim four corner because maximum limit reached`,
            ticketId: data.ticketId,
            userId: data.userId,
            gameId: data.roomId,
          });
          return false;
        }
      }
    });

    socket.on("checkGameStatus", async (data) => {
      // Data need to pass
      // gameId
      const checkStatus = await gameRecords
        .findOne({ gameId: data.gameId })
        .lean();
      if (checkStatus) {
        if (checkStatus.status === "started") {
          io.to(socket.id).emit("checkGameStatus", {
            msg: "Game Already Started",
            gameStartStatus: true,
            gameCompletedStatus: false,
            gameId: data.gameId,
          });
        } else if (checkStatus.status === "completed") {
          io.to(socket.id).emit("checkGameStatus", {
            msg: "Game Completed",
            gameStartStatus: true,
            gameCompletedStatus: true,
            gameId: data.gameId,
          });
        }
        return true;
      } else {
        io.to(socket.id).emit("checkGameStatus", {
          msg: "Game not started",
          gameStartStatus: false,
          gameCompletedStatus: false,
          gameId: data.gameId,
        });
        return false;
      }
    });

    socket.on("winningStatus", async (data) => {
      // data need to send
      // gameId

      const isGameExist = await games.findById(data.gameId).lean();
      if (!isGameExist || isGameExist == null) {
        io.to(socket.id).emit("checkGameStatus", { msg: "Game Not exist" });
        return false;
      }
      const checkClaimsCount = await claimsPrize
        .findOne({ gameId: data.gameId })
        .lean();

      const firstLineCount =
        isGameExist.firstLineWinners - checkClaimsCount.firstLineWinners;
      const secondLineCount =
        isGameExist.secondLineWinners - checkClaimsCount.secondLineWinners;
      const thirdLineCount =
        isGameExist.thirdLineWinners - checkClaimsCount.thirdLineWinners;
      const fullHousieCount =
        isGameExist.fullHousieWinners - checkClaimsCount.fullHousieWinners;
      const jaldiWinnersCount =
        isGameExist.jaldiWinners - checkClaimsCount.jaldiWinners;
      const cornerWinnersCount =
        isGameExist.cornerWinners - checkClaimsCount.cornerWinners;

        if((Number(firstLineCount) + Number(secondLineCount) + Number(thirdLineCount) + Number(fullHousieCount) + Number(jaldiWinnersCount) + Number(cornerWinnersCount)) == 0) {
          gameNumbers.test2(data.gameId);
        }

      io.sockets.in(data.gameId).emit("winningStatus", {
        gameId: data.gameId,
        totalFirstLineCount: isGameExist.firstLineWinners,
        totalSecondLineCount: isGameExist.secondLineWinners,
        totalThirdLineCount: isGameExist.thirdLineWinners,
        totalfullHousieCount: isGameExist.fullHousieWinners,
        remainingFirstLine: firstLineCount,
        remainingSecondLine: secondLineCount,
        remainingThirdLine: thirdLineCount,
        remainingFullHousie: fullHousieCount,
        remainingJldi: jaldiWinnersCount,
        remainingCorner: cornerWinnersCount,
        totalCornerCount: isGameExist.cornerWinners,
        totalJldiCount: isGameExist.jaldiWinners,
      });
    });

    socket.on("lastFiveNumbers", async (data) => {
      // data need to send
      // gameId
      // currentNumber

      const getNumbers = await gameRecords
        .findOne({ gameId: data.gameId })
        .select("numbersSend")
        .lean();
      if (getNumbers && data.currentNumber) {
        const currentNumIndex = getNumbers.numbersSend.findIndex(
          (x) => x.sendNumber === parseInt(data.currentNumber)
        );
        if (currentNumIndex > -1) {
          getNumbers.numbersSend.splice(currentNumIndex, 1);
        }
        let numbers = getNumbers.numbersSend.slice(-5);
        // console.log("last five ----------",numbers)
        numbers = numbers.reduce((fin,ind)=>{
          return [...fin,ind.sendNumber]
        },[])
        io.sockets.in(data.gameId).emit("lastFiveNumbers", {
          numbers: numbers,
        });
      } else {
        let numbers = getNumbers.numbersSend.slice(-5);
        // console.log("last five ----------",numbers)
        numbers = numbers.reduce((fin,ind)=>{
          return [...fin,ind.sendNumber]
        },[])
        io.sockets.in(data.gameId).emit("lastFiveNumbers", {
          numbers: numbers,
        });
      }
    });

}

module.exports = request