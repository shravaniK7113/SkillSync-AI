from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import mysql.connector
from mysql.connector import Error
import jwt
import datetime
import bcrypt
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from flask import send_from_directory
import os

load_dotenv()

print("SKILLSYNC EXCHANGE BACKEND LOADED")

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

from flask_mail import Mail, Message

app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")

mail = Mail(app)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

CORS(app, resources={r"/api/*": {"origins": frontend_url}})
socketio = SocketIO(app, cors_allowed_origins=frontend_url)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")


# -----------------------------
# DB CONNECTION HELPER
# -----------------------------
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        return connection
    except Error as e:
        print("DATABASE CONNECTION ERROR:", str(e))
        return None


# -----------------------------
# AUTH HELPER
# -----------------------------
def get_user_from_token():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None, jsonify({"message": "Token missing"}), 401

    try:
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            token = auth_header

        data = jwt.decode(
            token,
            app.config["SECRET_KEY"],
            algorithms=["HS256"]
        )
        return data["user_id"], None, None

    except jwt.ExpiredSignatureError:
        return None, jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return None, jsonify({"message": "Invalid token"}), 401



def create_notification(db, user_id, notif_type, message):
    cursor = None

    try:
        cursor = db.cursor()

        print("Creating notification:")
        print("user_id =", user_id)
        print("type =", notif_type)
        print("message =", message)

        cursor.execute(
            """
            INSERT INTO notifications (user_id, type, message)
            VALUES (%s, %s, %s)
            """,
            (user_id, notif_type, message)
        )

        db.commit()

        print("Notification inserted successfully")

    except Exception as e:
        print("========== NOTIFICATION ERROR ==========")
        print(str(e))
        print("========================================")

    finally:
        if cursor:
            cursor.close()

# -----------------------------
# SKILL HELPERS
# -----------------------------
skill_map = {
    "ai": "artificial intelligence",
    "ml": "machine learning",
    "web dev": "web development",
    "frontend": "front end development",
    "backend": "back end development",
    "js": "javascript",
    "py": "python"
}

def normalize_skill(skill):
    skill = skill.strip().lower()
    return skill_map.get(skill, skill)

def parse_skills(skills_text):
    if not skills_text:
        return []
    return [
        normalize_skill(skill)
        for skill in skills_text.split(",")
        if skill.strip()
    ]

def calculate_match_score(my_have, my_want, other_have, other_want):
    my_have_set = set(parse_skills(my_have))
    my_want_set = set(parse_skills(my_want))
    other_have_set = set(parse_skills(other_have))
    other_want_set = set(parse_skills(other_want))

    if not my_have_set and not my_want_set:
        return 0.0

    want_match = len(my_want_set.intersection(other_have_set))
    give_match = len(my_have_set.intersection(other_want_set))

    total_expected = len(my_want_set) + len(other_want_set)
    total_found = want_match + give_match

    if total_expected == 0:
        return 0.0

    return round((total_found / total_expected) * 100, 2)


# -----------------------------
# MATCH / CHAT HELPERS
# -----------------------------
def are_users_matched(db, user_a, user_b):
    cursor = None
    try:
        user1_id = min(int(user_a), int(user_b))
        user2_id = max(int(user_a), int(user_b))

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute(
            """
            SELECT id FROM matches
            WHERE user1_id = %s AND user2_id = %s
            """,
            (user1_id, user2_id)
        )
        match = cursor.fetchone()
        return match is not None
    finally:
        if cursor:
            cursor.close()


# -----------------------------
# TEST ROUTE
# -----------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "SkillSync skill exchange backend is running"})


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
            return jsonify({"message": "Register failed", "error": "MySQL connection not available"}), 500

        data = request.get_json()

        if not data:
            return jsonify({"message": "No data received"}), 400

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()
        bio = data.get("bio", "").strip()
        skills_have = data.get("skills_have", "").strip()
        skills_want = data.get("skills_want", "").strip()
        role = "user"

        if not name or not email or not password:
            return jsonify({"message": "Name, email and password are required"}), 400

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        cursor.close()
        cursor = None

        if existing_user:
            return jsonify({"message": "User already exists"}), 400

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO users (name, email, password, role, bio, skills_have, skills_want)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (name, email, hashed_password, role, bio, skills_have, skills_want)
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
            return jsonify({"message": "Login failed", "error": "MySQL connection not available"}), 500

        data = request.get_json()

        if not data:
            return jsonify({"message": "No data received"}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "").strip()

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
                "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=12)
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


# -----------------------------
# PROFILE ROUTES
# -----------------------------
@app.route("/api/profile", methods=["GET"])
def profile():
    db = None
    cursor = None
    try:
        user_id, error_response, status_code = get_user_from_token()
        if error_response:
            return error_response, status_code

        db = get_db_connection()
        if not db:
            return jsonify({"message": "Profile fetch failed", "error": "MySQL connection not available"}), 500

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute(
            """
            SELECT id, name, email, role, bio, skills_have, skills_want
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "User not found"}), 404

        return jsonify({"user": user})

    except Exception as e:
        print("PROFILE ERROR:", str(e))
        return jsonify({"message": "Profile fetch failed", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/users/update-profile", methods=["PUT"])
def update_profile():
    db = None
    cursor = None
    try:
        user_id, error_response, status_code = get_user_from_token()
        if error_response:
            return error_response, status_code

        db = get_db_connection()
        if not db:
            return jsonify({"message": "Profile update failed", "error": "MySQL connection not available"}), 500

        data = request.get_json()

        name = data.get("name", "").strip()
        bio = data.get("bio", "").strip()
        skills_have = data.get("skills_have", "").strip()
        skills_want = data.get("skills_want", "").strip()

        if not name:
            return jsonify({"message": "Name is required"}), 400

        cursor = db.cursor()
        cursor.execute(
            """
            UPDATE users
            SET name = %s, bio = %s, skills_have = %s, skills_want = %s
            WHERE id = %s
            """,
            (name, bio, skills_have, skills_want, user_id)
        )
        db.commit()

        return jsonify({"message": "Profile updated successfully"})

    except Exception as e:
        print("UPDATE PROFILE ERROR:", str(e))
        return jsonify({"message": "Profile update failed", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# -----------------------------
# DISCOVER USERS ROUTE
# -----------------------------
@app.route("/api/users/discover", methods=["GET"])
def discover_users():
    db = None
    cursor = None
    try:
        user_id, error_response, status_code = get_user_from_token()
        if error_response:
            return error_response, status_code

        db = get_db_connection()
        if not db:
            return jsonify({
                "message": "Failed to discover users",
                "error": "MySQL connection not available"
            }), 500

        cursor = db.cursor(dictionary=True, buffered=True)

        # Get current user
        cursor.execute(
            """
            SELECT id, name, email, bio, skills_have, skills_want
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )
        current_user = cursor.fetchone()

        if not current_user:
            return jsonify({"message": "Current user not found"}), 404

        # Get ALL other users (NO swipe filtering)
        cursor.execute(
            """
            SELECT id, name, email, bio, skills_have, skills_want
            FROM users
            WHERE id != %s
            """,
            (user_id,)
        )

        users = cursor.fetchall()

        result = []

        for other_user in users:
            match_score = calculate_match_score(
                current_user.get("skills_have", ""),
                current_user.get("skills_want", ""),
                other_user.get("skills_have", ""),
                other_user.get("skills_want", "")
            )

            other_user["match_score"] = match_score
            result.append(other_user)

        result.sort(key=lambda x: x["match_score"], reverse=True)

        return jsonify(result)

    except Exception as e:
        print("DISCOVER USERS ERROR:", str(e))
        return jsonify({
            "message": "Failed to discover users",
            "error": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()

# -----------------------------
# SWIPE ROUTE
# -----------------------------
@app.route("/api/swipe", methods=["POST"])
def swipe_user():
    db = None
    cursor = None

    try:
        user_id, error_response, status_code = get_user_from_token()
        if error_response:
            return error_response, status_code

        db = get_db_connection()
        if not db:
            return jsonify({
                "message": "Swipe failed",
                "error": "MySQL connection not available"
            }), 500

        data = request.get_json()
        to_user_id = data.get("to_user_id")
        action = data.get("action")

        if not to_user_id or action not in ["like", "pass"]:
            return jsonify({"message": "Invalid swipe data"}), 400

        if int(to_user_id) == int(user_id):
            return jsonify({"message": "You cannot swipe on yourself"}), 400

        cursor = db.cursor(dictionary=True, buffered=True)

        cursor.execute(
            """
            SELECT id
            FROM swipes
            WHERE from_user_id = %s
            AND to_user_id = %s
            """,
            (user_id, to_user_id)
        )

        existing_swipe = cursor.fetchone()

        if existing_swipe:
            cursor.close()

            cursor = db.cursor()

            cursor.execute(
                """
                UPDATE swipes
                SET action = %s
                WHERE from_user_id = %s
                AND to_user_id = %s
                """,
                (action, user_id, to_user_id)
            )
        else:
            cursor.close()

            cursor = db.cursor()

            cursor.execute(
                """
                INSERT INTO swipes
                (from_user_id, to_user_id, action)
                VALUES (%s, %s, %s)
                """,
                (user_id, to_user_id, action)
            )

        db.commit()

        if action == "pass":
            return jsonify({
                "matched": False,
                "message": "User skipped"
            })

        cursor = db.cursor(dictionary=True, buffered=True)

        cursor.execute(
            """
            SELECT id
            FROM swipes
            WHERE from_user_id = %s
            AND to_user_id = %s
            AND action = 'like'
            """,
            (to_user_id, user_id)
        )

        reverse_like = cursor.fetchone()

        if reverse_like:

            user1_id = min(int(user_id), int(to_user_id))
            user2_id = max(int(user_id), int(to_user_id))

            cursor.execute(
                """
                SELECT id
                FROM matches
                WHERE user1_id = %s
                AND user2_id = %s
                """,
                (user1_id, user2_id)
            )

            existing_match = cursor.fetchone()

            if not existing_match:

                cursor.close()

                cursor = db.cursor()

                cursor.execute(
                    """
                    INSERT INTO matches (user1_id, user2_id)
                    VALUES (%s, %s)
                    """,
                    (user1_id, user2_id)
                )

                db.commit()

                create_notification(
                    db,
                    user_id,
                    "match",
                    f"You matched with user {to_user_id}"
                )

                create_notification(
                    db,
                    to_user_id,
                    "match",
                    f"You matched with user {user_id}"
                )

            return jsonify({
                "matched": True,
                "message": "It's a match!"
            })

        return jsonify({
            "matched": False,
            "message": "Interest saved"
        })

    except Exception as e:
        print("SWIPE ERROR:", str(e))
        return jsonify({
            "message": "Swipe failed",
            "error": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()

@app.route("/api/send-request", methods=["POST"])
def send_request():

    db = None
    cursor = None

    try:
        user_id, error_response, status_code = get_user_from_token()

        if error_response:
            return error_response, status_code

        receiver_id = request.json.get("receiver_id")

        db = get_db_connection()

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT *
            FROM user_connections
            WHERE sender_id=%s
            AND receiver_id=%s
            """,
            (user_id, receiver_id)
        )

        existing = cursor.fetchone()

        if existing:
            return jsonify({"message": "Request already sent"}), 400

        cursor.close()

        cursor = db.cursor()

        cursor.execute(
            """
            INSERT INTO user_connections
            (sender_id, receiver_id, status)
            VALUES (%s,%s,'pending')
            """,
            (user_id, receiver_id)
        )

        db.commit()

        cursor.close()

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT name
            FROM users
            WHERE id=%s
            """,
            (user_id,)
        )

        sender = cursor.fetchone()

        create_notification(
            db,
            receiver_id,
            "connection_request",
            f"🤝 {sender['name']} sent you a connection request"
        )

        # EMAIL NOTIFICATION

        cursor.execute(
            """
            SELECT email
            FROM users
            WHERE id=%s
            """,
            (receiver_id,)
        )

        receiver = cursor.fetchone()

        if receiver and receiver.get("email"):
            try:
                msg = Message(
                    subject="New Connection Request on SkillSync",
                    sender=os.getenv("MAIL_USERNAME"),
                    recipients=[receiver["email"]]
                )

                msg.body = f"""
Hi,

{sender['name']} has sent you a connection request on SkillSync.

Log in to SkillSync and visit the Requests page to respond.

Regards,
SkillSync Team
"""

                mail.send(msg)

            except Exception as mail_error:
                print("Email Error:", mail_error)

        return jsonify({"message": "Request sent"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()
@app.route("/api/received-requests", methods=["GET"])
def received_requests():

    db = None
    cursor = None

    try:
        user_id, error_response, status_code = get_user_from_token()

        if error_response:
            return error_response, status_code

        db = get_db_connection()

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                uc.id,
                u.id as sender_id,
                u.name,
                u.bio,
                u.skills_have,
                u.skills_want
            FROM user_connections uc
            JOIN users u
                ON uc.sender_id = u.id
            WHERE uc.receiver_id=%s
            AND uc.status='pending'
            """,
            (user_id,)
        )

        return jsonify(cursor.fetchall())

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()

@app.route("/api/accept-request", methods=["POST"])
def accept_request():

    db = None
    cursor = None

    try:
        user_id, error_response, status_code = get_user_from_token()

        if error_response:
            return error_response, status_code

        request_id = request.json.get("request_id")

        db = get_db_connection()

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT *
            FROM user_connections
            WHERE id=%s
            """,
            (request_id,)
        )

        req = cursor.fetchone()

        if not req:
            return jsonify({"message": "Request not found"}), 404

        cursor.close()

        cursor = db.cursor()

        cursor.execute(
            """
            UPDATE user_connections
            SET status='accepted'
            WHERE id=%s
            """,
            (request_id,)
        )

        user1 = min(req["sender_id"], req["receiver_id"])
        user2 = max(req["sender_id"], req["receiver_id"])

        cursor.execute(
            """
            INSERT INTO matches(user1_id, user2_id)
            VALUES(%s, %s)
            """,
            (user1, user2)
        )

        db.commit()

        cursor.close()

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            "SELECT name, email FROM users WHERE id=%s",
            (req["receiver_id"],)
        )
        receiver = cursor.fetchone()

        cursor.execute(
            "SELECT name, email FROM users WHERE id=%s",
            (req["sender_id"],)
        )
        sender = cursor.fetchone()

        create_notification(
            db,
            req["sender_id"],
            "match",
            f"🎉 You matched with {receiver['name']}"
        )

        create_notification(
            db,
            req["receiver_id"],
            "match",
            f"🎉 You matched with {sender['name']}"
        )

        # EMAIL TO ORIGINAL REQUEST SENDER

        if sender and sender.get("email"):
            try:
                msg = Message(
                    subject="Your SkillSync Request Was Accepted 🎉",
                    sender=os.getenv("MAIL_USERNAME"),
                    recipients=[sender["email"]]
                )

                msg.body = f"""
Hi {sender['name']},

Great news!

{receiver['name']} has accepted your connection request on SkillSync.

You can now chat, connect and start exchanging skills.

Regards,
SkillSync Team
"""

                mail.send(msg)

            except Exception as mail_error:
                print("Email Error:", mail_error)

        return jsonify({"message": "Request accepted"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()@app.route("/api/reject-request", methods=["POST"])
def reject_request():

    db = None
    cursor = None

    try:
        user_id, error_response, status_code = get_user_from_token()

        if error_response:
            return error_response, status_code

        request_id = request.json.get("request_id")

        db = get_db_connection()

        cursor = db.cursor()

        cursor.execute(
            """
            UPDATE user_connections
            SET status='rejected'
            WHERE id=%s
            """,
            (request_id,)
        )

        db.commit()

        return jsonify({"message":"Request rejected"})

    except Exception as e:
        return jsonify({"error":str(e)}),500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()


# -----------------------------
# MATCHES ROUTE
# -----------------------------
@app.route("/api/matches", methods=["GET"])
def get_matches():
    db = None
    cursor = None
    try:
        user_id, error_response, status_code = get_user_from_token()
        if error_response:
            return error_response, status_code

        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to fetch matches", "error": "MySQL connection not available"}), 500

        cursor = db.cursor(dictionary=True, buffered=True)

        cursor.execute(
            """
            SELECT 
                u.id,
                u.name,
                u.email,
                u.bio,
                u.skills_have,
                u.skills_want,
                (
                    SELECT COUNT(*)
                    FROM messages msg
                    WHERE msg.sender_id = u.id
                      AND msg.receiver_id = %s
                      AND msg.is_read = FALSE
                ) AS unread_count
            FROM matches m
            JOIN users u
              ON u.id = CASE
                  WHEN m.user1_id = %s THEN m.user2_id
                  ELSE m.user1_id
              END
            WHERE m.user1_id = %s OR m.user2_id = %s
            ORDER BY u.name
            """,
            (user_id, user_id, user_id, user_id)
        )

        matches = cursor.fetchall()
        return jsonify(matches)

    except Exception as e:
        print("GET MATCHES ERROR:", str(e))
        return jsonify({"message": "Failed to fetch matches", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# -----------------------------
# CHAT ROUTES
# -----------------------------
@app.route("/api/messages/<int:other_user_id>", methods=["GET"])
def get_messages(other_user_id):
    db = None
    cursor = None
    try:
        user_id, error_response, status_code = get_user_from_token()
        if error_response:
            return error_response, status_code

        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to fetch messages", "error": "MySQL connection not available"}), 500

        if not are_users_matched(db, user_id, other_user_id):
            return jsonify({"message": "Chat allowed only for matched users"}), 403

        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute(
            """
            SELECT
            id,
            sender_id,
            receiver_id,
            message_text,
            file_url,
            created_at
            FROM messages
            WHERE (sender_id = %s AND receiver_id = %s)
               OR (sender_id = %s AND receiver_id = %s)
            ORDER BY created_at ASC
            """,
            (user_id, other_user_id, other_user_id, user_id)
        )
        messages = cursor.fetchall()

        cursor.execute(
            """
            UPDATE messages
            SET is_read = TRUE
            WHERE sender_id = %s AND receiver_id = %s
            """,
            (other_user_id, user_id)
        )
        db.commit()

        return jsonify(messages)

    except Exception as e:
        print("GET MESSAGES ERROR:", str(e))
        return jsonify({"message": "Failed to fetch messages", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@app.route("/api/messages", methods=["POST"])
def send_message():
    db = None
    cursor = None
    try:
        user_id, error_response, status_code = get_user_from_token()
        if error_response:
            return error_response, status_code

        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to send message", "error": "MySQL connection not available"}), 500

        data = request.get_json()
        receiver_id = data.get("receiver_id")
        message_text = data.get("message_text", "").strip()
        file_url = data.get("file_url")

        if not receiver_id:
            return jsonify({"message": "receiver_id and message_text are required"}), 400

        if int(receiver_id) == int(user_id):
            return jsonify({"message": "You cannot send a message to yourself"}), 400

        if not are_users_matched(db, user_id, receiver_id):
            return jsonify({"message": "Chat allowed only for matched users"}), 403

        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO messages
            (sender_id, receiver_id, message_text, file_url)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, receiver_id, message_text, file_url)
        )
        db.commit()

        return jsonify({"message": "Message sent successfully"}), 201

    except Exception as e:
        print("SEND MESSAGE ERROR:", str(e))
        return jsonify({"message": "Failed to send message", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()

@app.route("/api/upload-chat-file", methods=["POST"])
def upload_chat_file():
    try:
        user_id, error_response, status_code = get_user_from_token()
        if error_response:
            return error_response, status_code

        if "file" not in request.files:
            return jsonify({"message": "No file selected"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"message": "No file selected"}), 400

        filename = secure_filename(file.filename)

        filepath = os.path.join(
            app.config["UPLOAD_FOLDER"],
            filename
        )

        file.save(filepath)

        return jsonify({
            "file_url": f"/uploads/{filename}",
            "file_name": filename
        }), 200

    except Exception as e:
        print("UPLOAD FILE ERROR:", str(e))
        return jsonify({
            "message": "Upload failed",
            "error": str(e)
        }), 500

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )

# -----------------------------
# CONTACT ROUTE
# -----------------------------
@app.route("/api/contact", methods=["POST"])
def contact():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to send contact message", "error": "MySQL connection not available"}), 500

        data = request.get_json()
        cursor = db.cursor()

        cursor.execute(
            """
            INSERT INTO contact_messages (name, email, subject, message)
            VALUES (%s, %s, %s, %s)
            """,
            (
                data["name"],
                data["email"],
                data["subject"],
                data["message"]
            )
        )
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


# -----------------------------
# TEAM ROUTE
# -----------------------------
@app.route("/api/team", methods=["GET"])
def team():
    db = None
    cursor = None
    try:
        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed to fetch team members", "error": "MySQL connection not available"}), 500

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


@app.route("/api/unread-count", methods=["GET"])
def get_unread_count():
    db = None
    cursor = None
    try:
        user_id, error_response, status_code = get_user_from_token()
        if error_response:
            return error_response, status_code

        db = get_db_connection()
        if not db:
            return jsonify({"message": "Failed", "error": "DB error"}), 500

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT COUNT(*) AS total_unread
            FROM messages
            WHERE receiver_id = %s AND is_read = FALSE
            """,
            (user_id,)
        )

        result = cursor.fetchone()

        return jsonify({
            "unread": result["total_unread"]
        })

    except Exception as e:
        print("UNREAD COUNT ERROR:", str(e))
        return jsonify({"message": "Error", "error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()

@app.route("/api/reviews", methods=["POST"])
def submit_review():
    db = None
    cursor = None

    try:
        user_id, error_response, status_code = get_user_from_token()

        if error_response:
            return error_response, status_code

        data = request.get_json()

        reviewed_user_id = data.get("reviewed_user_id")
        rating = data.get("rating")
        review_text = data.get("review_text", "").strip()

        if not reviewed_user_id or not rating:
            return jsonify({
                "message": "reviewed_user_id and rating are required"
            }), 400

        db = get_db_connection()

        if not db:
            return jsonify({
                "message": "Database connection failed"
            }), 500

        if not are_users_matched(db, user_id, reviewed_user_id):
            return jsonify({
                "message": "You can only review matched users"
            }), 403

        cursor = db.cursor()

        cursor.execute(
            """
            INSERT INTO reviews
            (reviewer_id, reviewed_user_id, rating, review_text)
            VALUES (%s, %s, %s, %s)
            """,
            (
                user_id,
                reviewed_user_id,
                rating,
                review_text
            )
        )

        db.commit()

        return jsonify({
            "message": "Review submitted successfully"
        }), 201

    except Exception as e:
        print("SUBMIT REVIEW ERROR:", str(e))
        return jsonify({
            "message": "Failed to submit review",
            "error": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()

@app.route("/api/reviews/<int:user_id>", methods=["GET"])
def get_reviews(user_id):
    db = None
    cursor = None

    try:
        db = get_db_connection()

        if not db:
            return jsonify([])

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                r.id,
                r.rating,
                r.review_text,
                r.created_at,
                u.name AS reviewer_name
            FROM reviews r
            JOIN users u
                ON r.reviewer_id = u.id
            WHERE r.reviewed_user_id = %s
            ORDER BY r.created_at DESC
            """,
            (user_id,)
        )

        reviews = cursor.fetchall()

        return jsonify(reviews)

    except Exception as e:
        print("GET REVIEWS ERROR:", str(e))
        return jsonify([])

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()


@app.route("/api/reviews/<int:user_id>/stats", methods=["GET"])
def review_stats(user_id):
    db = None
    cursor = None

    try:
        db = get_db_connection()

        if not db:
            return jsonify({
                "average_rating": 0,
                "total_reviews": 0
            })

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                ROUND(AVG(rating),1) AS average_rating,
                COUNT(*) AS total_reviews
            FROM reviews
            WHERE reviewed_user_id = %s
            """,
            (user_id,)
        )

        stats = cursor.fetchone()

        return jsonify({
            "average_rating": stats["average_rating"] or 0,
            "total_reviews": stats["total_reviews"] or 0
        })

    except Exception as e:
        print("REVIEW STATS ERROR:", str(e))

        return jsonify({
            "average_rating": 0,
            "total_reviews": 0
        })

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()




# -----------------------------
# NOTIFICATION ROUTES
# -----------------------------
@app.route("/api/notifications", methods=["GET"])
def get_notifications():

    db = None
    cursor = None

    try:
        user_id, error_response, status_code = get_user_from_token()

        if error_response:
            return error_response, status_code

        db = get_db_connection()

        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT *
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,)
        )

        notifications = cursor.fetchall()

        return jsonify(notifications)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()


@app.route("/api/notifications/read", methods=["POST"])
def mark_notifications_read():

    db = None
    cursor = None

    try:
        user_id, error_response, status_code = get_user_from_token()

        if error_response:
            return error_response, status_code

        db = get_db_connection()

        cursor = db.cursor()

        cursor.execute(
            """
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = %s
            """,
            (user_id,)
        )

        db.commit()

        return jsonify({"message": "Notifications marked as read"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()

        if db and db.is_connected():
            db.close()

@app.route("/api/test-email")
def test_email():
    try:
        msg = Message(
            subject="SkillSync Email Test",
            sender=os.getenv("MAIL_USERNAME"),
            recipients=[os.getenv("MAIL_USERNAME")]
        )

        msg.body = "Congratulations! SkillSync email notifications are working."

        mail.send(msg)

        return jsonify({"message": "Email sent successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# VIDEO CALL SOCKET EVENTS
# -----------------------------
@socketio.on("join-call")
def handle_join_call(data):
    room = data.get("room")
    user_name = data.get("user_name", "User")

    if not room:
        return

    join_room(room)
    emit("user-joined", {"user_name": user_name}, room=room, include_self=False)


@socketio.on("incoming-call")
def handle_incoming_call(data):
    room = data.get("room")
    caller_name = data.get("caller_name", "User")
    offer = data.get("offer")

    if not room:
        return

    emit(
        "incoming-call",
        {
            "caller_name": caller_name,
            "offer": offer,
        },
        room=room,
        include_self=False
    )


@socketio.on("accept-call")
def handle_accept_call(data):
    room = data.get("room")
    answer = data.get("answer")

    if not room:
        return

    emit("call-accepted", {"answer": answer}, room=room, include_self=False)


@socketio.on("reject-call")
def handle_reject_call(data):
    room = data.get("room")
    user_name = data.get("user_name", "User")

    if not room:
        return

    emit("call-rejected", {"user_name": user_name}, room=room, include_self=False)


@socketio.on("ice-candidate")
def handle_ice_candidate(data):
    room = data.get("room")
    candidate = data.get("candidate")

    if not room:
        return

    emit("ice-candidate", {"candidate": candidate}, room=room, include_self=False)


@socketio.on("leave-call")
def handle_leave_call(data):
    room = data.get("room")
    user_name = data.get("user_name", "User")

    if not room:
        return

    leave_room(room)
    emit("user-left", {"user_name": user_name}, room=room, include_self=False)


if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)