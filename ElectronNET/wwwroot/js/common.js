//// v0.8.0.20190701

// Cosmos中一个json Document的大小限制是2MB = 2x1024=2048 KB = 2048x1024=2,097,152‬ bytes
//2038x1024 = 2,086,912
const MaxSizeInBytes_CosmosDocument = 2086912;


// https://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
// performance: https://jsperf.com/utf-8-byte-length
function getSizeInBytesOfString(str) {
    // returns the byte length of an utf8 string
    var s = str.length;
    for (var i = str.length - 1; i >= 0; i--) {
        var code = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff) s++;
        else if (code > 0x7ff && code <= 0xffff) s += 2;
        if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
}

function getSizeInBytesOfJSON(j) {
    var str = JSON.stringify(j);
    return getSizeInBytesOfString(str);
}

function getStringSizePercent(str, maxSizeInBytes = MaxSizeInBytes_CosmosDocument, fractionDigits = 3) {
    var size = getSizeInBytesOfString(str);
    var p = size * 100 / maxSizeInBytes;
    return p.toFixed(fractionDigits);
}

function getJsonSizePercent(j, maxSizeInBytes = MaxSizeInBytes_CosmosDocument, fractionDigits = 3) {
    var size = getSizeInBytesOfJSON(j);
    var p = size * 100 / maxSizeInBytes;
    return p.toFixed(fractionDigits);
}

function showCharm(id) {
    //var charm = $("#" + id).data("charms");
    //charm.open();
    Metro.charms.open("#" + id);
}

function hideCharm(id) {
    //var charm = $("#" + id).data("charms");
    //charm.close();
    Metro.charms.close("#" + id);
}

function showOrHideCharm(id) {
    Metro.charms.toggle("#" + id);
}

//function showOrHideCharm(id, canClose) {
//    //var charm = $("#" + id).data("charms");
//    //if (charm.element.data("opened") === true && canClose === true) {
//    //    charm.close();
//    //} else {
//    //    charm.open();
//    //}
//    if (Metro.charms.isOpen("#" + id) === true && canClose === true) {
//        Metro.charms.close("#" + id);
//    } else {
//        Metro.charms.open("#" + id);
//    }
//}

function disableElement(id) {
    $("#" + id).attr('disabled', true);
}

function enableElement(id) {
    $("#" + id).attr('disabled', false);
}


function launchFullScreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function setupFullScreen(element, callbackFullScreenChange) {
    if (element.addEventListener) { // listen to exitFullScreen
        element.addEventListener('webkitfullscreenchange', () => {
            if (callbackFullScreenChange) {
                callbackFullScreenChange();
            }
        }, false);
        element.addEventListener('mozfullscreenchange', () => {
            if (callbackFullScreenChange) {
                callbackFullScreenChange();
            }
        }, false);
        element.addEventListener('fullscreenchange', () => {
            if (callbackFullScreenChange) {
                callbackFullScreenChange();
            }
        }, false);
        element.addEventListener('MSFullscreenChange', () => {
            if (callbackFullScreenChange) {
                callbackFullScreenChange();
            }
        }, false);
    }
}


function showError(msg) {
    // Notify
    //var notify = Metro.notify;
    //notify.setup({
    //    width: 300,
    //    cls: "alert",
    //    timeout: 2500
    //});
    //notify.create(msg, null, {
    //    cls: "alert"
    //});
    //notify.reset();

    // toast
    var toast = Metro.toast.create;
    toast(msg, null, 5000, "bg-red fg-white");
}

function showMessage(msg) {
    // notify
    //var notify = Metro.notify;
    //notify.setup({
    //    width: 300,
    //    timeout: 2500
    //});
    //notify.create(msg, null, {
    //    cls: "success"
    //});
    //notify.reset();

    // toast
    var toast = Metro.toast.create;
    toast(msg, null, 5000, "bg-green fg-white");
}

function redirectUsingPost(url, ajaxData) {
    $.ajax({
        url: url,
        dataType: "json",
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data: ajaxData,
        async: true,
        processData: false,
        cache: false
    });
}

// 重定向的URL通过响应的信息提供
function postAndRedirect(url, ajaxData, buttonId, divMessageId) {
    if (buttonId)
        $("#" + buttonId).attr('disabled', true);
    if (divMessageId)
        $("#" + divMessageId).html();
    $.ajax({
        url: url,
        dataType: "json",
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data: ajaxData,
        async: true,
        processData: false,
        cache: false,
        success: function (data, textStatus, XmlHttpRequest) {
            data = JSON.parse(XmlHttpRequest.responseText);
            if (data.success === false) {
                //displayError(data.error);
                $("#" + divMessageId).html("<p>" + data.error + "</p>");
                if (buttonId)
                    $("#" + buttonId).attr('disabled', false);
                return;
            }
            // success: redirect
            location.href = data.url;
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            var data = "【Status】" + textStatus + "【error】" + errorThrown + "【others】" + XmlHttpRequest.responseText;
            //displayError(data);
            $("#" + divMessageId).html("<p>" + data + "</p>");
            if (buttonId)
                $("#" + buttonId).attr('disabled', false);
        }
    });
}

// 重定向的URL通过响应的信息提供
function saveAndRedirect(url, ajaxData, buttonId) {
    if (buttonId)
        $("#" + buttonId).attr('disabled', true);
    $.ajax({
        url: url,
        dataType: "json",
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data: ajaxData,
        async: true,
        processData: false,
        cache: false,
        success: function (data, textStatus, XmlHttpRequest) {
            data = JSON.parse(XmlHttpRequest.responseText);
            if (data.success === false) {
                showError(data.error);
                if (buttonId)
                    $("#" + buttonId).attr('disabled', false);
                return;
            }
            // success: redirect
            location.href = data.url;
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            var data = "【Status】" + textStatus + "【error】" + errorThrown + "【others】" + XmlHttpRequest.responseText;
            showError(data);
            if (buttonId)
                $("#" + buttonId).attr('disabled', false);
        }
    });
}

function saveAndShowMessage(url, ajaxData, buttonId) {
    $.ajax({
        url: url,
        dataType: "json",
        type: "POST",
        contentType: 'application/json; charset=utf-8',
        data: ajaxData,
        async: true,
        processData: false,
        cache: false,
        success: function (data, textStatus, XmlHttpRequest) {
            data = JSON.parse(XmlHttpRequest.responseText);
            //console.log(data);
            if (data.success === false) {
                showError(data.error);
                if (buttonId)
                    $("#" + buttonId).attr('disabled', false);
                return;
            }
            // success: show message
            showMessage(data.message);
            $("#" + buttonId).attr('disabled', false);
        },
        error: function (XmlHttpRequest, textStatus, errorThrown) {
            var data = "【Status】" + textStatus + "【error】" + errorThrown + "【others】" + XmlHttpRequest.responseText;
            showError(data);
            $("#" + buttonId).attr('disabled', false);
        }
    });
}

function refreshLanguage(lang) {
    $.post('/common/set-language',
        {
            language: lang
        },
        function (data, textStatus, jqXHR) {
            // refersh
            window.location.href = window.location.href;
        },
        "text");
}

// 需要调用sha512.js的内容
function generateRobotAvatar(site, username, imageExt = ".png") {
    var shaObj = new jsSHA("SHA-1", "TEXT");
    shaObj.update(username + "@" + site);
    var hash = shaObj.getHash("HEX");
    return "https://robohash.org/" + hash + imageExt;
}