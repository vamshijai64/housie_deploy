const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const randomstring = require("randomstring");
const fs = require('fs');
const mongoose = require('mongoose');
const async = require('async');
const ticketaudits = require('../models/ticketsAudit.model')
var Notification = require('../models/notification');
const User = require('../models/users');
const gameNotification = require('../models/gameNotification')
const Banner = require('../models/banners');
const game = require("../models/games");
const giftCard = require("../models/gift");
const ticketAudit = require('../models/ticketsAudit.model');
const numberCrossed = require('../models/numbersCrossed.model');

const userActivity = require("../models/userActivity");
const promoCode = require('../models/promoCode');
const Transaction = require('../models/transaction');
const WithdrawRequests = require('../models/withdrawRequests');
const referalsData = require('../models/referalsData');
const otp = require('../models/otp');
const prizes = require('../models/prizes.model');
var helper = require('../lib/helperFunction');
const fileUploader = require('../lib/file-uploader')
const crypto = require('crypto');
const html_to_pdf = require('html-pdf-node');
const usernotification = require('../models/usernotification')
const { findById } = require('../models/admin');
const gameNumbersModel = require('../models/gameNumbers.model');
const { findByIdAndUpdate } = require('../models/ticketsAudit.model');
const tdsTable = require('../models/tdsTable');
const PDFDocument = require('pdf-lib').PDFDocument;
const createInvoice = require('./createInvoice');
const moment = require('moment');
const { ToWords } = require('to-words');

var smtpTransport = nodemailer.createTransport({
	tls: { rejectUnauthorized: false },
	secureConnection: false,
	service: "gmail",
	host: "smtp.gmail.com",
	port: 587,
	requiresAuth: true,
	auth: {
		user: process.env.mail_username,
		pass: process.env.mail_password
	}
});

//console.log(process.env.mail_username);
//console.log(process.env.mail_password);
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}
const serializeUser = user => {
	return {
		id: user._id,
		email: user.email,
		name: user.name,
		dob: user.dob,
		mobile: user.mobile,
		gender: user.gender,
		_id: user._id,
		updatedAt: user.updatedAt,
		createdAt: user.createdAt
	};
};

const userSignup = async (req, res) => {
	console.log(req.body, "req.bodyyyyy")

	const {
		name,
		email,
		// password,
		mobile,
		dob,
		// gender,
		address,
		country,
		deviceToken,
		referal_code
	} = req.body;
	console.log(req.body, "req.body")

	let errors = req.validationErrors();
	if (errors) {
		return res.status(500).json({
			error: true,
			message: "validation Error.",
			errors: errors
		});
	} else {
		let duplicateCount = await User.find({ username: req.body.username }).count().lean();
		console.log(duplicateCount, "duplicateeeee")
		User.findOne({ $or: [{ mobile: mobile }, { email: email }] }, (err, user) => {
			if (err) {
				return res.status(200).json({
					title: 'An error occurred',
					error: true,
					details: err
				});
			}
			if (duplicateCount > 0) {

				return res.status(500).json({
					error: true,
					message: "Username Already Exist",
					err: err
				});
			}
			if (!user) {
				let r_code = randomstring.generate({
					length: 7,
					charset: 'alphabetic'
				});
				console.log(req.body.dob, "req.body.dob")
				let enteredUser = {
					name,
					email,
					password: req.body.password ? bcrypt.hashSync(password, bcrypt.genSaltSync(10)) : '',
					mobile,
					dob: req.body.dob ? req.body.dob : '',

					address: req.body.address ? req.body.address : '',
					state: req.body.state ? req.body.state : '',
					country: req.body.country ? req.body.country : 'India',

					deviceToken,
					referral_code: r_code,
					callingCode: req.body.callingCode ? req.body.callingCode : '091',
					otp: helper.saveOTP(req.body.mobile),
					username: req.body.username,
					reffer_code: req.body.reffer_code,
					pincode: ''
				};
				if (req.body.reffer_code != '') {
					User.findOne({ referral_code: req.body.reffer_code }, (err, referrer) => {

						if (referrer) {
							enteredUser.referred_by = referrer._id;
							const newUser = new User(enteredUser);
							newUser.save(function (err, userData) {
								console.log(err, "err")
								if (err) {
									return res.status(500).json({
										error: true,
										message: "Error occured while creating user.",
										err: err
									});
								} else {

									let sendEmailUrl = `http://3.111.94.238:3000/check_email/${userData._id}`;

									const token = jwt.sign({
										user: {
											email: userData.email,
											userId: userData._id
										}
									}, "housie",
										{ expiresIn: 60 * 60 * 24 * 1000 }
									);
									helper.saveAccessToken(userData, token);
									// helper.saveOTP(mobile);
									const refer_data = {
										userId: userData._id,
										refered_by: userData.referred_by,
										code: req.body.reffer_code,
										amount: 0,
										status: 0,
										totalAmount: 50
									}
									const newReferalsData = new referalsData(refer_data);
									newReferalsData.save(function (err, user) {
										if (err) {
											return res.status(500).json({
												error: true,
												message: "Error occured while creating user.",
												err: err
											});
										}
										else {
											return res.status(200).json({
												error: false,
												message: "User created",
												userData: userData,
												token: token
											});
										}
									})

								}
							});
						} else {
							console.log("invalid code")
							return res.status(500).json({
								error: true,
								message: "Invalid referral code",
								err: err
							});
						}
					});
				} else {
					const newUser = new User(enteredUser);
					newUser.save(function (err, userData) {
						if (err) {
							return res.status(500).json({
								error: true,
								message: "Error occured while creating user.",
								err: err
							});
						} else {
							const token = jwt.sign({
								user: {
									email: userData.email,
									userId: userData._id
								}
							}, "housie",
								{ expiresIn: 60 * 60 * 24 * 1000 }
							);
							helper.saveAccessToken(userData, token);
							// helper.saveOTP(mobile);

							return res.status(200).json({
								error: false,
								message: "User created",
								userData: serializeUser(userData),
								token: token
							});
						}
					});
				}
			} else {
				console.log("iam heres")
				return res.status(200).json({
					message: 'User already exists',
					error: true,
					userData: []
				});
			}
		});
	}
}

const loginUser = (req, res) => {

	User.findOne({ mobile: req.body.mobile }, (err, user) => {

		if (err) {
			return res.status(200).json({
				title: 'An error occurred',
				error: "true",
				details: err
			});
		}
		if (!user) {
			return res.status(200).json({
				title: 'user not found',
				error: "true",
				details: "invalid Login"
			});
		}

		if (parseInt(user.isBlocked) == 1) {
			return res.status(200).json({
				title: 'You are blocked.Please contact admin',
				error: "true",
				details: "invalid Login"
			});
		}
		if (!user.status) {
			return res.status(200).json({
				title: 'You are account is not verified.Please contact admin',
				error: "true",
				details: "Account is not verified"
			});
		}
		user.otp = helper.saveOTP(user.mobile);
		user.save(function (err) {
			// console.log(err)
			if (err) {
				return res.status(500).json({
					title: 'An error occurred',
					error: "true",
					details: err
				});
			}
			return res.status(200).json({
				title: 'OTP sent',
				error: "false",
				details: 'OTP sent on mobile no'
			});
		});
	});
}

const logoutUser = (req, res) => {
	let user = req.body.userData;
	let arrayofToken = user.deviceToken;
	let index = arrayofToken.indexOf(req.body.deviceToken);
	if (index > -1) {
		user.deviceToken.splice(index, 1);
	}
	user.isLoggedIn = false;
	// helper.deleteAccessToken(token);
	user.save((err, data) => {
		if (err) {
			return res.status(500).json({
				title: 'An error occurred',
				error: "true",
				details: err
			});
		}
		return res.status(200).json({
			message: 'Logout succesfully',
			error: "false"
		});
	});
}

const getuserDetails = async (req, res) => {


	try {
		let uData = await User.find({ _id: req.body.user_id }).exec();
		// console.log(uData,"uData")
		let { winAmount, balanceWallet, bonusWallet } = uData[0];

		let t = Number(winAmount) + Number(balanceWallet) + Number(bonusWallet);

		console.log(typeof t)

		return res.status(200).json({
			title: 'user details found',
			error: "false",
			user: uData[0],
			totalBalance: Number(t.toFixed(2))

		});
	}
	catch (err) {
		console.log(err);
		return res.status(200).json({

			title: "Something went wrong. Please try again.",
			error: true,
			details: ''
		});
	}

	console.log('getuserDetails fun call ==', req.body);


}

const editProfile = async (req, res) => {
	console.log('body=====>', req.body);
	let user_id = req.body.user_id;


	let user = req.body;
	user.name = req.body.name;
	user.email = req.body.email;
	if (req.body.gender)
		user.gender = req.body.gender;
	if (req.body.dob)
		user.dob = req.body.dob;
	if (req.body.address)
		user.address = req.body.address;
	if (req.body.country)
		user.country = req.body.country;
	if (req.body.pincode)
		user.pincode = req.body.pincode;

	if (req.body.state)
		user.state = req.body.state;

	let response = await User.updateOne({ _id: user_id }, {
		$set: {
			state: req.body.state, username: user.username, name: req.body.name, email: req.body.email,
			mobile: req.body.mobile,
			dob: req.body.dob,
			country: req.body.country,
			address: req.body.address,
			gender: req.body.gender,
			pincode: req.body.pincode
		}
	});


	let uData = await User.find({ _id: user_id }).exec();
	return res.status(200).json({
		title: 'user updated Succesfully',
		error: "false",
		user: uData[0]


	});





	// return res.status(200).json({
	// 	title: 'user updated Succesfully',
	// 	error: "false",
	// 	user: user
	// });
	// user.save((err, user) => {
	// 	if (err) {
	// 		if (err.name == 'ValidationError') {
	// 			return res.status(400).json({
	// 				title: 'An error occurred',
	// 				error: "true",
	// 				details: err
	// 			});
	// 		}
	// 		return res.status(500).json({
	// 			title: 'An error occurred',
	// 			error: "true",
	// 			details: err
	// 		});
	// 	}
	// 	user.password = null;
	// 	return res.status(200).json({
	// 		title: 'user updated Succesfully',
	// 		error: "false",
	// 		user: user
	// 	});
	// });
}

const removeUserProfileImage = (req, res) => {
	let user = req.body.userData;
	let oldImage = user.profile_image;
	user.profile_image = '';
	user.save((err, userdata) => {
		if (err) {
			return res.status(500).json({
				title: 'An error occurred',
				error: "true",
				details: err
			});
		}
		if (user.profile_image != '')
			helper.unlinkOldImages('./uploads/profile/' + oldImage);
		return res.status(200).json({
			title: 'Profile Image removed Succesfully',
			error: "false",
			user: userdata
		});

	});
}

const forgotPassword = (req, res) => {

	let token = randomstring.generate({
		length: 7,
		charset: 'numeric'
	});
	// //console.log('var app = express();', req.protocol + '://' + req.get('host'));
	User.findOne({
		email: req.body.email
	}, (err, user) => {

		if (err) {
			return res.status(500).json({
				title: 'An error occurred',
				error: "true",
				details: err
			});
		}
		if (!user) {
			return res.status(400).json({
				title: 'user not found',
				error: "true",
				details: 'invalid login'

			});
		}


		if (parseInt(user.isBlocked) == 1) {
			return res.status(400).json({
				title: 'You are blocked.Please contact admin',
				error: "true",
				details: "invalid Login"
			});
		}
		user.resetPasswordToken = token;
		user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

		user.save(function (err) {
			if (err) {
				return res.status(500).json({
					title: 'An error occurred',
					error: "true",
					details: err
				});
			}

			let mailOptions = {
				to: user.email,
				from: 'admin@dreamhousie.com',
				subject: 'Recover Your Dream Housie Account Password',
				html: `Hello,<br> 
                If you have forgotten your password, you can <a href="${req.protocol}://${req.get('host')}/user/verifyresetPasswordToken/${token}">click here</a> <br>
                If you did not request this, please ignore this email and your password will remain unchanged.<br>`
			};
			smtpTransport.sendMail(mailOptions, function (err) {
				if (err) {
					return res.status(500).json({
						title: 'An error occurred',
						error: "true",
						details: err
					});
				}

				return res.status(200).json({
					title: 'RESET PASSSWORD',
					error: "false",
					details: 'Reset email sent'
				});
			});
		});
	});
}

const verifyresetPasswordToken = (req, res, next) => {
	let token = req.params.token;
	User.findOne({
		resetPasswordToken: token,
		resetPasswordExpires: {
			$gt: Date.now()
		}
	}, (err, user) => {
		if (err) {
			return res.status(500).json({
				title: 'Error occured',
				error: "true",
				details: err
			});
		}
		if (!user || user == null) {
			// return next("No user with such token or token has been expired");
			return res.status(500).json({
				title: 'Invalid token',
				error: "true",
				details: "No user with such token or token has been expired"
			});
		}
		let UserSavedToken = user.resetPasswordToken
		if (!(UserSavedToken == token)) {
			return next("otp not matching");
		} else {
			// next(null, token);
			return res.status(200).json({
				title: 'verified',
				error: "false",
				details: token
			});
		}
	});

}

const resendOTP = async (req, res) => {
	// let token = req.headers.token;
	let mobile = req.body.mobile;
	await otp.deleteMany({ mobile: mobile });
	await helper.saveOTP(mobile);
	return res.status(400).json({
		title: 'OTP sent',
		error: "false"
	});
}

const verifyOTP = (req, res) => {
	// let token = req.headers.token;
	let mobile = req.body.mobile;
	let m_otp = req.body.otp;
	otp.findOne({
		mobile: mobile,
		expiresIn: {
			$gt: Date.now()
		}
	}, (err, user) => {
		if (err) {
			return res.status(500).json({
				title: 'Error occured',
				error: "true",
				details: err
			});
		}
		if (!user || user == null) {
			return res.status(403).json({
				title: 'No user with such otp or otp has been expired',
				error: "true",
				details: 'No user with such otp or otp has been expired'
			});
		}
		let UserSavedToken = user.otp;
		if (!(UserSavedToken == m_otp)) {
			return res.status(200).json({
				title: 'Invalid OTP',
				error: "false",
				details: 'otp does not match'
			});
		} else {
			otp.findOneAndDelete({ mobile: mobile }, (err, data) => {
				User.findOneAndUpdate({ mobile: mobile }, { status: true }, { new: true }, (err, updatedUser) => {
					if (err) {
						return res.status(200).json({
							title: 'Error occured',
							error: "false",
							details: err
						});
					}
					if (updatedUser.referred_by) {
						//bonus logic here
					}
					return res.status(200).json({
						title: 'verified',
						error: "false",
						details: 'OTP validation successfull'
					});
				});
			});
		}
	});
}

const verifyLoginOTP = (req, res) => {
	// let token = req.headers.token;
	let mobile = req.body.mobile;
	let m_otp = req.body.otp;
	User.findOne({ mobile: req.body.mobile }, (err, user) => {

		const mobile_verify = user.is_mobile_verified;

		if (err) {
			return res.status(200).json({
				title: 'An error occurred',
				error: "true",
				details: err,
				userDetails: {}
			});
		}
		if (!user) {
			return res.status(200).json({
				title: 'user not found',
				error: "true",
				details: "invalid Login",
				userDetails: {}
			});
		}

		if (parseInt(user.isBlocked) == 1) {
			return res.status(200).json({
				title: 'You are blocked.Please contact admin',
				error: "true",
				details: "invalid Login"
			});
		}
		if (!user.status) {
			return res.status(200).json({
				title: 'You are account is not verified.Please contact admin',
				error: "true",
				details: "Account is not verified",
				userDetails: {}
			});
		}
		if (user.otp != m_otp) {
			return res.status(200).json({
				title: 'Invalid OTP',
				error: "true",
				details: "invalid OTP",
				userDetails: {}
			});
		}
		const data = {
			userId: user._id,
			email: user.email,
		}

		const device_id = req.body.deviceToken;
		user.isLoggedIn = true;

		helper.checkIfduplicates(user.deviceToken, device_id, (valueexist) => {
			//console.log('valueexist',valueexist)
			let token = jwt.sign({
				user: data
			}, 'housie', {
				expiresIn: 60 * 60 * 24 * 1000
			});

			if (valueexist == false && device_id != null) {
				user.deviceToken = user.deviceToken.concat([device_id]);
			}
			user.otp = '';
			if (!user.is_mobile_verified) {
				user.is_mobile_verified = true;


				user.bonusWallet = user.bonusWallet + 25;

			}
			user.save(async function (err, userData) {

				if (err) {
					return res.status(500).json({
						title: 'An error occurred',
						error: "true",
						details: err
					});
				} else {


					if (!mobile_verify && user.referred_by) {

						const refer_data = {
							userId: user._id,
							refered_by: user.referred_by,
							code: user.reffer_code,
							amount: 25,
							status: 1,
							totalAmount: 25
						}
						const newReferalsData = new referalsData(refer_data);
						newReferalsData.save(async function (err, userData) {
							if (err) {
								return res.status(500).json({
									title: 'An error occurred',
									error: "true",
									details: err
								});
							}
							else {
								const refer_date = await User.find({ _id: user.referred_by }).exec()

								//console.log(refer_date[0].bonusWallet, "refer_date")


								User.findByIdAndUpdate({ _id: user.referred_by }, { bonusWallet: refer_date[0].bonusWallet + 25 }, async (err, data) => {
									if (err) {
										return res.status(500).json({
											title: 'An error occurred',
											error: "true",
											details: err
										});
									} else {
										try {
											console.log(refer_date, "refer_date")
											const transaction_id = [{
												amount: 25,
												type: "bonus",
												status: "accept",
												description: "Bonus earned by Referral (Mobile Number Verification)",
												user_id: user._id
											}, {
												amount: 25,
												type: "bonus",
												status: "accept",
												description: "Bonus earned by Referral (Mobile Number Verification)",
												user_id: refer_date[0]._id
											}]
											const notification = [{
												message: `You were referred by ${refer_date[0].name}, and you received a bonus of 25 rupees for verifying your mobile number.`,
												userId: user._id

											}, {
												message: `You got bonus 25 rs by reffering to ${user.name}(Mobile verify) `,
												userId: refer_date[0]._id

											}
											]
											// const transactionData = new Transaction(transaction_id);
											// const notificationData = new usernotification(notification);
											console.log(transaction_id, notification)
											const options = { ordered: true };

											await Transaction.insertMany(transaction_id, options);
											await usernotification.insertMany(notification, options);


										}
										catch (err) {
											console.log(err)

										}
										console.log(token,"token")
										return res.status(200).json({
											title: 'user found',
											error: "false",
											token: token,
											userDetails: user
										});
									}
								})

							}

						})
					}
					else {
						if (!mobile_verify) {
							const transaction_id = [{
								amount: 25,
								type: "bonus",
								status: "accept",
								description: "You were earned Mobile Number Verification Bonus",
								user_id: user._id
							}]

							const notification = [{
								message: `You were earned Mobile Number Verification Bonus`,
								userId: user._id

							}]
							const options = { ordered: true };
							await Transaction.insertMany(transaction_id, options);
							await usernotification.insertMany(notification, options);
						}
						console.log(token,"token")
						return res.status(200).json({
							title: 'user found',
							error: "false",
							token: token,
							userDetails: user
						});
					}
				}

			});
		});
	});
}

const resetPassword = (req, res, next) => {
	User.findOne({
		resetPasswordToken: req.body.token,
		resetPasswordExpires: {
			$gt: Date.now()
		}
	}, (err, user) => {

		if (err) {
			return next("Something went wrong, Please try again.")
		}
		if (!user) {
			return next("No user with such link or link has been expired.")
		}
		user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		user.save(function (err, user) {
			if (err) {
				return next("Something went wrong, Please try again.")
			}
			return next(null, user)
		});


	});

}

const changePassword = (req, res) => {
	let user = req.body.userData;
	bcrypt.compare(req.body.old_password, user.password, function (err, isMatch) {
		if (err) {
			return res.status(500).json({
				title: 'Something went wrong Please try again.',
				error: "true",
				details: err
			});
		}
		if (isMatch) {
			user.password = bcrypt.hashSync(req.body.new_password, bcrypt.genSaltSync(10));
			user.save((err, savedUser) => {
				if (err) {
					return res.status(500).json({
						title: 'Something went wrong Please try again.',
						error: "true",
						details: err
					});
				}
				return res.status(200).json({
					title: 'Password updated successfully.',
					error: "false",
					userData: savedUser
				});
			});
		} else {
			return res.status(500).json({
				title: 'Old password you entered was incorret. Please try again.',
				error: "true",
				details: err
			});
		}
	});
}

const editProfileImage = async (req, res) => {
	let user = req.body.userData;
	const getUserDetails = await User.findById(user._id).lean();
	if (!getUserDetails) {
		return res.status(200).send({
			status: false,
			msg: 'User not found'
		})
	}

	const uploadNewFile = await fileUploader.saveProfileImage(req.files.files);

	const url = await fileUploader.uploadToAWS(uploadNewFile[1])
	console.log(url, "url")
	await User.updateOne({ _id: user._id }, {
		profile_image: url
	})
	fileUploader.deleteProfileImage(uploadNewFile[0]);


	const UserDetails = await User.findById(user._id).lean();
	console.log(UserDetails, "userrrrrr")

	return res.status(200).json({
		title: 'Image uploaded',
		error: "false",
		user: UserDetails
	});

	// helper.uploadImage(req,res,"","profile",(res2)=>{
	//     if(res2.file!=undefined){
	//         if(req.file.mimetype === 'image/jpeg' || req.file.mimetype=== 'image/jpg' || req.file.mimetype=== 'image/png') {
	//             let ext = req.file.filename.split('.');
	//             img = `/${ext[0]}`;
	//         }
	//     } else {
	//         User.findOneAndUpdate({
	//             "_id": user._id
	//         },{profile_image: res2}, (err, user) => {
	//             if (err) {
	//                 return res.status(500).json({
	//                     title: 'An error occurred',
	//                     error: "true",
	//                     details: err
	//                 });
	//             }
	//             if (!user) {
	//                 return res.status(400).json({
	//                     title: 'user not found',
	//                     error: "true",
	//                 });
	//             }
	//             //remove older image
	//             if(user.profile_image != '')
	//                 helper.unlinkOldImages('./uploads/profile/'+user.profile_image);

	//             user.profile_image=res2;
	//             return res.status(200).json({
	//                 title: 'Image uploaded',
	//                 error: "false",
	//                 user : user
	//             });
	//         });
	//     }
	// });
}

const saveBankDetails = (req, res) => {
	let user = req.body.userData;
	if (req.body.bank_name)
		user.bank.bank_name = req.body.bank_name;
	if (req.body.account_holder)
		user.bank.account_holder = req.body.account_holder;
	if (req.body.account_number)
		user.bank.account_number = req.body.account_number;
	if (req.body.ifsc_code)
		user.bank.ifsc_code = req.body.ifsc_code;
	if (req.body.branch_name)
		user.bank.branch_name = req.body.branch_name;
	user.bank.status = 'pending'
	user.bank.time = new Date()
	user.save((err, user) => {
		if (err) {
			if (err.name == 'ValidationError') {
				return res.status(400).json({
					title: 'An error occurred',
					error: "true",
					details: err
				});
			}
			return res.status(500).json({
				title: 'An error occurred',
				error: "true",
				details: err
			});
		}
		user.password = null;
		return res.status(200).json({
			title: 'Bank details updated Succesfully',
			error: "false",
			user: user
		});
	});
}

const saveKYC = async (req, res) => {
	let user = req.body.userData;
	// console.log(req, "user")

	console.log('details in save kyc=====>', user._id, req.files);
	const getUserDetails = await User.findById(user._id).lean();
	if (!getUserDetails) {
		return res.status(200).send({
			status: false,
			msg: 'User not found'
		})
	}

	// await fileUploader.deleteFile(getUserDetails.profile_image);

	if (req.body.flag == 1) {
		const uploadNewFile = await fileUploader.saveProfileImage(req.files.files);
		const url = await fileUploader.uploadToAWS(uploadNewFile[1])

		const kycObject = {
			...getUserDetails.kyc,
			pancard: {
				image_name: url,
				status: 'pending',
				time: new Date()
			}
		}
		await User.updateOne({ _id: user._id }, {
			kyc: kycObject
		})
		fileUploader.deleteProfileImage(uploadNewFile[0]);

		return res.status(200).json({
			title: 'KYC details updated Succesfully',
			error: "false",
			user: user
		});
	} else {
		const uploadNewFile = await fileUploader.saveProfileImage(req.files.files);
		const url = await fileUploader.uploadToAWS(uploadNewFile[1])

		const kycObject = {
			...getUserDetails.kyc,
			aadhar: {
				image_name: url,
				status: 'pending',
				time: new Date()
			}
		}
		await User.updateOne({ _id: user._id }, {
			kyc: kycObject
		})
		fileUploader.deleteProfileImage(uploadNewFile[0]);

		return res.status(200).json({
			title: 'KYC details updated Succesfully',
			error: "false",
			user: user
		});
	}
	// helper.uploadImage(req, res, "", "documents", (res2) => {
	// 	if (res2.file != undefined) {
	// 		if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/png') {
	// 			let ext = req.file.filename.split('.');
	// 			img = `/${ext[0]}`;
	// 		}
	// 	} else {
	// 		if (req.body.type != "") {
	// 			if (req.body.type == 'aadhar_front') {
	// 				if (user.kyc.aadhar_front != '' && user.kyc.aadhar_front != undefined)
	// 					helper.unlinkOldImages('./uploads/documents/' + user.kyc.aadhar_front.image_name);
	// 				user.kyc.aadhar_front.image_name = res2;
	// 				user.kyc.aadhar_front.status = false;
	// 			} else if (req.body.type == 'aadhar_back') {
	// 				if (user.kyc.aadhar_back != '' && user.kyc.aadhar_back != undefined)
	// 					helper.unlinkOldImages('./uploads/documents/' + user.kyc.aadhar_back.image_name);
	// 				user.kyc.aadhar_back.image_name = res2;
	// 				user.kyc.aadhar_back.status = false;
	// 			} else {
	// 				if (user.kyc.pancard != '' && user.kyc.pancard != undefined)
	// 					helper.unlinkOldImages('./uploads/documents/' + user.kyc.pancard.image_name);
	// 				user.kyc.pancard.image_name = res2;
	// 				user.kyc.pancard.status = false;
	// 			}
	// 		}
	// 		user.is_kyc_verified = false;
	// 		if (user.kyc.aadhar_front != undefined && user.kyc.aadhar_back != undefined && user.kyc.pancard != undefined) {
	// 			if (user.kyc.aadhar_front.status && user.kyc.aadhar_back.status && user.kyc.status)
	// 				user.is_kyc_verified = true;
	// 		}
	// 		user.save((err, user) => {
	// 			if (err) {
	// 				return res.status(200).json({
	// 					title: 'An error occurred',
	// 					error: "true",
	// 					details: err
	// 				});
	// 			}
	// 			user.password = null;
	// 			return res.status(200).json({
	// 				title: 'KYC details updated Succesfully',
	// 				error: "false",
	// 				user: user
	// 			});
	// 		});
	// 	}
	// });
}

const redeemGiftCard = (req, res) => {
	giftCard.findOne({
		$and: [
			{ code: req.body.code },
			{ isRedemed: false }
		]
	}, (error, response) => {
		if (error) {
			res.status(500).json({
				title: 'Something went wrong please try again.',
				error: "true",
				details: error
			});
		}
		if (!response) {
			res.status(500).json({
				title: 'Invalid gift card',
				error: "true",
				details: response
			});
		}
		else {
			let credit_points = req.body.userData.credit_points + response.amount;
			User.findOneAndUpdate({ _id: req.body.userData._id }, { $set: { credit_points: credit_points } }, (error, user) => {
				if (error) {
					return res.status(500).json({
						title: "Something went wrong updating data. Please try again.",
						error: "true",
						details: error
					});
				} else {
					response.isRedemed = true;
					response.save();
					let userActivityData = new userActivity({
						note: "Redeemed Gift card.",
						amount: response.amount
					});

					userActivityData.activity_type = 'wallet_topup';
					userActivityData.user_id = req.body.userData._id;
					userActivityData.save((err, data) => {
						//console.log("saved useractivity", data);
					});
					return res.status(200).json({
						title: 'Gift redeemed successfully',
						error: "false",
						details: response
					});
				}
			});
		}
	})
}

const rechargeWallet = async(req, res) => {
	let percentage = 21.88;
	// Do payment get transaction and after successfull transaction update the same in user data and user activity.
	let errors = req.validationErrors();
	if (errors) {
		return res.status(500).json({
			error: true,
			message: "validation Error.",
			details: errors
		});
	} else {
		let walletAmount = ((Number(req.body.topAmount) - (Number(req.body.topAmount) * percentage) / 100) + Number(req.body.userData.balanceWallet)).toFixed(2);
		let bonusAmount = (((Number(req.body.topAmount) * percentage) / 100) + Number(req.body.userData.bonusWallet)).toFixed(2);
		console.log("wallet amount",walletAmount);
		console.log("bonus",bonusAmount);
		User.findOneAndUpdate({ _id: req.body.userData._id }, { $set: { balanceWallet: walletAmount, bonusWallet: bonusAmount } }, { new: true }, async (error, response) => {
			if (error) {
				return res.status(500).json({
					title: "Something went wrong updating data. Please try again.",
					error: "true",
					details: error
				});
			} else {

				let userActivityData = new userActivity({
					note: "Top up for wallet",
					amount: ((Number(req.body.topAmount) * percentage) / 100).toFixed(2)
				});

				userActivityData.activity_type = 'wallet_topup';
				userActivityData.user_id = req.body.userData._id;
				userActivityData.save((err, data) => {
					//console.log("saved useractivity");
				});
				const toWords = new ToWords();

				let gstInWords = toWords.convert(((Number(req.body.topAmount) * percentage) / 100).toFixed(2), { currency: true });
				let totalInWords = toWords.convert(Number(req.body.topAmount).toFixed(2), { currency: true });
				let invoiceId = Date.now();
				const deliveryOptions = {
					logo: "https://dreamhousie.com/logo.png",
					name: "Dream Housie",
					address1: "Madhapur Hyderabad",
					address2: "Telangana, 500081",
					orderId: `INV-${invoiceId}`,
					phoneNumber: req.body.userData.mobile,
					customerName: req.body.userData.name.charAt(0).toUpperCase() + req.body.userData.name.slice(1),
					date: moment().format('MMMM Do, YYYY'),
					paymentTerms: "Deposit Invoice",
					items: [
						{
							amount: req.body.topAmount,
							service_code: "Deposit",
							description: "Online gaming service",
							cgst:0,
							sgst:0,
							gst:((Number(req.body.topAmount) * percentage) / 100).toFixed(2),
							taxable_amount: (Number(req.body.topAmount) - ((Number(req.body.topAmount) * percentage) / 100)).toFixed(2),
							invoice_amount: req.body.topAmount
						}
					],
					gst: ((Number(req.body.topAmount) * percentage) / 100).toFixed(2),
					taxable_amount: (Number(req.body.topAmount) - ((Number(req.body.topAmount) * percentage) / 100)).toFixed(2),
					total: req.body.topAmount,
					balanceDue: req.body.topAmount,
					gstInWords,
					totalInWords,
					user_address: req.body.userData.address,
					pincode: req.body.userData.pincode,
					state: req.body.userData.state,
					terms: "This is a Computer generated invoice, hence signature is not required"
				}
				let invoiceUrl = "";
				try {
					let generatePdf = await createInvoice.getInvoice(deliveryOptions);
					invoiceUrl = await fileUploader.uploadPdfBufferToAWS(generatePdf,invoiceId);
				} catch (errr){
					console.log(errr);
				}
		        // console.log(generatePdf);
				let transcation = new Transaction({
					user_id: req.body.userData._id,
					new_balance: (((Number(req.body.topAmount) - (Number(req.body.topAmount) * percentage) / 100)) + Number(req.body.userData.balanceWallet)).toFixed(2),
					old_balance: req.body.userData.balanceWallet,
					type: 'credit',
					description: "Top up for wallet",
					amount: (Number(req.body.topAmount) - (Number(req.body.topAmount) * percentage) / 100).toFixed(2),
					status: 'accept',
					bonusAmount: ((Number(req.body.topAmount) * percentage) / 100).toFixed(2),
					gstAmount: ((Number(req.body.topAmount) * percentage) / 100).toFixed(2),
					invoice: invoiceUrl
				});

				let tds = new tdsTable({
					user_id: req.body.userData._id,
					amount: req.body.topAmount,
					type: 'deposit',

				});
				console.log(req.body.topAmount, "req.body.userData._id")

				transcation.save((err, data) => {
					//console.log("saved transaction");
				});
				tds.save((err, data) => {
					//console.log("saved transaction");
				});
				await User.findOneAndUpdate(
					{ _id: req.body.userData._id }, // Specify the document to update
					{ $inc: { totalDepositAmount: ((Number(req.body.topAmount) * percentage) / 100).toFixed(2) } } // Increment the 'amount' field by 100
				);
				return res.status(200).json({
					title: "Wallet top up successfull.",
					error: "false",
					details: response
				});
			}
		});
	}
}

async function tsdCalculation(amount, userId) {
	try {
		let tds = await User.find({ _id: userId }).exec();

		let tdsAmount;
		let remainingAmount;

		if (amount > tds[0].totalDepositAmount) {

			const amt = amount - tds[0].totalDepositAmount;
			tdsAmount = amt * 30 / 100
			remainingAmount = 0
		}
		else if (amount < tds[0].totalDepositAmount) {

			tdsAmount = 0
			remainingAmount = tds[0].totalDepositAmount - amount
		}
		else {

			tdsAmount = 0
			remainingAmount = 0
		}

		return { tdsCut: amount - tdsAmount, remainingAmount, tdsAmount }

	}
	catch (err) {
		console.log(err)
	}
}



const withdrawMoney = async (req, res) => {
	let errors = req.validationErrors();
	if (errors) {
		return res.status(500).json({
			error: true,
			message: "validation Error.",
			details: errors
		});
	} else {
		//	let data=await WithdrawRequests.find({user_id:req.body.userData._id}).exec()
		if (req.body.userData.bank.status === 'accepted' && req.body.userData.kyc.pancard.status === "accepted") {
			let data = await WithdrawRequests.aggregate([
				{ "$match": { user_id: req.body.userData._id } },
				{
					"$project": {
						"_id": { "$toString": "$_id" }, "user_id": { "$toString": "$user_id" }, "fee": 1, "amount": 1,
						"status": 1,
						"description": 1,
						"createdAt": 1,
						"updatedAt": 1,
						"wallet_balance": 1

					}
				}

			])
			const targetDate = new Date();

			const totalAmount = data.reduce((acc, transaction) => {
				const transactionDate = new Date(transaction.createdAt);

				if (transactionDate.toDateString() === targetDate.toDateString()) {
					acc += transaction.amount;
				}

				return acc;
			}, 0);
			console.log(totalAmount, "data")

			const hasPending = data.some(item => item.status === 'processing');
			if(!!hasPending){
				return res.status(200).json({
					error: true,
					message: "previous withdrwal pending",
					details: "You cannot withdraw amount because previous withdrawl amount is in pending"
				});
			}
			if (totalAmount < 50000 && (totalAmount + parseInt(req.body.amount) <= 50000)) {
				if (parseInt(req.body.amount) > parseInt(req.body.userData.winAmount)) {
					return res.status(200).json({
						error: true,
						message: "Insufficient Balance",
						details: "You have requested higher amount than your actual balance."
					});
				}
				const tdsAmount = await tsdCalculation(req.body.amount, req.body.userData._id)
				const request = new WithdrawRequests({
					user_id: req.body.userData._id,
					amount: parseInt(tdsAmount.tdsCut),
					withdrawal_amount: req.body.amount,
					fee: 5,
					description: "",
					wallet_balance: req.body.userData.winAmount + req.body.userData.balanceWallet
				});


				if (req.body.userData.winAmount < Number(req.body.amount)) {
					let dum = await User.updateOne({ _id: req.body.userData._id }, { $inc: { winAmount: 0, balanceWallet: Number(req.body.amount) - req.body.userData.winAmount } })
				} else {
					let xx = Math.abs(req.body.amount) * -1;
					let dum = await User.updateOne({ _id: req.body.userData._id }, { $inc: { winAmount: xx } })
				}

				request.save(async function (err, userData) {
					if (err) {
						return res.status(500).json({
							error: true,
							message: "Error occured",
							details: err
						});
					} else {
						let balance = req.body.userData.winAmount + req.body.userData.balanceWallet
						let newBalance = balance - Number(req.body.amount);

						const transaction = new Transaction({ user_id: req.body.userData._id, type: 'debit', description: "Withdrawal request created", status: "processing", amount: Number(tdsAmount.tdsCut).toFixed(2), tds_amount: Number(tdsAmount.tdsAmount).toFixed(2), withdraw_id: userData._id, new_balance: newBalance, old_balance: balance })
						transaction.save();
						let userActivityData = new userActivity({
							note: "Requested Money -  Withdraw Request",
							amount: parseInt(req.body.amount)
						});

						userActivityData.activity_type = 'withdraw_request';
						userActivityData.user_id = req.body.userData._id;
						userActivityData.save((err, data) => {
							//console.log("saved useractivity");
						});
						await User.findOneAndUpdate(
							{ _id: req.body.userData._id }, // Specify the document to update
							{ totalDepositAmount: tdsAmount.remainingAmount } // Increment the 'amount' field by 100
						);
						let tds = new tdsTable({
							user_id: req.body.userData._id,
							amount: parseInt(req.body.amount),
							type: 'withdraw',
							AfterTdsAmount: tdsAmount.tdsCut

						});
						tds.save((err, data) => {
							//console.log("saved transaction");
						});
						//deduct money after acceptance/credit to user mark new entry in transcactions table
						console.log(userData, "userData")
						return res.status(200).json({
							error: false,
							message: "Request Added",
							details: userData
						});
					}
				});
			} else {

				return res.status(200).json({
					error: true,
					message: "Withdraw limit reached",
					details: "You cannot withdraw more than 50000 per a day"
				});
			}
		}
		else {

			return res.status(200).json({
				error: true,
				message: "Your Kyc Details or Bank details are not updated",
				details: {}
			});
		}

	}
}



const withdrawMoneyCancel = (req, res) => {
	let errors = req.validationErrors();
	if (errors) {
		return res.status(500).json({
			error: true,
			message: "validation Error.",
			details: errors
		});
	} else {
		WithdrawRequests.findOne({
			_id: req.body.withdraw_id
		}, (error, response) => {
			if (error) {
				return res.status(500).json({
					title: 'Something went wrong please try again.',
					error: "true",
					details: error
				});
			}
			if (!response) {
				return res.status(500).json({
					title: 'Invalid Withdraw Id',
					error: "true",
					details: response
				});
			}
			else {
				WithdrawRequests.findOneAndUpdate({ _id: response._id }, { $set: { status: 'cancelled', description: req.body.description } }, { new: true }, (error, request) => {
					if (error) {
						return res.status(500).json({
							title: "Something went wrong updating data. Please try again.",
							error: "true",
							details: error
						});
					} else {
						let userActivityData = new userActivity({
							note: "withdraw request cancelled by user",
							amount: request.amount,
						});

						userActivityData.activity_type = 'withdraw_request';
						userActivityData.user_id = req.body.userData._id;
						userActivityData.save((err, data) => {
							//console.log("saved useractivity", data);
						});
						return res.status(200).json({
							title: 'Withdraw request cancelled',
							error: "false",
							details: request
						});
					}
				});
			}
		});
	}
}

const deleteNotification = async (req, res) => {
	try {
		console.log(req.body)
		let allNotification = await Notification.deleteMany({ _id: { $in: req.body.deleteArrId } });

		return res.status(200).json({
			title: 'Succesfully deleted',
			error: "false",
			details: allNotification
		});

	} catch (error) {

		return res.status(500).json({
			title: "Error while deleting",
			error: "true",
			details: error.message
		});
	}
}

const syncAll = async (req, res) => {
	try {
		console.log(req.body)
		let allNotification = await Notification.updateMany({ _id: { $in: req.body.readArrId } }, { "$set": { "read": true } });

		return res.status(200).json({
			title: 'All notification are marked as read',
			error: "false",
			details: allNotification
		});

	} catch (error) {

		return res.status(500).json({
			title: "Error while marking status",
			error: "true",
			details: error.message
		});
	}
}

const listAllNotifications = async (req, res) => {
	let allNotification;

	try {

		if (req.body.deleteArrId) {
			await Notification.deleteMany({ _id: { $in: req.body.deleteArrId } });
		}

		let query = { user_id: req.body.userData._id }

		if (req.body.dateTime) {
			query.createdAt = { $gt: new Date(req.body.dateTime) }
		}

		allNotification = await Notification.find(query);

		if (req.body.dateTime) {
			await Notification.updateMany({ read: false, user_id: req.body.userData._id }, { "$set": { "read": true } });
		}

		return res.status(200).json({
			title: 'List of all notification.',
			error: "false",
			details: allNotification
		});
	} catch (error) {
		return res.status(500).json({
			title: "Something went wrong!",
			error: "true",
			details: error.message
		});
	}
}

const getUserActivity = async (req, res) => {

	try {
		let userActivityData = await userActivity.find({ user_id: req.body.userData._id }).exec();
		return res.status(200).json({
			title: 'User Activity details',
			error: "false",
			details: userActivityData
		});
	}
	catch (err) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: err
		});
	}
}

const onlinePayment = async (req, res, cb) => {
	try {
		let booing;
		let returnBooking;
		let total = 0;
		if (req.query.order_id != undefined) {
			booking = await Bookings.find({ order_id: req.query.order_id }).exec();

			total = booking.reduce(function (pv, cv, ci) {
				return pv + cv.total_amount;
			}, 0);
		}
		//console.log(total, 'asdada')
		total = total.toFixed(2).replace('.', '').padStart(12, 0);
		cb(null, { total: total, order_id: req.query.order_id });
		//console.log(booking, 'total', total)
	} catch (err) {
		cb(err, null)
	}
}

const getPromoCodeDetails = async (req, res) => {
	try {
		let query = {
			code: req.query.code,
			start_date: { $lte: req.query.start_date },
			end_date: { $gte: req.query.end_date },
			$or: [
				{ island_from: req.query.departure, island_to: req.query.arrival },
				{ island_from: req.query.arrival, island_to: req.query.departure },
			]
		}
		let promoCodeData = await promoCode.find(query).exec();
		if (promoCodeData && promoCodeData.length > 0) {
			let check = true;
			if (check) {
				let userId = req.body && req.body.userData && req.body.userData._id ? req.body.userData._id : req.user._id;
				let useCountForCode = await Bookings.countDocuments({ 'promoCode.id': promoCodeData[0]._id.toString(), user_id: userId, booking_status: { $nin: ["pending", "cancelled", "failed"] } }).exec();
				if (parseInt(useCountForCode) >= parseInt(promoCodeData[0].redeem_count)) {
					return res.status(400).json({
						title: 'Promo code already redeemed.',
						error: "true",
						details: []
					});
				}
				return res.status(200).json({
					title: 'Promo code details',
					error: "false",
					details: promoCodeData
				});
			} else {
				return res.status(400).json({
					title: 'Promo code not applicable for the game selected.',
					error: "true",
					details: []
				});
			}
		}
		return res.status(400).json({
			title: 'Promo code you entered is incorrect.',
			error: "true",
			details: promoCodeData
		});

	}
	catch (err) {
		return res.status(500).json({
			title: "Promo Code details not found. Please try again using valid code.",
			error: "true",
			details: err
		});
	}
}

const getBanners = async (req, res) => {

	try {
		let banners = await Banner.find({ status: true, BannerType: 1, show_status: true }).exec();


		return res.status(200).json({
			title: 'Banner List',
			error: "false",
			details: shuffleArray(banners)
		});
	}
	catch (err) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: err
		});
	}
}
const getPopUpBanners = async (req, res) => {

	try {
		let banners = await Banner.find({ status: true, BannerType: 2, show_status: true }).exec();
		return res.status(200).json({
			title: 'Banner List',
			error: "false",
			details: shuffleArray(banners)
		});
	}
	catch (err) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: err
		});
	}
}

const getuserTransactions = async (req, res) => {

	try {
		let transcations = await Transaction.find({ user_id: req.body.userData._id },{ tds_amount: 0 }).sort({ _id: -1 }).exec();
		return res.status(200).json({
			title: 'Transaction List',
			error: "false",
			details: transcations
		});
	}
	catch (err) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: err
		});
	}
}

const withdrawRequests = async (req, res) => {
	try {
		let requests = await WithdrawRequests.find({ user_id: req.body.userData._id }).exec();
		return res.status(200).json({
			title: 'Withdraw Request List',
			error: "false",
			details: requests
		});
	}
	catch (err) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: err
		});
	}
}

const getTranscationDetails = async (req, res) => {

	try {
		let transcation = await Transaction.findOne({ transaction_id: req.headers.transaction_id }).sort({ _id: -1 }).exec();
		return res.status(200).json({
			title: 'Transaction Details',
			error: "false",
			details: transcation
		});
	}
	catch (err) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: err
		});
	}
}

const sendSMS = async (req, res) => {

	try {
		const http = require("https");

		const options = {
			"method": "GET",
			"hostname": "api.msg91.com",
			"port": null,
			"path": "/api/v5/otp?template_id=6155eaf0996b9f34731e55f5&mobile=918698511512&authkey=367596A3iJJnJm614d96c1P1&otp=123456",
			"headers": {
				"Content-Type": "application/json"
			}
		};

		const req = await http.request(options, function (res) {
			const chunks = [];

			res.on("data", function (chunk) {
				chunks.push(chunk);
			});

			res.on("end", function () {
				const body = Buffer.concat(chunks);
				console.log(body.toString());
			});
		});
		req.write("{\"Value1\":\"Param1\",\"Value2\":\"Param2\",\"Value3\":\"Param3\"}");
		req.end();
		return res.status(200).json({
			title: "SMS sent",
			error: "false",
			details: body.toString()
		});
	} catch (err) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: err
		});
	}
}

const getOnGoingGames = async (req, res) => {
	console.log(req.body)
	await game.find((err, docs) => {
		if (!err) {
			res.status(200).json({
				title: "On Going Game List.",
				error: "false",
				details: docs
			});
		} else {
			res.status(200).json({
				title: "Something went wrong. Please try again.",
				error: "true",
				details: err
			});
		}
	}).clone
}

const getUpcomingGames = async (req, res) => {
	// console.log(req.body)
	await game.find((err, docs) => {
		if (!err) {
			res.status(200).json({
				title: "On Going Game List.",
				error: "false",
				details: docs
			});
		} else {
			res.status(200).json({
				title: "Something went wrong. Please try again.",
				error: "true",
				details: err
			});
		}
	}).clone
}

const buyTicket = async (req, res) => {
	console.log('==>', req.body.gameId)
	console.log('====>', req.body.userData.credit_points)

	let games = await game.findById({ _id: req.body.gameId }, (err, docs) => {
		console.log(docs, err)
	}).exec()
	console.log(games)
	res.send(games)
}


const verifyEmail = async (req, res) => {
	try {
		let id = req.body.user_id;
		console.log('updateEmailStatus is call get val == ', id);

		let response = await User.updateOne({ _id: id }, {
			is_email_verified: true
		});

		if (response) {
			res.status(200).json({
				title: "success", error: "false",
				details: response
			});
		} else {
			res.status(200).json({
				title: "Something went wrong. Please try again.", error: "true",
				details: ''
			});

		}

	} catch (error) {
		console.log(error);
		res.status(500).json({
			title: "Server error", error: "true",
			details: error
		});
	}


}

const ticketImage = async (req, res) => {
	//console.log('ticketImage')
	try {

		let node;
		let gameDetails = await game.find({ _id: req.body.gameId }).exec()
		let ticket = await ticketaudits.find({ gameId: req.body.gameId }).populate("userId").exec();
		let ticketUnique = await ticketaudits.aggregate([{ $match: { gameId: req.body.gameId } }, { $group: { _id: "$userId" } }]);
		//  console.log(ticket)
		let finalArray = await new Promise(async (resolve) => {
			if (ticketUnique.length == 0) {
				resolve([])
			}

			let arrayRef = [];
			for (let i = 0; i < ticketUnique.length; i++) {
				let dum = await ticket.filter(x => x.userId._id == ticketUnique[i]._id);
				//    console.log("dum",dum)
				// for (let j = 0; j < dum.length; j++) {

				// 	dum[j].ticketName = dum[j].userId.name + ` (T${j + 1})`;
				// }
				arrayRef = [...arrayRef, ...dum];
				//    console.log("array ref-----",arrayRef)
				if (i == ticketUnique.length - 1) {
					resolve(arrayRef)
				}
			}
		});
		finalArray.sort((a, b) => a.ticketName.localeCompare(b.ticketName))

		// console.log(a.ticketName,"===",b.ticketName)
		// if ( a.ticketName < b.ticketName ){
		// 	return -1;
		//   }
		//   if ( a.ticketName > b.ticketName ){
		// 	return 1;
		//   }
		//   return 0;



		//    ticket = finalArray;
		// res.status(200).json({
		// 	title: "success", error: "false",
		// 	details: []
		// });

		const divss = []

		for (let i = 0; i < finalArray.length; i++) {
			let ticketss = finalArray[i].tickets;
			//   <div id='app' class="row">
			// 		<div>
			// 			<h4>Ticket</h4>
			// 			<table border="1">
			// 			  <tr>
			// 				  ${ticketss[0].map((item) => `<td>${item > 0 ? item : ""}</td>`)}
			// 			  </tr>
			// 			  <tr>
			// 			  ${ticketss[1].map((item) => `<td>${item > 0 ? item : ""}</td>`)}</tr>
			// 			  <tr>
			// 			  ${ticketss[2].map((item) => `<td>${item > 0 ? item : ""}</td>`)}
			// 			  </tr>
			// 			</table>
			// 		</div>
			//       </div>
			let eachDiv = `<table border="1" align="center" style="width:400px; border-spacing:0; background: #ffffff; margin-bottom: 8px">
	  <tr>
		  <td colspan="9" style="font-size: 12px; color: #ffffff; line-height: 0; background: #0c1d40;">
​
			  <h4 style="font-family:Arial, sans-serif; padding-left: 5px;">${finalArray[i].ticketName}</h4>
		  </td>
	  </tr>
	  <tr>
		  ${ticketss[0].map((item) => `<td style="font-family:Arial, sans-serif; text-align: center; height: 32px; width: 32px;">${item == 0 ? "" : item}</td>`)}
	  </tr>
	  <tr>
		  ${ticketss[1].map((item) => `<td style="font-family:Arial, sans-serif; text-align: center; height: 32px; width: 32px;">${item == 0 ? "" : item}</td>`)}
	  </tr>
	  <tr>
		  ${ticketss[2].map((item) => `<td style="font-family:Arial, sans-serif; text-align: center; height: 32px; width: 32px;">${item == 0 ? "" : item}</td>`)}
	  </tr>
  </table>`;
			divss.push(eachDiv);
		};

		let html = `<!DOCTYPE html>
		<html lang="en">
		​
		<head>
			<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
			<meta http-equiv="X-UA-Compatible" content="IE=edge">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>Tickets</title>
		</head>
		​
		<body style="padding: 30px;background: #f3f4fb;">
			<h3>${gameDetails[0].name}</h3>
			${divss.join('')}
			
		</body>
		​
		</html>`;

		let options = { format: 'A4', path: `./testtt.pdf` };
		let file = { content: html };
		let data = await html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
			return pdfBuffer;
		});






		// const mergedPdf = await PDFDocument.create(); 
		// for (const pdfBytes of bufferFinal) { 
		// 	const pdf = await PDFDocument.load(pdfBytes); 
		// 	const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
		// 	copiedPages.forEach((page) => {
		// 		 mergedPdf.addPage(page); 
		// 	}); 
		// } 

		// const buf = await mergedPdf.save();
		// let path = './merged.pdf'; 
		// fs.open(path, 'w', function (err, fd) {
		// 	fs.write(fd, buf, 0, buf.length, null, function (err) {
		// 		fs.close(fd, function () {
		// 			console.log('wrote the file successfully');
		// 		}); 
		// 	}); 
		// }); 
		var base64 = await btoa(
			new Uint8Array(data)
				.reduce((data, byte) => data + String.fromCharCode(byte), '')
		);
		let finalDataa = `${base64}`

		res.status(200).send(finalDataa);
		//res.send(200)

	} catch (error) {
		console.log(error);
		res.status(500).json({
			title: "Server error", error: "true",
			details: error
		});
	}


}

const getUserReferals = async (req, res) => {
	try {

		let pipeline = [];

		pipeline.push({
			'$match': {
				'refered_by': new mongoose.Types.ObjectId(req.body.userId)
			}
		});

		pipeline.push({ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } });
		pipeline.push({ $unwind: "$user" });
		pipeline.push({ $project: { "userId": 1, "name": "$user.name", "profile": "$user.profile_image", "amount": 1, "code": 1, "totalAmount": 1, "status": 1 } });

		let data = await referalsData.aggregate(pipeline).exec();



		let finalData = []

		data.map((item) => {

			if (item.status == 0) {
				finalData.push({
					userId: item.userId,
					name: item.name,
					status: "not joined"
				})

			}
			else {

				finalData.map(val => {
					if (val.userId.toString() == item.userId.toString()) {
						val.status = "joined"
					}
				})

			}
		})

		console.log(finalData, "finaldata")



		return res.status(200).json({
			title: 'user referrals',
			error: "false",
			details: finalData
		});

	} catch (error) {
		res.status(500).json({
			title: "Server error", error: "true",
			details: error
		});
	}
}

const addUserNotification = async (req, res) => {
	const {
		message,
		userId,

	} = req.body;
	const newUsernotification = new usernotification({
		message,
		userId
	});
	newUsernotification.save(function (err, bonusData) {
		if (err) {
			return res.status(400).json({
				error: true,
				message: "Error occured while adding Bonus.",
				err: err
			});
		} else {
			return res.status(200).json({
				error: false,
				message: "Notification added",
				bonusData: bonusData
			});
		}
	})
}

const getUserNotifications = async (req, res) => {
	try {
		let data = await usernotification.find({ userId: req.body.userId }).sort({ createdAt: -1 }).exec();
		return res.status(200).json({
			title: 'Notification List',
			error: "false",
			details: data
		});
	}
	catch (error) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: error
		});
	}
}

const addUserToken = async (req, res) => {
	// console.log(req.body);
	try {
		let data = await User.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(req.body.userId) }, { $push: { deviceToken: req.body.token } })
		return res.status(200).json({
			error: "false",
			details: data
		});
	}
	catch (error) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: error
		});
	}
}

const claimUserPrizes = async (req, res) => {
	try {
		let data = await prizes.find({ userId: req.body.userId, ticketId: req.body.ticketId });
		let finalDetails = {
			firstLine: 0,
			SecondLine: 0,
			thirdLine: 0,
			fullHouse: 0,
			jaldiFive: 0,
			corners: 0,
		};
		for (let i = 0; i < data.length; i++) {
			if (data[i].jaldiWinner == 1) {
				finalDetails.jaldiFive = 1;
			}
			if (data[i].cornerWinner == 1) {
				finalDetails.corners = 1;
			}
			if (data[i].firstRowWinner == 1) {
				finalDetails.firstLine = 1;
			}
			if (data[i].secondRowWinner == 1) {
				finalDetails.SecondLine = 1;
			}
			if (data[i].thirdRowWinner == 1) {
				finalDetails.thirdLine = 1;
			}
			if (data[i].fullHousiWinner == 1) {
				finalDetails.fullHouse = 1;
			}
		}
		return res.status(200).json(finalDetails);
	} catch (error) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: error
		});
	}

}

const addGameNotification = async (req, res) => {
	try {
		const data = {
			userId: req.body.userId,
			gameId: req.body.gameId,


		}
		const newRecord = new gameNotification(data);
		newRecord.save(function (err, userData) {
			if (err) {
				return res.status(500).json({
					error: true,
					message: "Error occured while creating user.",
					err: err
				});
			} else {
				return res.status(200).json({
					error: false,
					message: "Succesfull",
					details: ''
				});
			}
		})

	}
	catch (err) {
		return res.status(200).json({

			title: "Something went wrong. Please try again.",
			error: true,
			details: ''
		});
	}

}

const getSingleTicket = async (req, res) => {
	try {

		let ticketData = await ticketAudit.aggregate([
			{ "$match": { gameId: req.body.gameId, userId: req.body.userId, ticketId: req.body.ticketId } },
			{ "$project": { "ticket": "$tickets" } }

		])

		// const ticketData=await ticketAudit.find({gameId:req.body.gameId,userId:req.body.userId,ticketId:req.body.ticketId})
		const numberCross = await numberCrossed.find({ gameId: req.body.gameId, userId: req.body.userId, ticketId: req.body.ticketId })
		//console.log(ticketData,"======>",numberCross)

		// ticketData[0].numbersCrossed=numberCross[0].numbersCrossed
		const data = ticketData[0]
		// data.numberCrossed =numberCross[0].numbersCrossed ;
		// //console.log(numberCrossed:numberCross.length?numberCross[0].numbersCrossed:[]);
		data.gameId = req.body.gameId
		console.log([{ tickets: data, _id: req.body.userId }], "ticketData[0]")

		return res.status(200).json({
			title: 'ticket data',
			error: "false",
			details: { tickets: [ticketData[0]], numberCrossed: numberCross.length ? numberCross[0].numbersCrossed : [] }
		});

	}
	catch (error) {
		return res.status(500).json({
			title: "Something went wrong. Please try again.",
			error: "true",
			details: error
		});
	}


}
const tdsDetailsForUser = async (req, res) => {
	console.log(req.body.userData._id, "req.body.userData._id")
	const response = await tsdCalculation(req.body.amount, req.body.userData._id)
	console.log(response, "response")

	return res.status(200).json({
		error: true,
		message: "tds Details",
		details: { withdrawMoney: req.body.amount, AfterTdsAmount: response.tdsCut }
	});

}

const depositDetailsForUser = async (req, res) => {
	console.log(req.body.deposit_amount, "req.body.deposit_amount");
	let percentage = 21.88;
	const response = {
		deposit_amount : req.body.deposit_amount,
		gst_amount : ((Number(req.body.deposit_amount) * percentage) / 100).toFixed(2),
		bonus_amount : ((Number(req.body.deposit_amount) * percentage) / 100).toFixed(2),
		// amount_to_add : Number(req.body.deposit_amount) - ((Number(req.body.deposit_amount) * percentage) / 100).toFixed(2)
	} 
	console.log(response, "response")

	return res.status(200).json({
		error: true,
		message: "deposit Details",
		details: { ...response }
	});

}

module.exports = {
	sendSMS,
	verifyOTP,
	verifyLoginOTP,
	resendOTP,
	userSignup,
	loginUser,
	logoutUser,
	editProfile,
	removeUserProfileImage,
	forgotPassword,
	verifyresetPasswordToken,
	resetPassword,
	editProfileImage,
	getuserDetails,
	redeemGiftCard,
	rechargeWallet,
	getUserActivity,
	onlinePayment,
	changePassword,
	listAllNotifications,
	syncAll,
	deleteNotification,
	getPromoCodeDetails,
	getBanners,
	getPopUpBanners,
	getuserTransactions,
	getTranscationDetails,
	withdrawMoney,
	withdrawRequests,
	withdrawMoneyCancel,
	saveKYC,
	saveBankDetails,
	getOnGoingGames,
	getUpcomingGames,
	buyTicket,
	verifyEmail,
	ticketImage,
	getUserReferals,
	addUserNotification,
	getUserNotifications,
	claimUserPrizes,
	addUserToken,
	addGameNotification,
	getSingleTicket,
	tsdCalculation,
	tdsDetailsForUser,
	depositDetailsForUser

}

