/*******************************************************
 ************** Video auto-play extension **************
 *******************************************************/

function VideoAutoplayExtension(player) {
  const targetWindow = canAccessParentWindow() ? window.opener : window;

  // events

  player.on("finish.vae", function (event, currentVideo) {
    if (!isVideoCompletionEnabled() || !currentVideo.conf.resourceId) currentVideo.trigger('autoplayNextVideo', [currentVideo]);
  });

  player.on("autoplayNextVideo", function (event, currentVideo) {
    autoplayNextVideo(currentVideo);
  });

  // functions

  function autoplayNextVideo(currentVideo) {
    const nextVideo = findNextVideo(currentVideo);

    if (nextVideo) {
      startNextVideo(nextVideo);
    }else {
      navigateToNextPage();
    }

    if (canAccessParentWindow()) window.close();
  }

  function findNextVideo(currentVideo) {
    const playersOnPage = targetWindow.document.querySelectorAll('.video-player');
    const currentPlayer = getCurrentPlayer(currentVideo);
    const index = Array.from(playersOnPage).findIndex(player => player == currentPlayer);

    if (index !== -1 && index < playersOnPage.length - 1) return playersOnPage[index + 1];

    return null;
  }

  function getCurrentPlayer(currentVideo) {
    if (canAccessParentWindow()) {
      return targetWindow.document.querySelector(`#video_${currentVideo.conf.resourceId}`);
    } else {
      return document.querySelector(currentVideo.conf.playerId).parentElement;
    }
  }

  function startNextVideo(nextVideo) {
    if (nextVideo.querySelector('.flowplayer')) {
      const videoPlayer = targetWindow.flowplayer(`#${nextVideo.querySelector('.flowplayer').id}`);

      videoPlayer.load();
      scrollIntoViewport(videoPlayer);
    }else {
      nextVideo.querySelector('a').click();
    }
  }

  function scrollIntoViewport(nextVideo) {
    targetWindow.document.querySelector(nextVideo.conf.playerId).scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }

  function navigateToNextPage() {
    const continueButton = targetWindow.document.querySelector(".section_header_wrap > .align_right");

    if (continueButton) {
      continueButton.setAttribute('href',  continueButton.getAttribute('href') + '&autoplay=true');
      continueButton.click();
    }
  }
}

function startAutoPlay() {
  if (isAutoplayEnabled() && getAutoplayQueryParam() === 'true' && typeof flowplayer(0) !== 'undefined') {
    if (!canAccessParentWindow()) {
      resizeSectionHeader(false);

      $(window).resize(function () {
        resizeSectionHeader(true);
      });

      scroll_to_top(0);
    }

    flowplayer(0).load();
  }
}

function getAutoplayQueryParam() {
  const regex = new RegExp('[\?&]autoplay=([^&#]*)');
  const results = regex.exec(window.location.search);
  return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function isAutoplayEnabled() {
  return (typeof window.autoplay !== 'undefined' && window.autoplay) || (canAccessParentWindow() && typeof window.opener.autoplay !== 'undefined' && window.opener.autoplay);
}

window.addEventListener('flowpvInit', function(event) {
  if (typeof event.detail.instanceId !== 'undefined' && event.detail.instanceId === 0) startAutoPlay();
});

/*******************************************************
 ************** Video completion extension *************
 *******************************************************/

function VideoCompletionExtension(player, completionStatus, maxProgress) {
  let _completionStatus = completionStatus;
  let _maxProgress = maxProgress;
  let _currentMaxProgress = null;
  let _lastProgressChangeAt = null;
  let _currentStatus = _completionStatus;

  // events

  player.on("pause.vce", function (event, currentVideo) {
    _currentStatus = 'started';
    updateCurrentProgress(currentVideo);
    updateStatusSpan(currentVideo.conf.resourceId);
  });

  player.on("finish.vce", function (event, currentVideo) {
    _currentStatus = 'finished';
    updateStatusSpan(currentVideo.conf.resourceId);
    if (currentVideo.conf.completed) triggerAutoplay(currentVideo);
  });

  player.on("unload.vce", function (event, currentVideo) {
    updateCurrentProgress(currentVideo);
  });

  player.on("ready.vce", function (event, currentVideo) {
    _currentStatus = 'playing';
    currentVideo.conf.duration = Math.floor(currentVideo.video.duration);
    updateStatusSpan(currentVideo.conf.resourceId);
  });

  player.on("resume.vce", function (event, currentVideo) {
    _currentStatus = 'playing';
    updateStatusSpan(currentVideo.conf.resourceId);
  });

  player.on("beforeseek.vce", function (event, currentVideo, target) {
    const seekLimit = _maxProgress > _currentMaxProgress ? _maxProgress : _currentMaxProgress;

    if (_maxProgress && seekLimit >= target) {
      updateCurrentProgress(currentVideo);
    }else {
      event.preventDefault();
    }
  });

  player.on("resumeVideo.vce", function (event, currentVideo) {
    if (_currentStatus === 'started') {
      if (currentVideo.ready) {
        currentVideo.resume();
        currentVideo.seek(_maxProgress > _currentMaxProgress ? _maxProgress : _currentMaxProgress);
      }else {
        currentVideo.on("progress.seeking", function (event, cv) {
          if (cv.video.time >= _maxProgress) {
            cv.off("progress.seeking");
          }

          cv.seek(_maxProgress);
        });

        currentVideo.load();
      }
    }
  });

  player.one("resume.seek.vce", function (event, currentVideo) {
    if (!currentVideo.conf.completed && _maxProgress) {
      currentVideo.on("progress.seeking", function (event, cv) {
        if (cv.video.time >= _maxProgress) {
          cv.off("progress.seeking");
        }

        cv.seek(_maxProgress);
      });

      currentVideo.load();
    }
  });

  player.on("beforeShutdown.vce", function (event, currentVideo) {
    if (!currentVideo.conf.completed) sendProgressBeacon(currentVideo);
  });

  // functions

  function updateCurrentProgress(currentVideo) {
    if (!currentVideo.video.time) return;

    const progress = Math.floor(currentVideo.video.time);
    const currentTimeStamp = Date.now();

    if (_currentMaxProgress && progress < _currentMaxProgress) return;
    if (_currentMaxProgress && _lastProgressChangeAt && Math.floor(Math.abs(currentTimeStamp - _lastProgressChangeAt + 1) * (currentVideo.currentSpeed > 1 ? currentVideo.currentSpeed : 1) / 1000) < (_maxProgress ? progress - _maxProgress : progress - _currentMaxProgress)) return;

    _currentMaxProgress = progress;
    _lastProgressChangeAt = currentTimeStamp;

    if ((!_maxProgress || _currentMaxProgress >= _maxProgress) && !currentVideo.conf.completed) sendProgressUpdate(currentVideo);
  }

  function sendProgressUpdate(currentVideo) {
    $.ajax({
      url: '/student_lesson/update_video_history',
      data: {
        id: classIdForVideoCompletion(),
        lesson_id: lessonIdForVideoCompletion(),
        section_id: sectionIdForVideoCompletion(),
        resource_id: currentVideo.conf.resourceId,
        progress: _currentMaxProgress,
        duration: currentVideo.conf.duration
      },
      type: 'POST',
      xhrFields: {
        withCredentials: true
      },
      success: function (response) {
        if (response.error === null) {
          if (response.data.progress > _maxProgress) _maxProgress = response.data.progress;
          if (response.data.finished) {
            currentVideo.conf.completed = true;
            _currentStatus = 'finished';
            updateStatusSpan(currentVideo.conf.resourceId);
            document.querySelector(`#video_status_${currentVideo.conf.resourceId}`).dataset.completed = true;

            if (canAccessParentWindow()) window.opener.document.querySelector(`#video_status_${currentVideo.conf.resourceId}`).dataset.completed = true;
            if (allVideosCompleted()) enableDynamicButtons(currentVideo);

            triggerAutoplay(currentVideo);
          }
        }
      }
    })
  }

  function sendProgressBeacon(currentVideo) {
    if (_currentMaxProgress && currentVideo.conf.duration) {
      Excalibur.Router.send_beacon('/student_lesson/update_video_history', {
        id: classIdForVideoCompletion(),
        lesson_id: lessonIdForVideoCompletion(),
        section_id: sectionIdForVideoCompletion(),
        resource_id: currentVideo.conf.resourceId,
        progress: _currentMaxProgress,
        duration: currentVideo.conf.duration
      });
    }
  }

  function updateStatusSpan(resourceId) {
    const span = document.querySelector(`#video_status_${resourceId} span`);
    const parentWindowSpan = canAccessParentWindow() ? window.opener.document.querySelector(`#video_status_${resourceId} span`) : null;

    switch (_currentStatus) {
      case 'not-started':
        if (span) span.textContent = video_not_started_text;
        if (parentWindowSpan) parentWindowSpan.textContent = video_not_started_text;
        break;

      case 'started':
        if (span) span.textContent = video_started_text;
        if (parentWindowSpan) parentWindowSpan.textContent = video_started_text;
        break;

      case 'playing':
        if (span) span.textContent = video_playing_text;
        if (parentWindowSpan) parentWindowSpan.textContent = video_playing_text;
        break;

      case 'finished':
        if (span) span.textContent = video_finished_text;
        if (parentWindowSpan) parentWindowSpan.textContent = video_finished_text;
        break
    }
  }

  function enableDynamicButtons(currentVideo) {
    const parentDocument = typeof require_video_completion !== 'undefined' ? window.document : window.opener.document;

    parentDocument.querySelectorAll('[id="dynamic_button"]').forEach(function (button) {
      button.classList.remove("locked");

      if (button.dataset.next_url) button.href = button.dataset.next_url;
      if (button.dataset.next_text) button.text = button.dataset.next_text;

      const img = document.createElement("img");
      const buttonIcon = button.querySelector('i');
      img.src = '/images/icons/large-arrow-white.svg';

      if (buttonIcon) button.replaceChild(img, buttonIcon);
    });
  }

  function allVideosCompleted() {
    let allCompleted = true;
    const targetDocument = canAccessParentWindow() ? window.opener.document : window.document;

    targetDocument.querySelectorAll('[id*="video_status_"]').forEach(function (statusDiv) {
      const player = flowplayer(targetDocument.querySelector(`[data-resource-id="${statusDiv.dataset.resourceId}"]`));

      if (player) {
        if (!player.conf.completed) allCompleted = false;
      }else if (statusDiv.dataset.completed !== "true") allCompleted = false;
    });

    return allCompleted;
  }

  function triggerAutoplay(currentVideo) {
    if (isAutoplayEnabled()) currentVideo.trigger('autoplayNextVideo', [currentVideo]);
  }

  function classIdForVideoCompletion() {
    return (typeof require_video_completion !== 'undefined') ? class_id_for_video_completion : window.opener.class_id_for_video_completion;
  }

  function lessonIdForVideoCompletion() {
    return (typeof require_video_completion !== 'undefined') ? lesson_id_for_video_completion : window.opener.lesson_id_for_video_completion;
  }

  function sectionIdForVideoCompletion() {
    return (typeof require_video_completion !== 'undefined') ? section_id_for_video_completion : window.opener.section_id_for_video_completion;
  }
}

function isVideoCompletionEnabled() {
  return (typeof window.require_video_completion !== 'undefined' || (canAccessParentWindow() && typeof window.opener.require_video_completion !== 'undefined'));
}

function resumeVideo(element) {
  const player = flowplayer(document.querySelector(`[data-resource-id="${element.parentElement.dataset.resourceId}"]`));
  player.trigger('resumeVideo', [player]);
}

function resumeVideoInNewWindow(element) {
  const videoHref = document.querySelector(`#video_${element.parentElement.dataset.resourceId} a`);
  videoHref.href = videoHref.href.replace(');', ', true);');
  videoHref.click();
}

/*******************************************************
 ********** Video activity detector extension **********
 *******************************************************/

function VideoActivityDetectorExtension(player) {
  // events

  player.on('resume.vad', function (event, currentVideo) {
    triggerVideoActivityDetectorStatusUpdate({videoPlaying: true});
  });

  player.on('pause.vad', function (event, currentVideo) {
    triggerVideoActivityDetectorStatusUpdate({videoPlaying: false});
  });

  player.on('finish.vad', function (event, currentVideo) {
    triggerVideoActivityDetectorStatusUpdate({videoPlaying: false});
  });

  // helpers

  function triggerVideoActivityDetectorStatusUpdate(statusData) {
    $(window).trigger('videoActivityDetector', statusData);
  }
}

/*******************************************************
 ******************* General helpers *******************
 *******************************************************/

function canAccessParentWindow() {
  if (!window.opener) return false;

  try {
    // Try to access the document attribute - if this throws, we can't access the parent
    window.opener.document ;
    return true;
  } catch (e) {
    return false;
  }
}