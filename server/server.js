require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const signupModal = require("./models/Userinfo");
const { checkExistingUser, generatePasswordHash } = require("./middlewares/utility");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const cors = require("cors")
const app = express();
const unProtectedRoutes = ["/login", "/signup"];

// mongoose.connect("mongodb+srv://10xacademy:10xacademy@cluster0.kstzf.mongodb.net/contactsmanager?retryWrites=true&w=majority", ()=>{
//     console.log("Connected to DB")
// },(err)=>{
//     console.log(err);
// });


//connect to database
mongoose.connect("mongodb://localhost/todo", () => {
    console.log("Successfully connected to db");
}, (err) => {
    console.log(err)
});


//connection to port
app.listen(5000, (err) => {
    if (err) {
        console.log(err)
    }
    else {
        console.log("Server Started")
    }
})


//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use((req, res, next) => {
    if (unProtectedRoutes.includes(req.url)) {
        next();
    } else {
        if (req.headers.authorization) {
            jwt.verify(req.headers.authorization, process.env.SECRET_KEY,(err,username)=>{
                if(err){
                    return res.sendStatus(403)
                }
                req.username=username;
                next();
            })    
        } else {
            res.send("Authorization required");
        }
    }
});


app.post('/signup', async (req, res) => {
    if (await checkExistingUser(req.body.username)) {
        res.status(400).send("Username exist. Please try with different username");
    } else {
        generatePasswordHash(req.body.password).then((passwordHash) => {
            signupModal.create({
                username: req.body.username,
                password: passwordHash
            }).then(() => {
                res.status(200).send(`${req.body.username} added successfully`);
            }).catch((err) => {
                res.status(400).send(err.message)
            })
        });
    }

})
app.post('/login', (req, res) => {
    signupModal.find({ username: req.body.username }).then((userData) => {
        if (userData.length) {
            bcrypt.compare(req.body.password, userData[0].password).then((val) => {
                if (val) {
                    const authToken = jwt.sign(userData[0].username, process.env.SECRET_KEY);
                    res.status(200).send({ authToken });                 
                } else {
                    res.status(400).send("Invalid Password");
                }
            })
        } else {
            res.status(400).send("Unauthorized user");
        }
    })
})