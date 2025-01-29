const server = require("http").createServer();
const games = require("../models/games");
const user = require("../models/users");
const gameRecords = require("../models/gameNumbers.model");
const socketControllers = require("../controllers/socketControllers");
const questions = require("../models/quiz");
const claimsPrize = require("../models/claim-prize.model");
const winners = require("../models/winners");
const userDetails = [];
const gameCount = [];
const numberCross = require("../models/numbersCrossed.model");
const ticketAudit = require("../models/ticketsAudit.model");
let objectId = require("mongodb").ObjectID;
const io = require("socket.io")(server, {
  // pingTimeout: 60000,
  'pingTimeout': 180000,
    'pingInterval': 25000,
    allowUpgrades: false,
    maxHttpBufferSize: 1e8,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

module.exports.genaralSockets = () => {
  console.log("hello 123");
   io.on("connection", (socket) => {
    console.log("connected socket123");
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
      socket.join(isGameValid._id.toString());
      // user set in redis
      let getGameUsers = await client.get(isGameValid._id.toString());
      if (getGameUsers !== null) {
        const gameUsersData = JSON.parse(getGameUsers);
        gameUsersData.push({ userId: isUserExist._id, socketId: socket.id });
        client.set(isGameValid._id.toString(), JSON.stringify(gameUsersData));
      } else if (getGameUsers === null) {
        getGameUsers = [];
        getGameUsers.push({ userId: isUserExist._id, socketId: socket.id });
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
      const randomNumber = [];
      for (let index = 1; index <= 90; index++) {
        randomNumber.push(index);
      }

      let count = 0;
      if (count === 0) {
        let question;
        const randomConst =
          randomNumber.length === 0 ? 90 : randomNumber.length - 1;
        const numberIndex = Math.floor(Math.random() * randomConst);
        const throwRandomNumber = randomNumber[numberIndex];
        randomNumber.splice(numberIndex, 1);
        count = count + 1;

        question = getQuestion.question[count];
        await gameRecords.updateOne(
          { gameId: data.gameId },
          {
            $push: { numbersSend: throwRandomNumber },
          }
        );
        const timecalulated=await socketControllers.timeCalculate(isGameValid.gameStartDateTime)
        io.sockets
          .in(data.gameId)
          .emit("throwNumbers", {
            Numbers: throwRandomNumber,
            numberCount: count,
            Question: question,
            time:timecalulated
          });
      }
      let timerId = setInterval(async () => {
        console.log("count in interval======>", count);
        let question;
        const randomConst =
          randomNumber.length === 0 ? 90 : randomNumber.length - 1;
        const numberIndex = Math.floor(Math.random() * randomConst);
        const throwRandomNumber = randomNumber[numberIndex];
        randomNumber.splice(numberIndex, 1);
        count = count + 1;
        const timecalulated= await socketControllers.timeCalculate(isGameValid.gameStartDateTime)
        if (count <= 90) {
          question = getQuestion.question[count];
          await gameRecords.updateOne(
            { gameId: data.gameId },
            {
              $push: { numbersSend: throwRandomNumber },
            }
          );
        }
        if (count === 90) {
          await gameRecords.updateOne(
            { gameId: data.gameId },
            {
              $set: { status: "completed" },
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
              numberCount: count,
              Numbers: throwRandomNumber,
              Question: question,
              time:timecalulated
            });
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
              time:timecalulated
              
            });
        }
      }, isGameValid.callTime * 1000);
    });

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
      // if (process.env.logging)
      //   console.log("getUserTicket====> ", getUserTicket);

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
        (x) => x === parseInt(data.selectedNumber)
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
          const createRec = new numberCross({
            userId: data.userId,
            ticketId: data.ticketId,
            numbersCrossed: [data.selectedNumber],
            gameId: data.gameId,
          });
          await createRec.save();
        } else {
          await numberCross.updateOne(
            { ticketId: data.ticketId },
            {
              $push: { numbersCrossed: data.selectedNumber },
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
      if (process.env.logging)
        console.log("<==========================disconnect called ===============>", socket.id);

      console.log(reason);
      return;
      // remove user details from userDetails Array
      // return;
      // const isExist = userDetails.findIndex((x) => x.socketId === socket.id);
      // if (isExist > -1) {
      //   userDetails.splice(isExist, 1);
      // }
      // const getGame = await client.get(socket.id.toString());
      // if (getGame) {
      //   const gameIdUser = JSON.parse(getGame);
      //   const getRoomUser = await client.get(gameIdUser);

      //   if (getRoomUser) {
      //     const getUsers = JSON.parse(getRoomUser);
      //     const getCurrentUserIndex = getUsers.findIndex(
      //       (x) => x.socketId == socket.id
      //     );
      //     const userDetails = getUsers[getCurrentUserIndex].userId;
      //     getUsers.splice(getCurrentUserIndex, 1);
      //     await client.set(gameIdUser.toString(), JSON.stringify(getUsers));
      //     io.sockets
      //       .in(gameIdUser)
      //       .emit("disconnectMessage", {
      //         msg: `${userDetails} has disconnected from the game`,
      //       });
      //   }
      // }
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
          const getCount = await claimsPrize
            .findOne({ gameId: data.roomId })
            .select(
              "firstLineWinners secondLineWinners thirdLineWinners fullHousieWinners jaldiWinners cornerWinners"
            )
            .lean();
          io.to(socket.id).emit("claimPrize", {
            msg: `Congratulations! ${users.name}. You have successfully claimed Jldi win`,
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
            msg: `You can not claim Jldi Win because maximum limit reached`,
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
          const getCount = await claimsPrize
            .findOne({ gameId: data.roomId })
            .select(
              "firstLineWinners secondLineWinners thirdLineWinners fullHousieWinners jaldiWinners cornerWinners"
            )
            .lean();
          io.to(socket.id).emit("claimPrize", {
            msg: `Congratulations! ${users.name}. You have successfully claimed corner win`,
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
            msg: `You can not claim corner because maximum limit reached`,
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
          (x) => x === parseInt(data.currentNumber)
        );
        if (currentNumIndex > -1) {
          getNumbers.numbersSend.splice(currentNumIndex, 1);
        }
        const numbers = getNumbers.numbersSend.slice(-5);
        io.sockets.in(data.gameId).emit("lastFiveNumbers", {
          numbers: numbers,
        });
      } else {
        const numbers = getNumbers.numbersSend.slice(-5);
        io.sockets.in(data.gameId).emit("lastFiveNumbers", {
          numbers: numbers,
        });
      }
    });

    // setInterval(async () => {
    //   let dt = new Date();
    //   let currentTime = new Date().getTime();
    //   console.log("currentTime====>", currentTime);
    //   let nextTime = dt.setMinutes(dt.getMinutes() + 90);
    //   console.log('nextTime========>', nextTime)
    //   const gameId = '11024'
    //   if (process.env.logging) console.log('gameId in throw numbers=========>', gameId)
    //   const isGameValid = await games.find({ gameStartDate: { $gt: currentTime, $lte: nextTime } }).lean();
    //   if (process.env.logging) console.log('isGameValid========>', isGameValid);
    //   if (isGameValid.length === 0) {
    //     return true
    //   }
    //   const getQuestion = await questions.findOne({ name: isGameValid.questionSet }).select('question').lean()

    //   let isGameRecordCreated = await gameRecords.findOne({ gameId: gameId, $or: [{ status: { $eq: 'completed' } }, { status: { $eq: 'started' } }] }).lean();
    //   console.log('isGameRecordCreated==========>', isGameRecordCreated)
    //   if (!isGameRecordCreated) {
    //     const gameRecordSave = new gameRecords({
    //       gameId: gameId,
    //     })
    //     await gameRecordSave.save();
    //   } else if (isGameRecordCreated) {
    //     if (isGameRecordCreated.status === 'started') {
    //       io.to(socket.id).emit('throwNumbers', { msg: 'Game already started. You can receive Numbers By Joining the game.' });
    //     } else {
    //       io.to(socket.id).emit('throwNumbers', { msg: 'Game Already Completed' });
    //     }
    //     return false
    //   }

    //   if (!isGameValid) {
    //     io.sockets.in(gameId).emit('throwNumbers', { msg: `Game doesn't exist Please contact to admin.` })
    //   }
    //   const randomNumber = []
    //   for (let index = 1; index <= 90; index++) {
    //     randomNumber.push(index)
    //   }

    //   let count = 0
    //   let timerId = setInterval(async () => {
    //     let question
    //     count = count + 1
    //     const randomConst = randomNumber.length === 0 ? 90 : randomNumber.length - 1
    //     const numberIndex = Math.floor((Math.random() * randomConst));
    //     const throwRandomNumber = randomNumber[numberIndex]
    //     randomNumber.splice(numberIndex, 1)
    //     if (count <= 90) {

    //       question = getQuestion.question[count]
    //       await gameRecords.updateOne({ gameId: gameId }, {
    //         $push: { numbersSend: throwRandomNumber }
    //       })
    //     }
    //     if (count === 90) {
    //       await gameRecords.updateOne({ gameId: gameId }, {
    //         $set: { status: 'completed' }
    //       })
    //       clearInterval(timerId);
    //       io.sockets.in(gameId).emit('throwNumbers', { msg: 'Game is completed', numberCount: count, Numbers: throwRandomNumber, Question: question })
    //       return true
    //     } else {
    //       if (process.env.logging) console.log('count inc==🛬🛬🛬 ', count, throwRandomNumber)
    //       io.sockets.in(gameId).emit('throwNumbers', { Numbers: throwRandomNumber, numberCount: count, Question: question })
    //     }
    //   }, 1 * 1000);
    // }, 1000 * 1000);
    // console.log("hello")

    socketRoutes(socket, io);
  });
};
