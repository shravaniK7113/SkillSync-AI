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
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);

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
        const reviewStats = await api.get(
          `/api/reviews/${user.id}/stats`
        );

        setAvgRating(
          reviewStats.data.average_rating || 0
        );

        const reviewData = await api.get(
          `/api/reviews/${user.id}`
        );

        setReviews(reviewData.data);
        setName(user.name || "");
        setEmail(user.email || "");
        setBio(user.bio || "");
        setSkillsHave(user.skills_have || "");
        setSkillsWant(user.skills_want || "");
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error.response?.data || error.message
        );

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

      localStorage.setItem(
        "user",
        JSON.stringify(profileRes.data.user)
      );

      showToast("Profile updated successfully", "success");

      setTimeout(() => {
        navigate("/discover");
      }, 800);
    } catch (error) {
      console.error(
        "Profile update failed:",
        error.response?.data || error.message
      );

      showToast(
        error.response?.data?.message ||
          "Failed to update profile",
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

  const initial = name ? name.charAt(0).toUpperCase() : "U";

  const skillsHaveList = skillsHave
    ? skillsHave
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const skillsWantList = skillsWant
    ? skillsWant
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const profileCompletion =
    [
      name,
      email,
      bio,
      skillsHave,
      skillsWant,
    ].filter((item) => item && item.trim()).length * 20;

  return (
    <>
      <Navbar />

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
      />

      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg,#fdf2f8,#eef2ff,#f8fafc)",
          padding: "40px",
        }}
      >
        {loading ? (
          <h2 style={{ textAlign: "center" }}>
            Loading Profile...
          </h2>
        ) : (
          <div
            style={{
              maxWidth: "1400px",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "350px 1fr",
              gap: "25px",
            }}
          >
            {/* LEFT PANEL */}

            <div
              style={{
                background: "#fff",
                borderRadius: "24px",
                padding: "30px",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.08)",
                height: "fit-content",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg,#ec4899,#8b5cf6)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "0 auto",
                  color: "#fff",
                  fontSize: "48px",
                  fontWeight: "bold",
                }}
              >
                {initial}
              </div>

              <h2
                style={{
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                {name}
              </h2>

              <p
                style={{
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                {email}
              </p>

              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                }}
              >
                <h4>About Me</h4>

                <p
                  style={{
                    color: "#4b5563",
                    marginTop: "8px",
                  }}
                >
                  {bio || "No bio added yet"}
                </p>
              </div>

              <div style={{ marginTop: "20px" }}>
                <h4>Profile Completion</h4>

                <div
                  style={{
                    height: "10px",
                    background: "#e5e7eb",
                    borderRadius: "20px",
                    overflow: "hidden",
                    marginTop: "10px",
                  }}
                >
                  <div
                    style={{
                      width: `${profileCompletion}%`,
                      height: "100%",
                      background:
                        "linear-gradient(135deg,#ec4899,#8b5cf6)",
                    }}
                  />
                </div>

                <p
                  style={{
                    marginTop: "8px",
                    color: "#6b7280",
                  }}
                >
                  {profileCompletion}% Complete
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    background: "#eff6ff",
                    padding: "15px",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <h3>{skillsHaveList.length}</h3>
                  <p>Skills</p>
                </div>

                <div
                  style={{
                    background: "#ede9fe",
                    padding: "15px",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <h3>{skillsWantList.length}</h3>
                  <p>Goals</p>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}

            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(180px,1fr))",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    padding: "20px",
                    borderRadius: "16px",
                    textAlign: "center",
                  }}
                >
                  <h2>🎯</h2>
                  <h3>{skillsHaveList.length}</h3>
                  <p>Skills Offered</p>
                </div>

                <div
                  style={{
                    background: "#fff",
                    padding: "20px",
                    borderRadius: "16px",
                    textAlign: "center",
                  }}
                >
                  <h2>📚</h2>
                  <h3>{skillsWantList.length}</h3>
                  <p>Learning Goals</p>
                </div>

                <div
                  style={{
                    background: "#fff",
                    padding: "20px",
                    borderRadius: "16px",
                    textAlign: "center",
                  }}
                >
                 <h2>⭐</h2>
                 <h3>{avgRating}</h3>
                 <p>User Rating</p>
                </div>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "30px",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ marginBottom: "25px" }}>
                  Edit Profile
                </h2>

                <form onSubmit={handleSave}>
                  <div style={{ marginBottom: "16px" }}>
                    <label>Name</label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        marginTop: "8px",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label>Email</label>

                    <input
                      type="email"
                      value={email}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "12px",
                        marginTop: "8px",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                        background: "#f8fafc",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label>Bio</label>

                    <textarea
                      rows="4"
                      value={bio}
                      onChange={(e) =>
                        setBio(e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        marginTop: "8px",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label>Skills I Have</label>

                    <input
                      type="text"
                      value={skillsHave}
                      onChange={(e) =>
                        setSkillsHave(e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        marginTop: "8px",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label>Skills I Want</label>

                    <input
                      type="text"
                      value={skillsWant}
                      onChange={(e) =>
                        setSkillsWant(e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        marginTop: "8px",
                        borderRadius: "10px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "none",
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg,#ec4899,#8b5cf6)",
                      color: "#fff",
                      fontSize: "16px",
                      marginBottom: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Profile"}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "none",
                      borderRadius: "12px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </button>
                </form>

                <div style={{ marginTop: "30px" }}>
                  <h3>Skills I Have</h3>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "10px",
                    }}
                  >
                    {skillsHaveList.map((skill, index) => (
                      <span
                        key={index}
                        style={{
                          background: "#dbeafe",
                          color: "#1d4ed8",
                          padding: "8px 14px",
                          borderRadius: "20px",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <h3>Skills I Want</h3>

                  <div
  style={{
    marginTop: "30px",
    background: "#fff",
    padding: "25px",
    borderRadius: "20px",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.05)",
  }}
>
  <h2
    style={{
      marginBottom: "20px",
    }}
  >
    ⭐ User Reviews
  </h2>

  {reviews.length === 0 ? (
    <p>No reviews yet</p>
  ) : (
    reviews.map((review) => (
      <div
        key={review.id}
        style={{
          padding: "15px 0",
          borderBottom:
            "1px solid #f1f5f9",
        }}
      >
        <strong>
          {review.reviewer_name}
        </strong>

        <p>
          ⭐ {review.rating}/5
        </p>

        <p>
          {review.review_text}
        </p>
      </div>
    ))
  )}
</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Profile;