import { useState } from "react";
import axios from "axios";
import "./Auth.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post("http://localhost:5000/api/users/register", {
        name,
        email,
        password,
      });

      window.location.href = "/login";
    } catch {
      alert("Error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <h1>Join SkillSync 🚀</h1>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2>Register</h2>

          <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

          <button onClick={handleRegister}>Register</button>
        </div>
      </div>
    </div>
  );
}

export default Register;