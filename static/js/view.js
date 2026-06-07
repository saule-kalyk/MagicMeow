document.addEventListener("DOMContentLoaded", function () {

    // ── SIDEBAR ──
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");
    const plusIcon = document.querySelector(".plus-icon");

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
        plusIcon.style.display = sidebar.classList.contains("open") ? "none" : "block";
    });

    // ── ОБЩИЕ ДАННЫЕ ──
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // ── MONTHLY ──
    let currentDate = new Date();
    let monthlyInitialized = false;

    // ── WEEKLY ──
    let currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - ((currentWeekStart.getDay() + 6) % 7));
    let weeklyInitialized = false;

    // ── DAILY ──
    let currentDay = new Date();
    let dailyInitialized = false;

    // ── TABS ──
    const tabs = document.querySelectorAll(".tab");
    const panels = {
        monthly: document.getElementById("view-monthly"),
        weekly: document.getElementById("view-weekly"),
        daily: document.getElementById("view-daily"),
    };

    const urlParams = new URLSearchParams(window.location.search);
    let activeTab = urlParams.get("tab") || "monthly";

    function switchTab(tabName) {
        activeTab = tabName;

        // Переключаем панели
        Object.keys(panels).forEach(key => {
            panels[key].style.display = key === tabName ? "flex" : "none";
        });

        // Переключаем стиль табов
        tabs.forEach(tab => {
            const isActive = tab.dataset.tab === tabName;
            tab.classList.toggle("active", isActive);
        });

        // Инициализируем логику нужной вкладки
        if (tabName === "monthly") initMonthly();
        if (tabName === "weekly") initWeekly();
        if (tabName === "daily") initDaily();
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    });

    switchTab(activeTab);

    // ── PLAN POPUP (общий) ──
    const planPopup = document.getElementById("planPopup");

    function showPlanPopup(plan) {
        planPopup.style.display = "block";
        planPopup.dataset.planId = plan.id;

        document.querySelector(".plan-name-plan").textContent = plan.plan_name || "Untitled Plan";
        document.querySelector(".folder-name-plan").textContent = plan.folder || "No Folder";

        // Date
        const dateRangeEl = document.querySelector(".date-range");
        const dateProgressBar = document.querySelector(".date-plan .progress-fill");
        if (plan.date_start && plan.date_end && plan.date_start !== plan.date_end) {
            dateRangeEl.textContent = `${plan.date_start} – ${plan.date_end}`;
            const startDate = new Date(plan.date_start);
            const endDate = new Date(plan.date_end);
            const now = new Date();
            const total = (endDate - startDate) / (1000 * 60 * 60 * 24);
            const elapsed = (now - startDate) / (1000 * 60 * 60 * 24);
            dateProgressBar.style.width = `${Math.min(Math.max((elapsed / total) * 100, 0), 100)}%`;
        } else if (plan.date_start) {
            dateRangeEl.textContent = plan.date_start;
            dateProgressBar.style.width = "100%";
        } else {
            dateRangeEl.textContent = "No Date";
            dateProgressBar.style.width = "0%";
        }

        // Time
        const timeRangeEl = document.querySelector(".time-range");
        const timeProgressBar = document.querySelector(".time-plan .progress-fill");
        const timeLeftEl = document.querySelector(".time-left-label");
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
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                timeLeftEl.textContent = `${h}h ${m}m`;
            } else if (endDT <= now) {
                timeProgressBar.style.width = "100%";
                timeLeftEl.textContent = "Time's up!";
            } else {
                timeProgressBar.style.width = "0%";
                timeLeftEl.textContent = "Not started";
            }
        } else {
            timeRangeEl.textContent = "No Time";
            timeProgressBar.style.width = "0%";
            timeLeftEl.textContent = "";
        }

        // Reminder
        document.querySelector("#reminderToggle").checked = plan.reminder?.enabled || false;

        // Repeat
        const repeatEl = document.querySelector(".repeat-plan");
        const weekText = document.querySelector(".week-text");
        const daysText = document.querySelector(".days-text");
        if (plan.repeat?.type) {
            repeatEl.style.display = "flex";
            weekText.textContent = `${plan.repeat.type.charAt(0).toUpperCase() + plan.repeat.type.slice(1)} (${plan.repeat.count} times)`;
            if (plan.repeat.days?.length > 0) {
                const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                daysText.textContent = plan.repeat.days.map(d => dayNames[d - 1]).join(" and ");
            } else {
                daysText.textContent = "";
            }
        } else {
            repeatEl.style.display = "none";
        }

        // Notes
        document.querySelector(".notes-text").value = plan.notes || "No notes";

        // Quadrant highlight
        const highlightOval = document.querySelector(".highlight-oval-plan");
        const quadrantMap = {
            'top-left': { top: '40px', left: '40px' },
            'top-right': { top: '40px', right: '40px' },
            'bottom-left': { bottom: '30px', left: '40px' },
            'bottom-right': { bottom: '30px', right: '40px' }
        };
        const colorMap = {
            'top-left': '#FED981', 'top-right': '#EE7981',
            'bottom-left': '#AFD2BC', 'bottom-right': '#B3B8F0'
        };
        const q = plan.quadrant || 'top-right';
        const pos = quadrantMap[q];
        highlightOval.style.top = pos.top || '';
        highlightOval.style.bottom = pos.bottom || '';
        highlightOval.style.left = pos.left || '';
        highlightOval.style.right = pos.right || '';
        highlightOval.style.borderColor = colorMap[q] || '#EE7981';
        highlightOval.style.display = 'block';
    }

    document.querySelector(".back-arrow-plan").addEventListener("click", () => {
        planPopup.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === planPopup) planPopup.style.display = "none";
    });

    document.querySelector(".delete-btn-plan").addEventListener("click", async () => {
        const planId = planPopup.dataset.planId;
        if (!planId || !confirm("Are you sure you want to delete this plan?")) return;
        try {
            const res = await fetch('/api/delete_plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                alert("Plan deleted successfully!");
                planPopup.style.display = "none";
                switchTab(activeTab); // refresh
            } else {
                alert(result.error || "Failed to delete plan.");
            }
        } catch (e) {
            alert("Error deleting plan: " + e.message);
        }
    });

    document.querySelector(".edit-btn-plan").addEventListener("click", () => {
        const planId = planPopup.dataset.planId;
        if (planId) window.location.href = `/addPlan?editPlanId=${planId}&returnTo=/viewMonthly`;
    });

    // ── FETCH PLANS (общий) ──
    async function fetchPlans() {
        const res = await fetch('/api/get_plans');
        if (!res.ok) {
            if (res.status === 401) { window.location.href = "/login"; return []; }
            return [];
        }
        const result = await res.json();
        return result.success ? (result.plans || []) : [];
    }

    // ── MONTHLY ──
    async function initMonthly() {
        if (!monthlyInitialized) {
            monthlyInitialized = true;
            document.getElementById("prevMonth").addEventListener("click", () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendar(currentDate);
            });
            document.getElementById("nextMonth").addEventListener("click", () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendar(currentDate);
            });
        }
        renderCalendar(currentDate);
    }

    function renderCalendar(date) {
        const grid = document.getElementById("calendarGrid");
        grid.innerHTML = "";

        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDay = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        document.getElementById("month-m").textContent = monthNames[month].toUpperCase();
        document.getElementById("year-m").textContent = year;

        const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
        for (let i = 0; i < totalCells; i++) {
            const dayCounter = i - startDay + 1;
            const cellDate = new Date(year, month, dayCounter);
            const dateStr = formatDate(cellDate);

            const cell = document.createElement("div");
            cell.classList.add("calendar-cell");
            cell.setAttribute("data-date", dateStr);

            const numEl = document.createElement("div");
            numEl.classList.add("day-number");
            numEl.textContent = cellDate.getDate();
            if (dayCounter < 1 || dayCounter > daysInMonth) numEl.style.color = "#bbb";
            cell.appendChild(numEl);

            if (isToday(cellDate)) {
                const img = document.createElement("img");
                img.src = "/static/images/catcircle.png";
                img.alt = "today";
                img.classList.add("today-icon");
                cell.appendChild(img);
            }

            grid.appendChild(cell);
        }

        fetchPlans().then(plans => plans.forEach(addPlanToCalendar));
    }

    function addPlanToCalendar(plan) {
        const { date_start, date_end, plan_name, quadrant, id } = plan;
        if (!date_start) return;

        const startDate = new Date(date_start);
        let endDate = date_end ? new Date(date_end) : new Date(date_start);
        if (endDate < startDate) endDate = startDate;

        let current = new Date(startDate);
        while (current <= endDate) {
            const cell = document.querySelector(`.calendar-cell[data-date="${formatDate(current)}"]`);
            if (cell) {
                let planWrapper = cell.querySelector(".plan");
                if (!planWrapper) {
                    planWrapper = document.createElement("div");
                    planWrapper.classList.add("plan");
                    cell.appendChild(planWrapper);
                }
                if (!planWrapper.querySelector(`[data-plan-id="${id}"]`)) {
                    const el = document.createElement("div");
                    el.classList.add("plan-quadrant", quadrant);
                    el.setAttribute("data-plan-id", id);
                    const name = document.createElement("div");
                    name.classList.add("plan-name");
                    name.textContent = plan_name;
                    el.appendChild(name);
                    el.addEventListener("click", () => showPlanPopup(plan));
                    planWrapper.appendChild(el);
                }
            }
            current.setDate(current.getDate() + 1);
        }
    }

    // ── WEEKLY ──
    async function initWeekly() {
        if (weeklyInitialized) return;
        weeklyInitialized = true;

        document.getElementById("prevWeek").addEventListener("click", () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            renderWeek();
        });
        document.getElementById("nextWeek").addEventListener("click", () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            renderWeek();
        });
        renderWeek();
    }

    function renderWeek() {
        const year = currentWeekStart.getFullYear();
        const month = currentWeekStart.getMonth();
        const startDay = currentWeekStart.getDate();
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(startDay + 6);

        document.getElementById("year-w").textContent = year;
        document.getElementById("month-w").textContent = monthNames[month].toUpperCase();
        document.getElementById("weekRange-w").textContent = `${startDay} - ${weekEnd.getDate()}`;

        // Очищаем планы
        document.querySelectorAll(".day-box .plans").forEach(p => p.innerHTML = "");
        const goalsBox = document.querySelector(".goal-box .goals");
        if (goalsBox) goalsBox.innerHTML = "";

        fetchPlans().then(plans => plans.forEach(addPlanToWeek));
    }

    function addPlanToWeek(plan) {
        const { date_start, date_end, plan_name, time_start, time_end, quadrant, id, completed, folder } = plan;
        if (!date_start) return;

        const startDate = new Date(date_start + 'T00:00:00');
        let endDate = date_end ? new Date(date_end + 'T00:00:00') : new Date(date_start + 'T00:00:00');
        if (endDate < startDate) endDate = startDate;

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        let current = new Date(startDate);
        while (current <= endDate) {
            if (current >= currentWeekStart && current <= weekEnd) {
                const dow = current.getDay(); // 0=Sun, 1=Mon...6=Sat matches HTML
                const dayBox = document.querySelector(`.day-box[data-day="${dow}"] .plans`);
                const dateStr = formatDate(current);
                if (dayBox && !dayBox.querySelector(`[data-plan-id="${id}-${dateStr}"]`)) {
                    const el = createPlanElement(plan, dateStr);
                    el.setAttribute("data-plan-id", `${id}-${dateStr}`);
                    dayBox.appendChild(el);
                }
            }
            current.setDate(current.getDate() + 1);
        }

        // Goals box removed from UI — skipped
    }

    // ── DAILY ──
    async function initDaily() {
        if (dailyInitialized) return;
        dailyInitialized = true;

        // Генерируем time rows
        const dayGrid = document.getElementById("dayGrid");
        for (let h = 0; h < 24; h++) {
            const row = document.createElement("div");
            row.classList.add("time-row");
            row.innerHTML = `
                <div class="time-label"><span>${h}:00</span></div>
                <div class="plan-slot" data-hour="${h}"></div>
            `;
            dayGrid.appendChild(row);
        }

        document.getElementById("prevDay").addEventListener("click", () => {
            currentDay.setDate(currentDay.getDate() - 1);
            renderDay();
        });
        document.getElementById("nextDay").addEventListener("click", () => {
            currentDay.setDate(currentDay.getDate() + 1);
            renderDay();
        });
        renderDay();
    }

    function renderDay() {
        const year = currentDay.getFullYear();
        const month = currentDay.getMonth();
        const day = currentDay.getDate();

        document.getElementById("year-d").textContent = year;
        document.getElementById("month-d").textContent = monthNames[month].toUpperCase();
        document.getElementById("weekRange-d").textContent = String(day).padStart(2, "0");
        document.getElementById("currentDayDisplay").textContent = `${monthNames[month]} ${day}, ${year}`;

        document.querySelectorAll(".plan-slot").forEach(s => s.innerHTML = "");
        fetchPlans().then(plans => plans.forEach(addPlanToDay));
    }

    function addPlanToDay(plan) {
        const {
            date_start,
            date_end,
            plan_name,
            time_start,
            time_end,
            quadrant,
            id,
            completed
        } = plan;

        if (!date_start) return;

        const cur = new Date(currentDay);
        cur.setHours(0, 0, 0, 0);

        const startDate = new Date(date_start + 'T00:00:00');
        startDate.setHours(0, 0, 0, 0);

        const endDate = date_end ? new Date(date_end + 'T00:00:00') : new Date(date_start + 'T00:00:00');
        endDate.setHours(23, 59, 59, 999);

        if (cur < startDate || cur > endDate) return;

        if (!time_start || !time_end) return;

        const [sh, sm] = time_start.split(':').map(Number);
        const [eh, em] = time_end.split(':').map(Number);
        const startTime = sh + sm / 60;
        const endTime = eh + em / 60;

        for (let h = Math.floor(startTime); h <= Math.floor(endTime); h++) {
            const slot = document.querySelector(`.plan-slot[data-hour="${h}"]`);
            if (!slot) continue;

            const currentDayStr = formatDate(currentDay);
            const el = createPlanElement(plan, currentDayStr);

            // Добавляем время
            const timeSpan = document.createElement("div");
            timeSpan.classList.add("plan-time");
            if (h === Math.floor(startTime) && h === Math.floor(endTime)) {
                timeSpan.textContent = `${time_start} - ${time_end}`;
            } else if (h === Math.floor(startTime)) {
                timeSpan.textContent = `${time_start} - ${String(h + 1).padStart(2, '0')}:00`;
            } else if (h === Math.floor(endTime)) {
                timeSpan.textContent = `${String(h).padStart(2, '0')}:00 - ${time_end}`;
            } else {
                timeSpan.textContent = `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`;
            }
            el.appendChild(timeSpan);
            slot.appendChild(el);
        }
    }

    // ── ОБЩИЙ ЭЛЕМЕНТ ПЛАНА ──
    function createPlanElement(plan, dateStr) {
        const { plan_name, time_start, time_end, quadrant, id, completed } = plan;
        const el = document.createElement("div");
        el.classList.add("plan-quadrant", quadrant || 'top-right');
        if (completed) el.classList.add("completed");
        el.setAttribute("data-plan-id", id);

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("complete-checkbox");
        const checkDateStr = dateStr || formatDate(new Date());
        const completedDates = plan.completed_dates || [];
        checkbox.checked = completedDates.includes(checkDateStr);
        checkbox.dataset.planId = id;
        checkbox.dataset.checkDate = checkDateStr;
        checkbox.addEventListener("change", async (e) => {
            await updatePlanCompletion(e.target.dataset.planId, e.target.checked, e.target.dataset.checkDate);
        });

        const name = document.createElement("div");
        name.classList.add("plan-name");
        name.textContent = plan_name || "Untitled Plan";

        el.appendChild(checkbox);
        el.appendChild(name);
        el.addEventListener("click", (e) => {
            if (e.target !== checkbox) showPlanPopup(plan);
        });

        return el;
    }

    async function updatePlanCompletion(planId, checked, checkDate) {
        try {
            const dateStr = checkDate || formatDate(new Date());

            // Fetch fresh plan data to avoid stale completed_dates
            const plansRes = await fetch('/api/get_plans');
            const plansData = await plansRes.json();
            const freshPlan = (plansData.plans || []).find(p => p.id === planId);
            let completedDates = (freshPlan && freshPlan.completed_dates) ? [...freshPlan.completed_dates] : [];

            if (checked) {
                if (!completedDates.includes(dateStr)) completedDates.push(dateStr);
            } else {
                completedDates = completedDates.filter(d => d !== dateStr);
            }

            const res = await fetch('/api/edit_plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId, completed_dates: completedDates })
            });
            const result = await res.json();
            if (!res.ok) alert(result.error || "Failed to update plan.");
        } catch (e) {
            alert("Error: " + e.message);
        }
    }

    // ── HELPERS ──
    function formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function isToday(date) {
        const t = new Date();
        return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
    }

    // ── AI CHAT ──
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
            const response = await fetch('/api/user_info', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.avatar) userAvatar = data.avatar;

            if (data.days) {
                const daysEl = document.getElementById('days');
                if (daysEl) daysEl.textContent = `day ${data.days}`;
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    }

    async function fetchCurrentSession() {
        try {
            const res = await fetch('/api/current_session');
            const data = await res.json();
            messagesContainer.innerHTML = '';
            data.messages.forEach(msg => appendMessage(msg.role, msg.content));
            if (data.messages.length > 0) reminderPanel.style.display = "none";
        } catch (e) { console.error('Error fetching current session:', e); }
    }

    function appendMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('Message__Element', role === 'user' ? 'User' : 'Bot');

        const img = document.createElement('img');
        img.src = role === 'user' ? userAvatar : '/static/images/bunny.png';
        img.alt = role === 'user' ? 'User' : 'Bot';

        const msgContent = document.createElement('div');
        msgContent.classList.add('Message');
        msgContent.textContent = content;

        if (role === 'user') {
            messageDiv.appendChild(msgContent);
            messageDiv.appendChild(img);
        } else {
            messageDiv.appendChild(img);
            messageDiv.appendChild(msgContent);
        }

        messagesContainer.appendChild(messageDiv);
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
            if (data.reply) {
                appendMessage('assistant', data.reply);
                await loadChatHistory();
                if (data.action) {
                    setTimeout(() => handleBunnyAction(data.action, data.params || {}), 2000);
                }
            } else {
                appendMessage('assistant', 'Sorry, something went wrong!');
            }
        } catch (e) {
            appendMessage('assistant', 'Error: Could not send message.');
        }
    }

    async function startNewChat() {
        try {
            const res = await fetch('/api/chat/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (!data.session_id) return;
            localStorage.setItem('chatSessionId', data.session_id);
            messagesContainer.innerHTML = '';
            reminderPanel.style.display = "none";
            await loadChatHistory();
        } catch (e) { console.error('Error starting new chat:', e); }
    }

    async function deleteSession(sessionId) {
        if (!confirm('Are you sure you want to delete this chat session?')) return;
        try {
            const res = await fetch(`/api/chat/delete/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                if (localStorage.getItem('chatSessionId') === sessionId) {
                    localStorage.removeItem('chatSessionId');
                    messagesContainer.innerHTML = '';
                    reminderPanel.style.display = "none";
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
            data.sessions.forEach(s => {
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
                    const cur = s.is_current ? ' (Current)' : '';
                    el.innerHTML = `
                        <p style="display:inline-block;width:calc(100% - 80px);cursor:pointer;">
                            ${s.session_title}${cur}
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

    function handleBunnyAction(action, params) {
        switch (action) {
            case 'statistics':
                window.location.href = '/statistics';
                break;
            case 'view':
                window.location.href = '/view';
                break;
            case 'add_plan': {
                const title = params.title ? encodeURIComponent(params.title) : '';
                window.location.href = title ? `/addPlan?title=${title}` : '/addPlan';
                break;
            }
            case 'focus': {
                const duration = params.duration || 30;
                window.location.href = `/focus?duration=${duration}&autostart=true`;
                break;
            }
        }
    }

    function handleBunnyAction(action, params) {
        switch (action) {
            case 'statistics':
                window.location.href = '/statistics';
                break;
            case 'view':
                window.location.href = '/view';
                break;
            case 'add_plan': {
                const title = params.title ? encodeURIComponent(params.title) : '';
                window.location.href = title ? `/addPlan?title=${title}` : '/addPlan';
                break;
            }
            case 'focus': {
                const duration = params.duration || 30;
                window.location.href = `/focus?duration=${duration}&autostart=true`;
                break;
            }
        }
    }
});