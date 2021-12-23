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
    },
    specialisation:{
     type:String,
    },
    fees:{
        type:String,
    },
    availableDays:{
        type:String,
    },
    availableHours:{
        type:String,
    },
    qualifications:{
        type:String,
    },
    doubts:{
        type:String,
    },
    date:{
        type:Date,
        default:Date.now
      },
    notifications:[String],
    appointments:{
        type:mongoose.Schema.Types.Array,
    },
    acceptedApp:{
        type:mongoose.Schema.Types.Array,
    },
    historyDetails:{//patient email+hidden note+uploaded files
        type:mongoose.Schema.Types.Array,
    }
});
module.exports=mongoose.model('Doctor',docSchema);