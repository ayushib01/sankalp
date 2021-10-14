const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const flash=require('connect-flash');
const passport = require('passport');
const session=require('express-session');
// Load Doctor model
const Doctor = require('../model/Doctor');
const { forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/loginDoc', forwardAuthenticated, (req, res) => res.render('loginDoc'));

// Register Page
router.get('/registerDoc', forwardAuthenticated, (req, res) => res.render('registerDoc'));
//profile
router.get('/profileDoc',(req,res)=>res.render('profileDoc', {
  doctor: req.doctor
}));
// Register
router.post('/registerDoc', (req, res) => {
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
      res.render('registerDoc', {
        errors,
        name,
        email,
        password,
        password2
      });
    } else {
      Doctor.findOne({ email: email }).then(doctor => {
        if (doctor) {
          errors.push({ msg: 'Email already exists' });
          res.render('registerDoc', {
            errors,
            name,
            email,
            password,
            password2
          });
        } else {
          const newUser = new Doctor({
            name,
            email,
            password
          });
  
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser.save()
                .then(doctor => {
                req.flash('success_msg','You are now registered and can log in');    
                res.redirect('/doctor/loginDoc');
                })
                .catch(err => console.log(err));});
          });
        }
      });
    }
  });
// Login
router.post('/loginDoc', (req, res, next) => {
    passport.authenticate('local.doctor', {
      successRedirect: '/homeDoc',
      failureRedirect: '/doctor/loginDoc',
      failureFlash: true
    })(req, res, next);
  });
  
  // Logout
  router.get('/logoutDoc', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/doctor/loginDoc');
  });
//delete Account
router.get('/deleteDoc',(req,res)=>{
  Doctor.deleteOne({ _id : (req.user.id)})
  .then(doctor=>{
  req.flash('success_msg', 'Your Account is Deleted!!');
  res.redirect('/doctor/registerDoc');
  })
  .catch(err => console.log(err));
});
  //profile 
  router.post('/profileDoc',async(req,res)=>{
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
      res.render('profileDoc', {
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
  let profile = await Doctor.findOneAndUpdate({ _id : (req.user.id)}, { $set: profileField }, { new: true });
  req.flash('success_msg', 'Details successfully updated');
  res.redirect('/homeDoc');
      } catch (err) {
          console.error(err.message);
          res.status(500).send("Server error");
      }
    }
  });
module.exports=router;