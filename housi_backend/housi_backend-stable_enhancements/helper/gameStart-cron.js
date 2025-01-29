const moment = require('moment')
const gameModel = require('../models/games')
const gameRecords = require('../models/gameNumbers.model')
const users = require('../models/users')
const gameClaim = require('../models/claim-prize.model')
const winners = require('../models/winners')

module.exports = gameStart = (socket, io) => {

  let CronJob = require('cron').CronJob;
  let job = new CronJob('* * * * *', async function () {
    console.log('gameStart service started 🔥  ');
    let gamePrizeFirstLine = 0
    let gamePrizeSecondLine = 0
    let gamePrizeThirdLine = 0
    let gamePrizeFullHousie = 0
    let gamePrizeCorner = 0
    let gamePrizeJldi = 0
    const gameClaims = await gameRecords.find({ status: 'completed', claimStatus: false }).lean();

    if (gameClaim.length === 0) {
      return true
    } else {

      for (const iterator of gameClaims) {
        const gameDetails = await gameModel.findOne({ _id: iterator.gameId }).lean()
        const claimStatus = await gameClaim.findOne({ gameId: iterator.gameId }).lean();
        if (claimStatus) {
          // for first line win amount
          if (claimStatus.firstLineClaimWinner.length > 0) {
            gamePrizeFirstLine = parseFloat(gameDetails.firstLinePrizeAmount / claimStatus.firstLineClaimWinner.length)
            await gameClaim.updateOne({ gameId: iterator.gameId }, {
              firstLinePerHeadWinAmount: gamePrizeFirstLine
            })
          }
          // for second line win amount
          if (claimStatus.secondLineClaimWinner.length > 0) {
            gamePrizeSecondLine = parseFloat(gameDetails.secondLinePrizeAmount / claimStatus.secondLineClaimWinner.length)
            await gameClaim.updateOne({ gameId: iterator.gameId }, {
              secondLinePerHeadWinAmount: gamePrizeSecondLine
            })
          }
          // for third line win amount
          if (claimStatus.thirdLineClaimWinner.length > 0) {
            gamePrizeThirdLine = parseFloat(gameDetails.thirdLinePrizeAmount / claimStatus.thirdLineClaimWinner.length)
            await gameClaim.updateOne({ gameId: iterator.gameId }, {
              thirdLinePerHeadWinAmount: gamePrizeThirdLine
            })
          }
          // for full housie win amount
          if (claimStatus.fullHouseClaimWinner.length > 0) {
            gamePrizeFullHousie = parseFloat(gameDetails.fullHousiePrizeAmount / claimStatus.fullHouseClaimWinner.length)
            await gameClaim.updateOne({ gameId: iterator.gameId }, {
              fullHousiePerHeadWinAmount: gamePrizeFullHousie
            })
          }
          // for corner win amount
          if (claimStatus.cornersClaimWinner.length > 0) {
            gamePrizeCorner = parseFloat(gameDetails.cornerPrizeAmount / claimStatus.cornersClaimWinner.length)
            await gameClaim.updateOne({ gameId: iterator.gameId }, {
              cornerPerHeadWinAmount: gamePrizeCorner
            })
          }
          // for jdli win amount
          if (claimStatus.jaldiClaimWinners.length > 0) {
            gamePrizeJldi = parseFloat(gameDetails.jaldiPrizeAmount / claimStatus.jaldiClaimWinners.length)
            await gameClaim.updateOne({ gameId: iterator.gameId }, {
              jldiPerHeadWinAmount: gamePrizeJldi
            })
          }
          // for first line
          for (const x of claimStatus.firstLineClaimWinner) {
            console.log('x in first line=======>', x)
            await winners.updateOne({ gameId: iterator.gameId, userId: x, firstRow: true }, {
              $set: {
                amount: gamePrizeFirstLine
              }
            })
            await users.updateOne({ _id: x }, {
              $inc: { winAmount: gamePrizeFirstLine }
            })
          }
          // for second line
          for (const x of claimStatus.secondLineClaimWinner) {
            await winners.updateOne({ gameId: iterator.gameId, userId: x, secondRow: true }, {
              $set: {
                amount: gamePrizeSecondLine
              }
            })
            await users.updateOne({ _id: x }, {
              $inc: { winAmount: gamePrizeSecondLine }
            })
          }
          // for third line
          for (const x of claimStatus.thirdLineClaimWinner) {
            await winners.updateOne({ gameId: iterator.gameId, userId: x, thirdRow: true }, {
              $set: {
                amount: gamePrizeThirdLine
              }
            })
            await users.updateOne({ _id: x }, {
              $inc: { winAmount: gamePrizeThirdLine }
            })
          }
          // for full housie
          for (const x of claimStatus.fullHouseClaimWinner) {
            await winners.updateOne({ gameId: iterator.gameId, userId: x, fullHouse: true }, {
              $set: {
                amount: gamePrizeFullHousie
              }
            })
            await users.updateOne({ _id: x }, {
              $inc: { winAmount: gamePrizeFullHousie }
            })
          }
          // for corner           
          for (const x of claimStatus.cornersClaimWinner) {
            await winners.updateOne({ gameId: iterator.gameId, userId: x, corner: true }, {
              $set: {
                amount: gamePrizeCorner
              }
            })
            await users.updateOne({ _id: x }, {
              $inc: { winAmount: gamePrizeCorner }
            })
          }
          // for jldi
          for (const x of claimStatus.jaldiClaimWinners) {
            await winners.updateOne({ gameId: iterator.gameId, userId: x, jldi: true }, {
              $set: {
                amount: gamePrizeJldi
              }
            })
            await users.updateOne({ _id: x }, {
              $inc: { winAmount: gamePrizeJldi }
            })
          }
          await gameRecords.updateOne({ gameId: iterator.gameId }, {
            $set: { claimStatus: true }
          })
          return true
        }
      }
    }

  }, null, true, 'Asia/Kolkata');
  job.start();

}
