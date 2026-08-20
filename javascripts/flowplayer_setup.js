// Flowplayer setup
function flowplayerSetup(key, type, id, width, height, file, file_type, autostart, controlbar, image, caption, no_redirect, resource_id, vhcs, vhmp) {
    let o_file = file;

    try {
        file = window.atob(file);
    } catch(e) {
        console.log('not encoded');
    }
    if (no_redirect && window.navigator.onLine) {
        on_ready(function () {
            $.get(file.replace('/files/', '/blob/get_s3_url/'), function (response) {
                if (response.status == 'ok') {
                    o_file = response.s3_url;
                }

                flowplayerSetup(key, type, id, width, height, o_file, file_type, autostart, controlbar, image, caption, false, resource_id, vhcs, vhmp);
            });
        });
    } else {
        const name = file.split('?')[0].split('/').pop().replace(/_lmsauth_\w+/, '');
        let $elem;

        if (type == 'audio') {
            $elem = document.getElementById("flowpa" + id).parentNode;
        } else if (type == 'video') {
            const flowpv = document.getElementById("flowpv" + id);
            $elem = flowpv.parentNode;
            flowpv.dataset.resourceId = resource_id;
        }

        if (!hasClass($elem, "_processed")) {
            if (controlbar == "over" && hasParentId($elem, "news1")) {
                const newCode = "" + '<a href="javascript:void(0);" onclick=\'showVideo("' + key + '", "' + type + '", "' + id + '", "' + width + '", "' + height + '", "' + file + '", "' + file_type + '", ' + image + ', "' + caption + '" ,' + resource_id + ', "' + vhcs + '", ' + vhmp + ')\'>' + '<img src="/images/icons/video-play.png" width="40" alt="' + name + '" title="' + name + '" />' + '</a>' + '<span>' + name + '</span>';
                const newElem = document.createElement('p');
                newElem.innerHTML = newCode;
                newElem.setAttribute("id", 'videoPrev' + id);
                $elem.parentNode.insertBefore(newElem, $elem);
                $elem.style.display = 'none';
            } else {
                if ($elem.getAttribute("class")) {
                    $elem.setAttribute("class", $elem.getAttribute("class") + " _processed" + (is_responsive_flowplayer(height) ? " responsive_flowplayer" : ""));
                } else {
                    $elem.setAttribute("class", "_processed" + (is_responsive_flowplayer(height) ? " responsive_flowplayer" : ""));
                }

                setup_player(key, type, id, width, height, file, file_type, autostart, image, caption, resource_id, vhcs, vhmp);
            }
        }
    }
}

function is_responsive_flowplayer(height) {
    return ((height.indexOf(':') != -1) || (window.innerWidth < 768));
}

function hasClass(el, cls) {
    var elemClassName = el.getAttribute("class");
    return ((" " + elemClassName + " ").replace(/[\n\t]/g, " ").indexOf(cls) > -1);
}

function showVideo(key, type, id, width, height, file, file_type, image, caption, resource_id, vhcs, vhmp) {
    if (type == 'audio') {
        var $elem = document.getElementById("flowpa" + id).parentNode;
    } else if (type == 'video') {
        var $elem = document.getElementById("flowpv" + id).parentNode;
    }

    var $p = document.getElementById("videoPrev" + id);
    $p.parentNode.removeChild($p);

    if (!hasClass($elem, "_processed")) {
        $elem.style.display = "block";

        if ($elem.getAttribute("class")) {
            $elem.setAttribute("class", $elem.getAttribute("class") + " _processed");
        } else {
            $elem.setAttribute("class", "_processed");
        }

        setup_player(key, type, id, width, height, file, file_type, true, image, caption, resource_id, vhcs, vhmp);

        if (type == 'video') {
            flowplayer(document.getElementById('flowpv' + id)).play();
        }
    }
}

function hasParentId(el, id) {
    var $parent = el.parentNode;

    while ($parent.getAttribute) {
        if ($parent.getAttribute("id") == id) {
            return true;
        }

        $parent = $parent.parentNode;
    }

    return false;
}

function setup_player(key, type, id, width, height, file, file_type, autostart, image, caption, resource_id, vhcs, vhmp) {
    var options = {
        key: key,
        swf: '/libraries/flowplayer/7.2.7/flowplayer.swf',
        swfHls: '/libraries/flowplayer/7.2.7/flowplayerhls.swf',
        autoplay: autostart,
        native_fullscreen: true,
        fullscreen: true,
        share: false,
        clip: {
            sources: [
                {type: file_type, src: file}
            ]
        },
        embed: false,
        debug: is_flowplayer_debug_mode(),
        playerId: `#flowpv${id}`,
        resourceId: resource_id,
        completed: vhcs === 'finished'
    };

    if (type == 'audio') {
        var container = document.getElementById('flowpa' + id);
        container.innerHTML = '';

        options.audio = true;
        options.audioOnly = true;
        options.clip.audio = true;
    } else if (type == 'video') {
        var container = document.getElementById('flowpv' + id);
        container.innerHTML = '';

      if (caption != null) {
        options.clip.subtitles = [
          { "default": true, kind: "subtitles", srclang: "en", label: "Track 1", src: caption }
        ]
      }
    }

    if (is_responsive_flowplayer(height)) {
        //options.ratio = ((window.innerWidth < 768) ? '16:9' : height);
        options.adaptiveRatio = true;

        container.style.width = ((window.innerWidth < 768) ? '100%' : width);
    } else {
        container.style.width = width;
        container.style.height = height;
    }

    if (autostart != true) {
        options.splash = true;
    } else {
        options.splash = false;
    }

    const player = flowplayer(container, options);
    // video activity detector
    new VideoActivityDetectorExtension(player);
    // video autoplay
    if (isAutoplayEnabled()) new VideoAutoplayExtension(player);
    // video completion
    if (resource_id && isVideoCompletionEnabled()) new VideoCompletionExtension(player, vhcs, vhmp);
}

on_ready(function () {
    $(window).on('beforexload', function () {
        window.flowplayer && flowplayer.resetPlayer();
    });
})
