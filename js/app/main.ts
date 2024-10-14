const moment = require('moment');

// Function to get user input from the command line
function getUserInput(prompt) {
    return new Promise((resolve) => {
        process.stdout.write(prompt);
        process.stdin.on('data', (data) => resolve(data.toString().trim()));
    });
}

// Main function to run the program
async function main() {
    const inputDate = await getUserInput('Please enter a date (YYYY-MM-DD): ');

    // Parse the user input date
    const userDate = moment(inputDate, 'YYYY-MM-DD');

    // Check if the date is valid
    if (userDate.isValid()) {
        // Format the date
        const formattedDate = userDate.format('MMMM Do YYYY, h:mm:ss a');
        console.log('Formatted Date:', formattedDate);
    } else {
        console.log('Invalid date format. Please enter a date in YYYY-MM-DD format.');
    }

    // Close the input stream
    process.stdin.end();
}

// Run the main function
main();
