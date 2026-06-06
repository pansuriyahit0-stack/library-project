const mongoose = require("mongoose");

mongoose.connect("mongodb://pansuriyahit0:Hit8485955822@ac-yeeroki-shard-00-00.0ru7mns.mongodb.net:27017,ac-yeeroki-shard-00-01.0ru7mns.mongodb.net:27017,ac-yeeroki-shard-00-02.0ru7mns.mongodb.net:27017/mainDB?ssl=true&replicaSet=atlas-oidhcm-shard-0&authSource=admin&appName=Cluster0")
.then(() => console.log("Connected"))
.catch(err => console.log(err));





// const collegeSchema=new mongoose.Schema({
//     collegeName:String,
//     password:String,
//     dbName:String
// })
// .catch((err) => {
//     console.log(err);
// });

const collegeSchema = mongoose.Schema({
    collegeName: String,
    password: String,
    dbName: String
});

module.exports = mongoose.model('college', collegeSchema);

module.exports=mongoose.model('user',collegeSchema);



