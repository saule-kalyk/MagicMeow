document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load saved settings
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        document.getElementById('theme-select').value = savedTheme;

        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications !== null) {
            document.getElementById('notifications-toggle').checked = savedNotifications === 'true';
        }

        const savedLanguage = localStorage.getItem('language') || 'en';
        document.getElementById('language-select').value = savedLanguage;

        // Sidebar toggle
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.toggle-btn');
        const plusIcon = document.querySelector('.plus-icon');

        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            plusIcon.style.display = sidebar.classList.contains('open') ? 'none' : 'block';
        });

        // Days counter
        const response = await fetch('/api/user_info', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.days) {
            const daysEl = document.getElementById('days');
            if (daysEl) daysEl.textContent = `day ${data.days}`;
        }
    } catch (error) {
        console.error('Error loading settings or initializing sidebar:', error);
    }
});

function applyTheme(theme) {
    try {
        document.body.classList.remove('light', 'dark', 'dark-blue', 'dark-purple');
        document.body.classList.add(theme);
    } catch (error) {
        console.error('Error applying theme:', error);
    }
}

function saveSettings() {
    try {
        const theme = document.getElementById('theme-select').value;
        const notifications = document.getElementById('notifications-toggle').checked;
        const language = document.getElementById('language-select').value;

        localStorage.setItem('theme', theme);
        localStorage.setItem('notifications', notifications.toString());
        localStorage.setItem('language', language);

        applyTheme(theme);

        fetch('/update_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme, notifications, language })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) console.error('Failed to save settings to backend:', data.error);
        })
        .catch(error => console.error('Error saving settings to backend:', error));

        let themeDisplayName = theme === 'light' ? 'Light Mode' :
                               theme === 'dark' ? 'Dark Mode (Gray)' :
                               theme === 'dark-blue' ? 'Dark Mode (Blue)' :
                               'Dark Mode (Purple)';
        alert('Settings saved successfully! 🎉\nTheme: ' + themeDisplayName +
              '\nNotifications: ' + (notifications ? 'Enabled' : 'Disabled') +
              '\nLanguage: ' + (language === 'en' ? 'English' : 'Chinese (Coming Soon)'));
    } catch (error) {
        console.error('Error in saveSettings:', error);
        alert('Failed to save settings. Please try again.');
    }
}