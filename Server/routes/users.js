const express = require('express')
const app = express()
const axio = require('axios')
const User = require("../models/user")
const Credential = require("../models/credential")
const _Class = require("../models/class")
const router = express.Router();
const uID = require("../JS/UniqueCode")



//Routes
router.get("/", async (req , res) => {
    try{
        const user = await User.find();
        res.json(user)
    }catch(err){
        res.json({
            message : "Error Occured : " + err
        })       
    }
})

//Get all classes that student participated
router.post("/class", async (req , res) => {
    try{
        const user = await User.findOne({email : req.body.email});
        const classCodes = user.classParticipated;
        const classOwned = user.classOwnerShip;
        var classParticipated = []
        var classOwnerShip = []
        // Loop through class code and retrieve each class's data from database with the help of class code
        for (i = 0; i < classCodes.length ; i++){
            var nClass = await _Class.findOne({code : classCodes[i]})
            //Seperate classOwned and ClassJoined
            if (classOwned.includes(classCodes[i])){
                classOwnerShip.push(nClass) 
            }else{
                classParticipated.push(nClass)
            }
        }

        res.json({classOwnerShip , classParticipated})
        
    }catch(err){
        res.json({
            message : "Error Occured : " + err
        })       
    }
})

//Get data for creating class
router.post("/createclass", async (req, res) => {
    // Require 2 parameters {classroomName, email}
    try{
        const code = uID(6) // Create a unique keyCode for classroom **Might be duplicated**
        const _class = new _Class({
            classroomName: req.body.classroomName,
            code: code,
            currentlyStreaming: "",
            members: [],
            owner: req.body.email
        })
        // Update user classOwnerShip and classParticipated
        const updateUser = await User.updateOne({email:req.body.email}, {$addToSet: { classOwnerShip: code , classParticipated: code} })
        if (updateUser){
            const _savedClass = await _class.save()
            res.json(_savedClass)
        }
    }catch(err /* Catching duplicate primary key error*/ ){
        if (err.code == 11000 /*11000 is Duplicate key's error code*/){
            //Simulate a the same post to forge a new unique code
            axio.post("http://localhost:3000/users/createclass", req.body)
        }
        res.json({
            message : err.code
        })
    }
})

router.post("/joinclass", async (req, res) => {
    //Require 2 data  {email, code}
   try{
        const _class = await _Class.findOne({code : req.body.code})
        //Check if the class is actually exist
        if (_class){
            // update classParticipated in user's object 
            const updatedUser = await User.updateOne({email:req.body.email}, {$addToSet: { classParticipated: req.body.code }})
            // Add new member to the class object
            await _Class.updateOne({code : req.body.code}, {$addToSet: { members: req.body.email }})
            // Check if one array has been added or not, if not, class is already joined!
            if (updatedUser.nModified == 0){
                res.json({message : "Already join the class!"})
            }else{
                _class.members.push(req.body.email)
                // Send back the class
                res.json(_class)
            }
        }else{
            res.json({
                message : "Class not found!"
            })
        }
   }catch(err){
        res.json({
            message : "Error nob : " + err
        })
   }
})

router.post("/deleteClass",async (req,res)=>{
    try{
        const {code} = req.body //pull class code from request body
        const _class = await _Class.findOne({code}) // get the desired class to delete
        await User.updateOne({email:_class.owner},{$pull:{classOwnerShip:{$in:[code]}}}) //remove ownership
        await User.updateMany({email:{$in:_class.members}},{$pull:{classParticipated:{$in:[code]}}},{multi:true}) //remove current memebers
        await _Class.deleteOne({code}) //delete class
        res.send("success")
    }catch(err){
        res.send("error")   
    }
})

//Get Data for sign up
router.post("/signUp", async (req , res ) => {
    try{
        const user = new User({
            classOwnerShip : [],
            classParticipated : [],
            email : req.body.email,
            name : req.body.name
        });
        const credential = new Credential({
            email : req.body.email,
            pwd : req.body.pwd
        })
        console.log(user)        
        const savedUser = await user.save();
        const savedCredential = await credential.save();
        res.json(savedUser);
    }catch(err){

    }

})

//Get specific user (Obsolete)
router.get("/:postId", async (req , res) => {
    try{
        console.log(req.params.postId)
        const user = await User.findOne({email:req.params.postId});
        res.json(user)
    }catch(err){
        res.json({
            message : "Error Occured : " + err
        })
    }

})

module.exports = router;