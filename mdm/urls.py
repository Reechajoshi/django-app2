from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'mdm.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^$', 'mainapp.views.home', name='home'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^mdmprofile/$', 'mainapp.views.mdmprofile', name='mdmprofile'), 
    url(r'^cacrt/$', 'mainapp.views.cacrt', name='cacrt'), 
    
    #html file
    # url(r'^profiles/$', 'mainapp.views.profiles', name='profiles'), 
    # url(r'^devices/$', 'mainapp.views.devices', name='devices'),
    
    # url(r'^createprofile/$', 'mainapp.views.createprofile', name='createprofile'),
    
    url(r'^a/$', 'mainapp.views.registerdevice', name='registerdevice'),
    url(r'^login/$', 'mainapp.views.login', name='login'),
    url(r'^logout/$', 'mainapp.views.logout', name='logout'),
    url(r'^profiles/$', 'mainapp.views.profiles', name='profiles'),
    url(r'^devices/$', 'mainapp.views.devices', name='devices'),
    url(r'^devices/actions/$', 'mainapp.views.devices_actions', name='devices_actions'),
    url(r'^devices/profiles/$', 'mainapp.views.devices_profiles', name='devices_profiles'),
    url(r'^devices/apps/$', 'mainapp.views.devices_apps', name='devices_apps'),
    
    
    #js internal file
    url(r'^js/', 'mainapp.views.internalJS', name='internalJS'),
    
    #mdm req
    url(r'^checkin/$', 'mainapp.views.checkin', name='checkin'), 
    url(r'^server/$', 'mainapp.views.server', name='server'), 
    
    #Ajax calls
    url(r'^demo/$', 'mainapp.views.demo', name='demo'),
    url(r'^addcommand/$', 'mainapp.views.addcommand', name='addcommand'), #['DeviceLock', 'ProfileList', 'InstalledApplicationList', 'Restrictions']
    url(r'^installApp/$', 'mainapp.views.installApp', name='installApp'), 
    url(r'^installCustomApp/$', 'mainapp.views.installCustomApp', name='installCustomApp'),
    url(r'^removeApp/$', 'mainapp.views.removeApp', name='removeApp'),
    url(r'^installProfile/$', 'mainapp.views.installProfile', name='installProfile'),
    url(r'^removeProfile/$', 'mainapp.views.removeProfile', name='removeProfile'),
    url(r'^setDeviceName/$', 'mainapp.views.setDeviceName', name='setDeviceName'),
    url(r'^saveProfile/$', 'mainapp.views.saveProfile', name='saveProfile'),
    url(r'^getProfile/$', 'mainapp.views.getProfile', name='getProfile'),
    url(r'^getProfileList/$', 'mainapp.views.getProfileList', name='getProfileList'),
    url(r'^getDeviceList/$', 'mainapp.views.getDeviceList', name='getDeviceList'),
    url(r'^getDeviceInfo/$', 'mainapp.views.getDeviceInfo', name='getDeviceInfo'),
    url(r'^deleteProfile/$', 'mainapp.views.deleteProfile', name='deleteProfile'), #removes profile from db

) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
