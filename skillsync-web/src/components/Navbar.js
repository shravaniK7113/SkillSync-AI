import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <h2 className="logo">SkillSync</h2>

      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/be-mentor" className="nav-link">Become a Mentor</Link>
        <Link to="/find-mentor" className="nav-link">Find Mentor</Link>
        <Link to="/contact" className="nav-link">Contact</Link>
        <Link to="/about" className="nav-link">About Us</Link>
        <Link to="/team" className="nav-link">Team</Link>
        <Link to="/login" className="sign-in-btn">Sign in</Link>
      </div>
    </nav>
  );
}

export default Navbar;