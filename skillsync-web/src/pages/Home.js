import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home">
      <Navbar />

      <div className="hero">
        <div className="hero-content">
          <h1>SkillSync</h1>
          <p>Empowering Growth Through Mentorship</p>

          <Link to="/register" className="btn-start">
            Start Your Mentorship Journey
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;