import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function MentorDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchRequests = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/mentor-requests/${user.id}`
      );
      setRequests(res.data);
    } catch (error) {
      console.error("Failed to fetch mentor requests:", error);
      alert("Failed to load mentor requests");
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
    } catch (error) {
      console.error("Failed to update request:", error);
      alert("Failed to update request");
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, []);

  if (!user) {
    return <h2>Please login first</h2>;
  }

  return (
    <>
      <Navbar />
      <section className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Mentor Dashboard</h1>
            <p>Manage learner requests and build your mentorship network.</p>
          </div>

          {loading ? (
            <p className="dashboard-empty">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="dashboard-empty">No requests yet.</p>
          ) : (
            <div className="dashboard-grid">
              {requests.map((req) => (
                <div className="dashboard-card" key={req.id}>
                  <h3>{req.learner_name}</h3>
                  <p><strong>Email:</strong> {req.learner_email}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`status-badge ${
                        req.status === "accepted"
                          ? "status-accepted"
                          : req.status === "rejected"
                          ? "status-rejected"
                          : "status-pending"
                      }`}
                    >
                      {req.status}
                    </span>
                  </p>

                  {req.status === "pending" && (
                    <div className="dashboard-actions">
                      <button
                        className="accept-btn"
                        onClick={() => updateStatus(req.id, "accepted")}
                      >
                        Accept
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => updateStatus(req.id, "rejected")}
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
      </section>
    </>
  );
}

export default MentorDashboard;