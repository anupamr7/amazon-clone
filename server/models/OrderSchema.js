const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER', // Links to your existing User model
        required: true,
    },
    products: [
        {
            // Store details about the item ordered
            productId: { type: String, required: true },
            title: { type: Object, required: true },
            price: { type: Object, required: true },
            quantity: { type: Number, default: 1 },
            url: { type: String }
        }
    ],
    shippingAddress: {
        type: Object,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'card'],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Processing'
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;