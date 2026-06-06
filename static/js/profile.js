// Sidebar toggle
document.addEventListener("DOMContentLoaded", async function () {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");
    const plusIcon = document.querySelector(".plus-icon");

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
        plusIcon.style.display = sidebar.classList.contains("open") ? "none" : "block";
    });

    // Days counter
    try {
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
        console.error('Error fetching user info:', error);
    }
});

// Handle avatar upload
document.getElementById('avatar-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';

        const formData = new FormData();
        formData.append('avatar', file);

        fetch('/update_avatar', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload New Avatar';

            if (data.success) {
                document.querySelector('.profile-avatar').src = data.avatar_url;
                document.querySelector('.sidebar .avatar').src = data.avatar_url;
                alert('Avatar updated successfully!');
            } else {
                alert('Failed to update avatar: ' + data.error);
            }
        })
        .catch(error => {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload New Avatar';
            console.error('Error:', error);
            alert('An error occurred while updating the avatar.');
        });
    }
});

// Handle username change
function changeUsername() {
    const newUsername = document.getElementById('username-input').value.trim();
    if (!newUsername) {
        alert('Username cannot be empty!');
        return;
    }

    const changeBtn = document.querySelector('.change-btn');
    changeBtn.disabled = true;
    changeBtn.textContent = 'Changing...';

    fetch('/update_username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
    })
    .then(response => response.json())
    .then(data => {
        changeBtn.disabled = false;
        changeBtn.textContent = 'Change';

        if (data.success) {
            document.querySelector('.sidebar .user').textContent = newUsername;
            document.getElementById('username-input').value = newUsername;
            alert('Username updated successfully!');
        } else {
            alert('Failed to update username: ' + data.error);
        }
    })
    .catch(error => {
        changeBtn.disabled = false;
        changeBtn.textContent = 'Change';
        console.error('Error:', error);
        alert('An error occurred while updating the username.');
    });
}