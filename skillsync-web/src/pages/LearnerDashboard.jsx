import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function LearnerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchRequests = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/learner-requests/${user.id}`
      );
      setRequests(res.data);
    } catch (error) {
      console.error("Failed to fetch learner requests:", error);
      alert("Failed to load learner requests");
    } finally {
      setLoading(false);
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
            <h1>Learner Dashboard</h1>
            <p>Track your mentor connection requests and their latest status.</p>
          </div>

          {loading ? (
            <p className="dashboard-empty">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="dashboard-empty">No requests sent yet.</p>
          ) : (
            <div className="dashboard-grid">
              {requests.map((req) => (
                <div className="dashboard-card" key={req.id}>
                  <h3>{req.mentor_name}</h3>
                  <p><strong>Email:</strong> {req.mentor_email}</p>
                  <p><strong>Skills:</strong> {req.skills}</p>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default LearnerDashboard;