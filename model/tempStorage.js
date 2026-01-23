const mongoose = require("mongoose")

const tempSchema = mongoose.Schema({
    name:String,
    number:Number,
    email:String,
    password:String,
    otp:Number,
    createAt:{
        type:Date,
        default:Date.now,
        expires: 300
    }
});

module.exports = mongoose.model('temp',tempSchema)