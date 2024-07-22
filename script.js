let chart;

document.addEventListener('DOMContentLoaded', (event) => {
    const defaultDateRange = getDefaultDateRange();
    fetchDataAndDisplay(defaultDateRange.startDate, defaultDateRange.endDate);
    setInterval(() => {
        const startDate = document.getElementById('start-date').value || defaultDateRange.startDate;
        const endDate = document.getElementById('end-date').value || defaultDateRange.endDate;
        fetchDataAndDisplay(startDate, endDate);
    }, 5000);
});

document.getElementById('filter-button').addEventListener('click', function() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    if (startDate && endDate) {
        if (new Date(startDate) > new Date(endDate)) {
            displayErrorMessage("End date cannot be earlier than start date.");
        } else {
            fetchDataAndDisplay(startDate, endDate);
        }
    } else {
        displayErrorMessage("Please select both start and end dates.");
    }
});



let temperatureChart, humidityChart;

function fetchDataAndDisplay(startDate, endDate) {
    fetchData(startDate, endDate, true, 'chart');
}

const drawTemperatureChart = (data, isSingleDay) => {
    const temperatures = data.map(row => parseFloat(row.temperature || row.avg_temperature));
    const labels = data.map(row => isSingleDay ? row.time_stamp.slice(0, 5) : new Date(row.date).toLocaleDateString());

    const temperatureChartOptions = {
        series: [{
            name: "Temperature",
            data: temperatures,
        }],
        colors: ["#3C50E0"],
        chart: {
            fontFamily: "Satoshi, sans-serif",
            height: 335,
            
            type: "line",
            dropShadow: {
                enabled: true,
                color: "#623CEA14",
                top: 10,
                blur: 4,
                left: 0,
                opacity: 0.1,
            },
            toolbar: {
                show: false,
            },
            width: "100%",
        },
        responsive: [
            {
                breakpoint: 1024,
                options: {
                    chart: {
                        height: 300,
                    },
                },
            },
            {
                breakpoint: 1366,
                options: {
                    chart: {
                        height: 350,
                    },
                },
            },
        ],
        stroke: {
            width: 2,
            curve: "straight",
        },
        markers: {
            size: 4,
            colors: "#fff",
            strokeColors: ["#3056D3"],
            strokeWidth: 3,
            strokeOpacity: 0.9,
            strokeDashArray: 0,
            fillOpacity: 1,
            hover: {
                size: undefined,
                sizeOffset: 5,
            },
        },
        xaxis: {
            type: "category",
            categories: labels,
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
        },
        yaxis: {
            title: {
                style: {
                    fontSize: "0px",
                },
            },
            min: Math.floor(Math.min(...temperatures) - 1),
            max: Math.ceil(Math.max(...temperatures) + 1),
        },
        dataLabels: {
            enabled: false,
        },
        grid: {
            xaxis: {
                lines: {
                    show: true,
                },
            },
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
    };

    if (temperatureChart) {
        temperatureChart.updateOptions(temperatureChartOptions);
    } else {
        const temperatureChartSelector = document.querySelector("#chartTemperature");
        if (temperatureChartSelector) {
            temperatureChart = new ApexCharts(temperatureChartSelector, temperatureChartOptions);
            temperatureChart.render();
        }
    }
};

const drawHumidityChart = (data, isSingleDay) => {
    const humidity = data.map(row => parseFloat(row.humidity || row.avg_humidity));
    const labels = data.map(row => isSingleDay ? row.time_stamp.slice(0, 5) : new Date(row.date).toLocaleDateString());

    const humidityChartOptions = {
        series: [{
            name: "Humidity",
            data: humidity,
        }],
        colors: ["#80CAEE"],
        chart: {
            fontFamily: "Satoshi, sans-serif",
            height: 335,
            type: "line",
            dropShadow: {
                enabled: true,
                color: "#623CEA14",
                top: 10,
                blur: 4,
                left: 0,
                opacity: 0.1,
            },
            toolbar: {
                show: false,
            },
        },
        responsive: [
            {
                breakpoint: 1024,
                options: {
                    chart: {
                        height: 300,
                    },
                },
            },
            {
                breakpoint: 1366,
                options: {
                    chart: {
                        height: 350,
                    },
                },
            },
        ],
        stroke: {
            width: 2,
            curve: "straight",
        },
        markers: {
            size: 4,
            colors: "#fff",
            strokeColors: ["#80CAEE"],
            strokeWidth: 3,
            strokeOpacity: 0.9,
            strokeDashArray: 0,
            fillOpacity: 1,
            hover: {
                size: undefined,
                sizeOffset: 5,
            },
        },
        xaxis: {
            type: "category",
            categories: labels,
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
        },
        yaxis: {
            title: {
                style: {
                    fontSize: "0px",
                },
            },
            min: Math.floor(Math.min(...humidity) - 1),
            max: Math.ceil(Math.max(...humidity) + 1),
        },
        dataLabels: {
            enabled: false,
        },
        grid: {
            xaxis: {
                lines: {
                    show: true,
                },
            },
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
    };

    if (humidityChart) {
        humidityChart.updateOptions(humidityChartOptions);
    } else {
        const humidityChartSelector = document.querySelector("#chartHumidity");
        if (humidityChartSelector) {
            humidityChart = new ApexCharts(humidityChartSelector, humidityChartOptions);
            humidityChart.render();
        }
    }
};

function renderDetailedTable(data) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Clear existing rows

    // Define the times that should appear in the table
    const times = ['07:00:00', '10:00:00', '13:00:00', '16:00:00', '19:00:00', '22:00:00'];

    // Helper function to get time in HH:00:00 format
    const formatTime = (time) => time.split(':').slice(0, 2).join(':') + ':00';

    // Group the data by date and time range
    const groupedData = data.reduce((acc, curr) => {
        const date = new Date(curr.date).toLocaleDateString();
        const timeFormatted = formatTime(curr.time);
        const hour = parseInt(curr.time.split(':')[0], 10);

        // Initialize the data structure if it doesn't exist
        if (!acc[date]) {
            acc[date] = {
                '07:00:00': { temperature: '-', humidity: '-' },
                '10:00:00': { temperature: '-', humidity: '-' },
                '13:00:00': { temperature: '-', humidity: '-' },
                '16:00:00': { temperature: '-', humidity: '-' },
                '19:00:00': { temperature: '-', humidity: '-' },
                '22:00:00': { temperature: '-', humidity: '-' },
            };
        }

        // Check if the time is within the range of the nearest hour slots
        times.forEach(time => {
            const timeHour = parseInt(time.split(':')[0], 10);
            if (hour >= timeHour - 1 && hour <= timeHour + 1) {
                acc[date][time] = {
                    temperature: curr.temperature,
                    humidity: curr.humidity
                };
            }
        });

        return acc;
    }, {});

    // Create a row for each date
    Object.keys(groupedData).forEach(date => {
        const divRow = document.createElement('div');
        divRow.className = "grid grid-cols-7 border-t border-stroke px-4 py-4.5 dark:border-strokedark md:px-6 2xl:px-7.5";

        // Create and append the date column
        const dateDiv = document.createElement('div');
        dateDiv.className = "col-span-1 flex items-center";
        dateDiv.textContent = date;
        divRow.appendChild(dateDiv);

        // Create and append the time slots
        times.forEach(time => {
            const timeDiv = document.createElement('div');
            timeDiv.className = "col-span-1 flex items-center";
            const dataEntry = groupedData[date][time];
            timeDiv.textContent = `${dataEntry.temperature}/${dataEntry.humidity}`;
            divRow.appendChild(timeDiv);
        });

        tableBody.appendChild(divRow);
    });
}











function fetchData(startDate, endDate, isFiltered = false, displayType) {
    // Existing XMLHttpRequest for other endpoint
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                try {
                    var responseText = this.responseText;
                    console.log("Raw response text:", responseText);
                    var data = JSON.parse(responseText);
                    console.log("Parsed data:", data); // Log the received data
                    if (isFiltered) {
                        if (data.length === 0) {
                            displayErrorMessage("No data available for the selected date range.");
                            var defaultDateRange = getDefaultDateRange();
                            fetchDataAndDisplay(defaultDateRange.startDate, defaultDateRange.endDate);
                            return;
                        } else {
                            clearErrorMessage();
                        }
                    }
                    const isSingleDay = startDate === endDate;
                    updateStats(data, isSingleDay);
                    
                    // Always display charts
                    document.getElementById('chartTemperature').style.display = 'block';
                    document.getElementById('chartHumidity').style.display = 'block';
                    
                    drawTemperatureChart(data, isSingleDay);
                    drawHumidityChart(data, isSingleDay);
                    
                    // Display table if needed
                    if (displayType === 'table') {
                        renderDetailedTable(data);
                    }
                    
                } catch (e) {
                    console.error("Error parsing JSON: ", e);
                    displayErrorMessage("Error parsing JSON data.");
                }
            } else {
                console.error("XHR request failed with status: ", this.status);
                displayErrorMessage("Failed to fetch data. Status: " + this.status);
            }
        }
    };

    // Existing URL for the other endpoint
    const url = startDate === endDate ? 
        `http://localhost:3000/data-by-date?date=${startDate}` :
        `http://localhost:3000/average-data?startDate=${startDate}&endDate=${endDate}`;

    xhr.open("GET", url, true);
    xhr.send();

    // New XMLHttpRequest to call the /detailed-data endpoint
    var xhrDetailed = new XMLHttpRequest();
    xhrDetailed.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                try {
                    var responseTextDetailed = this.responseText;
                    console.log("Raw response text (detailed):", responseTextDetailed);
                    var dataDetailed = JSON.parse(responseTextDetailed);
                    console.log("Parsed data (detailed):", dataDetailed); // Log the received data
                    if (isFiltered) {
                        if (dataDetailed.length === 0) {
                            displayErrorMessage("No detailed data available for the selected date range.");
                            var defaultDateRange = getDefaultDateRange();
                            fetchDataAndDisplay(defaultDateRange.startDate, defaultDateRange.endDate);
                            return;
                        } else {
                            clearErrorMessage();
                        }
                    }
                    // Display table if needed
                   
                        renderDetailedTable(dataDetailed);
                        console.log("Detailed data")
                    
                    
                } catch (e) {
                    console.error("Error parsing JSON (detailed): ", e);
                    displayErrorMessage("Error parsing JSON data (detailed).");
                }
            } else {
                console.error("XHR request for detailed data failed with status: ", this.status);
                displayErrorMessage("Failed to fetch detailed data. Status: " + this.status);
            }
        }
    };

    // New URL for the /detailed-data endpoint
    const urlDetailed = `http://localhost:3000/detailed-data?startDate=${startDate}&endDate=${endDate}`;
    
    xhrDetailed.open("GET", urlDetailed, true);
    xhrDetailed.send();
}



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





function clearErrorMessage() {
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement) {
        errorMessageElement.textContent = '';
        errorMessageElement.style.display = 'none';
    }
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

let userInteracted = false;
let audioReady = false;
const audio = document.getElementById('alert-sound');
let lastAlertTimestamp = null;

// Preload the audio and set it to loop
audio.loop = true;
audio.load();

// Event listener to capture user interaction and prepare the audio
document.addEventListener('click', () => {
    userInteracted = true;
    if (!audioReady) {
        audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
            audioReady = true;
        }).catch(error => {
            console.error('Audio play failed:', error);
        });
    }
}, { once: true }); // Listen only once

// Event listener to ensure the audio is ready to play
audio.addEventListener('canplaythrough', () => {
    audioReady = true;
});

function updateStats(data, isSingleDay) {
    if (data.length === 0) return;

    let highestTemp = -Infinity, lowestTemp = Infinity;
    let highestTempDate = "", lowestTempDate = "";

    let highestHumidity = -Infinity, lowestHumidity = Infinity;
    let highestHumidityDate = "", lowestHumidityDate = "";

    let temperatureAlertActive = false; // Flag to track if alert is active

    // Cari data dengan timestamp paling baru
    let latestRow = null;
    let latestDate = -Infinity;

    data.forEach(row => {
        const temperature = parseFloat(row.temperature || row.avg_temperature);
        const humidity = parseFloat(row.humidity || row.avg_humidity);
        let date;

        if (isSingleDay) {
            // Assuming row.time_stamp is in HH:MM:SS format and baseDate is YYYY-MM-DD
            const baseDate = new Date().toISOString().split('T')[0];
            date = `${baseDate}T${row.time_stamp}`;
        } else {
            date = row.date;
        }

        const dateObject = new Date(date);

        if (isNaN(dateObject)) {
            console.error('Missing or invalid date/time_stamp in row:', row);
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

        return isSingleDay ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : dateObj.toLocaleDateString();
    };

    document.getElementById("highest-temperature").textContent = highestTemp + "°C";
    document.getElementById("highest-temperature-date").textContent = formatDate(highestTempDate);
    document.getElementById("lowest-temperature").textContent = lowestTemp + "°C";
    document.getElementById("lowest-temperature-date").textContent = formatDate(lowestTempDate);
    document.getElementById("highest-humidity").textContent = highestHumidity + "%";
    document.getElementById("highest-humidity-date").textContent = formatDate(highestHumidityDate);
    document.getElementById("lowest-humidity").textContent = lowestHumidity + "%";
    document.getElementById("lowest-humidity-date").textContent = formatDate(lowestHumidityDate);

    // Periksa suhu terbaru untuk mengaktifkan alert
    if (latestRow) {
        const latestTemperature = parseFloat(latestRow.temperature || latestRow.avg_temperature);
        temperatureAlertActive = latestTemperature > 30;
    }

    // Handle temperature alert
    handleTemperatureAlert(temperatureAlertActive, latestDate);
}

function handleTemperatureAlert(isActive, latestDate) {
    const thirtyMinutes = 30 * 60 * 1000;

    if (isActive) {
        if (lastAlertTimestamp && (new Date() - lastAlertTimestamp) < thirtyMinutes) {
            return; // Don't show alert if it was shown within the last 30 minutes
        }

        if (userInteracted && audioReady && audio.paused) {
            audio.play();
        }

        if (!Swal.isVisible()) {
            Swal.fire({
                title: "Warning!",
                text: "Temperature exceeds 30 degrees.",
                icon: "warning",
                backdrop: `
                    rgba(255,0,0,0.4)
                    left top
                    no-repeat
                `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                showConfirmButton: true
            }).then(() => {
                // This will be executed when the alert is closed
                audio.pause();
                audio.currentTime = 0;
                lastAlertTimestamp = new Date(); // Update the last alert timestamp
            });
        }
    } else {
        audio.pause();
        audio.currentTime = 0;
        if (Swal.isVisible()) {
            Swal.close();
        }
    }
}










 // Display error message in modal
 function displayErrorMessage(message) {
    const modal = document.getElementById('errorModal');
    const modalMessage = document.getElementById('modal-message');
    modalMessage.textContent = message;
    modal.style.display = 'block';
}

// Close the modal when the close button is clicked
document.querySelector('.close').addEventListener('click', function() {
    const modal = document.getElementById('errorModal');
    modal.style.display = 'none';
});

// Close the modal when the user clicks outside of it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('errorModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});


// Fetch data and display on initial load
const defaultDateRange = getDefaultDateRange();
fetchDataAndDisplay(defaultDateRange.startDate, defaultDateRange.endDate);
