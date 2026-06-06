const requirements = [
    { id: 'uppercase', regex: /[A-Z]/ },
    { id: 'lowercase', regex: /[a-z]/ },
    { id: 'number', regex: /[0-9]/ },
    { id: 'special', regex: /[!@#$%^&*]/ },
    { id: 'length', regex: /.{8,}/ }
];

document.getElementById('password').addEventListener('input', function() {
    const password = this.value;
    const tooltip = document.getElementById('tooltip');

    let allValid = true;
    requirements.forEach(req => {
        const li = document.getElementById(req.id);
        const isValid = req.regex.test(password);
        if (!isValid) allValid = false;
        li.style.color = isValid ? 'green' : 'red';
        li.style.setProperty('--before-bg', isValid ? 'green' : '#f88');
    });

    tooltip.style.display = allValid ? 'none' : 'block';
});

document.getElementById('confirm_password').addEventListener('focus', function() {
    document.getElementById('tooltip').style.display = 'none';
});

document.getElementById('signup-form').addEventListener('submit', function(e) {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const errorMessage = document.getElementById('error-message');
    const validationRules = [
        { regex: /[A-Z]/, message: 'Password must include at least one uppercase letter.' },
        { regex: /[a-z]/, message: 'Password must include at least one lowercase letter.' },
        { regex: /[0-9]/, message: 'Password must include at least one number.' },
        { regex: /[!@#$%^&*]/, message: 'Password must include at least one special character.' },
        { regex: /.{8,}/, message: 'Password must be at least 8 characters long.' }
    ];

    for (const req of validationRules) {
        if (!req.regex.test(password)) {
            e.preventDefault();
            errorMessage.textContent = req.message;
            return;
        }
    }

    if (password !== confirmPassword) {
        e.preventDefault();
        errorMessage.textContent = 'Passwords do not match.';
        return;
    }
});

document.addEventListener('click', function(e) {
    const passwordField = document.getElementById('password');
    const tooltip = document.getElementById('tooltip');
    if (!passwordField.contains(e.target)) {
        tooltip.style.display = 'none';
    }
});