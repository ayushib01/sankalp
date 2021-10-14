const mongoose=require('mongoose');
const docSchema=new mongoose.Schema({
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
    }
});
module.exports=mongoose.model('Doctor',docSchema);