const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema({
    collegeName: String,
    password: String,
    dbName: String
});

module.exports = mongoose.model("college", collegeSchema);