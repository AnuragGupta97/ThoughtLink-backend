const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
    postTitle:"String",
    postContent:"String",
})

module.exports = mongoose.model('post',postSchema)