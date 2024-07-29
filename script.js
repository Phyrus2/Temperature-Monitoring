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
    let startDate = document.getElementById('start-date').value;
    let endDate = document.getElementById('end-date').value;
    const dateRangeDisplay = document.getElementById('date-range-display');

    if (!startDate || !endDate) {
        const defaultDates = getDefaultDateRange();
        startDate = defaultDates.startDate;
        endDate = defaultDates.endDate;
    }

    if (new Date(startDate) > new Date(endDate)) {
        // Alert for end date earlier than start date
        displayErrorMessage('Invalid Date Range', 'The end date cannot be earlier than the start date.');
        return; // Stop further execution
    }

    const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    dateRangeDisplay.innerText = `Data Period: ${formattedStartDate} - ${formattedEndDate}`;

    // Add your logic to fetch and display the filtered data here
});


document.addEventListener('DOMContentLoaded', function() {
    const defaultDates = getDefaultDateRange();
    document.getElementById('start-date').value = defaultDates.startDate;
    document.getElementById('end-date').value = defaultDates.endDate;

    const dateRangeDisplay = document.getElementById('date-range-display');
    const formattedStartDate = new Date(defaultDates.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedEndDate = new Date(defaultDates.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    dateRangeDisplay.innerText = `Data Period: ${formattedStartDate} - ${formattedEndDate}`;
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
        colors: ["rgba(255, 0, 0, 0.5)"],
        chart: {
            fontFamily: "Satoshi, sans-serif",
            height: 335,
            type: "area", // change to area to ensure the fill shows properly
            toolbar: {
                show: false,
            },
            width: "100%",
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: "vertical",
                shadeIntensity: 0.2,
                gradientToColors: ["#FF0000"], // end color of the gradient to red
                inverseColors: false,
                opacityFrom: 0.4, // starting opacity of the fill
                opacityTo: 0.2,    // ending opacity of the fill
                stops: [0, 90, 100]
            }
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
            curve: "smooth",
            colors: ["rgba(255, 0, 0, 0.6)"], // Ensure the stroke color matches the series color
            dropShadow: {
                enabled: true,
                top: 0,
                left: 0,
                blur: 50, // increased blur for more prominent shadow
                opacity: 1, // increased opacity for darker shadow
                color: '#FF0000' // Change shadow color to red
            }
        },
        markers: {
            size: 4,
            colors: "#fff",
            
            strokeColors: ["rgba(255, 0, 0, 0.6)"], // Change marker stroke color to red
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
        colors: ["rgba(0, 128, 0, 0.5)"], // Warna garis hijau dengan opacity 50%
        chart: {
            fontFamily: "Satoshi, sans-serif",
            height: 335,
            type: "area", // Mengubah tipe grafik menjadi area
            toolbar: {
                show: false,
            },
            width: "100%",
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: "vertical",
                shadeIntensity: 0.2,
                gradientToColors: ["#008000"], // Warna akhir gradasi hijau
                inverseColors: false,
                opacityFrom: 0.4, // Opasitas awal dari fill
                opacityTo: 0.2,   // Opasitas akhir dari fill
                stops: [0, 90, 100]
            }
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
            curve: "smooth",
            colors: ["rgba(0, 128, 0, 0.6)"], // Warna garis dengan opacity 60%
            dropShadow: {
                enabled: true,
                top: 0,
                left: 0,
                blur: 50, // Blur yang lebih tinggi untuk shadow lebih menonjol
                opacity: 1, // Opasitas yang lebih tinggi untuk shadow lebih gelap
                color: '#008000' // Warna shadow hijau
            }
        },
        markers: {
            size: 4,
            colors: "#fff",
            strokeColors: ["rgba(0, 128, 0, 0.6)"], // Warna stroke marker hijau dengan opacity 60%
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
        divRow.className = "grid grid-cols-7 border-t border-stroke dark:border-strokedark px-4 py-4.5 md:px-6 2xl:px-7.5";

        // Create and append the date column with right border
        const dateDiv = document.createElement('div');
        dateDiv.className = "col-span-1 flex items-center justify-center border-r border-stroke dark:border-strokedark";
        dateDiv.textContent = date;
        divRow.appendChild(dateDiv);

        // Create and append the time slots with right border, except the last one
        times.forEach((time, index) => {
            const timeDiv = document.createElement('div');
            // Add a right border to all columns except the last one
            timeDiv.className = `col-span-1 flex items-center justify-center ${index !== times.length - 1 ? 'border-r' : ''} border-stroke dark:border-strokedark`;
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
                            displayErrorMessage("Data Not Found","No data available for the selected date range.");
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
                    displayErrorMessage("Parsing Error","Error parsing JSON data.");
                }
            } else {
                console.error("XHR request failed with status: ", this.status);
                displayErrorMessage("Data Not Found","Failed to fetch data. Status: " + this.status);
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
                            displayErrorMessage("Data Not Found","No detailed data available for the selected date range.");
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
                    displayErrorMessage("Parsing Error","Error parsing JSON data (detailed).");
                }
            } else {
                console.error("XHR request for detailed data failed with status: ", this.status);
                displayErrorMessage("Data Not Found","Failed to fetch detailed data. Status: " + this.status);
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



let lastTemperature = null;
let alertInterval = null;
function updateStats(data, isSingleDay) {
    if (data.length === 0) return;

    let highestTemp = -Infinity, lowestTemp = Infinity;
    let highestTempDate = "", lowestTempDate = "";

    let highestHumidity = -Infinity, lowestHumidity = Infinity;
    let highestHumidityDate = "", lowestHumidityDate = "";

    let temperatureAlertActive = false; // Flag to track if alert is active

    // Find the latest data row
    let latestRow = null;
    let latestDate = -Infinity;

    data.forEach(row => {
        const temperature = parseFloat(row.temperature || row.avg_temperature);
        const humidity = parseFloat(row.humidity || row.avg_humidity);
        let date;

        if (isSingleDay) {
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

    // Check if the latest temperature exceeds the threshold
    if (latestRow) {
        const latestTemperature = parseFloat(latestRow.temperature || latestRow.avg_temperature);
        temperatureAlertActive = latestTemperature > 30;
    }

    

    // Handle temperature alert
    handleTemperatureAlert(temperatureAlertActive, latestRow, latestDate);
}



let emailSent = false; // Flag to ensure the email is only sent once

function handleTemperatureAlert(isActive, latestRow, latestDate) {
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes

    if (isActive) {
        if (lastAlertTimestamp && (new Date() - lastAlertTimestamp) < thirtyMinutes) {
            return; // Don't show alert if it was shown within the last 30 minutes
        }

        if (userInteracted && audioReady && audio.paused) {
            audio.play();
        }

        if (!Swal.isVisible()) {
            // Extract temperature and date, handling undefined values
            const temperature = latestRow ? latestRow.temperature || latestRow.avg_temperature : null;
            const date = latestDate || new Date();

            console.log("Temperature:", temperature);
            console.log("Date:", date);

            if (!emailSent) {
                // Send email alert once when the alert is displayed
                console.log("Sending alert email with the following data:");
                console.log("Temperature:", temperature);
                console.log("Date:", date);

                sendAlertEmail(latestRow, latestDate);
                emailSent = true; // Set the flag to indicate email has been sent
            }

            Swal.fire({
                title: "Warning!",
                text: `Temperature exceeds 30 degrees. Current temperature: ${temperature}°C recorded at ${date}.`,
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
                emailSent = false; // Reset the email sent flag when alert is closed
            });
        }
    } else {
        audio.pause();
        audio.currentTime = 0;
        if (Swal.isVisible()) {
            Swal.close();
        }
        emailSent = false; // Reset the flag when the alert is not active
    }
}

function sendAlertEmail(latestRow, latestDate) {
    fetch('http://localhost:3000/send-alert-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            temperature: latestRow.temperature || latestRow.avg_temperature,
            date: latestDate,
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to send alert email');
        }
        console.log('Alert email sent successfully');
    })
    .catch(error => {
        console.error('Error sending alert email:', error);
    });
}


function displayErrorMessage(title, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: 'error',
        confirmButtonText: 'Ok'
    });
}

// Replacing the clearErrorMessage function
function clearErrorMessage() {
    // If there's no UI element to clear, you may not need this function.
    // However, if you had UI elements to clear errors, you'd do it here.
    console.log('Error message cleared');
}







// Fetch data and display on initial load
const defaultDateRange = getDefaultDateRange();
fetchDataAndDisplay(defaultDateRange.startDate, defaultDateRange.endDate);
