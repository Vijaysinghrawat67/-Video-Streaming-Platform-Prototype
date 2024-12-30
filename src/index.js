//require('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import {app} from "./app.js"

import ConnectDB from "./db/index.js";

dotenv.config({
    path: './.env'
})


ConnectDB()
.then( () => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running at PORT : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("mongo DB connection failed !!!", err);
})



/*     FIRST APPROACH TO CONNECT DATABASE
import express from "express";
const app = express();
( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR :", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`app is listning on port : ${process.env.PORT}`);
        })

    } catch(error){
        console.error("ERROR:", error)
        throw err
    }
})()
*/ 