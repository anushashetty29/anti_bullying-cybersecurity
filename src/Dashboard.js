import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const MOCK_ALERTS = [
  { id: 1, title: "Repeated threatening DMs", sub: "Instagram - Grade 9 Student", email: "student9@school.edu", severity: "high", time: "2m ago", status: "Open" },
  { id: 2, title: "Public humiliation post", sub: "WhatsApp Group - Class 10B", email: "class10b@school.edu", severity: "medium", time: "18m ago", status: "In Review" },
  { id: 3, title: "Exclusion & silent treatment", sub: "Discord - Gaming Platform", email: "gamer@school.edu", severity: "low", time: "1h ago", status: "Resolved" },
  { id: 4, title: "Impersonation account created", sub: "Instagram - Unknown Student", email: "hidden@school.edu", severity: "high", time: "2h ago", status: "Open" },
  { id: 5, title: "Hate speech in group chat", sub: "Telegram - Class 11A", email: "anonymous@school.edu", severity: "medium", time: "3h ago", status: "Resolved" },
  { id: 6, title: "Private photo shared without consent", sub: "Snapchat - Grade 12", email: "privacy@school.edu", severity: "high", time: "5h ago", status: "In Review" },
  { id: 7, title: "Continuous prank calling", sub: "WhatsApp - Anonymous", email: "unknown@school.edu", severity: "low", time: "1d ago", status: "Resolved" },
  { id: 8, title: "Doxing of home address", sub: "Discord - Server Public", email: "address@school.edu", severity: "high", time: "2d ago", status: "In Review" },
  { id: 9, title: "Negative comments on workout vlog", sub: "YouTube - Public", email: "vlogger@school.edu", severity: "medium", time: "3d ago", status: "Resolved" },
];

const SEVERITY_COLOR = { high: "#E94560", medium: "#FFB703", low: "#00B4D8" };
const STATUS_COLOR = { Open: "#E94560", "In Review": "#FFB703", Resolved: "#06D6A0" };

function Dashboard() {
  const [filter, setFilter] = useState("All");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (!isAdmin) {
      navigate("/login");
      return;
    }

    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports');
        if (response.ok) {
          const data = await response.json();
          // Map DB columns to UI state shape
          const dbAlerts = data.map(report => ({
            id: report.id,
            title: report.type,
            sub: `${report.platform} Â· ${report.anonymous ? 'Anonymous Report' : report.name || 'Student'}`,
            email: report.email,
            severity: report.severity?.toLowerCase() || 'medium',
            time: new Date(report.timestamp).toLocaleString(),
            status: report.status === 'pending' ? 'Open' : (report.status === 'resolved' ? 'Resolved' : 'In Review'),
            description: report.details
          }));
          setAlerts([...dbAlerts, ...MOCK_ALERTS]);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setAlerts(MOCK_ALERTS);
      }
    };
    fetchReports();
  }, [navigate]);

  useEffect(() => {
    if (selectedAlert && !selectedAlert.mock) {
      const fetchChat = async () => {
        try {
          const res = await fetch(`/api/reports/${selectedAlert.id}/messages`);
          if (res.ok) {
            const data = await res.json();
            setChatHistory(data.map(m => ({ from: m.sender, text: m.message })));
          }
        } catch (err) { console.error(err); }
      };
      fetchChat();
    } else {
      setChatHistory([{ from: "System", text: "Investigation started. Please document any screenshots." }]);
    }
  }, [selectedAlert]);

  const filtered = filter === "All" ? alerts : alerts.filter(a => a.status === filter);
  const open = alerts.filter(a => a.status === "Open").length;
  const resolved = alerts.filter(a => a.status === "Resolved").length;
  const inReview = alerts.filter(a => a.status === "In Review").length;

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/login");
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const dbStatus = newStatus === 'Resolved' ? 'resolved' : (newStatus === 'In Review' ? 'review' : 'pending');
      await fetch(`/api/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dbStatus })
      });
    } catch (err) {
      console.error(err);
    }
    const updated = alerts.map(a => a.id === id ? { ...a, status: newStatus } : a);
    setAlerts(updated);
    setSelectedAlert(null);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedAlert) return;

    try {
      await fetch(`/api/reports/${selectedAlert.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'Admin', message: chatMessage })
      });
    } catch (err) {
      console.error(err);
    }

    setChatHistory([...chatHistory, { from: "Admin", text: chatMessage }]);
    setChatMessage("");
  };

  return (
    <div className="dashboard-page">
      <div className="dash-top">
        <div>
          <p className="section-tag">Admin Panel</p>
          <h1>Incident <span className="highlight">Dashboard</span></h1>
          <p className="dash-sub">Live incident tracking for counsellors and school coordinators.</p>
        </div>
        <div className="live-controls">
          <div className="live-badge"><span className="live-dot"></span> System Active</div>
          <button onClick={handleLogout} className="logout-link">Logout</button>
        </div>
      </div>

      <div className="metrics-row">
        <div className="metric-box">
          <div className="m-label">Total Alerts</div>
          <div className="m-val">{alerts.length}</div>
        </div>
        <div className="metric-box">
          <div className="m-label">Open</div>
          <div className="m-val" style={{ color: "#E94560" }}>{open}</div>
        </div>
        <div className="metric-box">
          <div className="m-label">In Review</div>
          <div className="m-val" style={{ color: "#FFB703" }}>{inReview}</div>
        </div>
        <div className="metric-box">
          <div className="m-label">Resolved</div>
          <div className="m-val" style={{ color: "#06D6A0" }}>{resolved}</div>
        </div>
      </div>

      <div className="filter-tabs">
        {["All", "Open", "In Review", "Resolved"].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="alert-list">
        {filtered.map(alert => (
          <div 
            key={alert.id} 
            className={`alert-row ${selectedAlert?.id === alert.id ? "selected" : ""}`}
            style={{ borderLeftColor: SEVERITY_COLOR[alert.severity] }}
            onClick={() => setSelectedAlert(alert)}
          >
            <div className="alert-dot" style={{ background: SEVERITY_COLOR[alert.severity] }}></div>
            <div className="alert-body">
              <div className="alert-title">{alert.title}</div>
              <div className="alert-sub">{alert.sub}</div>
            </div>
            <div className="alert-meta">
              <span className="alert-status" style={{ color: STATUS_COLOR[alert.status], background: STATUS_COLOR[alert.status] + "18" }}>
                {alert.status}
              </span>
              <span className="alert-time">{alert.time}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">No incidents found.</div>
        )}
      </div>

      {selectedAlert && (
        <div className="details-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="details-card-split" onClick={e => e.stopPropagation()}>
            <div className="details-main-info">
              <div className="details-header">
                <h3>Incident Details</h3>
                <button className="close-btn" onClick={() => setSelectedAlert(null)}>?</button>
              </div>
              <div className="details-body">
                <div className="detail-row-flex">
                   <div className="detail-item">
                     <label>Problem Description</label>
                     <div className="detail-text">{selectedAlert.title}</div>
                   </div>
                   <div className="detail-item">
                     <label>Patient/Student Email</label>
                     <div className="detail-text" style={{ color: "var(--teal)" }}>{selectedAlert.email || "Confidential"}</div>
                   </div>
                </div>
                {selectedAlert.description && (
                  <div className="detail-item">
                    <label>Full Description</label>
                    <div className="detail-text">{selectedAlert.description}</div>
                  </div>
                )}
                <div className="detail-item">
                  <label>Context / Platform</label>
                  <div className="detail-text">{selectedAlert.sub}</div>
                </div>
                <div className="detail-item">
                  <label>Severity Level</label>
                  <div className="detail-text" style={{ color: SEVERITY_COLOR[selectedAlert.severity], textTransform: "capitalize" }}>
                     {selectedAlert.severity}
                  </div>
                </div>
                <div className="detail-actions">
                  {selectedAlert.status !== "Resolved" && (
                    <button className="action-btn resolve" onClick={() => handleUpdateStatus(selectedAlert.id, "Resolved")}>
                      Mark as Resolved
                    </button>
                  )}
                  {selectedAlert.status === "Open" && (
                    <button className="action-btn review" onClick={() => handleUpdateStatus(selectedAlert.id, "In Review")}>
                      Start Review
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="details-chat-side">
               <div className="chat-header">Internal Communication</div>
               <div className="chat-content">
                  {chatHistory.map((m, i) => (
                    <div key={i} className={`msg ${m.from.toLowerCase()}`}>
                      <strong>{m.from}:</strong> {m.text}
                    </div>
                  ))}
               </div>
               <form onSubmit={handleSendChat} className="chat-input-area">
                  <input 
                    placeholder="Type a note or reply..." 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <button type="submit">Send</button>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

