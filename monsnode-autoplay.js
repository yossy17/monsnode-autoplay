// ==UserScript==
// @name                monsnode autoplay
// @name:ja             monsnode 自動再生
// @name:en             monsnode autoplay
// @name:zh-CN          monsnode 自动播放
// @name:ko             monsnode 자동 재생
// @name:ru             monsnode автовоспроизведение
// @name:de             monsnode automatische Wiedergabe
// @description         When a video is selected, it automatically clicks the destination video URL and plays it automatically
// @description:ja      動画を選択すると、遷移先の動画URLを自動でクリックし、自動で再生させる
// @description:en      When a video is selected, it automatically clicks the destination video URL and plays it automatically
// @description:zh-CN   选择视频后，自动点击目标视频URL并自动播放
// @description:ko      동영상을 선택하면 대상 동영상 URL을 자동으로 클릭하고 자동으로 재생합니다
// @description:ru      При выборе видео автоматически кликает по URL-адресу целевого видео и автоматически воспроизводит его
// @description:de      Wenn ein Video ausgewählt wird, klickt es automatisch auf die Ziel-Video-URL und spielt es automatisch ab
// @version             0.9.3
// @author              Yos_sy17
// @match               https://monsnode.com/*
// @match               https://video.twimg.com/*
// @namespace           http://tampermonkey.net/
// @icon                https://www.google.com/s2/favicons?sz=64&domain=monsnode.com
// @license             MIT
// @grant               GM_openInTab
// ==/UserScript==

(function () {
  "use strict";

  // デバッグモード（true or false）
  const DEBUG = true;

  // ログ管理
  const logger = {
    log: (message) => {
      if (DEBUG) {
        console.log(`[monsnode autoplay]: ${message}`);
      }
    },
    error: (message) => {
      if (DEBUG) {
        console.error(`[monsnode autoplay Error]: ${message}`);
      }
    },
  };

  // monsnode.com での処理
  function handleMonsNode() {
    window.addEventListener("load", openTwitterVideoLink);
  }

  // 遷移ページリンクを開く
  function openTwitterVideoLink() {
    const links = document.querySelectorAll(
      'a[href^="https://video.twimg.com"]'
    );
    if (links.length > 0) {
      const videoUrl = links[0].href;
      try {
        GM_openInTab(videoUrl, { active: true, insert: true, setParent: true });
        setTimeout(closeCurrentPage, 0);
      } catch (error) {
        logger.error(`Failed to open Twitter video link: ${error.message}`);
      }
    } else {
      logger.log("No Twitter video links found");
    }
  }

  // 現在のページを閉じる
  function closeCurrentPage() {
    window.close();
  }

  // video.twimg.com での処理
  function handleTwitterVideo() {
    const initAndSetupShortcut = () => {
      initializeVideoPlayback();

      // キーボードショートカットのイベントリスナーを追加
      document.addEventListener("keydown", function (event) {
        if (event.altKey && event.key.toLowerCase() === "o") {
          clickMuteButton();
          event.preventDefault();
        }
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initAndSetupShortcut);
    } else {
      initAndSetupShortcut();
    }
  }

  // 動画再生の初期化
  function initializeVideoPlayback() {
    const video = findVideoElement();
    if (video) {
      startAutoPlay(video);
      setupAudioEnabling(video);
    } else {
      logger.error("Video element not found");
    }
  }

  // 動画要素を探す
  function findVideoElement() {
    let video = document.querySelector("video");
    if (!video) {
      const iframe = document.querySelector("iframe");
      if (iframe && iframe.contentDocument) {
        video = iframe.contentDocument.querySelector("video");
      }
    }
    return video;
  }

  // 自動再生を開始する
  function startAutoPlay(video) {
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          logger.log("Autoplay successful (muted)");
        })
        .catch((error) => {
          logger.error(`Autoplay failed: ${error.message}`);
          video.click();
        });
    }
  }

  // 音声有効化
  function setupAudioEnabling(video) {
    const enableAudio = () => {
      video.muted = false;
      video.volume = 1;
      logger.log("Audio enabled");
      document.removeEventListener("click", enableAudio);
    };
    document.addEventListener("click", enableAudio);
  }

  // ミュートボタンをクリックする
  function clickMuteButton() {
    const findAndClickMuteButton = () => {
      const video = document.querySelector("video");
      if (video) {
        video.muted = !video.muted;
        logger.log(`Mute toggled: ${video.muted ? "off" : "on"}`);
        return true;
      }

      const muteButton = document.querySelector(
        'input[pseudo="-webkit-media-controls-mute-button"]'
      );
      if (muteButton) {
        muteButton.click();
        logger.log("Mute button clicked");
        return true;
      }

      const volumeControl = document.querySelector(
        'div[pseudo="-webkit-media-controls-volume-control-container"]'
      );
      if (volumeControl) {
        const muteButtonInContainer = volumeControl.querySelector(
          'input[pseudo="-webkit-media-controls-mute-button"]'
        );
        if (muteButtonInContainer) {
          muteButtonInContainer.click();
          logger.log("Mute button clicked (from volume control container)");
          return true;
        }
      }

      return false;
    };

    setTimeout(() => {
      if (!findAndClickMuteButton()) {
        console.error("Failed to find mute button");
      }
    }, 100);
  }

  // メイン処理
  function main() {
    if (window.location.hostname === "monsnode.com") {
      handleMonsNode();
    } else if (window.location.hostname === "video.twimg.com") {
      handleTwitterVideo();
    }
  }

  // スクリプト開始
  main();
})();
