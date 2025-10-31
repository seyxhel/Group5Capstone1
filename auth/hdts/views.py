# auth/hdts/views.py

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db import transaction
from .forms import UserRegistrationForm
from users.models import User
from roles.models import Role
from systems.models import System
from system_roles.models import UserSystemRole
from .decorators import hdts_admin_required # Import the decorator
from django.views.decorators.http import require_POST


def register_user_view(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                # Use a transaction to ensure user creation and role assignment
                # are all-or-nothing.
                with transaction.atomic():
                    # 1. Find the target System and Role by name
                    # Assumes the system slug is 'hdts' and role name is 'Employee'
                    hdts_system = System.objects.get(slug='hdts')
                    employee_role = Role.objects.get(name='Employee', system=hdts_system)
                    
                    # 2. Save the User using the form's save method
                    # (which calls User.objects.create_user)
                    user = form.save()
                    
                    # 3. Associate the new user with the Employee role in the HDTS system
                    UserSystemRole.objects.create(
                        user=user,
                        system=hdts_system,
                        role=employee_role
                    )
                
                messages.success(request, 'Registration successful! Your account is pending approval.')
                # Redirect to a login page or a success page
                return redirect('/token') # Assumes a 'login' URL name exists

            except System.DoesNotExist:
                messages.error(request, "Configuration error: The 'HDTS' system does not exist.")
            except Role.DoesNotExist:
                messages.error(request, "Configuration error: The 'Employee' role does not exist.")
            except Exception as e:
                messages.error(request, f"An unexpected error occurred: {e}")
        
        else:
            messages.error(request, 'Please correct the errors below.')
            
    else:
        form = UserRegistrationForm()
        
    return render(request, 'hdts/register.html', {'form': form})


# --- NEW VIEW FOR USER MANAGEMENT ---
@hdts_admin_required
def manage_pending_users_view(request):
    """
    View for HDTS Admins to approve or reject pending Employee registrations.
    """
    # Find users who are assigned the 'Employee' role in the 'hdts' system
    # AND have a status of 'Pending'.
    pending_users = User.objects.filter(
        status='Pending',
        system_roles__system__slug='hdts',
        system_roles__role__name='Employee'
    ).distinct() # Use distinct() in case a user somehow got the role twice

    context = {
        'pending_users': pending_users
    }
    return render(request, 'hdts/user_management/pending_approvals.html', context)

@hdts_admin_required
@require_POST # Ensure this view only accepts POST requests
def update_user_status_view(request, user_id):
    """
    Handles the POST request to approve or reject a user.
    """
    user_to_update = get_object_or_404(User, id=user_id)
    action = request.POST.get('action') # 'approve' or 'reject'

    if user_to_update.status != 'Pending':
        messages.warning(request, f"User {user_to_update.email} is no longer pending.")
        return redirect('hdts:manage_pending_users')

    if action == 'approve':
        user_to_update.status = 'Approved'
        # Add notification logic here if needed
        # notification_client.send_notification(...)
        messages.success(request, f"User {user_to_update.email} approved.")
    elif action == 'reject':
        user_to_update.status = 'Rejected'
        # Optionally deactivate the user or add notification logic
        # user_to_update.is_active = False 
        messages.success(request, f"User {user_to_update.email} rejected.")
    else:
        messages.error(request, "Invalid action.")
        return redirect('hdts:manage_pending_users')

    user_to_update.save(update_fields=['status']) # Only save the status field

    return redirect('hdts:manage_pending_users') # Redirect back to the management page
