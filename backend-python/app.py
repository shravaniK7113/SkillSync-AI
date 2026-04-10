from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import jwt
import datetime
import bcrypt

print("NEW APP LOADED")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

app.config["SECRET_KEY"] = "skillsync_super_secret_key_2026_secure_token"


# -----------------------------
# DB CONNECTION HELPER
# -----------------------------
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1234@7",
            database="skillsync"
        )
        return connection
    except Error as e:
        print("DATABASE CONNECTION ERROR:", str(e))
        return None


# -----------------------------
# TEST ROUTE
# -----------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "SkillSync backend is running"})


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
    learner_words = set(learner_text.lower().split())
    mentor_words = set(mentor_text.lower().split())

    if not learner_words:
        return 0.0

    common = learner_words.intersection(mentor_words)
    score = (len(common) / len(learner_words)) * 100
    return float(round(score, 2))

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
@app.route("/api/users/register", methods=["POST"])
def register():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Register failed", "error": "MySQL Connection not available"}), 500

        data = request.get_json()

        if not data:
            return jsonify({"message": "No data received"}), 400

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        role = "user"

        if not name or not email or not password:
            return jsonify({"message": "Name, email and password are required"}), 400

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        cursor.close()
        cursor = None

        if existing_user:
            return jsonify({"message": "User already exists"}), 400

        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            (name, email, hashed_password, role)
        )
        db.commit()

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        print("REGISTER ERROR:", str(e))
        return jsonify({"message": "Register failed", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/users/login", methods=["POST"])
def login():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Login failed", "error": "MySQL Connection not available"}), 500

        data = request.get_json()

        if not data:
            return jsonify({"message": "No data received"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "Invalid credentials"}), 401

        stored_password = user["password"]

        if stored_password.startswith("$2b$") or stored_password.startswith("$2a$"):
            if not bcrypt.checkpw(password.encode("utf-8"), stored_password.encode("utf-8")):
                return jsonify({"message": "Invalid credentials"}), 401
        else:
            if password != stored_password:
                return jsonify({"message": "Invalid credentials"}), 401

        token = jwt.encode(
            {
                "user_id": user["id"],
                "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=2)
            },
            app.config["SECRET_KEY"],
            algorithm="HS256"
        )

        return jsonify({"token": token})

    except Exception as e:
        print("LOGIN ERROR:", str(e))
        return jsonify({"message": "Login failed", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/profile", methods=["GET"])
def profile():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Profile fetch failed", "error": "MySQL Connection not available"}), 500

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"message": "Token missing"}), 401

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            token = auth_header

        data = jwt.decode(
            token,
            app.config["SECRET_KEY"],
            algorithms=["HS256"]
        )
        user_id = data["user_id"]

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute(
            "SELECT id, name, email, role FROM users WHERE id = %s",
            (user_id,)
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "User not found"}), 404

        return jsonify({"user": user})

    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401
    except Exception as e:
        print("PROFILE ERROR:", str(e))
        return jsonify({"message": "Profile fetch failed", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# -----------------------------
# MENTOR ROUTES
# -----------------------------
@app.route("/api/be-mentor", methods=["POST"])
def be_mentor():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to create mentor profile", "error": "MySQL Connection not available"}), 500

        data = request.get_json()
        user_id = data.get("user_id")

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT * FROM mentors WHERE user_id = %s", (user_id,))
        existing_mentor = cursor.fetchone()
        cursor.close()
        cursor = None

        if existing_mentor:
            return jsonify({"message": "User is already a mentor"}), 400

        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO mentors (user_id, name, email, skills, experience, bio, availability, contact)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data["user_id"],
            data["name"],
            data["email"],
            data["skills"],
            data["experience"],
            data["bio"],
            data["availability"],
            data["contact"]
        ))

        cursor.execute("""
            UPDATE users
            SET role = 'mentor'
            WHERE id = %s
        """, (data["user_id"],))

        db.commit()

        return jsonify({"message": "Mentor profile created successfully"}), 201

    except Exception as e:
        print("BE MENTOR ERROR:", str(e))
        return jsonify({"message": "Failed to create mentor profile", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/find-mentor", methods=["GET"])
def find_mentor():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to find mentors", "error": "MySQL Connection not available"}), 500

        skill = request.args.get("skill", "")
        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT * FROM mentors WHERE skills LIKE %s", ('%' + skill + '%',))
        mentors = cursor.fetchall()

        return jsonify(mentors)

    except Exception as e:
        print("FIND MENTOR ERROR:", str(e))
        return jsonify({"message": "Failed to find mentors", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/mentors", methods=["GET"])
def get_mentors():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to get mentors", "error": "MySQL Connection not available"}), 500

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT * FROM mentors")
        mentors = cursor.fetchall()
        return jsonify(mentors)

    except Exception as e:
        print("GET MENTORS ERROR:", str(e))
        return jsonify({"message": "Failed to get mentors", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/like-mentor", methods=["POST"])
def like_mentor():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to like mentor", "error": "MySQL Connection not available"}), 500

        data = request.get_json()
        mentor_id = data.get("mentor_id")

        cursor = db.cursor()
        cursor.execute("""
            UPDATE mentors
            SET likes = likes + 1
            WHERE id = %s
        """, (mentor_id,))
        db.commit()

        return jsonify({"message": "Mentor liked successfully"})

    except Exception as e:
        print("LIKE MENTOR ERROR:", str(e))
        return jsonify({"message": "Failed to like mentor", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# -----------------------------
# MATCHING ROUTE
# -----------------------------
@app.route("/api/match-mentors", methods=["POST"])
def match_mentors():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to match mentors", "error": "MySQL Connection not available"}), 500

        data = request.get_json()

        learner_skills = data.get("skills", [])
        learner_goals = data.get("goals", "")
        learner_availability = data.get("availability", "")

        cursor = db.cursor(dictionary=True, buffered=True)
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

            skill_score = skill_match_score(learner_skills, mentor_skills)
            semantic_score = semantic_similarity_score(learner_text, mentor_text)

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

        matched.sort(key=lambda x: x["match_score"], reverse=True)

        return jsonify(matched)

    except Exception as e:
        print("MATCH MENTORS ERROR:", str(e))
        return jsonify({"message": "Failed to match mentors", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# -----------------------------
# OTHER ROUTES
# -----------------------------
@app.route("/api/contact", methods=["POST"])
def contact():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to send contact message", "error": "MySQL Connection not available"}), 500

        data = request.get_json()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO contact_messages (name, email, subject, message)
            VALUES (%s, %s, %s, %s)
        """, (
            data["name"],
            data["email"],
            data["subject"],
            data["message"]
        ))
        db.commit()

        return jsonify({"message": "Message sent successfully"})

    except Exception as e:
        print("CONTACT ERROR:", str(e))
        return jsonify({"message": "Failed to send contact message", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/team", methods=["GET"])
def team():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to fetch team members", "error": "MySQL Connection not available"}), 500

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT * FROM team_members")
        members = cursor.fetchall()
        return jsonify(members)

    except Exception as e:
        print("TEAM ERROR:", str(e))
        return jsonify({"message": "Failed to fetch team members", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/save-learner-preferences", methods=["POST"])
def save_learner_preferences():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to save learner preferences", "error": "MySQL Connection not available"}), 500

        data = request.get_json()
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

    except Exception as e:
        print("SAVE LEARNER PREFERENCES ERROR:", str(e))
        return jsonify({"message": "Failed to save learner preferences", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# -----------------------------
# CONNECTION REQUEST SYSTEM
# -----------------------------
@app.route("/api/send-request", methods=["POST"])
def send_request():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to send request", "error": "MySQL Connection not available"}), 500

        data = request.get_json()
        learner_id = data.get("learner_id")
        mentor_id = data.get("mentor_id")

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("""
            SELECT * FROM connection_requests
            WHERE learner_id = %s AND mentor_id = %s
        """, (learner_id, mentor_id))
        existing = cursor.fetchone()
        cursor.close()
        cursor = None

        if existing:
            return jsonify({"message": "Request already sent"}), 400

        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO connection_requests (learner_id, mentor_id, status)
            VALUES (%s, %s, %s)
        """, (learner_id, mentor_id, "pending"))
        db.commit()

        return jsonify({"message": "Connection request sent successfully"})

    except Exception as e:
        print("SEND REQUEST ERROR:", str(e))
        return jsonify({"message": "Failed to send request", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/mentor-requests/<int:user_id>", methods=["GET"])
def mentor_requests(user_id):
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to fetch mentor requests", "error": "MySQL Connection not available"}), 500

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT id FROM mentors WHERE user_id = %s", (user_id,))
        mentor = cursor.fetchone()
        cursor.close()
        cursor = None

        if not mentor:
            return jsonify({"message": "Mentor profile not found"}), 404

        mentor_id = mentor["id"]

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("""
            SELECT cr.id, cr.learner_id, cr.mentor_id, cr.status, cr.created_at,
                   u.name AS learner_name, u.email AS learner_email
            FROM connection_requests cr
            JOIN users u ON cr.learner_id = u.id
            WHERE cr.mentor_id = %s
            ORDER BY cr.created_at DESC
        """, (mentor_id,))

        requests = cursor.fetchall()
        return jsonify(requests)

    except Exception as e:
        print("MENTOR REQUESTS ERROR:", str(e))
        return jsonify({"message": "Failed to fetch mentor requests", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/update-request-status", methods=["POST"])
def update_request_status():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to update request status", "error": "MySQL Connection not available"}), 500

        data = request.get_json()
        request_id = data.get("request_id")
        status = data.get("status")

        if status not in ["accepted", "rejected"]:
            return jsonify({"message": "Invalid status"}), 400

        cursor = db.cursor()
        cursor.execute("""
            UPDATE connection_requests
            SET status = %s
            WHERE id = %s
        """, (status, request_id))
        db.commit()

        return jsonify({"message": f"Request {status} successfully"})

    except Exception as e:
        print("UPDATE REQUEST STATUS ERROR:", str(e))
        return jsonify({"message": "Failed to update request status", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/my-mentor-profile/<int:user_id>", methods=["GET"])
def my_mentor_profile(user_id):
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to fetch mentor profile", "error": "MySQL Connection not available"}), 500

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT * FROM mentors WHERE user_id = %s", (user_id,))
        mentor = cursor.fetchone()

        if not mentor:
            return jsonify({"isMentor": False, "mentor": None})

        return jsonify({"isMentor": True, "mentor": mentor})

    except Exception as e:
        print("MY MENTOR PROFILE ERROR:", str(e))
        return jsonify({"message": "Failed to fetch mentor profile", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/learner-requests/<int:learner_id>", methods=["GET"])
def learner_requests(learner_id):
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to fetch learner requests", "error": "MySQL Connection not available"}), 500

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("""
            SELECT cr.id, cr.learner_id, cr.mentor_id, cr.status, cr.created_at,
                   m.name AS mentor_name, m.email AS mentor_email, m.skills
            FROM connection_requests cr
            JOIN mentors m ON cr.mentor_id = m.id
            WHERE cr.learner_id = %s
            ORDER BY cr.created_at DESC
        """, (learner_id,))

        requests = cursor.fetchall()
        return jsonify(requests)

    except Exception as e:
        print("LEARNER REQUESTS ERROR:", str(e))
        return jsonify({"message": "Failed to fetch learner requests", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)