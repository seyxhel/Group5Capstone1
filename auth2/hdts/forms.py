# auth/hdts/forms.py

from django import forms
from django.core.exceptions import ValidationError
from users.models import User, SUFFIX_CHOICES, DEPARTMENT_CHOICES

class UserRegistrationForm(forms.ModelForm):
    # Define choices based on the User model
    suffix = forms.ChoiceField(
        choices=[('', 'Select Suffix')] + SUFFIX_CHOICES, 
        required=False
    )
    department = forms.ChoiceField(
        choices=[('', 'Select Department')] + DEPARTMENT_CHOICES,
        required=True
    )
    
    # Password fields
    password = forms.CharField(
        widget=forms.PasswordInput, 
        required=True
    )
    password2 = forms.CharField(
        label='Confirm Password', 
        widget=forms.PasswordInput, 
        required=True
    )

    class Meta:
        model = User
        fields = [
            'last_name', 
            'first_name', 
            'middle_name', 
            'suffix',
            'company_id',
            'department', 
            'profile_picture', 
            'email',
        ]
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Set all fields as required, except those specified
        self.fields['last_name'].required = True
        self.fields['first_name'].required = True
        self.fields['department'].required = True
        self.fields['email'].required = True
        self.fields['profile_picture'].required = True
        
        # Make company_id optional; your model manager will auto-generate it if blank
        self.fields['company_id'].required = False
        self.fields['company_id'].help_text = "Leave blank to auto-generate (MAXXXX)."
        
        # Make middle_name and suffix optional
        self.fields['middle_name'].required = False
        self.fields['suffix'].required = False

    def clean_email(self):
        """Validate that the email is unique."""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise ValidationError("An account with this email already exists.")
        return email

    def clean_password2(self):
        """Validate that the two password fields match."""
        password = self.cleaned_data.get('password')
        password2 = self.cleaned_data.get('password2')
        if password and password2 and password != password2:
            raise ValidationError("Passwords do not match.")
        return password2

    def save(self, commit=True):
        """
        Save method to use the custom user manager's create_user method.
        """
        user = User.objects.create_user(
            email=self.cleaned_data['email'],
            password=self.cleaned_data['password'],
            first_name=self.cleaned_data['first_name'],
            last_name=self.cleaned_data['last_name'],
            middle_name=self.cleaned_data.get('middle_name'),
            suffix=self.cleaned_data.get('suffix'),
            company_id=self.cleaned_data.get('company_id'), # Manager handles if empty
            department=self.cleaned_data['department'],
            profile_picture=self.cleaned_data.get('profile_picture')
        )
        return user