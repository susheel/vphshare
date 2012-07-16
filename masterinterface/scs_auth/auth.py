__author__ = 'Alfredo Saglimbeni (a.saglimbeni@scsitaly.com)'

from django.contrib.auth import get_backends
from django.conf import  settings
from tktauth import createTicket
from datetime import  datetime
import binascii

def authenticate(**credentials):
    """
    Override orginal authenticate to support ticket retrun.
    Now, If the given credentials are valid, return a User object and ticket.
    """
    for backend in get_backends():
        try:
            user = backend.authenticate(**credentials)
        except TypeError:
            # This backend doesn't accept these credentials as arguments. Try the next one.
            continue
        if user is None:
            continue
            # Annotate the user object with the path of the backend.
        if isinstance(user,tuple):
            user[0].backend = "%s.%s" % (backend.__module__, backend.__class__.__name__)
        else:
            user.backend = "%s.%s" % (backend.__module__, backend.__class__.__name__)
        return user

def userProfileUpdate(details, user, *args, **kwargs):
    """
    New pipeline for Social_auth. It set userProfile attribute.
    """

    if not user:
        return

    change=False
    for key, value in details.items():
        if getattr(user,key,None) is not None:
            change=True
            setattr(user,key,value)
        elif getattr(user.userprofile,key,None) is not None:
            change=True
            setattr(user.userprofile,key,value)
    if change:
        user.userprofile.save()
        user.save()


def socialtktGen(details, *args, **kwargs):
    """
    New pipeline for social_auth.
    Generation of ticket from given user details.
    """
    email = details.get('email')

    if email:

        user_key =  ['nickname', 'fullname', 'email', 'language', 'country', 'postcode']
        user_value=[]

        for i in range(0, len(user_key)):
            user_value.append(details[user_key[i]])

        tokens = []
        user = kwargs.get('user')
        for value in user.userprofile.roles.all().values():
            tokens.append(value['roleName'])

        #### IS NOT A FINAL IMPLEMENTATION ONLY FOR DEVELOPER
        #if details['nickname']=='mi_testuser':
        #    tokens=[]
        #else:
        #    tokens=['developer']
        #######

        new_tkt = createTicket(
            settings.SECRET_KEY,
            details['nickname'],
            tokens=tokens,
            user_data=user_value
        )
        tkt64 = binascii.b2a_base64(new_tkt).rstrip()

        return  {'ticket' : tkt64 }