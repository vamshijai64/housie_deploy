const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/users');
const bcrypt = require('bcryptjs');

function SessionConstructor(userId, userGroup, details) {
  this.userId = userId;
  this.userGroup = userGroup;
  this.details = details;
}

module.exports = function(passport){
  // Local Strategy
  passport.use('login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },function(req, email, password, done){
    // Match email
    req.checkBody('email', 'Email is required.').notEmpty();
    req.checkBody('email', 'Email is not valid.').isEmail();
    req.checkBody('password', 'Password is required.').notEmpty();

    var errors = req.validationErrors();

    if(errors) {
      var message = errors.map((e) => {
        return e.msg;
      })
      return done(null, false, req.flash("danger", message))
    }
    let query = {email:email};
    console.log("query ====", query,email);
    Admin.findOne(query, function(err, user){
      if(err) throw err;
      if(!user){
        req.flash("danger", 'User details not found!!!');
        return done(null, false, {message: 'User details not found!!!'});
      }

      // Match Password
      bcrypt.compare(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          req.flash("danger", 'Password you entered was incorret. Please try again.');
          return done(null, false, {message: 'Password you entered was incorret. Please try again.'});
        }
      });
    });
  }));

  passport.use('agent-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },function(req, email, password, done){
    // Match email
    req.checkBody('email', 'Email is required.').notEmpty();
    req.checkBody('email', 'Email is not valid.').isEmail();
    req.checkBody('password', 'Password is required.').notEmpty();

    var errors = req.validationErrors();

    if(errors) {
      var message = errors.map((e) => {
        return e.msg;
      })
      return done(null, false, req.flash("danger", message))
    }
    let query = {email:email, role: 'agent'};
    console.log("query ====", password,email,bcrypt.hashSync(password, bcrypt.genSaltSync(10)));
    User.findOne(query, function(err, user){
      if(err) throw err;
      if(!user){
        req.flash("danger", 'User details not found!!!');
        return done(null, false, {message: 'User details not found!!!'});
      }

      // Match Password
      bcrypt.compare(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          req.flash("danger", 'Password you entered was incorret. Please try again.');
          return done(null, false, {message: 'Password you entered was incorret. Please try again.'});
        }
      });
    });
  }));

  passport.serializeUser(function(userObject, done) {
    // done(null, user.id);
    // userObject could be a admin or a Model2... or Model3, Model4, etc.
    let userGroup = "";
    let userPrototype =  Object.getPrototypeOf(userObject);
    if (userPrototype === User.prototype) {
      userGroup = "agent";
    }

    let sessionConstructor = new SessionConstructor(userObject.id, userGroup, '');
    done(null,sessionConstructor);
  });
  passport.deserializeUser(function (sessionConstructor, done) {
    console.log("session constructor in deserlize - ", sessionConstructor);
    if (sessionConstructor.userGroup == 'agent') {
      User.findOne({
          _id: sessionConstructor.userId
      }, '-localStrategy.password', function (err, user) {
          done(err, user);
      });
    }
  });
}
