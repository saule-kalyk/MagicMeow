document.addEventListener("DOMContentLoaded", function () {

    // ── SIDEBAR ──
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");
    const plusIcon = document.querySelector(".plus-icon");

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
        plusIcon.style.display = sidebar.classList.contains("open") ? "none" : "block";
    });

    // ── ELEMENTS ──
    const illustration = document.getElementById('illustration');
    const folderBox = document.getElementById('folder-box');
    const createPanel = document.getElementById('createPanel');
    const editPanel = document.getElementById('editPanel');
    const folderPlansView = document.getElementById('folderPlansView');
    const planPopup = document.getElementById('planPopup');
    const plansList = document.getElementById('plansList');
    const currentFolderNameEl = document.getElementById('currentFolderName');
    const folderNameInput = document.getElementById('folderNameInput');
    const folderNameInputEdit = document.getElementById('folderNameInputEdit');
    const addFolderBtn = document.getElementById('addFolder');
    const createBtn = document.getElementById('createBtn');
    const backBtnCreate = document.getElementById('backBtnCreate');
    const backBtnEdit = document.getElementById('backBtnEdit');
    const renameBtn = document.getElementById('renameBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const backToFolders = document.getElementById('backToFolders');

    let currentFolderId = null;
    let currentFolderName = null;
    let allPlans = [];

    // ── HELPERS: показать/скрыть экраны ──
    function showScreen(screen) {
    illustration.style.display = 'none';
    folderBox.style.display = 'none';
    folderPlansView.style.display = 'none';
    planPopup.style.display = 'none';
    createPanel.style.display = 'none';
    editPanel.style.display = 'none';
    if (screen === 'folders') {
        folderBox.style.display = 'flex';
    } else if (screen === 'empty') {
        illustration.style.display = 'flex';
    } else if (screen === 'plans') {
        folderPlansView.style.display = 'block';
    } else if (screen === 'popup') {
        planPopup.style.display = 'block';
    }
}

    // ── FETCH PLANS ──
    async function fetchPlans() {
        try {
            const res = await fetch('/api/get_plans');
            const result = await res.json();
            if (res.ok && result.success) allPlans = result.plans || [];
        } catch (e) { console.error('Error fetching plans:', e); }
    }

    // ── FETCH FOLDERS ──
    async function fetchFolders() {
        try {
            const res = await fetch('/api/get_folders');
            const result = await res.json();
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (!res.ok || !result.success) return;

            const folders = result.folders || [];
            folderBox.innerHTML = '';

            if (folders.length === 0) {
                showScreen('empty');
                return;
            }

            showScreen('folders');
            folders.forEach(folder => renderFolderItem(folder));
        } catch (e) { console.error('Error fetching folders:', e); }
    }

    // ── РЕНДЕР ОДНОЙ ПАПКИ ──
    function renderFolderItem(folder) {
        const el = document.createElement('div');
        el.classList.add('folder-box');
        el.setAttribute('data-folder-id', folder.id);
        el.innerHTML = `
            <div class="folder-prof">
                <img src="/static/images/icon-folder.png" alt="">
                <div class="folder-name">${folder.name}</div>
            </div>
            <img src="/static/images/edit.png" alt="" class="edit-folder-btn" style="cursor:pointer;">
        `;

        // Клик на весь box (кроме edit) — открыть планы
        el.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit-folder-btn')) return;
            await fetchPlans();
            showFolderPlans(folder.name);
        });

        // Клик на edit — открыть панель редактирования
        el.querySelector('.edit-folder-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            currentFolderId = folder.id;
            folderNameInputEdit.value = folder.name;
            editPanel.style.display = 'block';
            folderBox.style.opacity = '60%';
        });

        folderBox.appendChild(el);
    }

    // ── ПОКАЗАТЬ ПЛАНЫ ПАПКИ ──
    function showFolderPlans(folderName) {
        currentFolderName = folderName;
        currentFolderNameEl.textContent = folderName;
        showScreen('plans');

        const folderPlans = allPlans.filter(p => p.folder === folderName);
        plansList.innerHTML = '';

        if (folderPlans.length === 0) {
            plansList.innerHTML = '<p class="empty-plans">No plans in this folder yet.</p>';
            return;
        }

        const colorMap = {
            'top-left': '#FED981',
            'top-right': '#EE7981',
            'bottom-left': '#AFD2BC',
            'bottom-right': '#B3B8F0'
        };

        folderPlans.forEach(plan => {
            const item = document.createElement('div');
            item.classList.add('plan-item');
            const dateText = plan.date_start
                ? (plan.date_end && plan.date_end !== plan.date_start
                    ? `${plan.date_start} – ${plan.date_end}`
                    : plan.date_start)
                : 'No date';
            item.innerHTML = `
                <div class="plan-item-dot" style="background:${colorMap[plan.quadrant] || '#EE7981'};"></div>
                <div class="plan-item-name">${plan.plan_name}</div>
                <div class="plan-item-date">${dateText}</div>
            `;
            item.addEventListener('click', () => showPlanPopup(plan));
            plansList.appendChild(item);
        });
    }

    // ── ПОКАЗАТЬ POPUP ПЛАНА ──
    function showPlanPopup(plan) {
        showScreen('popup');

        planPopup.querySelector('.plan-name-plan').textContent = plan.plan_name || 'Untitled';
        planPopup.querySelector('.folder-name-plan').textContent = plan.folder || 'No folder';

        // Date
        const dateRangeEl = planPopup.querySelector('.date-range');
        const dateProgressBar = planPopup.querySelector('.date-plan .progress-fill');
        if (plan.date_start && plan.date_end && plan.date_start !== plan.date_end) {
            dateRangeEl.textContent = `${plan.date_start} – ${plan.date_end}`;
            const start = new Date(plan.date_start);
            const end = new Date(plan.date_end);
            const now = new Date();
            const total = (end - start) / (1000 * 60 * 60 * 24);
            const elapsed = (now - start) / (1000 * 60 * 60 * 24);
            dateProgressBar.style.width = `${Math.min(Math.max((elapsed / total) * 100, 0), 100)}%`;
        } else if (plan.date_start) {
            dateRangeEl.textContent = plan.date_start;
            dateProgressBar.style.width = '100%';
        } else {
            dateRangeEl.textContent = 'No date';
            dateProgressBar.style.width = '0%';
        }

        // Time
        const timeRangeEl = planPopup.querySelector('.time-range');
        const timeProgressBar = planPopup.querySelector('.time-plan .progress-fill');
        const timeLeftEl = planPopup.querySelector('.time-left-label');
        if (plan.time_start && plan.time_end) {
            timeRangeEl.textContent = `${plan.time_start} – ${plan.time_end}`;
            const now = new Date();
            const startDT = new Date(`${plan.date_start}T${plan.time_start}:00`);
            const endDT = new Date(`${plan.date_end || plan.date_start}T${plan.time_end}:00`);
            if (endDT > now && now >= startDT) {
                const total = (endDT - startDT) / (1000 * 60);
                const elapsed = (now - startDT) / (1000 * 60);
                timeProgressBar.style.width = `${Math.min((elapsed / total) * 100, 100)}%`;
                const diff = endDT - now;
                timeLeftEl.textContent = `${Math.floor(diff / (1000 * 60 * 60))}h ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m`;
            } else if (endDT <= now) {
                timeProgressBar.style.width = '100%';
                timeLeftEl.textContent = "Time's up!";
            } else {
                timeProgressBar.style.width = '0%';
                timeLeftEl.textContent = 'Not started';
            }
        } else {
            timeRangeEl.textContent = 'No time';
            timeProgressBar.style.width = '0%';
            timeLeftEl.textContent = '';
        }

        // Reminder
        planPopup.querySelector('#reminderToggle').checked = plan.reminder?.enabled || false;

        // Repeat
        const repeatEl = planPopup.querySelector('.repeat-plan');
        const weekText = planPopup.querySelector('.week-text');
        const daysText = planPopup.querySelector('.days-text');
        if (plan.repeat?.type) {
            repeatEl.style.display = 'flex';
            weekText.textContent = `${plan.repeat.type} (${plan.repeat.count} times)`;
            daysText.textContent = plan.repeat.days?.length > 0
                ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                    .filter((_, i) => plan.repeat.days.includes(i + 1)).join(', ')
                : '';
        } else {
            repeatEl.style.display = 'none';
        }

        // Notes
        planPopup.querySelector('.notes-text').value = plan.notes || 'No notes';

        // Quadrant
        const highlightOval = planPopup.querySelector('.highlight-oval-plan');
        const quadrantMap = {
            'top-left': { top: '40px', left: '40px', bottom: '', right: '' },
            'top-right': { top: '40px', right: '40px', bottom: '', left: '' },
            'bottom-left': { bottom: '10px', left: '40px', top: '', right: '' },
            'bottom-right': { bottom: '10px', right: '40px', top: '', left: '' }
        };
        const colorMap = {
            'top-left': '#FED981', 'top-right': '#EE7981',
            'bottom-left': '#AFD2BC', 'bottom-right': '#B3B8F0'
        };
        const q = plan.quadrant || 'top-right';
        const pos = quadrantMap[q];
        highlightOval.style.top = pos.top;
        highlightOval.style.bottom = pos.bottom;
        highlightOval.style.left = pos.left;
        highlightOval.style.right = pos.right;
        highlightOval.style.borderColor = colorMap[q];
        highlightOval.style.display = 'block';

        // Back arrow
        planPopup.querySelector('.back-arrow-plan').onclick = () => {
            showFolderPlans(currentFolderName);
        };

        // Edit
        planPopup.querySelector('.edit-btn-plan').onclick = () => {
            window.location.href = `/addPlan?editPlanId=${plan.id}&returnTo=/viewMonthly/folder`;
        };

        // Delete
        planPopup.querySelector('.delete-btn-plan').onclick = async () => {
            if (!confirm('Are you sure you want to delete this plan?')) return;
            try {
                const res = await fetch('/api/delete_plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan_id: plan.id })
                });
                const result = await res.json();
                if (res.ok && result.success) {
                    await fetchPlans();
                    showFolderPlans(currentFolderName);
                } else {
                    alert(result.error || 'Failed to delete plan.');
                }
            } catch (e) { alert('Error deleting plan.'); }
        };
    }

    // ── НАЗАД К ПАПКАМ ──
    backToFolders.addEventListener('click', () => {
        fetchFolders();
    });

    // ── CREATE FOLDER ──
    addFolderBtn.addEventListener('click', () => {
        folderNameInput.value = '';
        createPanel.style.display = 'block';
    });

    backBtnCreate.addEventListener('click', () => {
        createPanel.style.display = 'none';
    });

    createBtn.addEventListener('click', async () => {
        const name = folderNameInput.value.trim();
        if (!name) { alert('Please enter a folder name.'); return; }
        try {
            const res = await fetch('/api/create_folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                createPanel.style.display = 'none';
                fetchFolders();
            } else {
                alert(result.error || 'Failed to create folder.');
            }
        } catch (e) { console.error('Error creating folder:', e); }
    });

    // ── EDIT FOLDER ──
    backBtnEdit.addEventListener('click', () => {
        editPanel.style.display = 'none';
        folderBox.style.opacity = '100%';
    });

    renameBtn.addEventListener('click', async () => {
        const newName = folderNameInputEdit.value.trim();
        if (!newName || !currentFolderId) { alert('Please enter a folder name.'); return; }
        try {
            const res = await fetch('/api/rename_folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder_id: currentFolderId, new_name: newName })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                editPanel.style.display = 'none';
                folderBox.style.opacity = '100%';
                fetchFolders();
            } else {
                alert(result.error || 'Failed to rename folder.');
            }
        } catch (e) { console.error('Error renaming folder:', e); }
    });

    deleteBtn.addEventListener('click', async () => {
        if (!currentFolderId || !confirm('Are you sure you want to delete this folder?')) return;
        try {
            const res = await fetch('/api/delete_folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder_id: currentFolderId })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                editPanel.style.display = 'none';
                folderBox.style.opacity = '100%';
                fetchFolders();
            } else {
                alert(result.error || 'Failed to delete folder.');
            }
        } catch (e) { console.error('Error deleting folder:', e); }
    });

    // ── CHAT ──
    const inputEl = document.getElementById("Input");
    const sendBtn = document.getElementById("send-btn");
    const messagesContainer = document.getElementById("Block__Messages");
    const bunnyBtn = document.getElementById("bunny");
    const reminderPanel = document.getElementById("reminderPanel");
    const chatHistory = document.getElementById("chatHistory");
    const newChatBtn = document.getElementById("newChatBtn");
    let userAvatar = '/static/images/user.png';

    async function fetchUserInfo() {
        try {
            const res = await fetch('/api/user_info');
            const data = await res.json();
            if (data.avatar) userAvatar = data.avatar;
            if (data.days) {
                const daysEl = document.getElementById('days');
                if (daysEl) daysEl.textContent = `day ${data.days}`;
            }
        } catch (e) { console.error('Error fetching user info:', e); }
    }

    async function fetchCurrentSession() {
        try {
            const res = await fetch('/api/current_session');
            const data = await res.json();
            messagesContainer.innerHTML = '';
            data.messages.forEach(msg => appendMessage(msg.role, msg.content));
            if (data.messages.length > 0) reminderPanel.style.display = "none";
        } catch (e) { console.error('Error fetching session:', e); }
    }

    function appendMessage(role, content) {
        const div = document.createElement('div');
        div.classList.add('Message__Element', role === 'user' ? 'User' : 'Bot');
        const img = document.createElement('img');
        img.src = role === 'user' ? userAvatar : '/static/images/bunny.png';
        const msg = document.createElement('div');
        msg.classList.add('Message');
        msg.textContent = content;
        if (role === 'user') { div.appendChild(msg); div.appendChild(img); }
        else { div.appendChild(img); div.appendChild(msg); }
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage() {
        const message = inputEl.value.trim();
        if (!message) return;
        appendMessage('user', message);
        inputEl.value = '';
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, tone: 'cute' })
            });
            const data = await res.json();
            appendMessage('assistant', data.reply || 'Sorry, something went wrong!');
        } catch (e) { appendMessage('assistant', 'Error: Could not send message.'); }
    }

    async function startNewChat() {
        try {
            const res = await fetch('/api/chat/new', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            const data = await res.json();
            if (!data.session_id) return;
            localStorage.setItem('chatSessionId', data.session_id);
            messagesContainer.innerHTML = '';
            reminderPanel.style.display = "none";
            await loadChatHistory();
        } catch (e) { console.error('Error starting new chat:', e); }
    }

    async function deleteSession(sessionId) {
        if (!confirm('Delete this chat session?')) return;
        try {
            const res = await fetch(`/api/chat/delete/${sessionId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
            const data = await res.json();
            if (data.success) {
                if (localStorage.getItem('chatSessionId') === sessionId) {
                    localStorage.removeItem('chatSessionId');
                    messagesContainer.innerHTML = '';
                }
                await loadChatHistory();
            }
        } catch (e) { console.error('Error deleting session:', e); }
    }

    async function loadChatHistory() {
        try {
            const res = await fetch('/api/chat_history', { headers: { 'Content-Type': 'application/json' } });
            const data = await res.json();
            chatHistory.innerHTML = '';
            const byDate = {};
            (data.sessions || []).forEach(s => {
                const ts = s.latest_update || s.timestamp;
                const key = new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                if (!byDate[key]) byDate[key] = [];
                byDate[key].push({ ...s, latest_update: ts });
            });
            Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a)).forEach(dateKey => {
                const header = document.createElement('div');
                header.className = 'date-header';
                header.innerHTML = `<p style="font-weight:bold;margin:10px 0 5px;">${dateKey}</p>`;
                chatHistory.appendChild(header);
                byDate[dateKey].forEach(s => {
                    const el = document.createElement('div');
                    el.className = 'chat-session';
                    const time = new Date(s.latest_update).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    el.innerHTML = `
                        <p style="display:inline-block;width:calc(100% - 80px);cursor:pointer;">
                            ${s.session_title}${s.is_current ? ' (Current)' : ''}
                            <span style="float:right;color:gray;font-size:12px;">${time}</span>
                        </p>
                        <button class="delete-session-btn">Delete</button>
                    `;
                    el.querySelector('p').addEventListener('click', () => loadSessionMessages(s.session_id));
                    el.querySelector('.delete-session-btn').addEventListener('click', () => deleteSession(s.session_id));
                    chatHistory.appendChild(el);
                });
            });
        } catch (e) { console.error('Error loading chat history:', e); }
    }

    async function loadSessionMessages(sessionId) {
        try {
            const res = await fetch(`/api/chat_history/${sessionId}`, { headers: { 'Content-Type': 'application/json' } });
            const data = await res.json();
            messagesContainer.innerHTML = '';
            data.messages.forEach(msg => appendMessage(msg.role, msg.content));
            reminderPanel.style.display = "none";
            localStorage.setItem('chatSessionId', sessionId);
            await loadChatHistory();
        } catch (e) { console.error('Error loading session messages:', e); }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click(); });
    bunnyBtn.addEventListener("click", () => {
        reminderPanel.style.display = reminderPanel.style.display === "none" ? "block" : "none";
        if (reminderPanel.style.display === "block") loadChatHistory();
    });
    newChatBtn.addEventListener("click", startNewChat);

    fetchUserInfo().then(fetchCurrentSession);
    fetchFolders();
});