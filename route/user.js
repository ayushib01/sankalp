const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const flash=require('connect-flash');
const passport = require('passport');
const session=require('express-session');
const axios=require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Load User model
//bring auth-config file
// =>ensureAuthenticated : Use to protect the routes 
// =>forwardAuthenticated : by pass the routes without having authentication
const User = require('../model/User');
const Doctor=require('../model/Doctor');
const Location = require('../model/Location');
const Message = require('../model/Message');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
//Mapbox acces token to get the location coordinates
var ACCESS_TOKEN = 'pk.eyJ1IjoiYXl1c2hpMDEiLCJhIjoiY2t4N3J0YzQxMWFxaTJwbzVsandqbzRqeCJ9.0ifHQpUMuA2CbUsyPieb1g';
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

 //console.log(email);   
 console.log(OTP);
  //create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:587,//465
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
// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local.user', {
      successRedirect: '/user/home',
      failureRedirect: '/user/login',
      failureFlash: true
    })(req, res, next);
  });
  


// Home
router.get('/home', ensureAuthenticated, (req, res) =>{
 Doctor.find({},(err,docs)=>{
//here doctors is array of objects
   res.render('Patient/home',{
     user:req.user,
     doctors:docs,
   })
 })
});
//Post request for the nearby doctors algo

  router.post('/home',(req,res)=>{
   // console.log(req.body.location);
    var range=req.body.location;
    var docName=req.body.docName;
    var speciality=req.body.speciality;
   /* console.log(range);
    console.log(docName);
    console.log(speciality);*/
    var Docs=[];
  Location.find({ email_location:req.user.email}, {status:false}, function (err, locate) {
    Location.find({status:true}, function (err, doc_locate){  
      var lat1,lon1;
      locate.forEach((value)=>{
       lat1=value.latitude;
       lon1=value.longitude;
      })
      //var lat1=locate.latitude;var lon1=locate.longitude;console.log(lat1);
   Doctor.find({},(err,docs)=>{
      docs.forEach((ele)=>{
     doc_locate.forEach((item)=>{
      if(ele.email==item.email_location)
      {
      var lat2=item.latitude;
      var lon2=item.longitude;
      //console.log(lat2);
        // degrees to radians.
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344 ;
      //console.log(dist);
      //console.log(ele.name);
      if(dist<=range || ele.specialisation.toUpperCase()===speciality.toUpperCase() || ele.name.toUpperCase()===docName.toUpperCase()){
        Docs.push(ele);
      }
      }
     })
     });
     //here doctors is array of objects
     res.render('Patient/home',{
       user:req.user,
       doctors:Docs,
     })
   })
  })
  })
  });
 //profile
 router.get('/profile',(req,res)=>res.render('Patient/profile', {
  user: req.user,
})
);
router.get('/myProfile',(req,res)=>res.render('Patient/myProfile',{
  user:req.user,
})
);
router.get('/present',(req,res)=>res.render('Patient/present',{
  user:req.user,
})
);
router.get('/past',(req,res)=>{
  Doctor.find({},(err,doc)=>{
      res.render('Patient/past',{
      user:req.user,
      docs:doc,
     })
  })
});
router.get('/cancel',(req,res)=>res.render('Patient/cancel',{
  user:req.user,
})
);

  //profile 
router.post('/profile',async(req,res)=>{
    const { location, age, phone, gender,weight,height,bloodGroup,presentHealthStatus} = req.body;
    let errors = [];
  
    if (!location || !age || !phone || !gender || !presentHealthStatus || !weight || !height || !bloodGroup) {
      errors.push({ msg: 'Please enter all fields' });
    }
   if(phone.length!=10)
   errors.push({ msg: 'Enter Valid phone Number' });
//checking if location entered is valid----------------------
var url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+location+'.json?access_token='+ ACCESS_TOKEN + '&limit=1';
axios.get(url)
.then(async function(response){
 var longitude=response.data.features[0].geometry.coordinates[0];
 var latitude=response.data.features[0].geometry.coordinates[1];
 var place_name=response.data.features[0].place_name;
 var email_location=req.user.email;
 let status=false;
  Location.deleteOne({email_location:req.user.email},{status:false}, function (err) {
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
  
 //result=[longitude,latitude,place];  

})
.catch(function(error){
console.log(error); 
return;  
});
//------------------ends here-----------------------------------

    if (errors.length > 0) {
      res.render('Patient/profile', {
        errors,
        location,
        age,
        phone,
        gender,
        weight,
        height,
        bloodGroup,
        presentHealthStatus
      });
    }
    else{
      const profileField = {};
          profileField.location = location;
          profileField.age = age;
          profileField.phone = phone;
          profileField.gender = gender;
          profileField.weight = weight;
          profileField.height = height;
          profileField.presentHealthStatus = presentHealthStatus;
          profileField.bloodGroup = bloodGroup;
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
 //preference send by patient to doctor
 router.get('/preference/:email/:mode/:time',(req,res)=>{
  const docEmail=req.params.email;
  const mode=req.params.mode;
  const time=req.params.time;
  User.findOne({email:req.user.email},(err,patient)=>{
var flag=0;
patient.preference.forEach((item)=>{
if(item.email===docEmail)
{
  item.mode=mode;
  item.time=time;
  flag=1;
}
});
if(flag===0)
{  const preferenceField={};
  preferenceField.email=docEmail;
  preferenceField.mode=mode;
  preferenceField.time=time;
  patient.preference.push(preferenceField);}
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
});

});

  //appointment booking and displaying it on doc home
  router.get('/clicked/:email',(req,res)=>{
    var docEmail=req.params.email;
    console.log(docEmail);
Doctor.findOne({email:docEmail},(err,docs)=>{
    docs.notifications.unshift(req.user.name+' has booked a appointment.');
    const profileField = {};
    profileField.name = req.user.name;
    profileField.email = req.user.email;
    profileField.id = req.user._id;
    profileField.age = req.user.age;
    profileField.gender = req.user.gender;
    profileField.phone = req.user.phone;
   
    var mode='',time='';
    req.user.preference.forEach((item)=>{
      if(item.email===docEmail)
      {
        mode=item.mode;
        time=item.time;
      }
    });
    profileField.mode =mode;
    profileField.time =time;
    //console.log(`time is ${profileField}`);
    docs.appointments.push(profileField);
    Doctor.updateOne({email:docEmail},docs,(err)=>{//{$set:{appointments:profileField}}
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
 const output = `
    <p>Hello Doctor ${docs.name}!</p>
    <h3> ${req.user.name} has booked an appointment!</h3>
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
      to: docs.email, // list of receivers
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
router.post('/uploads/:email',upload.single('myImage'), (req, res) => {
  var doc_email=req.params.email;
let reqPath = path.join(__dirname, '../');

  Doctor.findOne({email:doc_email},(err,docs)=>{

   docs.acceptedApp.forEach((item)=>{
     if(item.email==req.user.email){
       item.filename= req.file.filename;
       item.data =fs.readFileSync(path.join(reqPath +'/uploads/'+ req.file.filename));
       item.contentType = "image/png";
     }
   })
    Doctor.updateOne({email:doc_email},docs,(err)=>{
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
res.redirect('/user/home');
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
router.get('/Autocomplete',(req,res,next)=>{

  // 'i' is regExp method
  let regex=new RegExp(req.query['term'],'i');

  //filter  according to typed characters on search bar
  let doctorFilter=Doctor.find({specialisation:regex},{'specialisation':1}).sort({'updated_at':-1}).sort({'created_at':-1}).limit(20);


  doctorFilter.exec((err,data)=>{
      console.log(data);
      let result=[];
      if(!err){
          if(data && data.length && data.length>0){
              data.forEach(doctor=>{
                  let obj={
                      id:doctor._id,
                      label:doctor.specialisation
                  };
                  result.push(obj);
              });
          }

          res.jsonp(result);
      }
  })
})



router.get('/searchAutocomplete',(req,res,next)=>{

  // 'i' is regExp method
  let regex=new RegExp(req.query['term'],'i');

  //filter  according to typed characters on search bar
  let doctorFilter=Doctor.find({name:regex},{'name':1}).sort({'updated_at':-1}).sort({'created_at':-1}).limit(20);


  doctorFilter.exec((err,data)=>{
      console.log(data);
      let result=[];
      if(!err){
          if(data && data.length && data.length>0){
              data.forEach(doctor=>{
                  let obj={
                      id:doctor._id,
                      label:doctor.name
                  };
                  result.push(obj);
              });
          }

          res.jsonp(result);
      }
  })
})





//after clicking search button
router.post('/searchDoctor',(req,res)=>{
 
  let doctorName=req.body.doctorName;
  console.log(doctorName);
  Doctor.findOne({name:doctorName},(err,doctor)=>{
      if(doctor){
        //console.log(doctor);
        var doc=[];
        doc.push(doctor);
          console.log('mil gyi');
          res.render('Patient/past',{
            user:req.user,
            docs:doc
           })
      }
      else{
        Doctor.find({},(err,doc)=>{
        //  console.log(doc);
          res.render('Patient/past',{
          user:req.user,
          docs:doc,
         })
      })
      }
      
  })
  
})


// chat functionality
router.get('/usersChat',(req,res)=>{

  //send all messages to chat page
  Message.find({},(err,messages)=>{
      res.render('chat/usersChat',{
          user:req.user,
          messages:messages
      })
  })
  
})

// used to save message to database
router.post('/addMsgToChat',(req,res)=>{

      const newMsg=new Message({
          senderName:req.body.senderName,
          sendingTime:req.body.sendingTime,
          senderMsg:req.body.senderMsg
      })

      newMsg.save()
      .then(msg=>{
          console.log(msg);
          
      })
      .catch(err=>console.log(err));
})
   // Logout
   router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
  //delete Account
router.get('/delete',(req,res)=>{
  //delete from appointments and acceptedApp
  Doctor.find({},(err,docs)=>{
    docs.forEach((doc)=>{
      if(docs.appointments.findIndex(item => item.email === req.user.email)!==-1)
      doc.appointments.splice(doc.appointments.findIndex(item => item.email === req.user.email), 1);
      if(docs.acceptedApp.findIndex(item => item.email === req.user.email)!==-1)
      doc.acceptedApp.splice(doc.acceptedApp.findIndex(item => item.email === req.user.email), 1);
      Doctor.updateOne({email:doc.email},doc,(err)=>{
        if(err){
            console.log(err);
            return;
        }
        else{
            console.log("update ho gya doctor after deleting patient account");
            return res.status(200).end();
        }
    })
    })
  });
  User.deleteOne({_id : (req.user._id)})
  .then(user=>{
  req.flash('success_msg', 'Your Account is Deleted!!');
  res.redirect('/user/register');
  })
  .catch(err => console.log(err));
});
module.exports=router;