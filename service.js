var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

var roomList = {};
var Room = function(roomname) {
    this.roomname = roomname;
    this.users = {};
    this.count = 0;
};
var User = function(userid, username) {
    this.userid = userid;
    this.username = username;
}

function showAllRoom() {
    console.log('---showAllRoom---');
    var users;
    var room;
    // console.log(roomList);
    for (room in roomList) {
        console.log('--' + roomList[room].roomname + '--');
        // console.log(room);
        for (user in roomList[room].users) {
            console.log(roomList[room].users[user].userid + ' : ' + roomList[room].users[user].username);
        }
    }
    console.log('---showAllRoom---');
}

io.on('connection', function(socket) {
    console.log("a user connected");

    socket.on('login', function(loginInfo) {
        console.log("username : " + loginInfo.username);
        console.log("userid : " + loginInfo.userid);
        //socket的name作为标识 用于logout
        socket.name = loginInfo.userid;
        //socket的name2作为标识，用于登出时显示用户名
        socket.name2 = loginInfo.username;
        io.emit('loginInfo', 'login success...');
    });

    socket.on('join', function(joinInfo) {
        console.log('socketname ' + socket.name + ' ：' + joinInfo.username + " 想要加入 " + joinInfo.room);
        //判断房间对象是否存在 若不存在则创建
        if (!roomList.hasOwnProperty(joinInfo.room)) {
            roomList[joinInfo.room] = new Room(joinInfo.room);
        }
        //判断房间内的用户对象是否存在 若不存在则创建用户对象并统计人数
        if (!(roomList[joinInfo.room].users).hasOwnProperty(joinInfo.userid)) {
            console.log('----add user----');
            roomList[joinInfo.room].users[joinInfo.userid] = new User(joinInfo.userid, joinInfo.username);
            roomList[joinInfo.room].count++;
        }
        //把下面一段放进上面的if里...其他房间的人也能知道该用户加入了哪个房间...
        //另外多次加入退出后好像也会出现该bug
        socket.join(joinInfo.room);
        io.to(joinInfo.room).emit('joinInfo', roomList[joinInfo.room]);
        io.to(joinInfo.room).emit('sysInfo', '----' + joinInfo.username + " 加入 " + joinInfo.room + '----');
    });

    socket.on('chat message', function(msg) {
        io.to(msg.room).emit('chat message', msg);
        console.log('chat message', msg.content);
    });

    socket.on('leave', function(leaveInfo) {
        console.log('user leave');
        // console.log('room ' + leaveInfo.room + ' username ' + leaveInfo.username);
        //判断房间内的用户对象是否存在
        if ((roomList[leaveInfo.room].users).hasOwnProperty(socket.name)) {
            console.log('----delete user----');
            delete(roomList[leaveInfo.room].users)[socket.name];
            roomList[leaveInfo.room].count--;

        }
        socket.leave(leaveInfo.room);
        io.to(leaveInfo.room).emit('leaveInfo', roomList[leaveInfo.room]);
        io.to(leaveInfo.room).emit('sysInfo', '----' + leaveInfo.username + " 退出 " + leaveInfo.room + '----');

    });

    socket.on('disconnect', function() {
        console.log('user disconnected');
        for (room in roomList) {
            // console.log(roomList[room].users);
            if ((roomList[room].users).hasOwnProperty(socket.name)) {
                delete(roomList[room].users)[socket.name];
                roomList[room].count--;
            }
            io.to(roomList[room].roomname).emit('leaveInfo', roomList[room]);
            io.to(roomList[room].roomname).emit('sysInfo', '----' + socket.name2 + " 退出 " + roomList[room].roomname + '----');
        }
        io.emit('logoutInfo', 'logout success...');
    });

    socket.on("getUserList", function(info) {
        console.log("get userList");
        // console.log(roomList[info.room].users);
        // showAllRoom();
        io.to(info.room).emit('getUserList', roomList[info.room].users);
    });
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});

// browser-sync start --proxy "localhost:3000" --files "**/*.css, **/*.html"