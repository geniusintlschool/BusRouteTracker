# Bus No 4 Tracker

## Overview

This is a real-time bus tracking application that displays the location and movement of Bus No 4 on an interactive map. The application uses a simple client-side architecture with Leaflet.js for mapping functionality and Python's built-in HTTP server for local development.

## System Architecture

The application follows a simple client-side architecture:

- **Frontend**: Single-page HTML application with embedded CSS and JavaScript
- **Mapping**: Leaflet.js library for interactive map rendering
- **Server**: Python's built-in HTTP server for local development
- **Data Flow**: Client-side JavaScript handles all bus tracking logic

## Key Components

### Frontend Components
- **HTML Structure**: Single `index.html` file containing the entire application
- **Map Container**: Full-viewport map using Leaflet.js
- **Loading Overlay**: User feedback during map initialization
- **Responsive Design**: Mobile-first approach with viewport meta tag

### Mapping Solution
- **Leaflet.js**: Open-source mapping library (v1.9.4)
- **CDN Delivery**: External stylesheet and script loading
- **Interactive Features**: Pan, zoom, and marker functionality

### Development Server
- **Python HTTP Server**: Simple static file serving on port 5000
- **Local Development**: Suitable for development and testing

## Data Flow

1. **Application Load**: HTML loads with Leaflet CSS dependencies
2. **Map Initialization**: JavaScript initializes the map container
3. **Loading State**: Loading overlay provides user feedback
4. **Bus Data**: Client-side logic handles bus location updates
5. **Map Updates**: Real-time position updates rendered on map

## External Dependencies

- **Leaflet.js**: Core mapping functionality via unpkg.com CDN
- **Python**: Runtime environment for development server
- **Node.js**: Available in environment but not currently utilized

## Deployment Strategy

### Current Setup
- **Development Server**: Python HTTP server on port 5000
- **Static Files**: All assets served from root directory
- **Local Access**: Accessible via localhost during development

### Production Considerations
- Can be deployed to any static hosting service
- No backend dependencies for core functionality
- CDN-based mapping reduces server load

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 26, 2025. Initial setup