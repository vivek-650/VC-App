let socket = io();

let videoChatForm = document.getElementById('video-chat-form')
let videoChatRooms = document.getElementById('video-chat-rooms')
let joinBtn = document.getElementById('join') 
let roomInput = document.getElementById('roomName') 
let userVideo = document.getElementById('user-video') 
let peerVideo = document.getElementById('peer-video') 

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
            userVideo.srcObject = stream;  // the video which is coming from your camera is directly saved to this path
            userVideo.onloadedmetadata = function(e){
                userVideo.play();
            }
            // console.log(roomName)
            // socket.emit("ready", roomName);
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
    console.log("event.streams")
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

// to show peer video to us.

