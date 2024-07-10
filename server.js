const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { createCanvas } = require('canvas');
const puppeteer = require('puppeteer');
const Chart = require('chart.js/auto');  // Import Chart.js

const app = express();
const port = 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_rpi',
    connectTimeout: 60000 // Menambah waktu timeout koneksi ke database
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
            labels: data.map(row => new Date(row.date_stamp).toISOString().split('T')[0]),  // Ubah format date_stamp
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
            labels: data.map(row => new Date(row.date_stamp).toISOString().split('T')[0]),  // Ubah format date_stamp
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
        timeout: 60000 // Menambah waktu timeout puppeteer
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

// async function sendEmailForCurrentMonth() {
//     const now = new Date();
//     const month = now.getMonth() + 1; // Mendapatkan bulan saat ini (1-12)
//     const year = now.getFullYear(); // Mendapatkan tahun saat ini

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
//                     pass: 'yakt dbuj midb bdle'  // Gantilah dengan kata sandi yang sebenarnya
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
    const currentMonth = now.getMonth(); // Mendapatkan bulan saat ini (0-11)
    const currentYear = now.getFullYear(); // Mendapatkan tahun saat ini

    let month = currentMonth;
    let year = currentYear;

    if (currentMonth === 0) {
        // Jika bulan saat ini adalah Januari, bulan sebelumnya adalah Desember tahun lalu
        month = 12;
        year = currentYear - 1;
    } else {
        // Bulan sebelumnya adalah bulan saat ini - 1
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
                    pass: 'yakt dbuj midb bdle'  // Gantilah dengan kata sandi yang sebenarnya
                },
                logger: true,
                debug: true
            });

            let mailOptions = {
                from: 'madeyudaadiwinata@gmail.com',
                to: 'yudamulehensem@gmail.com',
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




cron.schedule('0 8 1 * *', async () => {
    try {
        await sendEmailForPreviousMonth();
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}, {
    timezone: 'Asia/Makassar'  // Asia/Makassar adalah zona waktu yang sesuai dengan WITA
});



// Endpoint untuk testing pengiriman email
app.get('/test-email', async (req, res) => {
    try {
        await sendEmailForPreviousMonth();  // Memanggil fungsi pengiriman email
        res.send('Email sent successfully');
    } catch (error) {
        console.error('Error in test email endpoint:', error);
        res.status(500).send('Failed to send email');
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
