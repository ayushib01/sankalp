//seeing our own video
//allows to see video nd audio for chrome
const io = require('socket.io')(server);
const videoGrid=document.getElementById('video-grid');
const myVideo=document.createElement('video');
myVideo.muted=true;
let myVideoStream;
navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
})
.then(stream=>{
    myVideoStream=stream;
    addVideoStream(myVideo,stream);
})
//joined room
socket
const addVideoStream=(video,stream)=>{
    video.srcObject=stream;//a MediaStream from a camera is assigned to a newly-created <video> element.
    video.addEventListener('loadedmetadata',()=>{
    video.play();
    })
    videoGrid.append(video);
}

