const leader = require('../helper/leaderboard');
const router = require("express").Router();
const leaderBoard = new leader()

router.get('/:gameId/:claimType', leaderBoard.getGameLeaderBoard);
router.get('/:gameId/:userId/:claimType/v1', leaderBoard.getGameLeaderBoardv1);

router.post('/getGameNumbers/:gameId', leaderBoard.getGameNumbers);
module.exports = router