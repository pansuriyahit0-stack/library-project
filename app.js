const cookieParser = require('cookie-parser');
const express = require('express');
const session=require("express-session");
const app = express();
app.set("view engine","ejs");
const { log } = require('node:console');
const fs=require("fs");
const mongoose=require("mongoose");
const collegeModel=require("./collegemodel/college");
// let userModel;
const bcrypt= require('bcrypt');
const jwt = require("jsonwebtoken");
const {spawn}=require("child_process");
const { stdin } = require('node:process');
app.use(express.static("public"));
const port = process.env.PORT || 3000;
app.use(express.urlencoded({extended:true}));    // imp
app.use(cookieParser());
app.use(session({
    secret:"hit@2008",
    resave:false,
    saveUninitialized:false
}))
const personSchema=new mongoose.Schema({
    role:String,
    name:String,
    email:String,
    password:String,
    books:[String],
    dueDates:[String],
});
app.get('/register',function(req,res){
    res.render('register',{message:""});
})
app.post('/register',function(req,res){
    const dbName=`library_${req.body.name}`;
    const collegeName=req.body.name;
    const password=req.body.password;

    bcrypt.genSalt(10,function(err,salt){
        bcrypt.hash(password,salt,async function(err,hash){
            if(!(await collegeModel.findOne({dbName}))){
                const collegeDB=await collegeModel.create({
                    collegeName,
                    password:hash,
                    dbName
                });
            }
            else{
                return res.render('register',{message:"Something went wrong"});
            }
        })
    })

    const collegeDb=mongoose.connection.useDb(dbName);
    res.redirect('/login');

})

app.get('/login',function(req,res){
    res.render('login',{message:"Please login to enter"});
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
            // const personSchema=new mongoose.Schema({
            //     role:String,
            //     name:String,
            //     email:String,
            //     password:String,
            //     books:[String],
            //     issueDate:String
            // });
            // const collegeDb = mongoose.connection.useDb(dbName);
            // userModel=collegeDb.model("person",personSchema);
            req.session.college=dbName;
            // const users=await userModel.find();
            return res.redirect('/home');
        }
        else{
            console.log(err);
            return res.render("login",{message:"Something went wrong"});
        }
    });
    
});
app.get('/logout',function(req,res){
    req.session.destroy();
    res.redirect('/login');
})


app.get('/home',async function(req,res){
    if(req.session.college){
        const collegeDb = mongoose.connection.useDb(req.session.college);
        let userModel=collegeDb.model("person",personSchema);
        const users=await userModel.find();
        return res.render('home',{users});
    }
    else res.redirect('/login');
});


app.post('/showdata',function(req,res){
    if(req.session.college){
        let person=JSON.parse(req.body.user);
        console.log(person);
        res.render('showdata',{person:person});
    }
    else{
        res.redirect('/login');
    }
})
// ---------------------------> MAIN FOR STUDENT AND FACULTY  <------------------------------------
app.get('/addstudent',function(req,res){
    if(!req.session.college) return res.redirect('/login');
    res.render('addstudent',{message:""});
})

app.get('/addfaculty',function(req,res){
    if(!req.session.college) return res.redirect('/login');
    res.render('addfaculty',{message:""});
})

app.post('/addstudent',async function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    const collegeDb = mongoose.connection.useDb(req.session.college);
    const userModel = collegeDb.models.person || collegeDb.model("person", personSchema);
    let u=await userModel.findOne({email:req.body.email})
    if(u){
        return res.render('addstudent',{message:"person exist with this same email"});
    }
    let {role,name,email,password}=req.body;
    bcrypt.hash(password,10,async function(err,hash){
        let user = await userModel.create({role,name,email,password:hash,books:[],dueDates:[]});
    });
    res.redirect('/home');
})

app.post('/addfaculty',async function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    const collegeDb = mongoose.connection.useDb(req.session.college);
    const userModel = collegeDb.models.person || collegeDb.model("person", personSchema);
    let u=await userModel.findOne({email:req.body.email});
    if(u){
        return res.render('addfaculty',{message:"person exist with this same email"});
    }
    let {role,name,email,password}=req.body;
    bcrypt.hash(password,10,async function(err,hash){
        let user = await userModel.create({role,name,email,password:hash,books:[],dueDates:[]});
    });
    res.redirect('/home');
})


app.get('/loginstudent',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    res.render('loginstudent',{message:""});
});

app.post('/loginstudent',async function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    const collegeDb = mongoose.connection.useDb(req.session.college);
    const userModel = collegeDb.models.person || collegeDb.model("person", personSchema);
    let {role,email,password} = req.body;
    let user=await userModel.findOne({role,email});
    if(!user){
        res.render("loginstudent",{message:"Something went wrong"});
        return;
    }
    bcrypt.compare(password,user.password,function(err,result){
        if(result){
            req.session.person=user;
            res.render("alertstudent",{message:""});
        }
        else{
            res.render("loginstudent",{message:"Something went wrong"});
        }
    });
});

app.get('/loginfaculty',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    res.render('loginfaculty',{message:""});
});

app.post('/loginfaculty',async function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    const collegeDb = mongoose.connection.useDb(req.session.college);
    const userModel = collegeDb.models.person || collegeDb.model("person", personSchema);
    let {role,email,password} = req.body;
    const user=await userModel.findOne({role,email});
    
    if(!user){
        res.render("loginfaculty",{message:"Something went wrong"});
        return;
    }
    bcrypt.compare(password,user.password,function(err,result){
        if(result){
            req.session.person=user;
            res.render("alertfaculty",{message:""});
        }
        else{
            res.render("loginfaculty",{message:"Something went wrong"});
        }
    });
})

app.get('/logoutperson',function(req,res){
    delete req.session.person;
    res.redirect('/home');
})

// -------------------------> alter student colloction <----------------------------------
app.post('/collectbook_student',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    else if(!req.session.person){
        return res.redirect("/loginstudent");
    }
    const collegeDb = mongoose.connection.useDb(req.session.college);
    const userModel = collegeDb.models.person || collegeDb.model("person", personSchema);
    let name=req.body.name;
    // let result=name.replaceAll(" ","_");
    let result=name;
    const today=new Date();
    // role,nameofbook,student,operation
    const data={
        role:"student",
        bookname:result,
        person:req.session.person,
        operation:"add",
        message:"",
        day:today.getDate(),
        month:today.getMonth()+1,
        year:today.getFullYear()
    }
    // fs.writeFileSync(
    //     "data.json",    
    //     JSON.stringify(data)
    // )
    const cpp=spawn("./logic.exe");
    cpp.stdin.write(JSON.stringify(data)+'\n');
    cpp.stdout.once("data",async function(data){
        let updatedData=JSON.parse(data.toString());
        if(updatedData["message"]===""){
            let newbooks=updatedData["person"]["books"];
            let newdueDates=updatedData["person"]["dueDates"];
            let id=req.session.person._id;
            await userModel.updateOne(
                {_id:req.session.person._id},{books:newbooks,dueDates:newdueDates}
            );
            let newuser=await userModel.findOne({_id:id});
            // req.session.destroy();
            req.session.person=newuser;
        }
        else{
            let message=updatedData.message||"";
            return res.render('alertstudent',{message:message});
        }
        console.log(updatedData);
        res.render('alertstudent',{message:"Book added successfully"});
    });
    cpp.stderr.on("data",function(data){
        console.error("CPP Error:",data.toString());
    });
})

app.post('/returnbook_student',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    else if(!req.session.person){
        return res.redirect("/loginstudent");
    }
    const collegeDb = mongoose.connection.useDb(req.session.college);
    const userModel = collegeDb.models.person || collegeDb.model("person", personSchema);
    let name=req.body.name;
    let result=name;
    // let result=name.replaceAll(" ","_");
    // role,nameofbook,student,operation
    const today=new Date();
    const data={
        role:"student",
        bookname:result,
        person:req.session.person,
        operation:"remove",
        message:"",
        day:today.getDate(),
        month:today.getMonth()+1,
        year:today.getFullYear()
    }
    const cpp=spawn("./logic.exe");
    cpp.stdin.write(JSON.stringify(data)+'\n');
    cpp.stdout.once("data",async function(data){
        let updatedData=JSON.parse(data.toString());
        if(updatedData["message"]===""){
            let newbooks=updatedData["person"]["books"];
            let newdueDates=updatedData["person"]["dueDates"];
            let id=req.session.person._id;
            await userModel.updateOne(
                {_id:req.session.person._id},{books:newbooks,dueDates:newdueDates}
            );
            let newuser=await userModel.findOne({_id:id});
            // req.session.destroy();
            req.session.person=newuser;
        }
        else{
            let message=updatedData.message||"";
            return res.render('alertstudent',{message:message});
        }
        console.log(updatedData);
        res.render('alertstudent',{message:"Book return successfully"});
    });
    cpp.stderr.on("data",function(data){
        console.error("CPP Error:",data.toString());
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
    const collegeDb = mongoose.connection.useDb(req.session.college);
    const userModel = collegeDb.models.person || collegeDb.model("person", personSchema);
    let name=req.body.name;
    let result=name;

    // role,nameofbook,student,operation
    const today=new Date();
    const data={
        role:"faculty",
        bookname:result,
        person:req.session.person,
        operation:"add",
        message:"",
        day:today.getDate(),
        month:today.getMonth()+1,
        year:today.getFullYear()
    }
    const cpp=spawn("./logic.exe");

    cpp.stdin.write(JSON.stringify(data)+'\n');
    cpp.stdout.once("data",async function(data){
        let updatedData=JSON.parse(data.toString());
        if(updatedData["message"]===""){
            let newbooks=updatedData["person"]["books"];
            let newdueDates=updatedData["person"]["dueDates"];
            let id=req.session.person._id;
            await userModel.updateOne(
                {_id:req.session.person._id},{books:newbooks,dueDates:newdueDates}
            );
            let newuser=await userModel.findOne({_id:id});
            // req.session.destroy();
            req.session.person=newuser;
        }
        else{
            let message=updatedData.message||"";
            return res.render('alertfaculty',{message:message});
        }
        console.log(updatedData);
        res.render('alertfaculty',{message:"Book added successfully"});
    });
    cpp.stderr.on("data",function(data){
        console.error("CPP Error:",data.toString());
    });
    
})

app.post('/returnbook_faculty',function(req,res){
    if(!req.session.college){
        return res.redirect("/login");
    }
    else if(!req.session.person){
        return res.redirect("/loginfaculty");
    }
    const collegeDb = mongoose.connection.useDb(req.session.college);
    const userModel = collegeDb.models.person || collegeDb.model("person", personSchema);
    let name=req.body.name;
    // let result=name.replaceAll(" ","_");
    let result=name;
    // role,nameofbook,student,operation
    const today=new Date();
    const data={
        role:"faculty",
        bookname:result,
        person:req.session.person,
        operation:"remove",
        message:"",
        day:today.getDate(),
        month:today.getMonth()+1,
        year:today.getFullYear()
    }
    const cpp=spawn("./logic.exe");
    cpp.stdin.write(JSON.stringify(data)+'\n');
    cpp.stdout.once("data",async function(data){
        let updatedData=JSON.parse(data.toString());
        if(updatedData["message"]===""){
            let newbooks=updatedData["person"]["books"];
            let newdueDates=updatedData["person"]["dueDates"];
            let id=req.session.person._id;
            await userModel.updateOne(
                {_id:req.session.person._id},{books:newbooks,dueDates:newdueDates}
            );
            let newuser=await userModel.findOne({_id:id});
            // req.session.destroy();
            req.session.person=newuser;
        }
        else{
            let message=updatedData.message||"";
            return res.render('alertfaculty',{message:message});
        }
        console.log(updatedData);
        res.render('alertfaculty',{message:"Book return successfully"});
    });
    cpp.stderr.on("data",function(data){
        console.error("CPP Error:",data.toString());
    });
    

});

// const port = process.env.PORT || 3000;

async function startServer() {
    try {
        await mongoose.connect(
            "mongodb://127.0.0.1:27017/mainDB"
        );

        console.log("Connected to local MongoDB");

        app.listen(port, () => {
            console.log(`Server is live and listening on port ${port}`);
        });
    } catch (err) {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    }
}

startServer();