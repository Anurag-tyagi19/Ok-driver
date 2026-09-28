# Scalability and Deployment Note

The submitted implementation is a functional prototype demonstrating the complete CCTV intelligence workflow.

For a large deployment with tens of thousands of cameras, the system would evolve from a single FastAPI instance into a distributed architecture.

## 1. Camera Connectivity

Cameras would connect through regional or edge gateways.

These gateways would handle:

- Camera connectivity
- RTSP/ONVIF integration
- Stream health
- Local buffering
- Video preprocessing

This prevents every camera from maintaining a direct high-bandwidth connection to the central application.

## 2. Video Processing

AI inference would run through dedicated workers, potentially using GPU infrastructure.

The inference service would publish structured events rather than sending raw video through every backend service.

Example:

Camera → Edge Gateway → AI Inference → Detection Event

## 3. Event Processing

Redis, Kafka or RabbitMQ can be introduced between inference services and backend workers.

This provides:

- Event buffering
- Asynchronous processing
- Horizontal scaling
- Retry handling
- Decoupling between services

## 4. Backend Scaling

Multiple FastAPI instances can run behind a load balancer.

Redis can be used for shared real-time event distribution so WebSocket clients connected to different backend instances receive the same events.

## 5. Database Scaling

PostgreSQL would store camera metadata, detections, alerts and operational data.

At higher volumes:

- Proper indexing
- Table partitioning
- Read replicas
- Archival policies
- Retention policies

can be introduced.

Video files should not be stored directly in PostgreSQL.

Object storage should be used for long-term video retention.

## 6. Regional Architecture

A large deployment could use:

Camera
↓
Regional Gateway
↓
Regional AI Processing
↓
Message Broker
↓
Central Platform

This reduces bandwidth and allows failures in one region to be isolated.

## 7. Reliability

Production deployment should include:

- Multiple backend instances
- Health checks
- Automatic restart
- Monitoring
- Centralized logging
- Backup
- Disaster recovery
- Alerting

The submitted project focuses on demonstrating the end-to-end functionality while keeping this architecture path available for future scale.