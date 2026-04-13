import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "./About.css";

function About() {
  return (
    <div>
      <Navbar />

      <div className="about-page">
        <div className="about-container">
          <div className="about-hero-card">
            <p className="about-label">About SkillSync</p>
            <h1>Helping people exchange skills and grow together.</h1>
            <p className="about-intro">
              SkillSync is a smart skill exchange platform that connects people based
              on the skills they have and the skills they want to learn. It is designed
              to make learning more collaborative, practical, and engaging.
            </p>
          </div>

          <div className="about-stats">
            <div className="stat-card">
              <h3>50+</h3>
              <p>Skills Covered</p>
            </div>
            <div className="stat-card">
              <h3>100+</h3>
              <p>Skill Connections</p>
            </div>
            <div className="stat-card">
              <h3>25+</h3>
              <p>Active User Profiles</p>
            </div>
          </div>

          <div className="about-grid">
            <div className="about-info-card">
              <div className="about-icon">🎯</div>
              <h3>Our Mission</h3>
              <p>
                To make learning simple and meaningful by helping people connect with
                others who can exchange useful skills and grow together.
              </p>
            </div>

            <div className="about-info-card">
              <div className="about-icon">💡</div>
              <h3>Why SkillSync?</h3>
              <p>
                Many people want to learn new skills but do not know where to start or
                whom to connect with. SkillSync solves this by creating a focused
                platform where users can discover each other through shared learning
                interests.
              </p>
            </div>

            <div className="about-info-card">
              <div className="about-icon">⚙️</div>
              <h3>How It Works</h3>
              <p>
                Users create a profile, add the skills they have and the skills they
                want, discover other users, and build meaningful matches for skill
                exchange and communication.
              </p>
            </div>

            <div className="about-info-card">
              <div className="about-icon">✨</div>
              <h3>What Makes It Special</h3>
              <p>
                SkillSync combines clean design, matching logic, chat, and video calling
                to create a modern and interactive peer-to-peer learning experience.
              </p>
            </div>
          </div>

          <div className="about-highlight-card">
            <h2>What users can do on SkillSync</h2>

            <div className="highlight-list">
              <div className="highlight-item">
                <span>01</span>
                <div>
                  <h4>Discover skill partners</h4>
                  <p>Explore profiles of people who match your learning interests.</p>
                </div>
              </div>

              <div className="highlight-item">
                <span>02</span>
                <div>
                  <h4>Exchange skills</h4>
                  <p>Teach what you know and learn what you need from others.</p>
                </div>
              </div>

              <div className="highlight-item">
                <span>03</span>
                <div>
                  <h4>Connect and communicate</h4>
                  <p>Build real learning connections using chat and video calling.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-bottom-card">
            <h2>Why this platform matters</h2>
            <p>
              SkillSync is more than just a project — it is built around the idea that
              learning becomes stronger when people collaborate, share knowledge, and
              help each other grow in a smarter way.
            </p>

            <div className="about-cta-buttons">
              <Link to="/discover" className="about-btn primary-btn">
                Start Discovering
              </Link>
              <Link to="/profile" className="about-btn secondary-btn">
                Complete Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;