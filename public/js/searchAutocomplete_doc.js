//this for  finding the patients in the past appointment of the doctor
console.log('search script is runnning');


$(function(){

    // auto-complete is a default function in jquery
    $('#searchName').autocomplete({
        source:function(req,res){

            // ajax code starts here
            $.ajax({
                url:'doctor/searchAutocomplete',
                dataType:'jsonp',
                type:'GET',
                data:req,
                success:function(data){
                    res(data);
                },
                error:function(err){
                    console.log(err.status);
                }
            })
        },
        minLength:1,
        select:function(event,ui){
            if(ui.item){
                $('#searchName').val(ui.item.label);
            }
        }

    })
})


// function triggered when search button clicked
function searchByPatientName(){

    //extract input company name
    let nameInput=document.getElementById('searchName').value;
    
    // make an xhr to get company profile page
    var xhr=new window.XMLHttpRequest();
    
    xhr.open('GET','/doctor/searchPatient/'+nameInput,true);
    xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
    xhr.send();

}
