console.log('Client-side code running');

var mode,time;
function preferenceFunction(docEmail){  
  var button=document.getElementById('preferenceButton/'+docEmail); 
  var getMode = document.querySelector('input[name="rate"]:checked');  
  var getTime = document.querySelector('input[name="time"]:checked');

if(getMode != null) { mode= getMode.value;}   
if(getTime != null) { time= getTime.value;}        
button.classList.remove('btn-primary');
button.classList.add('btn-danger');
//This is a primary key
console.log(docEmail);
//console.log(user.date);
console.log(time);
console.log(mode);

//-----------------XML http request------------------------

//(so without rendering data will be feeded)
var xhr=new window.XMLHttpRequest();
if(getMode!=null && getTime!=null)
{
  xhr.open('GET','/user/preference/'+docEmail+'/'+mode+'/'+time,true);
xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
xhr.send();
}
else 
    document.getElementById("error").innerHTML  = "*You have not selected any mode or time";
}

  