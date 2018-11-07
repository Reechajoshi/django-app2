import logging
from django.conf import settings
import os

logger = logging.getLogger(__name__)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
PROFILES_DIR = BASE_DIR + "/profiles/"
PROFILES_MAIN_DIR = PROFILES_DIR + "/main/"
SIGNER_CERT_PATH = PROFILES_MAIN_DIR + "/Server.crt"
SIGNER_KEY_PATH = PROFILES_MAIN_DIR + "/Server.key"
CA_CERT_PATH = PROFILES_MAIN_DIR + "/CA.crt"
APNS_CERT_PATH = PROFILES_MAIN_DIR + "/APNS.pem"

DEVICE_QUERY_COMMAND = ['ProfileList', 'InstalledApplicationList', 'Restrictions', 'DeviceInformation'] 
DEVICE_ACION_COMMAND = ['DeviceLock', 'EraseDevice', 'ClearPasscode']

MANDATORY_PROFILES = ['com.apple.mgmt.External.119e4bd8-2595-4669-b365-7312e573c86b', 'faa81db8be3bd726a7cce033529873dd3ef1c682a']