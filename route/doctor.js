const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const flash=require('connect-flash');
const nodemailer = require('nodemailer');
const passport = require('passport');
const session=require('express-session');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const request=require('request');
const axios=require('axios');
const { v4: uuidv4 } = require('uuid');
//const { DownloaderHelper } = require('node-downloader-helper');
//---------Upload files requirements------
const multer = require('multer');
// Load  model
const Doctor = require('../model/Doctor');
const User = require('../model/User');
const Location = require('../model/Location');
const Upload = require('../model/Upload');
const Message = require('../model/Message');
const Ask= require('../model/Ask');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
//Mapbox acces token to get the location coordinates
var ACCESS_TOKEN = 'pk.eyJ1IjoiYXl1c2hpMDEiLCJhIjoiY2t4N3J0YzQxMWFxaTJwbzVsandqbzRqeCJ9.0ifHQpUMuA2CbUsyPieb1g';

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
    <h3>From :Sankalp</h3>
    <h3>Thank you !</h3>
    `;

console.log(OTP);
  //create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:587,
    secure:false,
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
//---------Node mailer ends--------
// Login
router.post('/loginDoc', (req, res, next) => {
    passport.authenticate('local.doctor', {
      successRedirect: '/doctor/homeDoc',
      failureRedirect: '/doctor/loginDoc',
      failureFlash: true
    })(req, res, next);
  });
  


router.get('/homeDoc', ensureAuthenticated, (req, res) => {
  //console.log(req.user);
  User.find({},(err,patient)=>{
    Ask.find({},(err,ask)=>{ 
    //here doctors is array of objects
    res.render('Doctor/homeDoc',{
      user:req.user,
      patients:patient,
      ask:ask
    })
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
router.get('/presentDoc',(req,res)=>res.render('Doctor/presentDoc',{
  user:req.user,
})
);
router.get('/pastDoc',(req,res)=>
User.find({},(err,patient)=>{
  Upload.find({email_doctor:req.user.email},(err,upload)=>{
    res.render('Doctor/pastDoc',{
    upload:upload,  
    user:req.user,
    pats:patient,
})
  })
})
);
//profile 
    router.post('/profileDoc',async(req,res)=>{
    const { location, age, phone, gender,specialisation,fees,availableDays,availableHours,qualifications} = req.body;//specialisation,fees,availableDays,availableHours,qualifications
    let errors = [];
    
    //||!specialisation || !fees || !availableDays || !availableHours || !qualifications
    if (!location || !age || !phone || !gender ) {
      errors.push({ msg: 'Location,Phone,Age,Number are must' });}
   if(phone.length!=10)
   errors.push({ msg: 'Enter Valid phone Number' });
    //checking if location entered is valid----------------------
    
    var url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+location+'.json?access_token='+ ACCESS_TOKEN + '&limit=1';
       axios.get(url)
       .then(function(response){
        var longitude=response.data.features[0].geometry.coordinates[0];
        var latitude=response.data.features[0].geometry.coordinates[1];
        var place_name=response.data.features[0].place_name;
        var email_location=req.user.email;
        let status=true;
        Location.deleteOne({email_location:req.user.email},{status:true}, function (err) {
          if(err) console.log(err);
          console.log("Successful deletion");
        });
        var myData = new Location({email_location,longitude,latitude,place_name,status});
        myData.save(function (err) {
          if (err) {
           console.log(err);
          } else {
             console.log('successfully saved to location');
          }});
       })
       .catch(function(error){
       console.log(error); 
       return;  
       });
    //------------------ends here-----------------------------------
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
    router.get('/accepted/:email',(req,res)=>{
      var patientId=req.params.email;
      var random=uuidv4();
//yha par req.user doctor hai
      console.log(patientId);
  User.findOne({email:patientId},(err,patient)=>{
    patient.notifications.unshift('Dr.'+req.user.name+' has fixed a appointment');
      const profileField = {};
      profileField.name = req.user.name;
      profileField.email = req.user.email;
      profileField.id = req.user._id;
      profileField.phone = req.user.phone;
      profileField.specialisation = req.user.specialisation;
      profileField.fees = req.user.fees;
      profileField.randomId=random;
      patient.accepted.unshift(profileField);
      User.updateOne({email:patientId},patient,(err)=>{//{$set:{appointments:profileField}}
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
    patientField.weight =patient.weight;
    patientField.height = patient.height;
    patientField.presentHealthStatus = patient.presentHealthStatus;
    patientField.bloodGroup = patient.bloodGroup;
    patientField.filename="";
    patientField.data="";
    patientField.contentType="";
    patientField.randomId=random;
    var mode,time;
    patient.preference.forEach((item)=>{
      if(item.email===req.user.email)
      {
        mode=item.mode;
        time=item.time;
      }
    });
    patientField.mode =mode;
    patientField.time =time;
    docs.acceptedApp.unshift(patientField);
    //docs.appointments=docs.appointments.filter(item => item.id === patientId);
    //if(docs.appointments.findIndex(item => item.id === patientId)!==-1)
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
   const output = `
    <p>Hey ${patient.name}!</p>
    <h3>Dr. ${req.user.name} has fixed an appointment!</h3>
    <h3>Visit Sankalp website for appointment details</h3>
    `;
  //create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:587,
    secure:false,
    auth: {
      user: 'sankalp2021webster@gmail.com',
      pass: 'sankalp@1234' 
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {

      from: '"Nodemailer Contact"', // sender address
      to: patient.email, // list of receivers
      subject: 'Welcome to Sankalp', // Subject line
     text: 'Appointment Details Alert',
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

  })
 
  //Appointment cancelled by doctor
  router.get('/cancelled/:email',(req,res)=>{
    var patientId=req.params.email;
    //yha par req.user doctor hai
    console.log(patientId);
User.findOne({email:patientId},(err,patient)=>{
  patient.notifications.unshift('Unfortunately Dr.'+req.user.name+' cancelled appointment!!');
    var index = patient.appointPatient.indexOf(req.user.email);
    if (index !== -1) {
      patient.appointPatient.splice(index, 1);
    }
    patient.preference.splice(patient.preference.findIndex(item => item.email === req.user.email), 1);
    const profileField = {};
    profileField.name = req.user.name;
    profileField.email = req.user.email;
    profileField.id = req.user._id;
    profileField.phone = req.user.phone;
    profileField.specialisation = req.user.specialisation;
    patient.rejectedAppoint.unshift(profileField);
    User.updateOne({email:patientId},patient,(err)=>{//{$set:{appointments:profileField}}
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
  //docs.appointments=docs.appointments.filter(item => item.id === patientId);
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

//msg send to patient by doctor
router.get('/Message/:id/:msg',(req,res)=>{
const patientId=req.params.id;
const msg=req.params.msg;
const timeElapsed = Date.now();
const today = new Date(timeElapsed);
//console.log(msg);
User.findOne({_id:patientId},(err,patient)=>{
  patient.messages.unshift(msg+ 'by Dr.'+req.user.name+' ( Specialisation: '+req.user.specialisation);
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
})
});

router.get('/history/:email',(req,res)=>{
  var patientEmail=req.params.email;
  User.findOne({email:patientEmail},(err,patient)=>{
    //here doctors is array of objects
    res.render('Doctor/history',{
      user:req.user,
      pat:patient,
    })
  })
}
);


  // SET STORAGE
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
  
var upload = multer({ storage: storage });
  //HistoryDetails
  router.post("/HistoryDetails/:email",upload.single('myImage'),(req,res)=>{
    var email_patient=req.params.email;
    var email_doctor=req.user.email;
    var note=req.body.addNote;
    console.log(note);
   // console.log(req.file.originalname);
   Upload.deleteOne({email_doctor:email_doctor},{email_patient:email_patient}, function (err) {
    if(err) console.log(err);
    console.log("Successful deletion");
  });
    var image = new Upload({
      email_doctor:email_doctor,
      email_patient:email_patient,
      name: req.body.myImage,
      note:note
  });
  let reqPath = path.join(__dirname, '../');
  //console.log(path.join(reqPath +'/uploads/'+ req.file.filename));
  image.img.path=path.join(reqPath +'/uploads/'+ req.file.filename);
  image.img.data =fs.readFileSync(path.join(reqPath +'/uploads/'+ req.file.filename));
  image.img.contentType = "image/png";
  image.save(function (err) {
    if (err) {
     console.log(err);
    } else {
       console.log('successfully saved to location');
       ///doctor/history/${email_patient}
    }});
    //remove from acceptedApp of patient and doctor also remove doc from appointPatient 
  User.findOne({email:email_patient},(err,patient)=>{
    patient.appointPatient.splice( patient.appointPatient.findIndex(item => item.email === req.user.email), 1);
    //if(patient.accepted.findIndex(item => item.email === req.user.email)!==-1)
    patient.accepted.splice(patient.accepted.findIndex(item => item.email === req.user.email), 1);
    //if(patient.preference.findIndex(item => item.email === req.user.email)!==-1)
    patient.preference.splice(patient.preference.findIndex(item => item.email === req.user.email), 1);
    patient.historyDetails.splice(patient.preference.findIndex(item => item.email === req.user.email), 1);
    const historyDetail={},patHistory={};
    historyDetail.email_patient=email_patient;
   historyDetail.note=note;
   historyDetail.name= req.file.filename;
   historyDetail.pathname=path.join(reqPath +'/uploads/'+ req.file.filename);
   Doctor.findOne({email:req.user.email},(err,docs)=>{
    docs.historyDetails.splice(docs.historyDetails.findIndex(item => item.email === email_patient), 1);
   docs.historyDetails.unshift(historyDetail);
   patHistory.email_doctor=req.user.email;
   patHistory.name= req.file.filename;
   patHistory.pathname=path.join(reqPath +'/uploads/'+ req.file.filename);
   patient.historyDetails.unshift(patHistory);
    //console.log(docs.historyDetails);
    User.updateOne({email:email_patient},patient,(err)=>{//{$set:{appointments:profileField}}
      if(err){
          console.log(err);
          return;
      }
      else{
        console.log("update ho gya patient");
        return res.status(200).end();
    }
   })
   //if(docs.acceptedApp.findIndex(item => item.email === patEmail)!==-1)
   docs.acceptedApp.splice(docs.acceptedApp.findIndex(item => item.email === email_patient), 1);
    Doctor.updateOne({email:req.user.email},docs,(err)=>{
      if(err){
          console.log(err);
          return;
      }
      else{
          console.log("update ho gya doctor past appointment");
          return res.status(200).end();
      }
    })
   }) 
   res.redirect('/doctor/homeDoc');
  })
});
router.get('/download/:path',(req,res)=>{

var reqPath = path.join(__dirname, '../');
var filePath=path.join(reqPath +'/uploads/'+ req.params.path);

//const file = fs.createWriteStream(filePath);
res.setHeader('Content-disposition', 'attachment; filename="x.png"');
res.setHeader('Content-type', 'image/png');
 // Download function provided by express
 //console.log(filePath);
 res.download(filePath);
// res.pipe(file);
});

//search autocomplete feature on companies page
router.get('/searchAutocomplete',(req,res,next)=>{

  // 'i' is regExp method
  let regex=new RegExp(req.query['term'],'i');

  //filter companies according to typed characters on search bar
  let patientFilter=User.find({name:regex},{'name':1}).sort({'updated_at':-1}).sort({'created_at':-1}).limit(20);


  patientFilter.exec((err,data)=>{
      console.log(data);
      let result=[];
      if(!err){
          if(data && data.length && data.length>0){
              data.forEach(patient=>{
                  let obj={
                      id:patient._id,
                      label:patient.name
                  };
                  result.push(obj);
              });
          }

          res.jsonp(result);
      }
  })
})

router.post('/homeDoc/:id',(req,res)=>{
  var answer=req.body.doubt;
  answer=answer.concat(" ",`by Doctor:${req.user.name}`)
  var doubtId=req.params.id;
  Ask.findOne({doubtId:doubtId},(err,ask)=>{
    ask.answer.push(answer);
    Ask.updateOne({doubtId:doubtId},ask,(err)=>{
      if(err){
          console.log(err);
          return;
      }
      else{
        console.log("update ho gya ask details");
        return res.status(200).end();
    }
   })
  })
  res.redirect('/doctor/homeDoc');
})



//after clicking search button
router.post('/searchPatient',(req,res)=>{
 
  let patientName=req.body.patientName;
  console.log(patientName);
  User.findOne({name:patientName},(err,patient)=>{
      if(patient){
        //console.log(doctor);
        var pat=[];
        pat.push(patient);
          console.log('mil gyi');
          res.render('Doctor/pastDoc',{
            user:req.user,
            pats:pat
           })
      }
      else{
        User.find({},(err,pat)=>{
        //  console.log(doc);
          res.render('Doctor/pastDoc',{
          user:req.user,
          pats:pat,
         })
      })
      }
      
  })
  
})


  // Logout
  router.get('/logoutDoc', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
//delete Account
router.get('/deleteDoc',(req,res)=>{
  //delete from appointments and acceptedApp
  User.find({},(err,patients)=>{
    patients.forEach((patient)=>{
      if(patient.accepted.findIndex(item => item.email === req.user.email)!==-1)
      patient.accepted.splice(patient.accepted.findIndex(item => item.email === req.user.email), 1);
      if(patient.rejectedAppoint.findIndex(item => item.email === req.user.email)!==-1)
      patient.rejectedAppoint.splice(patient.rejectedAppoint.findIndex(item => item.email === req.user.email), 1);
      if(patient.appointPatient.findIndex(item => item.email === req.user.email)!==-1)
      patient.appointPatient.splice(patient.appointPatient.findIndex(item => item.email === req.user.email), 1);
      if(patient.preference.findIndex(item => item.email === req.user.email)!==-1)
      patient.preference.splice(patient.preference.findIndex(item => item.email === req.user.email), 1);
      User.updateOne({email:patient.email},patient,(err)=>{
        if(err){
            console.log(err);
            return;
        }
        else{
            console.log("update ho gya patient after deleting doc account");
            return res.status(200).end();
        }
    })
    })
  });
  Doctor.deleteOne({ _id : (req.user._id)})
  .then(doctor=>{
  req.flash('success_msg', 'Your Account is Deleted!!');
  res.redirect('/doctor/registerDoc');
  })
  .catch(err => console.log(err));
});
module.exports=router;