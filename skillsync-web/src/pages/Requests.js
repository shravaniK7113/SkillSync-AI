import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function Requests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/api/received-requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const acceptRequest = async (id) => {
    try {
      await api.post("/api/accept-request", {
        request_id: id,
      });

      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectRequest = async (id) => {
    try {
      await api.post("/api/reject-request", {
        request_id: id,
      });

      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />

      <div
        style={{
          maxWidth: "1000px",
          margin: "40px auto",
          padding: "20px",
        }}
      >
        <h1>🤝 Connection Requests</h1>

        {requests.length === 0 ? (
          <p>No pending requests</p>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#fff",
                padding: "20px",
                borderRadius: "20px",
                marginBottom: "20px",
                border: "1px solid #eee",
              }}
            >
              <h3>{r.name}</h3>

              <p>{r.bio}</p>

              <p>
                <strong>Skills:</strong> {r.skills_have}
              </p>

              <p>
                <strong>Wants:</strong> {r.skills_want}
              </p>

              <button
                onClick={() => acceptRequest(r.id)}
                style={{ marginRight: "10px" }}
              >
                ✅ Accept
              </button>

              <button onClick={() => rejectRequest(r.id)}>
                ❌ Reject
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default Requests; 
