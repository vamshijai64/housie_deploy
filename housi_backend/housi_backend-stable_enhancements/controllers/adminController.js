const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var randomstring = require("randomstring");
// const schedule = require('node-schedule');
var fs = require('fs');
const mongoose = require("mongoose");
var Admin = require('../models/admin');
const Transaction = require('../models/transaction');
const giftCard = require('../models/gift');
const PromoCode = require('../models/promoCode');
const Games = require('../models/games');
const User = require('../models/users');
const otp = require('../models/otp');
const Question = require('../models/questions');
const WithdrawRequests = require('../models/withdrawRequests');
const Banner = require('../models/banners');
const Bonus = require('../models/bonus');
const socketController = require('./socketControllers');
const moment = require('moment');
const referalsData = require('../models/referalsData');
const Quiz = require('../models/quiz');
var helper = require('../lib/helperFunction');
const counter = require('../models/gameCounter.model')
const gameRecord = require('../models/gameRecord')
const usernotification = require('../models/usernotification')
const gameNotification = require('../models/gameNotification')
const async = require("async");
const { ignoreNullOrUndefined } = require('csv-express');
const schedule = require('node-schedule');
const { Console } = require('console');
const date = new Date(2022, 2, 14, 1, 39, 0);
const claimWinner = require('../models/claim-prize.model');
const notification = require('../models/notification');
const transaction = require('../models/transaction');
const users = require('../models/users');
const ObjectID = require('mongodb').ObjectId;
const numbersCrossedModel = require('../models/numbersCrossed.model');
const ticketAudit = require('../models/ticketsAudit.model');
var FCM = require('fcm-push');
const AWS = require('aws-sdk')
const { CLIENT_RENEG_LIMIT } = require('tls');

const admin = require("firebase-admin");
const serviceAccount = require("../public/hosi_service_file.json");
const crypto = require("crypto");
const gameNumbers = require("../models/gameNumbers.model");
const gameNumbers2 = require('./gameNumbers');
const { tsdCalculation } = require('./userController');
const tdsTable = require('../models/tdsTable');
const form16Table = require('../models/form16Table');
const { layoutSinglelineText } = require('pdf-lib');
//const Firebase = require('firebase');



const job = schedule.scheduleJob(date, function () {
    console.log('The world is going to end today.');
});
var smtpTransport = nodemailer.createTransport({
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

var exports = module.exports = {};

exports.loginUser = async (req, res, next) => {
    let errors = req.validationErrors();
    if (errors) {
        return res.status(200).json({
            title: 'An error occurred',
            error: true,
            details: errors
        });
    } else {


        Admin.findOne({
            email: req.body.email, isBlocked: "0"

        }, async (err, user) => {

            console.log('user=====>', user)



            if (err) {
                return res.status(200).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            }
            if (!user) {
                return res.status(200).json({
                    title: 'user not found',
                    error: true,
                    details: "invalid Login"
                });
            }

            if (user == null) {
                return res.status(200).json({
                    title: 'user not found',
                    error: true,
                    details: "invalid Login"
                });

            }
            if (user != null) {
                const passwordMatch = await bcrypt
                    .compare(req.body.password, user.password)
                    .then(async (isMatch) => { return isMatch ? true : false })


                if (!passwordMatch) {
                    return res.status(400).json({
                        title: 'Invalid username/password',
                        error: true,
                        details: "invalid Login"
                    });
                }
                if (parseInt(user.isBlocked) == 1) {
                    return res.status(200).json({
                        title: 'You are blocked.Please contact admin',
                        error: true,
                        details: "invalid Login"
                    });
                }
                const data = {
                    userId: user._id,
                    email: user.email,
                    mobile: user.mobile,
                    role: user.role,
                    admin_privileges: user.admin_privileges
                }
                let token = jwt.sign({
                    user: data
                }, 'housie', {
                    expiresIn: 60 * 60 * 24 * 1000
                });
                user.save(function (err) {
                    if (err) {
                        return res.status(200).json({
                            title: 'An error occurred',
                            error: true,
                            details: err
                        });
                    }

                    res.status(200).json({
                        title: 'user found',
                        error: false,
                        token: token,
                        userDetails: user
                    });
                });
            }
        });
    }
}
exports.logout = (req, res) => {
    let user = req.body.userData;
    user.isLoggedIn = false;
    user.save((err, data) => {
        if (err) {
            return res.status(200).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        return res.status(200).json({
            message: 'Logout succesfully',
            error: false
        });
    });
}
exports.forgotPassword = (req, res) => {

    /*let token = randomstring.generate({
        length: 7,
        charset: 'numeric'
    });*/
    Admin.findOne({
        email: req.body.email
    }, (err, user) => {

        if (err) {
            return res.status(400).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        if (!user) {
            return res.status(200).json({
                title: 'user not found',
                error: true,
                details: 'invalid email'

            });
        }
        if (parseInt(user.isBlocked) == 1) {
            return res.status(200).json({
                title: 'You are blocked.Please contact admin',
                error: true,
                details: "blocked user"
            });
        }
        user.resetPasswordToken = helper.saveOTP(user.mobile);
        // user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function (err) {
            if (err) {
                return res.status(200).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            } else {
                return res.status(200).json({
                    title: 'OTP Sent',
                    error: false,
                    details: 'OTP send to registered mobile no'
                });
            }
            /*let mailOptions = {
                to: user.email,
                from:'admin@dreamhousie.com',
                subject: 'Recover Your Dream Housie Account Password',
                html: `Hello,<br> 
                If you have forgotten your password, you can <a href="${req.protocol}://${req.get('host')}/user/verifyresetPasswordToken/${token}">click here</a> <br>
                If you did not request this, please ignore this email and your password will remain unchanged.<br>`
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                if (err) {
                    return res.status(200).json({
                        title: 'An error occurred',
                        error: true,
                        details: err
                    });
                }

                return res.status(200).json({
                    title: 'RESET PASSSWORD',
                    error: false,
                    details: 'Reset email sent'
                });
            });*/
        });
    });
}
exports.resetPassword = (req, res) => {
    Admin.findOne({
        // resetPasswordToken: req.body.otp,
        email: req.body.email,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    }, (err, user) => {
        if (err) {
            return res.status(400).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        if (!user || user == null) {
            return res.status(200).json({
                title: 'No user found',
                error: true,
                details: "Invalid otp or email"
            });
        }
        let UserSavedToken = user.resetPasswordToken
        if (!(UserSavedToken == req.body.otp)) {
            return res.status(200).json({
                title: 'Invalid OTP',
                error: true,
                details: "Invalid otp"
            });
        } else {
            user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save(function (err, user) {
                if (err) {
                    return res.status(400).json({
                        title: 'Something went wrong, Please try again.',
                        error: true,
                        details: err
                    });
                }
                return res.status(200).json({
                    title: 'Password Changed',
                    error: false,
                    details: "Password reset"
                });
            });
        }
    });
}
exports.changePassword = (req, res) => {

    if (!req.body.password) {
        return res.status(200).json({
            title: 'please enter password',
            error: true,
            details: ''
        });
    }

    const pass = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
    Admin.findOneAndUpdate({ _id: req.body.user_id }, { $set: { password: pass } }, (error, user) => {
        if (error) {
            return res.status(400).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        return res.status(200).json({
            title: "Password Updated",
            error: false,
            details: user
        });
    });
}
exports.editProfile = async (req, res) => {
    let userObj = {};
    if (req.body.name)
        userObj.name = req.body.name;
    if (req.body.mobile)
        userObj.mobile = req.body.mobile;
    console.log(userObj, "objecttt")

    let data = await Admin.find({
        mobile: req.body.mobile, isBlocked: "0"
    })
    console.log(data, "data");
    if (data.length > 0 && data[0]._id.toString() !== req.body.user_id) {
        return res.status(200).json({
            title: 'Mobile number already used',
            error: true,
            details: "mobile number already used"
        });
    }


    Admin.findOneAndUpdate({ _id: req.body.user_id }, { $set: userObj }, (error, user) => {
        if (error) {
            return res.status(200).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        return res.status(200).json({
            title: "User Updated",
            error: false,
            details: user
        });
    });
}
/* Users Part */
exports.getUsers = async (req, res) => {
    try {
        // let users = await User.find({ status: true }).sort({"bank.time":-1,"kyc.pancard.time":-1}).exec();
        let pipeline1 = [
            {
                $match: {
                    status: true,
                }
            },
            {
                $addFields: {
                    bankKycGtField: {
                        $cond: {
                            if: {
                                $gt: ["$bank.time", "$kyc.pancard.time"],
                            },
                            // then return its value as is
                            then: "$bank.time",
                            // else exclude this field
                            else: "$kyc.pancard.time",
                        },
                    }
                }
            }
        ];
        if(req.body.hasOwnProperty("fromDate") && req.body.fromDate !=""){
            let toDate = new Date(req.body.toDate);
            toDate.setDate(toDate.getDate()+1);
            pipeline1.push({
                $match: {
                    bankKycGtField: {
                        $gte: new Date(req.body.fromDate),
                        $lte: toDate
                    }
                }
            })
        };
        pipeline1.push({
            $sort: {
                bankKycGtField: -1
            }
        });
        let users = await User.aggregate(pipeline1)
        return res.status(200).json({
            title: 'User List',
            error: false,
            details: users
        });
    }
    catch (err) {
        return res.status(400).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.getuserDetails = async (req, res) => {
    try {
        User.findOne({
            _id: req.body.user_id
        }, async (err, user) => {
            if (err) {
                return res.status(400).json({
                    title: "Something went wrong. Please try again.",
                    error: true,
                    details: err
                });
            }
            if (!user) {
                return res.status(200).json({
                    title: "User not found",
                    error: true,
                    details: "invalid user id or user do not exists"
                });
            }
            let pipeline = [];

            pipeline.push({
                '$match': {
                    '_id': new mongoose.Types.ObjectId(user._id)
                }
            });

            pipeline.push({ $lookup: { from: 'games', localField: 'tickets.gameId', foreignField: '_id', as: 'game' } });
            pipeline.push({ $unwind: "$game" });
            pipeline.push({
                $project: {
                    "_id": 1, "gameName": "$game.name", "fees": "$game.fees", "status": "$game.status",
                    "totalWinnings": "$game.totalWinnings", "totalTickets": "$game.totalTickets"
                }
            });

            let participated_games = await users.aggregate(pipeline).exec();

            return res.status(200).json({
                title: "User details",
                error: false,
                details: user, participated_games
            });
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.getuserTransactions = async (req, res) => {
    try {
        let pipeline = [];
        if (req.body.user_id) {
            pipeline.push({ $match: { user_id: req.body.user_id } });
        }
        pipeline.push({ $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } });
        pipeline.push({ $unwind: "$user" });
        pipeline.push({
            $project: {
                "_id": 1, "username": "$user.username", "email": "$user.email",
                "balance": "$user.credit_points", "mobile": "$user.mobile", "name": "$user.name",
                "fee": 1, "amount": 1, "status": 1, "createdAt": 1, 'new_balance': 1, 'old_balance': 1,
                'type': 1, 'description': 1
            }
        });
        pipeline.push({ $sort: { createdAt: -1 } })
        // let data = await Transaction.find().exec();
        let data = await Transaction.aggregate(pipeline).exec();
        return res.status(200).json({
            title: 'Transaction List',
            error: false,
            details: data
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.updateUser = (req, res) => {
    let userObj = {};
    if (req.body.blocked)
        userObj.isBlocked = 1;
    if (req.body.unblocked)
        userObj.isBlocked = 0;
    if (req.body.verify)
        userObj.status = req.body.verify;
    User.findOneAndUpdate({ _id: req.body.user_id }, { $set: userObj }, (error, user) => {
        if (error) {
            return res.status(200).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        return res.status(200).json({
            title: "User Updated",
            error: false,
            details: user
        });
    });
}
exports.deleteUser = (req, res) => {
    try {
        User.findOne({ _id: req.body.user_id }, (err, userData) => {
            User.findByIdAndUpdate({ _id: userData._id }, { status: false }, (err, data) => {
                if (err) {
                    return res.status(200).json({
                        title: 'Unable to delete User',
                        error: true,
                        details: ''
                    });
                }
                if (userData.profile_image != "")
                    helper.unlinkOldImages('./uploads/profile/' + userData.profile_image);
                return res.status(200).json({
                    title: 'Succesfully deleted',
                    error: false,
                    details: ''
                });
            });
        });
    } catch (error) {

        return res.status(200).json({
            title: "Error while deleting",
            error: true,
            details: error.message
        });
    }
}
exports.updateUserWallet = async (req, res) => {
    let userWalletObj = {};

    userWalletObj.winAmount = req.body.winAmount;

    userWalletObj.bonusWallet = req.body.bonusWallet;

    userWalletObj.balanceWallet = req.body.balanceWallet;
    User.findOneAndUpdate({ _id: req.body.user_id }, { $set: userWalletObj }, async (error, user) => {
        if (error) {
            return res.status(400).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        const userdetails = await User.find({ _id: req.body.user_id })
        return res.status(200).json({
            title: "User Wallet Updated",
            error: false,
            details: userdetails
        });
    });

}

/* Banners Part */
exports.getBanners = async (req, res) => {
    try {
        let banners = await Banner.find({ status: 1 }).exec();
        return res.status(200).json({
            title: 'Banner List',
            error: false,
            banners: banners
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.addBanner = (req, res) => {
    if (!req.body.image_name) {
        return res.status(200).json({
            error: false,
            message: "please uploade image",
            details: "invalid image"
        });

    } else {

        const banner = new Banner({
            show_status: req.body.show_status ? req.body.show_status : false,
            image_name: req.body.image_name,
            BannerType: req.body.type,
            created_by: req.body.created_by
        });
        banner.save(function (err, bannerData) {
            if (err) {
                return res.status(400).json({
                    error: true,
                    message: "Error occured while adding banner.",
                    details: err
                });
            } else {
                return res.status(200).json({
                    error: false,
                    message: "Banner added",
                    banner: bannerData
                });
            }
        });
    }
}

exports.updateBanner = async (req, res) => {

    Banner.findOne({ _id: req.body.banner_id }, (err, banner) => {
        if (err) {
            return res.status(400).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        if (!banner) {
            return res.status(200).json({
                title: 'Banner not found',
                error: false,
                details: "invalid banner id"
            });
        }
        banner.show_status = req.body.show_status;
        banner.image_name = req.body.image_name
        banner.BannerType = req.body.type
        banner.save((err, updatedBanner) => {
            if (err) {
                return res.status(200).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            }
            return res.status(200).json({
                title: 'Banner updated',
                error: false,
                details: updatedBanner
            });
        });
    });
}
exports.deleteBanner = (req, res) => {
    try {
        if (!req.body.banner_id) {
            return res.status(200).json({
                title: 'invalid banner id',
                error: false,
                details: ''
            });

        } else {
            Banner.findOne({ _id: req.body.banner_id }, (err, bannerData) => {
                Banner.findByIdAndUpdate({ _id: bannerData._id }, { status: 0 }, (err, bannerdData) => {
                    if (err) {
                        return res.status(200).json({
                            title: 'Unable to delete banner',
                            error: true,
                            details: ''
                        });
                    }

                    return res.status(200).json({
                        title: 'Succesfully Banner deleted',
                        error: false,
                        details: ''
                    });
                });
            });
        }
    } catch (error) {

        return res.status(200).json({
            title: "Error while deleting",
            error: true,
            details: error.message
        });
    }
}

/**/

/* Question Part */
exports.getQuestions = async (req, res) => {
    try {
        let newQuiz = await Quiz.findById(req.body.set_id).exec();
        return res.status(200).json({
            title: 'Question List',
            error: false,
            questions: newQuiz.question
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.addQuestion = (req, res) => {
    try {
        const question = new Question({
            question: req.body.question,
            option_1: req.body.option_1,
            option_2: req.body.option_2,
            answer: req.body.answer,
            set_id: req.body.set_id,
            image_name: req.body.image_name
        });

        Quiz.findByIdAndUpdate(req.body.set_id, { $push: { question: question } }, { new: true }, (err, data) => {
            if (!err) {
                return res.status(200).json({
                    title: "Question added successfully",
                    error: false,
                    details: data.question
                });
            } else {
                return res.status(200).json({
                    title: "Error occured while adding question.",
                    error: true,
                    details: err
                });
            }
        })
    }
    catch (err) {
        return res.status(400).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }

}
exports.updateQuestion = async (req, res) => {

    Quiz.findOne({ _id: req.body.set_id }, (err, questionData) => {
        if (err) {
            return res.status(200).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        if (!questionData) {
            return res.status(200).json({
                title: 'Question not found',
                error: true,
                details: "invalid question id"
            });
        }
        /*questionData.question = req.body.question;
        questionData.option_1= req.body.option_1;
        questionData.option_2= req.body.option_2;
        questionData.answer= req.body.answer;
        questionData.set_id= req.body.set_id;*/
        questionData.question.forEach((question, index) => {
            if (question._id == req.body.question_id) {
                questionData.question[index].question = req.body.question;
                questionData.question[index].option_1 = req.body.option_1;
                questionData.question[index].option_2 = req.body.option_2;
                questionData.question[index].answer = req.body.answer;
                questionData.question[index].image_name = req.body.image_name;

            }
        });
        questionData.save((err, updatedQuestion) => {
            if (err) {
                return res.status(200).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            }
            return res.status(200).json({
                title: 'Question updated',
                error: false,
                details: updatedQuestion.question
            });
        });
    });

}
exports.deleteQuestion = (req, res) => {
    Quiz.findOne({ _id: req.body.set_id }, (err, questionData) => {
        if (err) {
            return res.status(200).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        if (!questionData) {
            return res.status(200).json({
                title: 'Question not found',
                error: true,
                details: "invalid question id"
            });
        }
        let questionArr = [];
        questionData.question.forEach((question, index) => {
            if (question._id != req.body.question_id) {
                questionArr.push(question);
            }
        });
        questionData.question = questionArr;
        questionData.save((err, updatedQuestion) => {
            if (err) {
                return res.status(200).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            }
            return res.status(200).json({
                title: 'Question deleted successfully',
                error: false,
                details: updatedQuestion.question
            });
        });

    });
}

/* Withdrawn Request Part */
exports.getWithdrawRequests = async (req, res) => {
    try {

        /*let data = {};
        if(req.body.user_id) {
            data.user_id = req.body.user_id;   
        }*/
        let pipeline = [];
        if (req.body.user_id) {
            pipeline.push({
                "$match": {
                    'user_id': new mongoose.Types.ObjectId(req.body.user_id),

                }
            });
        }
        pipeline.push({ $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } });
        pipeline.push({ $unwind: "$user" });

        pipeline.push({ $project: { "_id": 1, "username": "$user.username", "email": "$user.email", "balance": "$wallet_balance", "mobile": "$user.mobile", "name": "$user.name", "fee": 1, "amount": 1, "status": 1, "user_id": 1, "createdAt": 1 } });
        pipeline.push({ $sort: { createdAt: -1 } })
        let requests = await WithdrawRequests.aggregate(pipeline).exec();
        /*let requests = await WithdrawRequests.aggregate([
            { $lookup: {from: 'users', localField: 'user_id', foreignField: '_id', as: 'user'} },
            { $unwind: "$user" },
            { $project: {"_id":1,"name":"$user.name","email":"$user.email","balance":"$user.credit_points","mobile":"$user.mobile","name":"$user.name","fee":1,"amount":1,"status":1,"createdAt":1} },
            ]).exec();*/
        // let requests = await WithdrawRequests.find().exec();
        return res.status(200).json({
            title: 'Withdraw Requests List',
            error: false,
            details: requests
        });
    } catch (err) {
        return res.status(400).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.updateWithdrawRequests = async (req, res, next) => {
    let errors = req.validationErrors();
    if (errors) {
        return res.status(200).json({
            error: true,
            message: "validation Error.",
            details: errors
        });
    } else {
        WithdrawRequests.findOne({
            _id: req.body.withdraw_id
        }, async (error, response) => {
            if (error) {
                return res.status(200).json({
                    title: 'Something went wrong please try again.',
                    error: true,
                    details: error
                });
            }
            if (!response) {
                return res.status(200).json({
                    title: 'Invalid Withdraw Id',
                    error: true,
                    details: response
                });
            } else {
                WithdrawRequests.findOneAndUpdate({ _id: response._id }, { $set: { status: req.body.status, description: req.body.description } }, { new: true }, async (error, request) => {
                    if (error) {
                        return res.status(200).json({
                            title: "Something went wrong updating data. Please try again.",
                            error: true,
                            details: error
                        });
                    } else {
                        if (req.body.status == 'accept') {

                            // let walletAmount = parseInt(user.credit_points) - parseInt(response.amount);
                            // let oldAmount = user.credit_points;
                            Transaction.findOneAndUpdate({ withdraw_id: response._id }, { $set: { status: 'accepted', description: "Withdrawal request Accepted" } }, { new: true }, (error, userR) => {
                                if (error) {
                                    return res.status(200).json({
                                        title: "Something went wrong updating data. Please try again.",
                                        error: true,
                                        details: error
                                    });
                                } else {

                                    // WithdrawRequests.findOneAndUpdate({ _id: response._id }, 
                                    //     { $set: { status: req.body.status, description: req.body.description } },
                                    //      { new: true }, (error, request) => {})


                                    return res.status(200).json({
                                        title: "Withdraw request Accepted",
                                        error: false,
                                        details: request
                                    });
                                }
                            });

                        } else {
                            let transactionReq = await Transaction.findOne({withdraw_id: req.body.withdraw_id});
                            Transaction.findOneAndUpdate({ withdraw_id: response._id }, { $set: { status: 'rejected', description: "Withdrawal request rejected",type: "credit", amount: transactionReq.amount + transactionReq.tds_amount || 0 } }, { new: true }, async (error, userR) => {
                                if (error) {
                                    return res.status(200).json({
                                        title: "Something went wrong updating data. Please try again.",
                                        error: true,
                                        details: error
                                    });
                                } else {
                                    let userData = await User.findOne({ _id: request.user_id }).exec();
                                    console.log(userData, "userData")

                                    User.findOneAndUpdate({ _id: request.user_id }, { $set: { winAmount: userData.winAmount + request.withdrawal_amount} }, { new: true }, (err, userR) => {
                                        if (error) {
                                            return res.status(200).json({
                                                title: "Something went wrong updating data. Please try again.",
                                                error: true,
                                                details: error
                                            });
                                        } else {
                                            return res.status(200).json({
                                                title: "Withdraw request rejected",
                                                error: false,
                                                details: request
                                            });
                                        }
                                    })

                                    // WithdrawRequests.findOneAndUpdate({ _id: response._id }, 
                                    //     { $set: { status: req.body.status, description: req.body.description } },
                                    //      { new: true }, (error, request) => {})



                                }
                            });

                        }
                    }
                });
            }
        });
    }
}
exports.deleteWithdrawRequests = async (req, res, next) => {
    try {
        if (!withdraw_id) {
            return res.status(200).json({
                title: 'Invalid withdraw id',
                error: false,
                details: ''
            });
        }
        else {
            await WithdrawRequests.findOneAndUpdate({ _id: req.body.withdraw_id }, (err, response) => {
                if (err) {
                    return res.status(400).json({
                        title: 'Something went wrong please try again.',
                        error: true,
                        details: error
                    });
                }
                return res.status(200).json({
                    title: 'Succesfully deleted',
                    error: false,
                    details: response
                });
            });

        }
    } catch (error) {
        return res.status(200).json({
            title: "Error while deleting",
            error: true,
            details: error.message
        });
    }
}
/* Bonus Part */
exports.getBonus = async (req, res) => {
    try {
        let requests = await Bonus.find({ status: 1 }).exec();
        return res.status(200).json({
            title: 'Bonus List',
            error: false,
            details: requests
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.addBonus = async (req, res) => {
    const {
        name,
        amount,
        created_by
    } = req.body;

    let errors = req.validationErrors();
    if (errors) {
        return res.status(400).json({
            error: true,
            message: "validation Error.",
            errors: errors
        });
    } else {
        Bonus.findOne({
            name: name
        }, (err, bonus) => {
            if (err) {
                return res.status(400).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            }
            if (!bonus) {
                const newBonus = new Bonus({
                    name,
                    amount,
                    created_by
                });
                newBonus.save(function (err, bonusData) {
                    if (err) {
                        return res.status(400).json({
                            error: true,
                            message: "Error occured while adding Bonus.",
                            err: err
                        });
                    } else {
                        return res.status(200).json({
                            error: false,
                            message: "Bonus added",
                            bonusData: bonusData
                        });
                    }
                });
            } else {
                return res.status(200).json({
                    error: false,
                    message: "Bonus already exists"
                });
            }
        });
    }
}
exports.updateBonus = (req, res) => {
    let errors = req.validationErrors();
    if (errors) {
        return res.status(200).json({
            error: true,
            message: "validation Error.",
            details: errors
        });
    } else {
        Bonus.findOne({
            _id: req.body.bonus_id
        }, (error, response) => {
            if (error) {
                return res.status(200).json({
                    title: 'Something went wrong please try again.',
                    error: true,
                    details: error
                });
            }
            if (!response) {
                return res.status(200).json({
                    title: 'Invalid Bonus Id',
                    error: true,
                    details: response
                });
            } else {
                Bonus.findOneAndUpdate({ _id: response._id }, { $set: { amount: req.body.amount, name: req.body.name } }, { new: true }, (error, request) => {
                    if (error) {
                        return res.status(200).json({
                            title: "Something went wrong updating data. Please try again.",
                            error: true,
                            details: error
                        });
                    }
                    return res.status(200).json({
                        title: "Bonus data updated",
                        error: false,
                        details: request
                    });
                });
            }
        });
    }
}
exports.deleteBonus = async (req, res) => {
    try {

        let requests = await Bonus.findOneAndUpdate({ _id: req.body.bonus_id }, { status: 0 });

        return res.status(200).json({
            title: 'Succesfully deleted',
            error: false,
            details: requests
        });
    } catch (error) {
        return res.status(200).json({
            title: "Error while deleting",
            error: true,
            details: error.message
        });
    }
}
/* Quiz Part */
exports.getSet = async (req, res) => {
    try {
        let requests = await Quiz.find({ status: 1 }).exec();
        return res.status(200).json({
            title: 'Quiz List',
            error: false,
            details: requests
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.addSet = async (req, res) => {

    const {
        name
    } = req.body;

    let errors = req.validationErrors();
    if (errors) {
        return res.status(200).json({
            error: true,
            message: "validation Error.",
            errors: errors
        });
    } else {
        Quiz.findOne({
            name: name
        }, (err, quiz) => {
            if (err) {
                return res.status(200).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            }
            if (!quiz) {
                const newQuiz = new Quiz({
                    name
                });
                newQuiz.save(function (err, quizData) {
                    if (err) {
                        return res.status(200).json({
                            error: true,
                            message: "Error occured while adding Quiz.",
                            err: err
                        });
                    } else {
                        return res.status(200).json({
                            error: false,
                            message: "Quiz added",
                            details: quizData
                        });
                    }
                });
            } else {
                return res.status(200).json({
                    error: false,
                    message: "Quiz already exists"
                });
            }
        });
    }
}
exports.updateQuiz = (req, res) => {
    let errors = req.validationErrors();
    if (errors) {
        return res.status(200).json({
            error: true,
            message: "validation Error.",
            details: errors
        });
    } else {
        Quiz.findOne({
            _id: req.body.quiz_id
        }, (error, response) => {
            if (error) {
                return res.status(200).json({
                    title: 'Something went wrong please try again.',
                    error: true,
                    details: error
                });
            }
            if (!response) {
                return res.status(200).json({
                    title: 'Invalid Quiz Id',
                    error: true,
                    details: response
                });
            } else {
                Quiz.findOneAndUpdate({ _id: response._id }, { $set: { name: req.body.name } }, { new: true }, (error, request) => {
                    if (error) {
                        return res.status(200).json({
                            title: "Something went wrong updating data. Please try again.",
                            error: true,
                            details: error
                        });
                    }
                    return res.status(200).json({
                        title: "Quiz data updated",
                        error: false,
                        details: request
                    });
                });
            }
        });
    }
}
exports.deleteSet = async (req, res) => {
    console.log("=>>>>", req.body)
    let requests = await Quiz.findByIdAndUpdate(req.body.quiz_id, { status: 0 });
    if (requests != null) {
        return res.status(200).json({
            title: 'Succesfully deleted',
            error: false,
            details: ''
        });
    }
    else {
        return res.status(400).json({
            title: "Error while deleting",
            error: true,
            details: "Not Found"
        });
    }
}

/* Question Part */
/* Admin/Sub Admin/Super Admin */
exports.addAdmin = (req, res, next) => {
    const {
        name,
        email,
        password,
        mobile,
        role,
        admin_privileges,

    } = req.body;

    let errors = req.validationErrors();
    if (errors) {
        return res.status(200).json({
            error: true,
            message: "validation Error.",
            errors: errors
        });
    } else {
        Admin.findOne({
            $and: [
                {
                    $or: [
                        {
                            email: email
                        },
                        {
                            mobile: mobile
                        }
                    ]
                },
                {
                    isBlocked: "0"
                }
            ]
        }, (err, user) => {
            if (err) {
                return res.status(200).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            }
            if (!user) {
                const newUser = new Admin({
                    name,
                    email,
                    password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
                    mobile,
                    role: role ? role : 'sub admin',
                    admin_privileges
                });
                newUser.save(function (err, userData) {
                    if (err) {
                        return res.status(200).json({
                            error: true,
                            message: "Error occured while creating admin.",
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
                        return res.status(200).json({
                            error: false,
                            message: "Admin added",
                            userData: userData,
                            token: token
                        });
                    }
                });
            } else {
                return res.status(200).json({
                    error: true,
                    message: "Email Id or MObile Number already exist"
                });
            }
        });
    }
}
exports.getAdmin = async (req, res) => {
    try {
        let requests = await Admin.find({ 'role': "sub admin", isBlocked: 0 }).sort({ createdAt: -1 }).exec();
        return res.status(200).json({
            title: 'Admin List',
            error: false,
            details: requests
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.updateAdmin = async (req, res) => {
    let errors = req.validationErrors();
    if (errors) {
        return res.status(200).json({
            error: true,
            message: "validation Error.",
            details: errors
        });
    } else {

        let idTrue;
        let finalTrue = false;

        let userData = await Admin.find({
            $and: [
                {
                    $or: [
                        {
                            email: req.body.email
                        },
                        {
                            mobile: req.body.mobile
                        }
                    ]
                },
                {
                    isBlocked: "0"
                },

            ]
        })

        idTrue = userData.map((item) => {
            if (item._id.toString() === req.body.admin_id) {
                return "idMatch"
            }
            else {
                if (item.email === req.body.email) {
                    return "emailMatch"
                }
                else if (item.mobile === req.body.mobile) {
                    return "mobileMatch"
                }

            }
        })
        if (idTrue.includes("idMatch") && idTrue.length == 1) {
            finalTrue = true
        }
        if (idTrue.length == 0) {
            finalTrue = true
        }
        if (!finalTrue) {
            return res.status(200).json({
                error: true,
                title: "Email Id or MObile Number already exist"
            });
        } else {
            Admin.findOne({
                _id: req.body.admin_id
            }, (error, response) => {
                if (error) {
                    return res.status(200).json({
                        title: 'Something went wrong please try again.',
                        error: true,
                        details: error
                    });
                }
                if (!response) {
                    return res.status(200).json({
                        title: 'Invalid admin Id',
                        error: true,
                        details: response
                    });
                } else {


                    Admin.findOneAndUpdate({ _id: response._id },
                        {
                            $set: {
                                mobile: req.body.mobile,
                                name: req.body.name,
                                email: req.body.email,
                                admin_privileges: req.body.admin_privileges
                            }
                        },
                        { new: true }, (error, request) => {
                            if (error) {

                                return res.status(200).json({
                                    title: "Something went wrong updating data. Please try again.",
                                    error: true,
                                    details: error
                                });
                            }
                            return res.status(200).json({
                                title: "Admin updated",
                                error: false,
                                details: request
                            });
                        });
                }
            });
        }
    }
}
exports.deleteAdmin = async (req, res) => {
    try {
        let requests = await Admin.findOneAndUpdate({ _id: req.body.admin_id }, { isBlocked: 1 });

        return res.status(200).json({
            title: 'Succesfully deleted',
            error: false,
            details: requests
        });
    } catch (error) {
        return res.status(400).json({
            title: "Error while deleting",
            error: true,
            details: error.message
        });
    }
}
/*Notifications part*/
exports.addNotification = async (req, res) => {
    const {
        title,
        description,
        image_name,
        created_by
    } = req.body;

    let errors = req.validationErrors();
    if (errors) {
        return res.status(400).json({
            error: true,
            message: "validation Error.",
            errors: errors
        });
    } else {
        notification.findOne({
            title: title
        }, (err, item) => {
            if (err) {
                return res.status(400).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            }
            if (!item) {
                const newNotification = new notification({
                    title,
                    description,
                    image_name,
                    created_by
                });
                newNotification.save(function (err, notificationData) {
                    if (err) {
                        return res.status(400).json({
                            error: true,
                            message: "Error occured while adding notification.",
                            err: err
                        });
                    } else {
                        return res.status(200).json({
                            error: false,
                            message: "notification added",
                            bonusData: notificationData
                        });
                    }
                });
            } else {
                return res.status(200).json({
                    error: false,
                    message: "notification already exists"
                });
            }
        });
    }
}
exports.getNotification = async (req, res) => {
    try {
        let requests = await notification.find({ status: 1 }).exec();
        return res.status(200).json({
            title: 'notification List',
            error: false,
            details: requests
        });
    }
    catch (err) {
        return res.status(400).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}
exports.updateNotification = async (req, res) => {
    let errors = req.validationErrors();
    if (errors) {
        return res.status(200).json({
            error: true,
            message: "validation Error.",
            details: errors
        });
    } else {
        notification.findOne({
            _id: req.body.notification_id
        }, (error, response) => {
            if (error) {
                return res.status(400).json({
                    title: 'Something went wrong please try again.',
                    error: true,
                    details: error
                });
            }
            if (!response) {
                return res.status(200).json({
                    title: 'Invalid notification Id',
                    error: true,
                    details: response
                });
            } else {
                notification.findOneAndUpdate({ _id: response._id },
                    { $set: { title: req.body.title, description: req.body.description, image_name: req.body.image_name } },
                    { new: true }, (error, request) => {
                        if (error) {
                            return res.status(200).json({
                                title: "Something went wrong updating data. Please try again.",
                                error: true,
                                details: error
                            });
                        }
                        return res.status(200).json({
                            title: "notification data updated",
                            error: false,
                            details: request
                        });
                    });
            }
        });
    }
}
exports.deleteNotification = async (req, res) => {
    try {
        if (!req.body.notification_id) {
            return res.status(200).json({
                title: 'invalid notification id',
                error: false,
                details: ''
            });

        } else {
            notification.findOne({ _id: req.body.notification_id }, (err, notificationData) => {
                if (err) {
                    return res.status(400).json({
                        title: 'something went wrong',
                        error: true,
                        details: err
                    });
                }
                notification.findByIdAndUpdate({ _id: notificationData._id }, { status: 0 }, (err, notificationData) => {
                    if (err) {
                        return res.status(400).json({
                            title: 'Unable to delete notification',
                            error: true,
                            details: err
                        });
                    }

                    return res.status(200).json({
                        title: 'Succesfully notification deleted',
                        error: false,
                        details: ''
                    });
                });
            });
        }
    } catch (error) {

        return res.status(200).json({
            title: "Error while deleting",
            error: true,
            details: error.message
        });
    }
}
exports.pushNotification = async (req, res) => {

    //     let fcm = new FCM(SERVER_KEY);
    //     let registrationToken = 'eDp0ZzItRgCMisdV8qL6QB:APA91bHm00aGt_RB3NRB6EA7Atcyw8YWubvtbTBHb3-Iz_B7LrEFSaqJyi8mIG2bXPY_0a5FhXl__rny97tAy7R4SyvIkiuWiZs-2ODRXT3kqNNSgw9zA9GFhF9dtYf5oXcB2UROFaiW'
    //     let message = {
    //         notification: { title: 'Price drop', body: '5% off all electronics' },
    //         token: registrationToken,

    //     }
    //     console.log("fcm", fcm);
    //     console.log("hhhhhhhhhhhhhhiiiiiiiiiiii", message);
    //     fcm.send(message)
    //         .then((response) => {
    //             // Response is a message ID string.
    //             console.log('Successfully sent message:', response);
    //         })
    //         .catch((error) => {
    //             console.log('Error sending message:', error);
    //         });


    // var config = {
    //     serviceAccount: {
    //         projectId: serviceAccount.project_id,
    //         clientEmail: serviceAccount.client_email,
    //         privateKey: serviceAccount.private_key
    //     },
    // }
    // var app = Firebase.initializeApp(config);\
    if (!admin.apps.length) {

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    const SERVER_KEY = serviceAccount.SERVER_KEY
    var fcm = new FCM(SERVER_KEY);

    let requests = await User.find({ status: true, isBlocked: 0 }, { deviceToken: { $slice: -1 } }).exec();
    let NotificationData = await notification.findOne({ _id: req.body.id }).exec();

    console.log(NotificationData, "NotificationData")


    requests.map((item) => {
        if (item.deviceToken.length > 0) {
            // console.log(item.deviceToken,"tokens")
            // function removeDuplicates(arr) {
            //     return arr.filter((item,
            //         index) => arr.indexOf(item) === index);
            // }
            // let tokens=removeDuplicates(item.deviceToken)

            item.deviceToken.map((val) => {
                var message = {
                    to: val,
                    priority: 'high',
                    notification: {
                        title: NotificationData.title,
                        body: NotificationData.description,
                        imageUrl: NotificationData.image_name,
                        image: NotificationData.image_name

                    },
                }
                // console.log("gelo",message);
                fcm.send(message)
                    .then((response) => {
                        // Response is a message ID string.
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.log('Error sending message:', error);
                    });
            })
        }
    })
    return res.status(200).json({
        title: "Successfully notifications sended ",
        error: false,
        details: ""
    });



}
/* Dashboard List Counts */
exports.getAllCounts = async (req, res) => {
    try {
        let kycPending = await User.find({ is_kyc_verified: false }).count().lean();
        let users = await User.find().count().lean();
        // let games = await Games.find({}).count();
        let games = await Games.find({}).count().lean();
        // let questions = await Question.find().count();
        let admins = await Admin.find({ role: 'sub admin' }).count().lean();
        let quiz = await Quiz.find().count().lean();
        let withdrawn = await WithdrawRequests.find().count().lean();
        let banners = await Banner.find().count().lean();
        let transactions = await Transaction.find().count().lean();
        return res.status(200).json({
            title: 'Count List',
            error: false,
            details: {
                users: users,
                games: games,
                kycPending: kycPending,
                banners: banners,
                transactions: transactions,
                admins: admins,
                // questions:questions,
                quiz: quiz,
                withdrawn: withdrawn
            }
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}

exports.listgiftCards = (req, next) => {
    giftCard.find({ isRedemed: false })
        .exec((err, result) => {
            next(err, result);
        });
}

exports.addGiftCard = (req, res, cb) => {
    let code = randomstring.generate({
        length: 8,
        charset: 'alphanumeric'
    });
    const card = {
        code: code,
        amount: req.body.amount,
    }

    const savedCard = new giftCard(card)
    savedCard.save((err, data) => {
        cb(err, data)
    })
}

exports.editGiftCard = (req, res, cb) => {
    //console.log('req.body.id',req.body)
    giftCard.findById(req.body.id, (err, giftCardData) => {
        //console.log('giftCardData',err,giftCardData)
        if (err) {
            return cb(err, giftCardData);
        }
        if (giftCardData) {
            giftCardData.amount = req.body.amount;
            giftCardData.save((error, savedData) => {
                return cb(err, giftCardData);
            });
        } else {
            return cb(err, []);
        }
    });
}

exports.deleteGiftCard = (req, cb) => {
    //console.log("body while deleting image", req.body)
    giftCard.findOneAndDelete({ _id: req.body.giftCardId }, (err, gift) => {
        cb(err, gift);
    });
}

exports.uploadAppAndroid = async (req, res) => {
    helper.uploadAppAndroid(req, res, "", (res2) => {
        if (res2.file != undefined) {
            if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/png') {
                let ext = req.file.filename.split('.');
                img = `/${ext[0]}`;
            }
            let ext = req.file.filename.split('.');
            img = `/${ext[0]}`;
        }/* else {
            return res.status(200).json({
                title: 'App updated',
                error: false,
                details: ''
            });
        }*/
        return res.status(200).json({
            title: 'App uploaded',
            error: false,
            details: 'android.apk'
        });
    });
}

exports.uploadAppIOS = async (req, res) => {
    helper.uploadAppIOS(req, res, "", (res2) => {
        if (res2.file != undefined) {
            if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/png') {
                let ext = req.file.filename.split('.');
                img = `/${ext[0]}`;
            }
            let ext = req.file.filename.split('.');
            img = `/${ext[0]}`;
        }/* else {
            return res.status(200).json({
                title: 'App updated',
                error: true,
                details: res
            });
        }*/
        return res.status(200).json({
            title: 'App uploaded',
            error: false,
            details: 'ios.ipa'
        });
    });
}

exports.updateKYC = (req, res) => {

    User.findOne({ _id: req.body.user_id }, async (err, user) => {

        if (err) {
            return res.status(200).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
        if (!user) {
            return res.status(200).json({
                title: 'User not found',
                error: true,
                details: "invalid user id"
            });
        }
        var date1 = new Date(user.createdAt);
        var date2 = new Date(user.kyc.pancard.time);

        // To calculate the time difference of two dates
        var Difference_In_Time = date2.getTime() - date1.getTime();

        // To calculate the no. of days between two dates
        var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

        //To display the final no. of days (result)
        console.log(Difference_In_Days >= 30, " user.bonusWallet = Difference_In_Days<=30 ? user.bonusWallet + 25 : user.bonusWallet;");
        if (req.body.type != "") {
            if (req.body.type == 'aadhar_front') {
                if (!req.body.status) {
                    helper.unlinkOldImages('./uploads/documents/' + user.kyc.aadhar_front.image_name);
                    user.kyc.aadhar_front.image_name = '';
                    user.kyc.aadhar_front.status = false;
                } else {
                    user.kyc.aadhar_front.status = true;
                }
            } else if (req.body.type == 'aadhar_back') {
                if (user.kyc.aadhar_back != '' && user.kyc.aadhar_back != undefined) {
                    helper.unlinkOldImages('./uploads/documents/' + user.kyc.aadhar_back.image_name);
                    user.kyc.aadhar_back.image_name = '';
                    user.kyc.aadhar_back.status = false;
                } else {
                    user.kyc.aadhar_front.status = true;
                }
            } else if (req.body.type == 'bank') {

                if (req.body.status == 'false') {

                    user.bank.status = "rejected";

                }
                else {
                    user.bank.status = "accepted";
                    // user.is_kyc_verified = (user.kyc.pancard.status == "accepted" && user.aadhar.status == "accepted") ? true : false;
                }
            } else if (req.body.type == 'aadhar') {
                if (user.kyc.aadhar != '' && user.kyc.aadhar != undefined) {
                    // helper.unlinkOldImages('./uploads/documents/' + user.kyc.aadhar.image_name);
                    // user.kyc.aadhar.status = req.status;
                    if(req.body.status == 'true') {
                        user.kyc.aadhar.status = "accepted";
                        // user.is_kyc_verified = (user.kyc.pancard.status == "accepted" && user.bank.status == "accepted") ? true : false;
                        user.is_kyc_verified = (user.kyc.pancard.status == "accepted") ? true : false;
                        //  user.bonusWallet = user.bonusWallet + 25;
                        user.bonusWallet = user.kyc.pancard.status == "accepted" ? Difference_In_Days <= 30 ? user.bonusWallet + 25 : user.bonusWallet : user.bonusWallet;
                    } else {
                        user.kyc.aadhar.status = "rejected";
                        user.is_kyc_verified = false;
                    }
                    // console.log(user.kyc);
                    // await User.findByIdAndUpdate({ _id: user._id }, { kyc: user.kyc });
                    // return res.status(200).json({
                    //     title: 'User KYC updated successfully',
                    //     error: false
                    // });
                }
            } else {
                if (user.kyc.pancard == '' && user.kyc.pancard == undefined) {

                    user.kyc.pancard.image_name = '';
                    user.kyc.pancard.status = "";
                    user.is_kyc_verified = false;
                } else {
                    if (req.body.status == 'false') {

                        user.kyc.pancard.image_name = '';
                        user.kyc.pancard.status = "rejected";
                        user.is_kyc_verified = false;
                    }
                    else {
                        user.kyc.pancard.status = "accepted";
                        // user.is_kyc_verified = (user.kyc.aadhar.status == "accepted" && user.bank.status == "accepted") ? true : false;
                        user.is_kyc_verified = (user.kyc.aadhar.status == "accepted") ? true : false;
                        //  user.bonusWallet = user.bonusWallet + 25;
                        user.bonusWallet = user.kyc.aadhar.status == "accepted" ? Difference_In_Days <= 30 ? user.bonusWallet + 25 : user.bonusWallet : user.bonusWallet;
                    }
                }
            }
        }
        if (user.kyc.aadhar_front != undefined && user.kyc.aadhar_back != undefined && user.kyc.pancard != undefined) {
            if (user.kyc.aadhar_front.status && user.kyc.aadhar_back.status && user.kyc.status)
                user.is_kyc_verified = true;
        }
        user.save(async (err, data) => {

            if (err) {
                return res.status(200).json({
                    title: 'An error occurred',
                    error: true,
                    details: err
                });
            }
            if (data.kyc.pancard.status == "accepted" && data.kyc.aadhar.status == "accepted" && data.referred_by && Difference_In_Days <= 30 && req.body.type !== 'bank') {
                const refer_data = await User.find({ _id: data.referred_by }).exec()

                User.findByIdAndUpdate({ _id: data.referred_by }, { bonusWallet: refer_data[0].bonusWallet + 25 }, (err, data1) => {
                    if (err) {
                        return res.status(500).json({
                            title: 'An error occurred',
                            error: "true",
                            details: err
                        });
                    } else {
                        const referData = {
                            userId: user._id,
                            refered_by: user.referred_by,
                            code: user.reffer_code,
                            amount: 25,
                            status: 2,
                            totalAmount: 0
                        }
                        const newReferalsData = new referalsData(referData);
                        newReferalsData.save(async function (err, userData) {
                            if (err) {
                                return res.status(500).json({
                                    title: 'An error occurred',
                                    error: "true",
                                    details: err
                                });
                            } else {
                                try {
                                    // console.log(refer_date,"refer_date")
                                    const transaction_id = [{
                                        amount: 25,
                                        type: "bonus",
                                        status: "accept",
                                        description: "Bonus earned by Referral (Kyc Verification)",
                                        user_id: user._id
                                    }, {
                                        amount: 25,
                                        type: "bonus",
                                        status: "accept",
                                        description: "Bonus earned by Referral (Kyc Verification)",
                                        user_id: refer_data[0]._id
                                    }
                                    ]
                                    const notification = [{
                                        message: `You were referred by ${refer_data[0].name}, and you received a bonus of 25 rupees for verifying your Kyc.`,
                                        userId: user._id

                                    }, {
                                        message: `You got bonus 25 rs by reffering to ${user.name}(Kyc verify) `,
                                        userId: refer_data[0]._id

                                    }]
                                    // const transactionData = new Transaction(transaction_id);
                                    // const notificationData= new usernotification(notification);
                                    console.log(transaction_id, notification)
                                    const options = { ordered: true };
                                    await Transaction.insertMany(transaction_id, options);
                                    await usernotification.insertMany(notification, options);


                                }
                                catch (err) {
                                    console.log(err)
                                }
                                return res.status(200).json({
                                    title: 'User KYC updated successfully',
                                    error: false,
                                    details: data.kyc,
                                    bank: data.bank
                                });
                            }
                        })
                    }

                })
            }
            else {
                if (data.kyc.pancard.status == "accepted" && data.kyc.aadhar.status == "accepted" && Difference_In_Days <= 30 && req.body.type !== 'bank') {
                    const transaction_id = [{
                        amount: 25,
                        type: "bonus",
                        status: "accept",
                        description: "You were earned Kyc Verification Bonus",
                        user_id: user._id
                    }]
                    const notification = [{
                        message: `You were earned Kyc Verification Bonus`,
                        userId: user._id

                    }]
                    const options = { ordered: true };
                    await usernotification.insertMany(notification, options);
                    await Transaction.insertMany(transaction_id, options);
                }
                return res.status(200).json({
                    title: 'User KYC updated successfully',
                    error: false,
                    details: data.kyc,
                    bank: data.bank
                });
            }
        });
    });
}
var sendNotification = exports.sendNotification = async (id) => {

    if (!admin.apps.length) {

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "dB_URL"
        });
    }
    let requests = await User.find({ status: true, isBlocked: 0 }, { deviceToken: { $slice: -1 } }).exec()
    let gameData = await Games.findOne({ _id: id }).exec();

    //console.log(requests,"gameData")

    if (requests.length > 0) {


        requests.map((item) => {

            if (item.deviceToken.length > 0) {

                item.deviceToken.map((val) => {

                    var registrationToken = val
                    const SERVER_KEY = serviceAccount.SERVER_KEY
                    var fcm = new FCM(SERVER_KEY);
                    var message = {
                        to: registrationToken,
                        priority: 'high',
                        notification: {
                            title: "Hello",
                            body: `The game ${gameData.name}  registrations start in 5 min, please go to game and buy tickets`,

                        },
                    }
                    fcm.send(message)
                        .then((response) => {
                            // Response is a message ID string.
                            console.log('Successfully sent message:', response);
                        })
                        .catch((error) => {
                            console.log('Error sending message:', error);
                        });
                })
            }



        })
    }


}

exports.addGame = async (req, res) => {

    const gameCounter = await counter.findOne({ _id: '0' }).lean();

    let newGame = new Games({ _id: gameCounter.count.toString(), ...req.body })
    const createClaim = new claimWinner({
        gameId: gameCounter.count
    })
    await createClaim.save();
    await counter.updateOne({ _id: '0' }, {
        $inc: { count: 1 }
    })
    newGame.save((err, docs) => {
        if (!err) {

            const newRecord = new gameRecord({ _id: gameCounter.count, ...req.body })
            newRecord.save((err, docs) => {

            });
            try {
                schedule.scheduleJob(gameCounter.count.toString(), req.body.gameStartDateTime, () => { gameNumbers2.startGame({ gameId: gameCounter.count.toString() }) });
                console.log(schedule, "schedules")

                var gameStrtTime = new Date(req.body.registrationStartDateTime);
                var numberOfMlSeconds = gameStrtTime.getTime();
                var addMlSeconds = 5 * 60 * 1000;
                var newDateObj = new Date(numberOfMlSeconds - addMlSeconds);

                schedule.scheduleJob(`notification${gameCounter.count.toString()}`, newDateObj.toString(), () => {
                    sendNotification(gameCounter.count.toString())
                });
                const socketIORoute = require('../socket-io');
                if (setSocketClient) { socketIORoute.getUpcomingGamesOut(setSocketClient) }


                // let rule = new schedule.RecurrenceRule();
                // rule.minute = 30;
                // let dateTimeFromReq = schedule.scheduleJob("job11",rule,()=>{
                //     console.log("Came in at ");
                // })
            } catch (err) {
                console.log(err)
            }
            res.status(200).json({
                title: 'Added new game.',
                error: false,
                details: docs
            });
        }
        else {
            res.status(400).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
    })
}
exports.updateGame = async (req, res) => {
    const data1 = await Games.find(
        { _id: req.body.game_id },
    );
    if (data1 == false) {
        res.status(404).json({ message: "wrong game id" });
    } else {

        await Games
            .findOneAndUpdate(
                { _id: req.body.game_id },
                {
                    $set: {
                        ...req.body
                    },
                }
            )
            .then(() => {
                try {
                    schedule.scheduledJobs[req.body.game_id.toString()].cancel()
                    schedule.scheduledJobs[`notification${req.body.game_id.toString()}`].cancel()

                    schedule.scheduleJob(req.body.game_id.toString(), req.body.gameStartDateTime, () => { gameNumbers2.startGame({ gameId: req.body.game_id.toString() }) });

                    var gameStrtTime = new Date(req.body.registrationStartDateTime);
                    var numberOfMlSeconds = gameStrtTime.getTime();
                    var addMlSeconds = 5 * 60 * 1000;
                    var newDateObj = new Date(numberOfMlSeconds - addMlSeconds);

                    schedule.scheduleJob(`notification${req.body.game_id.toString()}`, newDateObj.toString(), () => {
                        sendNotification(req.body.game_id.toString())
                    });
                    const socketIORoute = require('../socket-io');
                    if (setSocketClient) { socketIORoute.getUpcomingGamesOut(setSocketClient) }

                    // let rule = new schedule.RecurrenceRule();
                    // rule.minute = 30;
                    // let dateTimeFromReq = schedule.scheduleJob("job11",rule,()=>{
                    //     console.log("Came in at ");
                    // })
                } catch (err) {
                    console.log(err)
                }
                res.status(200).json({
                    title: 'Successfully Updated',
                    error: false,
                    //details: docs
                });
            })
            .catch((err) => {
                res.status(400).json({ error: err });
            });
    }

}
exports.cancelGame = async (req, res) => {
    const data1 = await Games.find(
        { _id: req.body.game_id },
    );
    if (data1 == false) {
        res.status(404).json({ message: "wrong game id" });
    } else {
        console.log(data1, "data1")
        await Games.updateOne(
            { _id: data1[0]._id },
            {
                $set: { status: "cancelled" },
            }
        )
            .then(async () => {
                try {
                    const data12 = await ticketAudit.find(
                        { gameId: req.body.game_id },
                    );
                    console.log(data12, "data12")
                    data12.map(async (item) => {
                        let amountCut = await transaction.find({ user_id: item.userId, ticket_id: item.ticketId }).exec()

                        let updatedUser = await users.updateOne({ _id: item.userId },
                            { $inc: { winAmount: amountCut[0].winAmount, bonusWallet: amountCut[0].bonusAmount, balanceWallet: amountCut[0].BalanceAmount } })
                    })
                    schedule.scheduledJobs[req.body.game_id.toString()].cancel()
                    schedule.scheduledJobs[`notification${req.body.game_id.toString()}`].cancel()

                    // schedule.scheduleJob(`notification${req.body.game_id.toString()}`, newDateObj.toString(), () => {
                    //     sendNotification(req.body.game_id.toString())
                    // });

                } catch (err) {
                    console.log(err)
                }
                res.status(200).json({
                    title: 'Successfully cancelled',
                    error: false,
                    //details: docs
                });
            })
            .catch((err) => {
                res.status(400).json({ error: err });
            });
    }

}
exports.deleteGame = async (req, res) => {
    const data1 = await Games.find(
        { _id: req.body.id },
    );
    Games.findByIdAndDelete({ _id: req.body.id }, async (err, docs) => {
        if (!err) {
            try {
                const data12 = await ticketAudit.find(
                    { gameId: req.body.id },
                );
                console.log(data12, "data12")
                data12.map(async (item) => {
                    let amountCut = await transaction.find({ user_id: item.userId, ticket_id: item.ticketId }).exec()

                    let updatedUser = await users.updateOne({ _id: item.userId }, { $inc: { winAmount: amountCut[0].winAmount, bonusWallet: amountCut[0].bonusAmount, balanceWallet: amountCut[0].BalanceAmount } })
                })
                schedule.scheduledJobs[req.body.game_id.toString()].cancel()
                schedule.scheduledJobs[`notification${req.body.game_id.toString()}`].cancel()

                // schedule.scheduleJob(`notification${req.body.game_id.toString()}`, newDateObj.toString(), () => {
                //     sendNotification(req.body.game_id.toString())
                // });

            } catch (err) {
                console.log(err)
            }
            res.status(200).json({
                title: 'Deleted.',
                error: false,
            });
        }
        else {

            res.status(200).json({
                title: 'An error occurred',
                error: true,
                details: err
            });
        }
    })
}
exports.getGame = async (req, res) => {
    try {
        let data = await Games.find().sort({ createdAt: -1 }).exec();
        res.status(200).json({
            title: 'All Games.',
            error: false,
            details: data
        });

    } catch (err) {
        console.log(err)
        res.status(200).json({
            title: 'An error occurred',
            error: true,
            details: err
        });
    }
}
exports.getGameByStatus = async (req, res) => {
    try {
        let data = await Games.find({ status: req.body.status }).sort({ createdAt: -1 }).exec();
        res.status(200).json({
            title: 'All Games.',
            error: false,
            details: data
        });

    } catch (err) {
        console.log(err)
        res.status(200).json({
            title: 'An error occurred',
            error: true,
            details: err
        });
    }
}
exports.searchgetGame = async (req, res) => {

    try {
        let data = await Games.find({ name: req.body.gameName }).exec();
        res.status(200).json({
            title: 'single Game.',
            error: false,
            details: data
        });

    } catch (err) {
        console.log(err)
        res.status(200).json({
            title: 'An error occurred',
            error: true,
            details: err
        });
    }
}


exports.getGameById = async (req, res) => {

    try {

        let gameData = await Games.find({ _id: req.body.game_id }).exec();

        return res.status(200).json({
            title: 'game details found',
            error: "false",
            game: gameData,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(400).json({

            title: "Something went wrong. Please try again.",
            error: true,
            details: ''
        });
    }

}

exports.addCount = async (req, res) => {
    const saveCount = new counter(req.body)
    await saveCount.save()
    return res.status(200).send({
        status: true,
        msg: 'count added successfully'
    })
}
exports.getUpComingGame = async (req, res) => {
    let date_ob = new Date();
    Games.find({
        registrationStartCloseDate: { $gte: `${date_ob}` }
    }, (err, docs) => {
        // socket.emit('getGame', { status: false, msg: "Something went wrong try again", data: docs })
        if (!err) res.json({ status: true, name: "Upcoming games", game: docs });
        else res.json({ status: false, msg: `Something Went Wrong`, err: err });
    })
}

//fiter apis for admin panel

exports.withdrawRequestsFilter = async (req, res) => {
    try {
        let findParams = [];

        // if (req.body.fromDate && req.body.toDate) {
        //     let fromDate = new Date(req.body.fromDate);
        //     let toDate = new Date(req.body.toDate);
        //     findParams.push({ $and: [{ createdAt: { "$gte": new Date(fromDate) } }, { createdAt: { "$lte": new Date(toDate) } }] })
        // } else 

        if (req.body.fromDate) {

            let date = new Date(req.body.fromDate);
            date.setDate(date.getDate())


            findParams.push({ createdAt: { "$gte": new Date(date) } })
        } if (req.body.toDate) {
            let date = new Date(req.body.toDate);
            date.setDate(date.getDate() + 1)

            findParams.push({ createdAt: { "$lte": new Date(date) } })
        };


        if (req.body.email && req.body.email.length !== 0) {
            findParams.push({
                'user.email': req.body.email,
            })
        }
        if (req.body.mobile && req.body.mobile.length !== 0) {
            findParams.push({
                "user.mobile": req.body.mobile,
            });
        }

        console.log(findParams, "findPArams")
        let pipeline = [];




        pipeline.push({ $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } });

        if (findParams.length !== 0) {
            pipeline.push({
                $match: {
                    $and: findParams
                }
            })
        }
        pipeline.push({ $unwind: "$user" });
        pipeline.push({ $project: { "_id": 1, "username": "$user.username", "email": "$user.email", "balance": "$user.credit_points", "mobile": "$user.mobile", "name": "$user.name", "fee": 1, "amount": 1, "status": 1, "user_id": 1, "createdAt": 1 } });
        pipeline.push({ $sort: { createdAt: -1 } })
        let requests = await WithdrawRequests.aggregate(pipeline).exec();
        return res.status(200).json({
            title: 'Withdraw Requests List',
            error: false,
            details: requests
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}

exports.transactionsFilter = async (req, res) => {
    try {
        let findParams = [];

        // if (req.body.fromDate && req.body.toDate) {
        //     let fromDate = new Date(req.body.fromDate);
        //     let toDate = new Date(req.body.toDate);
        //     findParams.push({ $and: [{ createdAt: { "$gte": new Date(fromDate) } }, { createdAt: { "$lte": new Date(toDate) } }] })
        // } else 

        if (req.body.fromDate) {

            let date = new Date(req.body.fromDate);
            date.setDate(date.getDate())

            findParams.push({ createdAt: { "$gte": new Date(date) } })
        } if (req.body.toDate) {
            let date = new Date(req.body.toDate);
            date.setDate(date.getDate() + 1)

            findParams.push({ createdAt: { "$lte": new Date(date) } })
        };


        if (req.body.email && req.body.email.length !== 0) {
            findParams.push({
                'user.email': req.body.email,
            })
        }
        if (req.body.mobile && req.body.mobile.length !== 0) {
            findParams.push({
                "user.mobile": req.body.mobile,
            });
        }

        console.log(findParams, "findPArams")
        let pipeline = [];




        pipeline.push({ $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } });

        if (findParams.length !== 0) {
            pipeline.push({
                $match: {
                    $and: findParams
                }
            })
        }
        pipeline.push({ $unwind: "$user" });
        pipeline.push({ $project: { "_id": 1, "username": "$user.username", "email": "$user.email", "balance": "$user.credit_points", "mobile": "$user.mobile", "name": "$user.name", "fee": 1, "amount": 1, "status": 1, 'new_balance': 1, 'old_balance': 1, 'type': 1, "user_id": 1, "createdAt": 1, 'description': 1 } });
        pipeline.push({ $sort: { createdAt: -1 } })
        let requests = await transaction.aggregate(pipeline).exec();
        return res.status(200).json({
            title: 'Withdraw Requests List',
            error: false,
            details: requests
        });
    }
    catch (err) {
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}

exports.getProfileById = async (req, res) => {
    try {
        let user = await Admin.find({ _id: req.body.user_id }).exec();
        return res.status(200).json({
            title: 'User data',
            error: false,
            details: user,
        });
    } catch (err) {
        return res.status(400).json({
            title: 'Something went wrong. Please try again.',
            error: true,
            details: err,
        });
    }
};

exports.getUsersParticipated = async (req, res) => {
    try {
        User.find(
            { 'tickets.gameId': req.body.game_id },
            { _id: 1, name: 1, email: 1, mobile: 1, winAmount: 1, bonusWallet: 1 },
            (err, data) => {
                if (err) {
                    return res.status(400).json({
                        title: 'Something went wrong. Please try again.',
                        error: true,
                        details: err,
                    });
                } else {
                    return res.status(200).json({
                        title: 'users data',
                        error: false,
                        details: data,
                    });
                }
            }
        );
    } catch (err) {
        return res.status(200).json({
            title: 'Something went wrong. Please try again.',
            error: true,
            details: err,
        });
    }
};

async function getCrossed(id, gameid, userid) {
    let pipeline = [];
    pipeline.push({
        '$match': {
            'userId': mongoose.Types.ObjectId(userid),
            'ticketId': String(id),
            "gameId": gameid,
        }
    });
    return await numbersCrossedModel.aggregate(pipeline).exec()
}

exports.getUserTicketsByGameId = async (req, res) => {
    try {
        User.find(
            { 'tickets.gameId': req.body.game_id, _id: req.body.user_id },
            { tickets: 1 },
            async (err, data) => {
                if (err) {
                    return res.status(400).json({
                        title: 'Something went wrong. Please try again.',
                        error: true,
                        details: err,
                    });
                } else {


                    let filterData = data[0].tickets.filter(
                        (item) => item.gameId == req.body.game_id
                    );
                    console.log(filterData, "filterData");
                    let finalcrossdata = []


                    finalcrossdata = await Promise.all(filterData.map(async (item) => {
                        const crossed = await getCrossed(item._id, req.body.game_id, req.body.user_id)
                        console.log(crossed, "crossed");

                        // finalcrossdata.push(crossed[0])
                        console.log("crossed-item", item)
                        return { crossed: crossed, ticket: item.ticket, gameId: item.gameId, _id: item._id };
                    }))


                    return res.status(200).json({
                        title: 'users data',
                        error: false,
                        details: finalcrossdata

                    });
                }
            }
        );
    } catch (err) {
        return res.status(200).json({
            title: 'Something went wrong. Please try again.',
            error: true,
            details: err,
        });
    }
};

exports.test = async (req, res) => {
    // const f_data = await numbersCrossedModel.findByIdAndUpdate(
    //     { _id: req.body.id },
    //     { $push: { numbersCrossed: req.body.numbercrossed[0] } }
    // );\
    // const data = {
    //     userId: "6329cd8b41e3052793891284",
    //     refered_by: "62d92572598cf02b04d02a57",
    //     code: "uRwbDBd",
    //     status: 2,
    //     amount: 25,
    //     totalAmount: 25


    // }
    // const newUser = new referalsData(data);
    // newUser.save((err, userData) => {
    //     if (err) {
    //         console.log(err)
    //     } else {
    //         return res.status(200).json({
    //             title: 'users data',
    //             error: false,
    //             details: userData,
    //         });
    //     }
    // })



};

exports.getNumberDetailsByUserId = async (req, res) => {
    try {
        let pipeline = [];
        pipeline.push({
            '$match': {
                'userId': mongoose.Types.ObjectId(req.body.user_id),
                'ticketId': req.body.ticket_id,
                "gameId": req.body.game_id,
            }
        });
        const f_data = await numbersCrossedModel.aggregate(pipeline).exec();

        const filterData = f_data[0].numbersCrossed.filter(
            (item) => item.number === req.body.number
        );
        console.log(filterData, "filterData");
        let c_number = [];
        let finalData = []

        finalData = await Promise.all(filterData.map(val => {
            let findEle = f_data[0].numbersCrossed.filter(el => val.data[0].set.includes(el.number));
            let dataV = findEle.filter((hh, i, ele) => {
                if (ele.findIndex(vv => vv.number === hh.number) === i) {
                    Object.keys(hh).map(mm => {
                        if (hh[mm] === true) {
                            hh[mm] = false
                        }
                    })
                    return hh;
                }
            })
            // console.log(dataV,"dataV")
            // let sortdaat=dataV.sort(function(a, b){
            //     var dateA = moment(a.timestamp).format('LTS'), dateB = moment(b.timestamp).format('LTS')
            //     return dateA + dateB
            // })
            // dataV.map((item)=>{
            //     console.log(moment(item.timestamp).format('hh:mm:ss'),"timeeeeee")
            // })
            // console.log(sortdaat,"sortdaat")

            return [...dataV, val]
        }))

        //         for(let i=0;i<=filterData.length;i++){
        //         // console.log(filterData[0].data.length, "data");
        //         if (filterData[i].data.length > 0) {
        //             filterData[i].data[0].set.map((item) => {
        //                 f_data[0].numbersCrossed.map((item1) => {
        //                     if (item === item1.number) {
        //                         c_number.push(item1);
        //                         // console.log(c_number,"item1")
        //                     }
        //                 });
        //             });
        //         }
        //     }
        //         console.log(c_number, 'c_number');

        //         // let dd=c_number.sort(function (a, b) {
        //         //     return b.timestamp<a.timestamp;
        //         // });

        //         // console.log(dd,"ddddddddddddddddddd");

        // //         c_number.map((item)=>{

        // //         Object.keys(item).map(val=>{
        // //             if(item[val]=== true){
        // // item[val]=false
        // //             }
        // //         })

        // //         filterData.unshift(item)
        // //         })

        return res.status(200).json({
            title: 'users data',
            error: false,
            details: finalData,
        });
    } catch (err) {
        return res.status(200).json({
            title: 'Something went wrong. Please try again.',
            error: true,
            details: err,
        });
    }
};

exports.getUsersByNumberCrossed = async (req, res) => {
    try {
        let pipeline = [];


        pipeline.push({
            $match: {
                gameId: req.body.game_id,
                'numbersCrossed.number': req.body.number,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
            },
        });
        pipeline.push({ $unwind: '$user' });
        pipeline.push({
            $project: {
                _id: 1,
                numbersCrossed: 1,
                gameId: 1,
                name: '$user.name',
                email: '$user.email',
            },
        });

        let requests = await numbersCrossedModel.aggregate(pipeline).exec();
        const du = requests.map((item) => {
            const ss = item.numbersCrossed.filter((item1) => {
                if (item1.number == req.body.number && item1.data.length > 0) {
                    return item1;
                }
            });
            return {
                ...item,
                numbersCrossed: ss,
            };
        });
        console.log(du);
        const final_data = du.filter((item) => item.numbersCrossed.length);


        let jaldi = [];
        let corners = []
        let firstrow = []
        let secondrow = []
        let thirdrow = []
        let fullHousie = []

        final_data.map(async (item) => {
            await item.numbersCrossed.map((val) => {
                // console.log(val,"valll")
                if (val.jaldi === true) {
                    jaldi.push({ time: val.timestamp, name: item.name })
                }
                if (val.secondrow === true) {
                    secondrow.push({ time: val.timestamp, name: item.name })
                }
                if (val.firstrow === true) {
                    firstrow.push({ time: val.timestamp, name: item.name })
                }
                if (val.thirdrow === true) {
                    thirdrow.push({ time: val.timestamp, name: item.name })
                }
                if (val.corners === true) {
                    corners.push({ time: val.timestamp, name: item.name })
                }
                if (val.fullHousie === true) {
                    fullHousie.push({ time: val.timestamp, name: item.name })
                }
            })

        })

        // console.log(jaldi,secondrow,"jaldi");

        return res.status(200).json({
            title: 'users data',
            error: false,
            details: { "jaldi": jaldi, "firstrow": firstrow, "secondrow": secondrow, "thirdrow": thirdrow, "corners": corners, "fullHousie": fullHousie }
        });
    } catch (err) {
        return res.status(200).json({
            title: 'Something went wrong. Please try again.',
            error: true,
            details: err,
        });
    }
};

exports.getOverAllNumbers = async (req, res) => {
    try {
        const data = await numbersCrossedModel.find({ gameId: req.body.game_id })

        let numbers = []

        data.map((item) => {
            item.numbersCrossed.map((val) => {
                if (val.data.length > 0) {
                    numbers.push(val.number)
                }
            })
        })


        return res.status(200).json({
            title: 'data.',
            error: false,
            details: [...new Set(numbers)],
        });

    }
    catch (err) {
        return res.status(200).json({
            title: 'Something went wrong. Please try again.',
            error: true,
            details: err,
        });
    }
}

const getUsersByWinning = async (req, res) => {



    let pipeline = [];
    let gamePrize = [];

    pipeline.push({ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } });

    pipeline.push({
        $match: {

            'gameId': req.body.game_id,
            "numbersCrossed.jaldi": true,


        }
    })

    pipeline.push({ $unwind: "$user" });
    pipeline.push({
        $project: {
            'user.name': 1, 'user.email': 1, 'ticketId': 1, 'user._id': 1, 'user.profile_image': 1,
            "user.tickets": {
                $filter: {
                    input: '$user.tickets',
                    as: 'user_tickets',
                    cond: { $eq: ['$$user_tickets.gameId', req.body.game_id] }
                }
            },
            "numbersCrossed": {
                $filter: {
                    input: '$numbersCrossed',
                    as: 'numbers',
                    cond: { $eq: [`$$numbers.${req.body.type}`, true] }
                }
            }
        }
    }
    );
    if (req.body.type === 'jaldi') {
        // console.log("jaldi");
        gamePrize = await Games.find({ _id: req.body.game_id }, { jaldiFive: 1 }).exec()


        gamePrize.data = gamePrize[0].jaldiFive

    }
    if (req.body.type === 'corners') {
        gamePrize = await Games.find({ _id: req.body.game_id }, { fourCorners: 1 }).exec()
        gamePrize.data = gamePrize[0].fourCorners

    }
    if (req.body.type === 'fullHousie') {
        gamePrize = await Games.find({ _id: req.body.game_id }, { fullHousie: 1 }).exec()
        gamePrize.data = gamePrize[0].fullHousie
    }
    if (req.body.type === 'firstrow') {
        gamePrize = await Games.find({ _id: req.body.game_id }, { firstLine: 1 }).exec()
        gamePrize.data = gamePrize[0].firstLine
    }
    if (req.body.type === 'secondrow') {
        gamePrize = await Games.find({ _id: req.body.game_id }, { secondLine: 1 }).exec()
        gamePrize.data = gamePrize[0].secondLine
    }
    if (req.body.type === 'thirdrow') {
        gamePrize = await Games.find({ _id: req.body.game_id }, { thirdLine: 1 }).exec()
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
            details: el
        });
    })






}
const getallUsersByWinning = async (req, res) => {
    let pipeline = [];
    pipeline.push({ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } });

    pipeline.push({
        $match: {

            'gameId': req.body.game_id,


        }
    })

    pipeline.push({ $unwind: "$user" });
    pipeline.push({
        $project: {
            'user.name': 1, 'user.email': 1, 'ticketId': 1, 'user._id': 1, 'user.profile_image': 1,
            "user.tickets": {
                $filter: {
                    input: '$user.tickets',
                    as: 'user_tickets',
                    cond: { $eq: ['$$user_tickets.gameId', req.body.game_id] }
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

    // console.log(requests, "requests")

    let gamePrize = await Games.find({ _id: req.body.game_id }, { fourCorners: 1, jaldiFive: 1, fullHousie: 1, firstLine: 1, secondLine: 1, thirdLine: 1 }).exec()
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
            details: semi
        });
    })

}
exports.getUsersWinningSingleApi = async (req, res) => {
    if (req.body.type == "" || !req.body.type) {
        getallUsersByWinning(req, res)
    }
    else {
        getUsersByWinning(req, res)
    }
}

exports.downloadImage = async (req, res) => {
    return res.status(200).json({
        title: 'data.',
        error: false,
        details: JSON.stringify({})
    });

}

exports.testSchedule = async (req, res) => {
    //let requests = await User.find({ status: true,isBlocked:0 },{deviceToken:{ $slice: -1 }}).exec()
    console.log("came in", requests);
    // let rule = new schedule.RecurrenceRule();
    //         rule.minute = 20;

    // let dateTimeFromReq = await schedule.scheduleJob("job11","2022-12-02T13:58:10.595Z",()=>{
    //     console.log("Came in at ");
    // })
    // console.log(dateTimeFromReq);
    // schedule.cancelJob("job11");
}




function toReturnDuplicates(data) {
    let finalData = data.filter((val, i, ele) => {
        if (ele.findIndex(vv => vv.number === val.number) === i) {
            Object.keys(val).map(mm => {
                if (item[mm] === true) {
                    item[mm] = false
                }
            })

            return val;
        }
    })

    console.log({ finalData })
    return finalData
}

exports.getGameFullDetails = async (req, res) => {
    let { gameId, userId } = req.body;
    const gameDetails = await ticketAudit.aggregate([{ $match: { gameId: gameId, userId: userId } },
    {
        $lookup: {
            from: "numbercrosseds",
            localField: "ticketId",
            foreignField: "ticketId",
            as: "crossedNumbers"
        }
    },
    {
        $lookup: {
            from: "prizes",
            localField: "ticketId",
            foreignField: "ticketId",
            as: "prizes"
        }
    }
    ]);
    console.log(gameDetails);
    // res.send(gameDetails);
    return res.status(200).json({
        title: 'data.',
        error: false,
        details: gameDetails
    });
}

exports.getGameNumberFullDetails = async (req, res) => {
    let { gameId, number } = req.body;
    // const gameNumberDetails = await numbersCrossedModel.find({gameId,"numbersCrossed":{$elemMatch:{$in:[Number(number)]}}}).populate('userId');
    const gameNumberDetails = await numbersCrossedModel.aggregate([
        {
            $match: { gameId: gameId },
        },
        {
            $match: { "numbersCrossed": { $elemMatch: { $in: [Number(number)] } } },
        },
        {
            $lookup: {
                from: "users",
                let: { user_id: "$userId" },
                pipeline: [
                    {
                        $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$user_id" }] } },
                    },
                ],
                as: "user_details",
            },
        },
        {
            $lookup: {
                from: "ticketaudits",
                localField: 'ticketId',
                foreignField: "ticketId",
                //   let: { ticket_id: "$ticketId" },
                //   pipeline: [
                //     {
                //       $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$ticket_id" }] } },
                //     },
                //   ],
                as: "ticket_details",
            },
        },
        {
            $lookup: {
                from: "prizes",
                localField: "ticketId",
                foreignField: "ticketId",
                //   let: { user_id: "$userId",ticket_id:"$ticketId" },
                //   pipeline: [
                //     {
                //       $match: { $expr: { $eq: ["$userId", { $toObjectId: "$$user_id" }] } },
                //     },
                //     {
                //         $match: { $expr: { $eq: ["$ticketId", { $toObjectId: "$$user_id" }] } },
                //       },
                //   ],
                as: "prizes",
            },
        },
    ]);
    return res.status(200).json({
        title: "data.",
        error: false,
        details: gameNumberDetails,
    });
};


async function toReturnData(requests) {
    return new Promise((resolve => {
        let semifinal = []
        requests.map(val => {
            val.user.tickets.map((ele, inx) => {

                if (ele._id == val.ticketId) {



                    semifinal.push({
                        time: val.numbersCrossed[0].timestamp,
                        name: val.user.name,
                        ticket: inx + 1,
                        type: val.numbersCrossed[0].data[0].type

                    })
                }
            })
        })

        resolve(semifinal)
    }))
}

exports.getGameNumbers = async (req, res) => {

    console.log(req.body.gameId)
    let gameNumber = await gameNumbers.findOne({ gameId: req.body.gameId }).select('numbersSend').lean();

    gameNumber = gameNumber.numbersSend.reduce((fin, ind) => {
        return [...fin, ind.sendNumber]
    }, []);
    console.log(gameNumber)
    return res.status(200).json({
        title: 'data.',
        error: false,
        details: { numbersSend: gameNumber }
    });

}

exports.yearlyWithdrawls = async (req, res) => {
    try {
        const userDetails = await User.find({ isBlocked: 0 }).exec();
        console.log(userDetails, "userDetails")
        userDetails.length && userDetails.map(async (item) => {
            const totalBalance = item.winAmount+item.balanceWallet
            if (totalBalance > 0 && item.bank.status === 'accepted' && item.kyc.pancard.status === "accepted") {
                const tdsAmount = await tsdCalculation(totalBalance, item._id)
                const request = new WithdrawRequests({
                    user_id: item._id,
                    amount: tdsAmount.tdsCut,
                    fee: 5,
                    description: "Yearly withdraw",
                    wallet_balance: totalBalance
                });
                let xx = Math.abs(item.winAmount) * -1;
                let xy = Math.abs(item.balanceWallet) * -1;

               

                let dum = await User.updateOne({ _id: item._id }, { $inc: { winAmount: xx ,balanceWallet: xy} })
                request.save(async function (err, userData) {
                    let balance = item.winAmount + item.balanceWallet
                    let newBalance = balance - Number(item.winAmount);

                    const transaction = new Transaction({ user_id: item._id, type: 'debit', description: "Yearly Withdrawal request created", status: "processing", amount: Number(tdsAmount.tdsCut), withdraw_id: item._id, new_balance: 0, old_balance: balance })
                    await transaction.save();

                    await User.findOneAndUpdate(
                        { _id: item._id }, // Specify the document to update
                        { totalDepositAmount: tdsAmount.remainingAmount } // Increment the 'amount' field by 100
                    );
                    let tds = new tdsTable({
                        user_id: item._id,
                        amount: parseInt(totalBalance),
                        type: 'withdraw',
                        AfterTdsAmount: tdsAmount.tdsCut

                    });
                    tds.save(() => {
                        //
                    })
                })
            }
        })

        // setTimeout(() => {
        //     return res.status(200).json({
        //         error: false,
        //         message: "Successfully created withdrawls",

        //     });
        // }, 1000)
        console.log("successfully created yearly withdrawl")
    } catch (err) {
        // return res.status(400).json({
        //     error: false,
        //     message: "Something went Wrong",

        // });
        console.log(err)
    }

}

exports.tdsDetails = async (req, res) => {
    try {
        let pipeline = [];
        if (req.body.user_id) {
            pipeline.push({ $match: { user_id: req.body.user_id } });
        }
        let toDate = new Date(req.body.toDate);
        toDate.setDate(toDate.getDate()+1);
        if (req.body.fromDate) {
            pipeline.push({ $match: { createdAt: { $gte: new Date(req.body.fromDate), $lte: toDate } } });
        }
        pipeline.push({ $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } });
        pipeline.push({ $unwind: "$user" });
        pipeline.push({
            $project: {
                "user_id": 1, "username": "$user.username", "email": "$user.email",
                "mobile": "$user.mobile", "name": "$user.name",
                "AfterTdsAmount": 1, "amount": 1, "type": 1, "createdAt": 1
            }
        });
        pipeline.push({ $sort: { createdAt: -1 } })
        // let data = await Transaction.find().exec();
        let data = await tdsTable.aggregate(pipeline).exec();
        return res.status(200).json({
            title: 'TDS List',
            error: false,
            details: data
        });
    }
    catch (err) {
        // console.log(err)
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}

exports.depositList = async (req, res) => {
    try {
        let pipeline = [];
        if (req.body.user_id) {
            pipeline.push({ $match: { user_id: req.body.user_id } });
        }
        let toDate = new Date(req.body.toDate);
        toDate.setDate(toDate.getDate()+1);
        if (req.body.fromDate) {
            pipeline.push({ $match: { createdAt: { $gte: new Date(req.body.fromDate), $lte: toDate } } });
        }
        pipeline.push({ $match: { type: 'credit' } });
        pipeline.push({ $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } });
        pipeline.push({ $unwind: "$user" });
        pipeline.push({
            $project: {
                "user_id": 1, "username": "$user.username", "email": "$user.email",
                "mobile": "$user.mobile", "name": "$user.name",
                 "amount": 1, "type": 1, "createdAt": 1,
                "bonusAmount": 1, "gstAmount": 1, "invoice": 1
            }
        });
        pipeline.push({ $sort: { createdAt: -1 } })
        // let data = await Transaction.find().exec();
        let data = await transaction.aggregate(pipeline).exec();
        return res.status(200).json({
            title: 'Deposit List',
            error: false,
            details: data
        });
    }
    catch (err) {
        // console.log(err)
        return res.status(200).json({
            title: "Something went wrong. Please try again.",
            error: true,
            details: err
        });
    }
}

exports.uploadForm16 = async (req, res) => {
    try {
        const getFormDetails = await form16Table.find({ userId: req.body.user_id }).exec();
        console.log(getFormDetails)
        const fil = getFormDetails.filter((item) => {
            return item.quaterNo === req.body.quaterNo
        })
        console.log(fil, "filll")
        if (!fil.length) {

            let user = new form16Table({
                userId: req.body.user_id,
                form16Url: req.body.form16Url,
                quaterNo: req.body.quaterNo
            });
            user.save((err, result) => {
                if (err) {
                    return res.status(200).json({
                        title: 'Something went wrong. Please try again.',
                        error: true,
                        details: err,
                    });
                }
                return res.status(200).json({
                    title: 'Successfully uploaded',
                    error: false,
                    details: result
                });

            })
        } else {
            await form16Table.findOneAndUpdate({ userId: req.body.user_id, quaterNo: req.body.quaterNo }, { $set: { form16Url: req.body.form16Url } }, (err, data) => {
                if (err) {
                    console.log(err)
                    return res.status(200).json({
                        title: 'Something went wrong. Please try again.',
                        error: true,
                        details: err,
                    });
                }
                else {
                    return res.status(200).json({
                        title: 'Successfully uploaded',
                        error: false,
                        details: data
                    });
                }

            })
        }
    }
    catch (err) {
        console.log(err)
        // return res.status(200).json({
        //     title: "Something went wrong. Please try again.",
        //     error: true,
        //     details: err
        // });
    }
}

exports.getForm16ForUser = async (req, res) => {
    try {
        const getFormDetails = await form16Table.find({ userId: req.body.user_id }).exec();
        getFormDetails.sort((a,b)=>{
            return a.quaterNo - b.quaterNo;
        })
        
        return res.status(200).json({
            title: 'Form 16 data',
            error: false,
            details: getFormDetails
        });
    }
    catch (err) {
        console.log(err)
    }
}


