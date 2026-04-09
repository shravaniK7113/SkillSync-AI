import Navbar from "../components/Navbar";
import "./Team.css";

function Team() {
  return (
    <div>
      <Navbar />

      <div className="team-page">
        <div className="team-container">
          <div className="team-hero-card">
            <p className="team-label">Our Team</p>
            <h1>The minds behind SkillSync</h1>
            <p className="team-intro">
              SkillSync is built through collaboration, creativity, and a shared goal
              of making mentorship more meaningful and accessible.
            </p>
          </div>

          <div className="team-grid">

            {/* Shravani */}
            <div className="team-card">
              <img
                src="https://ui-avatars.com/api/?name=Shravani&background=6366f1&color=fff"
                alt="Shravani"
                className="team-img"
              />
              <h3>Shravani Konnur</h3>
              <p className="team-role">Full Stack Developer & System Architect</p>
              <p className="team-desc">
                Built the complete SkillSync platform including frontend, backend APIs,
                and mentor matching system. Designed UI/UX and system architecture.
              </p>

              <div className="team-skills">
                <span>React</span>
                <span>Flask</span>
                <span>MySQL</span>
                <span>API Design</span>
              </div>
            </div>

            {/* Aakansha */}
            <div className="team-card">
              <img
                src="https://ui-avatars.com/api/?name=Aakansha&background=8b5cf6&color=fff"
                alt="Aakansha"
                className="team-img"
              />
              <h3>Aakansha Prasad</h3>
              <p className="team-role">AI Matching Engineer</p>
              <p className="team-desc">
                Designed and worked on intelligent mentor matching logic including
                skill comparison, semantic similarity, and recommendation strategy.
              </p>

              <div className="team-skills">
                <span>AI Logic</span>
                <span>Matching System</span>
                <span>Data Analysis</span>
                <span>ML Concepts</span>
              </div>
            </div>

            {/* Sanika */}
            <div className="team-card">
              <img
                src="https://ui-avatars.com/api/?name=Sanika&background=ec4899&color=fff"
                alt="Sanika"
                className="team-img"
              />
              <h3>Sanika Deshmukh</h3>
              <p className="team-role">Data Analyst & Documentation Lead</p>
              <p className="team-desc">
                Handled project analysis, documentation, and report structuring.
                Supported data interpretation and system understanding.
              </p>

              <div className="team-skills">
                <span>Data Analysis</span>
                <span>Documentation</span>
                <span>Reporting</span>
                <span>Research</span>
              </div>
            </div>

          </div>

          <div className="team-bottom-card">
            <h2>Built with purpose</h2>
            <p>
              SkillSync represents our combined effort to build a meaningful and
              intelligent mentorship platform using modern technologies and ideas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Team;