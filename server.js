const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { createCanvas } = require('canvas');
const puppeteer = require('puppeteer');

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

    // Fill the background with white color
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw axes
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(50, 550);
    ctx.lineTo(1150, 550); // x-axis
    ctx.lineTo(1150, 50); // y-axis
    ctx.stroke();

    // Set font for labels
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';

    // Draw labels
    ctx.fillText('Temperature (°C)', 10, 30);
    ctx.fillText('Date', 1150 - 40, 570);

    // Scale data
    const maxTemp = Math.max(...data.map(d => d.temperature));
    const minTemp = Math.min(...data.map(d => d.temperature));
    const yScale = (temp) => 550 - (temp - minTemp) * 500 / (maxTemp - minTemp);
    const xScale = (index) => 50 + index * (1100 / (data.length - 1));

    // Draw temperature line
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    data.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.temperature);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw temperature points
    data.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.temperature);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw x-axis labels (dates)
    ctx.fillStyle = 'black';
    data.forEach((point, index) => {
        const x = xScale(index);
        if (index % Math.ceil(data.length / 20) === 0) {
            ctx.save();
            ctx.translate(x, 555);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(new Date(point.date_stamp).toISOString().split('T')[0], 0, 0); // Convert date_stamp to string and format as YYYY-MM-DD
            ctx.restore();
        }
    });

    // Draw y-axis labels (temperature)
    for (let i = minTemp; i <= maxTemp; i += (maxTemp - minTemp) / 10) {
        const y = yScale(i);
        ctx.fillText(i.toFixed(1), 10, y);
    }

    return canvas.toBuffer();
}

async function generateHumidityChart(data) {
    const canvas = createCanvas(1200, 600);
    const ctx = canvas.getContext('2d');

    // Fill the background with white color
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw axes
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(50, 550);
    ctx.lineTo(1150, 550); // x-axis
    ctx.lineTo(1150, 50); // y-axis
    ctx.stroke();

    // Set font for labels
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';

    // Draw labels
    ctx.fillText('Humidity (%)', 10, 30);
    ctx.fillText('Date', 1150 - 40, 570);

    // Scale data
    const maxHumidity = Math.max(...data.map(d => d.humidity));
    const minHumidity = Math.min(...data.map(d => d.humidity));
    const yScale = (humidity) => 550 - (humidity - minHumidity) * 500 / (maxHumidity - minHumidity);
    const xScale = (index) => 50 + index * (1100 / (data.length - 1));

    // Draw humidity line
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    data.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.humidity);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw humidity points
    data.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.humidity);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });

    // Draw x-axis labels (dates)
    ctx.fillStyle = 'black';
    data.forEach((point, index) => {
        const x = xScale(index);
        if (index % Math.ceil(data.length / 20) === 0) {
            ctx.save();
            ctx.translate(x, 555);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(new Date(point.date_stamp).toISOString().split('T')[0], 0, 0); // Convert date_stamp to string and format as YYYY-MM-DD
            ctx.restore();
        }
    });

    // Draw y-axis labels (humidity)
    for (let i = minHumidity; i <= maxHumidity; i += (maxHumidity - minHumidity) / 10) {
        const y = yScale(i);
        ctx.fillText(i.toFixed(1), 10, y);
    }

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
                        <td>${row.date_stamp}</td>
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
async function sendEmail() {
    const month = 5; // Mei
    const year = 2024; // Tahun 2024

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
                    pass: 'yakt dbuj midb bdle'
                },
                logger: true,  // Menambah logger
                debug: true    // Menambah debug
            });

            let mailOptions = {
                from: 'madeyudaadiwinata@gmail.com',
                to: 'yudamulehensem@gmail.com',
                subject: `Monthly Temperature and Humidity Report for May ${year}`,
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


app.get('/test-email', async (req, res) => {
    try {
        await sendEmail();
        res.send('Email sent successfully');
    } catch (error) {
        console.error('Error in test email endpoint:', error);
        res.status(500).send('Failed to send email');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
