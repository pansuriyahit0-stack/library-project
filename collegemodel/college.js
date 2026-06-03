const mongoose=require("mongoose");

mongoose.connect("mongodb://localhost:27017/mainDB");

const collegeSchema=mongoose.Schema({
    collegeName:String,
    password:String,
    dbName:String
})



module.exports=mongoose.model('user',collegeSchema);




/*
const userSchema=mongoose.Schema({
    role:String,
    name:String,
    email:String,
    password:String,
    books:String
})
*/