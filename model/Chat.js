//this schema is used to store the realtime chats messages
const mongoose=require('mongoose');

const chatSchema=new mongoose.Schema({
    meetId: {
        type: String,
       // required: true
      },
      meetDetails: {
        type:mongoose.Schema.Types.Array,//details are sender name,msg time and msg
      },

})


const Chat=mongoose.model('Chat',chatSchema);

module.exports=Chat;