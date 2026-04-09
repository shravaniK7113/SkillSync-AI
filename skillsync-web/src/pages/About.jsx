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
            <h1>Helping learners find the right mentor, faster.</h1>
            <p className="about-intro">
              SkillSync is a smart mentorship platform that connects learners with
              mentors based on skills, interests, and learning goals. It is designed
              to make mentorship more accessible, relevant, and engaging.
            </p>
          </div>

          <div className="about-stats">
            <div className="stat-card">
              <h3>50+</h3>
              <p>Skills Covered</p>
            </div>
            <div className="stat-card">
              <h3>100+</h3>
              <p>Learners Supported</p>
            </div>
            <div className="stat-card">
              <h3>25+</h3>
              <p>Mentor Profiles</p>
            </div>
          </div>

          <div className="about-grid">
            <div className="about-info-card">
              <div className="about-icon">🎯</div>
              <h3>Our Mission</h3>
              <p>
                To make mentorship simple and meaningful by helping learners discover
                mentors who truly match their goals and growth journey.
              </p>
            </div>

            <div className="about-info-card">
              <div className="about-icon">💡</div>
              <h3>Why SkillSync?</h3>
              <p>
                Many learners struggle to find the right guidance. SkillSync solves
                this by creating a focused platform where mentors and learners can
                connect through shared skills and interests.
              </p>
            </div>

            <div className="about-info-card">
              <div className="about-icon">⚙️</div>
              <h3>How It Works</h3>
              <p>
                Learners explore mentors, view their skills and profiles, and find
                the best fit for their learning needs. Mentors can register and share
                their expertise to support others.
              </p>
            </div>

            <div className="about-info-card">
              <div className="about-icon">✨</div>
              <h3>What Makes It Special</h3>
              <p>
                SkillSync combines clean design with intelligent matchmaking ideas,
                making the experience modern, interactive, and easy to use.
              </p>
            </div>
          </div>

          <div className="about-highlight-card">
            <h2>What users can do on SkillSync</h2>

            <div className="highlight-list">
              <div className="highlight-item">
                <span>01</span>
                <div>
                  <h4>Find mentors by skill</h4>
                  <p>Search and discover mentors who match your learning interests.</p>
                </div>
              </div>

              <div className="highlight-item">
                <span>02</span>
                <div>
                  <h4>Become a mentor</h4>
                  <p>Share your knowledge and guide learners on their journey.</p>
                </div>
              </div>

              <div className="highlight-item">
                <span>03</span>
                <div>
                  <h4>Build meaningful connections</h4>
                  <p>Create a space where learning happens through mentorship and support.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-bottom-card">
            <h2>Why this platform matters</h2>
            <p>
              SkillSync is more than just a project — it is built around the idea that
              the right mentor can change a learner’s direction, confidence, and future.
              Our goal is to make that connection easier and smarter.
            </p>

            <div className="about-cta-buttons">
              <Link to="/find-mentor" className="about-btn primary-btn">
                Find a Mentor
              </Link>
              <Link to="/be-mentor" className="about-btn secondary-btn">
                Become a Mentor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;