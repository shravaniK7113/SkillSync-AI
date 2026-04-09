from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import jwt
import datetime
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

print("🔥 NEW APP LOADED")

app = Flask(__name__)
CORS(app)

SECRET_KEY = "yoursecretkey"

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="1234@7",
    database="skillsync"
)

# Load AI model once
model = SentenceTransformer("all-MiniLM-L6-v2")

# -----------------------------
# HELPER FUNCTIONS FOR MATCHING
# -----------------------------

skill_map = {
    "ai": "artificial intelligence",
    "ml": "machine learning",
    "web dev": "web development",
    "frontend": "front end development",
    "backend": "back end development"
}

def normalize_skill(skill):
    skill = skill.strip().lower()
    return skill_map.get(skill, skill)

def normalize_skill_list(skills):
    return [normalize_skill(s) for s in skills]

def skill_match_score(learner_skills, mentor_skills):
    learner_set = set(normalize_skill_list(learner_skills))
    mentor_set = set(normalize_skill_list(mentor_skills))

    if not learner_set:
        return 0.0

    common = learner_set.intersection(mentor_set)
    score = (len(common) / len(learner_set)) * 100
    return float(round(score, 2))

def semantic_similarity_score(learner_text, mentor_text):
    emb1 = model.encode([learner_text])
    emb2 = model.encode([mentor_text])

    sim = cosine_similarity(emb1, emb2)[0][0]
    return float(round(sim * 100, 2))

def trust_score(avg_rating, review_count, response_rate, completion_rate, likes=0, total_sessions=0):
    rating_score = (avg_rating / 5) * 100
    review_score = min(review_count * 10, 100)

    engagement_score = min(total_sessions * 2, 100)
    likes_score = min(likes * 5, 100)

    score = (
        0.30 * rating_score +
        0.20 * review_score +
        0.15 * response_rate +
        0.15 * completion_rate +
        0.10 * engagement_score +
        0.10 * likes_score
    )

    return float(round(score, 2))
def final_match_score(skill_score, semantic_score, trust):
    score = (
        0.50 * skill_score +
        0.30 * semantic_score +
        0.20 * trust
    )
    return float(round(score, 2))

# -----------------------------
# AUTH ROUTES
# -----------------------------

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    cursor = db.cursor()

    cursor.execute(
        "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
        (data['name'], data['email'], data['password'])
    )
    db.commit()

    return jsonify({"message": "User registered"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM users WHERE email=%s AND password=%s",
        (data['email'], data['password'])
    )

    user = cursor.fetchone()

    if user:
        token = jwt.encode({
            "id": user["id"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        }, SECRET_KEY, algorithm="HS256")

        return jsonify({"token": token})
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@app.route('/api/profile', methods=['GET'])
def profile():
    token = request.headers.get("Authorization")

    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        cursor = db.cursor(dictionary=True)

        cursor.execute("SELECT id, email FROM users WHERE id=%s", (data["id"],))
        user = cursor.fetchone()

        return jsonify({"user": user})
    except Exception:
        return jsonify({"message": "Unauthorized"}), 401

# -----------------------------
# MENTOR ROUTES
# -----------------------------

@app.route('/api/be-mentor', methods=['POST'])
def be_mentor():
    data = request.json
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO mentors (user_id, name, email, skills, experience, bio, availability, contact)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        data['user_id'],
        data['name'],
        data['email'],
        data['skills'],
        data['experience'],
        data['bio'],
        data['availability'],
        data['contact']
    ))
    db.commit()

    return jsonify({"message": "Mentor profile created successfully"})

@app.route('/api/find-mentor', methods=['GET'])
def find_mentor():
    skill = request.args.get('skill')
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM mentors WHERE skills LIKE %s", ('%' + skill + '%',))
    mentors = cursor.fetchall()

    return jsonify(mentors)

@app.route('/api/mentors', methods=['GET'])
def get_mentors():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM mentors")
    mentors = cursor.fetchall()
    return jsonify(mentors)

# -----------------------------
# REAL AI MATCHING ROUTE
# -----------------------------

@app.route('/api/match-mentors', methods=['POST'])
def match_mentors():
    data = request.json

    learner_skills = data.get("skills", [])
    learner_goals = data.get("goals", "")
    learner_availability = data.get("availability", "")

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM mentors")
    mentors = cursor.fetchall()

    matched = []

    learner_text = " ".join(learner_skills) + " " + learner_goals + " " + learner_availability

    for mentor in mentors:
        mentor_skills = mentor["skills"].split(",") if mentor.get("skills") else []

        mentor_text = (
            (mentor.get("skills") or "") + " " +
            (mentor.get("bio") or "") + " " +
            (mentor.get("availability") or "")
        )

        # Skill score
        skill_score = skill_match_score(learner_skills, mentor_skills)

        # Semantic score
        semantic_score = semantic_similarity_score(learner_text, mentor_text)

        # Updated trust score (with likes + sessions)
        trust = trust_score(
            avg_rating=float(mentor.get("avg_rating", 4.0)),
            review_count=int(mentor.get("review_count", 5)),
            response_rate=float(mentor.get("response_rate", 80)),
            completion_rate=float(mentor.get("completion_rate", 85)),
            likes=int(mentor.get("likes", 0)),
            total_sessions=int(mentor.get("total_sessions", 0))
        )

        match_score = final_match_score(skill_score, semantic_score, trust)

        mentor["skill_score"] = float(skill_score)
        mentor["semantic_score"] = float(semantic_score)
        mentor["trust_score"] = float(trust)
        mentor["match_score"] = float(match_score)

        matched.append(mentor)

    # 🔥 IMPORTANT: always return response
    matched.sort(key=lambda x: x["match_score"], reverse=True)

    return jsonify(matched)
# -----------------------------
# OTHER ROUTES
# -----------------------------

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.json
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO contact_messages (name, email, subject, message)
        VALUES (%s, %s, %s, %s)
    """, (
        data['name'],
        data['email'],
        data['subject'],
        data['message']
    ))
    db.commit()

    return jsonify({"message": "Message sent successfully"})

@app.route('/api/team', methods=['GET'])
def team():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM team_members")
    members = cursor.fetchall()
    return jsonify(members)

@app.route('/api/save-learner-preferences', methods=['POST'])
def save_learner_preferences():
    data = request.json
    cursor = db.cursor()

    skills_text = ", ".join(data.get("skills", []))

    cursor.execute("""
        INSERT INTO learner_preferences (user_id, learning_skills, goals, preferred_availability)
        VALUES (%s, %s, %s, %s)
    """, (
        data.get("user_id"),
        skills_text,
        data.get("goals", ""),
        data.get("availability", "")
    ))
    db.commit()

    return jsonify({"message": "Learner preferences saved successfully"})


if __name__ == "__main__":
    app.run(debug=True)