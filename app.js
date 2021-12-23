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
server.listen(port,()=>{
    console.log(`Server connected to port :${port}`);
});

/*Chat section normal-----------not realtime--------
app.get('/chat/:email1/:email2',(req,res)=>{
  var email_doc=req.params.email2;
  var email_pat=req.params.email1;
  Chat.deleteOne({email_doc:email_doc},{email_pat:email_pat}, function (err) {
    if(err) console.log(err);
    console.log("Successful deletion");
  });
  var chatMessage = new Chat({
    email_doc:email_doc,
    email_pat:email_pat,
});
chatMessage.save(function (err) {
  if (err) {
   console.log(err);
  } else {
     console.log('successfully saved to chats');
  }});
var mails={};
mails.email_doc=email_doc;
mails.email_pat=email_pat;
Chat.findOne({email_doc:email_doc},{email_pat:email_pat},(err,element)=>{
  console.log(element);
  res.render('chat/mainChat',{
      user:req.user,
      mails:mails,
     // items:element.items
  })
})
})
// used to save message to database
app.post('/addMsgToChat/:email1/:email2',(req,res)=>{
  var email_doc=req.params.email2;
  var email_pat=req.params.email1;
 Chat.findOne({email_doc:email_doc},{email_pat:email_pat},(err,text)=>{
   var item={};
  item.senderName=req.body.senderName;
  item.sendingTime=req.body.sendingTime;
  item.senderMsg=req.body.senderMsg;
  text.items.push(item);
  text.markModified('items');
  text.save(); // works
})
})*/