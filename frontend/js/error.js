
import { 
    errorDisplayed
    
} from './config.js';


function displayErrorMessage(title, message, callback) {
    if (!errorDisplayed) { 
        Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonText: 'Ok'
        }).then(() => {
            errorDisplayed = false; // Reset the flag when the alert is closed
            if (callback) {
                callback(); // Execute the callback function if provided
            }
        });
        errorDisplayed = true; // Set the flag to prevent further alerts
    }
}

function clearErrorMessage() {
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement) {
        errorMessageElement.textContent = '';
        errorMessageElement.style.display = 'none';
    }
}

export {displayErrorMessage, clearErrorMessage};