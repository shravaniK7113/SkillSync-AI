import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import "./Matches.css";

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
  }, []);

const submitReview = async () => {
  if (!selectedUser) return;

  try {
    setSubmittingReview(true);

    await api.post("/api/reviews", {
      reviewed_user_id: selectedUser.id,
      rating,
      review_text: reviewText,
    });

    alert("Review submitted successfully ⭐");

    setSelectedUser(null);
    setRating(5);
    setReviewText("");
  } catch (error) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
      "Failed to submit review"
    );
  } finally {
    setSubmittingReview(false);
  }
};

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/matches");
      setMatches(res.data || []);
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="matches-page">
        <div className="matches-shell">
          <div className="matches-top">
            <span className="matches-badge">💞 Your Connections</span>
            <h1>Your skill matches</h1>
            <p>
              These are the people who matched with you. Start chatting and
              exchange skills together.
            </p>
          </div>

          {loading ? (
            <div className="matches-empty-card">
              <h2>Loading matches...</h2>
              <p>Please wait while we bring your connections ✨</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="matches-empty-card">
              <h2>No matches yet 💔</h2>
              <p>
                Start discovering people and like profiles to create your first
                skill exchange match.
              </p>
              <button
                className="discover-btn"
                onClick={() => navigate("/discover")}
              >
                Go to Discover
              </button>
            </div>
          ) : (
            <div className="matches-grid">
              {matches.map((match) => {
                const skillsHave = match.skills_have
                  ? match.skills_have
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean)
                  : [];

                return (
                  <div key={match.id} className="match-card">
                    <div className="match-avatar">
                      {(match.name || "U").charAt(0).toUpperCase()}
                    </div>

                    <h2>{match.name}</h2>
                    <p className="match-bio">
                      {match.bio || "No bio added yet 🌸"}
                    </p>

                    <div className="match-skills">
                      {skillsHave.length > 0 ? (
                        skillsHave.slice(0, 4).map((skill, index) => (
                          <span key={index} className="match-skill-tag">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="match-skill-empty">No skills added</span>
                      )}
                    </div>

                    <p className="match-learn">
                      Wants to learn: {match.skills_want || "Not added yet"}
                    </p>

                    {Number(match.unread_count) > 0 && (
                      <div className="unread-pill">
                        {match.unread_count} new
                      </div>
                    )}

                    <div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  }}
>
  <button
    className="chat-now-btn"
    onClick={() => navigate(`/chat/${match.id}`)}
  >
    💬 Chat
  </button>

  <button
    className="chat-now-btn"
    style={{
      background:
        "linear-gradient(135deg,#f59e0b,#f97316)",
    }}
    onClick={() => setSelectedUser(match)}
  >
    ⭐ Review
  </button>
</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
{selectedUser && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "25px",
        borderRadius: "20px",
        width: "450px",
      }}
    >
      <h2>Review {selectedUser.name}</h2>

      <select
        value={rating}
        onChange={(e) =>
          setRating(Number(e.target.value))
        }
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "15px",
        }}
      >
        <option value={5}>⭐⭐⭐⭐⭐</option>
        <option value={4}>⭐⭐⭐⭐</option>
        <option value={3}>⭐⭐⭐</option>
        <option value={2}>⭐⭐</option>
        <option value={1}>⭐</option>
      </select>

      <textarea
        value={reviewText}
        onChange={(e) =>
          setReviewText(e.target.value)
        }
        rows={4}
        placeholder="Write your review..."
        style={{
          width: "100%",
          marginTop: "15px",
          padding: "12px",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        <button
          onClick={submitReview}
          style={{
            flex: 1,
            padding: "12px",
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
          }}
        >
          Submit
        </button>

        <button
          onClick={() =>
            setSelectedUser(null)
          }
          style={{
            flex: 1,
            padding: "12px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
   </>
  );
}

export default Matches;