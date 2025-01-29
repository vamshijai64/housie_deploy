var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var dotenv = require('dotenv').config();
var passport = require("passport");
var bodyParser = require('body-parser');
var findOrCreate = require('mongoose-findorcreate')
const games = require('./models/games');
const user = require('./models/users');
const gameRecords = require('./models/gameNumbers.model');
const socketControllers = require('./controllers/socketControllers')
const questions = require('./models/quiz')
const claimsPrize = require('./models/claim-prize.model')
const fileUpload = require('express-fileupload');
const leaderBoard = require('./routes/leaderboard.routes');
const winners = require('./models/winners');
const {socketConnection} = require('./socket-io');
const userDetails = []
const gameCount = []
let objectId = require('mongodb').ObjectID;
const PORT = process.env.PORT || 3000
// cronjob service import
// const gameStartService = require('./helper/gameStart-cron')
// redis connections
// const redis = require('redis');
const Redis = require("ioredis");

// var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
const banners = require('./routes/banner.routes')

var mongoose = require('mongoose');
var session = require('express-session');
// var MongoStore = require('connect-mongodb-session')(session);
const MongoStore = require('connect-mongo');
var flash = require('connect-flash');
const cors = require('cors');
const app = express();
const socketController = require('./controllers/socketControllers');

const numberCross = require('./models/numbersCrossed.model');
const ticketAudit = require('./models/ticketsAudit.model');
const gameNumbers = require("./controllers/gameNumbers");
const schedule = require('node-schedule');

const adminController= require('./controllers/adminController')
//app.use(cors())
app.use(cors({
  origin: '*'
}));


const server = require('http').createServer(app)

// const io= require('socket.io')(server)
// const socketWithUrl = io.of('/api/sockets')
app.use(fileUpload());
//resolve static path
app.use("/uploads", express.static(__dirname + '/uploads'));
app.use('/banner', express.static(path.join(__dirname, 'banners')))
// mongoose.set('debug', true);
// mongoose.Promise = global.Promise;
// // local
// try{
// mongoose.connect(process.env.local);
// }catch(errrr){
//   console.log("testttt 222",errrr);
// }
const client = new Redis(6379, process.env.REDIS_URI);

// client.on('connect', function () {
//   console.log('Redis Connected!');
// });

// client.connect()
// client.on('error', err => {
//   console.log('Error ' + err);
// });
//live
// mongoose.connect(process.env.dbUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
/*app.use(session({
  secret: 'S@v2riByWeCan',
  saveUninitialized: false,
   resave: false,
   store: new MongoStore({
    mongooseConnection: mongoose.connection
  }),
   cookie:{maxAge:60*60*60*1000}
}));*/
// app.get('/api', (req, res) => {
//   res.sendFile(path.join(__dirname, 'test.html'));
// });

function mongoInitialization(){
  try{
  mongoose.set('debug', true);
mongoose.Promise = global.Promise;
// local
mongoose.connect(process.env.MONGODB_URI);
app.use(session({
  secret: 'S@v2riByWeCan',
  saveUninitialized: false,
  resave: false,
  /*store: MongoStore.create({
   mongoUrl: process.env.dbUrl
  }),*/
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
  }),
  cookie: { maxAge: 60 * 60 * 60 * 1000 }
}));
  }catch(err){
    console.log("inside catchhhhhh",err);
  }

}
mongoInitialization();



app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

app.use(bodyParser.json({ limit: '100mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('uploads'));

app.use((req, res, next) => {
  res.locals.login = req.isAuthenticated;
  res.locals.session = req.session;
  next();
});

app.use(function (req, res, next) {
  res.locals.success_messages = req.flash('success_messages');
  res.locals.error_messages = req.flash('error_messages')
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});



// app.use('/', indexRouter);
app.get("/",(req,res)=>{
  res.status(200).send({});
})
app.use('/api/admin', adminRouter);
app.use('/api/user', usersRouter);
app.use('/api/banners', banners);
app.use('/api/leaderboard', leaderBoard);

app.get('/check_email/:id?', function (req, res) {
  res.sendFile(path.join(__dirname + '/check_email.html'));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

async function restartSchedules(){
  var now = new Date();
  var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
 
  const upcomingGames = await games.find({ gameStartDate: { $gte: startOfToday },gameStartDateTime: {$gte: now}, status: 'active' }).sort({gameStartDateTime:1}).lean();
  upcomingGames.map((item)=>{
    schedule.scheduleJob(item._id.toString(), item.gameStartDateTime, () => { gameNumbers.startGame({ gameId: item._id.toString() }) });
    var gameStrtTime = new Date(item.registrationStartDateTime);
    var numberOfMlSeconds = gameStrtTime.getTime();
    var addMlSeconds = item.gameNotificationTime * 60 * 1000;
    var newDateObj = new Date(numberOfMlSeconds - addMlSeconds);

    schedule.scheduleJob(`notification${item._id}`, newDateObj.toString(), () => {
      adminController.sendNotification(item._id)
    });
  })
}

// error handler
/*app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.message = err.message;
  if(err) 
    return res.status(200).json({
      title: 'An error occurred due to path',
      error: true,
      details: err
    });
  // res.status(err.status || 500)
    
});*/




process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.log("Mongoose connection is disconnected due to application termination!!");
    process.exit(0);
  })
});

const socketRoutes = require('./routes/socketRoutes');
const { updateOne } = require('./models/games');

const sockett = require('./sockets/sockets');
socketConnection(server);
var cron = require('node-cron')


 server.listen(3002, async () => {
  // io.on('connection', client => {
  //  console.log("connected socket");
  //   global.setSocketClient = client;
  //  global.setSocketIo = io;
  //  app.set('iodup', io);
  //  app.set("socdup",client);
  //   socketRoutes(client,io);
  // });
  // sockett.genaralSockets();
  // gameStartService();
  console.log(`server started at Port 3002`);
  restartSchedules()
});
cron.schedule('59 11 31 3 *', () => {
 // payment_due_mails.payment_due_date_mails()
 console.log('cron job running')
 adminController.yearlyWithdrawls()
})
