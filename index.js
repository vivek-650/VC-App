const express = require("express")
const app = express();
const socket = require("socket.io")
 let port = 3000
 const server = app.listen(port, ()=>{
    console.log(`server is running at ${port}`)
 })


 const bodyParser = require("body-parser");
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({extended: true}));

 app.set('view engine' , 'ejs');
 app.set('views', './views');

 app.use(express.static('public'));


const userRoute = require("./routes/userRoute")
app.use('/', userRoute);

 

let io = socket(server); // server conenction to socket
io.on("connection", (socket)=>{
    console.log("user conected: "+socket.id);

    socket.on("join", (roomName)=>{
        let rooms = io.sockets.adapter.rooms; // for creating rooms
        
        let room = rooms.get(roomName); // created a room of roomName
        
        if(room == undefined){
            socket.join(roomName);
            socket.emit("created")
            // console.log("Room Created");
        }
        else if(room.size == 1){
            socket.join(roomName) // user can join room
            socket.emit("joined")
            // console.log("Room Joined")
        }
        else{
            socket.emit("full")
            // console.log("Room Full")
        }
        console.log(rooms);
    });
    // ready is event
    socket.on("ready", (roomName)=>{
        console.log("ready")
        io.sockets.in(roomName).emit("ready")
        // socket.emit("ready")
        // socket.broadcast.to(roomName).emit("ready");
        // console.log(roomName)
    });
    socket.on("candidate", (candidate, roomName)=>{
        console.log(candidate)
        io.sockets.in(roomName).emit("candidate", candidate);
    });
    socket.on("offer", (offer, roomName)=>{
        console.log("offer")
        console.log(offer)
        io.sockets.in(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName)=>{
        io.sockets.in(roomName).emit("answer", answer);
    });
});

