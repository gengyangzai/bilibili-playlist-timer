// ==UserScript==
// @name         B站视频学习时长统计
// @version      1.1
// @description  B站视频学习时长统计，分P统计，并计算学习百分比
// @author       miemieyang
// @match        www.bilibili.com/video/*
// @icon         https://i0.hdslb.com/bfs/static/jinkela/long/images/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('[miemieGyy] 用户脚本，准备启动...');

    let lastUrl = window.location.href;
    let observer;

    function parseDurationToSeconds(timeStr) {
        const parts = timeStr.trim().split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
    }

    function formatSecondsToTime(seconds) {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function getVideoProgress() {
        try {
            // 尝试获取当前视频播放进度
            const video = document.querySelector('video');
            if (video && !isNaN(video.duration) && !isNaN(video.currentTime)) {
                return {
                    duration: video.duration,
                    current: video.currentTime
                };
            }
        } catch (e) {
            console.warn('[miemie] 获取视频进度失败:', e);
        }
        return null;
    }

    function getWatchedInfo() {
        const amtElement = document.querySelector('.left .amt');
        if (!amtElement) return {count: 0, total: 0};

        const match = amtElement.textContent.match(/(\d+)\/(\d+)/);
        if (match && match[1] && match[2]) {
            return {
                count: parseInt(match[1]),  // 已看集数
                total: parseInt(match[2])  // 总集数
            };
        }
        return {count: 0, total: 0};
    }

    function calculateDurations() {
        console.log('[miemie] 🧮 正在计算选集时长...');
        const items = document.querySelectorAll('.video-pod__list .video-pod__item');
        if (!items.length) {
            console.warn('[miemie] ⚠️ 未找到选集列表，等待下一次重试...');
            return;
        }

        let totalSeconds = 0;
        let watchedSeconds = 0;
        const {count: watchedCount, total: totalCount} = getWatchedInfo();
        const currentProgress = getVideoProgress();
        let currentVideoIndex = -1;

        // 先找出当前正在播放的视频索引
        items.forEach((item, index) => {
            if (item.classList.contains('active')) {
                currentVideoIndex = index;
            }
        });

        items.forEach((item, index) => {
            const durationEl = item.querySelector('.stat-item.duration');
            if (!durationEl) return;

            const videoDuration = parseDurationToSeconds(durationEl.textContent);
            totalSeconds += videoDuration;

            if (index < watchedCount) {
                // 已完整观看的视频
                watchedSeconds += videoDuration;
            } else if (index === watchedCount && currentVideoIndex === index && currentProgress) {
                // 当前正在观看的视频（可能是部分观看）
                const progress = Math.min(currentProgress.current, currentProgress.duration);
                watchedSeconds += progress;
            }
        });

        const unwatchedSeconds = totalSeconds - watchedSeconds;
        const percentage = totalSeconds > 0 ? ((watchedSeconds / totalSeconds) * 100).toFixed(2) : 0;

        const result = {
            total: formatSecondsToTime(totalSeconds),
            watched: formatSecondsToTime(watchedSeconds),
            unwatched: formatSecondsToTime(unwatchedSeconds),
            progress: watchedCount < totalCount ?
                `已看 ${watchedCount} 集${currentVideoIndex === watchedCount ? ' (当前集观看中)' : ''}` :
                '已看完所有视频',
            percentage: `${percentage}%`  // 添加百分比字段
        };

        console.log('[miemie] 时长统计结果：', result);
        renderDurationStats(result);
    }

    function renderDurationStats({total, watched, unwatched, progress, percentage}) {
        const infoContainer = document.querySelector('.video-info-detail-list.video-info-detail-content');
        if (!infoContainer) {
            console.warn('[miemie] 未找到插入区域 `.video-info-detail-list.video-info-detail-content`');
            return;
        }

        const statsText = `合集时长：${total} ｜ 已看：${watched} ｜ 未看：${unwatched} ｜进度：${percentage} ${progress}`;

        // 若已存在旧元素，更新内容
        let existing = document.querySelector('.miemie-duration');
        if (existing) {
            existing.textContent = statsText;
            return;
        }

        const infoItem = document.createElement('div');
        infoItem.className = 'miemie-duration item';
        infoItem.style.color = '#888';
        infoItem.style.fontSize = '13px';
        infoItem.textContent = statsText;

        infoContainer.appendChild(infoItem);
        console.log('[miemie] 📌 合集时长信息已插入页面');
    }

    function initObserver() {
        const listContainer = document.querySelector('.video-pod__list');
        if (!listContainer) {
            console.warn('[miemie] ⚠️ 未找到视频选集列表');
            return;
        }

        calculateDurations();

        // 如果已有observer，先断开
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver(() => {
            console.log('[miemie] 🔁 监听到 DOM 更新，重新计算合集时长');
            calculateDurations();
        });

        observer.observe(listContainer, {
            childList: true,
            subtree: true,
        });

        console.log('[miemie] 👀 MutationObserver 已绑定成功');
    }

    function checkUrlChange() {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            console.log('[miemie] 🌐 检测到URL变化，重新计算合集时长');
            lastUrl = currentUrl;
            calculateDurations();
        }
    }

    function waitForReady() {
        const interval = setInterval(() => {
            const list = document.querySelector('.video-pod__list');
            const info = document.querySelector('.video-info-detail-list.video-info-detail-content');

            if (list && info) {
                console.log('[miemie] 页面结构已准备，开始监听...');
                clearInterval(interval);
                initObserver();

                // 添加URL变化检查
                setInterval(checkUrlChange, 1000);

                // 添加视频进度监听（每5秒检查一次）
                setInterval(calculateDurations, 5000);
            }
        }, 2000);
    }

    // 开始监听
    waitForReady();
})();
