import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import Toast from "../components/Toast";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      navigate("/");
    }
  }, [navigate]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 2500);
  };

  const isProfileIncomplete = (user) => {
    return !user?.skills_have?.trim() || !user?.skills_want?.trim();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast("Please enter email and password", "error");
      return;
    }

    try {
      setLoading(true);

      const loginRes = await api.post("/api/users/login", {
        email,
        password,
      });

      const token = loginRes.data.token;
      localStorage.setItem("token", token);

      const profileRes = await api.get("/api/profile");
      const user = profileRes.data.user;

      localStorage.setItem("user", JSON.stringify(user));

      if (isProfileIncomplete(user)) {
        showToast("Please complete your profile first", "info");

        setTimeout(() => {
          navigate("/profile");
        }, 800);
      } else {
        showToast("Login successful", "success");

        setTimeout(() => {
          navigate("/discover");
        }, 800);
      }
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      showToast(error.response?.data?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* ✅ Toast */}
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <div className="auth-left">
        <h1>Welcome Back 👋</h1>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2>Login</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p style={{ marginTop: "12px", textAlign: "center" }}>
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;