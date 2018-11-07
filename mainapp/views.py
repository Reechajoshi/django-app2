from django.views.decorators.csrf import csrf_exempt

from django.shortcuts import render

from django.http import QueryDict
from django.http import HttpResponse
from django.http import HttpResponseNotFound
from django.http import HttpResponseRedirect

from helper import * 
from plistlib import *
from uuid import uuid4

from django.contrib import auth
from django.contrib.auth.decorators import login_required

def cacrt(request):
    file_content = open( CA_CERT_PATH,'r').read() 
    response = HttpResponse(file_content, content_type='application/x-apple-aspen-config')
    response['Content-Disposition'] = 'attachment; filename=CA.crt'
    return response

def mdmprofile(request):
    file_content = open( PROFILES_MAIN_DIR + '/mdm.mobileconfig','r').read() 
    response = HttpResponse(file_content, content_type='application/x-apple-aspen-config')
    response['Content-Disposition'] = 'attachment; filename=Enroll.mobileconfig'
    return response
    
#html file to be rendered
@login_required
def profiles(request):
    profiles = Profiles.objects.all()
    return render( request, "ui/profiles.html", { "profiles": profiles, 'request': request } )

# def createprofile(request):
	# return render( request, "createprofile.html")

@login_required
def home(request):
    return render( request, "ui/home.html")

@csrf_exempt
@login_required
def logout(request):
    auth.logout(request)
    return HttpResponseRedirect("/login/?loggedout=1")
    
@csrf_exempt
def login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '')
        password = request.POST.get('password', '')
        
        next = request.GET.get('next', '/')
        
        user = auth.authenticate(username=username, password=password)
        
        if user is not None and user.is_active:
            auth.login(request, user)
            return HttpResponseRedirect(next)
        else:
            return HttpResponseRedirect("/login/?invalid=1&next=" + next)
    else:   
        return render( request, "ui/login.html", { 'request': request })

@login_required    
def devices(request):
    devices = Device.objects.all()
    profiles = Profiles.objects.all()
    return render( request, "ui/device.html", { 'devices': devices, 'profiles': profiles, 'request': request } )

@login_required    
def devices_actions(request):
    devices = Device.objects.all()
    profiles = Profiles.objects.all()
    return render( request, "ui/device_actions.html", { 'devices': devices, 'profiles': profiles, 'request': request } )

@login_required    
def devices_profiles(request):
    devices = Device.objects.all()
    profiles = Profiles.objects.all()
    return render( request, "ui/device_profiles.html", { 'devices': devices, 'profiles': profiles, 'request': request } )

@login_required    
def devices_apps(request):
    devices = Device.objects.all()
    profiles = Profiles.objects.all()
    return render( request, "ui/device_apps.html", { 'devices': devices, 'profiles': profiles, 'request': request } )

def registerdevice(request):
    return render( request, "registerdevice.html")
    
#js calls for internal files    
@csrf_exempt
@login_required
def internalJS(request):
    if request.GET.get('request') == 'devices':
        return render( request, "js/devices.js")
    elif request.GET.get('request') == 'profiles':
        return render( request, "js/profiles.js")
    elif request.GET.get('request') == 'base':
        return render( request, "js/base.js")
    else:
        return HttpResponseNotFound('<h1>Page not found</h1>')
    
#mdm request from ipad
@csrf_exempt
def checkin(request):
    response_str = ""
    response = HttpResponse('')

    if request.method == 'PUT':
        input = readPlistFromString(request.body)
        if input.get('MessageType') == 'Authenticate':
            #call function to handle authenticate
            response_str = handleAuthenticate(input)
        elif input.get('MessageType') == 'TokenUpdate':
            #call function to handle TokenUpdate
            response_str = handleTokenUpdate(input)

        #logger.debug("checkin received with PUT request  : %s " % input)
        #logger.debug("checkin response %s " % response_str)
        
        response = HttpResponse(response_str, content_type='application/x-apple-aspen-config')
        response['Content-Length'] = len(response_str)
    return response

@csrf_exempt
def server(request):
    response_str = ""
    if request.method == 'PUT':
        input = readPlistFromString(request.body)
        if input.get('Status') == 'Idle':
            response_str = handleDeviceQuery(input)
        elif input.get('Status') == 'Acknowledged':
            response_str = handleDeviceAck(input)
    
    response = HttpResponse(response_str, content_type='application/x-apple-aspen-config')
    response['Content-Length'] = len(response_str)
    
    return response

#AJAX Calls from web
@csrf_exempt
@login_required
def demo(request):
    response = dict(response=False)
    if request.method == 'POST':
        j = decodeJson(request.POST.get('request'))
        if j:
            logger.debug("demo received : %s" % j['x'])
            
    response = demoX()        
    return createJsonResponse(response)
    
def procAddCommand(udid, commandtype):
    if hasDevice(udid):
        logger.debug("uuid %s exists" % udid)
        
        if type(commandtype) == type([]):
            addCommandsToDevice(udid, *commandtype)
        else:
            addCommandsToDevice(udid, commandtype)
    else:
        logger.debug("uuid %s does not exists" % udid)

@csrf_exempt
@login_required
def addcommand(request):
    response = dict(response=False)
    if request.method == 'POST':
        j = decodeJson(request.POST.get('request'))
        if j:
            udid = j['udid']
            commandtype = j['commandtype']
    
            response = dict(response=True)
            
            if type(udid) == type([]):
                for u in udid:
                    procAddCommand(u, commandtype)
            else:
                procAddCommand(udid, commandtype)
            
    return createJsonResponse(response)
    
@csrf_exempt
@login_required
def installApp(request):
    response = dict(response=False)
    if request.method == 'POST':
        j = decodeJson(request.POST.get('request'))
        if j:
            storeid = j['storeid']
            udid = j['udid']
            logger.debug("Install Application received for id : %s" % storeid)
            
            if hasDevice(udid):
                d = getDeviceTokenAndPushMagic(udid)

                logger.debug("D: %s", d.token)

                if d:
                    addInstallAppCommand(udid, storeid) 
                    sendPush(str(d.token), str(d.pushmagic))
                    response = dict(response=True)
            else:
                logger.debug("uuid %s does not exists" % udid)
    
    return createJsonResponse(response)

@csrf_exempt
@login_required
def installCustomApp(request):
    response = dict(response=False)
    
    if request.method == 'POST':
        j = decodeJson(request.POST.get('request'))
        if j:
            manifesturl = j['manifesturl']
            udid = j['udid']
            logger.debug("Install app with manifest url : %s" % manifesturl)

            if type(udid) == type([]):
                addInstallCustomAppTOMultipleDevices(manifesturl, *udid)
            else:
                addInstallCustomAppTOMultipleDevices(manifesturl, udid)
            
            response = dict(response=True)
            
    return createJsonResponse(response)
    
@csrf_exempt
@login_required
def removeApp(request):
    response = dict(response=False)
    
    if request.method == 'POST':
        j = decodeJson(request.POST.get('request'))
        if j:
            appid = j['appid']
            udid = j['udid']
            logger.debug("Remove app with appid : %s" % appid)

            if type(udid) == type([]):
                addRemoveAppTOMultipleDevices(appid, *udid)
            else:
                addRemoveAppTOMultipleDevices(appid, udid)
            
            response = dict(response=True)
            
    return createJsonResponse(response)
    
@csrf_exempt
@login_required
def installProfile(request):
    response = dict(response=False)
    if request.method == 'POST':
        j = decodeJson(request.POST.get('request'))
        if j:
            profileid = j['profileid']
            udid = j['udid']
            logger.debug("Install profile for id : %s" % profileid)

            if type(udid) == type([]):
                addInstallProfileTOMultipleDevices(profileid, *udid)
            else:
                addInstallProfileTOMultipleDevices(profileid, udid)
            
            response = dict(response=True)
            
    return createJsonResponse(response)

@csrf_exempt   
@login_required     
def removeProfile(request):
    response = dict(response=False)
    if request.method == 'POST':
        j = decodeJson(request.POST.get('request'))
        if j:
            profileid = j['profileid']
            udid = j['udid']
            logger.debug("Install profile for id : %s" % profileid)

            if type(udid) == type([]):
                addRemoveProfileTOMultipleDevices(profileid, *udid)
            else:
                addRemoveProfileTOMultipleDevices(profileid, udid)
            
            response = dict(response=True)
            
    return createJsonResponse(response)

@csrf_exempt   
@login_required     
def setDeviceName(request):
    response = dict(response=False)
    
    try:
        if request.method == 'POST':
            
            j = decodeJson(request.POST.get('request'))
            
            if j:
                devicename = j['devicename']
                udid = j['udid']
                
                saveDeviceName(udid, devicename)
                response = dict(response=True)
    except:
        logger.debug("setDeviceName failed..")
        
    return createJsonResponse(response)    
    
@csrf_exempt   
@login_required     
def saveProfile(request):
    response = dict(response=False)
    
    try:
        if request.method == 'POST':
            
            j = decodeJson(request.POST.get('request'))
            
            if j:
                response = dict(response=procSaveProfile(j, PROFILES_DIR, SIGNER_CERT_PATH, SIGNER_KEY_PATH, CA_CERT_PATH))
    except Exception as e:
        logger.debug("saveProfile failed; Message : {}".format(e.message))
        
    return createJsonResponse(response)
    
@csrf_exempt   
@login_required     
def getProfile(request):
    response = dict(response=False)
    
    try:
        if request.method == 'POST':
            
            j = decodeJson(request.POST.get('request'))
            
            if j:
                profileid = j['profileidentifier']
                response = dict(response=getProfileDictionary(profileid))
    except Exception as e:
        logger.debug("getProfile failed; Message : {}".format(e.message))
        
    return createJsonResponse(response)
    
@csrf_exempt
@login_required
def getProfileList(request):
    response = dict(response=False)
    
    try:
        response = dict(response=getProfileListFromDB())
    except Exception as e:
        logger.debug("getProfileList failed; Message : {}".format(e.message))
        
    return createJsonResponse(response)
    
@csrf_exempt
@login_required
def getDeviceList(request):
    response = dict(response=False)
    try:
        response = dict(response=getDeviceListFromDB())
    except Exception as e:
        logger.debug("getDeviceInfo failed; Message :" + e.message)
        
    return createJsonResponse(response)

@csrf_exempt
@login_required
def getDeviceInfo(request):
    response = dict(response=False)
    try:
        if request.method == 'POST':
            j = decodeJson(request.POST.get('request'))
            
            if j:
                udid = j['udid']
                if hasDevice(udid):
                    response = dict(response=getDeviceInfoDictionary(udid))
    except Exception as e:
        logger.debug("getDeviceInfo failed; Message :" + e.message)
        
    return createJsonResponse(response)

@csrf_exempt
@login_required
def deleteProfile(request):
    response = dict(response=False)
    
    try:
        if request.method == 'POST':
            
            j = decodeJson(request.POST.get('request'))
            
            if j:
                pids = j['profileid']
                
                if type(pids) == type([]):
                    deleteProfileFromDB(pids)
                else:
                    deleteProfileFromDB([pids])
                
                response = dict(response=True)
    except Exception as e:
        logger.debug("deleteProfile failed; Message : {}".format(e.message))
        
    return createJsonResponse(response)