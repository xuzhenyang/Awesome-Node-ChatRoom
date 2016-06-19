var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var onlineUsers = {};
var onlineCount = 0;
var roomList = {};
var Room = function (roomname) {
    this.roomname = roomname;
    this.users = {};
    this.count = 0;
};

io.on('connection', function (socket) {
    console.log("a user connected");

    socket.on('login', function (loginInfo) {
        console.log("username : " + loginInfo.username);
        //socket的name作为标识 用于logout
        socket.name = loginInfo.username;
        if (!onlineUsers.hasOwnProperty(loginInfo.username)) {
            onlineUsers[loginInfo.username] = loginInfo.username;
            onlineCount++;
        }
        io.emit('loginInfo', { onlineUsers: onlineUsers, onlineCount: onlineCount });
        // io.emit('sysInfo', '----' + loginInfo.username + '已加入聊天' + '----');
    });

    socket.on('join', function (loginInfo) {
        console.log(loginInfo.username + "join in : " + loginInfo.room);
        //判断房间对象是否存在 若不存在则创建
        if (!roomList.hasOwnProperty(loginInfo.room)) {
            roomList[loginInfo.room] = new Room(loginInfo.room);
        }
        //判断房间内的用户对象是否存在 若不存在则创建用户对象并统计人数
        if (!(roomList[loginInfo.room].users).hasOwnProperty(loginInfo.username)) {
            roomList[loginInfo.room].users[loginInfo.username] = loginInfo.username;
            roomList[loginInfo.room].count++;
        }
        socket.join(loginInfo.room);
        io.to(loginInfo.room).emit('joinInfo', roomList[loginInfo.room]);
        io.to(loginInfo.room).emit('sysInfo','----' + loginInfo.username + " 加入 " + loginInfo.room + '----');
    });

    socket.on('chat message', function (msg) {
        io.to(msg.room).emit('chat message', msg);
        console.log('chat message', msg.content);
    });

    socket.on('leave', function (leaveInfo) {
        console.log('user leave');
        // console.log('room ' + leaveInfo.room + ' username ' + leaveInfo.username);
        if((roomList[leaveInfo.room].users).hasOwnProperty(socket.name))
        {
            delete (roomList[leaveInfo.room].users)[socket.name];
            roomList[leaveInfo.room].count--;
        }
        io.to(leaveInfo.room).emit('leaveInfo', roomList[leaveInfo.room]);
        io.to(leaveInfo.room).emit('sysInfo','----' + leaveInfo.username + " 退出 " + leaveInfo.room + '----');
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
        if (onlineUsers.hasOwnProperty(socket.name)) {
            delete onlineUsers[socket.name];
            onlineCount--;
        }
        io.emit('logoutInfo', { onlineUsers: onlineUsers, onlineCount: onlineCount });
        // io.emit('sysInfo','----' + socket.name + '已退出聊天' + '----');
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});


// browser-sync start --proxy "localhost:3000" --files "**/*.css, **/*.html"