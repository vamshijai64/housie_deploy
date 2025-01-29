var acccessToken = require('../models/accessToken');
var multer = require("multer");
var fs = require('fs');
var randomstring = require("randomstring");
var moment = require('moment-timezone');
var async = require("async");
// var CronJob = require('cron').CronJob;
var schedule = require('node-schedule');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

// const Trip = require('../models/trip');
var User = require('../models/users');
var Admin = require('../models/admin');
var Notification = require('../models/notification');
var otp = require('../models/otp');

// const Bookings = require('../models/bookings');
const scheduleNotification = require('../models/schedule');
const userActivity = require('../models/userActivity')
var FCM = require('fcm-push');
var fcm = new FCM(process.env.serverKey);
var thumb = require('node-thumbnail').thumb;
const mongoose = require('mongoose');

const csv = require('csv-express');
const { decode } = require('punycode');

const AuthenticateUser = async (req, res, next) => {
    const token = req.headers.token;
    const decoded = jwt.decode(token, "housie");

    try {
        const userData = await User.findOne({ "_id": decoded.user.userId}).exec();
        if (!userData || userData == undefined) {
            return res.status(400).json({
                title: 'user not found',
                error: "true",
            });
        }
        if (parseInt(userData.isBlocked) == 1) {
            return res.status(400).json({
                title: 'You are blocked.Please contact admin',
                error: "true",
                details: "invalid Login"
            });
        }
        if (userData.isLoggedIn == false) {
            return res.status(400).json({
                title: 'Authorization required',
                error: "true",
                details: "invalid Login"
            });
        }

        req.body.userData = userData;
        return next(null, userData);
    }
    catch (error) {
        return res.status(500).json({
            title: 'Please enter valid user token.',
            error: "true",
            details: error
        });
    }
}
const AuthenticateAdmin = async (req, res, next) => {
    console.log(req.headers.token)
    const token = req.headers.token;
    const decoded = jwt.decode(token, "housie");
    console.log(decoded)
    try {
        const userData = await Admin.findById( decoded.user.userId ).lean()
        console.log(userData)
        if (!userData || userData == undefined) {
            return res.status(400).json({
                title: 'user not found',
                error: "true",
            });
        }
        if (parseInt(userData.isBlocked) == 1) {
            return res.status(400).json({
                title: 'You are blocked.Please contact admin',
                error: "true",
                details: "invalid Login"
            });
        }
        // console.log("user",userData)
        // if (userData.isLoggedIn == false) {
        //     return res.status(400).json({
        //         title: 'Authorization required',
        //         error: "true",
        //         details: "invalid Login"
        //     });
        // }

        req.body.userData = userData;
        return next(null, userData);
    }
    catch (error) {
        return res.status(500).json({
            title: 'Please enter valid user token.',
            error: "true",
            details: error
        });
    }
}


const saveAccessToken = (userData, token, next) => {

    let AcccessToken = new acccessToken({
        email: userData.email,
        userId: userData.id,
        expiresIn: 60 * 60 * 24 * 1000,
        token: token
    });

    AcccessToken.save(function (err, userData) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('accestoken created')
            return;
        }
    });
}

const deleteAccessToken = (token, next) => {

    AcccessToken.findOneAndDelete({token: token} ,(err, data) => {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('accestoken deleted')
            return;
        }
    });
}

const saveOTP = (mobile) => {
    let m_otp = Math.floor(100000 + Math.random() * 900000);
    if(typeof token == undefined) {
        token = '';
    }
    let OTP = new otp({
        mobile: mobile,
        otp: m_otp,
        expiresIn: 60 * 60 * 24 * 1000,
        token: ''
    });

    OTP.save(function (err, OTP) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('otp saved')
            return;
        }
    });
    sendSingleSMS(mobile, m_otp);
    return m_otp;
}


const checkIfduplicates = (deviceTokenArray, token, next) => {
    for (var i = 0; i < deviceTokenArray.length; i++) {
        if (deviceTokenArray[i] == token)
            return next(true);
    }

    return next(false);
}

const checkFileExists = (file) => {
    if(fs.existsSync('./uploads/'+file+'.jpg')) {
        return true;
    } else {
        return false;
    }
}

const uploadImage = (req, res, id, upload_for, cb) => {
    var name = randomstring.generate({
        length: 7,
        charset: 'alphanumeric'
    });

    var Imagename = name + '.jpg';
    var tempImagename = name;

    var direc = './uploads';
    var dattat = fs.existsSync(direc);
    var dir = `./uploads/${upload_for}`;
    if (!fs.existsSync(direc)) {
        fs.mkdirSync(direc, function (err, data) {
            if (err) {
                console.log("errrrr");
            } else {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, function (err, data) {
                        if (err) {
                            console.log("errrrr");
                        } else {
                            console.log(data);
                        }
                    });
                }
            }
        });
    } else {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, function (err, data) {
                if (err) {
                    console.log("errrrr");
                } else {
                    console.log(data);
                }
            });
        }
    }

    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, dir);
        },
        filename: function (req, file, callback) {
            callback(null, Imagename);
        }
    });


    var upload = multer({
        storage: storage
    }).single('files')
    upload(req, res, function (err) {
        if (err) {
            cb()
        } else {
            cb(name);
        }
    });
}

const uploadMultipleImages = (req, res, upload_for, filesCount, cb) => {
    let tmpArray = [];
    var direc = './uploads';
    var dir = `./uploads/${upload_for}`;
    createDir(dir)
    let storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, dir);
        },
        filename: function (req, file, callback) {
            console.log("----file----", file);
            let currentFile = Date.now();
            tmpArray.push(currentFile)
            callback(null, Date.now() + ".jpg");
        }
    });

    var upload = multer({
        storage: storage
    }).fields([{ name: 'multiple_files', maxCount: filesCount }, { name: 'registration_no_image', maxCount: 1 }])

    upload(req, res, function (err) {
        cb(err, tmpArray);
        /*let size = [100, 200];
        let suffix = ['_small', '_medium'];
        for (var j = 0; j < tmpArray.length; j++) {
            for (var i = 0; i < size.length; i++) {
                generateThumbnail(tmpArray[j], size[i], suffix[i], 'boat');
            }
        }*/
    });
}

const uploadAppAndroid = (req, res, id, cb) => {
    var tempImagename = 'android.apk';
    var direc = './uploads';
    var dattat = fs.existsSync(direc);
    var dir = `./uploads/apps`;
    if (!fs.existsSync(direc)) {
        fs.mkdirSync(direc, function (err, data) {
            if (err) {
                console.log("errrrr");
            } else {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, function (err, data) {
                        if (err) {
                            console.log("errrrr");
                        } else {
                            console.log(data);
                        }
                    });
                }
            }
        });
    } else {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, function (err, data) {
                if (err) {
                    console.log("errrrr");
                } else {
                    console.log(data);
                }
            });
        }
    }
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, dir);
        },
        filename: function (req, file, callback) {
            callback(null, tempImagename);
        }
    });
    var upload = multer({
        storage: storage
    }).single('files')
    upload(req, res, function (err) {
        if (err) {
            cb()
        } else {
            cb(tempImagename);
        }
    });
}

const uploadAppIOS = (req, res, id, cb) => {
    var tempImagename = 'ios.ipa';
    var direc = './uploads';
    var dattat = fs.existsSync(direc);
    var dir = `./uploads/apps`;
    if (!fs.existsSync(direc)) {
        fs.mkdirSync(direc, function (err, data) {
            if (err) {
                console.log("errrrr");
            } else {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, function (err, data) {
                        if (err) {
                            console.log("errrrr");
                        } else {
                            console.log(data);
                        }
                    });
                }
            }
        });
    } else {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, function (err, data) {
                if (err) {
                    console.log("errrrr");
                } else {
                    console.log(data);
                }
            });
        }
    }
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, dir);
        },
        filename: function (req, file, callback) {
            callback(null, tempImagename);
        }
    });
    var upload = multer({
        storage: storage
    }).single('files')
    upload(req, res, function (err) {
        if (err) {
            cb()
        } else {
            cb(tempImagename);
        }
    });
}

const generateThumbnail = (Imagename, width, suffix, upload_for) => {
    var dir = `./uploads/${upload_for}`;
    thumb({
        prefix: '',
        suffix: suffix,
        source: dir + '/' + Imagename + '.jpg',
        destination: `./uploads/${upload_for}`,
        width: width,
        overwrite: true,
        basename: Imagename
    }).then(function () {
        console.log('Success  width: 100');
        return;
    }).catch(function (e) {
        console.log('Error  width: 100', e.toString());
        return;
    });
}

const unlinkOldImages = (oldImage) => {
    let thumbFiles = [""];
    // let thumbFiles = ["", "_small", "_medium"];
    for (var i in thumbFiles) {
        console.log("file to remove", `${oldImage}${thumbFiles[i]}.jpg`);
        try {
            fs.unlinkSync(`${oldImage}${thumbFiles[i]}.jpg`);
            console.log(`successfully deleted ${oldImage}${thumbFiles[i]}.jpg`);
        } catch (err) {
            // handle the error
            console.log("failed to delete local image:" + err);
        }
    }
}

const createDir = (targetDir) => {
    const path = require('path');
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(parentDir, childDir);
        if (!fs.existsSync(curDir)) {
            fs.mkdirSync(curDir);
        }
        return curDir;
    }, initDir);
}

Promise.each = async function (arr, fn) {
    for (const item of arr) await fn(item);
}

//push notification code
const sendNotification = (deviceId, flag, msg, payload, userIds, callback) => {
    Promise.each(userIds, async (userId) => {
        const NotificationObj = new Notification({
            message: msg,
            user_id: userId
        })
        let savedNotification = await NotificationObj.save();
       let user =  await User.find({_id: userId}).select('deviceToken').exec();
        if( user && user.length > 0 ) {
            payload.flag = flag;
            payload.vibrate = [100, 50, 100];
            payload.sound = "default";
            payload.notificationObj = savedNotification
            var message = {
                registration_ids: user[0].deviceToken,
                priority: "high",
                forceshow: true, // required fill with device token or topics
                collapse_key: 'Samugaa',
                content_available: true,
                data: payload,
                notification: {
                    title: 'Samugaa',
                    body: msg,
                    sound: "default"
                }
            };
            return fcm.send(message)
            .catch((err) => console.log(err))
        }
        return;
    })
    .then(function (response) {
        callback(null, response);
    })
    .catch(function (err) {
        callback(err);
    });

    
}

const csvReport = (file_name, csvData, res) => {
    console.log(file_name);
    res.attachment(file_name);
    return res.csv(csvData, true, {
        "Access-Control-Allow-Origin": "*"
    }, 200);
}

const sendSingleSMS = async (mobile,message) => {
    const http = require("https");

    const options = {
        "method": "GET",
        "hostname": "api.msg91.com",
        "port": null,
        "path": "/api/v5/otp?template_id=6155eaf0996b9f34731e55f5&mobile=91"+mobile+"&authkey=367596A3iJJnJm614d96c1P1&otp="+message,
        "headers": {
          "Content-Type": "application/json"
        }
    };

    const req = await http.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
          chunks.push(chunk);
        });

        res.on("end", function (cb) {
          const body = Buffer.concat(chunks);
          console.log(body.toString());
        });
    });
    req.write("{\"Value1\":\"Param1\",\"Value2\":\"Param2\",\"Value3\":\"Param3\"}");
    req.end();
}

module.exports = {
    sendSingleSMS,
    AuthenticateUser,
    AuthenticateAdmin,
    saveOTP,
    saveAccessToken,
    deleteAccessToken,
    checkIfduplicates,
    uploadImage,
    unlinkOldImages,
    createDir,
    sendNotification,
    uploadMultipleImages,
    csvReport,
    checkFileExists,
    uploadAppAndroid,
    uploadAppIOS
}