console.log('Client-side code running');

//when apply button is triggered
function appointFunction(PostID){

      var button=document.getElementById('appointButton/'+PostID);

      //Changes the green color to red
      //and Appointment to appointed,so that user get a message 
      //that his request has been sent
      button.innerHTML='Appointement booked';
      button.classList.remove('btn-primary');
      button.classList.add('btn-danger');

      //_id of post to which patiemt appointed
      //This is a primary key
      console.log(PostID);

    
      //-----------------XML http request------------------------

      //(so without rendering data will be feeded)
      var xhr=new window.XMLHttpRequest();
      
      xhr.open('GET','/patient/clicked/'+PostID,true);
      xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
      xhr.send();

}