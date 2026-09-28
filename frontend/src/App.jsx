import { useEffect, useState } from "react";
import "./App.css";

import CameraMap from "./CameraMap";
import LiveMonitoring from "./LiveMonitoring";

let rawApiBase = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
if (rawApiBase && !rawApiBase.startsWith("http")) {
  rawApiBase = `https://${rawApiBase}`;
}
const API_BASE = rawApiBase;
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (API_BASE.replace(/^http/, "ws") + "/ws");

function App() {
  // =====================================================
  // CAMERA STATE
  // =====================================================

  const [cameras, setCameras] = useState([]);
  const [loadingCameras, setLoadingCameras] = useState(true);
  const [cameraError, setCameraError] = useState("");

  const [cameraSearch, setCameraSearch] = useState("");
  const [cameraStatusFilter, setCameraStatusFilter] =
    useState("ALL");

  const [departmentFilter, setDepartmentFilter] =
    useState("ALL");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  // =====================================================
  // DETECTION STATE
  // =====================================================

  const [detections, setDetections] = useState([]);

  // =====================================================
  // ENTITY SEARCH
  // =====================================================

  const [searchVehicle, setSearchVehicle] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // =====================================================
  // ALERT STATE
  // =====================================================

  const [alerts, setAlerts] = useState([]);
  const [alertFilter, setAlertFilter] = useState("ALL");

  // =====================================================
  // WATCHLIST STATE
  // =====================================================

  const [watchlist, setWatchlist] = useState([]);

  const [watchlistIdentifier, setWatchlistIdentifier] =
    useState("");

  const [watchlistType, setWatchlistType] =
    useState("VEHICLE");

  const [watchlistDescription, setWatchlistDescription] =
    useState("");

  const [watchlistError, setWatchlistError] =
    useState("");

  const [addingWatchlist, setAddingWatchlist] =
    useState(false);

  // =====================================================
  // WEBSOCKET STATE
  // =====================================================

  const [wsConnected, setWsConnected] = useState(false);

  const [realtimeEvents, setRealtimeEvents] =
    useState([]);

  // =====================================================
  // ADD CAMERA
  // =====================================================

  const [showAddCamera, setShowAddCamera] =
    useState(false);

  const [cameraForm, setCameraForm] = useState({
    camera_code: "",
    name: "",
    department: "",
    latitude: "",
    longitude: "",
    camera_type: "CCTV",
    source_protocol: "FILE",
    stream_url: "",
    zone: "",
  });

  const [cameraFormError, setCameraFormError] =
    useState("");

  const [addingCamera, setAddingCamera] =
    useState(false);

  // =====================================================
  // EDIT CAMERA
  // =====================================================

  const [editingCamera, setEditingCamera] =
    useState(null);

  const [editCameraForm, setEditCameraForm] =
    useState({});

  const [updatingCamera, setUpdatingCamera] =
    useState(false);

  // =====================================================
  // RBAC & AUDIT STATE
  // =====================================================

  const [userRole, setUserRole] = useState("admin"); // 'admin' or 'operator'
  const [selectedAuditCamera, setSelectedAuditCamera] = useState(null);
  const [cameraAuditLogs, setCameraAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const handleSendHeartbeat = async (cameraId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/cameras/${cameraId}/heartbeat`,
        { method: "POST" }
      );
      if (response.ok) {
        const data = await response.json();
        setCameras((prev) =>
          prev.map((c) =>
            c.id === cameraId
              ? { ...c, status: data.status, last_heartbeat: data.last_heartbeat }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Heartbeat error:", error);
    }
  };

  const handleOpenAudit = async (camera) => {
    setSelectedAuditCamera(camera);
    setAuditLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/cameras/${camera.id}/audit`
      );
      if (response.ok) {
        const data = await response.json();
        setCameraAuditLogs(data);
      } else {
        setCameraAuditLogs([]);
      }
    } catch (error) {
      console.error("Audit load error:", error);
      setCameraAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  // =====================================================
  // ENTITY SEARCH
  // =====================================================

  const handleSearch = async () => {
    if (!searchVehicle.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/detections/search/${encodeURIComponent(
          searchVehicle.trim().toUpperCase()
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to search vehicle");
      }

      const data = await response.json();

      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  // =====================================================
  // CAMERA FORM
  // =====================================================

  const handleCameraFormChange = (event) => {
    const { name, value } = event.target;

    setCameraForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // =====================================================
  // ADD CAMERA
  // =====================================================

  const handleAddCamera = async (event) => {
    event.preventDefault();

    setCameraFormError("");
    setAddingCamera(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/cameras/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            camera_code: cameraForm.camera_code,
            name: cameraForm.name,
            department: cameraForm.department,
            latitude: Number(cameraForm.latitude),
            longitude: Number(cameraForm.longitude),
            camera_type: cameraForm.camera_type,
            source_protocol: cameraForm.source_protocol,
            stream_url:
              cameraForm.stream_url || null,
            zone: cameraForm.zone || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to add camera"
        );
      }

      setCameras((previousCameras) => [
        ...previousCameras,
        data,
      ]);

      setShowAddCamera(false);

      setCameraForm({
        camera_code: "",
        name: "",
        department: "",
        latitude: "",
        longitude: "",
        camera_type: "CCTV",
        source_protocol: "FILE",
        stream_url: "",
        zone: "",
      });
    } catch (error) {
      console.error(
        "Error adding camera:",
        error
      );

      setCameraFormError(
        error.message ||
          "Unable to add camera."
      );
    } finally {
      setAddingCamera(false);
    }
  };

  // =====================================================
  // EDIT CAMERA
  // =====================================================

  const handleEditCamera = (camera) => {
    setEditingCamera(camera.id);

    setEditCameraForm({
      camera_code: camera.camera_code,
      name: camera.name,
      department: camera.department,
      latitude: camera.latitude,
      longitude: camera.longitude,
      camera_type: camera.camera_type,
      source_protocol: camera.source_protocol,
      stream_url: camera.stream_url || "",
      zone: camera.zone || "",
    });
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;

    setEditCameraForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleUpdateCamera = async (event) => {
    event.preventDefault();

    setUpdatingCamera(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/cameras/${editingCamera}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            camera_code:
              editCameraForm.camera_code,

            name: editCameraForm.name,

            department:
              editCameraForm.department,

            latitude:
              Number(editCameraForm.latitude),

            longitude:
              Number(editCameraForm.longitude),

            camera_type:
              editCameraForm.camera_type,

            source_protocol:
              editCameraForm.source_protocol,

            stream_url:
              editCameraForm.stream_url || null,

            zone:
              editCameraForm.zone || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update camera"
        );
      }

      setCameras((previousCameras) =>
        previousCameras.map((camera) =>
          camera.id === editingCamera
            ? data
            : camera
        )
      );

      setEditingCamera(null);
    } catch (error) {
      console.error(
        "Error updating camera:",
        error
      );
    } finally {
      setUpdatingCamera(false);
    }
  };

  // =====================================================
  // DISABLE CAMERA
  // =====================================================

  const handleDisableCamera = async (cameraId) => {
    const confirmed = window.confirm(
      "Are you sure you want to disable this camera?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/cameras/${cameraId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to disable camera"
        );
      }

      setCameras((previousCameras) =>
        previousCameras.filter(
          (camera) =>
            camera.id !== cameraId
        )
      );
    } catch (error) {
      console.error(
        "Error disabling camera:",
        error
      );
    }
  };

  // =====================================================
  // LOAD CAMERAS
  // =====================================================

  useEffect(() => {
    const loadCameras = async () => {
      try {
        setLoadingCameras(true);
        setCameraError("");

        const response = await fetch(
          `${API_BASE}/api/v1/cameras/`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load cameras"
          );
        }

        const data = await response.json();

        setCameras(data);
      } catch (error) {
        console.error(
          "Error loading cameras:",
          error
        );

        setCameraError(
          "Unable to connect to the CCTV backend."
        );
      } finally {
        setLoadingCameras(false);
      }
    };

    loadCameras();
  }, []);

  // =====================================================
  // LOAD DETECTIONS
  // =====================================================

  useEffect(() => {
    const loadDetections = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/detections/`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load detections"
          );
        }

        const data = await response.json();

        setDetections(data);
      } catch (error) {
        console.error(
          "Error loading detections:",
          error
        );
      }
    };

    loadDetections();
  }, []);

  // =====================================================
  // LOAD ALERTS
  // =====================================================

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/alerts/`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load alerts"
          );
        }

        const data = await response.json();

        const normalizedAlerts = data.map(
          (alert) => ({
            ...alert,
            alert_id: alert.id,
          })
        );

        setAlerts(normalizedAlerts);
      } catch (error) {
        console.error(
          "Error loading alerts:",
          error
        );
      }
    };

    loadAlerts();
  }, []);

  // =====================================================
  // LOAD WATCHLIST
  // =====================================================

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/watchlist/`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load watchlist"
          );
        }

        const data = await response.json();

        setWatchlist(data);
      } catch (error) {
        console.error(
          "Error loading watchlist:",
          error
        );
      }
    };

    loadWatchlist();
  }, []);

  // =====================================================
  // WEBSOCKET
  // =====================================================

  useEffect(() => {
    let websocket = null;
    let reconnectTimer = null;
    let manuallyClosed = false;

    const connectWebSocket = () => {
      if (manuallyClosed) {
        return;
      }

      console.log("Connecting WebSocket...");

      websocket = new WebSocket(WS_URL);

      websocket.onopen = () => {
        console.log(
          "WebSocket connected"
        );

        setWsConnected(true);
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(
            event.data
          );

          console.log(
            "WebSocket event:",
            message
          );

          // ==========================================
          // REAL-TIME EVENT FEED
          // ==========================================

          setRealtimeEvents(
            (previousEvents) => [
              {
                ...message,
                received_at:
                  new Date().toISOString(),
              },
              ...previousEvents,
            ].slice(0, 20)
          );

          // ==========================================
          // AI DETECTION
          // ==========================================

          if (
            message.type === "DETECTION"
          ) {
            setDetections(
              (previousDetections) => {
                const exists =
                  previousDetections.some(
                    (detection) =>
                      detection.id ===
                      message.id
                  );

                if (exists) {
                  return previousDetections;
                }

                return [
                  message,
                  ...previousDetections,
                ].slice(0, 50);
              }
            );
          }

          // ==========================================
          // WATCHLIST ALERT
          // ==========================================

          if (
            message.type ===
            "WATCHLIST_ALERT"
          ) {
            const normalizedAlert = {
              ...message,
              alert_id:
                message.alert_id ||
                message.id,
              id:
                message.id ||
                message.alert_id,
              status:
                message.status ||
                "ACTIVE",
            };

            setAlerts(
              (previousAlerts) => {
                const alreadyExists =
                  previousAlerts.some(
                    (alert) =>
                      (
                        alert.alert_id ||
                        alert.id
                      ) ===
                      normalizedAlert.alert_id
                  );

                if (alreadyExists) {
                  return previousAlerts;
                }

                return [
                  normalizedAlert,
                  ...previousAlerts,
                ];
              }
            );
          }

          // ==========================================
          // CAMERA HEALTH
          // ==========================================

          if (
            message.type ===
            "CAMERA_HEALTH"
          ) {
            setCameras(
              (previousCameras) =>
                previousCameras.map(
                  (camera) =>
                    camera.id ===
                    message.camera_id
                      ? {
                          ...camera,
                          status:
                            message.status,
                          last_heartbeat:
                            message.last_heartbeat,
                        }
                      : camera
                )
            );
          }
        } catch (error) {
          console.error(
            "Invalid WebSocket message:",
            error
          );
        }
      };

      websocket.onerror = (error) => {
        console.error(
          "WebSocket error:",
          error
        );

        setWsConnected(false);
      };

      websocket.onclose = () => {
        console.log(
          "WebSocket disconnected"
        );

        setWsConnected(false);

        if (!manuallyClosed) {
          reconnectTimer = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      manuallyClosed = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  // =====================================================
  // ALERT STATUS
  // =====================================================

  const updateAlertStatus = async (
    alertId,
    action
  ) => {
    if (!alertId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/alerts/${alertId}/${action}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to update alert:",
          data
        );

        return;
      }

      setAlerts(
        (previousAlerts) =>
          previousAlerts.map((alert) =>
            (
              alert.alert_id ||
              alert.id
            ) === alertId
              ? {
                  ...alert,
                  status:
                    data.status,
                }
              : alert
          )
      );
    } catch (error) {
      console.error(
        "Error updating alert:",
        error
      );
    }
  };

  // =====================================================
  // WATCHLIST - ADD
  // =====================================================

  const handleAddWatchlist = async (
    event
  ) => {
    event.preventDefault();

    setWatchlistError("");

    if (!watchlistIdentifier.trim()) {
      setWatchlistError(
        "Identifier is required."
      );

      return;
    }

    setAddingWatchlist(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/watchlist/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            identifier:
              watchlistIdentifier
                .trim()
                .toUpperCase(),

            entity_type:
              watchlistType,

            description:
              watchlistDescription.trim() ||
              null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to add watchlist entry"
        );
      }

      setWatchlist(
        (previousWatchlist) => [
          data,
          ...previousWatchlist,
        ]
      );

      setWatchlistIdentifier("");
      setWatchlistDescription("");
      setWatchlistType("VEHICLE");
    } catch (error) {
      console.error(
        "Error adding watchlist entry:",
        error
      );

      setWatchlistError(
        error.message ||
          "Unable to add watchlist entry."
      );
    } finally {
      setAddingWatchlist(false);
    }
  };

  // =====================================================
  // WATCHLIST - DEACTIVATE
  // =====================================================

  const handleDeactivateWatchlist =
    async (watchlistId) => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/watchlist/${watchlistId}/deactivate`,
          {
            method: "PATCH",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Failed to deactivate watchlist entry"
          );
        }

        setWatchlist(
          (previousWatchlist) =>
            previousWatchlist.map(
              (entry) =>
                entry.id === watchlistId
                  ? {
                      ...entry,
                      is_active: false,
                    }
                  : entry
            )
        );
      } catch (error) {
        console.error(
          "Error deactivating watchlist:",
          error
        );
      }
    };

  // =====================================================
  // CAMERA STATISTICS
  // =====================================================

  const totalCameras =
    cameras.length;

  const onlineCameras =
    cameras.filter(
      (camera) =>
        camera.status === "ONLINE"
    ).length;

  const degradedCameras =
    cameras.filter(
      (camera) =>
        camera.status === "DEGRADED"
    ).length;

  const offlineCameras =
    cameras.filter(
      (camera) =>
        camera.status === "OFFLINE"
    ).length;

  // =====================================================
  // ALERT STATISTICS
  // =====================================================

  const activeAlertsCount =
    alerts.filter(
      (alert) =>
        alert.status === "ACTIVE"
    ).length;

  const acknowledgedAlertsCount =
    alerts.filter(
      (alert) =>
        alert.status ===
        "ACKNOWLEDGED"
    ).length;

  const resolvedAlertsCount =
    alerts.filter(
      (alert) =>
        alert.status === "RESOLVED"
    ).length;

  // =====================================================
  // FILTER OPTIONS
  // =====================================================

  const departments = [
    ...new Set(
      cameras
        .map(
          (camera) =>
            camera.department
        )
        .filter(Boolean)
    ),
  ];

  const cameraTypes = [
    ...new Set(
      cameras
        .map(
          (camera) =>
            camera.camera_type
        )
        .filter(Boolean)
    ),
  ];

  // =====================================================
  // CAMERA FILTERING
  // =====================================================

  const filteredCameras =
    cameras.filter((camera) => {
      const search =
        cameraSearch
          .trim()
          .toLowerCase();

      const matchesSearch =
        !search ||
        camera.name
          ?.toLowerCase()
          .includes(search) ||
        camera.camera_code
          ?.toLowerCase()
          .includes(search) ||
        camera.department
          ?.toLowerCase()
          .includes(search) ||
        camera.zone
          ?.toLowerCase()
          .includes(search);

      const matchesStatus =
        cameraStatusFilter ===
          "ALL" ||
        camera.status ===
          cameraStatusFilter;

      const matchesDepartment =
        departmentFilter ===
          "ALL" ||
        camera.department ===
          departmentFilter;

      const matchesType =
        typeFilter === "ALL" ||
        camera.camera_type ===
          typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesType
      );
    });

  // =====================================================
  // ALERT FILTERING
  // =====================================================

  const filteredAlerts =
    alerts.filter((alert) => {
      if (alertFilter === "ALL") {
        return true;
      }

      return (
        alert.status ===
        alertFilter
      );
    });

  // =====================================================
  // ACTIVE ALERT CAMERA IDS
  // =====================================================

  const activeAlertCameraIds =
    [
      ...new Set(
        alerts
          .filter(
            (alert) =>
              alert.status ===
              "ACTIVE"
          )
          .map(
            (alert) =>
              alert.camera_id
          )
      ),
    ];

  // =====================================================
  // HELPER - CAMERA NAME
  // =====================================================

  const getCameraName = (cameraId) => {
    const camera = cameras.find(
      (item) =>
        item.id === cameraId
    );

    return camera
      ? camera.name
      : `Camera ${cameraId}`;
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="dashboard">

      {/* =================================================
          HEADER
      ================================================= */}

      <header>
        <div className="header-actions">
          <div>
            <h1>
              OkDriver CCTV Intelligence
            </h1>

            <p>
              Centralized CCTV Monitoring
              Platform
            </p>

            <div className="connection-status">

              <span
                className={
                  wsConnected
                    ? "connection-dot connected"
                    : "connection-dot disconnected"
                }
              ></span>

              {wsConnected
                ? "Real-time connection active"
                : "Real-time connection disconnected"}

            </div>
          </div>

          <div className="role-switcher">
            <span style={{ fontSize: "13px", color: "#64748b" }}>Role:</span>
            <span className={`role-badge ${userRole}`}>
              {userRole === "admin" ? "🛡️ Admin" : "👁️ Operator"}
            </span>
            <button
              className="role-toggle-btn"
              onClick={() => setUserRole(userRole === "admin" ? "operator" : "admin")}
            >
              Switch to {userRole === "admin" ? "Operator" : "Admin"}
            </button>
          </div>
        </div>
      </header>


      {/* =================================================
          CAMERA STATISTICS
      ================================================= */}

      <section className="stats">

        <div className="stat-card">
          <h3>Total Cameras</h3>
          <strong>
            {totalCameras}
          </strong>
        </div>

        <div className="stat-card">
          <h3>Online</h3>
          <strong>
            {onlineCameras}
          </strong>
        </div>

        <div className="stat-card">
          <h3>Degraded</h3>
          <strong>
            {degradedCameras}
          </strong>
        </div>

        <div className="stat-card">
          <h3>Offline</h3>
          <strong>
            {offlineCameras}
          </strong>
        </div>

      </section>


      {/* =================================================
          CAMERA REGISTRY
      ================================================= */}

      <section className="camera-section">

        <div className="section-header">

          <div>
            <h2>
              Camera Registry
            </h2>

            <p>
              Monitor and manage connected
              CCTV cameras
            </p>
          </div>

          {userRole === "admin" ? (
            <button
              className="add-camera-button"
              onClick={() => {
                setCameraFormError("");
                setShowAddCamera(true);
              }}
            >
              + Add Camera
            </button>
          ) : (
            <span style={{ fontSize: "13px", color: "#64748b", background: "#f1f5f9", padding: "6px 12px", borderRadius: "6px" }}>
              🔒 Operator Mode (Read-Only Registry)
            </span>
          )}

        </div>


        {/* =================================================
            ADD CAMERA FORM
        ================================================= */}

        {showAddCamera && (

          <div className="camera-form-card">

            <div className="camera-form-header">

              <div>
                <h3>
                  Add New Camera
                </h3>

                <p>
                  Register a new CCTV source
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowAddCamera(false)
                }
              >
                ✕
              </button>

            </div>

            {cameraFormError && (
              <div className="error-message">
                {cameraFormError}
              </div>
            )}

            <form
              onSubmit={handleAddCamera}
            >

              <div className="form-grid">

                <div className="form-group">
                  <label>
                    Camera Code
                  </label>

                  <input
                    type="text"
                    name="camera_code"
                    placeholder="CAM-003"
                    value={
                      cameraForm.camera_code
                    }
                    onChange={
                      handleCameraFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Camera Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Main Gate Camera"
                    value={
                      cameraForm.name
                    }
                    onChange={
                      handleCameraFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    placeholder="Traffic Department"
                    value={
                      cameraForm.department
                    }
                    onChange={
                      handleCameraFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Camera Type
                  </label>

                  <select
                    name="camera_type"
                    value={
                      cameraForm.camera_type
                    }
                    onChange={
                      handleCameraFormChange
                    }
                  >
                    <option value="CCTV">
                      CCTV
                    </option>

                    <option value="PTZ">
                      PTZ
                    </option>

                    <option value="IP_CAMERA">
                      IP Camera
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Latitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    placeholder="28.6139"
                    value={
                      cameraForm.latitude
                    }
                    onChange={
                      handleCameraFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Longitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    placeholder="77.2090"
                    value={
                      cameraForm.longitude
                    }
                    onChange={
                      handleCameraFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Source Protocol
                  </label>

                  <select
                    name="source_protocol"
                    value={
                      cameraForm.source_protocol
                    }
                    onChange={
                      handleCameraFormChange
                    }
                  >
                    <option value="FILE">
                      FILE
                    </option>

                    <option value="RTSP">
                      RTSP
                    </option>

                    <option value="HTTP">
                      HTTP
                    </option>

                    <option value="HLS">
                      HLS
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Stream / Video Source
                  </label>

                  <input
                    type="text"
                    name="stream_url"
                    placeholder="traffic1.mp4"
                    value={
                      cameraForm.stream_url
                    }
                    onChange={
                      handleCameraFormChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Zone
                  </label>

                  <input
                    type="text"
                    name="zone"
                    placeholder="North Gate"
                    value={
                      cameraForm.zone
                    }
                    onChange={
                      handleCameraFormChange
                    }
                  />
                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowAddCamera(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={addingCamera}
                >
                  {addingCamera
                    ? "Adding..."
                    : "Add Camera"}
                </button>

              </div>

            </form>

          </div>
        )}


        {/* =================================================
            EDIT CAMERA
        ================================================= */}

        {editingCamera !== null && (

          <div className="camera-form-card">

            <div className="camera-form-header">

              <div>
                <h3>
                  Edit Camera
                </h3>

                <p>
                  Update camera configuration
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setEditingCamera(null)
                }
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={
                handleUpdateCamera
              }
            >

              <div className="form-grid">

                <div className="form-group">
                  <label>
                    Camera Code
                  </label>

                  <input
                    type="text"
                    name="camera_code"
                    value={
                      editCameraForm.camera_code ||
                      ""
                    }
                    onChange={
                      handleEditFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Camera Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      editCameraForm.name ||
                      ""
                    }
                    onChange={
                      handleEditFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={
                      editCameraForm.department ||
                      ""
                    }
                    onChange={
                      handleEditFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Camera Type
                  </label>

                  <select
                    name="camera_type"
                    value={
                      editCameraForm.camera_type ||
                      "CCTV"
                    }
                    onChange={
                      handleEditFormChange
                    }
                  >
                    <option value="CCTV">
                      CCTV
                    </option>

                    <option value="PTZ">
                      PTZ
                    </option>

                    <option value="IP_CAMERA">
                      IP Camera
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Latitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={
                      editCameraForm.latitude ||
                      ""
                    }
                    onChange={
                      handleEditFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Longitude
                  </label>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={
                      editCameraForm.longitude ||
                      ""
                    }
                    onChange={
                      handleEditFormChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Source Protocol
                  </label>

                  <select
                    name="source_protocol"
                    value={
                      editCameraForm.source_protocol ||
                      "FILE"
                    }
                    onChange={
                      handleEditFormChange
                    }
                  >
                    <option value="FILE">
                      FILE
                    </option>

                    <option value="RTSP">
                      RTSP
                    </option>

                    <option value="HTTP">
                      HTTP
                    </option>

                    <option value="HLS">
                      HLS
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Stream / Video Source
                  </label>

                  <input
                    type="text"
                    name="stream_url"
                    value={
                      editCameraForm.stream_url ||
                      ""
                    }
                    onChange={
                      handleEditFormChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Zone
                  </label>

                  <input
                    type="text"
                    name="zone"
                    value={
                      editCameraForm.zone ||
                      ""
                    }
                    onChange={
                      handleEditFormChange
                    }
                  />
                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setEditingCamera(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={updatingCamera}
                >
                  {updatingCamera
                    ? "Updating..."
                    : "Update Camera"}
                </button>

              </div>

            </form>

          </div>
        )}


        {/* =================================================
            CAMERA FILTERS
        ================================================= */}

        <div className="camera-filters">

          <input
            type="text"
            placeholder="Search camera, ID, department or zone..."
            value={cameraSearch}
            onChange={(event) =>
              setCameraSearch(
                event.target.value
              )
            }
          />

          <select
            value={cameraStatusFilter}
            onChange={(event) =>
              setCameraStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Status
            </option>

            <option value="ONLINE">
              Online
            </option>

            <option value="DEGRADED">
              Degraded
            </option>

            <option value="OFFLINE">
              Offline
            </option>
          </select>

          <select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Departments
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              )
            )}
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Camera Types
            </option>

            {cameraTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}
          </select>

          <button
            onClick={() => {
              setCameraSearch("");
              setCameraStatusFilter(
                "ALL"
              );
              setDepartmentFilter(
                "ALL"
              );
              setTypeFilter("ALL");
            }}
          >
            Clear
          </button>

        </div>


        {/* =================================================
            CAMERA GRID
        ================================================= */}

        {cameraError && (
          <div className="error-message">
            {cameraError}
          </div>
        )}

        {loadingCameras && (
          <p className="empty-message">
            Loading cameras...
          </p>
        )}

        {!loadingCameras &&
          !cameraError && (

            <div className="camera-grid">

              {filteredCameras.length ===
              0 ? (

                <p className="empty-message">
                  No cameras found.
                </p>

              ) : (

                filteredCameras.map(
                  (camera) => (

                    <div
                      className="camera-card"
                      key={camera.id}
                    >

                      <div className="video-container">

                        {camera.stream_url ? (

                          <video
                            controls
                            muted
                            autoPlay
                            loop
                            playsInline
                          >

                            <source
                              src={`${API_BASE}/api/v1/video/${camera.stream_url}`}
                              type="video/mp4"
                            />

                            Your browser does not
                            support video playback.

                          </video>

                        ) : (

                          <div className="no-video">
                            No video source
                          </div>

                        )}

                      </div>

                      <h3>
                        {camera.name}
                      </h3>

                      <p>
                        <b>ID:</b>{" "}
                        {camera.camera_code}
                      </p>

                      <p>
                        <b>Department:</b>{" "}
                        {camera.department}
                      </p>

                      <p>
                        <b>Zone:</b>{" "}
                        {camera.zone ||
                          "N/A"}
                      </p>

                      <span
                        className={`status ${
                          (
                            camera.status ||
                            ""
                          ).toLowerCase()
                        }`}
                      >
                        {camera.status}
                      </span>

                      <div className="camera-actions">

                        <button
                          className="heartbeat-btn"
                          title="Send instant heartbeat to mark camera ONLINE"
                          onClick={() => handleSendHeartbeat(camera.id)}
                        >
                          ❤️ Heartbeat
                        </button>

                        <button
                          className="audit-btn"
                          title="View audit event history"
                          onClick={() => handleOpenAudit(camera)}
                        >
                          📜 Audit
                        </button>

                        {userRole === "admin" && (
                          <>
                            <button
                              className="edit-camera-button"
                              onClick={() =>
                                handleEditCamera(
                                  camera
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="disable-camera-button"
                              onClick={() =>
                                handleDisableCamera(
                                  camera.id
                                )
                              }
                            >
                              Disable
                            </button>
                          </>
                        )}

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          )}

      </section>


      {/* =================================================
          LIVE MONITORING
      ================================================= */}

      <section className="monitoring-section">

        <LiveMonitoring
          cameras={filteredCameras}
        />

      </section>


      {/* =================================================
          CAMERA MAP
      ================================================= */}

      <section className="map-section">

        <div className="section-header">

          <div>
            <h2>
              Camera Locations
            </h2>

            <p>
              Geographic camera and vehicle
              movement visualization
            </p>
          </div>

        </div>

        <CameraMap
          cameras={cameras}
          movement={searchResults}
          activeAlertCameraIds={
            activeAlertCameraIds
          }
        />

      </section>


      {/* =================================================
          ENTITY SEARCH
      ================================================= */}

      <section className="search-section">

        <h2>
          Entity Search
        </h2>

        <p>
          Search vehicle identifiers and
          reconstruct their movement history
          across cameras.
        </p>

        <div className="search-box">

          <input
            type="text"
            placeholder="Enter vehicle number"
            value={searchVehicle}
            onChange={(event) =>
              setSearchVehicle(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                handleSearch();
              }
            }}
          />

          <button
            onClick={handleSearch}
          >
            Search
          </button>

        </div>

        {searchResults.length > 0 && (

          <div className="search-results">

            <h3>
              Detection History
            </h3>

            {searchResults.map(
              (result, index) => (

                <div
                  className="result-card"
                  key={
                    result.detection_id
                  }
                >

                  <p>
                    <b>Sequence:</b>{" "}
                    {index + 1}
                  </p>

                  <p>
                    <b>Vehicle:</b>{" "}
                    {result.vehicle_number}
                  </p>

                  <p>
                    <b>Camera:</b>{" "}
                    {result.camera_name}
                  </p>

                  <p>
                    <b>Camera ID:</b>{" "}
                    {result.camera_id}
                  </p>

                  <p>
                    <b>Confidence:</b>{" "}
                    {result.confidence
                      ? `${(
                          result.confidence *
                          100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </p>

                  <p>
                    <b>Time:</b>{" "}
                    {result.timestamp
                      ? new Date(
                          result.timestamp
                        ).toLocaleString()
                      : "N/A"}
                  </p>

                </div>

              )
            )}

          </div>

        )}

        {searchVehicle.trim() &&
          searchResults.length === 0 && (

            <p className="empty-message">
              No detection history found.
            </p>

          )}

      </section>


      {/* =================================================
          WATCHLIST
      ================================================= */}

      <section className="watchlist-section">

        <div className="section-header">

          <div>

            <h2>
              Watchlist
            </h2>

            <p>
              Manage identifiers that should
              generate immediate alerts.
            </p>

          </div>

        </div>


        {/* ADD WATCHLIST */}

        <div className="watchlist-form-card">

          <h3>
            Add Watchlist Entry
          </h3>

          {watchlistError && (
            <div className="error-message">
              {watchlistError}
            </div>
          )}

          <form
            onSubmit={
              handleAddWatchlist
            }
          >

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Identifier
                </label>

                <input
                  type="text"
                  placeholder="DL01AB1234"
                  value={
                    watchlistIdentifier
                  }
                  onChange={(event) =>
                    setWatchlistIdentifier(
                      event.target.value
                    )
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Entity Type
                </label>

                <select
                  value={
                    watchlistType
                  }
                  onChange={(event) =>
                    setWatchlistType(
                      event.target.value
                    )
                  }
                >

                  <option value="VEHICLE">
                    Vehicle
                  </option>

                  <option value="PERSON">
                    Person
                  </option>

                  <option value="OBJECT">
                    Object
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <input
                  type="text"
                  placeholder="Demo watchlist vehicle"
                  value={
                    watchlistDescription
                  }
                  onChange={(event) =>
                    setWatchlistDescription(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

            <div className="form-actions">

              <button
                type="submit"
                className="submit-button"
                disabled={
                  addingWatchlist
                }
              >
                {addingWatchlist
                  ? "Adding..."
                  : "Add to Watchlist"}
              </button>

            </div>

          </form>

        </div>


        {/* WATCHLIST LIST */}

        <div className="watchlist-list">

          {watchlist.length === 0 ? (

            <p className="empty-message">
              No watchlist entries.
            </p>

          ) : (

            watchlist.map(
              (entry) => (

                <div
                  className="watchlist-card"
                  key={entry.id}
                >

                  <div>

                    <strong>
                      {entry.identifier}
                    </strong>

                    <p>
                      Type:{" "}
                      {entry.entity_type}
                    </p>

                    <p>
                      {entry.description ||
                        "No description"}
                    </p>

                  </div>

                  <div>

                    <span
                      className={
                        entry.is_active
                          ? "status online"
                          : "status offline"
                      }
                    >
                      {entry.is_active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>

                    {entry.is_active && (

                      <button
                        className="disable-camera-button"
                        onClick={() =>
                          handleDeactivateWatchlist(
                            entry.id
                          )
                        }
                      >
                        Deactivate
                      </button>

                    )}

                  </div>

                </div>

              )
            )

          )}

        </div>

      </section>


      {/* =================================================
          RECENT AI DETECTIONS
      ================================================= */}

      <section className="detections-section">

        <div className="section-header">

          <div>

            <h2>
              Recent AI Detections
            </h2>

            <p>
              Events received from video
              analytics
            </p>

          </div>

        </div>

        {detections.length === 0 ? (

          <p className="empty-message">
            No detections available.
          </p>

        ) : (

          <div className="detections-list">

            {detections.map(
              (detection, index) => (

                <div
                  className="detection-card"
                  key={
                    detection.id ||
                    `detection-${index}`
                  }
                >

                  <div>

                    <strong>
                      {detection.event_type}
                    </strong>

                    <p>
                      Camera ID:{" "}
                      {detection.camera_id}
                    </p>

                    <p>
                      Camera:{" "}
                      {getCameraName(
                        detection.camera_id
                      )}
                    </p>

                  </div>

                  <div>

                    <p>
                      <b>
                        Vehicle:
                      </b>{" "}
                      {detection.vehicle_number ||
                        "N/A"}
                    </p>

                    <p>
                      <b>
                        Confidence:
                      </b>{" "}
                      {detection.confidence
                        ? `${(
                            detection.confidence *
                            100
                          ).toFixed(1)}%`
                        : "N/A"}
                    </p>

                    <p>
                      <b>
                        Time:
                      </b>{" "}
                      {detection.timestamp
                        ? new Date(
                            detection.timestamp
                          ).toLocaleString()
                        : "N/A"}
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* =================================================
          ALERT CENTER
      ================================================= */}

      <section className="alerts-section">

        <div className="alerts-header">

          <div>

            <h2>
              Alert Center
            </h2>

            <p>
              Real-time watchlist and
              detection alerts
            </p>

          </div>

          <select
            value={alertFilter}
            onChange={(event) =>
              setAlertFilter(
                event.target.value
              )
            }
          >

            <option value="ALL">
              All Alerts
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="ACKNOWLEDGED">
              Acknowledged
            </option>

            <option value="RESOLVED">
              Resolved
            </option>

          </select>

        </div>


        {/* ALERT SUMMARY */}

        <div className="stats">

          <div className="stat-card">

            <h3>
              Active Alerts
            </h3>

            <strong>
              {activeAlertsCount}
            </strong>

          </div>

          <div className="stat-card">

            <h3>
              Acknowledged
            </h3>

            <strong>
              {acknowledgedAlertsCount}
            </strong>

          </div>

          <div className="stat-card">

            <h3>
              Resolved
            </h3>

            <strong>
              {resolvedAlertsCount}
            </strong>

          </div>

        </div>


        {/* ALERT LIST */}

        {filteredAlerts.length === 0 ? (

          <p className="empty-message">
            No alerts found.
          </p>

        ) : (

          filteredAlerts.map(
            (alert, index) => {

              const alertId =
                alert.alert_id ||
                alert.id;

              return (

                <div
                  className={`alert-card ${
                    (
                      alert.status ||
                      "ACTIVE"
                    ).toLowerCase()
                  }`}
                  key={
                    alertId ||
                    index
                  }
                >

                  <div className="alert-top">

                    <h3>
                      🚨 Watchlist Match
                    </h3>

                    <span className="alert-status">
                      {alert.status ||
                        "ACTIVE"}
                    </span>

                  </div>

                  <p>
                    <b>
                      Vehicle:
                    </b>{" "}
                    {alert.identifier ||
                      "N/A"}
                  </p>

                  <p>
                    <b>
                      Camera:
                    </b>{" "}
                    {getCameraName(
                      alert.camera_id
                    )}
                  </p>

                  <p>
                    <b>
                      Camera ID:
                    </b>{" "}
                    {alert.camera_id ||
                      "N/A"}
                  </p>

                  <p>
                    <b>
                      Confidence:
                    </b>{" "}
                    {alert.confidence
                      ? `${(
                          alert.confidence *
                          100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </p>

                  <p>
                    <b>
                      Status:
                    </b>{" "}
                    {alert.status ||
                      "ACTIVE"}
                  </p>

                  <div className="alert-actions">

                    {alert.status ===
                      "ACTIVE" && (

                      <button
                        onClick={() =>
                          updateAlertStatus(
                            alertId,
                            "acknowledge"
                          )
                        }
                      >
                        Acknowledge
                      </button>

                    )}

                    {alert.status !==
                      "RESOLVED" && (

                      <button
                        onClick={() =>
                          updateAlertStatus(
                            alertId,
                            "resolve"
                          )
                        }
                      >
                        Resolve
                      </button>

                    )}

                  </div>

                </div>

              );
            }
          )

        )}

      </section>


      {/* =================================================
          REAL-TIME EVENTS
      ================================================= */}

      <section className="alerts-section">

        <div className="section-header">

          <div>

            <h2>
              Real-Time Events
            </h2>

            <p>
              Live events received through
              WebSocket
            </p>

          </div>

          <span
            className={
              wsConnected
                ? "status online"
                : "status offline"
            }
          >
            {wsConnected
              ? "CONNECTED"
              : "DISCONNECTED"}
          </span>

        </div>


        {realtimeEvents.length === 0 ? (

          <p className="empty-message">
            Waiting for real-time events...
          </p>

        ) : (

          <div className="detections-list">

            {realtimeEvents.map(
              (event, index) => (

                <div
                  className="detection-card"
                  key={
                    `${event.type}-${event.id || event.alert_id || event.camera_id}-${index}`
                  }
                >

                  <div>

                    <strong>
                      {event.type}
                    </strong>

                    <p>
                      {event.type ===
                        "DETECTION" &&
                        "AI detection received"}

                      {event.type ===
                        "WATCHLIST_ALERT" &&
                        "Watchlist match detected"}

                      {event.type ===
                        "CAMERA_HEALTH" &&
                        "Camera health updated"}
                    </p>

                  </div>

                  <div>

                    {event.vehicle_number && (

                      <p>
                        <b>
                          Vehicle:
                        </b>{" "}
                        {event.vehicle_number}
                      </p>

                    )}

                    {event.identifier && (

                      <p>
                        <b>
                          Identifier:
                        </b>{" "}
                        {event.identifier}
                      </p>

                    )}

                    {event.camera_id && (

                      <p>
                        <b>
                          Camera:
                        </b>{" "}
                        {getCameraName(
                          event.camera_id
                        )}
                      </p>

                    )}

                    {event.status && (

                      <p>
                        <b>
                          Status:
                        </b>{" "}
                        {event.status}
                      </p>

                    )}

                    <p>
                      <b>
                        Received:
                      </b>{" "}
                      {event.received_at
                        ? new Date(
                            event.received_at
                          ).toLocaleTimeString()
                        : "Now"}
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>
      
      {/* =================================================
          AUDIT LOG MODAL
      ================================================= */}
      {selectedAuditCamera && (
        <div className="modal-overlay" onClick={() => setSelectedAuditCamera(null)}>
          <div className="audit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <div>
                <h3>Camera Audit Trail</h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  {selectedAuditCamera.name} ({selectedAuditCamera.camera_code})
                </p>
              </div>
              <button
                className="close-button"
                onClick={() => setSelectedAuditCamera(null)}
              >
                ✕
              </button>
            </div>
            <div className="audit-modal-body">
              {auditLoading ? (
                <p>Loading audit records...</p>
              ) : cameraAuditLogs.length === 0 ? (
                <p className="empty-message">No audit logs recorded for this camera yet.</p>
              ) : (
                cameraAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`audit-log-item ${log.event.toLowerCase()}`}
                  >
                    <div className="audit-badge">{log.event}</div>
                    <div style={{ fontSize: "13px", color: "#334155", marginTop: "4px" }}>
                      {log.details || "No details provided"}
                    </div>
                    <div className="audit-log-meta">
                      <span>Log ID #{log.id}</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;