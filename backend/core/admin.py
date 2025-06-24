from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.core.mail import send_mail
from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from .models import Employee, Ticket, TicketAttachment
from django.utils import timezone

# Custom form for creating users
class EmployeeCreationForm(forms.ModelForm):
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirm Password', widget=forms.PasswordInput)

    class Meta:
        model = Employee
        fields = (
            'email', 'first_name', 'last_name', 'middle_name',
            'suffix', 'company_id', 'department', 'role', 'status', 'image',
        )

    def clean_password2(self):
        pw1 = self.cleaned_data.get("password1")
        pw2 = self.cleaned_data.get("password2")
        if pw1 and pw2 and pw1 != pw2:
            raise forms.ValidationError("Passwords don't match.")
        return pw2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user

# Custom form for updating users
class EmployeeChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = Employee
        fields = (
            'email', 'password', 'first_name', 'last_name', 'middle_name',
            'suffix', 'company_id', 'department', 'role', 'status', 'notified', 'image',
        )

    def clean_password(self):
        return self.initial["password"]

# Register Employee with custom admin
@admin.register(Employee)
class EmployeeAdmin(UserAdmin):
    add_form = EmployeeCreationForm
    form = EmployeeChangeForm
    model = Employee

    list_display = (
        'email', 'first_name', 'last_name', 'company_id',
        'department', 'role', 'status', 'notified'
    )
    list_filter = ('department', 'role', 'status', 'notified')
    search_fields = ('email', 'first_name', 'last_name', 'company_id')
    ordering = ('email',)

    fieldsets = (
        (None, {
            'fields': (
                'email', 'password', 'first_name', 'last_name', 'middle_name',
                'suffix', 'company_id', 'department', 'role', 'status', 'notified', 'image',
            )
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'password1', 'password2', 'first_name', 'last_name',
                'middle_name', 'suffix', 'company_id', 'department', 'role',
                'status', 'image'
            ),
        }),
    )

    def save_model(self, request, obj, form, change):
        if change:
            previous = Employee.objects.get(pk=obj.pk)
            if (
                previous.status != 'Approved' and
                obj.status == 'Approved' and
                not obj.notified
            ):
                send_mail(
                    subject='Account Approved',
                    message=(
                        "Dear Employee,\n\n"
                        "We are pleased to inform you that your SmartSupport account has been successfully created.\n\n"
                        "http://localhost:3000/login/employee\n\n"
                        "If you have any questions or need further assistance, feel free to contact our support team.\n\n"
                        "Respectfully,\n"
                        "SmartSupport Help Desk Team"
                    ),
                    from_email='sethpelagio20@gmail.com',
                    recipient_list=[obj.email],
                    fail_silently=False,
                )
                obj.notified = True
        super().save_model(request, obj, form, change)

# Ticket Admin Form
class TicketAdminForm(forms.ModelForm):
    class Meta:
        model = Ticket
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['employee'].queryset = Employee.objects.filter(role='Employee')
        self.fields['scheduled_date'].widget.attrs.update({
            'type': 'date',
            'min': timezone.now().date().isoformat()
        })

        for field_name in ['priority', 'department', 'response_time', 'resolution_time', 'time_closed']:
            self.fields[field_name].widget.attrs['readonly'] = True
            self.fields[field_name].disabled = True

    def clean_scheduled_date(self):
        scheduled_date = self.cleaned_data['scheduled_date']
        if scheduled_date < timezone.now().date():
            raise forms.ValidationError("Scheduled date cannot be in the past.")
        return scheduled_date

    def clean(self):
        cleaned_data = super().clean()
        if not self.instance.pk:
            cleaned_data['status'] = 'New'
        return cleaned_data

# Inline attachments
class TicketAttachmentInline(admin.TabularInline):
    model = TicketAttachment
    extra = 0
    readonly_fields = ('file', 'file_name', 'file_type', 'file_size', 'uploaded_by', 'upload_date')

# Register Ticket with attachment inline
@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    form = TicketAdminForm
    inlines = [TicketAttachmentInline]

    list_display = (
        'id', 'subject', 'employee', 'department', 'priority',
        'status', 'scheduled_date', 'submit_date', 'assigned_to'
    )
    list_filter = ('department', 'priority', 'status')
    search_fields = (
        'subject',
        'employee__first_name', 'employee__last_name',
        'assigned_to__first_name', 'assigned_to__last_name'
    )
    autocomplete_fields = ['employee', 'assigned_to']
    readonly_fields = ('submit_date', 'update_date')

    fieldsets = (
        (None, {
            'fields': (
                'employee', 'subject', 'category', 'sub_category',
                'description', 'scheduled_date', 'priority', 'department',
                'status', 'assigned_to', 'response_time', 'resolution_time', 'time_closed'
            )
        }),
        ('Timestamps', {
            'fields': ('submit_date', 'update_date'),
        }),
    )