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

  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const [latestNotif, setLatestNotif] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    setShowMenu(false);
  }, [location]);

  useEffect(() => {
  let previousNotificationId = null;

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const res = await axios.get(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data || [];

      if (
        data.length > 0 &&
        previousNotificationId !== null &&
        data[0].id !== previousNotificationId
      ) {
        setLatestNotif(data[0]);

        setTimeout(() => {
          setLatestNotif(null);
        }, 5000);
      }

      if (data.length > 0) {
        previousNotificationId = data[0].id;
      }

      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  fetchNotifications();

  const interval = setInterval(fetchNotifications, 3000);

  return () => clearInterval(interval);
}, []);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowNotif(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () =>
      document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const getInitial = () =>
    user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">
          SkillSync
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">
            Home
          </Link>

          <Link to="/matches" className="nav-link">
            Matches
            {unreadCount > 0 && (
              <span className="badge">{unreadCount}</span>
            )}
          </Link>

          <Link to="/discover" className="nav-link">
            Discover
          </Link>

          <Link to="/profile" className="nav-link">
            Profile
          </Link>

          <Link to="/about" className="nav-link">
            About
          </Link>

          <Link to="/contact" className="nav-link">
            Contact
          </Link>

          <Link to="/team" className="nav-link">
            Team
          </Link>
	 <Link to="/requests" className="nav-link">
            Requests
         </Link>
        </div>

        <div className="nav-right" ref={dropdownRef}>
  {user && (
    <div className="notif-wrapper">
      <button
        className="notif-btn"
        onClick={(e) => {
          e.stopPropagation();
          setShowNotif(!showNotif);
          setShowMenu(false);
        }}
      >
        🔔

        {notifications.length > 0 && (
          <span className="notif-dot">
            {notifications.filter((n) => !n.is_read).length}
          </span>
        )}
      </button>

      {showNotif && (
        <div className="notif-dropdown">
          <div className="notif-title">
            Notifications
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">
              No notifications
            </div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={i}
                className="notif-item"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  try {
                    const token =
                      localStorage.getItem("token");

                    await axios.post(
                      "http://localhost:5000/api/notifications/read",
                      {
                        notification_id: n.id,
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                    setShowNotif(false);

                    if (
                      n.message
                        .toLowerCase()
                        .includes("connection request")
                    ) {
                      navigate("/requests");
                    } else if (
                      n.message
                        .toLowerCase()
                        .includes("matched")
                    ) {
                      navigate("/matches");
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )}

  {user ? (
    <div className="profile-dropdown-wrapper">
      <button
        className="avatar-btn"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
          setShowNotif(false);
        }}
      >
        <span className="user-avatar">
          {getInitial()}
        </span>
      </button>

      <div
        className={`dropdown-menu ${
          showMenu ? "show" : ""
        }`}
      >
        <p className="dropdown-name">
          {user.name}
        </p>

        <button
          onClick={() => navigate("/profile")}
        >
          My Profile
        </button>

        <button
          onClick={() => navigate("/matches")}
        >
          Matches
        </button>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  ) : (
    <div className="auth-buttons">
      <Link
        to="/login"
        className="login-btn"
      >
        Login
      </Link>

      <Link
        to="/register"
        className="signup-btn"
      >
        Sign Up
      </Link>
    </div>
  )}
</div>
      </nav>

      {latestNotif && (
  <div
    style={{
      position: "fixed",
      top: "90px",
      right: "20px",
      width: "340px",
      background: "rgba(255,255,255,0.96)",
      backdropFilter: "blur(12px)",
      borderRadius: "20px",
      padding: "18px",
      boxShadow: "0 15px 40px rgba(0,0,0,0.12)",
      border: "1px solid rgba(0,0,0,0.06)",
      zIndex: 9999,
      animation: "slideIn 0.3s ease",
    }}
        >
          <h4
  style={{
    margin: "0 0 10px",
    color: "#4f46e5",
    fontSize: "16px",
    fontWeight: "700",
  }}
>
  🔔 New Notification
</h4>

          <p>{latestNotif.message}</p>
        </div>
      )}
    </>
  );
}

export default Navbar;