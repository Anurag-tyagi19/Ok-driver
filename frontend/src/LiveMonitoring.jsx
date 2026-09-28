import React, { useMemo, useState } from "react";

let API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
if (API_BASE && !API_BASE.startsWith("http")) {
  API_BASE = `https://${API_BASE}`;
}

function LiveMonitoring({ cameras }) {
  const [selectedCamera, setSelectedCamera] = useState(null);

  const activeCameras = useMemo(() => {
    return cameras.filter((camera) => camera.is_active !== false);
  }, [cameras]);

  const getStatusClass = (status) => {
    switch (status) {
      case "ONLINE":
        return "online";
      case "DEGRADED":
        return "degraded";
      default:
        return "offline";
    }
  };

  return (
    <section className="live-monitoring-section">

      <div className="section-header">
        <div>
          <h2>Live Monitoring</h2>
          <p>
            Centralized real-time view of connected CCTV cameras
          </p>
        </div>

        <div className="monitoring-summary">
          <span>
            Cameras: <b>{activeCameras.length}</b>
          </span>

          <span>
            Online:{" "}
            <b>
              {
                activeCameras.filter(
                  (camera) => camera.status === "ONLINE"
                ).length
              }
            </b>
          </span>
        </div>
      </div>

      {activeCameras.length === 0 ? (
        <div className="empty-state">
          <h3>No active cameras</h3>
          <p>Add a camera from the Camera Registry.</p>
        </div>
      ) : (
        <div className="monitoring-grid">

          {activeCameras.map((camera) => (

            <div
              className="monitoring-card"
              key={camera.id}
              onClick={() => setSelectedCamera(camera)}
            >

              {/* VIDEO */}

              <div className="monitoring-video-container">

                {camera.stream_url ? (
                  <video
                    className="monitoring-video"
                    src={`${API_BASE}/api/v1/video/${camera.stream_url}`}
                    controls
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <div className="no-video">
                    <span>📹</span>
                    <p>No video source configured</p>
                  </div>
                )}

                {/* STATUS */}

                <div
                  className={`camera-status ${getStatusClass(
                    camera.status
                  )}`}
                >
                  <span className="status-dot"></span>

                  {camera.status || "OFFLINE"}
                </div>

              </div>

              {/* CAMERA INFORMATION */}

              <div className="monitoring-info">

                <div className="camera-title-row">

                  <div>
                    <h3>{camera.name}</h3>

                    <span className="camera-code">
                      {camera.camera_code}
                    </span>
                  </div>

                  <span className="camera-type">
                    {camera.camera_type}
                  </span>

                </div>

                <div className="camera-meta">

                  <span>
                    📍 {camera.zone || "Unknown Zone"}
                  </span>

                  <span>
                    🏢 {camera.department}
                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>
      )}

      {/* FULL SCREEN CAMERA MODAL */}

      {selectedCamera && (

        <div
          className="camera-modal-overlay"
          onClick={() => setSelectedCamera(null)}
        >

          <div
            className="camera-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="camera-modal-header">

              <div>
                <h2>{selectedCamera.name}</h2>

                <span>
                  {selectedCamera.camera_code}
                </span>
              </div>

              <button
                className="close-camera"
                onClick={() => setSelectedCamera(null)}
              >
                ✕
              </button>

            </div>

            <div className="camera-modal-video">

              {selectedCamera.stream_url ? (
                <video
                  src={`${API_BASE}/api/v1/video/${selectedCamera.stream_url}`}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <div className="no-video">
                  No video source configured
                </div>
              )}

            </div>

            <div className="camera-modal-details">

              <div>
                <strong>Status</strong>
                <span>{selectedCamera.status}</span>
              </div>

              <div>
                <strong>Department</strong>
                <span>{selectedCamera.department}</span>
              </div>

              <div>
                <strong>Zone</strong>
                <span>{selectedCamera.zone || "N/A"}</span>
              </div>

              <div>
                <strong>Protocol</strong>
                <span>{selectedCamera.source_protocol}</span>
              </div>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}

export default LiveMonitoring;