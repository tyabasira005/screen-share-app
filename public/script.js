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
    statusText.innerText = "準備完了。モードを選んで「部屋を作る」を押してください";
});

// --- 【配信者】処理 ---
btnCreate.addEventListener('click', async () => {
    const word = document.getElementById('word').value;
    const pin = document.getElementById('pin').value;
    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (!word || !pin) return alert("ワードとPINを入力してください");

    try {
        statusText.innerText = "配信準備中...";

        if (mode === "screen") {
            // PCモード：画面共有を試みる
            localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        } else {
            // スマホモード：カメラ映像（外カメラ優先）
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" }, 
                audio: true 
            });
        }

        socket.emit('create-room', { word, pin, peerId: myPeerId });
        statusText.innerText = "配信中！子が参加するのを待っています...";
        btnCreate.disabled = true;
        btnJoin.disabled = true;

    } catch (err) {
        console.error(err);
        statusText.innerText = "エラー: " + err.name;
        alert("許可されなかったか、この端末ではそのモードは使えません。");
    }
});

socket.on('start-sharing', (childPeerId) => {
    if (localStream) {
        statusText.innerText = "子が接続しました。配信中...";
        peer.call(childPeerId, localStream);
    }
});

// --- 【視聴者】処理 ---
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
        statusText.innerText = "視聴中";
    });
});

socket.on('error-msg', (msg) => alert(msg));