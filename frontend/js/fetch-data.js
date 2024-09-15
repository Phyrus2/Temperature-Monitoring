import { clearErrorMessage, displayErrorMessage } from "./error.js";
import { handleTemperatureAlert } from "./alerts.js";
import {
  renderDetailedTable,
  drawTemperatureChart,
  drawHumidityChart,
} from "./content.js";
import { resetToDefaultDateRange } from "./filter.js";

function fetchData(startDate, endDate, isFiltered = false, displayType) {
  // Existing XMLHttpRequest for other endpoint
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        try {
          var responseText = this.responseText;
          console.log("Raw response text:", responseText);
          var data = JSON.parse(responseText);
          console.log("Parsed data:", data); // Log the received data
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
          const isSingleDay = startDate === endDate;
          updateStats(data, isSingleDay);

          // Always display charts
          document.getElementById("chartTemperature").style.display = "block";
          document.getElementById("chartHumidity").style.display = "block";

          drawTemperatureChart(data, isSingleDay);
          drawHumidityChart(data, isSingleDay);

          // Display table if needed
          if (displayType === "table") {
            renderDetailedTable(data);
          }
        } catch (e) {
          console.error("Error parsing JSON: ", e);
          displayErrorMessage("Parsing Error", "Error parsing JSON data.");
        }
      } else {
        console.error("XHR request failed with status: ");
        displayErrorMessage(
          "Data Not Found",
          "Failed to fetch data.",
          resetToDefaultDateRange
        );
      }
    }
  };

  // Existing URL for the other endpoint
  const url =
    startDate === endDate
      ? `http://localhost:3000/data-by-date?date=${startDate}`
      : `http://localhost:3000/average-data?startDate=${startDate}&endDate=${endDate}`;

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
  const urlDetailed = `http://localhost:3000/detailed-data?startDate=${startDate}&endDate=${endDate}`;

  xhrDetailed.open("GET", urlDetailed, true);
  xhrDetailed.send();
}

function fetchDataAndDisplay(startDate, endDate) {
  fetchData(startDate, endDate, true, "chart");
}

function updateStats(data, isSingleDay) {
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
    temperatureAlertActive = latestTemperature > 27;
  }

  // Handle temperature alert
  handleTemperatureAlert(temperatureAlertActive, latestRow, latestDate);
}

export { fetchData, fetchDataAndDisplay, updateStats };
