const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { createCanvas } = require('canvas');
const puppeteer = require('puppeteer');
const Chart = require('chart.js/auto');  // Import Chart.js
const cors = require('cors'); // Import cors module
const http = require('http'); // Add this line
const socketIo = require('socket.io'); // Add this line
const { Console } = require('console');

const app = express();
const port = 3000;
app.use(cors());
const server = http.createServer(app); // Modify this line
const io = socketIo(server); // Add this 
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_rpi',
    connectTimeout: 60000 // Increase database connection timeout
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Database connected!');
});



async function generateTemperatureChart(data) {
    const canvas = createCanvas(1200, 600);
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(row => new Date(row.date_stamp).toISOString().split('T')[0]),  // Format date_stamp
            datasets: [{
                label: 'Temperature (°C)',
                data: data.map(row => row.temperature),
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
                    display: true,
                    title: {
                        display: true,
                        text: 'Date',
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

    return canvas.toBuffer();
}




let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'madeyudaadiwinata@gmail.com',
        pass: 'yakt dbuj midb bdle'  // Replace with actual password
    },
    logger: true,
    debug: true
});


async function generateHumidityChart(humidityData, labelsData) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const floatHumidityData = humidityData.map(value => parseFloat(value));
    const stringLabels = labelsData.map(date => new Date(date).toISOString());

    console.log('Formatted Humidity Data:', floatHumidityData);
    console.log('Formatted Labels Data:', stringLabels);

    await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Humidity Chart</title>
        </head>
        <body>
            <div id="humidityChart" style="height: 400px;"></div>
        </body>
        </html>
    `);

    await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/apexcharts' });

    await page.evaluate((data, labels) => {
        console.log('Humidity Data (in browser):', JSON.stringify(data));
        console.log('Labels Data (in browser):', JSON.stringify(labels));

        const options = {
            series: [{
                name: "Humidity",
                data: data,
            }],
            chart: {
                type: "line",
                height: 400,
                animations: {
                    enabled: false, // Disable animations for debugging
                },
                events: {
                    mounted: function(chartContext, config) {
                        console.log('Chart Mounted:', config);
                    }
                }
            },
            xaxis: {
                type: 'datetime',
                categories: labels,
                labels: {
                    format: 'dd MMM'
                }
            },
            stroke: {
                curve: 'smooth',
                width: 2,
                colors: ["#008000"] // Green color for line
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.6,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
            markers: {
                size: 4,
                colors: "#fff",
                strokeColors: ["#008000"],
                strokeWidth: 2,
                hover: {
                    size: 7
                }
            },
            dataLabels: {
                enabled: false
            },
            tooltip: {
                x: {
                    format: 'dd MMM yyyy'
                }
            }
        };

        try {
            const chart = new ApexCharts(document.querySelector("#humidityChart"), options);
            chart.render().then(() => console.log('Chart rendered')).catch(error => console.error('Error rendering chart:', error));
        } catch (error) {
            console.error('Error initializing chart:', error);
        }
    }, floatHumidityData, stringLabels);

    await page.waitForSelector('#humidityChart svg');

    const chartBuffer = await page.screenshot({ type: 'png' });
    await browser.close();
    return chartBuffer;
}



async function sendEmailForPreviousMonth() {
    const now = new Date();
    const currentMonth = now.getMonth(); // Get current month (0-11)
    const currentYear = now.getFullYear(); // Get current year
    let previousMonth;
    let year;

    if (currentMonth === 0) {
        // If current month is January, previous month is December of last year
        previousMonth = 12;
        year = currentYear - 1;
    } else {
        // Previous month is current month - 1
        previousMonth = currentMonth;
        year = currentYear;
    }

    const sql = `
    SELECT 
        DATE(date_stamp) as date,
        AVG(temperature) as avg_temperature,
        AVG(humidity) as avg_humidity
    FROM 
        stg_incremental_load_rpi
    WHERE 
        (HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22))
        AND MONTH(date_stamp) = ? AND YEAR(date_stamp) = ?
    GROUP BY 
        DATE(date_stamp);
    `;

    db.query(sql, [previousMonth, year], async (err, results) => {
        if (err) {
            console.error('Error fetching data for email:', err);
            return;
        }
        const formattedResults = results.map(row => ({
            date: row.date,
            avg_temperature: parseFloat(row.avg_temperature).toFixed(2),
            avg_humidity: parseFloat(row.avg_humidity).toFixed(2)
        }));

        console.log('Formatted Results:', formattedResults);

        try {
            const humidityData = formattedResults.map(row => row.avg_humidity);
            const labels = formattedResults.map(row => row.date);

            console.log('Humidity Data:', humidityData);
            console.log('Labels:', labels);

            const humidityChartBuffer = await generateHumidityChart(humidityData, labels);

            let mailOptions = {
                from: 'madeyudaadiwinata@gmail.com',
                to: 'yudamulehensem@gmail.com',
                subject: `Monthly Temperature and Humidity Report for ${getMonthName(previousMonth)} ${year}`,
                text: 'Please find the attached charts and table for the monthly temperature and humidity data.',
                attachments: [
                    {
                        filename: 'humidity-chart.png',
                        content: humidityChartBuffer
                    },
                ]
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return;
                }
                console.log('Email sent: ' + info.response);
            });
        } catch (error) {
            console.error('Error generating charts or table:', error);
        }
    });
}



function getMonthName(monthNumber) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[monthNumber - 1];
}

// Schedule email sending for the 1st of every month at 8 AM
cron.schedule('26 10 1 1 *', async () => {
    try {
        await sendEmailForPreviousMonth();
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}, {
    timezone: 'Asia/Makassar'  // Adjust to WITA timezone
});

// Endpoint for testing email sending
app.get('/test-email', async (req, res) => {
    try {
        await sendEmailForPreviousMonth();  // Call email sending function
        
        res.send('Email sent successfully');
    } catch (error) {
        console.error('Error in test email endpoint:', error);
        res.status(500).send('Failed to send email');
    }
});




io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const notifyClients = (data) => {
    io.emit('data-update', data);
};

app.get('/average-data', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const query = `
        SELECT 
            date_stamp as date,
            AVG(temperature) as avg_temperature,
            AVG(humidity) as avg_humidity
        FROM 
            stg_incremental_load_rpi
        WHERE 
            (HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22))
            AND date_stamp BETWEEN ? AND ?
        GROUP BY 
            date_stamp;
    `;

    db.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error retrieving data');
            return;
        }

        if (results.length === 0) {
            res.status(404).send('No data found for the specified time range');
            return;
        }

        const formattedResults = results.map(row => ({
            date: row.date,
            avg_temperature: parseFloat(row.avg_temperature).toFixed(2),
            avg_humidity: parseFloat(row.avg_humidity).toFixed(2)
        }));


        
        notifyClients(formattedResults);
        res.json(formattedResults);
    });
});

app.get('/detailed-data', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // SQL query to fetch data based on the hour
    const query = `
        SELECT 
            date_stamp as date,
            time_stamp as time,
            temperature,
            humidity
        FROM 
            stg_incremental_load_rpi
        WHERE 
            (HOUR(time_stamp) IN (6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22))
            AND date_stamp BETWEEN ? AND ?
        ORDER BY 
            date_stamp, time_stamp;
    `;

    db.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Error retrieving data');
        }

        if (results.length === 0) {
            return res.status(404).send('No data found for the specified time range');
        }

        // Format results
        const formattedResults = results.map(row => ({
            date: row.date,
            time: row.time,
            temperature: parseFloat(row.temperature).toFixed(2),
            humidity: parseFloat(row.humidity).toFixed(2)
        }));

        // Notify clients (e.g., via Socket.io or other means)
        notifyClients(formattedResults);

        // Send response
        res.json(formattedResults);
    });
});




app.get('/data-by-date', (req, res) => {
    const { date } = req.query;
    if (!date) {
        res.status(400).send('Date parameter is required');
        return;
    }

    const query = `
        SELECT 
            time_stamp,
            temperature,
            humidity
        FROM 
            stg_incremental_load_rpi
        WHERE 
            date_stamp = ?
        ORDER BY 
            time_stamp
    `;

    db.query(query, [date], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error retrieving data');
            return;
        }

        if (results.length === 0) {
            res.status(404).send('No data found for the specified date');
            return;
        }

        const formattedResults = results.map(row => ({
            time_stamp: row.time_stamp,
            temperature: parseFloat(row.temperature).toFixed(2),
            humidity: parseFloat(row.humidity).toFixed(2)
        }));

        notifyClients(formattedResults);
        res.json(formattedResults);
    });
});


app.post('/send-alert-email', (req, res) => {
    const { temperature, date } = req.body;

    const mailOptions = {
        from: 'Temperature Monitoring',
        to: 'yudamulehensem@gmail.com',
        subject: 'Temperature Alert',
        text: `Alert! The latest temperature is ${temperature}°C recorded at ${date}.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Failed to send email');
        }
        console.log('Email sent:', info.response);
        res.send('Email sent successfully');
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
