import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./BeMentor.css";

function BeMentor() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      await axios.post("http://localhost:5000/api/be-mentor", {
        user_id: user.id,
        name,
        email,
        skills,
        experience,
        bio,
        availability,
        contact,
      });

      const token = localStorage.getItem("token");

      const profileRes = await axios.get("http://localhost:5000/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.setItem("user", JSON.stringify(profileRes.data.user));

      setMessage("You are now a mentor!");

      setTimeout(() => {
        navigate("/mentor-dashboard");
      }, 1000);
    } catch (error) {
      console.error("Become mentor failed:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mentor-hero">
      <div className="mentor-overlay">
        <div className="mentor-card">
          <h2>Become a Mentor</h2>
          <p className="mentor-subtitle">
            Share your skills, guide learners, and grow your professional profile on SkillSync.
          </p>

          {message && <p className="mentor-message">{message}</p>}

          <form className="mentor-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly
            />

            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly
            />

            <input
              type="text"
              placeholder="Skills (e.g. React, Python, AWS)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Experience (e.g. 2 years in Web Development)"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
            />

            <textarea
              placeholder="Write a short bio about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Availability (e.g. Weekends, 6 PM - 9 PM)"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Contact info (Phone / LinkedIn / Email)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Become Mentor"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default BeMentor;