import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";
import Toast from "../components/Toast";

function Profile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [skillsHave, setSkillsHave] = useState("");
  const [skillsWant, setSkillsWant] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          showToast("Please login first", "error");
          navigate("/login");
          return;
        }

        const res = await api.get("/api/profile");

        const user = res.data.user;
        setName(user.name || "");
        setEmail(user.email || "");
        setBio(user.bio || "");
        setSkillsHave(user.skills_have || "");
        setSkillsWant(user.skills_want || "");
      } catch (error) {
        console.error("Failed to load profile:", error.response?.data || error.message);
        showToast("Failed to load profile", "error");

        setTimeout(() => {
          navigate("/login");
        }, 800);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Name is required", "error");
      return;
    }

    try {
      setSaving(true);

      await api.put("/api/users/update-profile", {
        name,
        bio,
        skills_have: skillsHave,
        skills_want: skillsWant,
      });

      const profileRes = await api.get("/api/profile");
      localStorage.setItem("user", JSON.stringify(profileRes.data.user));

      showToast("Profile updated successfully", "success");

      setTimeout(() => {
        navigate("/discover");
      }, 800);
    } catch (error) {
      console.error("Profile update failed:", error.response?.data || error.message);
      showToast(
        error.response?.data?.message || "Failed to update profile",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    showToast("Logged out successfully", "info");

    setTimeout(() => {
      navigate("/login");
    }, 800);
  };

  return (
    <>
      <Navbar />

      {/* ✅ Toast */}
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <div style={{ padding: "40px", background: "#f3f7fd", minHeight: "100vh" }}>
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            background: "#fff",
            padding: "30px",
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
            My Profile
          </h2>
          <p style={{ textAlign: "center", color: "#666", marginBottom: "25px" }}>
            Update your profile to start matching with skill exchange partners.
          </p>

          {loading ? (
            <p style={{ textAlign: "center" }}>Loading profile...</p>
          ) : (
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: "16px" }}>
                <label><strong>Name</strong></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label><strong>Email</strong></label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    background: "#f9fafb",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label><strong>Bio</strong></label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short bio about yourself"
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label><strong>Skills I Have</strong></label>
                <input
                  type="text"
                  value={skillsHave}
                  onChange={(e) => setSkillsHave(e.target.value)}
                  placeholder="e.g. React, HTML, CSS"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label><strong>Skills I Want</strong></label>
                <input
                  type="text"
                  value={skillsWant}
                  onChange={(e) => setSkillsWant(e.target.value)}
                  placeholder="e.g. Python, AWS, DSA"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "8px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "16px",
                  marginBottom: "12px",
                }}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#dc2626",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Logout
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;