import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import BeMentor from "./pages/BeMentor";
import FindMentor from "./pages/FindMentor";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Team from "./pages/Team";
import MentorRequests from "./pages/MentorRequests";
import LearnerDashboard from "./pages/LearnerDashboard";
import MentorDashboard from "./pages/MentorDashboard";

function App() {
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        await axios.get("http://localhost:5000/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    };

    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/be-mentor" element={<BeMentor />} />
        <Route path="/find-mentor" element={<FindMentor />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/team" element={<Team />} />
        <Route path="/mentor-requests" element={<MentorRequests />} />
        <Route path="/learner-dashboard" element={<LearnerDashboard />} />
        <Route path="/mentor-dashboard" element={<MentorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;