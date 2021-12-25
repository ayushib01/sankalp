const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

// Get username and room from URL
const username =senderName;
const room = ROOM_ID;

const socket = io();

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
  console.log(message);
  outputMessage(message);
  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit('chatMessage', msg);
  console.log(msg);
  appendNewMsg(username,msg);//adding msg to database 
  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}
function appendNewMsg(devname,msgText){
  // this block of code used to format time and date to append with message
  let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let d=new Date();
  let timeString=timeFormat()+"   "+d.getDate()+" "+months[d.getMonth()];

  function timeFormat(){
      let hh=d.getHours();
      let mm=d.getMinutes();
      let a='am';
      if(hh==12&&mm>0)a='pm';
      if(hh>12)hh-=12,a='pm';
      

      return hh+":"+mm+" "+a;
  }
  // xml http request
  var xhr=new window.XMLHttpRequest();

  //to save this msg to database,send it to server side
  let msgObj=JSON.stringify({
      senderName:devname,
      sendingTime:timeString,
      senderMsg:msgText
  })

  //making post request to send body
  xhr.open('POST','/addMsgToChat/'+ROOM_ID,true);//can have for doctors as well
  xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
  xhr.send(msgObj);
  
}
// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  if (leaveRoom) {
    window.location = '/';
  } else {
  }
});