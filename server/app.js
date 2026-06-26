require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("./db/conn");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const router = require("./routes/router");

const Products = require("./models/ProductsSchema");
const DefaultData = require("./defaultdata");

// Configure CORS to allow credentials from your frontend's origin
// This MUST come before you use the router
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(router);

const port = process.env.PORT || 9000;

// FOR PRODUCTION ONLY: Serve the client's build folder
if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"));
}

app.listen(port, () => {
    console.log(`server is running on port number ${port}`);
});

DefaultData();