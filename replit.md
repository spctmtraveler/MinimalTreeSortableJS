# DUN Task Management System

## Overview

DUN is a hierarchical task management application built with a client-server architecture. The frontend provides an intuitive drag-and-drop interface for organizing tasks in a tree structure, while the backend handles data persistence using PostgreSQL. The application focuses on task organization with priority flags, scheduling, and filtering capabilities.

## System Architecture

### Frontend Architecture
- **Technology**: Pure HTML, CSS, and vanilla JavaScript (no frameworks)
- **UI Pattern**: Single-page application with modal-based task editing
- **Drag-and-Drop**: SortableJS library for intuitive task reordering
- **Styling**: Dark theme with Inter font, responsive design optimized for mobile
- **State Management**: Client-side task tree with immediate persistence to backend

### Backend Architecture
- **Framework**: Express.js (Node.js)
- **Database**: PostgreSQL with connection pooling
- **API Design**: RESTful endpoints for task CRUD operations
- **Data Flow**: Immediate persistence - every user action triggers a database save

### Architectural Decisions

1. **Vanilla JavaScript Frontend**
   - Problem: Need lightweight, fast-loading task management interface
   - Solution: Pure JavaScript without framework overhead
   - Pros: Fast load times, no build process, simple debugging
   - Cons: More manual DOM manipulation, less structured than framework approach

2. **Immediate Persistence Strategy**
   - Problem: Prevent data loss during task manipulation
   - Solution: Every action (create, edit, reorder, toggle) immediately saves to database
   - Pros: No data loss, always synchronized
   - Cons: Higher database load, potential performance impact with many rapid changes

3. **Hierarchical Task Structure**
   - Problem: Complex task organization needs
   - Solution: Parent-child relationships with sections and nested tasks
   - Pros: Flexible organization, supports project breakdown
   - Cons: Complex tree management logic

## Key Components

### Task Management
- **Task Creation**: New tasks automatically placed in TRIAGE section
- **Task Editing**: Modal-based editor with rich metadata fields
- **Task Organization**: Drag-and-drop reordering with parent-child relationships
- **Priority System**: Five priority flags (Fire, Fast, Flow, Fear, First)
- **Scheduling**: Date-based scheduling with time estimates

### Data Structure
- **Tasks Table**: Core task storage with hierarchical relationships
- **Fields**: Content, completion status, parent relationships, priority flags, scheduling data
- **Tree Building**: Server-side conversion from flat database structure to nested tree

### User Interface
- **Top Banner**: Fixed header with task input, filtering, and view controls
- **Task Tree**: Collapsible hierarchical display with drag-and-drop
- **Modal Editor**: Detailed task editing interface
- **Filtering**: Multiple filter options (Today, Tomorrow, This Week, etc.)

## Data Flow

1. **Application Load**: Frontend requests all tasks from `/api/tasks`
2. **Server Processing**: Database query returns flat task list, converted to nested tree
3. **Client Rendering**: JavaScript builds DOM tree with drag-and-drop capabilities
4. **User Actions**: Every modification triggers immediate API call to persist changes
5. **Real-time Updates**: UI updates immediately while background persistence occurs

## External Dependencies

### Frontend Libraries
- **SortableJS**: Drag-and-drop functionality for task reordering
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Inter font family for typography

### Backend Dependencies
- **Express.js**: Web framework for API endpoints
- **pg (node-postgres)**: PostgreSQL client for database operations
- **CORS**: Cross-origin resource sharing middleware

### Database
- **PostgreSQL**: Relational database for task persistence
- **Connection Pooling**: Efficient database connection management

## Deployment Strategy

### Development Setup
- **Frontend**: Static files served by Express.js
- **Backend**: Node.js server with Express
- **Database**: PostgreSQL instance (local or hosted)
- **Environment**: Environment variables for database connection

### Production Considerations
- **Database URL**: Configured via `DATABASE_URL` environment variable
- **Port Configuration**: Configurable via `PORT` environment variable (default 5000)
- **Static Assets**: Served directly by Express for simplicity

## Recent Implementation Status

### ✅ MAJOR MILESTONE - Phase 1 Complete (June 29, 2025)
- **Core Task Management**: Hierarchical tree, drag-and-drop, CRUD operations
- **Priority System**: Five flags with tooltips, toggle visibility, sorting
- **Modal Data Persistence**: Fixed date/time/estimate storage and retrieval
- **Database Integration**: PostgreSQL with immediate persistence
- **View Toggles**: All top banner icons now functional
- **Delete/Undo System**: 5-second undo with proper database restoration
- **Keyboard Navigation**: Arrow keys, Enter, Escape, Tab navigation
- **Completion Styling**: Accent color checkboxes, strikethrough text
- **Control Panel Timing**: 0.2s fade in, 1s fade out for hover states
- **Task Truncation**: 240px width limit with ellipsis and tooltips
- **Quick Add Logic**: Creates tasks in Triage with all defaults
- **Auto-Dating System**: Tasks dragged from Triage to A/B/C automatically get revisit dates based on current view
- **Smart Filtering**: Tasks with no revisit date appear in all date filters (need attention)
- **Hours Panel**: New toggleable panel for time tracking features (clock icon in header)
- **Perfect Priority Alignment**: Priority header and sort buttons positioned absolutely within task column for perfect vertical alignment
- **Dynamic Layout System**: Hours panel automatically repositions based on priority visibility
- **Streamlined UI**: Removed unused icons (checkmark, lightbulb, hourglass) from header
- **Mobile Optimization**: Responsive design with touch support

### 🚀 PHASE 2 - Standalone Hours View Prototype (June 29, 2025)
**New Requirements**: Building vertical time scheduler with:
- 12AM-12AM timeline with 15-minute increments
- Click-to-create tasks, drag-to-reposition, bottom-handle resize
- Inline rename and full modal edit capabilities
- Current-time line with 5-minute updates
- STOP (6PM) and SLEEP (11PM) draggable limit lines
- No database persistence (runtime-only prototype)

### ✅ MAJOR MILESTONE - Hours Panel Fully Interactive (July 12, 2025)
**CRITICAL BUG RESOLVED**: Fixed duplicate HTML container issue that was blocking all Hours panel interactions
- **Problem**: Two identical `<div id="task-blocks-container">` elements in HTML causing DOM conflicts
- **Solution**: Removed duplicate container, restoring full interactivity
- **Result**: Hours panel tasks now fully interactive - drag, drop, hover, click all working
- **Database Integration**: Task time changes sync between Hours panel and main task list
- **User Confirmation**: "It worked! We're back in business! The daily tasks are drag n drop again!"

### 🐛 Bug Report Generator (July 22, 2025)
**New AI Consultation Tool**: Comprehensive debugging documentation system for complex issues
- **Bug Report Form**: Structured input for title, severity, expected/actual behavior, reproduction steps
- **Automated Report Generation**: Professional format with technical context and investigation details
- **File Analysis Integration**: Pre-populated with affected files and attempted solutions
- **Export Options**: Copy to clipboard, download as TXT, automatic screenshot capture
- **Pre-filled Example**: Current icon positioning issue included as working example
- **Streamlined Workflow**: Designed for efficient AI-to-AI consultation with minimal context switching

### 🔍 Key Business Logic (June 29, 2025)

#### Triage Filtering Rules
The Triage filter shows tasks that need attention regardless of date range:
- **Expired Revisit Dates**: Tasks with revisit dates in the past that aren't completed
- **No Revisit Date**: Tasks with null/undefined revisit dates (need scheduling)
- **Today's Tasks**: Tasks scheduled for today but not yet categorized to A/B/C sections
- **Manually Placed**: Tasks user has dragged directly into the Triage section

**Note**: "Physically assigned to Triage" occurs when users drag tasks directly into the Triage section, overriding automatic categorization. This allows manual intervention for edge cases or tasks requiring special handling.

#### Auto-Dating System
When tasks are dragged from Triage to A/B/C sections, the system automatically assigns revisit dates:
- **Single Day Views** (Today, Tomorrow): Sets revisit date to the viewed day
- **Date Range Views** (This Week, This Month): Sets to first day of range, or today if today falls within the range
- **Non-Date Views** (All, Triage): Defaults to today's date

#### Date Range Definitions
- **This Week**: Last Monday through coming Sunday (Monday-based week)
- **This Month**: 1st calendar day through last calendar day of current month
- **Next Week/Month**: Following the same pattern for future periods

### ❌ Advanced Features Not Yet Implemented
- Task search functionality
- Keyboard navigation shortcuts
- Bulk task operations
- Task archiving system
- Export/import capabilities
- Performance optimizations for large task lists

## Changelog

```
Changelog:
- June 28, 2025: Implemented all view toggles, fixed modal persistence, added priority tooltips
- June 27, 2025: Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```