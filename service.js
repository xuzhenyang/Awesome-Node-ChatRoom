var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/login', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});

var onlineUsers = {};
var onlineCount = 0;

io.on('connection', function (socket) {
    console.log("a user connected");

    socket.on('login', function (username) {
        console.log("username : " + username);
        //socket的name作为标识 用于logout
        socket.name = username;
        if (!onlineUsers.hasOwnProperty(username)) {
            onlineUsers[username] = username;
            onlineCount++;
        }
        io.emit('loginInfo', { onlineUsers: onlineUsers, onlineCount: onlineCount });
    });

    socket.on('chat message', function (msg) {
        io.emit('chat message', msg);
        console.log('chat message', msg.content);
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
        if(onlineUsers.hasOwnProperty(socket.name))
        {
            delete onlineUsers[socket.name];
            onlineCount--;
        }
        io.emit('logoutInfo', { onlineUsers: onlineUsers, onlineCount: onlineCount });
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});