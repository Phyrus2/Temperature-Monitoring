import { getDefaultDateRange } from "./filter.js";
import { fetchDataAndDisplay } from "./fetch-data.js";
import { displayErrorMessage } from "./error.js";
import {
    state
  } from "./config.js";
import {
 
  audio,
  audioReady,
  userInteracted,
} from "./config.js";

// Fetch data and display on initial load
const defaultDateRange = getDefaultDateRange();
fetchDataAndDisplay(defaultDateRange.startDate, defaultDateRange.endDate);

document.addEventListener('DOMContentLoaded', (event) => {
    const defaultDateRange = getDefaultDateRange();
    state.lastValidStartDate = defaultDateRange.startDate;
    state.lastValidEndDate = defaultDateRange.endDate;
    fetchDataAndDisplay(state.lastValidStartDate, state.lastValidEndDate);

    setInterval(() => {
        // Use the last valid date range for interval fetching
        fetchDataAndDisplay(state.lastValidStartDate, state.lastValidEndDate);
    }, 5000);
});

document.getElementById("filter-button").addEventListener("click", function () {
  let startDate = document.getElementById("start-date").value;
  let endDate = document.getElementById("end-date").value;
  const dateRangeDisplay = document.getElementById("date-range-display");

  if (!startDate || !endDate) {
    displayErrorMessage(
      "Invalid Date Range",
      "Please select both start and end dates."
    );
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    displayErrorMessage(
      "Invalid Date Range",
      "The end date cannot be earlier than the start date.",
      resetToDefaultDateRange
    );
    return;
  }

  const formattedStartDate = new Date(startDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedEndDate = new Date(endDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  dateRangeDisplay.innerText = `Data Period: ${formattedStartDate} - ${formattedEndDate}`;

  // Store the valid date range in the variables
  state.lastValidStartDate = startDate;
  state.lastValidEndDate = endDate;

  // Fetch and display the filtered data based on user input
  fetchDataAndDisplay(startDate, endDate);
});

document.addEventListener("DOMContentLoaded", function () {
  const defaultDates = getDefaultDateRange();
  document.getElementById("start-date").value = defaultDates.startDate;
  document.getElementById("end-date").value = defaultDates.endDate;

  const dateRangeDisplay = document.getElementById("date-range-display");
  const formattedStartDate = new Date(
    defaultDates.startDate
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedEndDate = new Date(defaultDates.endDate).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
  dateRangeDisplay.innerText = `Data Period: ${formattedStartDate} - ${formattedEndDate}`;
});

audio.loop = true;
audio.load();

document.addEventListener(
  "click",
  () => {
    userInteracted = true;
    if (!audioReady) {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audioReady = true;
        })
        .catch((error) => {
          console.error("Audio play failed:", error);
        });
    }
  },
  { once: true }
); // Listen only once

audio.addEventListener("canplaythrough", () => {
  state.audioReady = true;
});
