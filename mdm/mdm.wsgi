# django.wsgi for mdm
import os
import sys
import site
 
project_module = 'mdm'

#root_dir = os.path.normpath(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
root_dir = '/home/richa/dev/env/'
activate_this = '/home/richa/dev/env/bin/activate_this.py'

#using virtualenv's activate_this.py to reorder sys.path
#activate_this = os.path.join(root_dir, 'bin', 'activate_this.py')
execfile(activate_this, dict(__file__=activate_this))

sys.path.append('/home/richa/dev/mdm/source/mdm')
#sys.path.append(os.path.join(root_dir, project_module))

#reload if this django.wsgi gets touched
#from ox.django import monitor
#monitor.start(interval=1.0)

#monitor.track(os.path.abspath(os.path.dirname(__file__)))

os.environ['DJANGO_SETTINGS_MODULE'] = project_module + '.settings'
 
#import django.core.handlers.wsgi
 
#application = django.core.handlers.wsgi.WSGIHandler()

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

