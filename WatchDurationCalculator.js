
let before= "合集时长：13:21:43 ｜ 已看：04:16:50 ｜ 未看：09:04:53 ｜进度：32.04%";

let after= "合集时长：13:21:43 ｜ 已看：04:56:16 ｜ 未看：08:25:27 ｜进度：36.95%";

// 提取已看时间的函数
function extractWatchedTime(str) {
    const regex = /已看：(\d{2}):(\d{2}):(\d{2})/;
    const match = str.match(regex);
    if (match) {
        return {
            hours: parseInt(match[1]),
            minutes: parseInt(match[2]),
            seconds: parseInt(match[3])
        };
    }
    return null;
}

// 将时间转换为总秒数
function timeToSeconds(timeObj) {
    return timeObj.hours * 3600 + timeObj.minutes * 60 + timeObj.seconds;
}

// 将总秒数转换为时间格式
function secondsToTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 提取before和after中的已看时间
const beforeWatched = extractWatchedTime(before);
const afterWatched = extractWatchedTime(after);

// 转换为秒数并计算差值
const beforeSeconds = timeToSeconds(beforeWatched);
const afterSeconds = timeToSeconds(afterWatched);
const watchedSeconds = afterSeconds - beforeSeconds;

// 转换回时间格式
const watchedTime = secondsToTime(watchedSeconds);

// 从after字符串中提取合集时长
function extractTotalTime(str) {
    const regex = /合集时长：(\d{2}:\d{2}:\d{2})/;
    const match = str.match(regex);
    if (match) {
        return match[1];
    }
    return '';
}

// 提取after中的其他信息（已看、未看、进度）
function extractOtherInfo(str) {
    const regex = /(已看：\d{2}:\d{2}:\d{2} ｜ 未看：\d{2}:\d{2}:\d{2} ｜进度：[\d.]+%)/;
    const match = str.match(regex);
    if (match) {
        return match[1];
    }
    return '';
}

const totalTime = extractTotalTime(after);
const otherInfo = extractOtherInfo(after);

// 拼接结果 - 调整顺序，将本次观看时间放在最前面，合计时长（合集时长）放在最后
const result = `本次观看：${watchedTime} ｜ ${otherInfo} ｜ 合集时长：${totalTime}`;

console.log(result);