import {
    state
  } from "./config.js";
import {
 
 lastValidEndDate,
 lastValidStartDate
} from "./config.js";


function filterDataByDateRange(data, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log("Filtering data from", startDate, "to", endDate);

    return data.filter(row => {
        const date = new Date(row.date);
        console.log("Row date:", row.date, "Parsed date:", date);
        return date >= start && date <= end;
    });
}

function resetToDefaultDateRange() {
    const defaultDateRange = getDefaultDateRange();
    document.getElementById('start-date').value = defaultDateRange.startDate;
    document.getElementById('end-date').value = defaultDateRange.endDate;

    // Update the date range display with the default dates
    const formattedStartDate = new Date(defaultDateRange.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedEndDate = new Date(defaultDateRange.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('date-range-display').innerText = `Data Period: ${formattedStartDate} - ${formattedEndDate}`;

    // Update the global last valid date range variables
    lastValidStartDate = defaultDateRange.startDate;
    lastValidEndDate = defaultDateRange.endDate;

    // Fetch and display the data for the default date range
    fetchDataAndDisplay(lastValidStartDate, lastValidEndDate);
}

function getDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 0);

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

export { getDefaultDateRange, resetToDefaultDateRange, filterDataByDateRange };