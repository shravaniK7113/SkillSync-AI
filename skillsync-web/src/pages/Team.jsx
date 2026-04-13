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
              of making skill exchange more meaningful, practical, and accessible.
            </p>
          </div>

          <div className="team-grid">
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
                user flow, chat system, video calling, and overall system architecture.
              </p>

              <div className="team-skills">
                <span>React</span>
                <span>Flask</span>
                <span>MySQL</span>
                <span>System Design</span>
              </div>
            </div>

            <div className="team-card">
              <img
                src="https://ui-avatars.com/api/?name=Aakansha&background=8b5cf6&color=fff"
                alt="Aakansha"
                className="team-img"
              />
              <h3>Aakansha Prasad</h3>
              <p className="team-role">Matching Logic & Recommendation Support</p>
              <p className="team-desc">
                Worked on the skill matching logic and contributed to improving how
                users are connected based on shared interests and exchange potential.
              </p>

              <div className="team-skills">
                <span>Matching Logic</span>
                <span>Recommendations</span>
                <span>Data Analysis</span>
                <span>ML Concepts</span>
              </div>
            </div>

            <div className="team-card">
              <img
                src="https://ui-avatars.com/api/?name=Sanika&background=ec4899&color=fff"
                alt="Sanika"
                className="team-img"
              />
              <h3>Sanika Deshmukh</h3>
              <p className="team-role">Documentation & Research Lead</p>
              <p className="team-desc">
                Handled project analysis, documentation, report structuring, and
                research support to strengthen the overall project presentation.
              </p>

              <div className="team-skills">
                <span>Documentation</span>
                <span>Research</span>
                <span>Analysis</span>
                <span>Reporting</span>
              </div>
            </div>
          </div>

          <div className="team-bottom-card">
            <h2>Built with purpose</h2>
            <p>
              SkillSync represents our combined effort to build a meaningful and modern
              skill exchange platform using practical technologies, user-centered design,
              and real-world communication features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Team;