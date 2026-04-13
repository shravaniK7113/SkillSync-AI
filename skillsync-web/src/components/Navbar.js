import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔥 Load user
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    setShowMenu(false);
  }, [location]);

  // 🔥 Fetch unread messages
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:5000/api/unread-count", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUnreadCount(res.data.unread || 0);
      } catch (error) {
        console.error("Unread fetch error:", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 3000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "U";
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        SkillSync
      </Link>

      {/* 🔥 NAV LINKS */}
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>

        {/* Matches with badge */}
        <div className="matches-link-wrapper">
          <Link to="/matches" className="nav-link">Matches</Link>

          {unreadCount > 0 && (
            <span className="unread-badge">
              {unreadCount}
            </span>
          )}
        </div>

        <Link to="/discover" className="nav-link">Discover</Link>
        <Link to="/profile" className="nav-link">Profile</Link>

        {/* 🔥 YOUR PAGES BACK */}
        <Link to="/about" className="nav-link">About</Link>
        <Link to="/contact" className="nav-link">Contact</Link>
        <Link to="/team" className="nav-link">Team</Link>
      </div>

      {/* 🔥 RIGHT SIDE */}
      <div className="nav-right" ref={dropdownRef}>
        {user ? (
          <div className="profile-dropdown-wrapper">
            <button
              type="button"
              className="avatar-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
            >
              <span className="user-avatar">{getInitial()}</span>
            </button>

            {/* 🔥 DROPDOWN */}
            <div className={`dropdown-menu ${showMenu ? "show" : ""}`}>
              <p className="dropdown-name">{user.name}</p>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  navigate("/profile");
                }}
              >
                My Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  navigate("/matches");
                }}
              >
                Matches
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  handleLogout();
                }}
              >
                Logout
              </button>
            </div>
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