import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import "./Discover.css";

function Discover() {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [cardAction, setCardAction] = useState("");
  const [showMatchPopup, setShowMatchPopup] = useState(false);

  const token = localStorage.getItem("token");

  const isProfileIncomplete = (user) => {
    return !user?.skills_have?.trim() || !user?.skills_want?.trim();
  };

  const showToastMessage = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 2500);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage("");

      if (!token) {
        setMessage("Please login first.");
        setLoading(false);
        return;
      }

      const profileRes = await api.get("/api/profile");
      const currentUser = profileRes.data.user;

      localStorage.setItem("user", JSON.stringify(currentUser));

      if (isProfileIncomplete(currentUser)) {
        alert("Please complete your profile first");
        window.location.href = "/profile";
        return;
      }

      const res = await api.get("/api/users/discover");

      setUsers(res.data || []);
      setCurrentIndex(0);

      if (!res.data || res.data.length === 0) {
        setMessage("You’ve already viewed all available profiles. Check Matches or come back later.");
      }
    } catch (error) {
      console.error("Failed to fetch discover users:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Error loading users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const goToNextCard = () => {
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setCardAction("");
    }, 300);
  };

  const handleSwipe = async (action) => {
    try {
      if (!token) {
        showToastMessage("Please login first", "error");
        return;
      }

      const currentViewedUser = users[currentIndex];

      if (!currentViewedUser) return;

      const res = await api.post("/api/swipe", {
        to_user_id: currentViewedUser.id,
        action,
      });

      if (action === "like") {
        setCardAction("swipe-right");

        if (res.data.matched) {
          setShowMatchPopup(true);
          showToastMessage("It’s a match! Check your Matches page.", "success");

          setTimeout(() => {
            setShowMatchPopup(false);
          }, 1200);
        } else {
          showToastMessage(
            "Interest saved. You’ll match if they like you back.",
            "success"
          );
        }
      } else {
        setCardAction("swipe-left");
        showToastMessage("Profile skipped", "success");
      }

      goToNextCard();
    } catch (error) {
      console.error("Swipe failed:", error.response?.data || error.message);
      showToastMessage(error.response?.data?.message || "Action failed", "error");
    }
  };

  const currentViewedUser = users[currentIndex];

  return (
    <div>
      <Navbar />

      {toast.show && (
        <div className={`custom-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="match-page">
        <div className="match-container">
          <div className="match-header">
            <h2>Discover Skill Exchange Partners</h2>
            <p>Find people who have the skills you want and want the skills you have.</p>
          </div>

          {showMatchPopup && (
            <div className="match-popup">
              <span className="popup-icon">💙</span>
              <p>It’s a match! View it in Matches.</p>
            </div>
          )}

          {loading ? (
            <p className="status-text">Loading users...</p>
          ) : message ? (
            <p className="status-text">{message}</p>
          ) : users.length > 0 ? (
            currentIndex >= users.length ? (
              <div className="done-card">
                <h3>No more users</h3>
                <p>You have viewed all available profiles. Check your Matches page for mutual connections.</p>
              </div>
            ) : (
              <div className="swipe-card-wrapper">
                <div className={`mentor-match-card ${cardAction}`}>
                  <div className="match-badge">
                    {currentViewedUser.match_score || 0}% Match
                  </div>

                  <div className="mentor-avatar">
                    {currentViewedUser.name?.charAt(0).toUpperCase()}
                  </div>

                  <h3>{currentViewedUser.name}</h3>
                  <p className="mentor-role">Skill Exchange User</p>

                  <div className="mentor-details">
                    <p><strong>Bio:</strong> {currentViewedUser.bio || "No bio added"}</p>
                    <p><strong>Skills I Have:</strong> {currentViewedUser.skills_have || "Not added"}</p>
                    <p><strong>Skills I Want:</strong> {currentViewedUser.skills_want || "Not added"}</p>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    className="circle-btn skip-btn"
                    onClick={() => handleSwipe("pass")}
                  >
                    ✖
                  </button>

                  <button
                    className="connect-btn"
                    onClick={() => handleSwipe("like")}
                  >
                    💙 Interested
                  </button>
                </div>

                <p className="progress-text">
                  {currentIndex + 1} / {users.length}
                </p>
              </div>
            )
          ) : (
            <p className="status-text">No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Discover;