"use strict";
const net = require('net');
const Socket = net.Socket;
const BufferBuilder = require('./BufferBuilder');
const BufferReader = require('./BufferReader');

class BListener {
    constructor(roomId, msgHandler) {
        this.roomId = roomId;
        this.msgHandler = msgHandler || EmptyFun;
        this.uid = 1.0E14 + Number((2.0E14 * Math.random()).toFixed(0));

        this.packLen = -1;
        this.bufferReader = new BufferReader();
        this.is_connected = false;
        this.Init();
    }

    createSocket() {
        let sock = new Socket();

        sock.sendSocketData = (p1, p2, p3, p4, p5, p6) => {
            if (!sock.writable) {
                return;
            }

            let bufferBuilder = new BufferBuilder();
            if (p5 === null) p5 = 1;
            bufferBuilder.writeInt(p1);
            bufferBuilder.writeShort(p2);
            bufferBuilder.writeShort(p3);
            bufferBuilder.writeInt(p4);
            bufferBuilder.writeInt(p5);

            if (!Util.isNullOrUndefined(p6))
                bufferBuilder.writeBuffer(p6);

            sock.write(bufferBuilder.buffer);
        }

        sock.sendHeartBeat = () => {
            sock.sendSocketData(16, 16, 1, 2);
        }

        sock.on('connect', () => {

            let buffer = Buffer.from(`{"roomid": ${this.roomId}, "uid": ${this.uid}}`);

            sock.sendSocketData(16 + buffer.length, 16, 1, 7, 1, buffer);
            sock.sendHeartBeat();
            sock.setTimeout(30000);     //30秒超时

            sock.heartbeat = setInterval(sock.sendHeartBeat, 10000);

            this.Event_OnConnected();
        });

        sock.on('close', () => {
            this.bufferReader.clear();
            this.packLen = -1;

            if (typeof sock.heartbeat != "undefined") {
                clearInterval(sock.heartbeat);
                sock.heartbeat = undefined;
            }

            this.Event_OnDisconnected();
        });

        sock.on('error', function () {
            this.destroy();
        });

        sock.on('timeout', function () {
            this.destroy();
        });

        sock.on('data', this.OnReceiveData.bind(this));

        return sock;
    }

    Event_OnConnected() {
        this.is_connected = true;
        //console.log(`Successfully connect to server, room_id is ${this.roomId}.`);
    }

    Event_OnDisconnected() {
        if (this.is_connected) {
            //console.log(`The link to room ${this.roomId} has been disconnected.`);
        } else {
            //console.log(`Connecting to ${this.roomId} server failed.`);
        }

        this.is_connected = false;
        this.sock = undefined;
    }

    OnReceiveData(data) {
        this.bufferReader.addBuffer(data);
        this.ParseServerMessage();
    }

    OnFrame() {
        if (typeof this.sock != "undefined") {
            return;
        }

        this.sock = this.createSocket();
        this.is_connected = false;
        this.sock.connect(788, 'livecmt-2.bilibili.com');
    }

    Init() {
        if (typeof this.daemon != "undefined") {
            return;
        }

        this.daemon = setInterval(this.OnFrame.bind(this), 3000);
        this.OnFrame();
    }

    Shutdown() {
        if (typeof this.daemon != "undefined") {
            clearInterval(this.daemon);
            this.daemon = undefined;
        }

        if (typeof this.sock != "undefined") {
            this.sock.destroy();
            this.sock = undefined;
        }
    }

    OnReceivePacket(index, bufferReader) {
        if (index === 3 || index === 4) {
            try {
                let json = JSON.parse(bufferReader.readToEnd().toString());
                this.msgHandler(json, this.roomId);
            } catch (err) {
                console.log(err);
            }
        }
    }

    ParseServerMessage() {
        this.reHandle = this.handling;
        if (this.handling) return;
        this.handling = true;

        if (this.packLen === -1) this.packLen = this.bufferReader.readInt() - 4;
        if (this.bufferReader.readableLen() >= this.packLen) {
            let l4 = this.bufferReader.readShort();
            let l2 = this.bufferReader.readShort();
            let index = this.bufferReader.readInt() - 1;
            let l1 = this.bufferReader.readInt();
            this.packLen -= 12;
            this.OnReceivePacket(index, new BufferReader(this.bufferReader.readBuffer(this.packLen)));
            this.packLen = -1;
        }
        if (this.bufferReader.readableLen() === 0) this.bufferReader.clear();

        this.handling = false;
        if (this.reHandle || (this.packLen === -1 && this.bufferReader.readableLen() >= 4)) this.ParseServerMessage();
    }
}

module.exports = BListener;
