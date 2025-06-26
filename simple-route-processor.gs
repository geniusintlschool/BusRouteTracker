/**
 * Simplified Google Apps Script for Route Processing
 * Handles Date objects and various time formats more robustly
 */

function processSimpleBusRoute() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = spreadsheet.getSheetByName('BusHistory');
  
  if (!historySheet) {
    console.log('BusHistory sheet not found');
    return;
  }
  
  const data = historySheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find column indices
  const busNumIndex = headers.findIndex(h => h.toString().toLowerCase().includes('bus'));
  const timeIndex = headers.findIndex(h => h.toString().toLowerCase().includes('time'));
  const latIndex = headers.findIndex(h => h.toString().toLowerCase().includes('lat'));
  const lngIndex = headers.findIndex(h => h.toString().toLowerCase().includes('lng') || h.toString().toLowerCase().includes('lon'));
  
  console.log(`Found columns - Bus: ${busNumIndex}, Time: ${timeIndex}, Lat: ${latIndex}, Lng: ${lngIndex}`);
  
  const bus4Routes = [];
  
  // Process each row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Check if it's Bus No 4
    const busNum = row[busNumIndex];
    if (busNum && busNum.toString() === '4') {
      
      const timeValue = row[timeIndex];
      let timeString = '';
      
      // Handle different time formats
      if (timeValue instanceof Date) {
        timeString = Utilities.formatDate(timeValue, Session.getScriptTimeZone(), 'M/d/yyyy HH:mm:ss');
      } else if (timeValue) {
        timeString = timeValue.toString();
      }
      
      // Check if it's from June 25, 2025
      if (timeString && timeString.includes('6/25/2025')) {
        const lat = parseFloat(row[latIndex]);
        const lng = parseFloat(row[lngIndex]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          bus4Routes.push({
            time: timeString,
            lat: lat,
            lng: lng
          });
        }
      }
    }
  }
  
  console.log(`Found ${bus4Routes.length} Bus No 4 GPS points for June 25, 2025`);
  
  if (bus4Routes.length > 0) {
    // Sort by time
    bus4Routes.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    // Store processed route (without external API calls for now)
    storeProcessedRoute(bus4Routes);
  }
}

function storeProcessedRoute(routePoints) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create ProcessedRoutes sheet
  let processedSheet = spreadsheet.getSheetByName('ProcessedRoutes');
  if (!processedSheet) {
    processedSheet = spreadsheet.insertSheet('ProcessedRoutes');
    processedSheet.appendRow(['Route Name', 'Latitude', 'Longitude', 'Time', 'Point Order']);
  }
  
  // Clear existing Bus 4 data
  const existingData = processedSheet.getDataRange().getValues();
  for (let i = existingData.length - 1; i >= 1; i--) {
    if (existingData[i][0] === 'Bus4_June25') {
      processedSheet.deleteRow(i + 1);
    }
  }
  
  // Add filtered and sorted route points
  routePoints.forEach((point, index) => {
    processedSheet.appendRow([
      'Bus4_June25',
      point.lat,
      point.lng,
      point.time,
      index + 1
    ]);
  });
  
  console.log(`Stored ${routePoints.length} processed route points`);
}

// Test function to debug data format
function debugDataFormat() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = spreadsheet.getSheetByName('BusHistory');
  const data = historySheet.getDataRange().getValues();
  
  console.log('Headers:', data[0]);
  console.log('Sample row 1:', data[1]);
  console.log('Sample row 2:', data[2]);
  
  // Check time format in first few rows
  for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
    const timeValue = data[i][1]; // Assuming time is in column B
    console.log(`Row ${i} time type:`, typeof timeValue, 'Value:', timeValue);
  }
}