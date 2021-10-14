const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// Load User model
const User = require('../model/User');
//load for doctor
const Doctor = require('../model/Doctor');
//Since,two authentication,
// (i)Doctor login
// (ii)user/patient login
function SessionConstructor(userID,userGroup,details)
{
    this.userID=userID;
    this.userGroup=userGroup;
    this.details=details;
}


module.exports=function(passport){

    //--------------serialize and deserialize---------------

    // Serializing the user login
    passport.serializeUser((userObject,done)=>{

        //userObject could be of any model,let it be any
        let userGroup='doctor-model';
        let userPrototype=Object.getPrototypeOf(userObject);

        if(userPrototype===Doctor.prototype)
        {
            userGroup='doctor-model';
        }
        else if(userPrototype===User.prototype)
        {
            userGroup='user-model';
        }

        let sessionConstructor=new SessionConstructor(userObject._id,userGroup,'');
        done(null,sessionConstructor); 
    })


    //deserializing the user login

    passport.deserializeUser((sessionConstructor,done)=>{
        if(sessionConstructor.userGroup=='doctor-model')
        {
            Doctor.findOne({
                _id:sessionConstructor.userID
            },(err,user)=>{
                done(err,user);
            })
        }
        else if(sessionConstructor.userGroup=='user-model')
        {
            User.findOne({
                _id:sessionConstructor.userID
            },(err,user)=>{
                done(err,user);
            })
        }
    })
 //------------------Login authentication for Doctor login-----------------------
 passport.use('local.doctor',
 new LocalStrategy({usernameField:'email'},(email,password,done)=>{
     //match account
     Doctor.findOne({email:email})
     .then(doctor=>{
         if(!doctor)
         {
              return done(null,false,{message:'This email is not registered yet'});  
         }

         //it code comes here,it means email is registered
         //now check for password
         bcrypt.compare(password,doctor.password,(err,isMatch)=>{
             if(err) throw err;
             if(isMatch)
             {
                 return done(null,doctor);
             }
             else
             {
                 return done(null,false,{message:'Incorrect Password, Try again'})
             }
         })
     })
 })
);


//------------------------Login authentication for user login--------------------------

passport.use('local.user',
 new LocalStrategy({usernameField:'email'},(email,password,done)=>{
     //match account
     User.findOne({email:email})
     .then(user=>{

         //check if there is user with given email or not
         if(!user)
         {
             //return with a flash messaging
              return done(null,false,{message:'This email is not registered yet'});  
         }

         //if code comes here,it means email is registered
         //now check for password
         bcrypt.compare(password,user.password,(err,isMatch)=>{
             if(err) throw err;
             
             //check does password matches or not
             if(isMatch)
             {
                 return done(null,user);
             }
             else
             {
                 return done(null,false,{message:'Incorrect Password, Try again'})
             }
         })
     })
 })
);




}