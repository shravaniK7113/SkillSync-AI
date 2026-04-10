import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function MentorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user?.id) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        `http://localhost:5000/api/mentor-requests/${user.id}`
      );

      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch mentor requests:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Error loading mentor requests.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId, status) => {
    try {
      await axios.post("http://localhost:5000/api/update-request-status", {
        request_id: requestId,
        status,
      });

      fetchRequests();
    } catch (err) {
      console.error("Failed to update request:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to update request");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ padding: "40px", background: "#f3f7fd", minHeight: "100vh" }}>
        <h1 style={{ textAlign: "center", marginBottom: "10px" }}>Mentor Requests</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
          View and manage connection requests sent by learners.
        </p>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading mentor requests...</p>
        ) : error ? (
          <p style={{ textAlign: "center", color: "red" }}>{error}</p>
        ) : requests.length === 0 ? (
          <p style={{ textAlign: "center" }}>No requests found.</p>
        ) : (
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: "#fff",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                <h3>{req.learner_name}</h3>
                <p><strong>Email:</strong> {req.learner_email}</p>
                <p><strong>Status:</strong> {req.status}</p>

                {req.status === "pending" && (
                  <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => updateStatus(req.id, "accepted")}
                      style={{
                        padding: "10px 16px",
                        border: "none",
                        borderRadius: "8px",
                        background: "green",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => updateStatus(req.id, "rejected")}
                      style={{
                        padding: "10px 16px",
                        border: "none",
                        borderRadius: "8px",
                        background: "crimson",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default MentorRequests;