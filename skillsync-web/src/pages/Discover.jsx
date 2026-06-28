import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import "./Discover.css";

function Discover() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/users/discover");

      setUsers(res.data || []);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (receiverId) => {
    try {
      await api.post("/api/send-request", {
        receiver_id: receiverId,
      });

      setSentRequests((prev) => [...prev, receiverId]);

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to send connection request"
      );
    }
  };

  return (
    <>
      <Navbar />

      <div className="discover-page">
        <div className="discover-shell">
          <div className="discover-top">
            <span className="discover-badge">
              ✨ SkillSync Network
            </span>

            <h1>
              Find Skilled People & Build Connections 🤝
            </h1>

            <p>
              Connect with people, exchange skills,
              learn together, chat in real-time and
              grow your professional network.
            </p>
          </div>

          {loading ? (
            <div className="empty-state-card">
              <h2>Loading users...</h2>
              <p>Please wait while we find people for you ✨</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state-card">
              <h2>No users found</h2>

              <p>
                No other users are currently available on
                SkillSync.
              </p>

              <button
                className="refresh-btn"
                onClick={fetchUsers}
              >
                Refresh Discover
              </button>
            </div>
          ) : (
            <div className="matches-grid">
              {users.map((currentUser) => {
                const skillsHave = currentUser?.skills_have
                  ? currentUser.skills_have
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean)
                  : [];

                return (
                  <div
                    className="user-card"
                    key={currentUser.id}
                  >
                    <div className="user-avatar">
                      {(currentUser.name || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="card-header">
                      <div className="card-header-left">
                        <h2>{currentUser.name}</h2>

                        <p className="mini-text">
                          Skill Exchange Profile
                        </p>
                      </div>

                      <span className="match-score">
                        {currentUser.match_score || 0}% Match ✨
                      </span>
                    </div>

                    <p className="bio">
                      {currentUser.bio ||
                        "No bio added yet 🌸"}
                    </p>

                    <div className="section-block">
                      <h3>Skills Offered</h3>

                      <div className="skills">
                        {skillsHave.length > 0 ? (
                          skillsHave.map((skill, i) => (
                            <span
                              key={i}
                              className="skill-tag"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="skill-empty">
                            No skills added
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="section-block">
                      <h3>Wants To Learn</h3>

                      <p className="wants">
                        {currentUser.skills_want ||
                          "No learning goals added yet"}
                      </p>
                    </div>

                    <div className="actions">
                      {sentRequests.includes(
                        currentUser.id
                      ) ? (
                        <button
                          className="btn like"
                          disabled
                        >
                          ✅ Request Sent
                        </button>
                      ) : (
                        <button
                          className="btn like"
                          onClick={() =>
                            sendRequest(
                              currentUser.id
                            )
                          }
                        >
                          🤝 Connect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Discover;