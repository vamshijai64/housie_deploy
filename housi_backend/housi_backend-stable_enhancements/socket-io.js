const socketRoutes = require("./routes/socketRoutes");
const socketController = require('./controllers/socketControllers')
let io;
exports.socketConnection = (server) => {
  io = require("socket.io")(server, {
    // path: "/api",
    // pingTimeout: 60000,
    // upgradeTimeout: 30000,
    'pingTimeout': 180000,
    'pingInterval': 25000,
    allowUpgrades: false,
    maxHttpBufferSize: 1e8,

    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  io.on("connection", (client) => {
    console.log("connected socket");
     global.setSocketClient = client;
    global.setSocketIo = io;
    //  app.set('iodup', io);
    //  app.set("socdup",client);
    socketRoutes(client, io);
  });
};

exports.sendGameUsers = (gameId, message) => {
//   console.log(io.sockets.adapter.rooms);
  io.to(gameId).emit("throwNumbers", message);
  return;
};

exports.joinRomm = async (socket,roomId) =>{
    await socket.join(roomId);
      console.log("inside joined room*********************8",io.sockets.adapter.rooms);
}

exports.getUpcomingGamesOut = async (socket) =>{
  await socketController.getUpcomingGames(socket,io,{},1)
}
