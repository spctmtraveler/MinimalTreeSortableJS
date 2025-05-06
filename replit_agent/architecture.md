# Architecture Documentation

## Overview

Task Tree is a web application that provides a collapsible, nested task tree with drag-and-drop functionality. It is a simple, frontend-only application that uses vanilla JavaScript along with the Sortable.js library to implement an interactive task management interface.

The application is designed to be a lightweight, client-side solution for organizing and managing hierarchical tasks. It allows users to rearrange tasks through drag-and-drop, enabling intuitive task organization.

## System Architecture

The system follows a simple client-side architecture with the following components:

- **Frontend**: HTML, CSS, and vanilla JavaScript
- **Third-party Libraries**: SortableJS for drag-and-drop functionality
- **Hosting**: Python's built-in HTTP server for development/deployment

The application is designed to run entirely in the browser with no backend storage or processing. All task manipulation occurs client-side.

### Architectural Decisions

1. **Frontend-only approach**
   - Problem: Need a lightweight task organization tool
   - Solution: Build a client-side only application
   - Pros: Simple deployment, no backend dependencies, instant user feedback
   - Cons: Limited persistence options (likely relies on local storage or requires implementation of backend storage)

2. **Use of SortableJS library**
   - Problem: Implementing drag-and-drop functionality from scratch is complex
   - Solution: Leverage the SortableJS library
   - Pros: Robust drag-and-drop with nested list support, touch device compatibility
   - Cons: External dependency

## Key Components

### Frontend Components

1. **HTML Structure (`index.html`)**
   - Defines the basic page layout
   - Sets up the main container for the task tree
   - Imports necessary CSS and JavaScript files

2. **Styling (`styles.css`)**
   - Provides a dark theme UI
   - Defines styles for the task tree components
   - Handles visual feedback for drag-and-drop operations

3. **Application Logic (`script.js`)**
   - Manages the creation and manipulation of task components
   - Implements the drag-and-drop functionality using SortableJS
   - Handles collapsible task hierarchies

### Core Functions

1. `createChildrenContainer(taskElement)`: Creates a container for child tasks within a parent task, setting up nested Sortable instances to enable hierarchical drag-and-drop.

## Data Flow

1. **User Interaction**
   - User interacts with task items through the browser interface
   - Drag-and-drop actions are captured by SortableJS
   - Visual feedback is provided during drag operations

2. **Task Manipulation**
   - Tasks can be rearranged within the same level (horizontal movement)
   - Tasks can be nested under other tasks (likely through specific drag patterns)
   - The application updates the DOM to reflect the new task hierarchy

3. **Data Persistence**
   - Not explicitly implemented in the provided code
   - Would likely require implementation through localStorage, sessionStorage, or a backend service

## External Dependencies

1. **SortableJS (v1.15.0)**
   - Purpose: Provides drag-and-drop functionality for task items
   - Integration: Loaded via CDN in the HTML file
   - Website: https://sortablejs.github.io/Sortable/

2. **Google Fonts (Inter)**
   - Purpose: Typography
   - Integration: Loaded via Google Fonts CDN
   - Weights: 400, 500, 600

## Deployment Strategy

The application is deployed using a simple Python HTTP server:

```
python -m http.server 5000
```

This serves the static files on port 5000 locally, which is then mapped to external port 80 according to the Replit configuration.

### Development Environment

The project is configured to run in a Replit environment with:
- Node.js 20
- Python 3.11
- Development workflow configured to start the Python HTTP server

### Deployment Configuration

The `.replit` file contains configuration for:
- Running the application in development mode
- Port mapping (5000 → 80)
- Deployment instructions

This simple deployment strategy is suitable for a static frontend application, requiring only a basic web server to serve the files.

## Future Considerations

1. **Data Persistence**
   - Implementing localStorage/sessionStorage for client-side persistence
   - Adding a backend API for server-side storage

2. **Authentication**
   - Adding user accounts if the application were to be expanded

3. **Offline Support**
   - Implementing service workers for offline functionality

4. **Mobile Optimization**
   - While the application has meta tags for mobile viewing, further optimization for touch interactions may be beneficial