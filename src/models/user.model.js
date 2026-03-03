const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required."],
        trim : true,
        lowercase: true,
        unique:[true, "Email address already exists."],
        match : [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please add a valid email address."]
        },
        name : {
            type : String,
            required : [true, "Name is required."]
        },
        password : {
            type : String,
            required : [true, "Password is required."],
            select : false,
            minlength : [6, "Password must be at least 6 characters long."]
        }
    },{
        timestamps : true
    });

    userSchema.pre('save', async function(next){
        if(!this.isModified("password")){
            return next();
        }

        const hash = await bcrypt.hash(this.password, 10);
        this.password = hash;
        return next();
    });

    userSchema.methods.comparePassword = async function(password){
        return await bcrypt.compare(password, this.password);
    };

    const userModel = mongoose.model("user", userSchema);
    module.exports = userModel;

