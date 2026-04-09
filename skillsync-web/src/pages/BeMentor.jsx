import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./BeMentor.css";

function BeMentor() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    skills: "",
    experience: "",
    bio: "",
    availability: "",
    contact: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://127.0.0.1:5000/api/be-mentor", {
        ...form,
        user_id: 1
      });

      setMessage(res.data.message);

      setForm({
        name: "",
        email: "",
        skills: "",
        experience: "",
        bio: "",
        availability: "",
        contact: ""
      });
    } catch (error) {
      console.error(error);
      setMessage("Error submitting form");
    }
  };

  return (
    <div>
      <Navbar />

      <div className="mentor-hero">
        <div className="mentor-overlay">
          <div className="mentor-card">
            <h2>Become a Mentor</h2>
            <p className="mentor-subtitle">
              Share your knowledge and help learners grow with the right guidance.
            </p>

            {message && <p className="mentor-message">{message}</p>}

            <form onSubmit={handleSubmit} className="mentor-form">
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="skills"
                placeholder="Enter your skills (Python, AI...)"
                value={form.skills}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="experience"
                placeholder="Experience"
                value={form.experience}
                onChange={handleChange}
              />

              <textarea
                name="bio"
                placeholder="Write about yourself"
                value={form.bio}
                onChange={handleChange}
              />

              <input
                type="text"
                name="availability"
                placeholder="Availability"
                value={form.availability}
                onChange={handleChange}
              />

              <input
                type="text"
                name="contact"
                placeholder="Contact number"
                value={form.contact}
                onChange={handleChange}
              />

              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BeMentor;