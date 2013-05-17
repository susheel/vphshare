
# Create your views here.

from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.models import User, Group
from django.db.models import ObjectDoesNotExist
from permissions.models import PrincipalRoleRelation, Role
from permissions.utils import add_role, remove_role, has_local_role, has_permission, add_local_role, remove_local_role
import json
from masterinterface.scs_security.politicizer import create_policy_file, extract_permission_map
from masterinterface.scs_security.configurationizer import create_configuration_file, extract_configurations
from masterinterface.cyfronet import cloudfacade
from masterinterface.atos.metadata_connector import get_resource_metadata, AtosServiceException
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from .models import Resource, Workflow
from forms import WorkflowForm
from masterinterface.atos.metadata_connector import *
from utils import get_permissions_map

def resource_share_widget(request, global_id='84152af8-2588-417b-ab7d-2eb8ed0b2f31'):
    """
        given a data endpoint display all related information
    """

    resource = Resource.objects.get(global_id=global_id)

    # link data to the relative security configuration STATICALLY!
    # configuration_name = 'TestMatteo'
    # configuration_file = cloudfacade.get_securityproxy_configuration_content(request.user.username, request.COOKIES.get('vph-tkt'), configuration_name)

    # retrieve roles from the configuration
    # properties = extract_configurations(configuration_file)

    resource.permissions_map = get_permissions_map(global_id)

    return render_to_response(
        'scs_resources/share_widget.html',
        {'tkt64': request.COOKIES.get('vph-tkt'),
         'resource': resource,
         'requests': [],
         },
        RequestContext(request)
    )


def alert_user_by_email(user, resource, action="granted"):
    """
        send an email to alert user
    """


def grant_role(request):
    """
        grant role to user or group
    """

    # if has_permission(request.user, "Manage sharing"):
    name = request.GET.get('name')
    role = Role.objects.get(name=request.GET.get('role'))
    resource = Resource.objects.get(global_id=request.GET.get('global_id'))

    try:
        principal = User.objects.get(username=name)
    except ObjectDoesNotExist, e:
        principal = Group.objects.get(name=name)

    # TODO ADD GLOBAL ROLE ACCORDING TO RESOURCE NAME!!!
    # global_role, created = Role.objects.get_or_create(name="%s_%s" % (resource.globa_id, role.name))
    # add_role(principal, global_role)
    add_local_role(resource, principal, role)

    response_body = json.dumps({"status": "OK", "message": "Role granted correctly", "alertclass": "alert-success"})
    response = HttpResponse(content=response_body, content_type='application/json')
    return response


def revoke_role(request):
    """
        revoke role from user or group
    """

    # if has_permission(request.user, "Manage sharing"):
    name = request.GET.get('name')
    role = Role.objects.get(name=request.GET.get('role'))
    resource = Resource.objects.get(global_id=request.GET.get('global_id'))

    try:
        principal = User.objects.get(username=name)
    except ObjectDoesNotExist, e:
        principal = Group.objects.get(name=name)

    # TODO REMOVE GLOBAL ROLE ACCORDING TO RESOURCE NAME!!!
    # global_role, created = Role.objects.get_or_create(name="%s_%s" % (resource.globa_id, role.name))
    # remove_role(principal, global_role)
    remove_local_role(resource, principal, role)

    response_body = json.dumps({"status": "OK", "message": "Role revoked correctly", "alertclass": "alert-success"})
    response = HttpResponse(content=response_body, content_type='application/json')
    return response


def create_role(request):
    """
        create the requested role and the relative security
    """

    # if has_permission(request.user, "Create new role"):
    role_name = request.GET.get('role')
    role, created = Role.objects.get_or_create(name=role_name)
    if not created:
        # role with that name already exists
        response_body = json.dumps({"status": "KO", "message": "Role with name %s already exists" % role_name, "alertclass": "alert-error"})
        response = HttpResponse(content=response_body, content_type='application/json')
        return response

    policy_file = create_policy_file(['read'], [role_name])
    if cloudfacade.create_securitypolicy(request.user.username, request.COOKIES.get('vph-tkt'), role_name, policy_file):
        response_body = json.dumps({"status": "OK", "message": "Role created correctly", "alertclass": "alert-success", "rolename": role_name})
        response = HttpResponse(content=response_body, content_type='application/json')
        return response
    else:
        response_body = json.dumps({"status": "KO", "message": "Interaction with security agent failed", "alertclass": "alert-error"})
        response = HttpResponse(content=response_body, content_type='application/json')
        return response


@login_required
def workflowsView(request):

    workflows = []

    try:
        dbWorkflows = Workflow.objects.all()
        for workflow in dbWorkflows:
            workflows.append(workflow)

    except Exception, e:
        request.session['errormessage'] = 'Metadata server is down. Please try later'
        pass

    return render_to_response("scs_resources/workflows.html", {'workflows': workflows}, RequestContext(request))


@login_required
def edit_workflow(request, id=False):
    try:
        if id:
            dbWorkflow = Workflow.objects.get(id=id)
            if request.user != dbWorkflow.owner:
                raise

            metadata = get_resource_metadata(dbWorkflow.global_id)
            metadata['title'] = metadata['name']
            form = WorkflowForm(metadata, instance=dbWorkflow)

        if request.method == "POST":
            form = WorkflowForm(request.POST, request.FILES, instance=dbWorkflow)

            if form.is_valid():
                workflow = form.save(commit=False)
                workflow.owner = request.user

                metadata_payload = {'name': form.data['title'], 'description': form.data['description'],
                                    'author': request.user.username, 'category': form.data['category'],
                                    'tags': form.data['tags'], 'type': 'Workflow',
                                    'semantic_annotations': form.data['semantic_annotations'],
                                    'licence': form.data['licence'], 'local_id': workflow.id}

                update_resource_metadata(dbWorkflow.global_id, metadata_payload)

                workflow.save()
                request.session['statusmessage'] = 'Changes were successful'
                return redirect('/workflows')

        return render_to_response("scs_resources/workflows.html",
                                  {'form': form},
                                  RequestContext(request))
    except AtosServiceException, e:
        request.session['errormessage'] = 'Metadata service not work, please try later.'
        return render_to_response("scs_resources/workflows.html",
                                  {'form': form},
                                  RequestContext(request))

    except Exception, e:
        if not request.session['errormessage']:
            request.session['errormessage'] = 'Some errors occurs, please try later. '
        return redirect('/workflows')



@login_required
def create_workflow(request):
    try:
        form = WorkflowForm()
        if request.method == 'POST':
            form = WorkflowForm(request.POST, request.FILES)

            if form.is_valid():
                form.save(owner=request.user)
                request.session['statusmessage'] = 'Workflow successfully created'
                return redirect('/workflows')
            else:
                request.session['errormessage'] = 'Some fields are wrong or missed.'
                return render_to_response("scs_resources/workflows.html", {'form': form}, RequestContext(request))
        raise

    except AtosServiceException, e:
        request.session['errormessage'] = 'Metadata service not work, please try later.'
        return render_to_response("scs_resources/workflows.html", {'form': form}, RequestContext(request))

    except Exception, e:
        return render_to_response("scs_resources/workflows.html", {'form': form}, RequestContext(request))
