//this schema is used to store the longitude and latitude of users 
const mongoose=require('mongoose');
const locationSchema=new mongoose.Schema({
    email_location:{
        type:String,
        //required:true
    },
    longitude:{
            type:String,
          //  required:true
    },
    latitude:{
            type:String,
            //required:true
    },
    place_name:
    {
        type:String,
        //required:true
    },
    status: {type:Boolean,}//status is false if patient and true if doctor
});
module.exports=mongoose.model('Location',locationSchema);