const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// servindo staticos
app.use(express.static(path.join(__dirname, 'public')));
// servindo client do socket.io
app.use(express.static(path.join(__dirname, 'node_modules/socket.io-client')));

let users = [];

const rooms = [
  { name: 'javascript', users: 0 },
  { name: 'Nodejs', users: 0 },
  { name: 'Socket.io', users: 0 },
];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  users[socket.id] = {nickname: '', room: ''}

  socket.emit('update rooms', rooms);
  socket.on('join', (nickname) => {
    users[socket.id].nickname = nickname;
    console.log(`user: ${users[socket.id].nickname}`);
  });
  
  socket.on('disconnect', () => {
    if(users[socket.id].room){
      socket.to(users[socket.id].room).broadcast.emit('info', `${users[socket.id].nickname} left`);
      rooms[rooms.findIndex(r => r.name === users[socket.id].room)].users--;
      io.emit('update rooms', rooms);
    }
    delete users[socket.id];
    console.log('user disconnected');
  });

  socket.on('select room', (room) => {
    socket.join(room);
    users[socket.id].room = room;
    socket.to(room).broadcast.emit('info', ` ${users[socket.id].nickname} connected`);
    rooms[rooms.findIndex(r => r.name === room)].users++;
    socket.broadcast.emit('update rooms', rooms);
  });

  socket.on('message', (msg) => {
    const msgData = {
      owner: users[socket.id].nickname, 
      msg
    }
    socket.to(users[socket.id].room).broadcast.emit('message', msgData);
  });

  socket.on('disconnect room', () => {
    socket.to(users[socket.id].room).broadcast.emit('info', `${users[socket.id].nickname} left`);
    rooms[rooms.findIndex(r => r.name === users[socket.id].room)].users--;
    users[socket.id].room = '';
    io.emit('update rooms', rooms);
    socket.leave(users[socket.id].room);
  })
});

http.listen(3000, () => {
  console.log('listening on localhost:3000');
});