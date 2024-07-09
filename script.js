let chart;

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
    const temperatures = data.map(row => parseFloat(row.temperature));

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(row => new Date(row.date_stamp).toISOString().split('T')[0]),
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
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'YYYY-MM-DD',
                        displayFormats: {
                            day: 'YYYY-MM-DD'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                    }
                }
            }
        }
    });
}

function drawHumidityChart(data) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const humidity = data.map(row => parseFloat(row.humidity));

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(row => new Date(row.date_stamp).toISOString().split('T')[0]),
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
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'YYYY-MM-DD',
                        displayFormats: {
                            day: 'YYYY-MM-DD'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Humidity (%)',
                    }
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
        const dateTd = document.createElement('td');
        const tempTd = document.createElement('td');
        const humidityTd = document.createElement('td');

        dateTd.textContent = row.date_stamp;
        tempTd.textContent = row.temperature + "°C";
        humidityTd.textContent = row.humidity + "%";

        tr.appendChild(dateTd);
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
                    console.log("Parsed data:", data);
                    var filteredData = filterDataByDateRange(data, startDate, endDate);
                    console.log("Filtered data:", filteredData);
                    if (filteredData.length === 0 && isFiltered) {
                        displayErrorMessage("No temperature data available");
                        var defaultDateRange = getDefaultDateRange();
                        filteredData = filterDataByDateRange(data, defaultDateRange.startDate, defaultDateRange.endDate);
                    } else {
                        clearErrorMessage();
                    }
                    updateStats(filteredData);
                    if (displayType === 'chart') {
                        document.getElementById('myChart').style.display = 'block';
                        document.getElementById('data-table').style.display = 'none';
                        if (selectedChart === 'temperature') {
                            drawTemperatureChart(filteredData);
                        } else if (selectedChart === 'humidity') {
                            drawHumidityChart(filteredData);
                        }
                    } else if (displayType === 'table') {
                        document.getElementById('myChart').style.display = 'none';
                        document.getElementById('data-table').style.display = 'block';
                        renderTable(filteredData);
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
    xhr.open("GET", "fetch_data.php", true);
    xhr.send();
}

function filterDataByDateRange(data, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log("Filtering data from", startDate, "to", endDate);

    return data.filter(row => {
        const date = new Date(row.date_stamp);
        console.log("Row date:", row.date_stamp, "Parsed date:", date);
        return date >= start && date <= end;
    });
}

function getDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

function updateStats(data) {
    if (data.length === 0) return;

    let highestTemp = -Infinity, lowestTemp = Infinity;
    let highestTempDate = "", lowestTempDate = "";

    let highestHumidity = -Infinity, lowestHumidity = Infinity;
    let highestHumidityDate = "", lowestHumidityDate = "";

    data.forEach(row => {
        const temperature = parseFloat(row.temperature);
        const humidity = parseFloat(row.humidity);
        const date = row.date_stamp;

        console.log("Processing row:", row);

        if (temperature > highestTemp) {
            highestTemp = temperature;
            highestTempDate = date;
            console.log("New highest temperature:", highestTemp, "on", highestTempDate);
        }
        if (temperature < lowestTemp) {
            lowestTemp = temperature;
            lowestTempDate = date;
            console.log("New lowest temperature:", lowestTemp, "on", lowestTempDate);
        }
        if (humidity > highestHumidity) {
            highestHumidity = humidity;
            highestHumidityDate = date;
            console.log("New highest humidity:", highestHumidity, "on", highestHumidityDate);
        }
        if (humidity < lowestHumidity) {
            lowestHumidity = humidity;
            lowestHumidityDate = date;
            console.log("New lowest humidity:", lowestHumidity, "on", lowestHumidityDate);
        }
    });

    console.log("Final highest temperature:", highestTemp, "on", highestTempDate);
    console.log("Final lowest temperature:", lowestTemp, "on", lowestTempDate);
    console.log("Final highest humidity:", highestHumidity, "on", highestHumidityDate);
    console.log("Final lowest humidity:", lowestHumidity, "on", lowestHumidityDate);

    document.getElementById("highest-temperature").textContent = highestTemp + "°C";
    document.getElementById("highest-temperature-date").textContent = highestTempDate;
    document.getElementById("lowest-temperature").textContent = lowestTemp + "°C";
    document.getElementById("lowest-temperature-date").textContent = lowestTempDate;
    document.getElementById("highest-humidity").textContent = highestHumidity + "%";
    document.getElementById("highest-humidity-date").textContent = highestHumidityDate;
    document.getElementById("lowest-humidity").textContent = lowestHumidity + "%";
    document.getElementById("lowest-humidity-date").textContent = lowestHumidityDate;
}

function displayErrorMessage(message) {
    var modal = document.getElementById("errorModal");
    var span = document.getElementsByClassName("close")[0];

    document.getElementById("modal-message").textContent = message;

    modal.style.display = "block";

    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function clearErrorMessage() {
    var errorContainer = document.getElementById("data-container");
    errorContainer.innerHTML = "";
}

// Fetch and draw default chart on page load
fetchDataAndDisplay(getDefaultDateRange().startDate, getDefaultDateRange().endDate);
