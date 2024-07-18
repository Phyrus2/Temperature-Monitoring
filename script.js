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

document.getElementById('chart-select').addEventListener('change', function() {
    const startDate = document.getElementById('start-date').value || getDefaultDateRange().startDate;
    const endDate = document.getElementById('end-date').value || getDefaultDateRange().endDate;
    fetchDataAndDisplay(startDate, endDate);
});

document.getElementById('display-select').addEventListener('change', function() {
    const startDate = document.getElementById('start-date').value || getDefaultDateRange().startDate;
    const endDate = document.getElementById('end-date').value || getDefaultDateRange().endDate;
    fetchDataAndDisplay(startDate, endDate);
});

function fetchDataAndDisplay(startDate, endDate) {
    const selectedChart = document.getElementById('chart-select').value;
    const displayType = document.getElementById('display-select').value;
    fetchData(startDate, endDate, true, selectedChart, displayType);
}

function drawTemperatureChart(data) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const temperatures = data.map(row => parseFloat(row.temperature || row.avg_temperature));
    const labels = data.map(row => row.time_stamp ? row.time_stamp.slice(0, 5) : new Date(row.date).toLocaleDateString());

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: temperatures,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                    },
                    ticks: {
                        stepSize: 1, // Set step size to 1
                        callback: function(value) {
                            return value.toFixed(0); // Menghapus desimal
                        }
                    },
                    min: Math.floor(Math.min(...temperatures) - 1), // Adjust min value
                    max: Math.ceil(Math.max(...temperatures) + 1)   // Adjust max value
                }
            }
        }
    });
}



function drawHumidityChart(data) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const humidity = data.map(row => parseFloat(row.humidity || row.avg_humidity));
    const labels = data.map(row => row.time_stamp ? row.time_stamp.slice(0, 5) : new Date(row.date).toLocaleDateString());

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: humidity,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Humidity (%)',
                    },
                    ticks: {
                        stepSize: 1, // Set step size to 1
                        callback: function(value) {
                            return value.toFixed(0); // Menghapus desimal
                        }
                    },
                    suggestedMin: Math.min(...humidity) - 1, // Mengurangi sedikit nilai minimum
                    suggestedMax: Math.max(...humidity) + 1  // Menambah sedikit nilai maksimum
                }
            }
        }
    });
}




function renderTable(data) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Clear existing table data

    data.forEach(row => {
        const tr = document.createElement('tr');
        const dateOrTimeTd = document.createElement('td');
        const tempTd = document.createElement('td');
        const humidityTd = document.createElement('td');

        // Check if row contains time_stamp or date to differentiate between single day and range
        if (row.time_stamp) {
            // If time_stamp exists, it's a single day data
            dateOrTimeTd.textContent = row.time_stamp;
        } else {
            // Otherwise, it's a date range data
            dateOrTimeTd.textContent = new Date(row.date).toLocaleDateString();
        }

        // Handle single day and date range temperature and humidity
        const temperature = row.temperature || row.avg_temperature;
        const humidity = row.humidity || row.avg_humidity;

        tempTd.textContent = temperature + "°C";
        humidityTd.textContent = humidity + "%";

        tr.appendChild(dateOrTimeTd);
        tr.appendChild(tempTd);
        tr.appendChild(humidityTd);

        tableBody.appendChild(tr);
    });

    const tableWrapper = document.querySelector('.table-wrapper');
    if (data.length > 20) {
        tableWrapper.style.overflowY = 'auto';
    } else {
        tableWrapper.style.overflowY = 'hidden';
    }
}





function fetchData(startDate, endDate, isFiltered = false, selectedChart, displayType) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                try {
                    var responseText = this.responseText;
                    console.log("Raw response text:", responseText);
                    var data = JSON.parse(responseText);
                    console.log("Parsed data:", data); // Log data yang diterima
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
                    if (displayType === 'chart') {
                        document.getElementById('myChart').style.display = 'block';
                        document.getElementById('data-table').style.display = 'none';
                        if (selectedChart === 'temperature') {
                            drawTemperatureChart(data);
                        } else if (selectedChart === 'humidity') {
                            drawHumidityChart(data);
                        }
                    } else if (displayType === 'table') {
                        document.getElementById('myChart').style.display = 'none';
                        document.getElementById('data-table').style.display = 'block';
                        renderTable(data);
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

    const url = startDate === endDate ? 
        `http://localhost:3000/data-by-date?date=${startDate}` :
        `http://localhost:3000/average-data?startDate=${startDate}&endDate=${endDate}`;

    xhr.open("GET", url, true);
    xhr.send();
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

        // Check for temperature exceeding 30 degrees
        if (temperature > 30) {
            temperatureAlertActive = true;
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

    // Handle temperature alert
    handleTemperatureAlert(temperatureAlertActive);
}

function handleTemperatureAlert(isActive) {
    if (isActive) {
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
                showConfirmButton: false
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
