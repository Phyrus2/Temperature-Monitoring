
import { 
    
    audioReady,
    emailSent,
   
    
} from './config.js';;

import { state } from './config.js';
const audio = document.getElementById('alert-sound');
audio.loop = true;
audio.load();

function handleTemperatureAlert(isActive, latestRow, latestDate) {
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes

    if (isActive) {
        if (state.lastAlertTimestamp && (new Date() - state.lastAlertTimestamp) < thirtyMinutes) {
            return; // Don't show alert if it was shown within the last 30 minutes
        }

        if (state.userInteracted && audioReady && audio.paused) {
            audio.play();
        }

        if (!Swal.isVisible()) {
            // Extract temperature and date, handling undefined values
            const temperature = latestRow ? latestRow.temperature || latestRow.avg_temperature : null;
            const date = latestDate || new Date();

            console.log("Temperature:", temperature);
            console.log("Date:", date);

            // Format the date as per the new requirements
            const formattedDate = new Date(date).toLocaleString('en-US', {
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            }).replace(/:\d{2}\s/, ' '); // Removes the minutes part.

            if (!emailSent) {
                // Send email alert once when the alert is displayed
                console.log("Sending alert email with the following data:");
                console.log("Temperature:", temperature);
                console.log("Date:", formattedDate);

                sendAlertEmail(latestRow, latestDate);
                state.emailSent = true; // Set the flag to indicate email has been sent
            }

            Swal.fire({
                title: "Warning!",
                html: `
                    <div style="text-align: center;">
                        <p>Temperature exceeds 30 degrees</p>
                        <p>Current temperature: ${temperature}°C</p>
                        <p>Recorded at ${formattedDate}</p>
                    </div>
                `,
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
                state.lastAlertTimestamp = new Date(); // Update the last alert timestamp
                state.emailSent = false; // Reset the email sent flag when alert is closed
            });
        }
    } else {
        state.audio.pause();
        state.audio.currentTime = 0;
        if (Swal.isVisible()) {
            Swal.close();
        }
        state.emailSent = false; // Reset the flag when the alert is not active
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

export {handleTemperatureAlert, sendAlertEmail};