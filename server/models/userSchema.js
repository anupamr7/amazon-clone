const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secretKey = process.env.KEY; // Make sure 'KEY' is set in your .env file

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("not valid email address")
            }
        }
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        maxlength: 10
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    cpassword: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            }
        }
    ],
    carts: Array,
    savedForLater: [Object],
    // 👇 NEW FIELD FOR DIGITAL LIBRARY
    digitalLibrary: [{ 
        bookId: { type: String, required: true },
        purchaseDate: { type: Date, default: Date.now }
    }],
    // ADDRESS FIELD 
    address: [
        {
            houseno: { type: String, required: true },
            street: { type: String, required: true },
            landmark: { type: String },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true, minlength: 6, maxlength: 6 },
            country: { type: String, default: "India" },
            isDefault: { type: Boolean, default: false }
        }
    ]
});

// Password Hashing
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
        this.cpassword = await bcrypt.hash(this.cpassword, 12);
    }
    next();
});


// Token generate process (FIXED TYPO and added expiration)
userSchema.methods.generateAuthToken = async function () {
    try {
        // Create a token that expires in 1 day
        let token = jwt.sign({ _id: this._id }, secretKey, {
            expiresIn: "1d" 
        });
        
        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        return token;
    } catch (error) {
        console.log("Error generating token:", error);
    }
}

// Add to cart data
userSchema.methods.addcartdata = async function (cart) {
    try {
        this.carts = this.carts.concat(cart);
        await this.save();
        return this.carts
    } catch (error) {
        console.log(error);
    }
}

const USER = new mongoose.model("USER", userSchema);

module.exports = USER;