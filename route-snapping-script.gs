/**
 * Complete Google Apps Script for Route Snapping Optimization
 * Processes historical bus routes and stores road-snapped coordinates
 * Handles various data formats and provides comprehensive error handling
 */

// OpenRouteService API Configuration
const ORS_API_KEY = '5b3ce3597851110001cf62486ef5d938c6804787a401d0a56b3236ae';
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const ORS_GEOJSON_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

// Main execution function
function processAllBusRoutes() {
  console.log('=== Starting Route Snapping Process ===');
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const historySheet = spreadsheet.getSheetByName('BusHistory');
    
    if (!historySheet) {
      console.error('BusHistory sheet not found');
      return;
    }
    
    // Get all data
    const historyData = historySheet.getDataRange().getValues();
    
    if (historyData.length < 2) {
      console.error('No data found in BusHistory sheet');
      return;
    }
    
    const headers = historyData[0];
    console.log('Headers found:', headers);
    
    // Process Bus No 4 route
    const bus4Route = filterBus4Route(historyData, headers);
    
    if (bus4Route.length > 0) {
      console.log(`Processing ${bus4Route.length} GPS points for Bus No 4`);
      
      // Snap the route to roads
      const snappedRoute = snapRouteToRoads(bus4Route);
      
      if (snappedRoute.length > 0) {
        storeSnappedRoute('Bus4_June25_1530_1730', snappedRoute);
        console.log(`✓ Successfully stored ${snappedRoute.length} snapped points`);
        console.log('=== Route Snapping Complete ===');
      } else {
        console.warn('No snapped route generated - storing original GPS points');
        storeOriginalRoute('Bus4_June25_1530_1730', bus4Route);
      }
    } else {
      console.warn('No Bus No 4 data found for the specified date/time range');
    }
    
  } catch (error) {
    console.error('Fatal error in processAllBusRoutes:', error);
  }
}

// Filter Bus No 4 route data with robust time handling
function filterBus4Route(historyData, headers) {
  console.log('Filtering Bus No 4 route data...');
  
  // Find column indices with flexible header matching
  const busNumberCol = findColumnIndex(headers, ['bus number', 'bus', 'vehicle']);
  const timeCol = findColumnIndex(headers, ['time', 'timestamp', 'datetime']);
  const latCol = findColumnIndex(headers, ['latitude', 'lat']);
  const lngCol = findColumnIndex(headers, ['longitude', 'lng', 'lon', 'long']);
  
  console.log(`Column indices - Bus: ${busNumberCol}, Time: ${timeCol}, Lat: ${latCol}, Lng: ${lngCol}`);
  
  if (busNumberCol === -1 || timeCol === -1 || latCol === -1 || lngCol === -1) {
    console.error('Required columns not found in headers');
    return [];
  }
  
  const route = [];
  let processedCount = 0;
  let bus4Count = 0;
  
  for (let i = 1; i < historyData.length; i++) {
    const row = historyData[i];
    processedCount++;
    
    // Check if it's Bus No 4
    const busNumber = row[busNumberCol];
    if (busNumber && (busNumber.toString() === '4' || parseInt(busNumber) === 4)) {
      bus4Count++;
      
      const timeValue = row[timeCol];
      const lat = parseFloat(row[latCol]);
      const lng = parseFloat(row[lngCol]);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        continue;
      }
      
      // Handle time format conversion
      let timeString = '';
      if (timeValue instanceof Date) {
        timeString = Utilities.formatDate(timeValue, Session.getScriptTimeZone(), 'M/d/yyyy HH:mm:ss');
      } else if (timeValue) {
        timeString = timeValue.toString();
      }
      
      // Filter for June 25, 2025 between 3:30-5:30 PM
      if (timeString && isWithinTimeRange(timeString)) {
        route.push({
          lat: lat,
          lng: lng,
          time: timeString,
          originalTime: timeValue
        });
      }
    }
  }
  
  console.log(`Processed ${processedCount} total rows, found ${bus4Count} Bus No 4 records`);
  console.log(`Filtered to ${route.length} points within time range`);
  
  // Sort by time
  route.sort((a, b) => {
    try {
      return new Date(a.time) - new Date(b.time);
    } catch (error) {
      return 0;
    }
  });
  
  // Remove duplicate consecutive points
  const cleanedRoute = removeDuplicatePoints(route);
  console.log(`Cleaned route: ${cleanedRoute.length} unique points`);
  
  return cleanedRoute;
}

// Helper function to find column index by multiple possible names
function findColumnIndex(headers, possibleNames) {
  for (let name of possibleNames) {
    const index = headers.findIndex(header => 
      header.toString().toLowerCase().includes(name.toLowerCase())
    );
    if (index !== -1) return index;
  }
  return -1;
}

// Check if time is within June 25, 2025, 3:30-5:30 PM range
function isWithinTimeRange(timeString) {
  try {
    // Check for June 25, 2025
    if (!timeString.includes('6/25/2025')) {
      return false;
    }
    
    // Extract time part
    const parts = timeString.split(' ');
    if (parts.length < 2) return false;
    
    const timePart = parts[1];
    const timeComponents = timePart.split(':');
    if (timeComponents.length < 2) return false;
    
    const hour = parseInt(timeComponents[0]);
    
    // 3:30 PM to 5:30 PM (15:30 to 17:30 in 24-hour format)
    return hour >= 15 && hour <= 17;
  } catch (error) {
    console.warn('Error parsing time string:', timeString, error);
    return false;
  }
}

// Remove consecutive duplicate GPS points
function removeDuplicatePoints(route) {
  if (route.length <= 1) return route;
  
  const cleaned = [route[0]];
  const threshold = 0.0001; // ~10 meters
  
  for (let i = 1; i < route.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = route[i];
    
    const latDiff = Math.abs(curr.lat - prev.lat);
    const lngDiff = Math.abs(curr.lng - prev.lng);
    
    // Keep point if it's significantly different
    if (latDiff > threshold || lngDiff > threshold) {
      cleaned.push(curr);
    }
  }
  
  return cleaned;
}

// Main route snapping function with robust error handling
function snapRouteToRoads(routePoints) {
  console.log('Starting route snapping to roads...');
  
  const snappedCoords = [];
  const segmentSize = 8; // Smaller segments for better reliability
  const maxRetries = 3;
  
  // Further filter to key points to reduce API calls
  const keyPoints = selectKeyPoints(routePoints);
  console.log(`Selected ${keyPoints.length} key points from ${routePoints.length} total points`);
  
  const totalSegments = Math.ceil(keyPoints.length / (segmentSize - 1));
  console.log(`Processing ${totalSegments} segments...`);
  
  for (let i = 0; i < keyPoints.length; i += segmentSize - 1) {
    const segment = keyPoints.slice(i, i + segmentSize);
    
    if (segment.length < 2) break;
    
    const segmentNum = Math.floor(i / (segmentSize - 1)) + 1;
    console.log(`Processing segment ${segmentNum}/${totalSegments} (${segment.length} points)`);
    
    let success = false;
    
    for (let retry = 0; retry < maxRetries && !success; retry++) {
      try {
        const segmentResult = snapSegmentToRoad(segment);
        
        if (segmentResult && segmentResult.length > 0) {
          // Avoid duplicate points between segments
          if (snappedCoords.length > 0 && segmentResult.length > 0) {
            segmentResult.shift();
          }
          
          snappedCoords.push(...segmentResult);
          success = true;
          console.log(`✓ Segment ${segmentNum} completed: +${segmentResult.length} points`);
        } else {
          console.warn(`⚠ Segment ${segmentNum} returned no results (attempt ${retry + 1})`);
        }
        
      } catch (error) {
        console.error(`✗ Segment ${segmentNum} failed (attempt ${retry + 1}):`, error);
        
        if (retry < maxRetries - 1) {
          console.log(`Retrying segment ${segmentNum} in 1 second...`);
          Utilities.sleep(1000);
        }
      }
    }
    
    if (!success) {
      console.warn(`Segment ${segmentNum} failed after ${maxRetries} attempts - adding original points`);
      // Add original GPS points as fallback
      segment.forEach(point => {
        snappedCoords.push({ lat: point.lat, lng: point.lng });
      });
    }
    
    // Rate limiting between segments
    Utilities.sleep(300);
  }
  
  console.log(`Route snapping completed: ${snappedCoords.length} total points`);
  return snappedCoords;
}

// Select key points from route to optimize API usage
function selectKeyPoints(routePoints) {
  if (routePoints.length <= 20) return routePoints;
  
  const keyPoints = [routePoints[0]]; // Always include first point
  const step = Math.floor(routePoints.length / 15); // Target ~15 key points
  
  for (let i = step; i < routePoints.length - 1; i += step) {
    keyPoints.push(routePoints[i]);
  }
  
  keyPoints.push(routePoints[routePoints.length - 1]); // Always include last point
  
  return keyPoints;
}

// Snap a single segment to roads
function snapSegmentToRoad(segment) {
  const coordinates = segment.map(point => [point.lng, point.lat]);
  
  // Try GeoJSON endpoint first
  let success = tryGeoJsonEndpoint(coordinates);
  if (success) return success;
  
  // Fallback to regular endpoint
  return tryRegularEndpoint(coordinates);
}

function tryGeoJsonEndpoint(coordinates) {
  const payload = {
    coordinates: coordinates,
    radiuses: coordinates.map(() => 2000),
    continue_straight: false
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': ORS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/geo+json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(ORS_GEOJSON_URL, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      const data = JSON.parse(response.getContentText());
      const routeGeometry = data.features?.[0]?.geometry?.coordinates;
      
      if (routeGeometry && routeGeometry.length > 0) {
        return routeGeometry.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));
      }
    } else {
      console.warn(`GeoJSON endpoint failed: ${responseCode}`);
    }
  } catch (error) {
    console.warn('GeoJSON endpoint error:', error);
  }
  
  return null;
}

function tryRegularEndpoint(coordinates) {
  const payload = {
    coordinates: coordinates,
    radiuses: coordinates.map(() => 2000),
    continue_straight: false
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': ORS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(ORS_BASE_URL, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      const data = JSON.parse(response.getContentText());
      const routeGeometry = data.routes?.[0]?.geometry;
      
      if (routeGeometry) {
        // Decode polyline if needed
        const coordinates = decodePolyline(routeGeometry);
        return coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));
      }
    } else {
      const errorText = response.getContentText();
      console.error(`Regular API Error ${responseCode}:`, errorText);
      
      if (responseCode === 429) {
        console.log('Rate limit hit, waiting 5 seconds...');
        Utilities.sleep(5000);
      }
    }
  } catch (error) {
    console.error('Regular endpoint error:', error);
  }
  
  return null;
}

// Simple polyline decoder for OpenRouteService
function decodePolyline(encoded) {
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;
    
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;
    
    coordinates.push([lng / 1e5, lat / 1e5]);
  }
  
  return coordinates;
}

// Store snapped route in SnappedRoutes sheet
function storeSnappedRoute(routeName, snappedCoords) {
  console.log(`Storing snapped route: ${routeName}`);
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or get SnappedRoutes sheet
  let snappedSheet = getOrCreateSheet(spreadsheet, 'SnappedRoutes');
  
  // Clear existing data for this route
  clearRouteData(snappedSheet, routeName);
  
  // Add header if sheet is empty
  if (snappedSheet.getLastRow() === 0) {
    snappedSheet.appendRow(['Route Name', 'Latitude', 'Longitude', 'Point Order', 'Created']);
  }
  
  // Add snapped coordinates in batches for better performance
  const batchSize = 100;
  const timestamp = new Date().toISOString();
  
  for (let i = 0; i < snappedCoords.length; i += batchSize) {
    const batch = snappedCoords.slice(i, i + batchSize);
    const rows = batch.map((coord, index) => [
      routeName,
      coord.lat,
      coord.lng,
      i + index + 1,
      timestamp
    ]);
    
    if (rows.length > 0) {
      const range = snappedSheet.getRange(snappedSheet.getLastRow() + 1, 1, rows.length, 5);
      range.setValues(rows);
    }
  }
  
  console.log(`✓ Stored ${snappedCoords.length} snapped coordinates for ${routeName}`);
}

// Store original GPS route as fallback
function storeOriginalRoute(routeName, routePoints) {
  console.log(`Storing original GPS route: ${routeName}`);
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let snappedSheet = getOrCreateSheet(spreadsheet, 'SnappedRoutes');
  
  clearRouteData(snappedSheet, routeName);
  
  if (snappedSheet.getLastRow() === 0) {
    snappedSheet.appendRow(['Route Name', 'Latitude', 'Longitude', 'Point Order', 'Created']);
  }
  
  const timestamp = new Date().toISOString();
  const rows = routePoints.map((point, index) => [
    routeName,
    point.lat,
    point.lng,
    index + 1,
    timestamp
  ]);
  
  if (rows.length > 0) {
    const range = snappedSheet.getRange(snappedSheet.getLastRow() + 1, 1, rows.length, 5);
    range.setValues(rows);
  }
  
  console.log(`✓ Stored ${routePoints.length} original GPS points for ${routeName}`);
}

// Utility functions
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    console.log(`Created new sheet: ${sheetName}`);
  }
  return sheet;
}

function clearRouteData(sheet, routeName) {
  const data = sheet.getDataRange().getValues();
  const rowsToDelete = [];
  
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === routeName) {
      rowsToDelete.push(i + 1);
    }
  }
  
  // Delete rows in reverse order to maintain indices
  rowsToDelete.forEach(rowIndex => {
    sheet.deleteRow(rowIndex);
  });
  
  if (rowsToDelete.length > 0) {
    console.log(`Cleared ${rowsToDelete.length} existing rows for ${routeName}`);
  }
}

// Debug and testing functions
function debugDataStructure() {
  console.log('=== Debugging Data Structure ===');
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = spreadsheet.getSheetByName('BusHistory');
  
  if (!historySheet) {
    console.error('BusHistory sheet not found');
    return;
  }
  
  const data = historySheet.getDataRange().getValues();
  
  console.log('Sheet info:');
  console.log(`- Rows: ${data.length}`);
  console.log(`- Columns: ${data[0].length}`);
  console.log('- Headers:', data[0]);
  
  if (data.length > 1) {
    console.log('- Sample row 1:', data[1]);
    console.log('- Sample row 2:', data.length > 2 ? data[2] : 'N/A');
    
    // Check time formats in first few rows
    const timeCol = findColumnIndex(data[0], ['time', 'timestamp', 'datetime']);
    if (timeCol !== -1) {
      console.log('Time format analysis:');
      for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
        const timeValue = data[i][timeCol];
        console.log(`Row ${i}: Type=${typeof timeValue}, Value=${timeValue}`);
      }
    }
  }
}

function testSingleSegment() {
  console.log('=== Testing Single Segment ===');
  
  const testCoords = [
    {lat: 11.707203, lng: 76.178753},
    {lat: 11.707043, lng: 76.178674},
    {lat: 11.703089, lng: 76.176372}
  ];
  
  console.log(`Testing with ${testCoords.length} coordinates`);
  
  try {
    const snapped = snapSegmentToRoad(testCoords);
    if (snapped && snapped.length > 0) {
      console.log(`✓ Test successful: ${snapped.length} snapped points`);
      console.log('First point:', snapped[0]);
      console.log('Last point:', snapped[snapped.length - 1]);
    } else {
      console.warn('Test returned no results');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Quick setup function to run everything
function quickSetup() {
  console.log('=== Quick Setup & Process ===');
  debugDataStructure();
  processAllBusRoutes();
}