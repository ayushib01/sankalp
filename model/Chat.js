const mongoose=require('mongoose');

const chatSchema=new mongoose.Schema({
    email_doc:{
        type:String,
    },
    email_pat:{
        type:String,  
    },
   items: {
    type:mongoose.Schema.Types.Array,
   }//sender Name,sender time,sendermsg
})

//create the model of the above messageSchema
const Chat=mongoose.model('Chat',chatSchema);

module.exports=Chat;