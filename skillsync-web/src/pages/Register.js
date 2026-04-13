import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Toast from "../components/Toast";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 2500);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      showToast("Please fill name, email and password", "error");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/users/register", {
        name,
        email,
        password,
      });

      showToast("Registration successful", "success");

      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (error) {
      console.error("Register failed:", error.response?.data || error.message);
      showToast(error.response?.data?.message || "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <div className="auth-left">
        <h1>Join SkillSync 🚀</h1>
        <p>Create your account and start your skill exchange journey.</p>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2>Register</h2>

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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

          <button onClick={handleRegister} disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;