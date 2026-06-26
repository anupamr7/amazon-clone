const Products = require("./models/ProductsSchema");
const Productsdata = require("./constant/Productsdata");
const Book = require("./models/BookSchema");
const bookData = require("./constant/bookData");

const DefaultData = async () => {
    try {
        // --- FIX FOR PRODUCTS ---
        // 1. Check if any products already exist
        const productCount = await Products.countDocuments();

        // 2. If no products exist, add them
        if (productCount === 0) {
            await Products.deleteMany({}); // Ensure it's clean (good practice)
            const storeData = await Products.insertMany(Productsdata);
            console.log("Products data provided.");
        } else {
            console.log("Products data already exists. Skipping insertion.");
        }

        // --- FIX FOR BOOKS ---
        // 1. Check if any books already exist
        const bookCount = await Book.countDocuments();

        // 2. If no books exist, add them
        if (bookCount === 0) {
            await Book.deleteMany({}); // Ensure it's clean
            const storeBookData = await Book.insertMany(bookData);
            console.log("Digital Book data provided.");
        } else {
            console.log("Digital Book data already exists. Skipping insertion.");
        }

    } catch (error) {
        console.log("Error during default data insertion: " + error.message);
    }
};

module.exports = DefaultData;