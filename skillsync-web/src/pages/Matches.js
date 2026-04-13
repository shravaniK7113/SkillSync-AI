import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";

function Matches() {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setMessage("Please login first.");
          setLoading(false);
          return;
        }

        const res = await api.get("/api/matches");

        setMatches(res.data || []);

        if (!res.data || res.data.length === 0) {
          setMessage("No matches yet.");
        } else {
          setMessage("");
        }
      } catch (error) {
        console.error("Failed to fetch matches:", error.response?.data || error.message);
        setMessage(error.response?.data?.message || "Error loading matches.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
    const interval = setInterval(fetchMatches, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />

      <div style={{ padding: "40px", background: "#f3f7fd", minHeight: "100vh" }}>
        <h1 style={{ textAlign: "center", marginBottom: "10px" }}>My Matches</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
          People who matched with you for skill exchange.
        </p>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading matches...</p>
        ) : message ? (
          <p style={{ textAlign: "center" }}>{message}</p>
        ) : (
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            {matches.map((match) => (
              <div
                key={match.id}
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  position: "relative",
                }}
              >
                {match.unread_count > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                      background: "red",
                      color: "white",
                      borderRadius: "50%",
                      padding: "6px 10px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {match.unread_count}
                  </div>
                )}

                <h3>{match.name}</h3>
                <p><strong>Email:</strong> {match.email}</p>
                <p><strong>Bio:</strong> {match.bio || "No bio added"}</p>
                <p><strong>Skills I Have:</strong> {match.skills_have || "Not added"}</p>
                <p><strong>Skills I Want:</strong> {match.skills_want || "Not added"}</p>

                <button
                  onClick={() => navigate(`/chat/${match.id}`)}
                  style={{
                    marginTop: "12px",
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Open Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Matches;