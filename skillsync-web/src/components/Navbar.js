import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    setShowMenu(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "";
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        SkillSync
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/contact" className="nav-link">Contact</Link>
        <Link to="/about" className="nav-link">About Us</Link>
        <Link to="/team" className="nav-link">Team</Link>
        <Link to="/find-mentor" className="nav-link">Find Mentor</Link>

        {user?.role === "mentor" ? (
          <Link to="/mentor-dashboard" className="nav-link">
            Mentor Dashboard
          </Link>
        ) : user ? (
          <>
            <Link to="/learner-dashboard" className="nav-link">
              Learner Dashboard
            </Link>
            <Link to="/be-mentor" className="nav-link">
              Become a Mentor
            </Link>
          </>
        ) : null}
      </div>

      <div className="nav-right">
        {user ? (
          <div className="profile-dropdown-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="user-avatar avatar-btn"
              onClick={() => setShowMenu((prev) => !prev)}
            >
              {getInitial()}
            </button>

            {showMenu && (
              <div className="dropdown-menu">
                <p className="dropdown-name">{user.name}</p>

                <button onClick={() => navigate("/")}>Home</button>

                {user.role === "mentor" ? (
                  <button onClick={() => navigate("/mentor-dashboard")}>
                    Dashboard
                  </button>
                ) : (
                  <button onClick={() => navigate("/learner-dashboard")}>
                    Dashboard
                  </button>
                )}

                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="sign-in-btn">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;