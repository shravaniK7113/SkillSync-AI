from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import mysql.connector
from mysql.connector import Error
import jwt
import datetime
import bcrypt
from dotenv import load_dotenv
import os

# Load env
load_dotenv()

print("SKILLSYNC EXCHANGE BACKEND LOADED")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

# Secret key
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")


# -----------------------------
# DB CONNECTION
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


# -----------------------------
# TEST ROUTE
# -----------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "SkillSync backend is running"})


# -----------------------------
# SOCKET EVENTS (KEEPING YOUR ORIGINAL)
# -----------------------------
@socketio.on("join-call")
def handle_join_call(data):
    room = data.get("room")
    user_name = data.get("user_name", "User")

    if not room:
        return

    join_room(room)
    emit("user-joined", {"user_name": user_name}, room=room, include_self=False)


@socketio.on("leave-call")
def handle_leave_call(data):
    room = data.get("room")

    if not room:
        return

    leave_room(room)


# -----------------------------
# RUN APP
# -----------------------------
if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)