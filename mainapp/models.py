from django.db import models
from datetime import datetime
from django.core.exceptions import ObjectDoesNotExist
from uuid import uuid4
import pickle
import base64
from plistlib import *
from vars import *

class Device(models.Model):
    udid = models.CharField(max_length=100, primary_key=True)
    devicename = models.CharField(max_length=255, default="")
    topic = models.CharField(max_length=255)
    pushmagic = models.CharField(max_length=100)
    token = models.BinaryField()
    unlocktoken = models.BinaryField()
    regdate = models.DateTimeField(default=datetime.now, blank=True)
    profileList = models.TextField(default="")
    applicationList = models.TextField(default="")
    restrictionsList = models.TextField(default="")
    deviceinformation = models.TextField(default="")

class DeviceCommands(models.Model):
    udid = models.CharField(max_length=100)
    commandid = models.CharField(max_length=100)
    command = models.CharField(max_length=100)
    state = models.IntegerField()
    info = models.TextField()
    reqdate = models.DateTimeField(default=datetime.now, blank=True)

class Profiles(models.Model):
    pidentifier = models.CharField(max_length=250, primary_key=True) #identifier of profile like com.sds.uuid4
    pname = models.CharField(max_length=200)
    pdesc = models.CharField(max_length=200)
    pcreatedate = models.DateTimeField(default=datetime.now, blank=True)
    pfilepath = models.CharField(max_length=500)
    pcontent = models.TextField() #dictionary dump
    
def setNameToDevice(udid, name):
    try:
       d = Device.objects.get(udid=udid)
       d.devicename = name
       d.save()
       return True
    except ObjectDoesNotExist as e:
        pass
    return False
    
def setProfileListToDevice(udid, profiledata):
    try:
        d = Device.objects.get(udid=udid)
        
        respProfiles = []
        
        for profile in profiledata:
            payloadDisplayName = profile[ 'PayloadDisplayName' ]
            payloadIdentifier = profile[ 'PayloadIdentifier' ]
            payloadVersion = profile[ 'PayloadVersion' ]
            
            respProfiles.append(dict(PayloadDisplayName = payloadDisplayName, PayloadIdentifier = payloadIdentifier, PayloadVersion = payloadVersion))
        
        d.profileList = pickle.dumps(respProfiles)
        d.save()
        return True
    except ObjectDoesNotExist as e:
        pass
    return False
    
def setInstalledApplicationListToDevice(udid, appdata):
    try:
        d = Device.objects.get(udid=udid)
       
        apps = []
        for app in appdata:
            appName = ""
            try:
                appName = str(app[ 'Name' ])
                logger.debug( "Name Of Application is : " + str(appName) )
            except Exception as e:
                logger.debug( "error on str of name : " + e.message )
            
            appIdentifier = app[ 'Identifier' ]
            appVersion = app[ 'Version' ]

            appShortVersion = ""

            if 'ShortVersion' in app:                        
                appShortVersion = app[ 'ShortVersion' ]
            
            appSize = app[ 'DynamicSize' ]
            
            apps.append(dict(Name = appName, Identifier = appIdentifier, Version = appVersion, ShortVersion = appShortVersion, DynamicSize = appSize))
       
        d.applicationList = pickle.dumps(apps)
        d.save()
        return True
    except ObjectDoesNotExist as e:
        pass
    return False
    
def setRestrictionsListToDevice(udid, restrictiondata):
    try:
        d = Device.objects.get(udid=udid)
        d.restrictionsList = pickle.dumps(restrictiondata)
        d.save()
        return True
    except ObjectDoesNotExist as e:
        pass
    return False

def setDeviceInformation(udid, deviceinfo):
    try:
        d = Device.objects.get(udid=udid)
        d.deviceinformation = pickle.dumps(deviceinfo)
        
        if 'DeviceName'in deviceinfo:
            d.devicename = deviceinfo['DeviceName']
        
        d.save()
        return True
    except ObjectDoesNotExist as e:
        pass
    return False
    
def hasDevice(udid):
    return bool(Device.objects.filter(udid=udid))

def addDevice(udid, topic, pushmagic, token, unlocktoken):
    device = Device(udid=udid, topic=topic, pushmagic=pushmagic, token=token, unlocktoken=unlocktoken )
    device.save()

def addDeviceQueryCommand(udid):
    addDeviceCommand(udid, 'ProfileList')
    addDeviceCommand(udid, 'InstalledApplicationList')
    addDeviceCommand(udid, 'Restrictions')
    addDeviceInformationCommand(udid)
    
def addDeviceInformationCommand(udid):
    c = 'DeviceInformation'
    commandid = str(uuid4())
    res = dict(Command=dict(RequestType=c, Queries=['DeviceName', 'OSVersion', 'BuildVersion', 'ModelName', 'Model', 'ProductName', 'SerialNumber', 'DeviceCapacity', 'AvailableDevice-Capacity', 'BatteryLevel', 'CellularTechnology', 'IMEI', 'MEID', 'IsSupervised']), CommandUUID=commandid)
    saveCommand(udid, commandid, c,res)
    
def addSendDeviceNameComand(udid, devicename):
    c = 'Settings'
    commandid = str(uuid4())
    res = dict(Command=dict(RequestType=c, Settings=[dict(Item='DeviceName', DeviceName=devicename)]), CommandUUID=commandid)
    saveCommand(udid, commandid, c,res)
    
def addDeviceCommand(udid, commandType):
    commandid = str(uuid4())
    res = dict(Command=dict(RequestType=commandType), CommandUUID=commandid)
    saveCommand(udid, commandid, commandType,res)
    
def addClearPasscodeCommand(udid):
    commandid = str(uuid4())
    commandType="ClearPasscode"
    unlocktoken=Data(getDeviceUnlockToken(udid))
    if unlocktoken:
        res = dict(Command=dict(RequestType=commandType, UnlockToken=unlocktoken), CommandUUID=commandid)
        saveCommand(udid, commandid, commandType,res)    
        
def saveCommand(udid, commandid, commandType, dict):
    try:
        DeviceCommands.objects.get(udid=udid, command=commandType, state=0).delete()
    except ObjectDoesNotExist as e:
        pass
    
    command = DeviceCommands(udid=udid, commandid=commandid, command=commandType, state=0, info=pickle.dumps(dict))
    command.save()
  
def getDeviceTokenAndPushMagic(udid):
    try:
       d = Device.objects.filter(udid=udid)
       return d[0]
    except ObjectDoesNotExist as e:
        pass
    return False
    
def getDeviceUnlockToken(udid):
    try:
       d = Device.objects.filter(udid=udid)
       return d[0].unlocktoken
    except ObjectDoesNotExist as e:
        pass
    return False

def hasCommandForDevice(udid):
   return bool(DeviceCommands.objects.filter(udid=udid, state=0)) 

def getCommandForDevice(udid):
   try:
       d = DeviceCommands.objects.filter(udid=udid, state=0).order_by('-reqdate')
       return d[0]
   except ObjectDoesNotExist as e:
        pass
   return False

def setCommandAck(udid, commandid):
    try:
       d = DeviceCommands.objects.get(udid=udid, commandid=commandid)
       d.state = 1
       d.save()
    except ObjectDoesNotExist as e:
        pass

def addInstallAppCommand(udid, storeid):
    commandid = str(uuid4())
    res = dict(Command=dict(RequestType="InstallApplication", iTunesStoreID=storeid, ManagementFlags=4), CommandUUID=commandid)
    saveCommand(udid, commandid, "InstallApplication", res)
    
def addInstallCustomAppCommand(udid, manifesturl):
    commandid = str(uuid4())
    res = dict(Command=dict(RequestType="InstallApplication", ManifestURL=manifesturl, ManagementFlags=1), CommandUUID=commandid)
    saveCommand(udid, commandid, "InstallApplication", res)
    return True
    
def addRemoveAppCommand(udid, appid):
    commandid = str(uuid4())
    resp = dict( Command = dict( RequestType = 'RemoveApplication', Identifier = appid ), CommandUUID=commandid )
    saveCommand(udid, commandid, "RemoveApplication", resp)
    return True
    
def addInstallProfileCommand(udid, profileid):
    commandid = str(uuid4())
    #content = open( '/var/www/mdm_project/source/main/source/mdm/profile_restriction.mobileconfig','r').read() 
    contentfile = getProfilePath(profileid)
    if os.path.isfile(contentfile):
        content = open( contentfile,'r').read()
        if content:
            resp = dict( Command = dict( RequestType = 'InstallProfile', Payload = Data(content) ), CommandUUID=commandid )
            saveCommand(udid, commandid, "InstallProfile", resp)
            return True
    else:
        logger.debug(contentfile + " profile doesent exists...")
            
    return False
    
def addRemoveProfileCommand(udid, profileid):
    commandid = str(uuid4())
    if (profileid not in MANDATORY_PROFILES) and hasProfile(profileid):
        resp = dict( Command = dict( RequestType = 'RemoveProfile', Identifier = profileid ), CommandUUID=commandid )
        saveCommand(udid, commandid, "RemoveProfile", resp)
        return True
    return False

def getProfileDictionary(profileid):
    try:
       p = Profiles.objects.get(pidentifier=profileid)
       return pickle.loads(p.pcontent)
    except ObjectDoesNotExist as e:
        pass
    return False
    
def getProfilePath(profileid):
    try:
       p = Profiles.objects.get(pidentifier=profileid)
       return str(p.pfilepath)
    except ObjectDoesNotExist as e:
        pass
    return False
    
def hasProfile(profileid):
    return bool(Profiles.objects.filter(pidentifier=profileid))
    
def saveProfileInDb(profileid, profilename, profiledesc, profilefilepath, profiledictionary):
    #NOTE:profiledictionary has to be of type dict()
    profile = Profiles(pidentifier=profileid, pname=profilename, pdesc=profiledesc, pfilepath=profilefilepath, pcontent=pickle.dumps(profiledictionary))
    profile.save()
    
def getProfileListFromDB():
    allRecords = []
    try:
        allp = Profiles.objects.all().order_by("-pcreatedate")
        
        if allp:
            for p in allp:
                logger.debug("Profile Name: " + p.pname)
                allRecords.append(dict( profileName = p.pname, profileDesc = p.pdesc, profileId = p.pidentifier, profilecreatedate = str(p.pcreatedate.strftime("%b %d, %Y %H:%M")) ))
                
    except ObjectDoesNotExist as e:
        logger.debug("getProfileListFromDB failed; Message : {}".format(e.message))
    return allRecords
    
def getDeviceListFromDB():
    allRecords = []
    try:
        alld = Device.objects.all().order_by("-regdate")
        
        if alld:
            for d in alld:
                allRecords.append(dict( devicename = d.devicename, udid = d.udid, regdate = str(d.regdate.strftime("%b %d, %Y %H:%M"))))
                
    except ObjectDoesNotExist as e:
        logger.debug("getDeviceListFromDB failed; Message : {}".format(e.message))
    return allRecords
    
def getDeviceInfoDictionary(udid):
    try:
        d = Device.objects.get(udid=udid)
        resp = dict( DeviceName = str(d.devicename), UDID = str(d.udid), RegDate = str(d.regdate) )
       
        respProfiles = []
        if len(d.profileList) > 0:
            profiles = pickle.loads(d.profileList)
            if profiles:
                for profile in profiles:
                    payloadDisplayName = profile[ 'PayloadDisplayName' ]
                    payloadIdentifier = profile[ 'PayloadIdentifier' ]
                    payloadVersion = profile[ 'PayloadVersion' ]
                    
                    canRemove = (payloadIdentifier not in MANDATORY_PROFILES)
                    
                    respProfiles.append(dict(payloadDisplayName = payloadDisplayName, payloadIdentifier = payloadIdentifier, payloadVersion = payloadVersion, canRemove=canRemove))
                    
        resp['profiles'] = respProfiles
            
        respApps = []                    
        if len(d.applicationList) > 0:
            applist = pickle.loads(d.applicationList)
            if applist:
                for app in applist:
                    appName = app[ 'Name' ]
                    appIdentifier = app[ 'Identifier' ]
                    appVersion = app[ 'Version' ]
                    
                    appShortVersion = ""
                    
                    if 'ShortVersion' in app:                        
                        appShortVersion = app[ 'ShortVersion' ]
                        
                    appSize = app[ 'DynamicSize' ]
                    
                    respApps.append(dict(appName = appName, appIdentifier = appIdentifier, appVersion = appVersion, appShortVersion = appShortVersion, appSize = appSize))
                
        resp['apps'] = respApps
            
        resp['restrictions'] = []
        if len(d.restrictionsList) > 0:
            restrictionList = pickle.loads(d.restrictionsList)
            if restrictionList:
                resp['restrictions'] = restrictionList
        
        resp['deviceinformation'] = []
        if len(d.deviceinformation) > 0:
            deviceinformation = pickle.loads(d.deviceinformation)
            if deviceinformation:
                resp['deviceinformation'] = deviceinformation

                
        return resp
    except ObjectDoesNotExist as e:
        logger.debug("---errr : " + e.message);    
        pass
    return False 
    
def deleteProfileFromDB(pids):
    try:
        Profiles.objects.filter(pidentifier__in=pids).delete()
    except:
        pass 