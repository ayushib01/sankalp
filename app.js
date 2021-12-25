const express=require('express');
const mongoose=require('mongoose');
const app=express();
const server = require("http").Server(app);
const expressLayouts=require('express-ejs-layouts');
const bodyParser = require('body-parser');
const flash=require('connect-flash');
const session=require('express-session');
const path=require('path');
const passport=require('passport');
// Load  model
const Doctor = require('./model/Doctor');
const User = require('./model/User');
const Chat = require('./model/Chat');
const port=process.env.port || 3000;
const { ensureAuthenticated, forwardAuthenticated } = require('./config/auth');
// Passport Config
require('./config/passport')(passport);
// DB Config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB
mongoose.connect(db,{ useNewUrlParser: true ,useUnifiedTopology: true})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
  //connect flash
  app.use(flash());

// Express session
app.use(
    session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    }));
app.use(passport.initialize());
app.use(passport.session());

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
// set public folder
app.use(express.static(__dirname + '/public')); 
 // Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });
//ROUTES
app.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));
app.use('/user',require('./route/user'));
app.use('/doctor',require('./route/doctor'));
//------Video Call-----------------------
const io = require("socket.io")(server);

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
app.use("/peerjs", peerServer);
app.get('/video/:room',(req,res)=>{
  res.render('chat/video',{ roomId: req.params.room ,user:req.user});
})
io.on('connection', (socket) => {
	socket.on('join-room', (roomId, userId) => {
		socket.join(roomId)
		socket.to(roomId).emit('user-connected', userId)

		socket.on('message', (message) => {
			io.to(roomId).emit('createMessage', message, userId)
		})
		socket.on('disconnect', () => {
			socket.to(roomId).emit('user-disconnected', userId)
		})
	})
})
//-------Realtime chat---------------------------
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');
app.get('/room/:roomid', (req, res)=>{
  var messages=[];
  console.log(req.params.roomid);
 Chat.find({meetId:req.params.roomid}, function(err, chats) {
    if (chats.length) {
      chats.forEach((item)=>{
      console.log(item);
      messages=item.meetDetails;

    })
      }
    else {
      const newChat= new Chat({
        meetId:req.params.roomid,
      })
       newChat.save()
       .then(msg=>{
           console.log(msg);
           
       })
       .catch(err=>console.log(err));
    }
    res.render('room',{ roomId: req.params.roomid ,user:req.user,messages:messages});
 })
})
// used to save message to database
app.post('/addMsgToChat/:room',(req,res)=>{
  Chat.findOne({meetId:req.params.room},(err,chat)=>{
    const meet={};
    meet.senderName=req.body.senderName;
    meet.sendingTime=req.body.sendingTime;
    meet.senderMsg=req.body.senderMsg;
    chat.meetDetails.push(meet);
    Chat.updateOne({meetId:req.params.room},chat,(err)=>{
      if(err){
          console.log(err);
          return;
      }
      else{
        console.log("update ho gya meet details");
        return res.status(200).end();
    }
   })
   //res.redirect('/chat/'+req.params.room);
  })
  })
const botName = 'Sankalp Chat Bot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});
server.listen(port,()=>{
    console.log(`Server connected to port :${port}`);
});
