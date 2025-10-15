# Distributed Tracing Guide for PSRA Services

This guide covers implementing and using distributed tracing with OpenTelemetry and Jaeger across PSRA microservices.

## Overview
Distributed tracing tracks requests across services, helping identify bottlenecks, slow queries, and dependencies. We use OpenTelemetry for instrumentation and Jaeger for visualization.

## Setup
1. **Install Dependencies** (in each service's Dockerfile or requirements.txt):