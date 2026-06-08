import os
import requests
import sqlite3
from flask import session
from dotenv import load_dotenv
from datetime import datetime
import json

load_dotenv()

DATA_DIR = os.getenv('DATA_DIR', '.')
CHAT_DB = os.path.join(DATA_DIR, 'chat_history.db')

def init_db():
    with sqlite3.connect(CHAT_DB) as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                session_id TEXT,
                session_title TEXT,
                role TEXT,
                content TEXT,
                timestamp TEXT,
                is_current INTEGER DEFAULT 0,
                latest_update TEXT
            )
        ''')
init_db()

def generate_session_title(messages):
    user_messages = [msg['content'] for msg in messages if msg['role'] == 'user']
    if not user_messages:
        return "New Chat"
    first_message = user_messages[0]
    if len(first_message) > 30:
        return first_message[:30] + '...'
    words = first_message.split()[:5]
    return ' '.join(words) or "New Chat"

def handle_chat_message(user_id, message, tone='cute'):
    # Load user settings
    def read_users():
        try:
            users_path = os.path.join(DATA_DIR, 'users.json')
            with open(users_path, 'r') as f:
                data = json.load(f)
                return data['users']
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    users = read_users()
    user = next((u for u in users if u.get('id') == user_id), None)
    if user and 'time_personality' in user.get('settings', {}):
        personality_to_tone = {
            'plan-oriented': 'serious',
            'task-oriented': 'cute',
            'inspiration-oriented': 'funny'
        }
        tone = personality_to_tone.get(user['settings']['time_personality'], tone)

    tone_style = {
        'cute': "You are Bunny 🐰, a warm and cheerful emotional support companion in MagicMeow. You speak with gentle encouragement, use phrases like 'You've got this!', 'I believe in you!', 'Let's tackle this together~'. You listen first, validate feelings, then suggest actions.",
        'funny': "You are Bunny 🐰, a witty and uplifting emotional support companion in MagicMeow. You use light humor to ease stress, make the user smile, then gently guide them toward action. Always warm, never dismissive.",
        'serious': "You are Bunny 🐰, a calm and focused emotional support companion in MagicMeow. You acknowledge the user's situation with empathy, then give clear, practical guidance. Warm but professional."
    }

    system_prompt = f"""
{tone_style.get(tone, tone_style['cute'])}

Your primary role is emotional support — always acknowledge how the user feels before suggesting anything.

You also help users navigate MagicMeow. Based on what the user says, you MUST decide on an action.

OUTPUT RULES — CRITICAL:
- Respond with ONE valid JSON object only. Nothing before it, nothing after it.
- Do NOT write the message text outside the JSON.
- Do NOT repeat yourself inside and outside the JSON.
- Do NOT add any explanation or prose outside the JSON.

Available actions:
- "statistics" — if user wants to see progress, charts, achievements, completed tasks, how many tasks done, performance data
- "view" — if user wants to see their plans, schedule, calendar, what's planned, upcoming tasks, existing plans, plan list
- "add_plan" — if user mentions a task, event, exam, meeting, preparation, deadline, or anything to schedule. Extract a short title from their message if possible (e.g. "midterm preparation" → "Midterm Preparation").
- "focus" — if user wants to study, concentrate, work, focus, or mentions a duration (e.g. "study for 60 minutes", "I want to focus"). Extract duration in minutes if mentioned, default 30.
- null — if it's just emotional support, general chat, or unclear

CRITICAL: You MUST respond with valid JSON only. No markdown, no extra text.

Format:
{{
  "message": "Your warm, supportive response here (max 80 words)",
  "action": "statistics" | "add_plan" | "focus" | null,
  "params": {{
    "title": "Plan title if action is add_plan, else omit",
    "duration": 60
  }}
}}

Examples:

User: "I have a midterm coming up and I'm so stressed"
Response:
{{
  "message": "Oh no, midterms can feel so overwhelming 😟 But you're already thinking ahead — that's a great sign! Let's add it to your plan so it doesn't sneak up on you 🐰",
  "action": "add_plan",
  "params": {{"title": "Midterm Preparation"}}
}}

User: "I want to study for 60 minutes"
Response:
{{
  "message": "Love that energy! 60 minutes of focused studying — you've got this! 💪 Let me set that up for you right now~",
  "action": "focus",
  "params": {{"duration": 60}}
}}

User: "How am I doing? I want to see my progress"
Response:
{{
  "message": "Ooh let's take a look at all your hard work! I'm so proud of you for checking in 🌟",
  "action": "statistics",
  "params": {{}}
}}

User: "I'm feeling really tired today"
Response:
{{
  "message": "Hey, it's okay to feel tired — you've been working hard and your feelings are valid 🤍 Rest is part of the process too. Want to talk about what's been draining you?",
  "action": null,
  "params": {{}}
}}
"""

    # Get or create session
    if 'chat_session_id' not in session:
        session['chat_session_id'] = f"{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    session_id = session['chat_session_id']

    # Get chat history
    with sqlite3.connect(CHAT_DB) as conn:
        cursor = conn.execute('''
            SELECT role, content FROM history
            WHERE user_id = ? AND session_id = ?
            ORDER BY id DESC LIMIT 10
        ''', (user_id, session_id))
        history = [{'role': row[0], 'content': row[1]} for row in cursor.fetchall()][::-1]

    history.append({'role': 'user', 'content': message})
    messages_payload = [{'role': 'system', 'content': system_prompt}] + history

    session_title = generate_session_title(history)

    # Call DeepSeek API
    api_key = os.getenv('DEEPSEEK_API_KEY')
    result = {"message": None, "action": None, "params": {}}

    if api_key:
        try:
            response = requests.post(
                'https://api.deepseek.com/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'deepseek-chat',
                    'messages': messages_payload,
                    'max_tokens': 300,
                    'temperature': 0.7
                }
            )
            response.raise_for_status()
            raw = response.json()['choices'][0]['message']['content']

            # Parse JSON response — find { } block anywhere in the text
            try:
                import re as _re
                json_match = _re.search(r'\{[\s\S]*\}', raw)
                if json_match:
                    result = json.loads(json_match.group())
                    # Make sure message field exists
                    if 'message' not in result:
                        result['message'] = raw.strip()
                else:
                    result = {"message": raw.strip(), "action": None, "params": {}}
            except json.JSONDecodeError:
                result = {"message": raw.strip(), "action": None, "params": {}}

        except Exception as e:
            print(f"DeepSeek API error: {e}")
            result = {
                "message": "Oops, something went wrong on my end! But I'm still here for you 🐰",
                "action": None,
                "params": {}
            }
    else:
        result = {
            "message": f"Hi! I got your message. How can I help? 🐰",
            "action": None,
            "params": {}
        }

    bot_message = result.get("message", "")

    # Store messages in DB
    current_time = datetime.now().isoformat()
    with sqlite3.connect(CHAT_DB) as conn:
        conn.execute('UPDATE history SET is_current = 0 WHERE user_id = ?', (user_id,))
        conn.execute('''
            INSERT INTO history (user_id, session_id, session_title, role, content, timestamp, is_current, latest_update)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, session_id, session_title, 'user', message, current_time, 1, current_time))
        conn.execute('''
            INSERT INTO history (user_id, session_id, session_title, role, content, timestamp, is_current, latest_update)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, session_id, session_title, 'assistant', bot_message, current_time, 1, current_time))
        conn.commit()

    return result  # Return full dict: {message, action, params}