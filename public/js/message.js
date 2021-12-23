console.log('Client-side code running');
function msgFunction(PatientID){

var button=document.getElementById('msgButton/'+PatientID);
var mesg=document.getElementById('sendMsg');
const msg=mesg.value;
//Changes the green color to red
//and Appointment to appointed,so that user get a message 
//that his request has been sent
button.innerHTML='Msg Send';
button.classList.remove('btn-primary');
button.classList.add('btn-danger');

//This is a primary key
console.log(PatientID);
//console.log(user.date);


//-----------------XML http request------------------------

//(so without rendering data will be feeded)
var xhr=new window.XMLHttpRequest();
xhr.open('GET','/doctor/Message/'+PatientID+'/'+msg,true);
xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
xhr.send();

}