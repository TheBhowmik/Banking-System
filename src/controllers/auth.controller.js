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

    const token = jwt.sign({userId : user._id}, process.env.JWT_SECRET_KEY, {expiresIn : "1d"})

    res.cookies("token", token)

    res.status(201).json({
        user : {
            _id : user._id,
            email : user.email,
            name : user.name
        },
        token
    })
}

module.expoorts = {
    userRegisterController
}