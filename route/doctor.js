const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const flash=require('connect-flash');
const nodemailer = require('nodemailer');
const passport = require('passport');
const session=require('express-session');
// Load Doctor model
const Doctor = require('../model/Doctor');
const User = require('../model/User');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/loginDoc', forwardAuthenticated, (req, res) => res.render('loginDoc'));

// Register Page
router.get('/registerDoc', forwardAuthenticated, (req, res) => res.render('registerDoc'));
let OTP='';
// Register
router.post('/registerDoc', (req, res) => {
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
          if(OTP!=req.body.OTP){
            errors.push({msg:'OOPS ! Your OTP was wrong, Try again'});
            res.render('registerDoc',{
                errors,
                name,
                email,
                password,
                password2
            })
        }
          else
          {const newUser = new Doctor({
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
          });}
        }
      });
    }
  });
  // This post request route used to send OTP via mail to registering user 
router.post('/OTP/:emailID',(req,res)=>{

  /* ------------Node mailer starts here -------------*/
  const email=req.params.emailID;
  console.log(email);
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
router.post('/loginDoc', (req, res, next) => {
    passport.authenticate('local.doctor', {
      successRedirect: '/doctor/homeDoc',
      failureRedirect: '/doctor/loginDoc',
      failureFlash: true
    })(req, res, next);
  });
  
  // Logout
  router.get('/logoutDoc', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
//delete Account
router.get('/deleteDoc',(req,res)=>{
  Doctor.deleteOne({ _id : (req.user._id)})
  .then(doctor=>{
  req.flash('success_msg', 'Your Account is Deleted!!');
  res.redirect('/doctor/registerDoc');
  })
  .catch(err => console.log(err));
});
router.get('/homeDoc', ensureAuthenticated, (req, res) => {
  //console.log(req.user);
  User.find({},(err,patient)=>{
    //here doctors is array of objects
    res.render('Doctor/homeDoc',{
      user:req.user,
      patients:patient,
    })
  })
}); 
  //profile
router.get('/profileDoc',(req,res)=>res.render('Doctor/profileDoc', {
  user: req.user,
})
);
//my Porfile
router.get('/myProfileDoc',(req,res)=>res.render('Doctor/myProfileDoc', {
  user: req.user,
})
);
  //profile 
  router.post('/profileDoc',async(req,res)=>{
    const { location, age, phone, gender,specialisation,fees,availableDays,availableHours,qualifications} = req.body;//specialisation,fees,availableDays,availableHours,qualifications
    let errors = [];
    var flag=0;
    let genderList=['female','male','others'];
    genderList.forEach((element)=>{
        if(element===gender)
        flag=1;
    });
    //||!specialisation || !fees || !availableDays || !availableHours || !qualifications
    if (!location || !age || !phone || !gender ) {
      errors.push({ msg: 'Location,Phone,Age,Number are must' });}
   if(phone.length!=10)
   errors.push({ msg: 'Enter Valid phone Number' });
    
    if (flag===0) {
      errors.push({ msg: 'Enter Valid Gender' });
    }
    if (errors.length > 0) {
      res.render('Doctor/profileDoc', {
        errors,
        location,
        age,
        phone,
        gender,
        specialisation,
        fees,
        availableDays,
        availableHours,
        qualifications,
      });
    }
    else{
      const profileField = {};
          profileField.location = location;
          profileField.age = age;
          profileField.phone = phone;
          profileField.gender = gender;
          //extra doctor details
          profileField.specialisation = specialisation;
          profileField.fees = fees;
          profileField.availableDays = availableDays;
          profileField.availableHours = availableHours;
          profileField.qualifications = qualifications;

  try {
  let profile = await Doctor.findOneAndUpdate({ _id : (req.user.id)}, { $set: profileField }, { new: true });
  req.flash('success_msg', 'Details successfully updated');
  res.redirect('/doctor/homeDoc');
      } catch (err) {
          console.error(err.message);
          res.status(500).send("Server error");
      }
    }
  });
    //appointment booking and displaying it on doc home
    router.get('/accepted/:id',(req,res)=>{
      var patientId=req.params.id;
      //yha par req.user doctor hai
      console.log(patientId);
  User.findOne({_id:patientId},(err,patient)=>{
    patient.notifications.unshift(req.user.name+' has fixed a appointment');
      var index = patient.appointPatient.indexOf(req.user.email);
      if (index !== -1) {
        patient.appointPatient.splice(index, 1);
      }
      const profileField = {};
      profileField.name = req.user.name;
      profileField.email = req.user.email;
      profileField.id = req.user._id;
      profileField.phone = req.user.phone;
      patient.accepted.push(profileField);
      User.updateOne({_id:patientId},patient,(err)=>{//{$set:{appointments:profileField}}
        if(err){
            console.log(err);
            return;
        }
        else{
          console.log("update ho gya patient");
          return res.status(200).end();
      }
     })
  
  Doctor.findOne({email:req.user.email},(err,docs)=>{
    const patientField = {};
    patientField.name = patient.name;
    patientField.email =patient.email;
    patientField.id = patientId;
    patientField.age = patient.age;
    patientField.gender = patient.gender;
    patientField.phone =patient.phone;
    docs.acceptedApp.push(patientField);
    docs.appointments.splice(docs.appointments.findIndex(item => item.id === patientId), 1);
    //console.log(patient.appointPatient);
    Doctor.updateOne({email:req.user.email},docs,(err)=>{
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
  });
  //Appointment cancelled by doctor
  router.get('/cancelled/:id',(req,res)=>{
    var patientId=req.params.id;
    //yha par req.user doctor hai
    console.log(patientId);
User.findOne({_id:patientId},(err,patient)=>{
  patient.notifications.unshift('Unfortunately '+req.user.name+' cancelled appointment!!');
    var index = patient.appointPatient.indexOf(req.user.email);
    if (index !== -1) {
      patient.appointPatient.splice(index, 1);
    }
    const profileField = {};
    profileField.name = req.user.name;
    profileField.email = req.user.email;
    profileField.id = req.user._id;
    profileField.phone = req.user.phone;
    patient.rejectedAppoint.push(profileField);
    User.updateOne({_id:patientId},patient,(err)=>{//{$set:{appointments:profileField}}
      if(err){
          console.log(err);
          return;
      }
      else{
        console.log("update ho gya patient");
        return res.status(200).end();
    }
   })

Doctor.findOne({email:req.user.email},(err,docs)=>{
  /*const patientField = {};
  patientField.name = patient.name;
  patientField.email =patient.email;
  patientField.id = patientId;
  patientField.age = patient.age;
  patientField.gender = patient.gender;
  patientField.phone =patient.phone;
  docs.acceptedApp.push(patientField);*/
  docs.appointments.splice(docs.appointments.findIndex(item => item.id === patientId), 1);
  //console.log(patient.appointPatient);
  Doctor.updateOne({email:req.user.email},docs,(err)=>{
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

module.exports=router;