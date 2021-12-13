const config = require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
const PORT = process.env.PORT;
const { twitterInit,streamTweets } = require("./twitter");

/*
(async()=>{
     

    try{

        twitterInit();

    } catch(err){
        console.error(err);
        process.exit(1);
    }

    streamTweets();

})()*/


io.on("connection", async () => {
  console.log("Client connected...");

  try {
    
    twitterInit();
    streamTweets(io);
   

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
