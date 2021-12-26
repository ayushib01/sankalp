//this schema is for ask me a doubt section containing the doubts asked by particular user and answers to that doubt
const mongoose=require('mongoose');
const askSchema=new mongoose.Schema({
    doubt_email:{
        type:String,
    },
    doubtId:{
        type:String,
    },
    date:{
        type:Date,
        default:Date.now
      },
    doubt:{
        type:String,
    },
    answer:{
        type:mongoose.Schema.Types.Array,
    }  
});
module.exports=mongoose.model('Ask',askSchema);