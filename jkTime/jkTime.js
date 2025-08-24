const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 读取curl命令文件
const curlCommand = fs.readFileSync(path.join(__dirname, 'curl-command.txt'), 'utf8');

exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
        console.error(`执行错误: ${error.message}`);
        return;
    }
    
    // 解析返回的JSON数据
    const response = JSON.parse(stdout);
    
    // 检查是否有数据列表
    if (response.data && response.data.list) {
        // 计算总时间
        let totalTime = 0;
        response.data.list.forEach(item => {
            // 将 hh:mm:ss 格式的时间转换为秒
            const timeString = item.audio_time || '00:00:00';
            const timeParts = timeString.split(':');
            const seconds = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2]);
            totalTime += seconds;
        });
        
        // 将总秒数转换回 hh:mm:ss 格式
        const hours = Math.floor(totalTime / 3600);
        const minutes = Math.floor((totalTime % 3600) / 60);
        const seconds = totalTime % 60;
        const formattedTotalTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 添加学习进度计算
        const percentage = 0.01; // 36.95%的学习进度，可根据实际情况修改
        const studiedTimeInSeconds = Math.floor(totalTime * percentage);
        
        // 将学习时间转换回 hh:mm:ss 格式
        const studiedHours = Math.floor(studiedTimeInSeconds / 3600);
        const studiedMinutes = Math.floor((studiedTimeInSeconds % 3600) / 60);
        const studiedSeconds = studiedTimeInSeconds % 60;
        const formattedStudiedTime = `${studiedHours.toString().padStart(2, '0')}:${studiedMinutes.toString().padStart(2, '0')}:${studiedSeconds.toString().padStart(2, '0')}`;
        
        // 计算未看时间
        const unStudiedTimeInSeconds = totalTime - studiedTimeInSeconds;
        const unStudiedHours = Math.floor(unStudiedTimeInSeconds / 3600);
        const unStudiedMinutes = Math.floor((unStudiedTimeInSeconds % 3600) / 60);
        const unStudiedSeconds = unStudiedTimeInSeconds % 60;
        const formattedUnStudiedTime = `${unStudiedHours.toString().padStart(2, '0')}:${unStudiedMinutes.toString().padStart(2, '0')}:${unStudiedSeconds.toString().padStart(2, '0')}`;
        
        // 按照指定格式输出
        console.log(`【 已看：${formattedStudiedTime}  未看：${formattedUnStudiedTime} 进度：${(percentage * 100).toFixed(2)}%  合计时长：${formattedTotalTime}】`);
    } else {
        console.log('未找到数据列表');
    }
    
    // console.log(`stdout: ${stdout}`);
});