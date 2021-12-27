//this is schema is for uploaded files by the doctor
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var uploadSchema = new Schema({
 email_doctor:{
   type:String,
 },
 email_patient:{
  type:String,
},
note:{
  type:String,
},
name: {type: String, max: 100},
        img: {path:String,data: Buffer, contentType: String}
  });

module.exports = mongoose.model('Upload', uploadSchema);