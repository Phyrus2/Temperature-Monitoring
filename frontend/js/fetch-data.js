import { clearErrorMessage, displayErrorMessage } from "./error.js";
import { checkAllLocationsForAlerts } from "./alerts.js";
import {
  renderDetailedTable,
  drawTemperatureChart,
  drawHumidityChart,
} from "./content.js";
import{state} from "./config.js"
import { resetToDefaultDateRange, getDefaultDateRange } from "./filter.js";




function fetchDataAndDisplay(startDate, endDate, location) {
  
  fetchData(startDate, endDate,location, true, "chart");
}

function updateStats(data, isSingleDay, location, startDate, endDate) {
  if (data.length === 0) return;

  let highestTemp = -Infinity,
    lowestTemp = Infinity;
  let highestTempDate = "",
    lowestTempDate = "";

  let highestHumidity = -Infinity,
    lowestHumidity = Infinity;
  let highestHumidityDate = "",
    lowestHumidityDate = "";

  let temperatureAlertActive = false; // Flag to track if alert is active

  // Find the latest data row
  let latestRow = null;
  let latestDate = -Infinity;

  data.forEach((row) => {
    const temperature = parseFloat(row.temperature || row.avg_temperature);
    const humidity = parseFloat(row.humidity || row.avg_humidity);
    let date;

    if (isSingleDay) {
      const baseDate = new Date().toISOString().split("T")[0];
      date = `${baseDate}T${row.time_stamp}`;
    } else {
      date = row.date;
    }

    const dateObject = new Date(date);

    if (isNaN(dateObject)) {
      console.error("Missing or invalid date/time_stamp in row:", row);
      return;
    }

    if (dateObject > latestDate) {
      latestDate = dateObject;
      latestRow = row;
    }

    if (temperature > highestTemp) {
      highestTemp = temperature;
      highestTempDate = dateObject;
    }
    if (temperature < lowestTemp) {
      lowestTemp = temperature;
      lowestTempDate = dateObject;
    }
    if (humidity > highestHumidity) {
      highestHumidity = humidity;
      highestHumidityDate = dateObject;
    }
    if (humidity < lowestHumidity) {
      lowestHumidity = humidity;
      lowestHumidityDate = dateObject;
    }
  });

  const formatDate = (dateObj) => {
    if (!dateObj) return "Invalid Date";

    return isSingleDay
      ? dateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : dateObj.toLocaleDateString();
  };

  document.getElementById("highest-temperature").textContent =
    highestTemp + "°C";
  document.getElementById("highest-temperature-date").textContent =
    formatDate(highestTempDate);
  document.getElementById("lowest-temperature").textContent = lowestTemp + "°C";
  document.getElementById("lowest-temperature-date").textContent =
    formatDate(lowestTempDate);
  document.getElementById("highest-humidity").textContent =
    highestHumidity + "%";
  document.getElementById("highest-humidity-date").textContent =
    formatDate(highestHumidityDate);
  document.getElementById("lowest-humidity").textContent = lowestHumidity + "%";
  document.getElementById("lowest-humidity-date").textContent =
    formatDate(lowestHumidityDate);

  // Check if the latest temperature exceeds the threshold
  if (latestRow) {
    const latestTemperature = parseFloat(
      latestRow.temperature || latestRow.avg_temperature
    );
    temperatureAlertActive = latestTemperature > 30;
  }

  checkAllLocationsForAlerts(startDate, endDate, latestDate);
}


// for no location feature
// function fetchData(startDate, endDate, isFiltered = false, displayType) {
//   // Existing XMLHttpRequest for other endpoint
//   var xhr = new XMLHttpRequest();
//   xhr.onreadystatechange = function () {
//     if (this.readyState == 4) {
//       if (this.status == 200) {
//         try {
//           var responseText = this.responseText;
//           console.log("Raw response text:", responseText);
//           var data = JSON.parse(responseText);
//           console.log("Parsed data:", data); // Log the received data
//           if (isFiltered) {
//             if (data.length === 0) {
//               displayErrorMessage(
//                 "Data Not Found",
//                 "No data available for the selected date range."
//               );
//               var defaultDateRange = getDefaultDateRange();
//               fetchDataAndDisplay(
//                 defaultDateRange.startDate,
//                 defaultDateRange.endDate
//               );
//               return;
//             } else {
//               clearErrorMessage();
//             }
//           }
//           const isSingleDay = startDate === endDate;
//           updateStats(data, isSingleDay);

//           // Always display charts
//           document.getElementById("chartTemperature").style.display = "block";
//           document.getElementById("chartHumidity").style.display = "block";

//           drawTemperatureChart(data, isSingleDay);
//           drawHumidityChart(data, isSingleDay);

//           // Display table if needed
//           if (displayType === "table") {
//             renderDetailedTable(data);
//           }
//         } catch (e) {
//           console.error("Error parsing JSON: ", e);
//           displayErrorMessage("Parsing Error", "Error parsing JSON data.");
//         }
//       } else {
//         console.error("XHR request failed with status: ");
//         displayErrorMessage(
//           "Data Not Found",
//           "Failed to fetch data.",
//           resetToDefaultDateRange
//         );
//       }
//     }
//   };

//   // Existing URL for the other endpoint
//   const url =
//     startDate === endDate
//       ? `http://localhost:3000/data-by-date?date=${startDate}`
//       : `http://localhost:3000/average-data?startDate=${startDate}&endDate=${endDate}`;

//   xhr.open("GET", url, true);
//   xhr.send();

//   // New XMLHttpRequest to call the /detailed-data endpoint
//   var xhrDetailed = new XMLHttpRequest();
//   xhrDetailed.onreadystatechange = function () {
//     if (this.readyState == 4) {
//       if (this.status == 200) {
//         try {
//           var responseTextDetailed = this.responseText;
//           console.log("Raw response text (detailed):", responseTextDetailed);
//           var dataDetailed = JSON.parse(responseTextDetailed);
//           console.log("Parsed data (detailed):", dataDetailed); // Log the received data
//           if (isFiltered) {
//             if (dataDetailed.length === 0) {
//               displayErrorMessage(
//                 "Data Not Found",
//                 "No detailed data available for the selected date range."
//               );
//               var defaultDateRange = getDefaultDateRange();
//               fetchDataAndDisplay(
//                 defaultDateRange.startDate,
//                 defaultDateRange.endDate
//               );
//               return;
//             } else {
//               clearErrorMessage();
//             }
//           }
//           // Display table if needed

//           renderDetailedTable(dataDetailed);
//           console.log("Detailed data");
//         } catch (e) {
//           console.error("Error parsing JSON (detailed): ", e);
//           displayErrorMessage(
//             "Parsing Error",
//             "Error parsing JSON data (detailed)."
//           );
//         }
//       } else {
//         console.error(
//           "XHR request for detailed data failed with status: ",
//           this.status
//         );
//         displayErrorMessage(
//           "Data Not Found",
//           "Failed to fetch detailed data. Status: " + this.status
//         );
//       }
//     }
//   };

//   // New URL for the /detailed-data endpoint
//   const urlDetailed = `http://localhost:3000/detailed-data?startDate=${startDate}&endDate=${endDate}`;

//   xhrDetailed.open("GET", urlDetailed, true);
//   xhrDetailed.send();
// }






// for location feature
function fetchData(startDate, endDate, isFiltered = false, displayType) {
  // Get the selected location or use default value '1' if none is selected
  const storePicker = document.getElementById('store-picker');
  const location = storePicker.value || '1';

  // Validate if location is set, using default '1' if necessary
  if (!location) {
    // Default location is '1', so this should not be triggered with the default value
    console.warn("No location selected, using default location '1'.");
  }

  const isSingleDay = startDate === endDate;

  // Determine the appropriate endpoint based on the date range
  const url = isSingleDay
    ? `http://localhost:3000/date-location?date=${startDate}&location=${location}`
    : `http://localhost:3000/average-location?startDate=${startDate}&endDate=${endDate}&location=${location}`;

  // XMLHttpRequest for fetching data
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        try {
          var responseText = this.responseText;
          console.log("Raw response text:", responseText);
          var data = JSON.parse(responseText);
          console.log("Parsed data:", data);

          // Safety check to ensure data is in the expected format
          if (!Array.isArray(data) || data.length === 0) {
            displayErrorMessage(
              "Data Not Found",
              "No data available or data format is incorrect."
            );
            var defaultDateRange = getDefaultDateRange();
            fetchDataAndDisplay(
              defaultDateRange.startDate,
              defaultDateRange.endDate
            );
            return;
          }

          if (isFiltered) {
            if (data.length === 0) {
              displayErrorMessage(
                "Data Not Found",
                "No data available for the selected date range."
              );
              var defaultDateRange = getDefaultDateRange();
              fetchDataAndDisplay(
                defaultDateRange.startDate,
                defaultDateRange.endDate
              );
              return;
            } else {
              clearErrorMessage();
            }
          }

          updateStats(data, isSingleDay, location, startDate, endDate);

          // Always display charts
          document.getElementById("chartTemperature").style.display = "block";
          document.getElementById("chartHumidity").style.display = "block";

          drawTemperatureChart(data, isSingleDay);
          drawHumidityChart(data, isSingleDay);

          // Display table if needed
          // if (displayType === "table") {
          //   renderDetailedTable(data);
          // }
        } catch (e) {
          console.error("Error parsing JSON: ", e);
          displayErrorMessage("Parsing Error", "Error parsing JSON data.");
        }
      } else {
        console.error("XHR request failed with status: ", this.status);
        displayErrorMessage(
          "Data Not Found",
          "Failed to fetch data.",
          resetToDefaultDateRange
        );
      }
    }
  };

  xhr.open("GET", url, true);
  xhr.send();

  // New XMLHttpRequest to call the /detailed-data endpoint
  var xhrDetailed = new XMLHttpRequest();
  xhrDetailed.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        try {
          var responseTextDetailed = this.responseText;
          console.log("Raw response text (detailed):", responseTextDetailed);
          var dataDetailed = JSON.parse(responseTextDetailed);
          console.log("Parsed data (detailed):", dataDetailed); // Log the received data
          if (isFiltered) {
            if (dataDetailed.length === 0) {
              displayErrorMessage(
                "Data Not Found",
                "No detailed data available for the selected date range."
              );
              var defaultDateRange = getDefaultDateRange();
              fetchDataAndDisplay(
                defaultDateRange.startDate,
                defaultDateRange.endDate
              );
              return;
            } else {
              clearErrorMessage();
            }
          }
          // Display table if needed

          renderDetailedTable(dataDetailed);
          console.log("Detailed data");
        } catch (e) {
          console.error("Error parsing JSON (detailed): ", e);
          displayErrorMessage(
            "Parsing Error",
            "Error parsing JSON data (detailed)."
          );
        }
      } else {
        console.error(
          "XHR request for detailed data failed with status: ",
          this.status
        );
        displayErrorMessage(
          "Data Not Found",
          "Failed to fetch detailed data. Status: " + this.status
        );
      }
    }
  };

  // New URL for the /detailed-data endpoint
  const urlDetailed = `http://localhost:3000/detailed-location?startDate=${startDate}&endDate=${endDate}&location=${location}`;

  xhrDetailed.open("GET", urlDetailed, true);
  xhrDetailed.send();
}

function fetchLocationData() {
  return new Promise((resolve, reject) => {
    var xhrLocation = new XMLHttpRequest();
    xhrLocation.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200) {
          try {
            var responseTextLocation = this.responseText;
            var dataLocation = JSON.parse(responseTextLocation);
            populateLocationDropdown(dataLocation);

            const storePicker = document.getElementById('store-picker');
            storePicker.value = getDefaultDateRange().defaultLocation;

            setTimeout(() => {
              resolve(storePicker.value); // Resolve with the selected location
            }, 50);
          } catch (e) {
            console.error("Error parsing JSON (location): ", e);
            reject(e);
          }
        } else {
          console.error("XHR request for location data failed with status: ", this.status);
          reject(new Error("Failed to fetch location data. Status: " + this.status));
        }
      }
    };

    const urlLocation = `http://localhost:3000/location`;
    xhrLocation.open("GET", urlLocation, true);
    xhrLocation.send();
  });
}


function initialDropdownSetup() {
  const storePicker = document.getElementById('store-picker');
  storePicker.innerHTML = ''; // Clear existing options

  // Optionally, add a placeholder option while loading actual data
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Loading locations...';
  storePicker.appendChild(placeholderOption);
}

function populateLocationDropdown(locations) {
  const storePicker = document.getElementById('store-picker');
  storePicker.innerHTML = ''; // Clear existing options

  locations.forEach(location => {
    const option = document.createElement('option');
    option.value = location.locID;
    option.textContent = location.locName;
    storePicker.appendChild(option);
  });

  // Explicitly set the dropdown to the default location
  storePicker.value = getDefaultDateRange().defaultLocation;
}

function handleLocationChange() {
  const storePicker = document.getElementById('store-picker');
  const location = storePicker.value || '1';

  console.log("Location after dropdown set:", location); // Debugging

  // Check if there are valid start and end dates stored in the state from the filter
  const startDate = state.lastValidStartDate || getDefaultDateRange().startDate;
  const endDate = state.lastValidEndDate || getDefaultDateRange().endDate;

  // Log the selected location and dates for debugging
  console.log("Location selected:", location);
  console.log("Date range:", startDate, endDate);

  // Fetch data based on the selected location and the current date range
  fetchData(startDate, endDate, location, true, 'table');
}








export { fetchData, fetchDataAndDisplay, updateStats,fetchLocationData, handleLocationChange, initialDropdownSetup, populateLocationDropdown };
