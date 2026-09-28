import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

const getMarkerColor = (status) => {
  if (status === "ONLINE") return "green";
  if (status === "DEGRADED") return "orange";
  return "red";
};

function createMarkerIcon(status) {
  const color = getMarkerColor(status);

  return L.divIcon({
    className: "custom-camera-marker",
    html: `
      <div
        style="
          width: 18px;
          height: 18px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "
      ></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function createMovementIcon() {
  return L.divIcon({
    className: "movement-marker",
    html: `
      <div
        style="
          width: 14px;
          height: 14px;
          background: #2563eb;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "
      ></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function MapUpdater({ movement }) {
  const map = useMap();

  useEffect(() => {
    const coordinates = movement
      .filter(
        (item) =>
          item.latitude !== null &&
          item.longitude !== null
      )
      .map((item) => [
        item.latitude,
        item.longitude,
      ]);

    if (coordinates.length === 1) {
      map.setView(coordinates[0], 14);
    }

    if (coordinates.length > 1) {
      map.fitBounds(coordinates, {
        padding: [50, 50],
      });
    }
  }, [movement, map]);

  return null;
}

function CameraMap({
  cameras = [],
  movement = [],
  activeAlertCameraIds = [],
}) {
  const movementCoordinates = movement
    .filter(
      (item) =>
        item.latitude !== null &&
        item.longitude !== null
    )
    .map((item) => [
      item.latitude,
      item.longitude,
    ]);

  return (
    <div className="camera-map-wrapper">

      {/* MAP */}

      <MapContainer
        center={[28.6139, 77.2090]}
        zoom={12}
        style={{
          height: "500px",
          width: "100%",
        }}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* CAMERA MARKERS */}

        {cameras.map((camera) => {

          const hasActiveAlert =
            activeAlertCameraIds.includes(camera.id);

          return (
            <Marker
              key={`camera-${camera.id}`}
              position={[
                camera.latitude,
                camera.longitude,
              ]}
              icon={createMarkerIcon(camera.status)}
            >

              <Popup>

                <div>
                  <h3 style={{ marginBottom: "8px" }}>
                    {camera.name}
                  </h3>

                  <strong>
                    {camera.camera_code}
                  </strong>

                  <p>
                    Status:{" "}
                    <b>{camera.status}</b>
                  </p>

                  <p>
                    Department:{" "}
                    {camera.department}
                  </p>

                  <p>
                    Zone:{" "}
                    {camera.zone || "N/A"}
                  </p>

                  <p>
                    Type:{" "}
                    {camera.camera_type}
                  </p>

                  {hasActiveAlert && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "7px",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        borderRadius: "6px",
                        fontWeight: "600",
                      }}
                    >
                      ⚠ Active Alert
                    </div>
                  )}

                </div>

              </Popup>

            </Marker>
          );
        })}

        {/* VEHICLE MOVEMENT LINE */}

        {movementCoordinates.length > 1 && (
          <Polyline
            positions={movementCoordinates}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.8,
            }}
          />
        )}

        {/* MOVEMENT MARKERS */}

        {movement.map((item, index) => {

          if (
            item.latitude === null ||
            item.longitude === null
          ) {
            return null;
          }

          return (
            <Marker
              key={`movement-${item.detection_id}`}
              position={[
                item.latitude,
                item.longitude,
              ]}
              icon={createMovementIcon()}
            >

              <Popup>

                <div>

                  <h3>
                    Vehicle Detection
                  </h3>

                  <p>
                    <strong>Vehicle:</strong>{" "}
                    {item.vehicle_number}
                  </p>

                  <p>
                    <strong>Camera:</strong>{" "}
                    {item.camera_name}
                  </p>

                  <p>
                    <strong>Sequence:</strong>{" "}
                    {index + 1}
                  </p>

                  <p>
                    <strong>Time:</strong>{" "}
                    {new Date(
                      item.timestamp
                    ).toLocaleString()}
                  </p>

                  <p>
                    <strong>Confidence:</strong>{" "}
                    {item.confidence
                      ? `${(
                          item.confidence * 100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </p>

                </div>

              </Popup>

            </Marker>
          );
        })}

        <MapUpdater movement={movement} />

      </MapContainer>

      {/* MAP LEGEND */}

      <div className="map-legend">

        <div className="legend-title">
          Camera Status
        </div>

        <div className="legend-item">
          <span className="legend-dot online"></span>
          Online
        </div>

        <div className="legend-item">
          <span className="legend-dot degraded"></span>
          Degraded
        </div>

        <div className="legend-item">
          <span className="legend-dot offline"></span>
          Offline
        </div>

        <div className="legend-item">
          <span className="legend-dot movement"></span>
          Vehicle Movement
        </div>

      </div>

    </div>
  );
}

export default CameraMap;