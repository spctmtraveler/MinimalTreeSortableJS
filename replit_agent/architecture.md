# Architecture Overview

## Overview

This repository contains a simple web application that implements a collapsible, nested task tree with drag-and-drop functionality. The application is built entirely as a client-side solution using vanilla JavaScript, HTML, and CSS, with the SortableJS library providing drag-and-drop capabilities. A basic Python HTTP server is used for development and deployment.

## System Architecture

The system follows a simple static web application architecture:

- **Frontend**: Pure HTML, CSS, and JavaScript running in the browser
- **Backend**: Basic HTTP server (Python's http.server module) that serves static files
- **Deployment**: Configured to run on Replit with port mapping

The architecture is intentionally minimalist, with all application logic implemented client-side. There is no database, API layer, or server-side processing.

## Key Components

### Frontend Components

1. **HTML Structure (`index.html`)**
   - Provides the basic page structure
   - References external stylesheets (custom CSS and Google Fonts)
   - Loads the SortableJS library from CDN
   - Contains a container for the task tree that gets populated by JavaScript

2. **Styling (`styles.css`)**
   - Defines the visual appearance of the application
   - Uses the Inter font family
   - Implements a dark theme with accent colors
   - Contains styling for the task tree components

3. **Client-side Logic (`script.js`)**
   - Implements the task tree functionality
   - Uses SortableJS to enable drag-and-drop capabilities
   - Handles the creation and management of nested task lists
   - Provides UI interaction logic

### External Libraries

1. **SortableJS**
   - Third-party JavaScript library loaded from CDN
   - Provides the core drag-and-drop functionality
   - Configured for nested lists with custom animation and behavior

### Development/Deployment Infrastructure

1. **Python HTTP Server**
   - Simple static file server using Python's built-in http.server module
   - Runs on port 5000 locally, mapped to port 80 externally

## Data Flow

The application operates entirely in the browser with the following data flow:

1. User loads the page from the HTTP server
2. JavaScript initializes the task tree interface
3. User interacts with the task tree through the drag-and-drop interface
4. SortableJS handles the movement of tasks
5. Custom JavaScript updates the internal data structure based on user actions

There is no persistence layer in the current implementation. Any task data will be lost when the page is refreshed.

## External Dependencies

1. **SortableJS** - JavaScript library for sortable lists and grids
   - Version: 1.15.0
   - Loaded via CDN: https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js

2. **Google Fonts** - Web fonts
   - Font Family: Inter (weights: 400, 500, 600)
   - Loaded via CDN: https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap

## Deployment Strategy

The application is configured for deployment on Replit with the following specifications:

1. **Runtime Environment**
   - Modules: nodejs-20, python-3.11
   - Nix channel: stable-24_05

2. **Deployment Process**
   - Run command: `python -m http.server 5000`
   - Port mapping: Local port 5000 mapped to external port 80

3. **Workflows**
   - A "Project" workflow that runs the WebServer task
   - A "WebServer" workflow that executes the Python HTTP server

## Limitations and Future Considerations

1. **Persistence**: The current implementation lacks data persistence. Adding a backend service with a database would be necessary for saving task data.

2. **Authentication**: There is no user authentication or authorization mechanism.

3. **Scalability**: The application is suitable for client-side use only and may have performance limitations with very large task trees.

4. **Mobile Optimization**: While the viewport meta tags suggest mobile compatibility, more extensive testing and optimization would be needed for a fully responsive experience.