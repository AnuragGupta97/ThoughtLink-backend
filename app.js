require('dotenv').config();
const express = require('express')
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cookie_parser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
const streamifier = require('streamifier');

app.use(express.json())
app.use(cookie_parser())

const user = require('./model/user')
const post = require('./model/post')
const temp = require('./model/tempStorage')
const cloudinary = require('./config/cloudinary');

const sendOtpEmail = require('./config/sendEmail');

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))


function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

//route hit when user submit signUp page
app.post('/duplicateEmailVerification', async (req, res) => {
    const { name, number, email, password } = req.body;

    const ifEmailValid = await user.findOne({ email });
    if (ifEmailValid) {
        return res.send({ message: "invalid email" })
    }

    const otp = generateOTP();

    const tempData = await temp.create({
        name,
        number,
        email,
        password,
        otp,
    })
    sendOtpEmail(email, otp)
    res.send({ message: "okay" })
})

async function verifyOtp(req, res, next) {
    const { otp, email } = req.body;
    console.log(otp, email)
    const databaseOtp = await temp.findOne({ otp, email })
    if (!databaseOtp) {
        return res.send({ message: 'invalid otp' })
    }
    next();
}

//route hit when user submit otp on Otp.jsx page
app.post('/signup', verifyOtp, async (req, res) => {

    const { otp, email } = req.body;
    const tempUser = await temp.findOne({ email, otp });
    const { name, number, password } = tempUser;

    console.log(tempUser)

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const data = await user.create({
                name,
                number,
                email,
                password: hash,
            })
            console.log(data)
            res.send({ message: "make account" })
        })
    })
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const dbEmail = await user.findOne({ email })
    if (!dbEmail) {
        return res.send({ message: "invalid email" })
    }
    const ifPasswordValid = await bcrypt.compare(password, dbEmail.password)
    if (!ifPasswordValid) {
        return res.send({ message: "invalid password" })
    }
    const token = jwt.sign({ id: dbEmail._id }, process.env.JWT_SECRET)
    res.cookie("project-postCreate", token, {
        httpOnly: true,
        secure: true,        // required on HTTPS
        sameSite: "none"     // required for frontend-backend on different domains
    });

    res.send({ message: "okay" })
})

app.post('/checkAuth', (req, res) => {
    const token = req.cookies['project-postCreate'];
    if (!token) {
        return res.send({ message: "invalid user" });
    }
    res.send({ message: "Valid User" })
})

app.post('/createpost', async (req, res) => {

    //fetch post title and post content from frontend
    const { postTitle, postContent } = req.body;
    const data = await post.create({
        postTitle,
        postContent
    })

    //fetch userId from cookie
    const token = req.cookies['project-postCreate'];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    //save post on user model
    await user.create({
        postTitle,
        postContent
    })

    //find user postId Array
    const postCreateUser = await user.findById(userId);
    const userPostIdArr = postCreateUser.createPostIdArr;

    //save postId in user model inside createPostIdArr 
    userPostIdArr.push(data._id);
    await postCreateUser.save();

    //find other users all posts
    const oneUsersAllPost = await post.find({
        _id: { $in: userPostIdArr }
    })
    const otherUsersPosts = await post.find({
        _id: { $nin: oneUsersAllPost }
    })

    res.send({ message: otherUsersPosts })
})

app.post('/fetchUserPosts', async (req, res) => {
    const token = req.cookies['project-postCreate']
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userData = await user.findById(decoded.id)
    const oneUserPostsIds = userData.createPostIdArr;
    const oneUserPosts = await post.find({
        _id: { $in: oneUserPostsIds }
    })

    const otherUsersPosts = await post.find({
        _id: { $nin: oneUserPosts }
    })

    res.send({
        message: otherUsersPosts,
        userName: userData.name
    })
})

app.post('/oneuserposts', async (req, res) => {
    const token = req.cookies['project-postCreate']
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userData = await user.findById(decoded.id)
    const oneUserPostsIds = userData.createPostIdArr;
    const oneUserPosts = await post.find({
        _id: { $in: oneUserPostsIds }
    })
    res.send({ message: oneUserPosts })
})

app.post('/deletepost', async (req, res) => {
    const token = req.cookies['project-postCreate']
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const { postId } = req.body;

    //delete the post from post model
    await post.findByIdAndDelete(postId);

    //delete the post from creator's createPostIdArr
    const updatedUserData = await user.findByIdAndUpdate(
        decoded.id,
        { $pull: { createPostIdArr: postId } },
        { new: true }
    )
    const oneUserAllPostsId = updatedUserData.createPostIdArr

    const oneUserAllPosts = await post.find({
        _id: { $in: oneUserAllPostsId }
    })

    //remove that post from all users likedPostIdArr
    await user.updateMany(
        { likedPostIdArr: postId },
        { $pull: { likedPostIdArr: postId } }
    )

    res.send({ message: oneUserAllPosts })
})

app.post('/likedpost', async (req, res) => {
    const { likedPostId } = req.body;

    const token = req.cookies["project-postCreate"]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const currentUser = await user.findById(decoded.id)
    const likedPostIdArr = currentUser.likedPostIdArr

    const ifLikedPostValid = await likedPostIdArr.includes(likedPostId)
    if (ifLikedPostValid) {
        return res.send({ message: "this post is already you liked" })
    }

    likedPostIdArr.push(likedPostId);
    await currentUser.save();

    console.log(likedPostIdArr)

    res.send({ message: likedPostIdArr })
})

app.post('/removelikedpost', async (req, res) => {
    const { removeLikedPostId } = req.body;

    const token = req.cookies['project-postCreate']
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const currentUser = await user.findById(decoded.id)
    const likedPostIdArr = currentUser.likedPostIdArr

    const ifRemoveLikedPostIdValid = await likedPostIdArr.includes(removeLikedPostId)

    if (!ifRemoveLikedPostIdValid) {
        return res.send({ message: "this post is not liked" })
    }

    likedPostIdArr.pull(removeLikedPostId)
    await currentUser.save();

    const likedPostArr = await post.find({
        _id: { $in: likedPostIdArr }
    })

    console.log(likedPostArr)

    res.send({ message: likedPostArr })
})

app.post('/fetchlikedpost', async (req, res) => {
    const token = req.cookies['project-postCreate']
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const currentUserId = await user.findById(decoded.id)
    const likedPostIdArr = currentUserId.likedPostIdArr

    console.log(likedPostIdArr)

    const likedPostArr = await post.find({
        _id: { $in: likedPostIdArr }
    })

    console.log(likedPostArr)
    res.send({ message: likedPostArr })
})

app.post('/fetchProfilePhoto', async (req, res) => {
    try {
        const token = req.cookies['project-postCreate'];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await user.findById(decoded.id);

        // Send the photo URL directly (default or uploaded)
        res.send({ imageUrl: currentUser.profilePhotoName });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Something went wrong' });
    }
});

app.post('/uploadPhoto', upload.single('userPhoto'), async (req, res) => {
    try {
        const token = req.cookies['project-postCreate'];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded" });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'profilePhotos',
                public_id: decoded.id,
                overwrite: true,
                transformation: [
                    { width: 300, height: 300, crop: 'fill' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            async (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send({ message: 'Cloudinary error' });
                }

                await user.findByIdAndUpdate(decoded.id, {
                    profilePhotoName: result.secure_url
                });

                res.send({ imageUrl: result.secure_url });
            }
        );

        // 🚀 STREAM BUFFER TO CLOUDINARY (FAST)
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Upload failed' });
    }
});



app.post('/check', (req, res) => {
    const token = req.cookies["project-postCreate"];
    console.log(token);
    res.send({ message: token })
})

app.post('/logout', (req, res) => {
    res.clearCookie('project-postCreate')
    res.send({ message: 'okay' })
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`running on http://localhost:${PORT}`)
})