from django.conf.urls.defaults import patterns, url, include
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns(
    'cyfronet.views',
    url(r'^lobcderquery.*$', 'lobcderSearch'),
    url(r'^lobcdermetadata(.*)$', 'lobcderMetadata'),
    url(r'^lobcderdelete(.*)$', 'lobcderDelete'),
    url(r'^lobcder(.*)$', 'lobcder'),
    url(r'^dashboard/$', 'dashboard'),
    url(r'^retrivevtk/$', 'retriveVtk'),
)
