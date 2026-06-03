const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://pansuriyahit0_db_user:Hit@2008@cluster0.t2d4lql.mongodb.net/library?retryWrites=true&w=majority&appName=Cluster0")
.then(() => {
    console.log("MongoDB connected");
})
.catch((err) => {
    console.log(err);
});

const collegeSchema = mongoose.Schema({
    collegeName: String,
    password: String,
    dbName: String
});

module.exports = mongoose.model('college', collegeSchema);

