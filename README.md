# TRANSCENDENCE

## Table of Contents
- [About](#about)
- [Installation](#installation)
- [Usage](#usage)
- [Key Concepts Learned](#key-concepts-learned)
- [Skills Developed](#skills-developed)
- [Project Overview](#project-overview)
- [Architecture & Stack](#architecture--stack)
- [42 School Standards](#42-school-standards)

## About

This repository contains my implementation of the **Transcendence** project at 42 School.  
Transcendence is the **final capstone project** of the 42 curriculum, representing the culmination of all learned skills in a **full-stack web application**.  
This project is a modern, real-time multiplayer **Pong game platform** featuring advanced user management, live chat, AI opponents, comprehensive monitoring, and enterprise-grade security.
I was in charge of the **DevOps**, **DevSecOps** & **SysAdmin** parts. 

Built as a **Single Page Application (SPA)** with cutting-edge web technologies, this project demonstrates mastery of **modern software architecture**, **real-time systems**,
**DevOps practices**, and **scalable application development** suitable for production environments.


## Installation

### Prerequisites
- **Docker Engine** (20.10+) & **Docker Compose** (v2.0+)
- **Node.js** (18+) & **npm** (8+)
- **TypeScript** (3.9+) for AI and backend services
- **Prisma** (13+) for database operations

### Quick Setup
```bash
# Clone the repository
git clone https://github.com/TuroTheReal/Transcendence.git
cd Transcendence

# Environment setup
cp .env.example .env
# Configure your environment variables

# Build and launch the full application
.run.sh

# Access the application
# Frontend: https://localhost:3002
# DevOps Metrics: http://localhost:5601/9093/9080
# Database with prisma: cd backend && npx prisma studio http://localhost:5555
```


## Usage

### Quick Start Guide
```bash
# 1. Launch the application
.run.sh

# 2. Create your account
# 3. Set up 2FA authentication or remote with Google Sign-in
# 4. Join the global chat or play the game
# 5. Challenge friends to Pong matches
# 6. Check your stats and tournament standings
# 7. Lock or unlock users
```

### Game Features
- **Classic Pong**: Traditional gameplay with modern enhancements
- **Multiplayer Modes**: 2+ players in the same match
- **Real-time Chat**: Live messaging

### User Management
- **Google Sign-In**: Login with your Google account
- **Two-Factor Authentication**: Enhanced security with TOTP
- **Profile Statistics**: Avatars, stats, achievements
- **Friend System**: Add friends and track their activity
- **Match History**: Detailed game statistics and replays


## Key Concepts Learned

### DevOps and Infrastructure
- **Containerization**: Docker-based development and deployment
- **Monitoring Systems**: Application performance monitoring and alerting
- **Log Management**: Centralized logging with ELK stack integration

### Full-Stack Web Development
- **Modern Frontend Architecture**: Component-based SPA with state management
- **RESTful API Design**: Scalable backend architecture with proper HTTP semantics
- **Real-time Communication**: WebSocket implementation for live gaming and chat
- **Database Design**: Relational database modeling and optimization

### Advanced Security Implementation
- **Authentication Systems**: Google Sign-In, JWT, and session management
- **Authorization Patterns**: Role-based access control and permissions
- **Two-Factor Authentication**: TOTP implementation with QR codes

### Real-time Systems
- **Game State Management**: Synchronizing game state across multiple clients
- **WebSocket Architecture**: Bidirectional real-time communication
- **Event-Driven Programming**: Handling user actions and system events
- **Concurrency Management**: Thread-safe operations and race condition prevention


## Skills Developed

- **DevOps Practices**: Production-ready deployment and monitoring strategies
- **Modern Web Technologies**: Mastery of current industry-standard frameworks and tools
- **Security Engineering**: Implementing enterprise-grade security measures
- **UI/UX Design**: Creating intuitive, responsive user interfaces
- **Full-Stack Engineering**: End-to-end application development and architecture
- **Real-time System Design**: Building responsive, low-latency multiplayer experiences
- **Database Engineering**: Advanced SQL, optimization, and data modeling
- **Project Management**: Coordinating complex, multi-module development


## Project Overview

Transcendence represents a complete web application ecosystem featuring real-time multiplayer gaming, comprehensive user management,
live communication systems, and enterprise-grade monitoring.
The project showcases modern software architecture patterns and production-ready development practices.

### Vision and Goals
Create a scalable, secure, and engaging platform for competitive Pong gameplay while demonstrating mastery of full-stack development,
real-time systems, and modern DevOps practices.

### Core Architecture

**Infrastructure Layer**: Containerized deployment with monitoring, logging, and automated scaling capabilities.
**Backend Layer**: Robust framework-based API server with authentication, game logic, and real-time communication.
**Database Layer**: PostgreSQL with optimized schemas for user data, game statistics, and chat history.
**Frontend Layer**: Modern framework-based SPA with responsive design, real-time updates, and internationalization support.


## Architecture & Stack

### Infrastructure & DevOps
- **Containerization**: Docker multi-service deployment
- **Monitoring**: Application performance monitoring and alerting
- **Logging**: Centralized log aggregation and analysis
- **Security**: SSL/TLS, non-root on critical containers
- 
### Frontend Stack
- **State Management**: Centralized application state with real-time synchronization
- **Styling**: Responsive Tailwind with component-based architecture
- **Real-time**: WebSocket client for live game updates and chat
- **Internationalization**: Multi-language support for global accessibility
- **Security**: CSP implementation and XSS protection

### Backend Stack
- **Database**: Prisma with advanced indexing and optimization
- **Authentication**: JWT + Google Sign-In + 2FA implementation
- **Real-time**: WebSocket server for multiplayer and chat
- **API Design**: RESTful architecture with OpenAPI documentation
- **Security**: Rate limiting, input validation, and secure headers


## 42 School Standards

### Project Standards
- ✅ **Single Page Application**: Modern SPA architecture
- ✅ **Browser Compatibility**: Cross-browser support and testing
- ✅ **Security First**: Comprehensive security implementation
- ✅ **Real-time Features**: WebSocket-based live functionality
- ✅ **Database Integration**: Professional database design and usage
- ✅ **User Management**: Complete authentication and authorization

### Module Requirements
- ✅ **Mandatory Modules**: All core requirements implemented
- ✅ **Major Modules**: 7 major modules successfully integrated
- ✅ **Minor Modules**: 4 minor modules enhancing functionality
- ✅ **Integration**: Seamless integration between all modules
- ✅ **Documentation**: Comprehensive technical documentation
- ✅ **Testing**: Thorough testing across all features

### Production Readiness
- ✅ **Monitoring & Logging**: Enterprise-grade observability
- ✅ **Security Compliance**: Industry-standard security practices
- ✅ **Performance**: Optimized for high-traffic scenarios
- ✅ **Scalability**: Architecture supporting growth
- ✅ **Maintainability**: Clean, documented, and extensible codebase


## Contact

- **GitHub**: [@TuroTheReal](https://github.com/TuroTheReal)
- **Email**: arthurbernard.dev@gmail.com
- **LinkedIn**: [Arthur Bernard](https://www.linkedin.com/in/arthurbernard92/)
- **Portfolio**: https://arthur-portfolio.com

---

<p align="center">
  <img src="https://img.shields.io/badge/Grafana-Monitoring-orange?logo=grafana&logoColor=white" alt="Grafana Badge"/>
  <img src="https://img.shields.io/badge/Prometheus-Metrics-orange?logo=prometheus&logoColor=white" alt="Prometheus Badge"/>
  <img src="https://img.shields.io/badge/Elasticsearch-Search-005571?logo=elasticsearch&logoColor=white" alt="Elasticsearch Badge"/>
  <img src="https://img.shields.io/badge/Kibana-Visualization-e8488b?logo=kibana&logoColor=white" alt="Kibana Badge"/>
  <img src="https://img.shields.io/badge/Logstash-Logs-000000?logo=logstash&logoColor=white" alt="Logstash Badge"/>
  <img src="https://img.shields.io/badge/Docker-Containerization-2496ED?logo=docker&logoColor=white" alt="Docker Badge"/>
</p>
