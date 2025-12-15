# Capstone Project Management System

## Overview
Web application for managing Capstone Projects, featuring role-based access for Students and Admins.

## Features & Implementation Status

### Core Features (MVP)
- [x] **Authentication**
  - Login & Register with role selection
  - Secure session management
- [x] **Student Dashboard**
  - Team Information & Status
  - Document Repository & Timeline View
  - Individual Worksheet Management (Weekly Logbooks)
  - 360-Degree Feedback Submission
- [x] **Admin Dashboard**
  - **Team Management**:
    - List all teams with status filters
    - Validate (Accept/Reject) team registrations
    - View detailed team profiles (Members, Use Case)
  - **Group Composition**:
    - Set team rules (e.g., minimum learning paths)
    - **Randomize Teams**: Auto-assign unassigned students
    - **Unassigned Students**: View and manage students without teams
  - **Worksheet Management**:
    - Review and validate student worksheets
    - Set Deadlines & Auto-validation

### Advanced / Optional Features
- [x] **Complex Team Editing**
  - **Override Learning Path**: Admin can manually change a student's learning path.
  - **Member Status Control**: Admin can set members to Active/Inactive.
  - **Leader Sorting**: Leaders always appear at the top of the list.
- [x] **Data Export**
  - Export Team Data (CSV/Excel via API)
  - Export Feedback Data
- [x] **360-Degree Feedback System**
  - Dynamic Dashboard Card (Status updates)
  - Full feedback form integration
- [x] **UI/UX Enhancements**
  - Responsive Mobile Design
  - Modern "Glassmorphism" inspired dashboard
  - Dynamic Modals for all actions

## Tech Stack
- **Frontend**: Vanilla JS (ES6+), CSS3 (Modern Flexbox/Grid), HTML5
- **Tooling**: Vite
- **API**: RESTful integration

## Project Structure
- `/src/js`: Application logic (Components, Services, Router)
- `/src/css`: Modular styles
- `/assets`: Static resources
