const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { createCanvas } = require('canvas');
const puppeteer = require('puppeteer');
const Chart = require('chart.js/auto');  // Import Chart.js
const cors = require('cors'); // Import cors module

const app = express();
const port = 3000;
app.use(cors());

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

app.get('/fetch-data', (req, res) => {
    const sql = "SELECT temperature, humidity, date_stamp FROM stg_incremental_load_rpi ORDER BY date_stamp";
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send('Error fetching data');
            return;
        }
        res.json(results);
    });
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

async function generateHumidityChart(data) {
    const canvas = createCanvas(1200, 600);
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(row => new Date(row.date_stamp).toISOString().split('T')[0]),  // Format date_stamp
            datasets: [{
                label: 'Humidity (%)',
                data: data.map(row => row.humidity),
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
                    }
                }
            }
        }
    });

    return canvas.toBuffer();
}


async function generateTable(data) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        timeout: 60000 // Increase puppeteer timeout
    });
    const page = await browser.newPage();
    await page.setContent(`
        <table border="1">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Temperature (°C)</th>
                    <th>Humidity (%)</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        <td>${new Date(row.date_stamp).toISOString().split('T')[0]}</td>
                        <td>${row.temperature}</td>
                        <td>${row.humidity}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `);
    const pdfBuffer = await page.pdf();
    await browser.close();
    return pdfBuffer;
}

// Uncomment this function to send email for the current month
// async function sendEmailForCurrentMonth() {
//     const now = new Date();
//     const month = now.getMonth() + 1; // Get current month (1-12)
//     const year = now.getFullYear(); // Get current year

//     const sql = `SELECT temperature, humidity, date_stamp FROM stg_incremental_load_rpi 
//                  WHERE MONTH(date_stamp) = ? AND YEAR(date_stamp) = ? ORDER BY date_stamp`;

//     db.query(sql, [month, year], async (err, results) => {
//         if (err) {
//             console.error('Error fetching data for email:', err);
//             return;
//         }

//         try {
//             const temperatureChartBuffer = await generateTemperatureChart(results);
//             const humidityChartBuffer = await generateHumidityChart(results);
//             const tableBuffer = await generateTable(results);

//             let transporter = nodemailer.createTransport({
//                 service: 'gmail',
//                 auth: {
//                     user: 'madeyudaadiwinata@gmail.com',
//                     pass: 'yakt dbuj midb bdle'  // Replace with actual password
//                 },
//                 logger: true,
//                 debug: true
//             });

//             let mailOptions = {
//                 from: 'madeyudaadiwinata@gmail.com',
//                 to: 'yudamulehensem@gmail.com',
//                 subject: `Monthly Temperature and Humidity Report for ${getMonthName(month)} ${year}`,
//                 text: 'Please find the attached charts and table for the monthly temperature and humidity data.',
//                 attachments: [
//                     {
//                         filename: 'temperature-chart.png',
//                         content: temperatureChartBuffer
//                     },
//                     {
//                         filename: 'humidity-chart.png',
//                         content: humidityChartBuffer
//                     },
//                     {
//                         filename: 'data-table.pdf',
//                         content: tableBuffer
//                     }
//                 ]
//             };

//             transporter.sendMail(mailOptions, (error, info) => {
//                 if (error) {
//                     console.error('Error sending email:', error);
//                     return;
//                 }
//                 console.log('Email sent: ' + info.response);
//             });
//         } catch (error) {
//             console.error('Error generating charts or table:', error);
//         }
//     });
// }

async function sendEmailForPreviousMonth() {
    const now = new Date();
    const currentMonth = now.getMonth(); // Get current month (0-11)
    const currentYear = now.getFullYear(); // Get current year

    let month = currentMonth;
    let year = currentYear;

    if (currentMonth === 0) {
        // If current month is January, previous month is December of last year
        month = 12;
        year = currentYear - 1;
    } else {
        // Previous month is current month - 1
        month = currentMonth;
    }

    const sql = `SELECT temperature, humidity, date_stamp FROM stg_incremental_load_rpi 
                 WHERE MONTH(date_stamp) = ? AND YEAR(date_stamp) = ? ORDER BY date_stamp`;

    db.query(sql, [month, year], async (err, results) => {
        if (err) {
            console.error('Error fetching data for email:', err);
            return;
        }

        try {
            const temperatureChartBuffer = await generateTemperatureChart(results);
            const humidityChartBuffer = await generateHumidityChart(results);
            const tableBuffer = await generateTable(results);

            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'madeyudaadiwinata@gmail.com',
                    pass: 'yakt dbuj midb bdle'  // Replace with actual password
                },
                logger: true,
                debug: true
            });

            let mailOptions = {
                from: 'madeyudaadiwinata@gmail.com',
                to: 'yudamulehensem@gmail.com, adisuarpala.pepito@gmail.com ',
                subject: `Monthly Temperature and Humidity Report for ${getMonthName(month)} ${year}`,
                text: 'Please find the attached charts and table for the monthly temperature and humidity data.',
                attachments: [
                    {
                        filename: 'temperature-chart.png',
                        content: temperatureChartBuffer
                    },
                    {
                        filename: 'humidity-chart.png',
                        content: humidityChartBuffer
                    },
                    {
                        filename: 'data-table.pdf',
                        content: tableBuffer
                    }
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

function getMonthName(month) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];  // month is 1-based index
}

// Schedule email sending for the 1st of every month at 8 AM
cron.schedule('26 10 1 * *', async () => {
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

app.get('/fetch-data', (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const sql = "SELECT temperature, humidity, date_stamp FROM stg_incremental_load_rpi WHERE date_stamp BETWEEN ? AND ? ORDER BY date_stamp";
    db.query(sql, [startDate, endDate], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Failed to fetch data' });
        }
        res.json(results);
    });
});

app.get('/average-data', (req, res) => {
    const query = `
        SELECT 
            date_stamp as date,
            AVG(temperature) as avg_temperature,
            AVG(humidity) as avg_humidity
        FROM 
            stg_incremental_load_rpi
        WHERE 
            time_stamp LIKE '07:00%' OR
            time_stamp LIKE '10:00%' OR
            time_stamp LIKE '13:00%' OR
            time_stamp LIKE '16:00%' OR
            time_stamp LIKE '19:00%' OR
            time_stamp LIKE '22:00%'
        GROUP BY 
            date_stamp;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error retrieving data');
            return;
        }

        // Log hasil query ke console
        console.log('Query results:', results);

        if (results.length === 0) {
            res.status(404).send('No data found for the specified time range');
            return;
        }

        const formattedResults = results.map(row => ({
            date: row.date,
            avg_temperature: parseFloat(row.avg_temperature).toFixed(2),
            avg_humidity: parseFloat(row.avg_humidity).toFixed(2)
        }));

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

        console.log(`Data for date ${date}:`, formattedResults);
        res.json(formattedResults);
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
