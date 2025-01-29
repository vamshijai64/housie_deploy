var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var multer = require("multer");
var fs = require('fs');
var expressValidator = require('express-validator');
router.use(expressValidator())

const userController = require('../controllers/userController');
const socketControll = require('../controllers/socketControllers');

const User = require('../models/users');
// const Game = require('../models/games');
const async = require('async');
const helper = require('../lib/helperFunction');
const crypto = require('crypto');

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.send('respond with a resource');
});

// signup Proccess
router.post('/signup', function (req, res) {
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	// req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('mobile', 'mobile is required').notEmpty();
	// req.checkBody('dob', 'dob is required').notEmpty();
	// req.checkBody('gender', 'gender is required').notEmpty();
	// req.checkBody('country', 'country is required').notEmpty();

	User.findOne({ $or: [{ mobile: req.body.mobile }, { email: req.body.email }] }, (err, userData) => {
		console.log(userData, "userData")
		if (err) {
			return res.status(200).json({
				error: true,
				message: "Error occured while findOne email inside user.",
				err: err
			});
		}
		if (!userData || userData.length == 0) {
			userController.userSignup(req, res);
		} else {
			console.log("user already exists")
			return res.status(200).json({
				message: 'User already exists',
				error: true,
				userData: {}

				
			});
		}
	});
});

router.post('/verifyOTP', function (req, res) {
	req.checkBody('otp', 'OTP is required').notEmpty();
	req.checkBody('mobile', 'Mobile is required').notEmpty();
	userController.verifyOTP(req, res);
});

router.post('/resendOTP', function (req, res) {
	req.checkBody('mobile', 'Mobile is required').notEmpty();
	userController.resendOTP(req, res);
});

router.post('/verifyLoginOTP', function (req, res) {
	req.checkBody('mobile', 'Mobile is required').notEmpty();
	req.checkBody('otp', 'OTP is required').notEmpty();
	userController.verifyLoginOTP(req, res);
});

router.post('/changePassword', helper.AuthenticateUser, (req, res) => {
	userController.changePassword(req, res);
});

router.post('/loginUser', (req, res) => {
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('mobile', 'Mobile is required').notEmpty();
	userController.loginUser(req, res);
})

router.post('/logoutUser', helper.AuthenticateUser, function (req, res) {
	userController.logoutUser(req, res);
});

router.post('/editProfile', function (req, res, next) {
	userController.editProfile(req, res);
});

router.post('/saveKYC', helper.AuthenticateUser, function (req, res) {
	userController.saveKYC(req, res);
});

router.post('/saveBankDetails', helper.AuthenticateUser, function (req, res) {
	userController.saveBankDetails(req, res);
});


router.post('/removeUserProfileImage', helper.AuthenticateUser, function (req, res, next) {
	userController.removeUserProfileImage(req, res);
});

router.post('/forgotPassword', function (req, res, next) {
	userController.forgotPassword(req, res);
});

router.get('/verifyresetPasswordToken/:token', function (req, res, next) {
	userController.verifyresetPasswordToken(req, res, (err, data) => {
		// console.log('err',err,data,'data')
		if (err) {
			console.log(err, "error occured");
			res.render("getResetPassword", { token: err });
		} else {
			res.render("getResetPassword", { token: data });
		}
	});
});

router.post('/resetPassword', function (req, res, next) {
	userController.resetPassword(req, res, (err, data) => {
		if (err) {
			console.log(err, "error occured");
			req.flash('danger', err);
			res.render("forgotPasswordSuccess", { message: req.flash() });
		} else {
			req.flash('success', 'password reset successfully.');
			res.render("forgotPasswordSuccess", { message: req.flash() });
		}
	});
});

router.post('/bmlwebhook', function (req, res, next) {
	userController.bmlwebhook(req, res, (err, data) => {
		res.render('transaction_status', { details: data });
	});
});

router.get('/getBanners', function (req, res, next) {
	userController.getBanners(req, res, next);
});
router.get('/getPopUpBanners', function (req, res, next) {
	userController.getPopUpBanners(req, res, next);
});
router.post("/editProfileImage", helper.AuthenticateUser, function (req, res) {
	userController.editProfileImage(req, res);
});

router.post("/getuserDetails", function (req, res) {
	userController.getuserDetails(req, res);
});

router.get("/getuserTransactions", helper.AuthenticateUser, function (req, res) {
	userController.getuserTransactions(req, res);
	// userController.getUserActivity(req,res);
});

router.get("/getTranscationDetails", helper.AuthenticateUser, function (req, res) {
	userController.getTranscationDetails(req, res);
});

router.post("/redeemGiftCard", helper.AuthenticateUser, function (req, res) {
	userController.redeemGiftCard(req, res);
});

router.get('/getPromoCodeDetails', helper.AuthenticateUser, function (req, res, next) {
	userController.getPromoCodeDetails(req, res, next);
});

router.post('/listAllNotifications', helper.AuthenticateUser, (req, res, next) => {
	userController.listAllNotifications(req, res);
});

router.post("/rechargeWallet", helper.AuthenticateUser, function (req, res) {
	req.checkBody('topAmount', 'Amount is required').notEmpty();
	req.checkBody('topAmount', 'Amount must be numberic value').isDecimal();
	userController.rechargeWallet(req, res);
});

router.post("/withdrawMoney", helper.AuthenticateUser, function (req, res) {
	req.checkBody('amount', 'Amount is required').notEmpty();
	req.checkBody('amount', 'Amount must be numberic value').isDecimal();
	userController.withdrawMoney(req, res);
});

router.post("/withdrawMoneyCancel", helper.AuthenticateUser, function (req, res) {
	req.checkBody('withdraw_id', 'Withdraw id is required').notEmpty();
	req.checkBody('description', 'Reason for cancelling request').notEmpty();
	userController.withdrawMoneyCancel(req, res);
});

router.get("/withdrawRequests", helper.AuthenticateUser, function (req, res) {
	userController.withdrawRequests(req, res);
});

router.post("/syncAll", helper.AuthenticateUser, function (req, res) {
	userController.syncAll(req, res);
});

router.post("/deleteNotification", helper.AuthenticateUser, function (req, res) {
	userController.deleteNotification(req, res);
});

router.get("/getUserActivity", helper.AuthenticateUser, function (req, res) {
	userController.getUserActivity(req, res);
});

router.get("/sendSmS", function (req, res) {
	userController.sendSMS(req, res);
});

router.get("/onlinePayment/", function (req, res) {
	userController.onlinePayment(req, res, (err, data) => {
		if (err) {
			res.render('error', { data: data });
		}
		else {
			data.MerID = process.env.MerID;
			data.AcqID = process.env.AcqID;
			data.PurchaseCurrency = process.env.PurchaseCurrency;

			let shasum = crypto.createHash('sha1');
			let str = process.env.TxPassword + data.MerID + data.AcqID + data.order_id + data.total + data.PurchaseCurrency;
			shasum.update(str);
			data.hashString = shasum.digest('base64');
			console.log('hexstring', data.hashString);

			res.render('onlinePayment', { data: data });
		}
	});
});


router.get("/getOngoingGames", (req, res) => {
	userController.getOnGoingGames(req, res)
})
router.get("/getUpcomingGames", (req, res) => {
	userController.getUpcomingGames(req, res)
})
router.post("/buyTicket", helper.AuthenticateUser, (req, res) => {
	userController.buyTicket(req, res)
})

router.get('/getAllUserDetails', async (req, res) => {
	const getDetails = await User.find({}).select('-tickets').sort({ _id: -1 }).lean();

	return res.status(200).send({
		status: true,
		result: getDetails
	})
})

router.post('/updateWalletAmount', async (req, res) => {
	const isUserExist = await User.findById(req.body.userId).lean();
	if (!isUserExist) {
		return res.status(200).send({
			status: false,
			msg: 'User not found'
		})
	}
	if (req.body.hasOwnProperty('bonusWallet')) {
		console.log('1', req.body)
		await User.updateOne({ _id: req.body.userId }, {
			$inc: { bonusWallet: req.body.bonusWallet }
		})
	}
	if (req.body.hasOwnProperty('winAmount')) {
		await User.updateOne({ _id: req.body.userId }, {
			$inc: { winAmount: parseInt(req.body.winAmount) }
		})
	}
	if (req.body.hasOwnProperty('credit_points')) {
		await User.updateOne({ _id: req.body.userId }, {
			$inc: { credit_points: parseInt(req.body.credit_points) }
		})
	}
	return res.status(200).send({
		status: true,
		msg: 'Amount successfully updated'
	})
})

router.post('/ticketImage', async (req, res) => {
	userController.ticketImage(req, res)
})

router.post('/getUserReferals', async (req, res) => {
	userController.getUserReferals(req, res)
})

router.post('/addUserNotification', async (req, res) => {
	userController.addUserNotification(req, res)
})

router.post('/getUserNotifications', async (req, res) => {
	userController.getUserNotifications(req, res)
})

router.post('/claim/prize', async (req, res) => {
	userController.claimUserPrizes(req, res)
})

router.post('/addToken', async (req, res) => {
	userController.addUserToken(req, res)
})

router.post('/addGameNotification',async(req,res)=>{
	userController.addGameNotification(req,res)
})

router.post('/getGameAllTickets',async(req,res)=>{
	socketControll.gameTickets(socket='',io='',data={gameId: req.body.gameId, userId:req.body.userId},flag=1,res)
})

router.post('/getSingleTicket',async(req,res)=>{
	userController.getSingleTicket(req,res)
})
router.post('/tdsDetailsForUser', helper.AuthenticateUser, async(req,res)=>{
	userController.tdsDetailsForUser(req,res)
})
router.post('/deposit/request', helper.AuthenticateUser, async(req,res)=>{
	userController.depositDetailsForUser(req,res)
})



module.exports = router;
