/**
 * RRB NTPC Result Checker - Client Logic
 */

// REPLACE THIS PLACEHOLDER WITH YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwP2ky3Xt7rgmLbLWj19Wtp8Eq1XvdiUWxnIwsmMEkQw0AQnhB_PYws-CxBZq2RsZll/exec";

// Database of roll numbers loaded from JSON
let rollDatabase = null;
let databaseLoading = false;

// DOM Elements
const formView = document.getElementById("view-form");
const successView = document.getElementById("view-success");
const errorView = document.getElementById("view-error");

const resultForm = document.getElementById("result-checker-form");
const nameInput = document.getElementById("input-name");
const mobileInput = document.getElementById("input-mobile");
const zoneSelect = document.getElementById("select-zone");
const rollInput = document.getElementById("input-roll");
const btnSubmit = document.getElementById("btn-submit");
const btnSpinner = document.getElementById("btn-spinner");

// Error DOM Elements
const errorName = document.getElementById("error-name");
const errorMobile = document.getElementById("error-mobile");
const errorZone = document.getElementById("error-zone");
const errorRoll = document.getElementById("error-roll");

// Results DOM Elements
const successCandidateName = document.getElementById("success-candidate-name");
const successRollNo = document.getElementById("success-roll-no");
const successZoneName = document.getElementById("success-zone-name");

const errorCandidateName = document.getElementById("error-candidate-name");
const errorRollNo = document.getElementById("error-roll-no");
const errorZoneName = document.getElementById("error-zone-name");

const btnSuccessReset = document.getElementById("btn-success-reset");
const btnErrorReset = document.getElementById("btn-error-reset");

// Load the roll number JSON database
async function loadRollDatabase() {
  if (databaseLoading || rollDatabase) return;
  databaseLoading = true;
  
  try {
    const response = await fetch("data/roll_numbers.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    rollDatabase = await response.json();
    console.log("Roll numbers database loaded successfully.");
  } catch (error) {
    console.error("Failed to load roll number database:", error);
    // In case of local testing or direct file system opening:
    // Try to load again or handle gracefully
  } finally {
    databaseLoading = false;
  }
}

// Format Name Input (Capitalize words)
nameInput.addEventListener("blur", () => {
  if (nameInput.value) {
    nameInput.value = nameInput.value
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
});

// Enforce numbers only in mobile and roll inputs
mobileInput.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});
rollInput.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});

// Helper validation functions
function validateName() {
  const isValid = nameInput.value.trim().length >= 2;
  errorName.style.display = isValid ? "none" : "flex";
  nameInput.style.borderColor = isValid ? "" : "var(--error)";
  return isValid;
}

function validateMobile() {
  const val = mobileInput.value.trim();
  const isValid = /^\d{10}$/.test(val);
  errorMobile.style.display = isValid ? "none" : "flex";
  mobileInput.style.borderColor = isValid ? "" : "var(--error)";
  return isValid;
}

function validateZone() {
  const isValid = zoneSelect.value !== "";
  errorZone.style.display = isValid ? "none" : "flex";
  zoneSelect.style.borderColor = isValid ? "" : "var(--error)";
  return isValid;
}

function validateRoll() {
  const val = rollInput.value.trim();
  const isValid = /^\d{16}$/.test(val);
  errorRoll.style.display = isValid ? "none" : "flex";
  rollInput.style.borderColor = isValid ? "" : "var(--error)";
  return isValid;
}

// Clear validation errors
function clearValidationErrors() {
  [errorName, errorMobile, errorZone, errorRoll].forEach(err => err.style.display = "none");
  [nameInput, mobileInput, zoneSelect, rollInput].forEach(inp => inp.style.borderColor = "");
}

// Switch view state
function switchView(activeView) {
  [formView, successView, errorView].forEach(view => {
    view.classList.remove("active");
  });
  activeView.classList.add("active");
}

// Run success confetti
function triggerConfetti() {
  if (typeof confetti === 'function') {
    // Simple splash from center
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    // Fire side bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
    }, 250);
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 400);
  }
}

// Log data to Google Sheet via Apps Script
async function logToGoogleSheet(name, mobile, zone, roll, status) {
  if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE" || !APPS_SCRIPT_URL) {
    console.warn("Google Apps Script URL is not set. Data logging is skipped.");
    return;
  }

  const payload = {
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    name: name,
    mobile: mobile,
    zone: zone,
    roll: roll,
    status: status
  };

  try {
    // We send as a standard fetch with no-cors. Google Web Apps redirect on POST,
    // which triggers standard CORS block in JS, but 'no-cors' safely delivers the payload
    // and registers it in the sheet without browser blocking.
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(payload)
    });
    console.log("Logged details successfully to Google Sheets.");
  } catch (error) {
    console.error("Error logging details to Google Sheets:", error);
  }
}

// Handle Form Submit
resultForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Trigger validations
  const isNameVal = validateName();
  const isMobileVal = validateMobile();
  const isZoneVal = validateZone();
  const isRollVal = validateRoll();
  
  if (!isNameVal || !isMobileVal || !isZoneVal || !isRollVal) {
    return;
  }
  
  // Ensure database is loaded before checking
  if (!rollDatabase) {
    btnSubmit.disabled = true;
    btnSpinner.style.display = "block";
    await loadRollDatabase();
    btnSubmit.disabled = false;
    btnSpinner.style.display = "none";
    
    // Check if loading failed
    if (!rollDatabase) {
      alert("Error: Unable to connect to the results database. Please try reloading the page.");
      return;
    }
  }
  
  const name = nameInput.value.trim();
  const mobile = mobileInput.value.trim();
  const zone = zoneSelect.value;
  const roll = rollInput.value.trim();
  
  // Check qualification status in database
  const qualifiedRollsForZone = rollDatabase[zone] || [];
  const isQualified = qualifiedRollsForZone.includes(roll);
  const statusString = isQualified ? "Qualified" : "Not Qualified";
  
  // Show spinner momentarily for premium application feel
  btnSubmit.disabled = true;
  btnSpinner.style.display = "block";
  
  // Async log to Google Sheet in background
  logToGoogleSheet(name, mobile, zone, roll, statusString);
  
  setTimeout(() => {
    btnSubmit.disabled = false;
    btnSpinner.style.display = "none";
    
    if (isQualified) {
      // Setup success screen
      successCandidateName.textContent = name;
      successRollNo.textContent = roll;
      successZoneName.textContent = zone;
      
      switchView(successView);
      triggerConfetti();
    } else {
      // Setup error screen
      errorCandidateName.textContent = name;
      errorRollNo.textContent = roll;
      errorZoneName.textContent = zone;
      
      switchView(errorView);
    }
  }, 800); // 800ms loading effect for UX
});

// Setup Reset Buttons
btnSuccessReset.addEventListener("click", () => {
  rollInput.value = "";
  clearValidationErrors();
  switchView(formView);
  rollInput.focus();
});

btnErrorReset.addEventListener("click", () => {
  rollInput.value = "";
  clearValidationErrors();
  switchView(formView);
  rollInput.focus();
});

// Initial Database load on page mount
window.addEventListener("DOMContentLoaded", () => {
  loadRollDatabase();
});
