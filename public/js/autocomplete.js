

console.log('search script is runnning');


$(function(){

    // auto-complete is a default function in jquery
    $('#docName').autocomplete({
        source:function(req,res){

            // ajax code starts here
            $.ajax({
                url:'user/searchAutocomplete',
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
                $('#docName').val(ui.item.label);
            }
        }

    })
})