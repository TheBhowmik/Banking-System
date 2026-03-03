const mongoose = require("mongoose");


function connectToDB() {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("Server Connected to MongoDB");
        })
        .catch((err) => {
            console.error("Error connecting to MongoDB:", err);
            process.exit(1); // Exit the process with an error code
        });
}


module.exports = connectToDB;