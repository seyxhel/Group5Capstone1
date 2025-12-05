// ==================== Form State Management ====================
let formState = {
    firstName: '',
    lastName: '',
    companyId: '',
    department: '',
    email: '',
    password: '',
    password2: '',
    profilePicture: false,
    termsAgreed: false
};

// ==================== Modal Management ====================
let currentModalStep = 'privacy';

function showModal(step = 'privacy') {
    currentModalStep = step;
    updateModalContent();
    document.getElementById('policyModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('policyModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentModalStep = 'privacy';
}

function updateModalContent() {
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const backBtn = document.getElementById('backBtn');
    const agreeBtn = document.getElementById('agreeBtn');
    const privacyStep = document.getElementById('privacyStep');
    const termsStep = document.getElementById('termsStep');

    if (currentModalStep === 'privacy') {
        modalTitle.textContent = 'Privacy Policy';
        modalContent.innerHTML = getPrivacyPolicyContent();
        backBtn.style.display = 'none';
        agreeBtn.textContent = '❯ Next';
        privacyStep.classList.add('active');
        termsStep.classList.remove('active');
    } else {
        modalTitle.textContent = 'Terms and Conditions';
        modalContent.innerHTML = getTermsConditionsContent();
        backBtn.style.display = 'inline-block';
        agreeBtn.innerHTML = '<i class="fas fa-check"></i>&nbsp;I Agree';
        privacyStep.classList.remove('active');
        termsStep.classList.add('active');
    }

    // Scroll to top of modal
    modalContent.scrollTop = 0;
}

function handleAgree() {
    if (currentModalStep === 'privacy') {
        currentModalStep = 'terms';
        updateModalContent();
        document.getElementById('stepIndicator').style.display = 'flex';
    } else {
        // User has agreed to both
        document.getElementById('termsCheckbox').checked = true;
        formState.termsAgreed = true;
        validateForm();
        closeModal();
    }
}

function goBackStep() {
    if (currentModalStep === 'terms') {
        currentModalStep = 'privacy';
        updateModalContent();
    }
}

// ==================== Password Visibility Toggle ====================
function togglePasswordVisibility(toggleIcon, inputId) {
    const input = document.getElementById(inputId);
    const icon = toggleIcon.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    }
}

// ==================== Password Matching Validation ====================
function validatePasswordMatch() {
    const passwordInput = document.querySelector('input[name="password"]');
    const password2Input = document.querySelector('input[name="password2"]');
    const password2Fieldset = password2Input?.parentElement?.parentElement;

    if (!passwordInput || !password2Input || !password2Fieldset) return;

    const password = passwordInput.value;
    const password2 = password2Input.value;

    // Remove any existing error message
    const existingError = password2Fieldset.querySelector('.password-match-error');
    if (existingError) {
        existingError.remove();
    }

    // Check if passwords match (only if both fields have content)
    if (password && password2 && password !== password2) {
        const errorMsg = document.createElement('span');
        errorMsg.className = 'error-msg password-match-error';
        errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i>&nbsp;Passwords do not match';
        password2Fieldset.appendChild(errorMsg);
        password2Input.style.borderColor = 'var(--warning-text)';
        return false;
    } else if (password && password2 && password === password2) {
        password2Input.style.borderColor = 'var(--border-color)';
        return true;
    }

    password2Input.style.borderColor = 'var(--border-color)';
    return true;
}

// ==================== Form Validation ====================
function validateForm() {
    const submitBtn = document.querySelector('.submit-button');
    const lastNameInput = document.querySelector('input[name="last_name"]');
    const firstNameInput = document.querySelector('input[name="first_name"]');
    const companyIdInput = document.querySelector('input[name="company_id"]');
    const departmentSelect = document.querySelector('select[name="department"]');
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const password2Input = document.querySelector('input[name="password2"]');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const fileInput = document.querySelector('input[type="file"]');

    // Update form state
    formState.firstName = firstNameInput?.value?.trim() || '';
    formState.lastName = lastNameInput?.value?.trim() || '';
    formState.companyId = companyIdInput?.value?.trim() || '';
    formState.department = departmentSelect?.value?.trim() || '';
    formState.email = emailInput?.value?.trim() || '';
    formState.password = passwordInput?.value || '';
    formState.password2 = password2Input?.value || '';
    formState.termsAgreed = termsCheckbox?.checked || false;
    formState.profilePicture = fileInput?.files?.length > 0 || false;

    // Check if password and confirm password match
    const passwordsMatch = validatePasswordMatch();

    // Determine if form is valid
    const isFormValid =
        formState.firstName &&
        formState.lastName &&
        formState.companyId &&
        formState.companyId.length === 4 &&
        formState.department &&
        formState.email &&
        formState.password &&
        formState.password2 &&
        passwordsMatch &&
        formState.profilePicture &&
        formState.termsAgreed;

    // Enable/disable submit button
    if (isFormValid) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    }
}

// Show password toggle on input
document.addEventListener('DOMContentLoaded', function() {
    // Initial form validation
    validateForm();

    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        // Find the password-toggle span within the parent container
        const container = input.parentElement;
        let toggle = container.querySelector('.password-toggle');
        
        // Safety check: if multiple toggles exist, remove duplicates and keep only one
        const allToggles = container.querySelectorAll('.password-toggle');
        if (allToggles.length > 1) {
            for (let i = 1; i < allToggles.length; i++) {
                allToggles[i].remove();
            }
            toggle = container.querySelector('.password-toggle');
        }
        
        if (toggle) {
            // Show/hide toggle based on input value
            toggle.style.visibility = input.value ? 'visible' : 'hidden';
            
            // Add input listener to show/hide toggle
            input.addEventListener('input', function() {
                toggle.style.visibility = this.value ? 'visible' : 'hidden';
                validateForm();
            });
        }
    });

    // Add listeners to all required fields
    const requiredInputs = document.querySelectorAll(
        'input[name="first_name"], input[name="last_name"], input[name="company_id"], ' +
        'input[name="email"], select[name="department"], input[type="file"]'
    );

    requiredInputs.forEach(input => {
        input.addEventListener('change', validateForm);
        input.addEventListener('input', validateForm);
    });

    // Add listener to terms checkbox
    const termsCheckbox = document.getElementById('termsCheckbox');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', validateForm);
    }
});

// ==================== File Upload Preview ====================
const fileInput = document.querySelector('input[type="file"]');
const fileLabel = document.querySelector('.file-upload-label');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');

if (fileInput) {
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Update button text and color
            fileLabel.innerHTML = '<i class="fas fa-check-circle"></i>&nbsp;&nbsp;' + file.name;
            fileLabel.classList.add('has-file');

            // Show image preview
            const reader = new FileReader();
            reader.onload = function(event) {
                previewImg.src = event.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            fileLabel.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>&nbsp;&nbsp;Choose File';
            fileLabel.classList.remove('has-file');
            imagePreview.style.display = 'none';
        }
        validateForm();
    });
}

// ==================== Company ID Validation ====================
const companyIdInput = document.querySelector('input[name="company_id"]');
if (companyIdInput) {
    companyIdInput.addEventListener('input', function(e) {
        // Only allow digits, max 4 characters
        this.value = this.value.replace(/[^\d]/g, '').slice(0, 4);
        validateForm();
    });

    companyIdInput.addEventListener('paste', function(e) {
        const pasted = e.clipboardData.getData('text');
        if (!/^\d+$/.test(pasted)) {
            e.preventDefault();
        }
    });
}

// ==================== Form Submission ====================
const registrationForm = document.querySelector('form');
if (registrationForm && companyIdInput) {
    registrationForm.addEventListener('submit', function(e) {
        // Validate passwords match one more time before submission
        if (!validatePasswordMatch()) {
            e.preventDefault();
            return;
        }

        // Prepend "MA" to company_id if it doesn't already have it
        if (companyIdInput.value && companyIdInput.value.trim() !== '') {
            if (!companyIdInput.value.startsWith('MA')) {
                companyIdInput.value = 'MA' + companyIdInput.value;
            }
        }
    });
}

// ==================== Modal Close on ESC ====================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ==================== Modal Overlay Click Close ====================
document.getElementById('policyModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// ==================== Privacy Policy & Terms Content ====================
function getPrivacyPolicyContent() {
    return `
        <h3>Privacy Policy</h3>
        <p>This Privacy Policy outlines how the SmartSupport: AI-Powered Helpdesk Ticketing System collects, uses, stores, and protects the personal data of users who access and use the System.</p>

        <h3>1. Information We Collect</h3>
        <p>When you use the System, we may collect the following types of information:</p>
        <ul>
            <li><strong>Personal Information:</strong> Name, email address, phone number, company affiliation, and job title.</li>
            <li><strong>Account Information:</strong> Username, password, security questions, and account preferences.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with the System, including tickets created, viewed, and modified.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, and log data.</li>
            <li><strong>Communication Data:</strong> Messages, attachments, and feedback provided through the System.</li>
        </ul>

        <h3>2. How We Use Your Information</h3>
        <p>We use the collected information for the following purposes:</p>
        <ul>
            <li>To create and maintain your user account</li>
            <li>To provide and improve the System's functionality</li>
            <li>To process and respond to support tickets</li>
            <li>To communicate with you about system updates and changes</li>
            <li>To analyze usage patterns and improve user experience</li>
            <li>To ensure system security and prevent fraud</li>
        </ul>

        <h3>3. Data Security</h3>
        <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and access controls.</p>

        <h3>4. Your Rights</h3>
        <p>You have the right to access, correct, or delete your personal information. To exercise these rights, please contact us through the System or at the provided contact information.</p>

        <p style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.9rem; color: #999;">
            <i class="fas fa-scroll"></i>&nbsp;Last updated: December 2024
        </p>
    `;
}

function getTermsConditionsContent() {
    return `
        <h3>Terms and Conditions</h3>
        <p>These Terms and Conditions govern your use of the SmartSupport: AI-Powered Helpdesk Ticketing System. By accessing and using the System, you accept and agree to be bound by the terms and provision of this agreement.</p>

        <h3>1. Use License</h3>
        <p>Permission is granted to temporarily download one copy of the materials (information or software) on the SmartSupport System for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
        <ul>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to decompile or reverse engineer any software contained on the System</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
        </ul>

        <h3>2. Disclaimer</h3>
        <p>The materials on the SmartSupport System are provided on an 'as is' basis. The System makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

        <h3>3. Limitations</h3>
        <p>In no event shall the SmartSupport System or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the System, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.</p>

        <h3>4. Accuracy of Materials</h3>
        <p>The materials appearing on the SmartSupport System could include technical, typographical, or photographic errors. The System does not warrant that any of the materials on its System are accurate, complete, or current. The System may make changes to the materials contained on its System at any time without notice.</p>

        <h3>5. User Conduct</h3>
        <p>Users agree not to engage in any conduct that restricts or inhibits anyone's use or enjoyment of the System, or which, as determined by the System, may harm the System or users of the System, or expose them to liability.</p>

        <p style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.9rem; color: #999;">
            <i class="fas fa-gavel"></i>&nbsp;Last updated: December 2024
        </p>
    `;
}
