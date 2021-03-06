var _all_device_udid = [];
var _all_device_name = [];

var _sel_device_udid = [];

var _device_page_name = false; // /devices/actions/profiles


window.onload = function(){
    $(function() {
        $( "#tabs" ).tabs();
    });
    getDevices();
    
    resize();
    
    $( window ).resize(function() {
        resize();
    });
    
    // set the _device_page_name to make check for explicit functions
    var pathname = window.location.pathname;
    switch( pathname.trim() )
    {
        case '/devices/':
            _device_page_name = "devices";
            break;
        case '/devices/actions/':
            _device_page_name = "devices_actions";
            break;
        case '/devices/profiles/':
            _device_page_name = "devices_profiles";
            break;    
        case '/devices/apps/':
            _device_page_name = "devices_apps";
            break;    
    }
}

function getDevices()
{
    _all_device_udid = [];
    _all_device_name = [];

    showLoadingWithText( "Loading.." );
    $.ajax({
        url: '/getDeviceList/',
        error:function(err)
        {
            console.log( err );
            alert("request failed!!");
        },
        success: function(data)
        {
            hideLoading();
            console.log( data );
            
            var device_details = data.response;
            var devices_list_content_container = document.getElementById( "devices_list_content_container" );
            devices_list_content_container.innerHTML = "";
            
            for( var i = 0; i < device_details.length; i++ )
            {
                var devicename = ( device_details[ i ][ "devicename" ].length > 0 ) ? ( device_details[ i ][ "devicename" ] ) : ( "No Name" );
                var regdate = device_details[ i ][ "regdate" ];
                var udid = device_details[ i ][ "udid" ];
                
                _all_device_udid.push(udid);
                _all_device_name.push(devicename);
                
                var _device_list_block_html = get_device_list_template();
                _device_list_block_html = _device_list_block_html.replace( '_#_DEVICE_NAME_#_', devicename );
                _device_list_block_html = _device_list_block_html.replace( '_#_DEVICE_REGDATE_#_', regdate );
                /* _device_list_block_html = _device_list_block_html.replace( '_#_DEVICE_UDID_#_', udid ); */
                _device_list_block_html = _device_list_block_html.replace(/_#_DEVICE_UDID_#_/g, udid);
                
                devices_list_content_container.innerHTML += _device_list_block_html;
            }
        }
    });
}

function resize()
{
    $("#main_content").height( $(document).outerHeight() - $("#header").outerHeight() );
    
    $("#devices_list_container").height( $("#main_content").outerHeight() );
    
    $("#devices_list_content_container").height( $( "#devices_list_container" ).outerHeight() - $( "#devices_list_header_container" ).outerHeight() );
    
    $(".tab_container").each(function(){
        $(this).height($("#devices_list_content_container").height()- 60);
    });
}

function saveDeviceName()
{
    // showLoader( "Updating.." );
    showLoadingWithText( "Updating..." );
    try
    {
        var dvname = document.getElementById( "edit_device_name" ).value;
        var udid = document.getElementById( "device_udid" ).innerHTML;
        
        if(dvname.length > 0)
        {
            var json = { "devicename": dvname, "udid" : udid}
            
            $.ajax({
                    url: '/setDeviceName/',
                    type: 'POST',
                    data: "request="+JSON.stringify(json),
                    error:function()
                    {
                        alert("request failed!!");
                    },
                    success: function(data)
                    {
                        // hideLoader();
                        hideLoading();
                        if(data["response"])
                        {
                            alert("Device Name Updated..");
                            refresh_device_list();
                        }
                        else
                            alert("Updation failed.");
                    }
                });
        }
        else
        {
            alert("Device name cant be empty!");
            hideLoading();
        }
    }
    catch(err)
    {
        alert(err);
    }
}

function getLatestDeviceInfo()
{
    // showLoader( "Requesting.." );
    showLoadingWithText( "Requesting.." );
    var device_udid = document.getElementById( "device_udid" );
    udid = device_udid.innerHTML;
    var commandtype= [ "ProfileList", "InstalledApplicationList", "Restrictions", "DeviceInformation" ];
    
    var json = { "udid": udid, "commandtype": commandtype };
    
    $.ajax({
        url: '/addcommand/',
        type: 'POST',
        data: "request="+JSON.stringify(json),
        error:function()
        {
            console.log( "error" );
            alert("request failed!!");
        },
        success: function(data)
        {
            // hideLoader();
            hideLoading();
            alert( "Latest device information requested successfully" );
        }
    });
}

function refresh_device_list() // later this will be replaced with ajax call
{
    getDevices();
}

function resetDeviceListDiv()
{
    // empty the array 
    _sel_device_udid = [];
    
    var allDeviceListBlocks = document.getElementsByClassName( "devices_list_block" ); // get all profileListBlocks
    
    /* remove selected classes from all profile list and then set selected one */
    for( var i = 0; i < allDeviceListBlocks.length; i++ )
    {
        CUtil.removeClass( allDeviceListBlocks[ i ], "device_list_block_sel" );
    }
}

function setDivSelected(d)
{
    if(!event.ctrlKey)
        resetDeviceListDiv();
    
    d.classList.add( "device_list_block_sel" );
    
    if( _sel_device_udid.indexOf( d.getAttribute("name") ) == -1 )
        _sel_device_udid.push(d.getAttribute("name"));
}

function showDeviceDetails( udid, default_tab_idx, device_list_block )
{
    if( device_list_block )
    {
        setDivSelected(device_list_block);
    }
    
    if( _device_page_name == "devices" )
    {
        showLoadingWithText( "Loading.." );
    
        var json = { "udid" : udid };
        
        $.ajax({
            url: '/getDeviceInfo/',
            type: 'POST',
            data: "request="+JSON.stringify(json),
            error:function()
            {
                alert("request failed!!");
            },
            success: function(data)
            {
                console.log( data );
                // hideLoader();
                hideLoading();
                if( data.response != false )
                {
                   // /*  get response values */
                    var DeviceName = data.response.DeviceName;
                    var RegDate = data.response.RegDate;
                    var UDID = data.response.UDID;
                    // /* Other device iNfo */
                    var dataInfoKeys = [ "Model", "ProductName", "SerialNumber", "DeviceCapacity", "AvailableDevice_Capacity", "BatteryLevel", "CellularTechnology", "IMEI", "MEID", "IsSupervised" ];
                    var modifyValueKeys = [ "CellularTechnology", "BatteryLevel", "DeviceCapacity", "IsSupervised" ];
                    
                    var mandatoryDataInfoField = [ "OSVersion", "BuildVersion", "ModelName" ];
                    
                    
                    
                    var deviceInfo = [];
                    
                    for( var i = 0; i < dataInfoKeys.length; i++ )
                    {
                        var dataInfoKey = dataInfoKeys[ i ];
                        if( data.response.deviceinformation.hasOwnProperty( dataInfoKey ) )
                        {
                            if( CUtil.inArray( dataInfoKey, modifyValueKeys ) )
                            {
                                deviceInfo[ dataInfoKey ] = getModifiedDeviceInfo( dataInfoKey, data.response.deviceinformation[ dataInfoKey ] );
                            }
                            else
                            {
                                deviceInfo[ dataInfoKey ] = data.response.deviceinformation[ dataInfoKey ];
                            }
                        }
                    }
                    
                    var deviceInfoDiv = document.getElementById( "deviceInfoDiv" );
                    deviceInfoDiv.innerHTML = "";
                    
                    for( deviceInfoKey in deviceInfo )
                    {
                        var device_info_block = document.createElement( 'DIV' );
                        device_info_block.id = "device_info_block";
                        var device_info_label = document.createElement( 'DIV' );
                        device_info_label.id = "device_info_label";
                        var device_info_val = document.createElement( 'DIV' );
                        device_info_val.id = "device_info_val";
                        device_info_val.name = deviceInfoKey;
                        
                        device_info_label.innerHTML = deviceInfoKey;
                        device_info_val.innerHTML = deviceInfo[ deviceInfoKey ];
                        /* var deviceInfoDiv = CUtil.getChildByName( devices_info_container, deviceInfoKey, "DIV", true );
                        deviceInfoDiv.innerHTML = deviceInfo[ deviceInfoKey ]; */
                        
                        device_info_block.appendChild( device_info_label );
                        device_info_block.appendChild( device_info_val );
                        deviceInfoDiv.appendChild(device_info_block);
                    }
                    
                    for( var i = 0; i < mandatoryDataInfoField.length; i++ )
                    {
                        var deviceInfoDiv = CUtil.getChildByName( document.getElementById( 'devices_info_container' ), mandatoryDataInfoField[ i ], "DIV", true );
                        
                        deviceInfoDiv.innerHTML = data.response.deviceinformation[ mandatoryDataInfoField[ i ] ];
                    }
                    
                    // /* get elements to be filled */
                    var device_name = document.getElementById( 'edit_device_name' );
                    var reg_date = document.getElementById( 'device_reg_date' );
                    var udid = document.getElementById( 'device_udid' );
                    
                    // /* fill out app and profile details only if these properties are present */
                    if( data.response.hasOwnProperty( 'apps' ) )
                        setDeviceInfo( data, 'apps' );
                    if( data.response.hasOwnProperty( 'profiles' ) )
                        setDeviceInfo( data, 'profiles' );
                    
                    
                    // /* fill general values */
                    device_name.value = DeviceName;
                    reg_date.innerHTML = RegDate;
                    udid.innerHTML = UDID;
                    
                }
                else // if response is false, display empty form
                {
                    resetForm();
                }
                
                document.getElementById( 'devices_detail_container' ).style.display = 'inline-block';
                // /* this line reset the tab to first tab */
                $( "#tabs" ).tabs( "option", "active", default_tab_idx );
                
                // set_divider_line_height();
            }
        });
    }
}

function getModifiedDeviceInfo( infoType, infoValue )
{
    switch( infoType )
    {
        case "CellularTechnology":
            return ( infoValue == 0 ) ? ( "True" ) : ( "False" );
            break;
        case "BatteryLevel":
            return ( infoValue * 100 ).toFixed(2) + "%";
            break;
        case "DeviceCapacity":
            return ( infoValue.toFixed(2) ) + " GB";
            break;
        case "IsSupervised":
            return ( infoValue == "true" ) ? ( "Yes" ) : ( "No" );
            break;
    }
    return "Modified value";
}

function resetForm()
{
    var device_name = document.getElementById( "edit_device_name" );
    var device_reg_date = document.getElementById( "device_reg_date" );
    var device_udid = document.getElementById( "device_udid" );
    
    var device_profiles = document.getElementById( "device_profiles" );
    var device_apps = document.getElementById( "device_apps" );
    
    device_name.value = "";
    device_reg_date.innerHTML = "Not Applicable";
    device_udid.innerHTML = "Not Applicable";
    
    device_profiles.innerHTML = "There are currently no Profiles saved.";
    device_apps.innerHTML = "There are currently no Applications saved.";
}

function toggle_device_info( more_link, info_type )
{
    var device_info_block_id = ( info_type == 'app' ) ? ( 'device_app_block' ) : ( 'device_profile_block' );
    var device_info_block = CUtil.getParentByName( more_link, device_info_block_id );

    var device_info_details = device_info_block.children[ 1 ];
    // /* var device_profile_details = device_info_block.getElementById( "device_profile_details" ); */
    
    if( device_info_details.style.display == "none" )
    {
        // /* hide_all_device_info(); */
        device_info_details.style.display = "block";
        more_link.innerHTML = "less";
    }
    else
    {
        device_info_details.style.display = "none";
        more_link.innerHTML = "more";
    }
}

function hide_all_device_info()
{
    var device_app_details = document.getElementsByClassName( "device_app_details" );
    var device_profile_details = document.getElementsByClassName( "device_profile_details" );
    
    for( var i = 0; i < device_app_details.length; i++ )
    {
        device_app_details[ i ].style.display = "none";
    }
    
    for( var i = 0; i < device_profile_details.length; i++ )
    {
        device_profile_details[ i ].style.display = "none";
    }
}

function setDeviceInfo( data, key ) // sets the device profiles, apps, restrictions
{
    // /* key => apps, profiles */
    var device_info = data.response[ key ]; // values from the response
        
    // /* filling out all application for a particular device */
    var device_info_container = document.getElementById( 'device_' + key + '_container' ); // main container
    var device_info_div = document.getElementById( 'device_' + key ); // wrapper in which values will be loaded
    
    device_info_div.innerHTML = ""; // empty wrapper before filling values
    
    if( device_info.length > 0 ) // check not needed as done while calling method
    {
        for( var i = 0; i < device_info.length; i++ )
        {
            if( key == 'profiles' )
            {
                // /* get all attributes for profiles */
                var payloadDisplayName = device_info[ i ].payloadDisplayName;
                var payloadVersion = device_info[ i ].payloadVersion;
                var payloadIdentifier = device_info[ i ].payloadIdentifier;
                
                var _device_html = get_device_profile_template();
                _device_html = _device_html.replace( "_#_DEVICE_PROFILE_NAME_#_", payloadDisplayName );
                _device_html = _device_html.replace( "_#_DEVICE_PROFILE_VERSION_#_", payloadVersion );
                _device_html = _device_html.replace( "_#_DEVICE_PROFILE_IDENTIFIER_#_", payloadIdentifier );
                
                device_info_div.innerHTML = device_info_div.innerHTML + _device_html;
            }
            else
            {
               // /*  get all attributes for apps */
                var appName = device_info[ i ].appName;
                var appShortVersion = device_info[ i ].appShortVersion;
                var appSize = device_info[ i ].appSize;
                var appIdentifier = device_info[ i ].appIdentifier;
                var appVersion = device_info[ i ].appVersion;
                
                var _device_html = get_device_app_template();
                _device_html = _device_html.replace( "_#_APP_NAME_#_", appName );
                _device_html = _device_html.replace( "_#_APP_VERSION_#_", appVersion );
                _device_html = _device_html.replace( "_#_APP_SHORT_VERSION_#_", appShortVersion );
                _device_html = _device_html.replace( "_#_APP_SIZE_#_", appSize );
                _device_html = _device_html.replace( "_#_APP_IDENTIFIER_#_", appIdentifier );
                
                device_info_div.innerHTML = device_info_div.innerHTML + _device_html;
            }
        }
    }
}

/* function select_all_devices( device_main_chkbox )
{
    var devices_list_container = document.getElementById( "devices_list_container" );
    
    if( device_main_chkbox.checked == true )
    {
        toggle_all_checkboxes( "check" );
    }
    else
    {
        toggle_all_checkboxes( "uncheck" );
    }
} */   

/* function toggle_all_checkboxes( action )
{
    CUtil.applyToChildNodes(document.getElementById("devices_list_container"), "INPUT", true, function(ob){
        if(ob.type == 'checkbox')
            ob.checked = ( action == "check" ) ? ( true ) : ( false );
    });
} */

function removeProfile( remove_link )
{
    // /* to provide the profile name in confirm box, we are retriving it before the confirm message */
    var device_profile_block = remove_link.parentNode.parentNode;
    var profile_name_div = CUtil.getChildByName( device_profile_block, "device_profile_name", "DIV", true );
    var profile_name = profile_name_div.innerHTML;
    
    if ( confirm( "Are you sure you want to remove the \"" + profile_name + "\" Profile? " ) == true ) {
        // showLoader( "Removing.." );
        showLoadingWithText( "Removing..." );
        var udid = document.getElementById( "device_udid" ).innerHTML;
        
        
        var profile_id_div = CUtil.getChildByName( device_profile_block, "profile_identifier", "DIV", true );
        var profile_id = profile_id_div.innerHTML;
        
        var json = { "udid" : udid, "profileid" : profile_id };
       
        $.ajax({
            url: '/removeProfile/',
            type: 'POST',
            data: "request="+JSON.stringify(json),
            error:function()
            {
                alert("request failed!!");
            },
            success: function(data)
            {
                console.log( data );
                alert( "Profile removed" );
                showDeviceDetails( udid, 1 );
            }
        });
    }
}

function uninstallApp( uninstall_link )
{
    if ( confirm( "Are you sure you want to uninstall the Application? " ) == true ) {
        // showLoader( "Uninstalling.." );
        showLoadingWithText( "Uninstalling..." );
        var udid = document.getElementById( "device_udid" ).innerHTML;
        var device_app_block = uninstall_link.parentNode.parentNode;
        
        var app_id_div = CUtil.getChildByName( device_app_block, "app_identifier", "DIV", true );
        var app_id = app_id_div.innerHTML;
        
        var json = { "appid": app_id, "udid": udid };
        
        $.ajax({
            url: '/removeApp/',
            type: 'POST',
            data: "request="+JSON.stringify(json),
            error:function()
            {
                alert("request failed!!");
            },
            success: function(data)
            {
                // hideLoader();
                hideLoading();
                alert( "Applications removed" );
                showDeviceDetails( udid, 2 );
            }
        });
    }
}

function hideLoader()
{
    document.getElementById( "loading" ).style.display = "none";
}

function get_device_list_template()
{
    var _html = '<div name="_#_DEVICE_UDID_#_" class="devices_list_block" onclick="showDeviceDetails(\'_#_DEVICE_UDID_#_\', 0, this);"><div id="devices_name" name="devices_name" class="devices_name">_#_DEVICE_NAME_#_</div><div class="devices_regdate" id="devices_regdate" name="devices_regdate">_#_DEVICE_REGDATE_#_</div></div>';
    
    return _html;
}

function get_device_profile_template()
{
    var _html = '<div id="device_profile_block" name="device_profile_block"><div id="device_prof_fld"><div class="device_profile_name" name="device_profile_name" id="device_prof_fld_val">_#_DEVICE_PROFILE_NAME_#_</div> <div id="device_info_remove" class="device_info_remove" onclick="removeProfile(this);">remove</div> | <div id="device_info_show_more" class="device_info_show_more" onclick="toggle_device_info( this, \'profile\' );">more</div></div><div id="device_profile_details" class="device_profile_details" style="display:none;"><div id="device_prof_fld"><div id="device_prof_fld_lbl">Version: </div><div id="device_prof_fld_val">_#_DEVICE_PROFILE_VERSION_#_</div></div><div id="device_prof_fld"><div id="device_prof_fld_lbl">Identifier: </div><div name="profile_identifier" id="device_prof_fld_val">_#_DEVICE_PROFILE_IDENTIFIER_#_</div></div></div></div>';
    
    return _html;
}

function get_device_app_template()
{
    var _html = '<div id="device_app_block" name="device_app_block"><div id="device_app_fld"><div class="device_app_name" id="device_app_fld_val">_#_APP_NAME_#_</div><div id="device_info_uninstall" class="device_info_uninstall" onclick="uninstallApp(this);">uninstall</div> | <div id="device_info_show_more" class="device_info_show_more" onclick="toggle_device_info( this, \'app\' );">more</div></div><div id="device_app_details" class="device_app_details" style="display:none;"><div id="device_app_fld_val" style="width:32%;"><div style="display:inline-block;padding-right:3px;">Version: </div><div style="display:inline-block;"><span id="device_app_version">_#_APP_VERSION_#_</span>, <span id="device_app_short_version">_#_APP_SHORT_VERSION_#_</span></div></div><div id="device_app_fld_val" style="width:32%;"><div style="display:inline-block;padding-right:3px;">Size: </div><div style="display:inline-block;">_#_APP_SIZE_#_</div></div><div id="device_app_fld_val" style="width:32%;"><div style="display:inline-block;padding-right:3px;">Identifier: </div><div name = "app_identifier" style="display:inline-block;">_#_APP_IDENTIFIER_#_</div></div></div></div>';
    
    return _html;
}

function returnCheckedDevices()
{
    var d = new Array();
    
    CUtil.applyToChildNodes(document.getElementById("devices_list_container"), "INPUT", true, function(ob){
        if(ob.type == 'checkbox' && ob.checked)
            d.push(ob.getAttribute("name"))
    });
    
    if(d.length > 0)
        return d;
    else
        alert( 'Please select device!' );
        
    return false;    
}

function validateAddCommand( index )
{
    var _continue = true;
    
    if( _sel_device_udid.length > 0 )
    {
        if( ( index == 1 ) || index == 2 )
        {
            /* if( _sel_device_udid > 0 )
            _continue = confirm( "Are you sure you want to erase " + _all_device_name[ _all_device_udid.indexOf( _sel_device_udid[ 0 ] ) ] + "?" ); */
            
            var msg = "Are you sure you want to delete ";
            msg += _all_device_name[ _all_device_udid.indexOf( _sel_device_udid[ 0 ]) ];
            
            if( _sel_device_udid.length > 1 )
                msg += " and " + ( _sel_device_udid.length - 1 ) + " more";
                
            _continue = confirm( msg );
        }
        
        if( _continue )
        {
            procActionCommand( index );
        }
    }
    else
    {
        alert( "Please Select a Device" );
    }
}

function procAddProfile(pidentifier, pname)
{
    // var devices = returnCheckedDevices();
    var devices = _sel_device_udid;
        
    if(devices.length > 0)
    {
        // showLoader( "requesting.." );
        showLoadingWithText( "Requesting \"" + pname + "\" Add..." );
        
        var json = { "udid": devices, 'profileid' : pidentifier };
        
        $.ajax({
            url: '/installProfile/',
            type: 'POST',
            data: "request="+JSON.stringify(json),
            error:function()
            {
                // hideLoader();
                hideLoading();
                alert("request failed!!");
            },
            success: function(data)
            {
                // hideLoader();
                hideLoading();
                alert( "Request Submitted" );
                resetDeviceListDiv();
            }
        });
    }
    else
        alert( "Please select a device" );
}

function procRemoveProfile(pidentifier, pname)
{
    var devices = _sel_device_udid;
    if(devices.length > 0)
    {
        if( confirm( "Are you sure you want to remove the profile \"" + pname + "\"" ) )
        {
                // showLoader( "requesting.." );
                showLoadingWithText( "Requesting \"" + pname + "\" Remove..." );
                
                var json = { "udid": devices, 'profileid' : pidentifier };
                
                $.ajax({
                    url: '/removeProfile/',
                    type: 'POST',
                    data: "request="+JSON.stringify(json),
                    error:function()
                    {
                        // hideLoader();
                        hideLoading();
                        alert("request failed!!");
                    },
                    success: function(data)
                    {
                        // hideLoader();
                        hideLoading();
                        alert( "Request Submitted" );
                        resetDeviceListDiv();
                    }
                });
        }
    }
    else
        alert( "Please select a Device" );
}

function deviceChecked(e)
{
    if(e && e.stopPropagation)
        e.stopPropagation();
    else
    {
        e = window.event;
        e.cancelBubble = true;
    }
}

function procActionCommand(index)
{
    var cmds = ['DeviceLock', 'EraseDevice', 'ClearPasscode', ['ProfileList', 'InstalledApplicationList', 'Restrictions', 'DeviceInformation'] ];
    
    var cmd_text = [ "Device Lock", "Erase Device", "Clear Passcode", "Request Latest Device Info" ];
    
    var devices = _sel_device_udid;
    
    if(devices)
    {
        // showLoader( "requesting.." );
        showLoadingWithText( "Requesting " + cmd_text[ index ] + " ..." );
        
        var json = { "udid": devices, 'commandtype' : cmds[index] };
        
        $.ajax({
            url: '/addcommand/',
            type: 'POST',
            data: "request="+JSON.stringify(json),
            error:function()
            {
                // hideLoader();
                hideLoading();
                alert("request failed!!");
            },
            success: function(data)
            {
                // hideLoader();
                hideLoading();
                alert( "Request Submitted" );
                resetDeviceListDiv();
            }
        });
    }
}

function procInstallAOTCommand()
{
    // var devices = returnCheckedDevices();
    var devices = _sel_device_udid;
        
    if(devices.length > 0)
    {
        // showLoader( "requesting.." );
        showLoadingWithText( "Requesting Install AOT..." );
        
        var json = { "udid": devices, 'manifesturl' : 'https://arms.mgtech.in/appstore/demo/armswire.plist' };
        
        $.ajax({
            url: '/installCustomApp/',
            type: 'POST',
            data: "request="+JSON.stringify(json),
            error:function()
            {
                // hideLoader();
                hideLoading();
                alert("request failed!!");
            },
            success: function(data)
            {
                // hideLoader();
                hideLoading();
                alert( "Request Submitted" );
                resetDeviceListDiv();
            }
        });
    }
    else
        alert( "Please select a Device" );
}

/* value of appid is hardcoded to mgtech.ARMS-TAB */
function procUnInstallAOTCommand()
{
    var appid = "mgtech.ARMS-TAB";
    // var devices = returnCheckedDevices();
    var devices = _sel_device_udid;
        
    if(devices.length > 0)
    {
        if( confirm( "Are you sure you want to uninstall Arms on the Tab?" ) )
        {
            // showLoader( "requesting.." );
            showLoadingWithText( "Requesting Uninstall AOT..." );
            
            var json = { "udid": devices, 'appid' : appid };
            
            $.ajax({
                url: '/removeApp/',
                type: 'POST',
                data: "request="+JSON.stringify(json),
                error:function()
                {
                    // hideLoader();
                    hideLoading();
                    alert("request failed!!");
                },
                success: function(data)
                {
                    // hideLoader();
                    hideLoading();
                    alert( "Request Submitted" );
                    resetDeviceListDiv();
                }
            });
        }
    }
    else
        alert( "Please select a Device" );
}