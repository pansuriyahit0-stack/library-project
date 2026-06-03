const cookieParser = require('cookie-parser');
const express = require('express');
const session=require("express-session");
const app = express();
app.set("view engine","ejs");
const { log } = require('node:console');
const fs=require("fs");
const mongoose=require("mongoose");
const collegeModel=require("./collegemodel/college");
let userModel;
const bcrypt= require('bcrypt');
const jwt = require("jsonwebtoken");
const {exec}=require("child_process");
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));    // imp
app.use(cookieParser());
app.use(session({
    secret:"hit@2008",
    resave:false,
    saveUninitialized:false
}))

app.get('/register',function(req,res){
    res.render('register');
})
app.post('/register',function(req,res){
    const dbName=`library_${req.body.name}`;
    const collegeName=req.body.name;
    const password=req.body.password;

    bcrypt.genSalt(10,function(err,salt){
        bcrypt.hash(password,salt,async function(err,hash){
            const collegeDB=await collegeModel.create({
                collegeName,
                password:hash,
                dbName
            })
        })
    })

    const collegeDb=mongoose.connection.useDb(dbName);
    res.render('login');

})

app.get('/login',function(req,res){
    res.render('login');
})

app.post('/login',async function(req,res){
    const name=req.body.name;
    const dbName=`library_${name}`;
    const pass=req.body.password;
    const college=await collegeModel.findOne({collegeName:name});
    if(!college){
        console.log("Collage not found");
        return res.redirect('/login');
    }
    bcrypt.compare(pass,college.password,function(err,result){
        if(result){
            console.log("login successful");
            const personSchema=new mongoose.Schema({
                role:String,
                name:String,
                email:String,
                password:String,
                books:String
            });
            const collegeDb = mongoose.connection.useDb(dbName);
            userModel=collegeDb.model("person",personSchema);
            req.session.college=dbName;
            return res.redirect('/home');
        }
        else{
            console.log(err);
            return res.redirect("/login");
        }
    });
    
});

app.get('/home',function(req,res){
    if(req.session.college) return res.render('home');
    else res.redirect('/login');
})
// ---------------------------> MAIN FOR STUDENT AND FACULTY  <------------------------------------
app.get('/addstudent',function(req,res){
    if(!req.session.college) return res.redirect('/login');
    res.render('addstudent');
})

app.get('/addfaculty',function(req,res){
    if(!req.session.college) return res.redirect('/login');
    res.render('addfaculty');
})

app.post('/addstudent',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    let {role,name,email,password}=req.body;
    bcrypt.hash(password,10,async function(err,hash){
        let user = await userModel.create({role,name,email,password:hash,books:""});
    });
    res.render('home');
})

app.post('/addfaculty',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    let {role,name,email,password}=req.body;
    bcrypt.hash(password,10,async function(err,hash){
        let user = await userModel.create({role,name,email,password:hash,books:""});
    });
    res.render('home');
})


app.get('/loginstudent',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    res.render('loginstudent');
});

app.post('/loginstudent',async function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    let {role,email,password} = req.body;
    let user=await userModel.findOne({role,email});
    if(!user){
        console.log("student not found");
        return;
    }
    req.session.person=user;
    res.render("alertstudent");
})

app.get('/loginfaculty',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    res.render('loginfaculty');
});

app.post('/loginfaculty',async function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    let {role,email,password} = req.body;
    const user=await userModel.findOne({role,email});
    if(!user){
        console.log("faculty not found");

        return;
    }
    req.session.person=user;
    res.render("alertfaculty");
})



// -------------------------> alter student colloction <----------------------------------
app.post('/collectbook_student',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    else if(!req.session.person){
        return res.redirect("/loginstudent");
    }
    let name=req.body.name;
    let result=name.replaceAll(" ","_");
    // role,nameofbook,student,operation
    const data={
        role:"student",
        bookname:result,
        person:req.session.person,
        operation:"add",
        message:""
    }
    fs.writeFileSync(
        "data.json",    
        JSON.stringify(data)
    )
    exec("g++ logic.cpp -o logic && logic.exe", async () => {
        const fileData = fs.readFileSync("data.json","utf8");
        const updatedData = JSON.parse(fileData);
        if(updatedData["message"]==""){
            let newbooks=updatedData["person"]["books"];
            let id=req.session.person._id;
            await userModel.updateOne(
                {_id:req.session.person._id},{books:newbooks}
            );
            let newuser=await userModel.findOne({_id:id});
            // req.session.destroy();
            req.session.person=newuser;
        }
        console.log(updatedData);
        res.render('alertstudent');

    });
})

app.post('/returnbook_student',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    else if(!req.session.person){
        return res.redirect("/loginstudent");
    }
    let name=req.body.name;
    let result=name.replaceAll(" ","_");
    // role,nameofbook,student,operation
    const data={
        role:"student",
        bookname:result,
        person:req.session.person,
        operation:"remove",
        message:""
    }
    fs.writeFileSync(
        "data.json",
        JSON.stringify(data)
    )
    exec("g++ logic.cpp -o logic && logic.exe", async () => {

        const fileData = fs.readFileSync("data.json","utf8");
        const updatedData = JSON.parse(fileData);
        if(updatedData["message"]==""){
            let newbooks=updatedData["person"]["books"];
            let id=req.session.person._id;
            await userModel.updateOne(
                {_id:req.session.person._id},{books:newbooks}
            );
            let newuser=await userModel.findOne({_id:id});
            // req.session.destroy();
            req.session.person=newuser;
        }
        console.log(updatedData);
        res.render('alertstudent');

    });
    
})


// -------------------------> alter faculty colloction <----------------------------------
app.post('/collectbook_faculty',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    else if(!req.session.person){
        return res.redirect("/loginfaculty");
    }
    let name=req.body.name;
    let result=name.replaceAll(" ","_");
    // role,nameofbook,student,operation
    const data={
        role:"faculty",
        bookname:result,
        person:req.session.person,
        operation:"add",
        message:""
    }
    fs.writeFileSync(
        "data.json",
        JSON.stringify(data)
    )
    exec("g++ logic.cpp -o logic && logic.exe", async () => {

        const fileData = fs.readFileSync("data.json","utf8");
        const updatedData = JSON.parse(fileData);
        if(updatedData["message"]==""){
            let newbooks=updatedData["person"]["books"];
            let id=req.session.person._id;
            await userModel.updateOne(
                {_id:req.session.person._id},{books:newbooks}
            );
            let newuser=await userModel.findOne({_id:id});
            // req.session.destroy();
            req.session.person=newuser;
        }
        console.log(updatedData);
        res.render('alertfaculty');

    });
    
})

app.post('/returnbook_faculty',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    else if(!req.session.person){
        return res.redirect("/loginfaculty");
    }
    let name=req.body.name;
    let result=name.replaceAll(" ","_");
    // role,nameofbook,student,operation
    const data={
        role:"faculty",
        bookname:result,
        person:req.session.person,
        operation:"remove",
        message:""
    }
    fs.writeFileSync(
        "data.json",
        JSON.stringify(data)
    )

    exec("g++ logic.cpp -o logic && logic.exe", async () => {

        const updatedData = JSON.parse(
            fs.readFileSync("data.json", "utf8")
        );
        if(updatedData["message"]==""){
            let newbooks=updatedData["person"]["books"];
            let id=req.session.person._id;
            await userModel.updateOne(
                {_id:req.session.person._id},{books:newbooks}
            );
            let newuser=await userModel.findOne({_id:id});
            // req.session.destroy();
            req.session.person=newuser;
        }
        console.log(updatedData);
        res.render('alertfaculty'); 

    });
    

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
    console.log("Server running");
});