var _current_profile_list = false;
var _current_displayed_profile = false;
var _current_displayed_profile_id = false;
var _current_displayed_profile_uuid = false;
var _current_profile_date_arr = [];

var _current_sel_profiles = false;
var _current_all_profiles_id = false;
var _current_all_profiles_name = false;

profileIDs = [];
profileNames = [];

window.onload = function(){

    resize();

    // set tabs
    $(function() {
        $( "#tabs" ).tabs();
    });
    
    $( window ).resize(function() {
        resize();
    });
    
    getProfiles();
}

function resize()
{
    console.log( "height of header : " + $("#header").height() + " -- height of document : " + $(document).height() );

    $("#main_content").height( $(document).height() - $("#header").height() );
    $("#profile_list_container").height( $("#main_content").height() );
    
    $("#profile_list_content_container").height( $("#profile_list_container").height() - $("#profile_list_header_container").height() - 20 - 10 );
    
    $(".tab_container").each(function(){
        $(this).height($("#profile_list_container").height()- 220);
    });
}

function getProfiles()
{
    _current_all_profiles_id = [];
    _current_all_profiles_name = [];
    
    showLoadingWithText( "Loading.." );
    $.ajax({
        url: '/getProfileList/',
        error:function(err)
        {
            console.log( err );
            alert("request failed!!");
        },
        success: function(data)
        {
            hideLoading();
            console.log( data );
            var allProfile = data[ "response" ];
            _current_profile_list = allProfile;
            
            var profileListContentContainer = document.getElementById( 'profile_list_content_container' );
            profileListContentContainer.innerHTML = "";
            
            // TODO: provide proper function, code redundant
            if( allProfile.length > 0 )
            {
                for( var i = 0; i < allProfile.length; i++ )
                {
                    var profileId = allProfile[ i ][ 'profileId' ];
                    var profileName = allProfile[ i ][ 'profileName' ];
                    var profileDesc = ( allProfile[ i ][ 'profileDesc' ].length > 0 ) ? ( allProfile[ i ][ 'profileDesc' ] ) : ( "No Description" );
                    
                    // set _current_profile_date_arr with key profile id and value profile date
                    _current_profile_date_arr[ profileId ] = allProfile[ i ][ 'profilecreatedate' ];
                    
                    // this method will add the id, name and desc to the profile div
                    addProfileListBlock(i, profileId, profileName, profileDesc, profileListContentContainer);
                    
                    // since this is called on saving of profile, we are unselecting all profiles here as well
                    unselectProfileList();
                }
            }
            else
            {
                // <div id="profile_list_block" class="profile_list_block"><div id="no_profile_div">There are currently no Profiles.</div></div>
                var profileListBlock = document.createElement( 'DIV' );
                profileListBlock.setAttribute( "class", "profile_list_block" );
                profileListBlock.name = profileId;
                profileListBlock.id = "profile_list_block";
                
                var noProfileListDiv = document.createElement('div'); // container div which wraps, profile name, desc and hidden id
                noProfileListDiv.id = "no_profile_div";
                noProfileListDiv.innerHTML = "There are currently no Profiles.";
                profileListBlock.appendChild( noProfileListDiv );
                
                profileListContentContainer.appendChild( profileListBlock );
            }
        }
    });
}

function addProfileListBlock(index, profileId, profileName, profileDesc, profileListContentContainer)
{
    _current_all_profiles_id.push(profileId);
    _current_all_profiles_name.push(profileName);
    
    var profileListBlock = document.createElement( 'DIV' );
    profileListBlock.setAttribute( "class", "profile_list_block" );
    profileListBlock.setAttribute( "name", profileId );
    profileListBlock.setAttribute( "index", index ); // based on this index, the values will be accessed.. not the profile block
    profileListBlock.id = "profile_list_block";
                    
    var profile_index = profileListBlock.getAttribute( "index" ); // this is sent ot getProfileDetailsById not this block
    profileIDs.push(profileId);
    profileNames.push(profileName);
                    
    var profileDescTxt = profileDesc;
    if(profileDescTxt.length > 100)
        profileDescTxt.substring(0, 101) + "..."; 
    
    /* profile name */
    var profileNameDiv = document.createElement( 'div' );
    profileNameDiv.setAttribute( "class", "profile_name" );
    profileNameDiv.id = "profile_name";
    profileNameDiv.name = "profile_name";
    profileNameDiv.innerHTML = profileName;
    
    /* profile description */
    var profileDescDiv = document.createElement('div'); // profile desc
    profileDescDiv.innerHTML = profileDescTxt;
    profileDescDiv.setAttribute( "class", "profile_desc" );
    profileDescDiv.id = "profile_desc";
    profileDescDiv.name = "profile_desc";
    
    profileListBlock.appendChild(profileNameDiv);
    profileListBlock.appendChild(profileDescDiv);
    
    profileListBlock.onclick = function() { getProfileDetailsById( profile_index ); return false;}
    
    profileListContentContainer.appendChild( profileListBlock );
}

function setSelectedProfile(profileDiv, profileId)
{
    if(!_current_sel_profiles)
        _current_sel_profiles = [];
        
    profileDiv.className += " profile_list_block_sel";
    if(_current_sel_profiles.indexOf(profileId) == -1)
        _current_sel_profiles.push(_current_all_profiles_id.indexOf(profileId));
}

// show detail of profile
function getProfileDetailsById( profile_index ) // we can just pass the index of the profile to get the details
{
    var allProfileListBlocks = document.getElementsByClassName( "profile_list_block" ); // get all profileListBlocks
    var profileListBlock = allProfileListBlocks[ profile_index ]; // get the current profile clicked based on index
    
    var profileId = profileListBlock.getAttribute( "name" ); // get profileID by name attr
    
    if(!event.ctrlKey)
    {
        unselectProfileList();
        
        showLoadingWithText("Requesting...");
        
        var json = { "profileidentifier" : profileId };
        
        $.ajax({
            url: '/getProfile/',
            type: 'POST',
            data: "request="+JSON.stringify(json),
            error:function(err)
            {
                hideLoading();
                console.log( err );
                alert("request failed!!");
            },
            success: function(data)
            {
                hideLoading();
                
                console.log( data );
                // these two variables are set to be used anywhere in file.. set in success after successfull response
                _current_displayed_profile_id = profileId;
                _current_displayed_profile_uuid = data.response.PayloadUUID;
                _current_displayed_profile = data;
                populateProfile(data);
            }
        });
    }

    setSelectedProfile(profileListBlock, profileId);    
}

function populateProfile(data, isNew) // called from click of profile and clone profile
{
    resetForm();
    
    // show right hand side block
    var profile_detail_container = document.getElementById( "profile_detail_container" );
    profile_detail_container.style.display = "inline-block";
    
    // /* this line reset the tab to first tab */
    $( "#tabs" ).tabs( "option", "active", 0 );
    
    var input_device_name = document.getElementById( "device_name" );
    var input_device_description = document.getElementById( "device_description" );
    
    // topbar elements
    var profile_detail_name = document.getElementById( "profile_detail_name" );
    var profile_detail_date = document.getElementById( "profile_detail_date" );
    var profile_detail_date_container = document.getElementById( "profile_detail_date_container" ); // the container is hidden while new profile.. hence needs to be shown here
    
    if(data) // this will always be true
    {
        // /* values retrived form db */
        var device_name = data.response.PayloadDisplayName;
        var device_description = data.response.PayloadDescription;
        
        // /* fill out general details: */
        input_device_name.value = device_name;
        input_device_description.value = device_description;
        
        // topbar filling values
        profile_detail_name.innerHTML = ( isNew ) ? ( "New Profile" ) : ( device_name );
        // profile_detail_date.innerHTML = data.response.PayloadDisplayName;
        profile_detail_date_container.style.display = ( isNew ) ? ( "none" ) : ( "inline-block" );
        profile_detail_date.innerHTML = _current_profile_date_arr[ data.response.PayloadIdentifier ];
        
         
        if( data.response.hasOwnProperty( "PayloadContent" ) ) // if PayloadContent is present as a property, which is default case..
        {
            if( data.response.hasOwnProperty( "PayloadDisplayName" ) ) // type will be specified here..
            {
                var paylod_display_name = data.response.PayloadContent[0].PayloadDisplayName;
                // generic container id
                var category_details_container_id = data.response.PayloadContent[0].PayloadDisplayName.toLowerCase() + "_details"; // <category>_id
                var category_details_container = document.getElementById( category_details_container_id );
                category_details_container.style.display = "block";
                
                var category_checkbox_id = "include_" + paylod_display_name.toLowerCase() + "_details"
                var category_checkbox = document.getElementById( category_checkbox_id );
                category_checkbox.checked = true;
                
                switch( paylod_display_name )
                {
                    case "Restrictions":
                        // collect db values for restrictions details
                        var allow_install_apps = data.response.PayloadContent[0].allowAppInstallation;
                        var allow_camera = data.response.PayloadContent[0].allowCamera;
                        var allow_face_time = data.response.PayloadContent[0].allowVideoConferencing;
                        var allow_screen_capture = data.response.PayloadContent[0].allowScreenShot;
                        var allow_auto_sync = data.response.PayloadContent[0].allowGlobalBackgroundFetchWhenRoaming;
                        
                        // define elements for restrictions details
                        var install_apps = document.getElementById( "install_apps" );
                        var camera = document.getElementById( "camera" );
                        var face_time = document.getElementById( "face_time" );
                        var screen_capture = document.getElementById( "screen_capture" );
                        var auto_sync = document.getElementById( "auto_sync" );
                        
                        install_apps.checked = allow_install_apps;
                        camera.checked = allow_camera;
                        face_time.checked = allow_face_time;
                        face_time.disabled = ( allow_camera ) ? ( false ) : ( true );
                        screen_capture.checked = allow_screen_capture;
                        auto_sync.checked = allow_auto_sync;
                        
                        break;
                }
            }
        }
        else
            alert( "no property PayloadContent" );
    }
}

function validateProfileDetails()
{
    var profile_details = [];
    profile_details[ 'device_name' ] = document.getElementById( 'device_name' ).value;
    profile_details[ 'device_description' ] = document.getElementById( 'device_description' ).value;
    
    profile_details[ 'include_restrictions_details' ] = ( document.getElementById( 'include_restrictions_details' ).checked == true ) ? ( true ) : ( false );
    profile_details[ 'allow_install_apps' ] = ( document.getElementById( 'install_apps' ).checked == true ) ? ( true ) : ( false );
    profile_details[ 'allow_camera' ] = ( document.getElementById( 'camera' ).checked == true ) ? ( true ) : ( false );
    profile_details[ 'allow_face_time' ] = ( profile_details[ 'allow_camera' ] == 0 ) ? ( false ) : ( ( document.getElementById( 'face_time' ).checked == true ) ? ( true ) : ( false ) );
    profile_details[ 'allow_screen_capture' ] = ( document.getElementById( 'screen_capture' ).checked == true ) ? ( true ) : ( false );
    profile_details[ 'allow_auto_sync' ] = ( document.getElementById( 'auto_sync' ).checked == true ) ? ( true ) : ( false );
    
    profile_details[ 'profileIdentifier' ] = _current_displayed_profile_id;
    profile_details[ 'profileUUID' ] = _current_displayed_profile_uuid;
    
    if( profile_details[ 'device_name' ].length == 0 )
    {
        alert( "Please provide a device name" );
    }
    else if( profile_details[ 'include_restrictions_details' ] == false )
    {
        alert( "Please Provide Device Restrictions" );
    }
    else
    {
        saveProfileDetails( profile_details );
    }
}

function saveProfileDetails( profile_details )
{
    showLoadingWithText( "Saving..." );
    try {
        var json = { "profilename": profile_details[ 'device_name' ], "profiledesc": profile_details[ 'device_description' ], "restrictions": { "allowAppInstallation": profile_details[ 'allow_install_apps' ], "allowCamera": profile_details[ 'allow_camera' ], "allowVideoConferencing": profile_details[ 'allow_face_time' ], "allowScreenShot": profile_details[ 'allow_screen_capture' ], "allowGlobalBackgroundFetchWhenRoaming": profile_details[ 'allow_auto_sync' ] } }
        
        console.log( json );
        
        // while editting, profileIdentifier and profileUUID length is > 0
        if( profile_details[ 'profileIdentifier' ].length > 0 && profile_details[ 'profileUUID' ].length > 0 )
        {
            json.profileid = profile_details[ 'profileIdentifier' ];
            json.payloadUUID = profile_details[ 'profileUUID' ];
        }
        
        $.ajax({
                url: '/saveProfile/',
                type: 'POST',
                data: "request="+JSON.stringify(json),
                error:function(err)
                {
                    console.log( err );
                    alert("request failed!!");
                },
                success: function(data)
                {
                    hideLoading();
                    alert( "added successfully" );
                    console.log( data );
                    getProfiles();
                    resetForm();
                    
                    hideCreateProfile()
                }
        });
    }
    catch( err ) {
        alert( "Updation failed." );
        console.log( err );
    }
}   

function deleteProfiles()
{
    if(_current_sel_profiles && _current_sel_profiles.length > 0)
    {

        _current_sel_profiles.sort(function(a,b){return a-b;});
        var msg = "Are you sure you want to delete ";
        msg += _current_all_profiles_name[ _current_sel_profiles[0] ];
        if(_current_sel_profiles.length > 1)
            msg += " and " + (_current_sel_profiles.length - 1) + " more?";
            
        if(confirm(msg))
        {
            _all_sel_p = [];
            for (index in _current_sel_profiles)
                _all_sel_p.push( _current_all_profiles_id[ index ] );
            json = { "profileid" : _all_sel_p };
            
            showLoadingWithText("Requesting...");
            
            $.ajax({
                url: '/deleteProfile/',
                type: 'POST',
                data: "request="+JSON.stringify(json),
                error:function(err)
                {
                    console.log( err );
                    alert("request failed!!");
                },
                success: function(data)
                {
                    hideLoading();
                    if(data[ "response" ])
                    {
                        hideCreateProfile();    
                        getProfiles();
                    }
                    else
                        alert("request failed!");
                }
            });
        }        
    }
}

function hideCreateProfile()
{
    document.getElementById( "profile_detail_container" ).style.display = "none";
}

function toggleRestrictionsSubquestion( main_ques_id, sub_ques_id )
{
    if( document.getElementById( main_ques_id ).checked == true )
        document.getElementById( sub_ques_id ).disabled = false;
    else
        document.getElementById( sub_ques_id ).disabled = true;
}

function toggleNewProfileDetails(profile_detail_type) // general or restrictions
{
    var detail_container = document.getElementById( profile_detail_type + "_details" );
    if( detail_container.style.display == 'none' )
    {
        detail_container.style.display = 'block';
    }
    else
    {
        detail_container.style.display = 'none';
    }
}

function showCreateProfile()
{
    unselectProfileList();
    
    var profile_detail_container = document.getElementById( "profile_detail_container" );
    profile_detail_container.style.display = "inline-block";
    
    // these two are not set to false in this method because in cloneprofile resetform is called..
    resetForm(); 
    
    _current_displayed_profile_id = false;
    _current_displayed_profile_uuid = false;
    _current_displayed_profile = false;
}

function cloneProfile()
{
    unselectProfileList();
    resetForm();
    
    _current_displayed_profile_id = false;
    _current_displayed_profile_uuid = false;
    populateProfile(_current_displayed_profile, true);
}

function unselectProfileList()
{
    _current_sel_profiles = false;
    var allProfileListBlocks = document.getElementsByClassName( "profile_list_block" ); // get all profileListBlocks
    
    /* remove selected classes from all profile list and then set selected one */
    for( var i = 0; i < allProfileListBlocks.length; i++ )
    {
        CUtil.removeClass( allProfileListBlocks[ i ], "profile_list_block_sel" );
    }
}

function resetForm()
{
    document.getElementById( "profile_detail_name" ).innerHTML = "New Profile";
    document.getElementById( "profile_detail_date_container" ).style.display = "none";
    // set the values of elements to null
    document.getElementById( 'device_name' ).value = "";
    document.getElementById( 'device_description' ).value = "";
    
    document.getElementById( 'include_restrictions_details' ).checked = false;
    document.getElementById( 'restrictions_details' ).style.display = "none";
    document.getElementById( 'install_apps' ).checked = true; // allow installing apps is checked by default
    document.getElementById( 'camera' ).checked = true; // camera not checked
    document.getElementById( 'face_time' ).checked = true;
    document.getElementById( 'face_time' ).disabled = false;
    document.getElementById( 'screen_capture' ).checked = true;
    document.getElementById( 'auto_sync' ).checked = true;
    
    $( "#tabs" ).tabs('option', 'active', 0);
}
