const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require('body-parser')
const cors = require('cors')

const {deviceManagement,deviceRoute} = require('./routes/devices')

require('dotenv/config');

const PORT = 5000 || process.env.PORT 

const app = express();
const server = app.listen(PORT,()=> {
    console.log(`listening on port ${PORT}...`)
    console.log("waiting for device connection....")
    console.log("making connection to database....")
})
const io = require('socket.io')(server)

// Import Routes
const userRoute = require("./routes/users")
const authRoute = require("./routes/auth")

//MiddleWare
app.use(bodyparser.json())
app.use(cors())
app.use("/users",userRoute)
app.use("/auth",authRoute)
app.use("/devices",deviceRoute)

// Routes
app.get('/', (req, res) => {
    res.send("We are on home!");
});



//Connect to DB
const DB_CONNECTION =  process.env.DB_CONNECTION || 'mongodb://localhost:27017/testing' 
mongoose.connect(DB_CONNECTION, {useNewUrlParser: true, useUnifiedTopology: true},() => console.log("Database connection established"));

//DeviceManagement

deviceManagement(io) //pass io to use in the user-defined function


