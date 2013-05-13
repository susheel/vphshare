# Create your views here.
from django.db.models import ObjectDoesNotExist, Q
from django.template import RequestContext
from django.shortcuts import render_to_response, redirect
from django.contrib.admin.models import User
from workflows.utils import get_state, set_workflow, set_state, do_transition
from permissions.utils import add_local_role
from config import *
from models import SubscriptionRequest, Study, Institution, AuditLog, VPHShareSmartGroup
from forms import StudyForm, InstitutionForm


def get_group_by_name(name):
    try:
        group = Institution.objects.get(name=name)
    except ObjectDoesNotExist:
        try:
            group = Study.objects.get(name=name)
        except ObjectDoesNotExist:
            group = VPHShareSmartGroup.objects.get(name=name)

    return group


def get_group_by_id(pk):
    try:
        group = Institution.objects.get(pk=pk)
        gtype = 0
    except ObjectDoesNotExist:
        try:
            group = Study.objects.get(pk=pk)
            gtype = 1
        except ObjectDoesNotExist:
            group = VPHShareSmartGroup.objects.get(pk=pk)
            gtype = 2

    return group, gtype


def temp_fix_institution_managers():
    """
        temporary method to grant GroupManager role to institution manager users
    """

    institutions = Institution.objects.all()
    smartgroups = VPHShareSmartGroup.objects.all()

    for institution in institutions:
        for manager in institution.managers.all():
            add_local_role(institution, manager, group_manager)
            institution.user_set.add(manager)
            for study in institution.study_set.all():
                add_local_role(study, manager, group_manager)
                study.managers.add(manager)

    for smartgroup in smartgroups:
        for manager in smartgroup.managers.all():
            smartgroup.user_set.add(manager)
            add_local_role(smartgroup, manager, group_manager)


def join_group_subscription(user, group):
    """
    add to the group object all information about subscriptions
    """
    group.pending_subscriptions = []
    subscriptions = SubscriptionRequest.objects.filter(group=group.pk)
    for subscription in subscriptions:
        if get_state(subscription).name == 'Pending':
            group.pending_subscriptions.append(subscription)
    try:
        subscription = SubscriptionRequest.objects.get(group=group.pk, user=user)
    except ObjectDoesNotExist:
        subscription = None
    if subscription and get_state(subscription).name == 'Pending':
        group.is_subscription_pending = True
    elif subscription and get_state(subscription).name == 'Refused':
        group.is_subscription_refused = True


def group_details(request, idGroup=None, idStudy=None):

    #temp_fix_institution_managers()

    institutions = []
    user_institutions = []
    other_institutions = []

    user_groups = []
    other_groups = []

    pending_institutions = []
    selected_group = None

    for institution in Institution.objects.all():
        state = get_state(institution)
        join_group_subscription(request.user, institution)
        if state is None or state.name == 'Accepted':
            institution.state = True
            institutions.append(institution)
        else:
            institution.state = False
            pending_institutions.append(institution)

        institution.studies = institution.study_set.all()
        institution.studies_actions = 0

        if idGroup is not None and institution.pk == int(idGroup):
            selected_group = institution
            selected_group.selected_study = None
            selected_group.type = 'institution'
        for study in institution.studies:
            join_group_subscription(request.user, study)
            institution.studies_actions += len(study.pending_subscriptions)
            if idStudy is not None and study.pk == int(idStudy):
                selected_group.selected_study = study

    institutions_studies_pk = [i.pk for i in Institution.objects.all()] + [i.pk for i in Study.objects.all()]

    if not request.user.is_authenticated():
        other_institutions = institutions
        other_groups = VPHShareSmartGroup.objects.filter(active=True).exclude(pk__in=institutions_studies_pk)
    else:
        for institution in institutions:
            if request.user in institution.user_set.all() or request.user in institution.managers.all():
                user_institutions.append(institution)
            else:
                other_institutions.append(institution)

        for vphgroup in VPHShareSmartGroup.objects.filter(active=True).exclude(pk__in=institutions_studies_pk):
            join_group_subscription(request.user, vphgroup)
            vphgroup.studies_actions = 0
            vphgroup.state = True
            if idGroup is not None and vphgroup.pk == int(idGroup):
                selected_group = vphgroup
                selected_group.type = 'smart'
            if request.user in vphgroup.user_set.all() or request.user in vphgroup.managers.all():
                user_groups.append(vphgroup)
            else:
                other_groups.append(vphgroup)

    return render_to_response(
        'scs_groups/institutions.html',
        {'user_institutions': user_institutions,
         'pending_institutions': pending_institutions,
         'other_institutions': other_institutions,
         'other_groups': other_groups,
         'user_groups': user_groups,
         'selected_group': selected_group},
        RequestContext(request)
    )


def manage_group_request(request):
    """
        accept or refuse an instution request
    """

    if request.method == 'POST':
        group_name = request.POST['group']
        group = get_group_by_name(group_name)

        if request.POST['operation'] == 'accept':
            do_transition(group, group_accept_subscription, request.user)
        else:
            do_transition(group, group_refuse_subscription, request.user)

        return redirect('/groups/%s/' % group.pk)
    return redirect('/groups/')


def subscribe(request, idGroup=None, idStudy=None, iduser=None):
    """
        create a subscription_pending subscription to an institution
    """

    if request.method == 'POST':

        if idStudy is not None:
            group, gtype = get_group_by_id(idStudy)
        else:
            group, gtype = get_group_by_id(idGroup)

        if iduser is None:
            subscription = SubscriptionRequest(user=request.user, group=group)
            subscription.save()
            set_workflow(subscription, SubscriptionRequestWorkflow)
            set_state(subscription, subscription_pending)
        else:
            user = User.objects.get(pk=iduser)
            subscription = SubscriptionRequest.objects.get(user=user, group=group)

            if request.POST['operation'] == 'accept':
                if do_transition(subscription, subscription_accept_subscription, request.user):
                    group.user_set.add(user)
            else:
                do_transition(subscription, subscription_refuse_subscription, request.user)

        if gtype == 1:
            return redirect('/groups/%s/%s/' % (idGroup, idStudy))
        else:
            return redirect('/groups/%s/' % idGroup)

    return redirect('/groups')


def create_study(request):
    """
        create a new study for the given instution
    """

    if request.method == 'POST':
        request.POST['institution'] = int(request.POST['institution'])
        form = StudyForm(request.POST)

        if form.is_valid():
            form.save()
            return redirect('/groups/%s/%s/' % (request.POST['institution'], form.instance.id))
        else:
            institution = Institution.objects.get(pk=request.POST['institution'])
            return render_to_response(
                'scs_groups/createstudy.html',
                {'form': form,
                 'institution': institution},
                RequestContext(request)
            )
    else:
        institution_pk = request.GET['institution']

        institution = Institution.objects.get(pk=institution_pk)
        if not request.user in institution.managers.all():
            return redirect('/groups/%s/' % institution_pk)

        form = StudyForm(initial={'institution': institution_pk})
        form.Meta.model.institution = institution
        return render_to_response(
            'scs_groups/createstudy.html',
            {'form': form,
             'institution': institution},
            RequestContext(request)
        )


def create_institution(request):
    """
        submit a request to create an institution
    """

    if request.method == 'POST':
        form = InstitutionForm(request.POST)

        if form.is_valid():
            group = form.save(commit=False)
            group.save()
            set_workflow(group, GroupRequestWorkflow)
            set_state(group, group_pending)
            return redirect('/groups')
        else:
            return render_to_response(
                'scs_groups/createinstitution.html',
                {'form': form},
                RequestContext(request)
            )
    else:

        form = InstitutionForm(initial={'managers': [request.user]})

        return render_to_response(
            'scs_groups/createinstitution.html',
            {'form': form},
            RequestContext(request)
        )


def api_help(request):
    return render_to_response(
        'scs_groups/api.html',
        RequestContext(request)
    )