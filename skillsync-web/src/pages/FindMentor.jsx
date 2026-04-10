import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./FindMentor.css";

function FindMentor() {
  const [skillsInput, setSkillsInput] = useState("");
  const [goals, setGoals] = useState("");
  const [availability, setAvailability] = useState("");
  const [mentors, setMentors] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedMentors, setLikedMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cardAction, setCardAction] = useState("");
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [message, setMessage] = useState("");
  const [requestedIds, setRequestedIds] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const user = JSON.parse(localStorage.getItem("user"));

  const showToastMessage = (message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 2500);
  };

  const handleFindMentors = async () => {
    if (!user) {
      showToastMessage("Please login first", "error");
      return;
    }

    if (!skillsInput.trim()) {
      setMessage("Please enter at least one skill.");
      return;
    }

    setLoading(true);
    setMessage("");
    setCurrentIndex(0);
    setLikedMentors([]);
    setRequestedIds([]);

    try {
      const skillsArray = skillsInput
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

      await axios.post("http://127.0.0.1:5000/api/save-learner-preferences", {
        user_id: user.id,
        skills: skillsArray,
        goals: goals,
        availability: availability
      });

      const res = await axios.post("http://127.0.0.1:5000/api/match-mentors", {
        skills: skillsArray,
        goals: goals,
        availability: availability
      });

      setMentors(res.data);

      if (res.data.length === 0) {
        setMessage("No mentors found.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error fetching mentors.");
    } finally {
      setLoading(false);
    }
  };

  const goToNextCard = () => {
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setCardAction("");
    }, 300);
  };

  const handleSkip = () => {
    setCardAction("swipe-left");
    goToNextCard();
  };

  const handleInterested = async () => {
    if (!user) {
      showToastMessage("Please login first", "error");
      return;
    }

    const currentMentor = mentors[currentIndex];

    if (currentMentor) {
      try {
        await axios.post("http://127.0.0.1:5000/api/send-request", {
          learner_id: user.id,
          mentor_id: currentMentor.id
        });

        setRequestedIds((prev) => [...prev, currentMentor.id]);

        const alreadyLiked = likedMentors.some((m) => m.id === currentMentor.id);

        if (!alreadyLiked) {
          setLikedMentors((prev) => [...prev, currentMentor]);
        }

        setShowMatchPopup(true);
        setCardAction("swipe-right");
        showToastMessage("Connection request sent successfully", "success");

        setTimeout(() => {
          setShowMatchPopup(false);
        }, 1200);

        goToNextCard();
      } catch (error) {
        console.error(error);

        if (error.response?.data?.message) {
          showToastMessage(error.response.data.message, "error");
        } else {
          showToastMessage("Error sending request", "error");
        }
      }
    }
  };

  const currentMentor = mentors[currentIndex];

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
            <h2>Find Your Mentor</h2>
            <p>Enter what you want to learn and let SkillSync match you intelligently.</p>
          </div>

          <div className="filter-card">
            <h3>Tell us what you want to learn</h3>

            <div className="filter-form">
              <input
                type="text"
                placeholder="Skills to learn (e.g. Python, AI, Machine Learning)"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />

              <input
                type="text"
                placeholder="Your goal (e.g. I want help with AI projects)"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />

              <input
                type="text"
                placeholder="Availability (e.g. Weekends)"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              />

              <button className="find-btn" onClick={handleFindMentors}>
                Find Matches
              </button>
            </div>
          </div>

          {showMatchPopup && (
            <div className="match-popup">
              <span className="popup-icon">💙</span>
              <p>Mentor added to your interested list!</p>
            </div>
          )}

          {message && <p className="status-text">{message}</p>}

          {loading ? (
            <p className="status-text">Finding best mentor matches...</p>
          ) : mentors.length > 0 ? (
            currentIndex >= mentors.length ? (
              <div className="done-card">
                <h3>No more mentors</h3>
                <p>You have viewed all matched mentors.</p>

                {likedMentors.length > 0 && (
                  <div className="liked-section">
                    <h4>Your Interested Mentors</h4>
                    {likedMentors.map((mentor) => (
                      <div key={mentor.id} className="liked-mentor-card">
                        <div className="liked-top">
                          <h5>{mentor.name}</h5>
                          <span className="small-match-badge">
                            {mentor.match_score}% Match
                          </span>
                        </div>
                        <p><strong>Skills:</strong> {mentor.skills}</p>
                        <p><strong>Email:</strong> {mentor.email}</p>
                        <p><strong>Contact:</strong> {mentor.contact}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="swipe-card-wrapper">
                <div className={`mentor-match-card ${cardAction}`}>
                  <div className="match-badge">
                    {currentMentor.match_score}% Match
                  </div>

                  <div className="mentor-avatar">
                    {currentMentor.name?.charAt(0).toUpperCase()}
                  </div>

                  <h3>{currentMentor.name}</h3>
                  <p className="mentor-role">
                    {currentMentor.experience || "Mentor"}
                  </p>

                  <div className="mentor-tags">
                    {currentMentor.skills?.split(",").map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>

                  <div className="mentor-details">
                    <p><strong>Bio:</strong> {currentMentor.bio || "No bio available"}</p>
                    <p><strong>Availability:</strong> {currentMentor.availability || "Not mentioned"}</p>
                    <p><strong>Skill Score:</strong> {currentMentor.skill_score}%</p>
                    <p><strong>Semantic Score:</strong> {currentMentor.semantic_score}%</p>
                    <p><strong>Trust Score:</strong> {currentMentor.trust_score}%</p>
                    <p><strong>Email:</strong> {currentMentor.email}</p>
                    <p><strong>Contact:</strong> {currentMentor.contact || "Not provided"}</p>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="circle-btn skip-btn" onClick={handleSkip}>
                    ✖
                  </button>

                  <button
                    className="connect-btn"
                    onClick={handleInterested}
                    disabled={requestedIds.includes(currentMentor.id)}
                  >
                    {requestedIds.includes(currentMentor.id) ? "✔ Requested" : "💙 Connect"}
                  </button>
                </div>

                <p className="progress-text">
                  {currentIndex + 1} / {mentors.length}
                </p>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default FindMentor;