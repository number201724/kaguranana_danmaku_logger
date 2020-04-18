"use strict";
//=================================================
// KaguraNana Danmaku Logger
// Author: number201724
// Date: 04/18/2020
//=================================================
const fs = require('fs');
const BListener = require("./BListener");
global.Util = require('./Util');

//=================================
//Date.Format
//author: meizz
//=================================
Date.prototype.Format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "S": this.getMilliseconds() //milliseconds
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

async function SCEventHandler(json, roomId) {
    let uid = json.data.uid;
    let giftId = json.data.gift.gift_id;
    let uname = json.data.user_info.uname;
    let giftname = json.data.gift.gift_name;
    let coin_type = 'gold';
    let total_coin = json.data.price * 1000;
    let gold = json.data.price * 1000;
    let silver = 0;
    let num = json.data.gift.num;
    let ts = json.data.ts;

    let queueData = {
        'roomId': roomId,
        'uid': uid,
        'giftId': giftId,
        'uname': uname,
        'giftname': giftname,
        'coin_type': coin_type,
        'total_coin': total_coin,
        'gold': gold,
        'silver': silver,
        'num': num,
        'ts': ts
    };

    // await logRedis.lpush('bilibili_gifts', JSON.stringify(queueData));
}

async function giftEventHandler(json, roomId) {
    let uid = json.data.uid;
    let giftId = json.data.giftId;
    let uname = json.data.uname;
    let giftname = json.data.giftName;
    let coin_type = json.data.coin_type;
    let total_coin = json.data.total_coin;
    let gold = json.data.gold;
    let silver = json.data.silver;
    let num = json.data.num;
    let ts = json.data.timestamp;

    let queueData = {
        'roomId': roomId,
        'uid': uid,
        'giftId': giftId,
        'uname': uname,
        'giftname': giftname,
        'coin_type': coin_type,
        'total_coin': total_coin,
        'gold': gold,
        'silver': silver,
        'num': num,
        'ts': ts
    };

}

async function danmuEventHandler(json, roomId) {
    let uid = json.info[2][0];
    let uname = json.info[2][1];
    let text = json.info[1];
    let is_admin = json.info[2][2];
    let ship_member = json.info[7];
    let ts = json.info[9].ts;
    let type = json.info[0][9];
    
    if(type != 0)
    	return;
    
   	if(uid != 386900246)
   		return;
   
    let queueData = {
        'roomId': roomId,
        'uid': uid,
        'uname': uname,
        'text': text,
        'is_admin': is_admin,
        'ship_member': ship_member,
        'ts': ts
    };
    
   	let filename = "danmaku_" + new Date().Format("yyyy_MM_dd") + ".txt";
	let append_string = "[" + new Date().Format("hh:mm:ss") +"][" +uname+ "][" + text + "]\n";
    fs.appendFileSync("logs/" + filename, append_string );
    
    console.log(append_string);
}

async function guardBuyEventHandle(json, roomId) {

    let uid = json.data.uid;
    let giftId = json.data.role_name;
    let uname = json.data.username;
    let giftname = json.data.gift_name;
    let coin_type = 'gold';
    let total_coin = json.data.price;
    let gold = 0;
    let silver = 0;
    let super_gift_num = json.data.num;
    let ts = json.data.start_time;

    let queueData = {
        'roomId': roomId,
        'uid': uid,
        'giftId': giftId,
        'uname': uname,
        'giftname': giftname,
        'coin_type': coin_type,
        'total_coin': total_coin,
        'gold': gold,
        'silver': silver,
        'num': super_gift_num,
        'ts': ts
    };

    // await logRedis.lpush('bilibili_gifts', JSON.stringify(queueData));
}

async function cmtEventHandler(json, roomId) {
    if (typeof (json.cmd) == "undefined") {
        return;
    }

    try {

        let cmd = json.cmd.split(':');
        switch (cmd[0]) {
            case 'new_anchor_reward':
            case 'WELCOME':         //欢迎老爷进入房间xxoo
            case 'NOTICE_MSG':      //广播通知消息
            case 'ENTRY_EFFECT':    //舰长进入房间特效
            case 'SPECIAL_GIFT':    //特效礼物 SPECIAL_GIFT 
            case 'WISH_BOTTLE':     //心愿瓶变动消息
            case 'COMBO_SEND':      //礼物连击消息
            case 'COMBO_END':       //礼物连击结束
            case 'WELCOME_ACTIVITY':    //进入房间特效(排行榜人物)
            case 'GUARD_LOTTERY_START'://舰长抽奖
            case 'USER_TOAST_MSG':  //不知道
            case 'LIVE':        //开始直播了
            case 'PREPARING':   //缓存中（转圈）
            case 'ROOM_BLOCK_MSG':  //不知道是啥
            case 'ROOM_SILENT_ON':  //禁言开启低等级无法发言？
            case 'ROOM_SILENT_OFF': //禁言关闭? 直播结束？
            case 'WELCOME_GUARD':   //  { cmd: 'WELCOME_GUARD',data: { uid: 11510390, username: '熊熊今天也是高冷的呀', guard_level: 3 } }
            case 'CHANGE_ROOM_INFO':
            case 'RAFFLE_START':    //抽奖开始
            case 'RAFFLE_END':      //抽奖结束
            case 'WARNING':         //警告
            case 'CUT_OFF':         //切掉
            case 'ACTIVITY_EVENT':  //活动信息
            case 'GUARD_MSG':       //不知道是什么 开通总督的横屏消息
            case 'SYS_MSG':         //系统消息 横屏消息
            case 'SYS_GIFT':        //节奏风暴20倍触发这个
            case 'HOUR_RANK_AWARDS':
            case 'ROOM_RANK':       //小时榜rank更新
            case 'PK_START':
            case 'PK_PRE':
            case 'PK_MATCH':
            case 'PK_END':
            case 'PK_SETTLE':
            case 'PK_PROCESS':
            case 'PK_MIC_END':
            case 'PK_AGAIN':
            case 'TV_END':
            case 'ADMINS':
            case 'PK_CLICK_AGAIN':
                break;
            case 'SEND_GIFT':       //礼物消息
                await giftEventHandler(json, roomId);
                return;
            case 'DANMU_MSG':       //弹幕消息
                await danmuEventHandler(json, roomId);
                return;
            case 'GUARD_BUY':       //购买舰长
                await guardBuyEventHandle(json, roomId);
                return;
            case 'SUPER_CHAT_MESSAGE':      //Vtuber Super Chat
                await SCEventHandler(json, roomId);
                return;
            default:                //不晓得啥消息输出到控制台
                break;
        }
/*
        let logger_data = {
            'room_id': roomId,
            'cmd': json.cmd,
            'data': json,
            'ts': moment().unix()
        };
*/
        // await logRedis.lpush('bilibili_logs', JSON.stringify(logger_data));
    } catch (err) {
        console.log(err);
    }
}


async function main() {
	console.log("KaguraNana Danmaku Logger");
	console.log("Author: number201724");
	console.log("Date: 04/18/2020");
	new BListener(21304638, cmtEventHandler);
}

main();
