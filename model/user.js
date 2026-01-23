const mongoose = require("mongoose")

mongoose.connect(process.env.MONGO_URI)
  .catch((err) => {
    console.log('MongoDB connection error :',err)
  })

const userSchema = mongoose.Schema({
    name:String,
    number:Number,
    email:String,
    password:String,
    profilePhotoName:{
      type:String,
      default:"https://res.cloudinary.com/dondlcr5h/image/upload/v1769089517/Screenshot_2026-01-14_124455_szyidm.png"
    },
    createPostIdArr:[{
      type:mongoose.Schema.ObjectId,
      ref:"post"
    }],
    likedPostIdArr:[{
      type:mongoose.Schema.ObjectId,
      ref:"post",
    }]
})

module.exports = mongoose.model('user',userSchema)