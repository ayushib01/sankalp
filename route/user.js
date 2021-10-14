const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const flash=require('connect-flash');
const passport = require('passport');
const session=require('express-session');
// Load User model
//bring auth-config file
// =>ensureAuthenticated : Use to protect the routes 
// =>forwardAuthenticated : by pass the routes without having authentication
const User = require('../model/User');
const { forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));
//profile
router.get('/profile',(req,res)=>res.render('profile', {
  user: req.user
}));
// Register
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];
  
    if (!name || !email || !password || !password2) {
      errors.push({ msg: 'Please enter all fields' });
    }
  
    if (password != password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
  
    if (password.length < 6) {
      errors.push({ msg: 'Password must be at least 6 characters' });
    }
  
    if (errors.length > 0) {
      res.render('register', {
        errors,
        name,
        email,
        password,
        password2
      });
    } else {
      User.findOne({ email: email }).then(user => {
        if (user) {
          errors.push({ msg: 'Email already exists' });
          res.render('register', {
            errors,
            name,
            email,
            password,
            password2
          });
        } else {
          const newUser = new User({
            name,
            email,
            password
          });
  
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser.save()
                .then(user => {
                req.flash('success_msg','You are now registered and can log in');    
                res.redirect('/user/login');
                })
                .catch(err => console.log(err));});
          });
        }
      });
    }
  });
// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local.user', {
      successRedirect: '/home',
      failureRedirect: '/user/login',
      failureFlash: true
    })(req, res, next);
  });
  
  // Logout
  router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/user/login');
  });
//delete Account
router.get('/delete',(req,res)=>{
  User.deleteOne({ _id : (req.user.id)})
  .then(user=>{
  req.flash('success_msg', 'Your Account is Deleted!!');
  res.redirect('/user/register');
  })
  .catch(err => console.log(err));
});
  //profile 
  router.post('/profile',async(req,res)=>{
    const { location, age, phone, gender} = req.body;
    let errors = [];
    var flag=0;
    let genderList=['female','male','others'];
    genderList.forEach((element)=>{
        if(element===gender)
        flag=1;
    });
    if (!location || !age || !phone || !gender) {
      errors.push({ msg: 'Please enter all fields' });
    }
   if(phone.length!=10)
   errors.push({ msg: 'Enter Valid phone Number' });
    
    if (flag===0) {
      errors.push({ msg: 'Enter Valid Gender' });
    }
    if (errors.length > 0) {
      res.render('profile', {
        errors,
        location,
        age,
        phone,
        gender
      });
    }
    else{
      const profileField = {};
          profileField.location = location;
          profileField.age = age;
          profileField.phone = phone;
          profileField.gender = gender;
  try {
  let profile = await User.findOneAndUpdate({ _id : (req.user.id)}, { $set: profileField }, { new: true });
  req.flash('success_msg', 'Details successfully updated');
  res.redirect('/home');
      } catch (err) {
          console.error(err.message);
          res.status(500).send("Server error");
      }
    }
  });
module.exports=router;
/*
 <h6>Name: <%= user.name %></h6>
            <br> 
            <h6>Email Address: <%= user.email %></h6>
            <br>
*/