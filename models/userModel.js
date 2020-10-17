const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Please tell us your name!']
    },
    email: { 
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [ validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE!!
            validator: function(el) {
                return el === this.password; // abc === abc
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}); 

userSchema.pre('save', async function(next) { // between getting the data and saving it to database that is how pre save works
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12); // encrypting password

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function(next) { // runs before saving document 
    if (!this.isModified('password') || this.isNew) return next();
    // isModified - returns true if this document(here password) was modified, else false
    // if password is modified or its new then moves to next middleware
    this.passwordChangedAt = Date.now() - 1000; // putting passwordChangedAt 1 second in the past to ensure that token is created after password has been changed
    next();
});

userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({ active: { $ne: false } }); // to display output for which active is not false
    next();
});

userSchema.methods.correctPassword = async function( // instance method is a method available on all documents of certain collection
    candidatePassword, 
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword); // returns true if both are matched else returns false
}; // userPassword is hashed password and candidatePassword is used passes in body

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) { // JWTTimestamp - timestamp which says when the token has been issued
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }

    // FALSE means password has not changed
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex'); // creating random string of 32 characters using crypto model, converted to hexadecimal

    this.passwordResetToken = crypto
        .createHash('sha256') // sha256 is an alogrithm
        .update(resetToken) // encrypt the reset token using crypto and convert to hexadecimal
        .digest('hex');

    console.log({ resetToken }, this.passwordResetToken);
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //password expires in 10 mins,we need in millisecond so multiply by 60 secs and 1000 milliseconds

    return resetToken; // return reset token which is not encrypted
};

const User = mongoose.model('User', userSchema);

module.exports = User;