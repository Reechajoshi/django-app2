function showLoadingWithText(txt)
{
    hideLoading(function(){
        $("#loading_div").html(txt);
        $("#loading_div").show();
        $("#loading_div").css({top: ( ( $("#loading_div").height() + parseInt($("#loading_div").css('padding-top')) + parseInt($("#loading_div").css('padding-bottom')) )  * -1) + "px"});
        $("#loading_div").animate({top: "0px"});
    });
}

function hideLoading(callback)
{
    $("#loading_div").animate({top: ( ( $("#loading_div").height() + parseInt($("#loading_div").css('padding-top')) + parseInt($("#loading_div").css('padding-bottom')) )  * -1) + "px"}, function(){
        $(" #loading_div").hide();
        
        if(callback)
            callback();
    });
}