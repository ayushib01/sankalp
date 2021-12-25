const mongoose=require('mongoose');

const chatSchema=new mongoose.Schema({
    meetId: {
        type: String,
       // required: true
      },
      meetDetails: {
        type:mongoose.Schema.Types.Array,
      },

})

//create the model of the above messageSchema
const Chat=mongoose.model('Chat',chatSchema);

module.exports=Chat;