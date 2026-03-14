const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : [true, "Account must be associated with a user."],
        index : true // Indexing for faster queries on user field
    },
    status : {
        type : String,
        enum : {
            values : ["active", "frozen", "closed"],
            message : "Status must be either 'active', 'frozen', or 'closed'.",
        },
        default : "active"
    },
    currency : {
        type : String,
        required : [true, "Currency is required for an account."],
        default : "INR"
    }

}, {timestamps : true});

accountSchema.index({ user : 1 , status : 1 }); // Compound index on user and status for efficient queries

const accountModel = mongoose.model("account", accountSchema);

module.exports = accountModel;