document.addEventListener("DOMContentLoaded", function () {
    // Sidebar
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");
    const addPlanButton = document.querySelector(".add-plan");
    const plusIcon = document.querySelector(".plus-icon");

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
        plusIcon.style.display = sidebar.classList.contains("open") ? "none" : "block";
    });

    // Records-popup
    const iconTrigger = document.querySelector(".icon-trigger");
    const recordsPopup = document.querySelector(".records-popup");
    const backBtn = document.querySelector(".back-btn");

    iconTrigger.addEventListener("click", function () {
        recordsPopup.style.display = "flex";
    });

    backBtn.addEventListener("click", function () {
        recordsPopup.style.display = "none";
    });

    // Focus-duration and Timer
    const addFocusBtn = document.querySelector(".add-focus-btn");
    const popupBox = document.getElementById("focusDurationPopup");
    const cancelBtn = popupBox.querySelector(".cancel-btn");
    const confirmBtn = document.getElementById("confirmBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const focusTitle = document.getElementById("focusTitle");
    const startBtn = document.getElementById("startBtn");
    const finCont = document.getElementById("fin-cont");
    const continueBtn = document.querySelector(".continue-btn");
    const showConfirm = document.getElementById("showConfirm");
    const confirmPopup = document.getElementById("confirmPopup");
    const cancelConfirm = document.getElementById("cancelConfirm");
    const confirmFinishBtn = document.getElementById("confirmFinishBtn");
    const timerDisplay = document.querySelector(".timer-display");
    const timeInput = document.querySelector(".time-input");

    let timeLeft = 1800; // Default 30 minutes = 1800 seconds
    let timerInterval = null;
    let isPaused = false;
    let initialTime = 1800; // Store initial time for saving

    // 创建完成弹窗
    const createCompletionPopup = () => {
        const popup = document.createElement("div");
        popup.id = "completionPopup";
        popup.className = "completion-popup";
        popup.innerHTML = `
            <div class="completion-content">
                <h2>🎉 Congratulations on completing a Focus Time!</h2>
                <button id="closePopupBtn" class="close-btn">Close</button>
            </div>
        `;
        document.body.appendChild(popup);

        // 添加样式
        const style = document.createElement("style");
        style.textContent = `
            .completion-popup {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .completion-content {
                background: #fff;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                width: 300px;
                animation: slideIn 0.3s ease-out;
            }
            .close-btn {
                background-color: #6b46c1;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            }
            .close-btn:hover {
                background-color: #553c9a;
            }
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // 关闭弹窗事件
        document.getElementById("closePopupBtn").addEventListener("click", () => {
            popup.style.display = "none";
        });
    };

    // 显示完成弹窗
    const showCompletionPopup = () => {
        const popup = document.getElementById("completionPopup");
        if (popup) popup.style.display = "flex";
    };

    // 初始化弹窗
    createCompletionPopup();

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(timeLeft);
    }

    function parseTimeInput(input) {
        const minutesPattern = /^\d{1,3}$/;
        const trimmed = input.trim();

        if (!minutesPattern.test(trimmed)) {
            alert("Please enter the number of minutes (e.g., 30)");
            return null;
        }

        const minutes = parseInt(trimmed, 10);

        if (minutes < 1 || minutes > 180) {
            alert("Minutes must be between 1 and 180");
            return null;
        }

        return minutes * 60;
    }

    function startTimer() {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            if (!isPaused) {
                timeLeft--;
                updateTimerDisplay();

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    saveFocusSession(initialTime - timeLeft); // Save actual duration
                    showCompletionPopup(); // 显示完成弹窗
                    timeLeft = 1800;
                    updateTimerDisplay();
                    resetToInitialState();
                }
            }
        }, 1000);
    }

    function pauseTimer() {
        isPaused = true;
    }

    function continueTimer() {
        isPaused = false;
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timeLeft = 1800;
        updateTimerDisplay();
        isPaused = false;
    }

    async function saveFocusSession(duration) {
        console.log('Saving focus session:', { duration, timestamp: new Date().toISOString() });
        try {
            const response = await fetch('/api/save_focus_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duration: duration,
                    timestamp: new Date().toISOString()
                })
            });
            const data = await response.json();
            if (!data.success) {
                console.error('Failed to save focus session:', data.error);
            }
        } catch (error) {
            console.error('Error saving focus session:', error);
        }
    }

    function resetToInitialState() {
        focusTitle.textContent = "FOCUS TIME";
        pauseBtn.style.display = "none";
        addFocusBtn.style.display = "flex";
        startBtn.style.display = "block";
        finCont.style.display = "none";
        confirmPopup.style.display = "none";

        const mainContent = document.querySelector(".main-content");
        mainContent.style.transition = "margin-top 0.3s ease";
        mainContent.style.marginTop = "0px";
    }

    updateTimerDisplay();

    (function () {
        const urlParams = new URLSearchParams(window.location.search);
        const duration = parseInt(urlParams.get('duration'), 10);
        const autostart = urlParams.get('autostart') === 'true';

        if (duration && duration >= 1 && duration <= 180) {
            timeLeft = duration * 60;
            initialTime = duration * 60;
            updateTimerDisplay();
        }

        if (autostart) {
            // Небольшая задержка чтобы страница успела загрузиться
            setTimeout(() => {
                focusTitle.textContent = "Focusing...";
                pauseBtn.style.display = "block";
                addFocusBtn.style.display = "none";
                startBtn.style.display = "none";
                startTimer();
            }, 500);
        }
    })();

    addFocusBtn.addEventListener("click", function () {
        timeInput.value = Math.round(timeLeft / 60);
        popupBox.classList.add("active");
    });

    cancelBtn.addEventListener("click", function () {
        popupBox.classList.remove("active");
        timeInput.value = "30";
    });

    confirmBtn.addEventListener("click", function () {
        const userInput = timeInput.value.trim();
        const newTime = parseTimeInput(userInput);

        if (newTime !== null) {
            timeLeft = newTime;
            initialTime = newTime;
            updateTimerDisplay();
        } else {
            timeLeft = 1800;
            initialTime = 1800;
            updateTimerDisplay();
        }

        popupBox.classList.remove("active");
        focusTitle.textContent = "Focusing...";
        pauseBtn.style.display = "block";
        addFocusBtn.style.display = "none";
        startBtn.style.display = "none";
        startTimer();
    });

    pauseBtn.addEventListener("click", function () {
        pauseBtn.style.display = "none";
        finCont.style.display = "flex";
        pauseTimer();
    });

    continueBtn.addEventListener("click", function () {
        finCont.style.display = "none";
        pauseBtn.style.display = "block";
        continueTimer();
    });

    showConfirm.addEventListener("click", function () {
        confirmPopup.style.display = "block";
    });

    cancelConfirm.addEventListener("click", function () {
        confirmPopup.style.display = "none";
        finCont.style.display = "none";
        pauseBtn.style.display = "block";
        continueTimer();
    });

    confirmFinishBtn.addEventListener("click", function () {
        const usedDuration = initialTime - timeLeft;
        if (usedDuration > 0) {
            saveFocusSession(usedDuration);
            showCompletionPopup();
        }
        stopTimer();
        resetToInitialState();
    });

    startBtn.addEventListener("click", function () {
        popupBox.classList.remove("active");
        focusTitle.textContent = "Focusing...";
        pauseBtn.style.display = "block";
        addFocusBtn.style.display = "none";
        startBtn.style.display = "none";
        initialTime = timeLeft;
        startTimer();
    });

    timeInput.addEventListener("input", function () {
        console.log("Time input changed to:", timeInput.value);
    });

    // Chat functionality
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
            const response = await fetch('/api/current_session');
            const data = await response.json();
            messagesContainer.innerHTML = '';
            data.messages.forEach(msg => appendMessage(msg.role, msg.content));
            if (data.messages.length > 0) {
                reminderPanel.style.display = "none";
            }
        } catch (error) {
            console.error('Error fetching current session:', error);
        }
    }

    function appendMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('Message__Element', role === 'user' ? 'User' : 'Bot');

        const img = document.createElement('img');
        img.src = role === 'user' ? userAvatar : '/static/images/bunny.png';
        img.alt = role === 'user' ? 'User' : 'Bot';

        const messageContent = document.createElement('div');
        messageContent.classList.add('Message');
        messageContent.textContent = content;

        if (role === 'user') {
            messageDiv.appendChild(messageContent);
            messageDiv.appendChild(img);
        } else {
            messageDiv.appendChild(img);
            messageDiv.appendChild(messageContent);
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
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, tone: 'cute' })
            });
            const data = await response.json();
            if (data.reply) {
                appendMessage('assistant', data.reply);
                await loadChatHistory();
                if (data.action) {
                    setTimeout(() => handleBunnyAction(data.action, data.params || {}), 2000);
                }

            } else {
                appendMessage('assistant', 'Sorry, something went wrong!');
            }
        } catch (error) {
            appendMessage('assistant', 'Error: Could not send message.');
            console.error('Chat error:', error);
        }
    }

    async function startNewChat() {
        try {
            const response = await fetch('/api/chat/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: '{{ session["user_id"] }}' })
            });
            const data = await response.json();
            if (!data.session_id) {
                console.error('Failed to create new session:', data.error);
                return;
            }

            localStorage.setItem('chatSessionId', data.session_id);
            messagesContainer.innerHTML = '';
            reminderPanel.style.display = "none";
            await loadChatHistory();
        } catch (error) {
            console.error('Error starting new chat:', error);
        }
    }

    async function deleteSession(sessionId) {
        if (!confirm('Are you sure you want to delete this chat session?')) return;

        try {
            const response = await fetch(`/api/chat/delete/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.success) {
                if (localStorage.getItem('chatSessionId') === sessionId) {
                    localStorage.removeItem('chatSessionId');
                    messagesContainer.innerHTML = '';
                    reminderPanel.style.display = "none";
                }
                await loadChatHistory();
            } else {
                console.error('Failed to delete session:', data.error);
                alert('Failed to delete session: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            alert('Error deleting session.');
        }
    }

    async function loadChatHistory() {
        try {
            const response = await fetch('/api/chat_history', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            chatHistory.innerHTML = '';

            const sessionsByDate = {};
            data.sessions.forEach(session => {
                const timestamp = session.latest_update || session.timestamp;
                const isCurrent = session.is_current || false;
                const date = new Date(timestamp);
                const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                if (!sessionsByDate[dateKey]) {
                    sessionsByDate[dateKey] = [];
                }
                sessionsByDate[dateKey].push({ ...session, is_current: isCurrent, latest_update: timestamp });
            });

            Object.keys(sessionsByDate).sort((a, b) => new Date(b) - new Date(a)).forEach(dateKey => {
                const dateHeader = document.createElement('div');
                dateHeader.className = 'date-header';
                dateHeader.innerHTML = `<p style="font-weight: bold; margin: 10px 0 5px;">${dateKey}</p>`;
                chatHistory.appendChild(dateHeader);

                sessionsByDate[dateKey].forEach(session => {
                    const sessionElement = document.createElement('div');
                    sessionElement.className = 'chat-session';
                    const time = new Date(session.latest_update).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const isCurrent = session.is_current ? ' (Current)' : '';
                    sessionElement.innerHTML = `
                        <p style="display: inline-block; width: calc(100% - 80px); cursor: pointer;">
                            ${session.session_title}${isCurrent}
                            <span style="float: right; color: gray; font-size: 12px;">${time}</span>
                        </p>
                        <button class="delete-session-btn" style="float: right; background: #ff4d4d; color: white; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
                    `;
                    sessionElement.querySelector('p').addEventListener('click', () => {
                        loadSessionMessages(session.session_id);
                    });
                    sessionElement.querySelector('.delete-session-btn').addEventListener('click', () => {
                        deleteSession(session.session_id);
                    });
                    chatHistory.appendChild(sessionElement);
                });
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    async function loadSessionMessages(sessionId) {
        try {
            const response = await fetch(`/api/chat_history/${sessionId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            messagesContainer.innerHTML = '';
            data.messages.forEach(msg => appendMessage(msg.role, msg.content));
            reminderPanel.style.display = "none";
            localStorage.setItem('chatSessionId', sessionId);
            await loadChatHistory();
        } catch (error) {
            console.error('Error loading session messages:', error);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendBtn.click();
    });

    bunnyBtn.addEventListener("click", () => {
        reminderPanel.style.display = reminderPanel.style.display === "none" ? "block" : "none";
        if (reminderPanel.style.display === "block") {
            loadChatHistory();
        }
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
                timeLeft = duration * 60;
                initialTime = duration * 60;
                updateTimerDisplay();
                focusTitle.textContent = "Focusing...";
                pauseBtn.style.display = "block";
                addFocusBtn.style.display = "none";
                startBtn.style.display = "none";
                startTimer();
                break;
            }
        }
    }
});