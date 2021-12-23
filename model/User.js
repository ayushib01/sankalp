const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    location:{
        type:String,
        //required:true
    },
    age:{
        type:String,
        //required:true
    },
    phone:{
        type:String,
        //required:true
    },
    gender:{
        type:String,
       // required:true
    },
    weight:{
        type:String,
       // required:true
    },
    bloodGroup:{
        type:String,
       // required:true
    },
    height:{
        type:String,
    },
    presentHealthStatus:{
        type:String,
    },
   // pastApp:{type:mongoose.Schema.Types.Array},
    preference:{type:mongoose.Schema.Types.Array},
    messages:[String],
    appointPatient:[String], 
    rejectedAppoint:{type:mongoose.Schema.Types.Array},
    accepted:{type:mongoose.Schema.Types.Array},
    historyDetails:{//doctor email+hidden note+uploaded files
        type:mongoose.Schema.Types.Array,
    },
    notifications:[String]
});
module.exports=mongoose.model('User',userSchema);