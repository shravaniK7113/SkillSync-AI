import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  // ✅ GET USER FROM LOCALSTORAGE
  const user = JSON.parse(localStorage.getItem("user"));

  // ✅ GET INITIAL
  const initial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "S";

  return (
    <>
      <Navbar />

      <div className="home-page">
        <section className="hero-section">
          <div className="hero-content">
            <span className="hero-badge">✨ SkillSync</span>

            <h1>
              Learn, Teach, <br />
              and Match by Skills 💖
            </h1>

            <p className="hero-text">
              Discover people who can teach what you want to learn and learn
              from people who need your skills. Swipe, match, chat, and grow
              together in one cute space.
            </p>

            <div className="hero-buttons">
              <button
                className="hero-btn primary-btn"
                onClick={() => navigate("/discover")}
              >
                Start Discovering
              </button>

              <button
                className="hero-btn secondary-btn"
                onClick={() => navigate("/register")}
              >
                Create Account
              </button>
            </div>

            <div className="hero-tags">
              <span>🎨 Design</span>
              <span>💻 Coding</span>
              <span>📸 Editing</span>
              <span>🗣 Communication</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card big-card">
              <div className="card-top">
                {/* ✅ DYNAMIC INITIAL */}
                <div className="avatar pink">
                  {initial}
                </div>
              </div>

              <div className="skill-pill-wrap">
                <span className="skill-pill">Web Design</span>
                <span className="skill-pill">Frontend</span>
                <span className="skill-pill">UI Basics</span>
              </div>

              <p className="card-note">
                Wants to learn: Python, AI
              </p>
            </div>

            <div className="visual-card small-card one">
              <p>💬 Match & Chat</p>
            </div>

            <div className="visual-card small-card two">
              <p>📹 Video Call</p>
            </div>
          </div>
        </section>

        <section className="features-section">
          <h2>Why SkillSync feels special ✨</h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💞</div>
              <h3>Mutual Matching</h3>
              <p>
                Connect only when both users are interested in exchanging skills.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Real-Time Chat</h3>
              <p>
                Once matched, start chatting instantly and plan your skill exchange.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📹</div>
              <h3>Video Calls</h3>
              <p>
                Learn and teach face-to-face with built-in video calling and screen sharing.
              </p>
            </div>
          </div>
        </section>

        <section className="steps-section">
          <h2>How it works 🌷</h2>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3>Create your profile</h3>
              <p>Add skills you have and skills you want to learn.</p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <h3>Discover people</h3>
              <p>Browse users and find the best skill exchange matches.</p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <h3>Match and connect</h3>
              <p>Chat, call, and grow together with a real exchange.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Home;