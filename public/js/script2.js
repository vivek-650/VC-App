console.log("page loaded")
let socket = io();

let videoChatForm = document.getElementById('video-chat-form')
let videoChatRooms = document.getElementById('video-chat-rooms')
let joinBtn = document.getElementById('join') 
let roomInput = document.getElementById('roomName') 
let userVideo = document.getElementById('user-video') 
let peerVideo = document.getElementById('peer-video') 
let buttons = document.getElementById('btnGroup')
let muteBtn = document.getElementById('mute')
let leaveBtn = document.getElementById('leave')
let cameraBtn = document.getElementById('hide-camera')
let roomName;

navigator.getUserMedia = navigator.getUserMedia || navigator.webKitGetUserMedia || navigator.mozGetUserMedia ;

let creator = false;

let rtcPeerConnection;

let userStream;

let iceServers = {
    iceServers:[
        {urls: "stun:stun3.l.google.com:19302"},
        {urls: "stun:stun.l.google.com:19302"}
    ]
}

joinBtn.addEventListener('click', function(){
    if(roomInput.value == ''){
        alert("please enter the room name")
    }
    else{
        roomName = roomInput.value
        // console.log(roomInput.value)
        socket.emit("join", roomName)
    }
});
socket.on("created", ()=>{
    creator = true;
    navigator.getUserMedia(
        {
            audio: true,
            video: true,
        },
        function(stream){
            userStream = stream;
            videoChatForm.style = "display: none";
            buttons.style = "display: flex"
            userVideo.style = "display: block"
            userVideo.srcObject = stream;  // the video which is coming from your camera is directly saved to this path
            userVideo.onloadedmetadata = function(e){
                userVideo.play();
            }
        },
        function(error){
            alert("you can't access Media")
        }
    );
});
socket.on("joined", ()=>{
    navigator.getUserMedia(
        {
            audio: true,
            video: true,
        },
        function(stream){
            userStream = stream;
            videoChatForm.style = "display: none";
            buttons.style = "display: flex"
            userVideo.style = "display: block"
            userVideo.srcObject = stream;  // the video which is coming from your camera is directly saved to this path
            userVideo.onloadedmetadata = function(e){
                userVideo.play();
            }
            socket.emit("ready", roomName);
        },
        function(error){
            alert("you can't access Media")
        }
    );
})
socket.on("full", ()=>{
    alert("Room is already full")
})



socket.on("ready", async ()=>{
    if(creator){
       rtcPeerConnection = new RTCPeerConnection(iceServers);
       rtcPeerConnection.onicecandidate = await OnIceCandidateFunction;
       rtcPeerConnection.ontrack = await OnTrackFunction;
       rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); //for audio track 
       rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); // for video track
       rtcPeerConnection.createOffer(
           function (offer){
                rtcPeerConnection.setLocalDescription(offer);
                socket.emit("offer", offer, roomName)
            },
            function(error){
                console.log(error)
            }
       );
    }
});
socket.on("offer", (offer)=>{

    if(!creator){
        console.log("hello")
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); //for audio track 
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); // for video track
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer(
             function (answer){
                 rtcPeerConnection.setLocalDescription(answer);
                 socket.emit("answer", answer, roomName)
             },
             function(error){
                 console.log(error)
             }
        );
     }
})

socket.on("candidate", (candidate)=>{
    let iceCandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);
})

function OnTrackFunction(event){
    console.log("this is the event")
    console.log(event.streams)
    peerVideo.srcObject = event.streams[0]; 
    peerVideo.onloadedmetadata = function(e){
        peerVideo.play();
    }
}
socket.on("answer", (answer)=>{
    rtcPeerConnection.setRemoteDescription(answer);
})

function OnIceCandidateFunction(event){
    if(event.candidate){
        socket.emit("candidate", event.candidate, roomName);
    }
}

let muteFlag = false;

muteBtn.addEventListener("click", function(){
    muteFlag = !muteFlag;
    if(muteFlag){
        muteBtn.innerHTML = `<i class="ri-mic-off-fill"></i>`
        userStream.getTracks()[0].enabled = false;
    }
    else{
        muteBtn.innerHTML = `<i class="ri-mic-fill"></i>`
        userStream.getTracks()[0].enabled = true;
    }
})

let cameraFlag = false;

cameraBtn.addEventListener("click", function(){
    cameraFlag = !cameraFlag;
    if(cameraFlag){
        cameraBtn.innerHTML = `<i class='bx bx-video-off' ></i>`
        userStream.getTracks()[1].enabled = false;
        userVideo.innerHTML
    }
    else{
        cameraBtn.innerHTML = `<i class='bx bx-video'></i>`
        userStream.getTracks()[1].enabled = true;
    }
})

leaveBtn.addEventListener("click", function(){
    socket.emit("leave", roomName);
    videoChatForm.style = "display: block";
    buttons.style = "display: none";

    if(userVideo.srcObject){
        userVideo.srcObject.getTracks()[0].stop();
        userVideo.srcObject.getTracks()[1].stop();
        userVideo.style = "display: none"
    }
    if(peerVideo.srcObject){
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();
        peerVideo.style = "display: none"
    }
    if(rtcPeerConnection){
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
    }

    

})

socket.on("leave", ()=>{
    creator = true;
    
    if(peerVideo.srcObject){
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();
    }
    if(rtcPeerConnection){
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
    }
})
