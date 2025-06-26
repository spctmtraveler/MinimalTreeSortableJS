# DUN Task Management Application

## Overview

DUN is a hierarchical task management application built with vanilla JavaScript, HTML, and CSS. The application provides a clean, minimalist interface for organizing tasks in a nested tree structure with drag-and-drop functionality. The system currently supports two backend storage options: Google Sheets integration and PostgreSQL database connectivity.

## System Architecture

The application follows a hybrid client-server architecture:

- **Frontend**: Pure vanilla JavaScript with no frameworks, emphasizing simplicity and performance
- **Backend**: Node.js with Express.js serving both static files and API endpoints
- **Storage**: Dual backend support for Google Sheets API and PostgreSQL database
- **UI Library**: SortableJS for drag-and-drop functionality

### Architectural Decisions

1. **Vanilla JavaScript approach**
   - Problem: Need a lightweight, fast-loading task management interface
   - Solution: Built entirely with vanilla JavaScript, HTML, and CSS
   - Pros: Zero framework overhead, faster load times, easier debugging
   - Cons: More manual DOM manipulation required

2. **Dual storage backend**
   - Problem: Flexibility in data persistence options
   - Solution: Support both Google Sheets and PostgreSQL through abstracted database module
   - Pros: Allows for easy data sharing via Google Sheets or robust database storage
   - Cons: Increased complexity in maintaining two storage systems

3. **Tree structure with sections**
   - Problem: Need to organize tasks hierarchically with clear categorization
   - Solution: Implemented section-based organization (TRIAGE, A, B, C priority levels)
   - Pros: Clear task prioritization and organization
   - Cons: Fixed section structure may not suit all workflows

## Key Components

### Frontend Components

1. **Task Tree Interface (`index.html`, `styles.css`)**
   - Responsive design with fixed top banner
   - Dark theme with Inter font family
   - Mobile-optimized with touch-friendly controls
   - Collapsible task hierarchy with visual indentation

2. **Task Management Logic (`script.js`)**
   - Hierarchical task creation and editing
   - Drag-and-drop reordering with SortableJS
   - Priority flag system (fire, fast, flow, fear, first)
   - Modal-based task detail editing
   - Real-time persistence to backend

3. **Database Abstraction Layer**
   - Unified API for task CRUD operations
   - Automatic data synchronization
   - Error handling and recovery

### Backend Components

1. **Express.js Server (`server.js`)**
   - RESTful API endpoints for task management
   - Static file serving
   - CORS support for cross-origin requests

2. **Google Sheets Integration**
   - Service account authentication
   - Real-time read/write operations
   - Structured data mapping for task properties

3. **PostgreSQL Support (`server replit.js`)**
   - Connection pooling for database efficiency
   - Structured schema for task relationships
   - Nested tree structure conversion

## Data Flow

1. **Task Creation**
   - User inputs task via top banner input field
   - New task created under TRIAGE section by default
   - Immediate persistence to selected backend storage
   - Real-time UI update with new task element

2. **Task Manipulation**
   - Drag-and-drop operations trigger position updates
   - Priority flag toggles persist immediately
   - Modal edits save automatically on close
   - All changes synchronized with backend storage

3. **Data Loading**
   - Application loads tasks from backend on initialization
   - Flat database structure converted to nested tree
   - Task hierarchy rebuilt in DOM with proper nesting
   - Sortable instances initialized for all task containers

## External Dependencies

### Required Services

1. **Google Sheets API** (if using Sheets backend)
   - Service account with Editor permissions
   - Spreadsheet shared with service account email
   - Private key and client credentials configured

2. **PostgreSQL Database** (if using database backend)
   - Connection string configured in environment
   - Task table schema with hierarchical relationships

### JavaScript Libraries

1. **SortableJS** - Drag-and-drop functionality
2. **Font Awesome** - UI icons
3. **Google Fonts** - Inter font family

### Environment Variables

- `GOOGLE_PRIVATE_KEY` - Service account private key
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email
- `GOOGLE_SHEETS_SPREADSHEET_ID` - Target spreadsheet ID
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (defaults to 5000)

## Deployment Strategy

### Development Environment
- Replit platform with Node.js 20, Python 3.11, and PostgreSQL 16 modules
- Local development server on port 5000
- Hot reloading for static file changes

### Production Deployment
- Static file serving via Python HTTP server
- Environment variables for service configuration
- CORS enabled for API access
- Error handling and logging for production stability

### Database Schema (PostgreSQL)
```sql
CREATE TABLE tasks (
  id VARCHAR PRIMARY KEY,
  content TEXT NOT NULL,
  is_section BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  parent_id VARCHAR,
  position_order INTEGER,
  revisit_date TIMESTAMP,
  fire BOOLEAN DEFAULT FALSE,
  fast BOOLEAN DEFAULT FALSE,
  flow BOOLEAN DEFAULT FALSE,
  fear BOOLEAN DEFAULT FALSE,
  first BOOLEAN DEFAULT FALSE,
  time_estimate DECIMAL,
  overview TEXT,
  details TEXT,
  scheduled_time TIME
);
```

## Changelog

```
Changelog:
- June 26, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```