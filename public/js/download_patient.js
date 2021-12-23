console.log('Client-side code running');



  function downloadFunction(Path){
  //  var reqPath = path.join(__dirname, '../');
  var button=document.getElementById('downloadButton/'+Path);
 
  button.innerHTML='Downloaded';
  button.classList.remove('btn-primary');
  button.classList.add('btn-danger');

   
  //This is a primary key
  console.log(Path);
  //console.log(user.date);
  
  
  //-----------------XML http request------------------------
  
  //(so without rendering data will be feeded)
 
  var xhr=new window.XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onreadystatechange = function(event){
    if (event.target.readyState == 4){
      if (event.target.status == 200 || event.target.status == 0){
        //Status 0 is setup when protocol is "file:///" or "ftp://"var blob = this.response;
        console.log(xhr.response);
        var saveData = (function () {
          var a = document.createElement("a");
          document.body.appendChild(a);
          a.style = "display: none";
          return function (data, fileName) {
      url = window.URL.createObjectURL(xhr.response);
              a.href = url;
              a.download = fileName;
              a.click();
              window.URL.revokeObjectURL(url);
          };
      }());
      
      var data = xhr.response,
          fileName = "my-download.png";
      
      saveData(data, fileName);
      
    //saveAs(xhr.response, 'image.png');
    // location.href = url;
        //Use blob to upload the file
      }else{
        console.error('Unable to download the blob');
      }
    }
  }
  
  xhr.open('GET','/user/download/'+Path,true);
  xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
  xhr.send();
  }