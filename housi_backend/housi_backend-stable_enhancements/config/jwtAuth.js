const jwt = require('jsonwebtoken');
var User = require('./../models/user');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization;
        console.log('req.headers.authorization',req.headers.authorization)
        const decoded = jwt.verify(token,'system');
       
        req.userData = {userId: decoded.user.userId};
        console.log(req.userData)
        User.findById({_id:req.userData.userId}).then((result,error)=>{
            if(result!=undefined && result!=''){
                next();
            }else{
                return res.status(401).json({
                    message: 'Authentication failed'
                });
            }
        })
        // next();
    } catch (error) {
        return res.status(401).json({
            message: 'Authentication failed'
        });
    }
};