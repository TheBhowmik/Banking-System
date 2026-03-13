const userModel = require("../models/user.model");
const jwt=require("jsonwebtoken");
//user register controller
//POST/api/auth/register
async function userRegisterController(req, res) {
   const { name, email, password } = req.body;

   const ifExists = await userModel.findOne({ 
    email : email
})

    if(ifExists) {  
        return res.status(422).json({
            success : false,
            message : "User already exists with this email"
        })
    }

    const user = await userModel.create({
        email,password,name
    })

    const token = jwt.sign({userId : user._id}, process.env.JWT_SECRET, {expiresIn : "1d"})

    res.cookie("token", token)

    res.status(201).json({
        user : {
            _id : user._id,
            email : user.email,
            name : user.name
        },
        token
    })
}

async function userLoginController(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ //what is userModel - it is the user model that we have created in the models folder, it is used to interact with the users collection in the database
        email : email                     //we are finding the user with the email that is provided in the request body 
    }).select("+password") //we are selecting the password field because it is not selected by default in the user model, we need to select it to compare the password that is provided in the request body with the password that is stored in the database

    if(!user) {
        return res.status(404).json({
            success : false,
            message : "User not found"
        })
    }

    const isMatch = await user.comparePassword(password) //we are comparing the password that is provided in the request body with the password that is stored in the database, we are using the comparePassword method that we have created in the user model, it returns true if the passwords match and false if they don't match

    if(!isMatch) {
        return res.status(401).json({
            success : false,
            message : "Invalid credentials"
        })
    }
// Generate JWT token to authenticate the user for future requests
    const token = jwt.sign({userId : user._id}, process.env.JWT_SECRET, {expiresIn : "1d"}) //why 1 day because we want the user to stay logged in for 1 day, after that they will have to login again

    res.cookie("token", token) //we are setting the token in the cookie so that we can use it to authenticate the user in future requests, we can also set the token in the local storage or session storage but cookies are more secure than local storage and session storage because they are httpOnly and they are not accessible by JavaScript

    res.status(200).json({
        user : {
            _id : user._id, //what is user - it is the user that we have found in the database with the email that is provided in the request body, it contains all the information about the user that is stored in the database, we are sending only the _id, email and name of the user in the response, we are not sending the password because it is sensitive information and we don't want to expose it in the response
            email : user.email,
            name : user.name
        },
        token //
    })
}

module.exports = {
    userRegisterController,
    userLoginController
}