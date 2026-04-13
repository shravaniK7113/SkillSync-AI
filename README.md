# SkillSync – AI-Based Skill Exchange Platform

SkillSync is a full-stack web application that enables users to connect with others to **exchange skills** using a matching system similar to swipe-based platforms.

Users can discover profiles, match based on mutual interest, and communicate through **real-time chat and video calls**.

---

##  Features

# Authentication

* User Registration & Login (JWT-based)
* Protected routes for secure access

# Skill Matching System

* Discover users based on skills
* Swipe/interest-based matching system
* Mutual match required to unlock chat

# Real-Time Chat

* Chat only enabled after match
* Message notifications
* Unread message tracking

# Video Calling (WebRTC)

* One-to-one video calling
* Mic ON/OFF
* Camera ON/OFF
* Fullscreen mode
* Screen sharing
* Call status indicators
* Ringtone & call alerts

# Security

* Chat restricted to matched users only
* Backend validation for all requests
* Token-based authentication

---

## 🛠 Tech Stack

# Frontend

* React.js
* CSS
* Axios
* React Router

# Backend

* Python (Flask)
* Flask-SocketIO
* MySQL
* JWT Authentication

# Real-Time

* WebRTC (Video Call)
* Socket.IO (Signaling)

# Tools

* Git & GitHub
* Postman

---

## 📁 Project Structure

```
SkillSync/
├── backend-python/
│   ├── app.py
│
├── skillsync-web/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── config.js
│   │   ├── socket.js
│   │   └── App.js
│
└── README.md
```

---

## ⚙️ Getting Started

# 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/SkillSync-AI.git
cd SkillSync-AI
```

---

## 🟣 Backend Setup (Flask)

```bash
cd backend-python

python -m venv venv
venv\Scripts\activate   # Windows

pip install flask flask-cors flask-socketio mysql-connector-python pyjwt bcrypt

python app.py
```

Backend runs on:

```
http://localhost:5000
```

---

## 🟣 Frontend Setup (React)

```bash
cd skillsync-web

npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## 🗄️ Database Setup (MySQL)

### Create Database

```sql
CREATE DATABASE skillsync;
USE skillsync;
```

---

### Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password TEXT
);
```

---

### Matches Table

```sql
CREATE TABLE matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user1_id INT,
  user2_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Messages Table

```sql
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT,
  receiver_id INT,
  message_text TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔁 Application Flow

### 👤 User Journey

1. Register / Login
2. Discover users
3. Show interest (swipe/right)
4. Mutual match created
5. Chat unlocked
6. Start video call


## 🎥 Video Call Architecture

* WebRTC for peer-to-peer media
* Socket.IO for signaling
* STUN server (Google STUN)

## 🔐 Security Features

* JWT authentication
* Protected routes
* Match-based chat access control
* Backend validation for all endpoints
