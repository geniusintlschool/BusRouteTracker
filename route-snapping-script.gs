/**
 * Google Apps Script for Pre-Computing Route Snapping
 * This script processes historical bus routes and stores snapped coordinates
 * Run this once per route to optimize client-side performance
 */

// OpenRouteService API Configuration
const ORS_API_KEY = '5b3ce3597851110001cf62486ef5d938c6804787a401d0a56b3236ae';
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

function processAllBusRoutes() {
  console.log('Starting route snapping process...');
  
  // Get the spreadsheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Read historical data
  const historySheet = spreadsheet.getSheetByName('BusHistory');
  const historyData = historySheet.getDataRange().getValues();
  const headers = historyData[0];
  
  // Process Bus No 4 route for June 25, 2025 (3:30-5:30 PM)
  const bus4Route = filterBus4Route(historyData, headers);
  
  if (bus4Route.length > 0) {
    console.log(`Processing ${bus4Route.length} GPS points for Bus No 4`);
    
    // Snap the route
    const snappedRoute = snapRouteToRoads(bus4Route);
    
    if (snappedRoute.length > 0) {
      // Store in SnappedRoutes sheet
      storeSnappedRoute('Bus4_June25_1530_1730', snappedRoute);
      console.log(`Stored ${snappedRoute.length} snapped points`);
    }
  }
}

function filterBus4Route(historyData, headers) {
  const busNumberCol = headers.indexOf('Bus Number');
  const timeCol = headers.indexOf('Time');
  const latCol = headers.indexOf('Latitude');
  const lngCol = headers.indexOf('Longitude');
  
  const route = [];
  
  for (let i = 1; i < historyData.length; i++) {
    const row = historyData[i];
    
    // Filter Bus No 4
    if (parseInt(row[busNumberCol]) === 4) {
      const timeStr = row[timeCol];
      
      // Filter date and time range (June 25, 2025, 3:30-5:30 PM)
      if (timeStr && timeStr.includes('6/25/2025')) {
        const timePart = timeStr.split(' ')[1];
        if (timePart) {
          const hour = parseInt(timePart.split(':')[0]);
          if (hour >= 15 && hour <= 17) {
            route.push({
              lat: parseFloat(row[latCol]),
              lng: parseFloat(row[lngCol]),
              time: timeStr
            });
          }
        }
      }
    }
  }
  
  // Sort by time
  route.sort((a, b) => new Date(a.time) - new Date(b.time));
  
  return route;
}

function snapRouteToRoads(routePoints) {
  const snappedCoords = [];
  const segmentSize = 10; // Points per API call
  
  // Filter to key points to reduce API calls
  const keyPoints = routePoints.filter((point, index) => 
    index % 2 === 0 || index === routePoints.length - 1
  );
  
  console.log(`Snapping ${keyPoints.length} key points in segments of ${segmentSize}`);
  
  for (let i = 0; i < keyPoints.length; i += segmentSize - 1) {
    const segment = keyPoints.slice(i, i + segmentSize);
    
    if (segment.length < 2) break;
    
    try {
      // Convert to OpenRouteService format [lng, lat]
      const coordinates = segment.map(point => [point.lng, point.lat]);
      
      const payload = {
        coordinates: coordinates,
        radiuses: coordinates.map(() => 1000),
        continue_straight: false
      };
      
      const options = {
        method: 'POST',
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload)
      };
      
      console.log(`Processing segment ${Math.floor(i/(segmentSize-1)) + 1}...`);
      
      const response = UrlFetchApp.fetch(ORS_BASE_URL, options);
      
      if (response.getResponseCode() === 200) {
        const data = JSON.parse(response.getContentText());
        const routeGeometry = data.features[0]?.geometry?.coordinates;
        
        if (routeGeometry && routeGeometry.length > 0) {
          // Convert back to [lat, lng] format
          const segmentCoords = routeGeometry.map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));
          
          // Avoid duplicate points between segments
          if (snappedCoords.length > 0) {
            segmentCoords.shift();
          }
          
          snappedCoords.push(...segmentCoords);
        }
      } else {
        console.error(`Segment failed: ${response.getResponseCode()}`);
      }
      
      // Rate limiting delay
      Utilities.sleep(200);
      
    } catch (error) {
      console.error(`Error processing segment: ${error}`);
    }
  }
  
  return snappedCoords;
}

function storeSnappedRoute(routeName, snappedCoords) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or get SnappedRoutes sheet
  let snappedSheet = spreadsheet.getSheetByName('SnappedRoutes');
  if (!snappedSheet) {
    snappedSheet = spreadsheet.insertSheet('SnappedRoutes');
    // Add headers
    snappedSheet.appendRow(['Route Name', 'Latitude', 'Longitude', 'Point Order']);
  }
  
  // Clear existing data for this route
  const data = snappedSheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === routeName) {
      snappedSheet.deleteRow(i + 1);
    }
  }
  
  // Add new snapped coordinates
  snappedCoords.forEach((coord, index) => {
    snappedSheet.appendRow([routeName, coord.lat, coord.lng, index + 1]);
  });
  
  console.log(`Stored ${snappedCoords.length} snapped coordinates for ${routeName}`);
}

function testSingleSegment() {
  // Test function for debugging
  const testCoords = [
    {lat: 11.707203, lng: 76.178753},
    {lat: 11.707043, lng: 76.178674},
    {lat: 11.703089, lng: 76.176372}
  ];
  
  const snapped = snapRouteToRoads(testCoords);
  console.log(`Test result: ${snapped.length} points`);
}