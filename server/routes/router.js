const express = require("express");
const router = new express.Router();
const Products = require("../models/ProductsSchema");
const USER = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const athenticate = require("../middleware/authenticate");
const Order = require("../models/OrderSchema");
const Book = require("../models/BookSchema");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// GET all products
router.get("/getproducts", async (req, res) => {
    try {
        const products = await Products.find();
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error.message);
        res.status(500).json({ message: "Server error while fetching products." });
    }
});

// GET a single product by its ID
router.get("/getproductsone/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Products.findOne({ id: id });
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error("Error fetching single product:", error.message);
        res.status(500).json({ message: "Server error while fetching product." });
    }
});

// --- NEW SEARCH ROUTE ---
router.get("/search/:key", async (req, res) => {
    try {
        // Search by shortTitle or longTitle (case-insensitive)
        const products = await Products.find({
            "$or": [
                { "title.shortTitle": { $regex: req.params.key, $options: 'i' } },
                { "title.longTitle": { $regex: req.params.key, $options: 'i' } }
            ]
        });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});


// POST a new review for a product
router.post("/products/:id/review", athenticate, async (req, res) => {
    const { rating, comment } = req.body;
    const { id } = req.params; 

    if (!rating || !comment) {
        return res.status(400).json({ message: "Rating and comment are required." });
    }

    try {
        const product = await Products.findOne({ id: id });

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const alreadyReviewed = product.reviews.find(
            (r) => r.user.toString() === req.userID.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: "You have already reviewed this product." });
        }

        const review = {
            user: req.userID,
            name: req.rootUser.fname,
            rating: Number(rating),
            comment: comment,
            createdAt: new Date()
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;

        // --- ADDED FOR DIAGNOSTICS ---
        console.log("ATTEMPTING TO SAVE REVIEW FOR:", product.title.shortTitle);
        await product.save();
        console.log("REVIEW SAVED SUCCESSFULLY.");
        // --- END OF DIAGNOSTICS ---

        res.status(201).json({ message: "Review added successfully." });

    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ message: "Server error while submitting review." });
    }
});


/*
================================================================
                        AUTHENTICATION ROUTES
================================================================
*/

router.post("/register", async (req, res) => {
    const { fname, email, mobile, password, cpassword } = req.body;

    if (!fname || !email || !mobile || !password || !cpassword) {
        return res.status(422).json({ error: "Please fill all the data" });
    }

    if (password !== cpassword) {
        return res.status(422).json({ error: "Passwords do not match" });
    }

    try {
        const preuser = await USER.findOne({ email: email });

        if (preuser) {
            return res.status(422).json({ error: "This email is already registered" });
        }

        const finalUser = new USER({ fname, email, mobile, password, cpassword });
        const storedata = await finalUser.save();
        res.status(201).json(storedata);

    } catch (error) {
        console.log("Error during registration: " + error.message);
        if (error.code === 11000) {
             return res.status(422).json({ error: "Email or mobile number already exists." });
        }
        res.status(500).json({ error: "Server error during registration" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please fill all the data" });
    }

    try {
        const user = await USER.findOne({ email: email });

        if (!user) {
            return res.status(400).json({ error: "Invalid details: User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid details: Wrong password" });
        }

        const token = await user.generateAuthToken();

        res.cookie("Amazonweb", token, {
            expires: new Date(Date.now() + 25892000000), 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax' 
        });

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.cpassword;
        delete userResponse.tokens;

        res.status(201).json(userResponse); 

    } catch (error) {
        console.log("Error during login: " + error.message);
        res.status(500).json({ error: "Server error during login" });
    }
});

router.get("/validuser", athenticate, async (req, res) => {
    try {
        const validUserOne = req.rootUser;
        if (!validUserOne) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(validUserOne);
    } catch (error) {
        console.error("Error in /validuser:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/logout", athenticate, async (req, res) => {
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((currElem) => {
            return currElem.token !== req.token
        });

        res.clearCookie("Amazonweb", { path: "/" });
        await req.rootUser.save();
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Error in /logout:", error.message);
        res.status(500).json({ error: "Server error during logout" });
    }
});

/*
================================================================
                    MY ACCOUNT & ADDRESS ROUTES
================================================================
*/

// --- NEW ROUTE FOR ADDING AN ADDRESS ---
router.post("/add-address", athenticate, async (req, res) => {
    try {
        const newAddress = req.body;
        
        // Add a default: false if it's not the first address
        if (req.rootUser.address.length > 0) {
            newAddress.isDefault = false;
        } else {
            newAddress.isDefault = true; // Make first address default
        }

        req.rootUser.address.push(newAddress);
        const updatedUser = await req.rootUser.save();
        
        res.status(201).json(updatedUser);

    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/get-savelater-items", athenticate, async (req, res) => {
    try {
        if (req.rootUser && req.rootUser.savedForLater) {
            res.status(201).json(req.rootUser.savedForLater);
        } else {
            res.status(200).json([]);
        }
    } catch (error) {
        console.error("Error fetching saved items:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.delete("/remove-savelater/:id", athenticate, async (req, res) => {
    try {
        const { id } = req.params;
        req.rootUser.savedForLater = req.rootUser.savedForLater.filter((item) => item.id !== id);
        
        await req.rootUser.save();
        res.status(201).json(req.rootUser.savedForLater);

    } catch (error) {
        console.error("Error removing saved item:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.delete("/remove-address/:addressId", athenticate, async (req, res) => {
    try {
        const { addressId } = req.params;
        req.rootUser.address = req.rootUser.address.filter((addr) => addr._id.toString() !== addressId);
        const updatedUser = await req.rootUser.save();
        res.status(201).json(updatedUser);
    } catch (error) {
        console.error("Error removing address:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.delete("/remove-library-book/:bookId", athenticate, async (req, res) => {
    try {
        const { bookId } = req.params;
        req.rootUser.digitalLibrary = req.rootUser.digitalLibrary.filter((book) => book.bookId !== bookId);
        const updatedUser = await req.rootUser.save();
        res.status(201).json(updatedUser);
    } catch (error) {
        console.error("Error removing library book:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.delete("/delete-account", athenticate, async (req, res) => {
    try {
        await USER.findByIdAndDelete(req.userID);
        res.clearCookie("Amazonweb", { path: "/" });
        res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/*
================================================================
                        CART & ORDER ROUTES
================================================================
*/

router.post("/addcart/:id", athenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Products.findOne({ id: id });

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        await req.rootUser.addcartdata(product);
        await req.rootUser.save();
        res.status(201).json(req.rootUser);

    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// GET all items in the user's cart
router.get("/cartdetails", athenticate, async (req, res) => {
    try {
        res.status(200).json(req.rootUser.carts);
    } catch (error) {
        console.error("Error fetching cart details:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// DELETE an item from the cart
router.delete("/remove/:id", athenticate, async (req, res) => {
    try {
        const { id } = req.params;
        req.rootUser.carts = req.rootUser.carts.filter((item) => item.id !== id);
        await req.rootUser.save();
        res.status(200).json(req.rootUser); 
    } catch (error) {
        console.error("Error removing cart item:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// POST to save for later
router.post("/save-for-later/:id", athenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const productToSave = req.rootUser.carts.find((item) => item.id === id);
        if (!productToSave) {
            return res.status(404).json({ error: "Product not in cart" });
        }

        const alreadySaved = req.rootUser.savedForLater.some((item) => item.id === id);

        if (!alreadySaved) {
            req.rootUser.savedForLater.push(productToSave);
        }

        req.rootUser.carts = req.rootUser.carts.filter((item) => item.id !== id);

        const updatedUser = await req.rootUser.save();
        
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("Error saving for later:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// POST to place a new order
router.post("/place-order", athenticate, async (req, res) => {
    try {
        const { products, totalAmount, shippingAddress, paymentMethod, shippingMethod } = req.body;

        if (!products || !totalAmount || !shippingAddress) {
            return res.status(400).json({ error: "Missing order details" });
        }

        // --- FIXES START HERE ---

        // 1. Fix Product Array: Rename 'id' to 'productId' to match OrderSchema
        const formattedProducts = products.map(item => ({
            productId: item.id, // This was the main schema conflict
            title: item.title,
            price: item.price,
            quantity: item.quantity || 1, // Ensure quantity, default to 1
            url: item.url
        }));

        // 2. Fix Payment Method: Convert from "Card Payment (Stripe)" to "card"
        const formattedPaymentMethod = paymentMethod.includes('Card') ? 'card' : 'cod';

        // --- FIXES END HERE ---

        const newOrder = new Order({
            userId: req.userID,
            products: formattedProducts, // Use the fixed array
            totalAmount: parseFloat(totalAmount),
            shippingAddress: shippingAddress, // This is 'Object' in schema, so it's fine
            paymentMethod: formattedPaymentMethod, // Use the fixed enum
            shippingMethod: shippingMethod, // This will be saved (see new OrderSchema)
            orderDate: new Date()
        });

        const savedOrder = await newOrder.save();
        
        // Clear the user's cart
        req.rootUser.carts = [];
        await req.rootUser.save();
        
        res.status(201).json(savedOrder);
        
    } catch (error) {
        // Send back a more detailed error message to the console
        console.error("Error placing order:", error);
        res.status(500).json({ error: "Server error", message: error.message });
    }
});

// GET all orders for the logged-in user
router.get("/getorders", athenticate, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.userID }).sort({ orderDate: -1 });
        
        if (!orders) {
            return res.status(200).json([]);
        }
        res.status(200).json(orders);

    } catch (error) {
        console.error("Error fetching orders:", error.message);
        res.status(500).json({ error: "Server error while fetching orders." });
    }
});

// POST to create a Stripe payment intent
router.post("/create-payment-intent", athenticate, async (req, res) => {
    try {
        const { amount } = req.body; // Amount is now in rupees (e.g., 6598.00)
        
        // Convert to smallest currency unit (e.g., paise for INR)
        const amountInPaise = Math.round(amount * 100);

        if (amountInPaise < 50) { // Stripe minimum
             return res.status(400).json({ error: "Amount must be at least 50 paise." });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPaise,
            currency: 'inr', 
            payment_method_types: ['card'],
        });
        res.status(200).send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ error: "Server error" });
    }
});


/*
================================================================
                        DIGITAL BOOK ROUTES
================================================================
*/

router.get("/get-digital-books", async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json(books);
    } catch (error) {
        console.error("Error fetching digital books:", error);
        res.status(500).json({ error: "Failed to retrieve digital books" });
    }
});

router.post("/purchase-book/:bookId", athenticate, async (req, res) => {
    try {
        const { bookId } = req.params;
        const user = req.rootUser;

        if (!user) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const book = await Book.findOne({ bookId: bookId });
        if (!book) {
            return res.status(404).json({ message: "Book not found." });
        }

        const alreadyPurchased = user.digitalLibrary.some(item => item.bookId === bookId);
        if (alreadyPurchased) {
            return res.status(200).json({
                message: "Already purchased",
                downloadLink: book.downloadLink
            });
        }

        user.digitalLibrary.push({ bookId: bookId, purchaseDate: new Date() });
        await user.save();
        
        res.status(200).json({
            message: "Purchase successful",
            downloadLink: book.downloadLink
        });

    } catch (error) {
        console.error("Error purchasing book:", error);
        res.status(500).json({ error: "Server error during purchase" });
    }
});

module.exports = router;