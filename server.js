const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const rooms = {}; 

io.on('connection', (socket) => {
    // 部屋作成
    socket.on('create-room', ({ word, pin, peerId }) => {
        rooms[word] = { pin, hostPeerId: peerId };
        socket.join(word);
        console.log(`Room Created: ${word}`);
    });

    // 入室
    socket.on('join-room', ({ word, pin, peerId }) => {
        const room = rooms[word];
        if (room && room.pin === pin) {
            // 親に対して、入室してきた子のPeerIDへ配信するよう通知
            io.to(word).emit('start-sharing', peerId);
            console.log(`Join Success: ${word}`);
        } else {
            socket.emit('error-msg', 'ワードまたはPINが正しくありません');
        }
    });

    socket.on('disconnect', () => {
        // 必要に応じて部屋の削除処理を追加
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});