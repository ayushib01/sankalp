const express=require('express');
const path=require('path');
const mongoose=require('mongoose');
const app=express();
const expressLayouts=require('express-ejs-layouts');
const flash=require('connect-flash');
const session=require('express-session');
const passport=require('passport');
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
app.use(express.urlencoded({extended:false}));
// Express session
app.use(
    session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    }));
app.use(passport.initialize());
app.use(passport.session());
  //connect flash
  app.use(flash());
  //static folder
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
app.listen(port,()=>{
    console.log(`Server connected to port :${port}`);
});
