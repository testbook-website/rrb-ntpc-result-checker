/**
 * Google Apps Script Web App Integration
 * Place this code inside the Google Apps Script editor associated with your spreadsheet.
 * 
 * Deployment Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any code in Code.gs and paste this script.
 * 4. Click Deploy > New deployment.
 * 5. Select type: "Web app".
 * 6. Set Description: "RRB NTPC Result Checker Logging".
 * 7. Set Execute as: "Me".
 * 8. Set Who has access: "Anyone".
 * 9. Click Deploy, authorize permissions, and copy the Web App URL.
 * 10. Update the APPS_SCRIPT_URL variable in your app.js with the copied URL.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait for up to 30 seconds for lock to avoid overlapping writes
  lock.tryLock(30000);
  
  try {
    // Parse the incoming JSON content
    var data = JSON.parse(e.postData.contents);
    
    // Open the active spreadsheet and the active sheet
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();
    
    // Initialize headers if sheet is empty
    initializeHeadersIfNeeded(sheet);
    
    // Append the candidate row
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.name,
      data.mobile,
      data.zone,
      "'" + data.roll, // Prefix with ' to force Excel/Sheets to treat 16-digit number as text
      data.status
    ]);
    
    // Return standard success response
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "success", 
      "message": "Data logged successfully" 
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log error inside script console and return failure message
    console.error("Error logging data: " + error.toString());
    
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "error", 
      "message": error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } finally {
    // Release lock
    lock.releaseLock();
  }
}

/**
 * Creates professional header row if sheet is completely blank
 */
function initializeHeadersIfNeeded(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = ["Timestamp", "Candidate Name", "Mobile Number", "RRB Zone", "Roll Number", "Status"];
    sheet.appendRow(headers);
    
    // Style headers (Indigo theme matching the widget)
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4f46e5");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    
    // Auto-fit column widths
    for (var col = 1; col <= headers.length; col++) {
      sheet.autoResizeColumn(col);
    }
    
    // Freeze the first header row
    sheet.setFrozenRows(1);
  }
}
