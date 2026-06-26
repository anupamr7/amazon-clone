const mongoose = require("mongoose");

// We define a schema for a single review first
const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'USER' // This links the review to a user
    },
    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    comment: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps to each review
});

const productsSchema = new mongoose.Schema({
    id: String,
    url: String,
    detailUrl: String,
    title: Object,
    price: Object,
    description: String,
    discount: String,
    tagline: String,
    // --- NEW FIELDS ---
    reviews: [reviewSchema], // An array of review objects
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    numReviews: {
        type: Number,
        required: true,
        default: 0
    }
});

const Products = new mongoose.model("products", productsSchema);

module.exports = Products;