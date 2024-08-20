import { state } from "./config.js";

const audio = document.getElementById("alert-sound");

// Function to show the permission request modal
function showAudioPermissionModal() {
  const modal = document.getElementById("audioPermissionModal");
  modal.classList.remove("hidden");
}

// Function to hide the permission request modal
function hideAudioPermissionModal() {
  const modal = document.getElementById("audioPermissionModal");
  modal.classList.add("hidden");
}

// Function to request autoplay permission and handle interaction
function requestAutoplayPermission() {
  showAudioPermissionModal();

  document.getElementById("allowButton").addEventListener(
    "click",
    () => {
      hideAudioPermissionModal();

      // Unlock audio playback
      audio.loop = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          state.audioReady = true; // Set a flag indicating that audio is ready to be played automatically
          console.log("Audio alerts enabled.");

          // Show success notification
          showNotification(
            "Permission Granted",
            "Audio alerts have been enabled.",
            "#34D399",
            "#34D399"
          );
        })
        .catch((error) => {
          console.error("Audio play failed:", error);
        });
    },
    { once: true }
  );

  document.getElementById("denyButton").addEventListener("click", () => {
    hideAudioPermissionModal();

    // Show error notification
    showNotification(
      "Permission Denied",
      "Audio alerts have been disabled.",
      "#F87171",
      "#F87171",
      "deny"
    );
  });
}

function showNotification(title, message, borderColor, bgColor, type) {
  const notification = document.createElement("div");
  notification.className = `fixed top-3 left-1/2 transform -translate-x-1/2 flex items-center border-l-6 px-7 py-4 shadow-md z-50`;

  notification.style.height = "60px";
  notification.style.width = "500px";
  notification.style.borderColor = borderColor;
  notification.style.backgroundColor = `${bgColor}33`; // Light background color
  notification.style.color = `${borderColor}`; // Text color matches the border
  notification.style.fontWeight = "bold";
  notification.style.display = "flex";
  notification.style.alignItems = "center";
  notification.style.justifyContent = "space-between";
  notification.style.borderRadius = "8px"; // Rounded corners

  // Icon based on the type
  const iconSvg =
    type === "deny"
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="${borderColor}"/>
            <path d="M15 9L9 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 9L15 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      : `<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.2984 0.826822L15.2868 0.811827L15.2741 0.797751C14.9173 0.401867 14.3238 0.400754 13.9657 0.794406L5.91888 9.45376L2.05667 5.2868C1.69856 4.89287 1.10487 4.89389 0.747996 5.28987C0.417335 5.65675 0.417335 6.22337 0.747996 6.59026L4.86742 11.0348C5.14445 11.3405 5.52858 11.5 5.89581 11.5C6.29242 11.5 6.65178 11.3355 6.92401 11.035L15.2162 2.11161C15.5833 1.74452 15.576 1.18615 15.2984 0.826822Z" fill="white" stroke="white"></path>
        </svg>`;

  notification.innerHTML = `
        <div class="mr-3 flex items-center justify-center" style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 8px;">
            ${iconSvg}
        </div>
        <div class="flex-1">
            <h5 class="text-lg font-bold" style="margin: 0; color: ${borderColor};">${title}</h5>
            <p class="text-sm text-body" style="margin: 0; color: ${borderColor}; font-weight: normal;">${message}</p>
        </div>
    `;

  document.body.appendChild(notification);

  // Automatically remove the notification after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function checkAllLocationsForAlerts(startDate, endDate) {
  fetch(`http://localhost:3000/check-alerts?startDate=${startDate}&endDate=${endDate}`)
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data)) {
        const locationsWithHighTemp = data
          .filter(alert => alert.temperature > 30)
          .map(alert => ({
            location: alert.location,
            temperature: alert.temperature,
            date: alert.date
          }));

        if (locationsWithHighTemp.length > 0) {
          handleTemperatureAlert(true, locationsWithHighTemp);
        } else {
          handleTemperatureAlert(false);
        }
      } else {
        console.log(data.message); // No alerts triggered
        handleTemperatureAlert(false);
      }
    })
    .catch(error => console.error("Error checking alerts:", error));
}




let activeAlerts = []; // Keep track of locations currently being alerted

function handleTemperatureAlert(isActive, alerts = []) {
  const thirtyMinutes = 30 * 60 * 1000;

  if (isActive) {
    // Remove locations from activeAlerts where temperature has dropped below the threshold
    activeAlerts = activeAlerts.filter(activeAlert =>
      alerts.some(alert => alert.location === activeAlert.location && alert.temperature > 30)
    );

    const newAlerts = alerts.filter(alert => 
      !activeAlerts.some(activeAlert => activeAlert.location === alert.location) && alert.temperature > 30
    );

    if (newAlerts.length > 0) {
      activeAlerts.push(...newAlerts);
    }

    const locationDetails = activeAlerts.map(alert => `
      <p>${alert.location}: ${alert.temperature}°C at ${new Date(alert.date)
        .toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .replace(/:\d{2}\s/, " ")}</p>
    `).join("");

    if (!state.emailSent) {
      sendAlertEmail(activeAlerts); // Adjust to handle multiple locations
      state.emailSent = true;
    }

    if (Swal.isVisible()) {
      // Update the existing alert with new or removed locations
      Swal.update({
        html: `
          <div style="text-align: center;">
            <p>Temperature Exceeds Threshold at Locations:</p>
            ${locationDetails}
          </div>
        `
      });
    } else if (activeAlerts.length > 0) {
      Swal.fire({
        title: "Warning!",
        html: `
                <div style="text-align: center;">
                    <p>Temperature Exceeds Threshold at Locations:</p>
                    ${locationDetails}
                </div>
            `,
        icon: "warning",
        backdrop: `rgba(255,0,0,0.4) left top no-repeat`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: true,
      }).then(() => {
        audio.pause();
        audio.currentTime = 0;
        state.lastAlertTimestamp = new Date();
        state.emailSent = false;
        activeAlerts = []; // Clear active alerts after confirmation
      });
    }

    if (state.audioReady && audio.paused && activeAlerts.length > 0) {
      audio.play().catch((error) => console.error("Failed to play audio:", error));
    }

  } else {
    // Close the alert if it's visible and no locations are above the threshold
    audio.pause();
    audio.currentTime = 0;
    if (Swal.isVisible()) {
      Swal.close();
    }
    activeAlerts = []; // Clear active alerts if no longer active
    state.emailSent = false;
  }
}





// Function to send alert email
function sendAlertEmail(alertData, date, location) {
  fetch("http://localhost:3000/send-alert-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      temperature: alertData.temperature,
      date: date,
      location: location
    }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to send alert email");
      }
      console.log("Alert email sent successfully");
    })
    .catch(error => {
      console.error("Error sending alert email:", error);
    });
}



// Call this function on page load to ask for autoplay permission
requestAutoplayPermission();

export { handleTemperatureAlert, sendAlertEmail, checkAllLocationsForAlerts };
