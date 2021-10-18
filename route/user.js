const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const flash=require('connect-flash');
const passport = require('passport');
const session=require('express-session');
// Load User model
//bring auth-config file
// =>ensureAuthenticated : Use to protect the routes 
// =>forwardAuthenticated : by pass the routes without having authentication
const User = require('../model/User');
const Doctor=require('../model/Doctor');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
let OTP='';
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];
  
    if (!name || !email || !password || !password2) {
      errors.push({ msg: 'Please enter all fields' });
    }
    
    if(req.body.OTP==''){
      errors.push({msg:'Verify your account first.'});
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
          if(OTP!=req.body.OTP){
            errors.push({msg:'OOPS ! Your OTP was wrong, Try again'});
            res.render('register',{
                errors,
                name,
                email,
                password,
                password2
            })
        }

         else { const newUser = new User({
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
          });}
        }
      });
    }
  });
  // This post request route used to send OTP via mail to registering user 
router.post('/OTP/:emailID',(req,res)=>{

  /* ------------Node mailer starts here -------------*/

  const email=req.params.emailID;
  OTP='';
  // string used to generate random OTP of 6 characters
  var string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
  
  // Find the length of string 
  var len = string.length;

  for (let i = 0; i < 6; i++ ) { 
      OTP+=string[Math.floor(Math.random()*len)]; 
  } 

  

  //create output for mail to new user
  const output = `
    <p>Welcome to Sankalp.</p>
    <h3>One Time Password : ${OTP}</h3>
    <h3>From :</h3>
    <h3>Sankalp</h3>
    <h3>Thank you !</h3>
    `;


  //create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'sankalp2021webster@gmail.com',
      pass: 'sankalp@1234' 
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {

      from: '"Nodemailer Contact"', // sender address
      to: email, // list of receivers
      subject: 'Welcome to Sankalp', // Subject line
      text: 'OTP for sankalp :'+OTP,
      html:output 
      
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);   
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
  });
})
// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local.user', {
      successRedirect: '/user/home',
      failureRedirect: '/user/login',
      failureFlash: true
    })(req, res, next);
  });
  

//delete Account
router.get('/delete',(req,res)=>{
  User.deleteOne({_id : (req.user._id)})
  .then(user=>{
  req.flash('success_msg', 'Your Account is Deleted!!');
  res.redirect('/user/register');
  })
  .catch(err => console.log(err));
});
// Home
router.get('/home', ensureAuthenticated, (req, res) =>
 Doctor.find({},(err,docs)=>{
   //here doctors is array of objects
   res.render('Patient/home',{
     user:req.user,
     doctors:docs,
   })
 })
);
 //profile
 router.get('/profile',(req,res)=>res.render('Patient/profile', {
  user: req.user,
})
);
router.get('/myProfile',(req,res)=>res.render('Patient/myProfile',{
  user:req.user,
})
);
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
      res.render('Patient/profile', {
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
  res.redirect('/user/home');
      } catch (err) {
          console.error(err.message);
          res.status(500).send("Server error");
      }
    }
  });

  //appointment booking and displaying it on doc home
  router.get('/clicked/:id',(req,res)=>{
    var docId=req.params.id;
    console.log(docId);
    //console.log(req.user.email);
    //console.log(req.user.id);
   /* User.findOne({email:req.user.email},(err,patient)=>{
      console.log(patient.appointPatient);
    })*/
Doctor.findOne({_id:docId},(err,docs)=>{
    docs.notifications.unshift(req.user.name+' has booked a appointment.');
    //docs.appointments.push(req.user);
   // docs.save();
    /*User.findOne({_id:req.user._id},(err,patient)=>{
      if(err){
        console.log(err);
        return;
    }
    else{
      res.render('Doctor/homeDoc',{
        patientId:patient._id,
        name:patient.name,
        email:patient.email,
        
      })
    }
    })*/

    const profileField = {};
    profileField.name = req.user.name;
    profileField.email = req.user.email;
    profileField.id = req.user._id;
    profileField.age = req.user.age;
    profileField.gender = req.user.gender;
    profileField.phone = req.user.phone;
    docs.appointments.push(profileField);
    Doctor.updateOne({_id:docId},docs,(err)=>{//{$set:{appointments:profileField}}
      if(err){
          console.log(err);
          return;
      }
      else{
        console.log("update ho gya doctor");
        return res.status(200).end();
    }
   })
  // console.log(docs.appointments);
//appoint patient contains the mail id of doctors whose patient booked appointment
User.findOne({email:req.user.email},(err,patient)=>{
    if(typeof patient.appointPatient==='undefined'){
      patient.appointPatient=[];
    }
 var flag=1;
 patient.appointPatient.forEach((mail)=>{
 if(mail===docs.email)
 flag=0;
 })
if(flag){
patient.appointPatient.push(docs.email);
}
  //console.log(patient.appointPatient);
  User.updateOne({email:req.user.email},patient,(err)=>{
    if(err){
        console.log(err);
        return;
    }
    else{
        console.log("update ho gya");
        return res.status(200).end();
    }
})
 })
})
})
   // Logout
   router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
module.exports=router;