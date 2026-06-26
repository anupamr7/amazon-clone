const mongoose = require("mongoose");

// Get the database string from your .env file
const DB = process.env.DATABASE;

// --- THIS IS THE CRITICAL TEST ---
console.log("------------------------------------------");
console.log("ATTEMPTING TO CONNECT TO DATABASE:", DB);
console.log("------------------------------------------");

// Check if the DB variable is even loaded
if (!DB) {
    console.error("ERROR: DATABASE connection string is not defined!");
    console.error("Make sure you have a .env file with a DATABASE=... variable.");
    process.exit(1); // Stop the server
}

// Connect to the database
mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("MongoDB connection successful.");
}).catch((error) => {
    console.error("MongoDB connection FAILED:", error.message);
});