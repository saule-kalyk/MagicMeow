console.log("About Us page loaded!");

document.addEventListener("DOMContentLoaded", async function () {
    // Sidebar
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