# Bus No 4 Tracker

## Overview

This is a comprehensive real-time bus tracking application that displays the live location, historical route, and bus stops for Bus No 4 on an interactive map. The application features smooth animations, ETA calculations, route direction arrows, and automated alerts. Built with a client-side architecture using Leaflet.js for mapping and OpenRouteService for route snapping.

## System Architecture

The application follows an enhanced client-side architecture:

- **Frontend**: Single-page HTML application with embedded CSS and JavaScript
- **Mapping**: Leaflet.js library for interactive map rendering with custom icons and animations
- **Route Processing**: OpenRouteService API integration for road-snapped route visualization
- **Data Sources**: Google Sheets integration via OpenSheet API for real-time bus data
- **Server**: Python's built-in HTTP server for local development
- **Real-time Updates**: 60-second refresh cycle for live bus location with continuous movement simulation

## Key Features

### Real-time Bus Tracking
- **Live Location Updates**: 60-second automatic refresh of bus position
- **Smooth Animation**: Animated bus movement between GPS coordinates
- **Speed-based Animation**: Movement speed adjusts based on actual bus velocity
- **Preserve User Zoom**: Map maintains user's preferred zoom level during updates

### Route Visualization
- **Complete Historical Route**: Displays full Bus No 4 journey from June 25, 3:30-5:30 PM
- **Road Snapping**: Routes snap to actual roads using OpenRouteService API
- **Segmented Processing**: Handles long routes by processing in segments to avoid API limits
- **Clean Route Display**: Professional road-snapped routes without confusing directional arrows
- **Fallback Display**: GPS trail with dashed lines when road snapping unavailable

### Bus Stop Management
- **Ordered Stops**: All 39 bus stops displayed in correct sequence (1-39)
- **Coordinate Conversion**: Automatic conversion from DMS to decimal degrees
- **Interactive Popups**: Detailed information for each stop including order and coordinates
- **Visual Hierarchy**: Numbered blue markers for easy identification

### ETA System
- **Next Stop Calculations**: Real-time ETA to next 5 bus stops
- **Distance-based Logic**: Calculates arrival times using current speed and GPS distance
- **5-Minute Alerts**: Automatic notifications when bus is 5 minutes from any stop
- **Visual Alerts**: Slide-in notifications with auto-dismiss functionality

### GPS-like Experience
- **Initial Zoom**: Opens zoomed to current bus location for GPS-like navigation
- **Moving Bus Icon**: Animated yellow bus icon with pulsing effect
- **Current Location Focus**: Bus-centric view similar to mobile GPS apps

## Data Integration

### Google Sheets Data Sources
- **BusLocations**: Real-time GPS coordinates, speed, ignition status
- **BusHistory**: Historical route data for route visualization  
- **BusStops**: Complete stop information with coordinates and ordering

### OpenRouteService Integration
- **API Key**: 5b3ce3597851110001cf62486ef5d938c6804787a401d0a56b3236ae
- **Route Snapping**: Converts GPS coordinates to road-following routes
- **Driving Profile**: Uses car routing for realistic bus paths
- **Segment Processing**: Handles long routes in 10-point segments

## Technical Implementation

### Performance Optimizations
- **One-time Route Loading**: Historical route and stops load once on initialization
- **Location-only Updates**: Only current bus position refreshes every 15 seconds
- **Segmented API Calls**: Prevents timeout on long route processing
- **Efficient Animations**: Smooth 30-step transitions for bus movement

### User Experience
- **Loading States**: Clear feedback during data fetching and route processing
- **Error Handling**: Graceful fallbacks when APIs unavailable
- **Mobile Responsive**: Works seamlessly on mobile devices
- **Telegram Mini App Ready**: Single HTML file suitable for embedding

## External Dependencies

- **Leaflet.js**: Core mapping functionality (v1.9.4) via unpkg.com CDN
- **OpenRouteService API**: Route snapping and direction services
- **OpenSheet API**: Google Sheets data access without authentication
- **Python**: Runtime environment for development server

## Deployment Strategy

### Current Setup
- **Development Server**: Python HTTP server on port 5000
- **Static Files**: Single HTML file with all assets inline
- **Local Access**: Accessible via localhost during development

### Production Considerations
- **Telegram Mini App**: Ready for deployment as Telegram bot interface
- **Static Hosting**: Can be deployed to any CDN or static hosting service
- **No Backend Required**: Fully client-side with external API integration
- **Mobile Optimized**: Responsive design for all device sizes

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

June 26, 2025:
- ✓ Complete Bus No 4 route visualization with 90 GPS coordinates
- ✓ Road-snapped routes using OpenRouteService API with 5-segment processing
- ✓ All 39 bus stops properly ordered and displayed with converted coordinates
- ✓ 60-second auto-refresh cycle with continuous movement simulation between updates
- ✓ Smooth bus movement animations based on actual speed
- ✓ Clean route visualization without confusing directional arrows
- ✓ ETA calculations for next 5 stops with 5-minute alerts
- ✓ GPS-like initial zoom to current bus location
- ✓ Enhanced bus icon with pulsing animation
- ✓ Fixed unhandled promise rejections causing infinite loading on GitHub Pages
- ✓ Added global error handling for network failures and API timeouts
- ✓ App successfully loads from GitHub Pages deployment
- ✓ Enhanced to 60-second auto-refresh with continuous movement simulation
- ✓ Confirmed automatic data fetching from BusLocations sheet working
- ✓ Fixed loading overlay issues by disabling problematic route snapping
- ✓ App loads reliably with GPS trail route visualization
- ✓ Bus location moves automatically every 15 seconds with live coordinates
- ✓ Implemented continuous movement based on actual speed from BusLocations
- ✓ Bus pauses for 10 seconds when speed = 0, moves at recorded speed otherwise
- ✓ Created Google Apps Script for server-side route snapping optimization
- ✓ Client now fetches pre-computed snapped routes from SnappedRoutes sheet
- ✓ App successfully loads with 764 pre-computed snapped route points
- ✓ Enhanced smooth bus movement system with accurate speed calculations
- ✓ Improved animation detection for GPS coordinate changes
- ✓ Added continuous movement simulation between GPS updates
- ✓ Updated to 60-second refresh intervals with continuous movement during intervals
- ✓ ETA calculations now only occur during GPS refresh (not during movement simulation)
- ✓ Enhanced ETA calculation for U-turn routes - excludes passed stops within 1.2km radius
- ✓ Added automatic 10-second stops when bus reaches any bus stop during simulation
- ✓ Bus stop detection within 50-meter radius during continuous movement
- ✓ Removed confusing directional arrows from route display
- ✓ Implemented route-following animation system using snapped route points
- ✓ Enhanced movement to follow actual roads at recorded speeds with GPS adjustments
- ✓ Fixed ETA calculations using realistic 25 km/h speed instead of 5 km/h minimum
- ✓ Complete working bus tracker with realistic movement and accurate ETAs ready for deployment