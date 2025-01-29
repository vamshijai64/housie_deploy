const games = require('../models/games');
const gameNumbers = require('../models/gameNumbers.model');
const claimPrize = require('../models/claim-prize.model');
const user = require('../models/users');
const winners = require('../models/winners');
const userController = require('../controllers/userController')
const { log } = require('async');
const numbersCrossedModel = require('../models/numbersCrossed.model')
const Games = require('../models/games');
const prizes = require('../models/prizes.model');
const moment = require('moment');

let objectId = require('mongodb').ObjectID;


async function convertIntoDate(d) {

	return [d.getMonth() + 1,
	d.getDate(),
	d.getFullYear()].join('/') + ' ' +
		[d.getHours(),
		d.getMinutes(),
		d.getSeconds()].join(':')
}
const getUsersByWinning = async (req, res) => {



    let pipeline = [];
    let gamePrize = [];

    pipeline.push({ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } });

    pipeline.push({
        $match: {

            'gameId': req.params.game_id,
            "numbersCrossed.jaldi": true,


        }
    })

    pipeline.push({ $unwind: "$user" });
    pipeline.push({
        $project: {
            'user.name': 1, 'user.email': 1, 'ticketId': 1, 'user._id': 1,'user.profile_image':1,
            "user.tickets": {
                $filter: {
                    input: '$user.tickets',
                    as: 'user_tickets',
                    cond: { $eq: ['$$user_tickets.gameId', req.params.game_id] }
                }
            },
            "numbersCrossed": {
                $filter: {
                    input: '$numbersCrossed',
                    as: 'numbers',
                    cond: { $eq: [`$$numbers.${req.params.type}`, true] }
                }
            }
        }
    }
    );
    if (req.params.type === 'jaldi') {
        // console.log("jaldi");
        gamePrize = await Games.find({ _id: req.params.game_id }, { jaldiFive: 1 }).exec()


        gamePrize.data = gamePrize[0].jaldiFive

    }
    if (req.params.type === 'corners') {
        gamePrize = await Games.find({ _id: req.params.game_id }, { fourCorners: 1 }).exec()
        gamePrize.data = gamePrize[0].fourCorners

    }
    if (req.params.type === 'fullHousie') {
        gamePrize = await Games.find({ _id: req.params.game_id }, { fullHousie: 1 }).exec()
        gamePrize.data = gamePrize[0].fullHousie
    }
    if (req.params.type === 'firstrow') {
        gamePrize = await Games.find({ _id: req.params.game_id }, { firstLine: 1 }).exec()
        gamePrize.data = gamePrize[0].firstLine
    }
    if (req.params.type === 'secondrow') {
        gamePrize = await Games.find({ _id: req.params.game_id }, { secondLine: 1 }).exec()
        gamePrize.data = gamePrize[0].secondLine
    }
    if (req.params.type === 'thirdrow') {
        gamePrize = await Games.find({ _id: req.params.game_id }, { thirdLine: 1 }).exec()
        gamePrize.data = gamePrize[0].thirdLine
    }

    console.log(gamePrize.data, "gamePrize")

    let requests = await numbersCrossedModel.aggregate(pipeline).exec();


    // console.log(requests)

    async function toReturnData(requests) {
        return new Promise((resolve => {
            let semifinal = []
            requests.map(val => {
                val.user.tickets.map((ele, inx) => {

                    if (ele._id == val.ticketId) {



                        semifinal.push({
                            user_id: val.user._id,
                            time: val.numbersCrossed[0].timestamp,
                            name: val.user.name + `(T${inx + 1})`,
							profile:val.user.profile_image,


                            type: val.numbersCrossed[0].data[0].type == 'jaldi' ? 'Jald Five' :
                                val.numbersCrossed[0].data[0].type == 'fullHousie' ? "Full House" :
                                    val.numbersCrossed[0].data[0].type == 'firstrow' ? "1st Row" :
                                        val.numbersCrossed[0].data[0].type == 'secondrow' ? "2nd Row" :
                                            val.numbersCrossed[0].data[0].type == 'thirdrow' ? "3rd Row" :
                                                val.numbersCrossed[0].data[0].type == 'corners' ? "Four Corner" : ""

                        })
                    }
                })
            })

            resolve(semifinal)
        }))
    }

    console.log()

    toReturnData(requests).then(el => {
        el.sort((a, b) => {
            return a.time - b.time
        })

        el.map((item, i) => {
            Object.assign(item, { "rank": i + 1 })
            gamePrize.data.filter(item1 => {
                if (item.rank >= item1.firstCol && item.rank <= item1.secondCol) {
                    return Object.assign(item, { "amount": item1.thirdCol })
                }
            })
        })

        return res.status(200).json({
            title: 'data.',
            error: false,
			status:true,
            details: el
        });
    })






}
const getallUsersByWinning = async (req, res) => {
	// console.log(req.body)
    let pipeline = [];
    pipeline.push({ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } });

    pipeline.push({
        $match: {

            'gameId': req.params.game_id,


        }
    })

    pipeline.push({ $unwind: "$user" });
    pipeline.push({
        $project: {
            'user.name': 1, 'user.email': 1, 'ticketId': 1, 'user._id': 1,'user.profile_image':1,
            "user.tickets": {
                $filter: {
                    input: '$user.tickets',
                    as: 'user_tickets',
                    cond: { $eq: ['$$user_tickets.gameId', req.params.game_id] }
                }
            },
            "numbersCrossed": {
                $filter: {
                    input: '$numbersCrossed',
                    as: 'numbers',
                    cond: {
                        $or: [{ $eq: [`$$numbers.jaldi`, true] }, { $eq: [`$$numbers.fullHousie`, true] }
                            , { $eq: [`$$numbers.firstrow`, true] }, { $eq: [`$$numbers.secondrow`, true] }, { $eq: [`$$numbers.thirdrow`, true] },
                        { $eq: [`$$numbers.corners`, true] }]
                    }
                }
            }
        }
    }
    );
    let requests = await numbersCrossedModel.aggregate(pipeline).exec();

    console.log(requests, "requests")

    let gamePrize = await Games.find({ _id: req.params.game_id }, { fourCorners: 1, jaldiFive: 1, fullHousie: 1, firstLine: 1, secondLine: 1, thirdLine: 1 }).exec()
    // console.log(gamePrize,"gamePrize")
    async function toReturnData(requests) {
        return new Promise((resolve => {
            let semifinal = []
            requests.map(val => {
                val.user.tickets.map((ele, inx) => {

                    if (ele._id == val.ticketId) {

                        val.numbersCrossed.map(rr => {


                            semifinal.push({
                                user_id: val.user._id,
                                time: rr.timestamp,
                                name: val.user.name + `(T${inx + 1})`,
								profile:val.user.profile_image,
                                type: rr.data[0].type == 'jaldi' ? 'Jald Five' :
                                    rr.data[0].type == 'fullHousie' ? "Full House" :
                                        rr.data[0].type == 'firstrow' ? "1st Row" :
                                            rr.data[0].type == 'secondrow' ? "2nd Row" :
                                                rr.data[0].type == 'thirdrow' ? "3rd Row" :
                                                    rr.data[0].type == 'corners' ? "Four Corner" : ""
                            })
                        })



                    }
                })
            })

            resolve(semifinal)
        }))
    }

    toReturnData(requests).then(el => {


        let jaldi = [];
        let fullHousie = [];
        let corners = [];
        let firstrow = [];
        let secondrow = [];
        let thirdrow = []

        el.map(item => {
            if (item.type == "Jald Five") {
                jaldi.push(item)
                jaldi.sort((a, b) => {
                    return a.time - b.time;
                });
                jaldi.map((item, i) => {

                    Object.assign(item, { "rank": i + 1 });
                    gamePrize[0].jaldiFive.filter(item1 => {
                        if (item.rank >= item1.firstCol && item.rank <= item1.secondCol) {
                            Object.assign(item, { "amount": item1.thirdCol })
                        }
                    })


                })

            }
            if (item.type == "Full House") {
                fullHousie.push(item)
                fullHousie.sort((a, b) => {
                    return a.time - b.time;
                });
                fullHousie.map((item, i) => {
                    Object.assign(item, { "rank": i + 1 })
                    gamePrize[0].fullHousie.filter(item1 => {
                        if (item.rank >= item1.firstCol && item.rank <= item1.secondCol) {
                            Object.assign(item, { "amount": item1.thirdCol })
                        }
                    })

                })

            }
            if (item.type == "Four Corner") {
                corners.push(item)
                corners.sort((a, b) => {
                    return a.time - b.time;
                });
                corners.map((item, i) => {
                    Object.assign(item, { "rank": i + 1 })
                    gamePrize[0].fourCorners.filter(item1 => {
                        if (item.rank >= item1.firstCol && item.rank <= item1.secondCol) {
                            Object.assign(item, { "amount": item1.thirdCol })
                        }
                    })

                })

            }
            if (item.type == "1st Row") {
                firstrow.push(item)
                firstrow.sort((a, b) => {
                    return a.time - b.time;
                });
                firstrow.map((item, i) => {
                    Object.assign(item, { "rank": i + 1 })
                    gamePrize[0].firstLine.filter(item1 => {
                        if (item.rank >= item1.firstCol && item.rank <= item1.secondCol) {
                            Object.assign(item, { "amount": item1.thirdCol })
                        }
                    })
                })

            }
            if (item.type == "2nd Row") {
                secondrow.push(item)
                secondrow.sort((a, b) => {
                    return a.time - b.time;
                });
                secondrow.map((item, i) => {
                    Object.assign(item, { "rank": i + 1 })
                    gamePrize[0].secondLine.filter(item1 => {
                        if (item.rank >= item1.firstCol && item.rank <= item1.secondCol) {
                            Object.assign(item, { "amount": item1.thirdCol })
                        }
                    })

                })

            }
            if (item.type == "3rd Row") {
                thirdrow.push(item)
                thirdrow.sort((a, b) => {
                    return a.time - b.time;
                });
                thirdrow.map((item, i) => {
                    Object.assign(item, { "rank": i + 1 })
                    gamePrize[0].thirdLine.filter(item1 => {
                        if (item.rank >= item1.firstCol && item.rank <= item1.secondCol) {
                            return Object.assign(item, { "amount": item1.thirdCol })
                        }
                    })
                })

            }

        })

        console.log(jaldi, fullHousie, corners, firstrow, secondrow, thirdrow, "jaldi")

        let semi = [...jaldi, ...fullHousie, ...corners, ...firstrow, ...secondrow, ...thirdrow]

        semi.sort((a, b) => {
            return a.rank - b.rank;
        });

        return res.status(200).json({
            title: 'data.',
            error: false,
			status:true,
            details: semi
        });
    })

}

class leaderBoards {

	async getGameLeaderBoard(req, res) {
		const claimType = req.params.claimType
		let firstLine = []
		let secondLine = []
		let thirdLine = []
		let fullHousie = []
		let jldi = []
		let corner = []
		const allWinner = []
		const getClaimStatus = await gameNumbers.findOne({ gameId: req.params.gameId}).select('claimStatus').lean();
		console.log(getClaimStatus,"getClaimStatus 	")
		if (getClaimStatus && getClaimStatus !== null && typeof getClaimStatus !== 'undefined') {
			if (getClaimStatus.claimStatus === true) {
				const getClaimWinnerList = await claimPrize.findOne({ gameId: req.params.gameId })
					.populate('firstLineClaimWinner', 'name')
					.populate('secondLineClaimWinner', 'name')
					.populate('thirdLineClaimWinner', 'name')
					.populate('fullHouseClaimWinner', 'name')
					.populate('jaldiClaimWinners', 'name')
					.populate('cornersClaimWinner', 'name')
					.lean();
					console.log(getClaimWinnerList,"getClaimWinnerList")
				if (claimType === 'all') {
					const firstLineWinAmount = getClaimWinnerList.firstLinePerHeadWinAmount
					const secondLineWinAmount = getClaimWinnerList.secondLinePerHeadWinAmount
					const thirdLineWinAmount = getClaimWinnerList.thirdLinePerHeadWinAmount
					const fullHousieWinAmount = getClaimWinnerList.fullHousiePerHeadWinAmount
					const jldiWinAmount = getClaimWinnerList.jldiPerHeadWinAmount
					const cornerWinAmount = getClaimWinnerList.cornerPerHeadWinAmount
					const getWinnerList = await winners.find({ gameId: req.params.gameId })
						.populate('userId', 'name')
						.sort({ amount: -1, createdAt: 1 })
						.lean();
					for (let index = 0; index < getWinnerList.length; index++) {
						let claimTypes
						let prizeAmount
						const convertedDate = await convertIntoDate(getWinnerList[index].createdAt)
						if (getWinnerList[index].firstRow) { claimTypes = 'firstLineWinner', prizeAmount = firstLineWinAmount }
						if (getWinnerList[index].secondRow) { claimTypes = 'secondLineWinner', prizeAmount = secondLineWinAmount }
						if (getWinnerList[index].thirdRow) { claimTypes = 'thirdLineWinner', prizeAmount = thirdLineWinAmount }
						if (getWinnerList[index].fullHouse) { claimTypes = 'fullHousieWinner', prizeAmount = fullHousieWinAmount }
						if (getWinnerList[index].jldi) { claimTypes = 'jldiWinner', prizeAmount = jldiWinAmount }
						if (getWinnerList[index].corner) { claimTypes = 'cornerWinner', prizeAmount = cornerWinAmount }
						allWinner.push({
							rank: index + 1,
							username: getWinnerList[index].userId.name,
							prize: prizeAmount,
							gameId: req.params.gameId,
							userId: getWinnerList[index].userId._id,
							claimType: claimTypes,
							time: convertedDate
						})
					}
					// if (getClaimWinnerList.firstLineClaimWinner.length > 0) {
					// 	for (const iterator of getClaimWinnerList.firstLineClaimWinner) {
					// 		const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id }).select('createdAt').lean();
					// 		const convertedDate = await convertIntoDate(winTime.createdAt)
					// 		const getIndex = getClaimWinnerList.firstLineClaimWinner.findIndex(x => x === iterator)
					// 		firstLine.push({
					// 			rank: getIndex + 1,
					// 			username: iterator.name,
					// 			prize: getClaimWinnerList.firstLinePerHeadWinAmount,
					// 			gameId: req.params.gameId,
					// 			userId: iterator._id,
					// 			claimType: 'firstLineWinners',
					// 			time: convertedDate
					// 		})
					// 	}
					// }
					// if (getClaimWinnerList.secondLineClaimWinner.length > 0) {
					// 	for (const iterator of getClaimWinnerList.secondLineClaimWinner) {
					// 		const getIndex = getClaimWinnerList.secondLineClaimWinner.findIndex(x => x === iterator)
					// 		const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id }).select('createdAt').lean();
					// 		const convertedDate = await convertIntoDate(winTime.createdAt)
					// 		secondLine.push({
					// 			rank: getIndex + 1,
					// 			username: iterator.name,
					// 			prize: getClaimWinnerList.secondLinePerHeadWinAmount,
					// 			gameId: req.params.gameId,
					// 			userId: iterator._id,
					// 			claimType: 'secondLineWinners',
					// 			time: convertedDate
					// 		})
					// 	}
					// }
					// if (getClaimWinnerList.thirdLineClaimWinner.length > 0) {
					// 	for (const iterator of getClaimWinnerList.thirdLineClaimWinner) {
					// 		const getIndex = getClaimWinnerList.thirdLineClaimWinner.findIndex(x => x === iterator)
					// 		const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id }).select('createdAt').lean();
					// 		const convertedDate = await convertIntoDate(winTime.createdAt)
					// 		thirdLine.push({
					// 			rank: getIndex + 1,
					// 			username: iterator.name,
					// 			prize: getClaimWinnerList.thirdLinePerHeadWinAmount,
					// 			gameId: req.params.gameId,
					// 			userId: iterator._id,
					// 			claimType: 'thirdLineWinners',
					// 			time: convertedDate
					// 		})
					// 	}
					// }
					// if (getClaimWinnerList.fullHouseClaimWinner.length > 0) {
					// 	for (const iterator of getClaimWinnerList.fullHouseClaimWinner) {
					// 		const getIndex = getClaimWinnerList.fullHouseClaimWinner.findIndex(x => x === iterator)
					// 		const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id }).select('createdAt').lean();
					// 		const convertedDate = await convertIntoDate(winTime.createdAt)
					// 		fullHousie.push({
					// 			rank: getIndex + 1,
					// 			username: iterator.name,
					// 			prize: getClaimWinnerList.fullHousiePerHeadWinAmount,
					// 			gameId: req.params.gameId,
					// 			userId: iterator._id,
					// 			claimType: 'fullHouseWinners',
					// 			time: convertedDate
					// 		})
					// 	}
					// }
					// if (getClaimWinnerList.cornersClaimWinner.length > 0) {
					// 	for (const iterator of getClaimWinnerList.cornersClaimWinner) {
					// 		const getIndex = getClaimWinnerList.cornersClaimWinner.findIndex(x => x === iterator)
					// 		const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id }).select('createdAt').lean();
					// 		let convertedDate = await convertIntoDate(winTime.createdAt)
					// 		corner.push({
					// 			rank: getIndex + 1,
					// 			username: iterator.name,
					// 			prize: getClaimWinnerList.cornerPerHeadWinAmount,
					// 			gameId: req.params.gameId,
					// 			userId: iterator._id,
					// 			claimType: 'cornerWinners',
					// 			time: convertedDate
					// 		})
					// 	}
					// }
					// if (getClaimWinnerList.jaldiClaimWinners.length > 0) {
					// 	for (const iterator of getClaimWinnerList.jaldiClaimWinners) {
					// 		const getIndex = getClaimWinnerList.jaldiClaimWinners.findIndex(x => x === iterator)
					// 		const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id }).select('createdAt').lean();
					// 		const convertedDate = await convertIntoDate(winTime.createdAt)
					// 		jldi.push({
					// 			rank: getIndex + 1,
					// 			username: iterator.name,
					// 			prize: getClaimWinnerList.jldiPerHeadWinAmount,
					// 			gameId: req.params.gameId,
					// 			userId: iterator._id,
					// 			claimType: 'jldiWinners',
					// 			time: convertedDate
					// 		})
					// 	}
					// }
					// let finalObject = {
					// 	firstLineWinners: firstLine,
					// 	secondLineWinners: secondLine,
					// 	thirdLineWinners: thirdLine,
					// 	fullHousieWinners: fullHousie,
					// 	jldiWinners: jldi,
					// 	cornerWinners: corner
					// }

					return res.status(200).send({
						status: true,
						result: allWinner,
						gameId: req.params.gameId
					})
				} else if (claimType === 'firstLine') {
					if (getClaimWinnerList.firstLineClaimWinner.length > 0) {
						for (const iterator of getClaimWinnerList.firstLineClaimWinner) {
							const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id })
								.select('createdAt')
								.sort({createdAt: -1})
								.lean();
							const convertedDate = await convertIntoDate(winTime.createdAt)
							const getIndex = getClaimWinnerList.firstLineClaimWinner.findIndex(x => x === iterator)
							firstLine.push({
								rank: getIndex + 1,
								username: iterator.name,
								prize: getClaimWinnerList.firstLinePerHeadWinAmount,
								gameId: req.params.gameId,
								userId: iterator._id,
								claimType: 'firstLineWinners',
								time: convertedDate
							})
						}
					}
					// let finalObject = {
					// 	firstLineWinners: firstLine,
					// }

					return res.status(200).send({
						status: true,
						result: firstLine,
						gameId: req.params.gameId
					})
				} else if (claimType === 'secondLine') {
					if (getClaimWinnerList.secondLineClaimWinner.length > 0) {
						for (const iterator of getClaimWinnerList.secondLineClaimWinner) {
							const getIndex = getClaimWinnerList.secondLineClaimWinner.findIndex(x => x === iterator)
							const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id })
								.select('createdAt')
								.sort({createdAt: -1})
								.lean();
							const convertedDate = await convertIntoDate(winTime.createdAt)
							secondLine.push({
								rank: getIndex + 1,
								username: iterator.name,
								prize: getClaimWinnerList.secondLinePerHeadWinAmount,
								gameId: req.params.gameId,
								userId: iterator._id,
								claimType: 'secondLineWinners',
								time: convertedDate
							})
						}
					}
					let finalObject = {
						secondLineWinners: secondLine,
					}

					return res.status(200).send({
						status: true,
						result: secondLine,
						gameId: req.params.gameId
					})
				} else if (claimType === 'thirdLine') {
					if (getClaimWinnerList.thirdLineClaimWinner.length > 0) {
						for (const iterator of getClaimWinnerList.thirdLineClaimWinner) {
							const getIndex = getClaimWinnerList.thirdLineClaimWinner.findIndex(x => x === iterator)
							const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id })
								.select('createdAt')
								.sort({createdAt: -1})
								.lean();
							const convertedDate = await convertIntoDate(winTime.createdAt)
							thirdLine.push({
								rank: getIndex + 1,
								username: iterator.name,
								prize: getClaimWinnerList.thirdLinePerHeadWinAmount,
								gameId: req.params.gameId,
								userId: iterator._id,
								claimType: 'thirdLineWinners',
								time: convertedDate
							})
						}
					}
					let finalObject = {
						thirdLineWinners: thirdLine,
					}

					return res.status(200).send({
						status: true,
						result: thirdLine,
						gameId: req.params.gameId
					})
				} else if (claimType === 'fullHousie') {
					if (getClaimWinnerList.fullHouseClaimWinner.length > 0) {
						for (const iterator of getClaimWinnerList.fullHouseClaimWinner) {
							const getIndex = getClaimWinnerList.fullHouseClaimWinner.findIndex(x => x === iterator)
							const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id })
								.select('createdAt')
								.sort({createdAt: -1})
								.lean();
							const convertedDate = await convertIntoDate(winTime.createdAt)
							fullHousie.push({
								rank: getIndex + 1,
								username: iterator.name,
								prize: getClaimWinnerList.fullHousiePerHeadWinAmount,
								gameId: req.params.gameId,
								userId: iterator._id,
								claimType: 'fullHouseWinners',
								time: convertedDate
							})
						}
					}
					let finalObject = {
						fullHousieWinners: fullHousie
					}

					return res.status(200).send({
						status: true,
						result: fullHousie,
						gameId: req.params.gameId
					})
				} else if (claimType === 'corner') {
					if (getClaimWinnerList.cornersClaimWinner.length > 0) {
						for (const iterator of getClaimWinnerList.cornersClaimWinner) {
							const getIndex = getClaimWinnerList.cornersClaimWinner.findIndex(x => x === iterator)
							const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id }).select('createdAt').sort({createdAt: -1}).lean();
							let convertedDate = await convertIntoDate(winTime.createdAt)
							corner.push({
								rank: getIndex + 1,
								username: iterator.name,
								prize: getClaimWinnerList.cornerPerHeadWinAmount,
								gameId: req.params.gameId,
								userId: iterator._id,
								claimType: 'cornerWinners',
								time: convertedDate
							})
						}
					}
					let finalObject = {
						cornerWinners: corner
					}

					return res.status(200).send({
						status: true,
						result: corner,
						gameId: req.params.gameId
					})
				} else if (claimType === 'jldi') {
					if (getClaimWinnerList.jaldiClaimWinners.length > 0) {
						for (const iterator of getClaimWinnerList.jaldiClaimWinners) {
							const getIndex = getClaimWinnerList.jaldiClaimWinners.findIndex(x => x === iterator)
							const winTime = await winners.findOne({ gameId: req.params.gameId, userId: iterator._id }).select('createdAt').sort({createdAt: -1}).lean();
							const convertedDate = await convertIntoDate(winTime.createdAt)
							jldi.push({
								rank: getIndex + 1,
								username: iterator.name,
								prize: getClaimWinnerList.jldiPerHeadWinAmount,
								gameId: req.params.gameId,
								userId: iterator._id,
								claimType: 'jldiWinners',
								time: convertedDate
							})
						}
					}
					let finalObject = {
						jldiWinners: jldi
					}

					return res.status(200).send({
						status: true,
						result: jldi,
						gameId: req.params.gameId
					})
				}
			} else {
				return res.status(200).send({
					status: false,
					msg: `Leaderboard for this game currently not available. Please try again after sometime.`,
					gameId: req.params.gameId
				})
			}
		}
		return res.status(200).send({
			status: false,
			msg: `Leaderboard for this game currently not available. Please try again after sometime.`,
			gameId: req.params.gameId
		})
	}

	async getGameLeaderBoardv1(req, res) {
		let gameDetails = await games.findById({_id:req.params.gameId}).lean();
		console.log(gameDetails)
		if(gameDetails.prizeClaim && gameDetails.prizeClaim =="0"){
			return res.status(200).send({
				status: false,
				msg: `Leaderboard for this game currently not available. Please try again after sometime.`,
				result:[],
				gameId: req.params.gameId
			})
		  }
		const claimType = req.params.claimType;
		const gameId = req.params.gameId;
		let filterCond ={gameId};
		if(claimType=="jldi"){
			filterCond.jaldiWinner=1;
		}
		if(claimType=="corner"){
			filterCond.cornerWinner=1;
		}
		if(claimType=="firstLine"){
			filterCond.firstRowWinner=1;
		}
		if(claimType=="secondLine"){
			filterCond.secondRowWinner=1;
		}
		if(claimType=="thirdLine"){
			filterCond.thirdRowWinner=1;
		}
		if(claimType=="fullHousie"){
			filterCond.fullHousiWinner=1;
		}
		// if(data=="Early Five"){
		// 	GetLeaderBoarddetail("jldi");
		//   }else if(data=="Four corners"){
		// 	GetLeaderBoarddetail("corner");
		//   }else if(data=="Top line"){
		// 	GetLeaderBoarddetail("firstLine");
		//   }else if(data=="Middle line"){
		// 	GetLeaderBoarddetail("secondLine");
		//   }else if(data=="Bottom line"){
		// 	GetLeaderBoarddetail("thirdLine");
		//   }else if(data=="Full house"){
		// 	GetLeaderBoarddetail("fullHousie");
		//   }else{
		// 	GetLeaderBoarddetail("all");
		//   }

		let leaderboardResults = await prizes.aggregate([
			{"$match":{...filterCond}},
			{$lookup:{
				from:'users',
				localField:"userId",
				foreignField:"_id",
				as:"userDetails",
			    pipeline:[{$project:{name:1}}]	
			}},
			{$lookup:{
				from:'ticketaudits',
				localField:"ticketId",
				foreignField:"ticketId",
				as:"ticket",
			    pipeline:[{$project:{ticketName:1}}]	
			}},
			
			{ $addFields: { username: { $first: "$userDetails.name" }}},
			{ $addFields: { ticketName:{$first:"$ticket.ticketName"} } }
			// {$set:{name:{$arrayElemAt:["$userDetails",0]}}}
		]);
		let uniqueTickets = [];
		let det = [];
		for(let i=0;i<leaderboardResults.length;i++){
			let time =  leaderboardResults[i].createdAt-gameDetails.gameStartDateTime 
			var seconds = moment.duration(time).seconds();
			var minutes = moment.duration(time).minutes();
			var milliseconds = moment.duration(time).milliseconds();
			var final=moment(minutes).format('mm')
		
		leaderboardResults[i].time=`${minutes}:${seconds}:${moment(milliseconds).format('SSS')}`
		leaderboardResults[i].rank=i+1
	
			// let ind = uniqueTickets.findIndex(x=>x === leaderboardResults[i].ticketId);
			// if(ind==-1){
			// 	uniqueTickets.push(leaderboardResults[i].ticketId);
			// 	det.push({...leaderboardResults[i]})
			// }
			// else {
            //     let sd = det.findIndex(x=>x.ticketId === leaderboardResults[i].ticketId);
			// 	// console.log(det[sd]);
			// 	det[sd] = {...det[sd],prize:det[sd].prize+leaderboardResults[i].prize}
			// }
		}
		leaderboardResults.sort((a, b) => {
			if (a.userId == req.params.userId && b.userId != req.params.userId) {
			  return -1;
			}
			if (a.userId != req.params.userId && b.userId == req.params.userId) {
			  return 1;
			}
			return 0;
		  });

		  let index = leaderboardResults.length - 1;
			let found = false;
		  for (let i = index; i >= 0; i--) {
			if (leaderboardResults[i].userId == req.params.userId) {
			  if (!found) {
				leaderboardResults[i].flag = true;
				found = true;
			  } else {
				leaderboardResults[i].flag = false;
			  }
			} else {
				leaderboardResults[i].flag = false;
			}
		  }



		// console.log(uniqueTickets);
		// console.log(det);
		// console.log(leaderboardResults)
		//leaderboardResults = det.sort((a, b) => parseFloat(b.prize) - parseFloat(a.prize));
		if(leaderboardResults.length>0){
			return res.status(200).send({
				status: true,
				result: leaderboardResults,
				gameId: req.params.gameId
			})
		}else{		
		return res.status(200).send({
			status: false,
			msg: `Leaderboard for this game currently not available. Please try again after sometime.`,
			gameId: req.params.gameId
		})
	}
	}
	async getGameLeaderBoardAdmin(req, res) {
		let gameDetails = await games.findById({_id:req.body.gameId}).lean();
		const claimType = req.body.claimType;
		const gameId = req.body.gameId;
		let filterCond ={gameId};
		if(claimType=="jldi"){
			filterCond.jaldiWinner=1;
		}
		if(claimType=="corner"){
			filterCond.cornerWinner=1;
		}
		if(claimType=="firstLine"){
			filterCond.firstRowWinner=1;
		}
		if(claimType=="secondLine"){
			filterCond.secondRowWinner=1;
		}
		if(claimType=="thirdLine"){
			filterCond.thirdRowWinner=1;
		}
		if(claimType=="fullHousie"){
			filterCond.fullHousiWinner=1;
		}
		// if(data=="Early Five"){
		// 	GetLeaderBoarddetail("jldi");
		//   }else if(data=="Four corners"){
		// 	GetLeaderBoarddetail("corner");
		//   }else if(data=="Top line"){
		// 	GetLeaderBoarddetail("firstLine");
		//   }else if(data=="Middle line"){
		// 	GetLeaderBoarddetail("secondLine");
		//   }else if(data=="Bottom line"){
		// 	GetLeaderBoarddetail("thirdLine");
		//   }else if(data=="Full house"){
		// 	GetLeaderBoarddetail("fullHousie");
		//   }else{
		// 	GetLeaderBoarddetail("all");
		//   }

		let leaderboardResults = await prizes.aggregate([
			{"$match":{...filterCond}},
			{$lookup:{
				from:'users',
				localField:"userId",
				foreignField:"_id",
				as:"userDetails",
			    pipeline:[{$project:{name:1}}]	
			}},
			{$lookup:{
				from:'ticketaudits',
				localField:"ticketId",
				foreignField:"ticketId",
				as:"ticket",
			    pipeline:[{$project:{ticketName:1}}]	
			}},
			{ $addFields: { username: { $first: "$userDetails.name" } } },
			{ $addFields: { ticketName:{$first:"$ticket.ticketName"} } }
			// {$set:{name:{$arrayElemAt:["$userDetails",0]}}}
		])

		for(let i=0;i<leaderboardResults.length;i++){
			let time =  leaderboardResults[i].createdAt-gameDetails.gameStartDateTime 
			var seconds = moment.duration(time).seconds();
			var minutes = moment.duration(time).minutes();
			var milliseconds = moment.duration(time).milliseconds();
			var final=moment(minutes).format('mm')
		
		leaderboardResults[i].time=`${minutes}:${seconds}:${moment(milliseconds).format('SSS')}`
		leaderboardResults[i].rank=i+1
	
			// let ind = uniqueTickets.findIndex(x=>x === leaderboardResults[i].ticketId);
			// if(ind==-1){
			// 	uniqueTickets.push(leaderboardResults[i].ticketId);
			// 	det.push({...leaderboardResults[i]})
			// }
			// else {
            //     let sd = det.findIndex(x=>x.ticketId === leaderboardResults[i].ticketId);
			// 	// console.log(det[sd]);
			// 	det[sd] = {...det[sd],prize:det[sd].prize+leaderboardResults[i].prize}
			// }
		}

		if(leaderboardResults.length>0){
			return res.status(200).json({
				title: 'data.',
				error: false,
				status:true,
				details: leaderboardResults,
				gameId: req.body.gameId
			});
			
		}else{		
		return res.status(200).json({
			status: false,
			error:true,
			title: `Leaderboard for this game currently not available. Please try again after sometime.`,
			gameId: req.body.gameId
		})
	}
	}




	// async getGameLeaderBoard(req, res) {
	// 	if(req.params.type=='all'){
	// 		getallUsersByWinning(req,res)
	// 	}
	// 	else{
	// 		getUsersByWinning(req,res)
	// 	}
	// }



	async getGameNumbers(req, res) {
		let gameNumber = await gameNumbers.findOne({ gameId: req.params.gameId }).select('numbersSend').lean();
		
		gameNumber = gameNumber.numbersSend.reduce((fin,ind)=>{
			return [...fin,ind.sendNumber]
		  },[]);
		  console.log(gameNumber)
		return res.status(200).send({
			status: true,
			result: {numbersSend:gameNumber}
		})
	}
}

module.exports = leaderBoards