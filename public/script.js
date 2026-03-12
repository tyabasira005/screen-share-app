const socket = io();
const peer = new Peer();

const btnCreate = document.getElementById('btn-create');
const btnJoin = document.getElementById('btn-join');
const statusText = document.getElementById('status');
const setupArea = document.getElementById('setup-area');
const videoArea = document.getElementById('video-area');
const remoteVideo = document.getElementById('remote-video');

let myPeerId = null;
let localStream = null;

peer.on('open', (id) => {
    myPeerId = id;
    statusText.innerText = "準備完了。ID: " + id;
});

// --- 【親】配信開始 ---
btnCreate.addEventListener('click', () => {
    // デバッグ用：クリックが反応しているか確認
    console.log("Create button clicked");
    
    const word = document.getElementById('word').value;
    const pin = document.getElementById('pin').value;
    if (!word || !pin) return alert("ワードとPINを入力してください");

    statusText.innerText = "システムダイアログを確認してください...";

    // Galaxy/Android対策: 音声なし、低遅延呼び出し
    const constraints = { 
        video: { displaySurface: "monitor" }, 
        audio: false 
    };

    navigator.mediaDevices.getDisplayMedia(constraints)
    .then(stream => {
        localStream = stream;
        socket.emit('create-room', { word, pin, peerId: myPeerId });
        statusText.innerText = "配信準備完了！子が参加するのを待っています...";
        btnCreate.disabled = true;
        btnJoin.disabled = true;
        alert("画面取得に成功しました。子が参加するのを待ってください。");
    })
    .catch(err => {
        console.error(err);
        // エラー内容をアラートで表示（これで原因がわかります）
        alert("エラー発生: " + err.name + "\n" + err.message);
        statusText.innerText = "エラー: " + err.name;
    });
});

// 子が入室してきた通知
socket.on('start-sharing', (childPeerId) => {
    if (localStream) {
        statusText.innerText = "子が接続しました。映像送信中...";
        peer.call(childPeerId, localStream);
    }
});

// --- 【子】入室 ---
btnJoin.addEventListener('click', () => {
    const word = document.getElementById('word').value;
    const pin = document.getElementById('pin').value;
    if (!word || !pin) return alert("ワードとPINを入力してください");
    socket.emit('join-room', { word, pin, peerId: myPeerId });
    statusText.innerText = "入室確認中...";
});

peer.on('call', (call) => {
    call.answer();
    call.on('stream', (stream) => {
        remoteVideo.srcObject = stream;
        setupArea.classList.add('hidden');
        videoArea.classList.remove('hidden');
        statusText.innerText = "受信中";
    });
});

socket.on('error-msg', (msg) => alert(msg));