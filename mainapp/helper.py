from django.shortcuts import render
from django.http import HttpResponse
from plistlib import *
from APNSWrapper import *
from models import *
import pickle
import json

def demoX():
    return dict(response=APNS_CERT_PATH)

def decodeJson(req):
    try:
        return json.loads(req)
    except:
        logger.debug("decodeJson Failed for : %s" % req)
    return False
    
def createJsonResponse(resp):
    response_str = json.dumps(resp)
    response = HttpResponse(response_str, content_type='application/json')
    response['Content-Length'] = len(response_str)
    return response

def handleAuthenticate(info):
    udid = info.get('UDID')
    topic = info.get('Topic')
    return writePlistToString(dict())

def handleTokenUpdate(info):
    udid = info.get('UDID')
    pushmagic = info.get('PushMagic')
    unlocktoken = info['UnlockToken'].data
    topic = info['Topic']
    token = info['Token'].data
    
    #logger.debug("Device token... : %s" % token)
    #device = Device(udid=udid, topic=topic, pushmagic=pushmagic, token=token, unlocktoken=unlocktoken )
    #device.save()
    addDevice(udid, topic, pushmagic, token, unlocktoken)    
    
    addDeviceQueryCommand(udid)
    
    sendPush(token, pushmagic)
    return writePlistToString(dict())

def handleDeviceQuery(input):
    res = "" 
    udid = input.get("UDID")
    if hasCommandForDevice(udid): 
        c = getCommandForDevice(udid) 
       
        command = str(c.command)
        commandid = str(c.commandid)

        # if command == 'DeviceLock':
           # res = dict(Command=dict(RequestType="DeviceLock"), CommandUUID=commandid)
        # else:
        res = pickle.loads(c.info)
        #logger.debug("type of res : %s" % type(res))
        logger.debug("sending to device : ------------------- \n %s" % writePlistToString(res)) 
        return writePlistToString(res)
    else:
        return(res)

def handleDeviceAck(input):
    res = dict()
    logger.debug("Ack body : ------------------- \n %s" % input)
    udid = input.get("UDID")
    commandid = input.get("CommandUUID")

    procAckForProfileList(udid, input)
    
    setCommandAck(udid, commandid)
    return handleDeviceQuery(input)
    
def procAckForProfileList(udid, input):
    if 'ProfileList' in input:
        setProfileListToDevice(udid, input['ProfileList'])
    elif 'InstalledApplicationList' in input:
        setInstalledApplicationListToDevice(udid, input['InstalledApplicationList'])
    elif 'GlobalRestrictions' in input:
        setRestrictionsListToDevice(udid, input['GlobalRestrictions'])
    elif 'QueryResponses' in input:
        setDeviceInformation(udid, input['QueryResponses'])
        
        
def sendPush(deviceToken, pushMagic):
    #certificate_path = '/var/www/mdm_project/source/main/source/mdm/PushCert.pem'
    #certificate_path = '/var/www/mdm_project/source/main/source/mdm/PushCert.pem'
    
    certificate_path = APNS_CERT_PATH
    
    t = (deviceToken, pushMagic, certificate_path)
    logger.debug("sending Push to token: {0} , PushMagic : {1}, with certificate_path: {2}".format(*t))
    try:
        wrapper = APNSNotificationWrapper(certificate_path, False)
        message = APNSNotification()
        message.token(deviceToken)
        message.appendProperty(APNSProperty('mdm', pushMagic))
        wrapper.append(message)
        wrapper.notify()
    except Exception as e:
        logger.error("error sending PUSH : %s " % e)

def isDeviceCommandValid(command):
    global DEVICE_QUERY_COMMAND, DEVICE_ACION_COMMAND

    return command in DEVICE_QUERY_COMMAND or command in DEVICE_ACION_COMMAND 

def procSaveProfile(jsondict, profiledir, signer_cert, signer_key, ca_cert):
    try:
    
        profileid = "com.sds." + str(uuid4())
        payloaduuid = str(uuid4())
        payloadVersion = 1
        
        if 'profileid' in jsondict:
            profileid = jsondict['profileid']
            payloaduuid = jsondict['payloadUUID']
            payloadVersion += 1
            
        profilename = jsondict['profilename']
        profiledesc = jsondict['profiledesc']
        
        organization = "Sheorey Digital Systems"
        
        profiledictionary = dict( PayloadDisplayName = profilename, PayloadDescription = profiledesc, PayloadIdentifier = profileid, PayloadOrganization = organization, PayloadRemovalDisallowed = False, PayloadType = "Configuration", PayloadUUID = payloaduuid, PayloadVersion = payloadVersion )
        
        contentArray = []
        if 'restrictions' in jsondict:
            contentArray.append(getRestrictionDict(jsondict['restrictions'], profileid, organization ))
            
            
        profiledictionary['PayloadContent'] = contentArray
        
        profileFilePath = profiledir + profileid + ".mobileconfig"
        
        profilefile = open(profileFilePath, "w")
        profilefile.write(writePlistToString(profiledictionary))
        profilefile.close()

        profileFilePath = createSignedProfile(profileid, profileFilePath, profiledir, signer_cert, signer_key, ca_cert)
        saveProfileInDb(profileid, profilename, profiledesc, profileFilePath, profiledictionary)
        return True
            
    except Exception as e:
        logger.debug("saveProfile failed; Message : {}".format(e.message))
    
    return False

def getRestrictionDict(d, pidentifier, organization):
    resp = dict(PayloadDescription = "Configures device restrictions.", PayloadDisplayName = "Restrictions", PayloadIdentifier = pidentifier + ".restrictions", PayloadOrganization = organization, PayloadType = "com.apple.applicationaccess", PayloadUUID = str(uuid4()), PayloadVersion = 1, allowAddingGameCenterFriends = True, allowAppInstallation = d['allowAppInstallation'], allowAssistant = True, allowAssistantWhileLocked = True, allowCamera = d['allowCamera'], allowCloudBackup = True, allowCloudDocumentSync = True, allowDiagnosticSubmission = True, allowExplicitContent = True, allowGlobalBackgroundFetchWhenRoaming = d['allowGlobalBackgroundFetchWhenRoaming'], allowInAppPurchases = True, allowMultiplayerGaming = True, allowPhotoStream = True, allowSafari = True, allowScreenShot = d['allowScreenShot'], allowUntrustedTLSPrompt = True, allowVideoConferencing = d['allowVideoConferencing'], allowVoiceDialing = True, allowYouTube = True, allowiTunes = True, forceEncryptedBackup = False, forceITunesStorePasswordEntry = False, ratingApps = 1000, ratingMovies = 1000, ratingRegion = "us", ratingTVShows = 1000, safariAcceptCookies = 2, safariAllowAutoFill = True, safariAllowJavaScript = True, safariAllowPopups = True, safariForceFraudWarning = False)
    
    return resp
    
def createSignedProfile(pidentifier, profileFilePath, profiledir, signer_cert, signer_key, ca_cert):
    try:
        if os.path.isfile(profileFilePath):
            if os.path.isfile(signer_cert) and os.path.isfile(signer_key) and os.path.isfile(ca_cert):
                
                outfile = profiledir + "/signed-" + pidentifier + ".mobileconfig"
                
                if os.path.isfile(outfile):
                    os.remove(outfile)
                
                command = "openssl smime -sign -in '" + profileFilePath + "' -out '" + outfile + "' -signer '" + signer_cert + "' -inkey '" + signer_key + "' -certfile '" + ca_cert + "' -outform der -nodetach"
                
                stream = os.popen( command )
                
                logger.debug("command completed ... : " + command)
                
                #todo: check for size of signed profile
                
                #todo: wait for command to get over then check for op, then do following, currently dont know how to wait till command gets over
                
                #if os.path.isfile(outfile):
                #os.remove(profileFilePath)
                #os.rename(outfile, profileFilePath)
                return outfile
            else:
                logger.debug("createSignedProfile : certs does not exists..")    
        else:
            logger.debug("createSignedProfile : {} does not exists..", profileFilePath)
    except Exception as e:
        logger.debug("createSignedProfile failed; Message : {}".format(e.message))
        
    return False 

def addInstallProfileTOMultipleDevices(profileid, *udids):
    for udid in udids:
        if hasDevice(udid):
            d = getDeviceTokenAndPushMagic(udid)

            logger.debug("D: %s", d.token)

            if d and addInstallProfileCommand(udid, profileid):
                addDeviceQueryCommand(udid)
                sendPush(str(d.token), str(d.pushmagic))
        else:
            logger.debug("Add profileid req: uuid " + udid + " does not exists")
            
def addRemoveProfileTOMultipleDevices(profileid, *udids):
    for udid in udids:
        if hasDevice(udid):
            d = getDeviceTokenAndPushMagic(udid)

            logger.debug("D: %s", d.token)

            if d and addRemoveProfileCommand(udid, profileid):
                addDeviceQueryCommand(udid)
                sendPush(str(d.token), str(d.pushmagic))
        else:
            logger.debug("Remove profileid req: uuid " + udid + " does not exists")

def addInstallCustomAppTOMultipleDevices(manifesturl, *udids):
    for udid in udids:
        if hasDevice(udid):
            d = getDeviceTokenAndPushMagic(udid)

            logger.debug("D: %s", d.token)

            if d and addInstallCustomAppCommand(udid, manifesturl):
                addDeviceQueryCommand(udid)
                sendPush(str(d.token), str(d.pushmagic))
        else:
            logger.debug("install custom app req: uuid " + udid + " does not exists")
            
def addRemoveAppTOMultipleDevices(appid, *udids):
    for udid in udids:
        if hasDevice(udid):
            d = getDeviceTokenAndPushMagic(udid)

            logger.debug("D: %s", d.token)

            if d and addRemoveAppCommand(udid, appid):
                addDeviceQueryCommand(udid)
                sendPush(str(d.token), str(d.pushmagic))
        else:
            logger.debug("remove custom app req: uuid " + udid + " does not exists")
    
def addCommandsToDevice(udid, *cmds):
    for cmd in cmds:
        if len(cmd) > 0 and isDeviceCommandValid(cmd):
            if cmd == 'ClearPasscode':
                addClearPasscodeCommand(udid)
            elif cmd == 'DeviceInformation':
                addDeviceInformationCommand(udid)
            else:
                addDeviceCommand(udid, cmd)
        else:
            logger.debug("commandtype %s not valid" % cmd)
    d = getDeviceTokenAndPushMagic(udid)
    if d:
        sendPush(str(d.token), str(d.pushmagic))        

def saveDeviceName(udid, devicename):
    if hasDevice(udid):
        d = getDeviceTokenAndPushMagic(udid)

        logger.debug("D: %s", d.token)

        if d and setNameToDevice(udid, devicename):
            addSendDeviceNameComand(udid, devicename)
            sendPush(str(d.token), str(d.pushmagic))
        else:
            logger.debug("set devicename req: saving failed")
    else:
        logger.debug("set devicename req: uuid " + udid + " does not exists")  
            
# def addRemoveProfileProc(udid, *pids):
    # for pid in pids:
        # if len(pid) > 0:
            # addRemoveProfileCommand(udid, pid)