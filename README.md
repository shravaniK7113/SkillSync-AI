SkillSync README.md
# SkillSync – AI-Based Mentor-Learner Matching Platform

SkillSync is a full-stack web application that connects learners with mentors based on skills, goals, and preferences.  
It enables users to find mentors, send connection requests, and build meaningful learning relationships.

# Features

- User Authentication (Login/Register)
- Role-based system (Learner → Mentor)
- Become a Mentor profile creation
- Find mentors based on skills
- Send connection requests
- Accept / Reject requests (Mentor Dashboard)
- Learner Dashboard (track request status)
- Mentor Dashboard (manage requests)
- AI-based matching (skill + semantic + trust score)
- Contact reveal after acceptance
- Modern UI with React

# Tech Stack

# Frontend
- React.js
- CSS
- Axios
- React Router

# Backend
- Python (Flask)
- MySQL
- JWT Authentication

# Tools
- Git & GitHub
- Postman (API testing)

# Project Structure


SkillSync/
├── backend-python/ # Flask backend
│ ├── app.py
│
├── skillsync-web/ # React frontend
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── App.js
│
└── README.md

# Getting Started

# Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/SkillSync-AI.git
cd SkillSync-AI
🟣 Backend Setup (Flask)
cd backend-python

python -m venv venv
venv\Scripts\activate   # Windows

pip install flask flask-cors mysql-connector-python pyjwt bcrypt

python app.py

Backend will run on:

http://localhost:5000

🟣 Frontend Setup (React)
cd skillsync-web

npm install
npm start

Frontend will run on:

http://localhost:3000

🗄️ Database Setup (MySQL)

Create database:

CREATE DATABASE skillsync;
USE skillsync;

🧾 Tables Required
Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password TEXT,
  role VARCHAR(20) DEFAULT 'user'
);
Mentors Table
CREATE TABLE mentors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100),
  email VARCHAR(100),
  skills TEXT,
  experience TEXT,
  bio TEXT,
  availability TEXT,
  contact VARCHAR(100),
  likes INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
Connection Requests Table
CREATE TABLE connection_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  learner_id INT,
  mentor_id INT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Learner Preferences (Optional AI Matching)
CREATE TABLE learner_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  learning_skills TEXT,
  goals TEXT,
  preferred_availability TEXT
);

 # Workflow
 Learner
Register/Login
Search mentors
Send connection request
Track request in dashboard
# Mentor
Become mentor
Receive requests
Accept/Reject
Share contact after acceptance
🎯 How Matching Works

SkillSync uses:

Skill matching (keyword-based)
Semantic similarity (text comparison)
Trust score (ratings, activity)

Final Score =

50% Skill Match + 30% Semantic + 20% Trust
 Future Enhancements
 Real-time Chat System
 Session Booking
 Mentor Ratings & Reviews
 Video Call Integration
 Notifications
