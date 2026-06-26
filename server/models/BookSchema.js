const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    bookId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    coverUrl: { type: String, required: true },
    // A placeholder for the actual digital file content
    downloadLink: { type: String, required: true }, 
    description: { type: String },
    genre: { type: String }
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;