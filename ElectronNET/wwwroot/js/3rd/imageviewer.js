// Ref: http://www.ibm.com/developerworks/cn/web/0912_yanlin_htmlcanvas/


function ImageViewer() {

    // ==== 绘制导航框 ====

    const NAVPANEL_COLOR = 'rgba(100, 100, 100, 0.2)';    // 导航栏背景色
    const NAVBUTTON_BACKGROUND = 'rgb(40, 40, 40)';  // 导航栏中 button 的背景色
    const NAVBUTTON_COLOR = 'rgb(255, 255, 255)';   //button 的前景色
    const NAVBUTTON_HL_COLOR = 'rgb(100, 100, 100)';   //button 高亮时的前景色
    // 原文未指明下面几个常量的值
    const NAVBUTTON_XOFFSET = 0;
    const NAVBUTTON_YOFFSET = 0;
    const NAVBUTTON_ARROW_XOFFSET = 0;
    const NAVBUTTON_ARROW_YOFFSET = 0;
    const NAVBUTTON_WIDTH = 10;
    const NAVPANEL_HEIGHT = 50;
    // 导航栏距离Canvas底部的距离
    const NAVPANEL_BOTTOM_OFFSET = 2;

    const PAINT_INTERVAL = 20;  // 循环间隔
    const PAINT_SLOW_INTERVAL = 20000;
    const IDLE_TIME_OUT = 3000;  // 空闲超时时间

    const HL_OFFSET = 3;
    const THUMBNAIL_LENGTH = NAVPANEL_HEIGHT - NAVBUTTON_YOFFSET * 2;   // 缩略图显示区域的高度
    const MIN_THUMBNAIL_LENGTH = 10;  // 最小缩略图间隔

    const ARROW_HEIGHT = 10;  // 下方三角形的高度
    const BORDER_WRAPPER = 2;   // 边缘白框的厚度

    var currentImage = 0;   // 当前图片序号
    var firstImageIndex = 0;  // 当前缩略图中第一张图片序号
    var thumbnailInfo;
    var thumbNailCount = 0;  // 当前显示的缩略图数
    var maxThumbNailCount = 0;  // 最大能够显示的缩略图数
    var navRegion;
    var lButtonRect, rButtonRect;

    // 原文缺失下面几个变量：
    var images = [];
    // 定义全部图片 URL 数组
    var imageLocations = [];
    var imageRects = []; // 缩略图的位置信息
    var loadedImages = false;
    var imageCount = 0;

    var window_width = document.documentElement.clientWidth * 0.75;
    var window_height = document.documentElement.clientHeight * 0.8;

    var canvas = document.getElementById('image_viewer_canvas');   // 获得 canvas 对象
    var context = canvas.getContext('2d');    // 获得上下文对象
    var canvasX, canvasY;
    // 缩放比率
    var scaleRatio = -1;
    var drawImageAt;

    var lastMousePos;    // 当前鼠标位置
    var leftButtonDownPos; // 鼠标左键按下的位置
    var leftButtonDown = false; // 鼠标左键是否按下
    var posVector = { x: 0, y: 0 };
    var idleTime; // 空闲时间

    // 绘制左边 button 
    function paintLeftButton(navRect, color) {
        //left button 
        //lButtonRect = {
        //    x: navRect.x + NAVBUTTON_XOFFSET,
        //    y: navRect.y + NAVBUTTON_YOFFSET,
        //    width: NAVBUTTON_WIDTH,
        //    height: navRect.height - NAVBUTTON_YOFFSET * 2
        //}

        context.save();
        context.fillStyle = color;
        context.fillRect(lButtonRect.x, lButtonRect.y,
            lButtonRect.width, lButtonRect.height);

        //left arrow 
        context.save();
        context.fillStyle = NAVBUTTON_COLOR;
        context.beginPath();
        context.moveTo(lButtonRect.x + NAVBUTTON_ARROW_XOFFSET,
            lButtonRect.y + lButtonRect.height / 2);
        context.lineTo(lButtonRect.x + lButtonRect.width - NAVBUTTON_ARROW_XOFFSET,
            lButtonRect.y + NAVBUTTON_ARROW_YOFFSET);
        context.lineTo(lButtonRect.x + lButtonRect.width - NAVBUTTON_ARROW_XOFFSET,
            lButtonRect.y + lButtonRect.height - NAVBUTTON_ARROW_YOFFSET);
        context.lineTo(lButtonRect.x + NAVBUTTON_ARROW_XOFFSET,
            lButtonRect.y + lButtonRect.height / 2);
        context.closePath();
        context.fill();
        context.restore();
        // 因为上面save了2次，所以要恢复2次
        context.restore();
    }

    // 原文中缺失该函数：绘制右边 button 
    function paintRightButton(navRect, color) {
        //right button 
        //rButtonRect = {
        //    x: navRect.x + navRect.width - NAVBUTTON_XOFFSET,
        //    y: navRect.y + navRect.width - NAVBUTTON_YOFFSET,
        //    width: NAVBUTTON_WIDTH,
        //    height: navRect.height - NAVBUTTON_YOFFSET * 2
        //}

        context.save();
        context.fillStyle = color;
        context.fillRect(rButtonRect.x, rButtonRect.y,
            rButtonRect.width, rButtonRect.height);

        //right arrow 
        context.save();
        context.fillStyle = NAVBUTTON_COLOR;
        context.beginPath();
        context.moveTo(rButtonRect.x + NAVBUTTON_ARROW_XOFFSET,
            rButtonRect.y + NAVBUTTON_ARROW_YOFFSET);
        context.lineTo(rButtonRect.x + rButtonRect.width - NAVBUTTON_ARROW_XOFFSET,
            rButtonRect.y + rButtonRect.height / 2);
        context.lineTo(rButtonRect.x + NAVBUTTON_ARROW_XOFFSET,
            rButtonRect.y + rButtonRect.height - NAVBUTTON_ARROW_YOFFSET);
        context.lineTo(rButtonRect.x + NAVBUTTON_ARROW_XOFFSET,
            rButtonRect.y + NAVBUTTON_ARROW_YOFFSET);
        context.closePath();
        context.fill();
        context.restore();
        // 因为上面save了2次，所以要恢复2次
        context.restore();
    }

    function pointIsInRect(point, rect) {
        return (rect.x < point.x && point.x < rect.x + rect.width &&
                rect.y < point.y && point.y < rect.y + rect.height);
    }

    function paint() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        paintImage(currentImage);
        var paintInfo = { inLeftBtn: false, inRightBtn: false, inThumbIndex: null }

        if (lastMousePos && navRegion && lButtonRect && rButtonRect) {
            if (pointIsInRect(lastMousePos, navRegion)) {
                updateIdleTime(); // Jerin@2014-8-12：鼠标如果在导航栏区域，更新空闲时间
                paintInfo.inLeftBtn = pointIsInRect(lastMousePos, lButtonRect);
                paintInfo.inRightBtn = pointIsInRect(lastMousePos, rButtonRect);
                if (!paintInfo.inLeftBtn && !paintInfo.inRightBtn) {
                    var index = findSelectImageIndex(lastMousePos);
                    if (index != -1) {
                        paintInfo.inThumbIndex = index;
                    }
                }
            }
        }
        // 当空闲时间超过阀值时，导航栏能够自动隐藏
        if (idleTime && getTime() - idleTime <= IDLE_TIME_OUT) {
            paintNavigator(paintInfo);
        }
    }

    // 返回所点击的缩略图序号，如果没有点击缩略图则返回 -1 
    function findSelectImageIndex(point) {
        for (var i = 0; i < imageRects.length; i++) {
            if (pointIsInRect(point, imageRects[i].rect))
                return i + firstImageIndex;
        }
        return -1;
    }

    // 将当前图片序号设为 index，重画
    function selectImage(index) {
        currentImage = index;
        scaleRatio = -1;
        posVector = { x: 0, y: 0 };
        paint();
    }

    // 将缩略图翻页，更新缩略图中第一张图片的序号
    function nextPane(previous) {
        if (previous) {
            firstImageIndex = firstImageIndex - maxThumbNailCount < 0 ?
                0 : firstImageIndex - maxThumbNailCount;
        } else {
            firstImageIndex = firstImageIndex + maxThumbNailCount * 2 - 1 > imageCount - 1 ?
                (imageCount - maxThumbNailCount > 0 ? imageCount - maxThumbNailCount : 0) :
                firstImageIndex + maxThumbNailCount;
        }
        currentImage = (firstImageIndex <= currentImage &&
            currentImage <= firstImageIndex + maxThumbNailCount) ? currentImage : firstImageIndex;
        scaleRatio = -1;
        paint();
    }

    // 鼠标移动
    function onMouseMove(event) {
        lastMousePos = { x: event.clientX - canvasX, y: event.clientY - canvasY };
        if (leftButtonDown) {
            posVector = { x: lastMousePos.x - leftButtonDownPos.x, y: lastMousePos.y - leftButtonDownPos.y };
        }
        paint();
    }

    // 鼠标点击事件处理
    function onMouseClick(event) {
        point = { x: event.clientX - canvasX, y: event.clientY - canvasY };
        lastMousePos = point;

        if (pointIsInRect(point, lButtonRect)) {
            nextPane(true);
        } else if (pointIsInRect(point, rButtonRect)) {
            nextPane(false);
        } else {
            var selectedIndex = findSelectImageIndex(point);
            if (selectedIndex != -1) {
                selectImage(selectedIndex);
            }
        }
        updateIdleTime();
    }

    // 鼠标滑轮滚动
    function onMouseWheel(event) {
        var tmp = scaleRatio;
        var delta = 0;
        //var minChange = scaleRatio <= 1 ? 0.1 : 0.2;
        if (event.wheelDelta) // ie, opera
            delta = event.wheelDelta;
        else if (event.detail) // firefox
            delta = -event.detail;
        // 缩放
        if (delta > 0)
            //scaleRatio += minChange;
            scaleRatio *= 1.1;
        else if (delta < 0)
            //scaleRatio -= minChange;
            scaleRatio /= 1.1;
        // 界限判断
        if (scaleRatio <= 0.2)
            scaleRatio = 0.2;
        else if (scaleRatio >= 10)
            scaleRatio = 10;
        // 如果与旧值相差太小，不重绘
        var deltaScaleRatio = tmp - scaleRatio;
        if (Math.abs(deltaScaleRatio) >= 0.0001)
        {
            // 更新绘制的位置
            var image = images[currentImage];
            var img_h = image.height * scaleRatio;
            var img_w = image.width * scaleRatio;
            drawImageAt = { x: (canvas.width - img_w) / 2, y: (canvas.height - img_h) / 2 };
            // 重绘
            paint();
        }
    }

    function onMouseDown(event) {
        if (event.button == 1 || event.which == 1) {
            leftButtonDown = true;
            leftButtonDownPos = { x: event.clientX - canvasX, y: event.clientY - canvasY };
        }
    }

    function onMouseUp(event) {
        leftButtonDown = false;
        // 更新绘制的位置
        drawImageAt = { x: drawImageAt.x + posVector.x, y: drawImageAt.y + posVector.y };
        posVector = { x: 0, y: 0 };
    }

    // 原文中缺失该函数：绘制底部的导航栏
    function paintNavigator(paintInfo) {
        // 根据代码，有关于参数的初始化：var paintInfo = { inLeftBtn: false, inRightBtn: false, inThumbIndex: null } // inThumbIndex: int
        // 如果只有一张图片，不绘制导航栏
        if (imageLocations.length <= 1)
            return;

        // 绘制背景矩形
        context.save();
        context.fillStyle = NAVPANEL_COLOR;
        context.fillRect(navRegion.x, navRegion.y, navRegion.width, navRegion.height);
        context.restore();

        // 绘制导航按钮
        if (paintInfo.inLeftBtn)
            paintLeftButton(navRegion, NAVBUTTON_HL_COLOR);
        else
            paintLeftButton(navRegion, NAVBUTTON_COLOR);

        if (paintInfo.inRightBtn)
            paintRightButton(navRegion, NAVBUTTON_HL_COLOR);
        else
            paintRightButton(navRegion, NAVBUTTON_COLOR);

        // 绘制缩略图
        paintThumbNails(paintInfo.inThumbIndex);

        // 绘制预览图
        if (paintInfo.inThumbIndex != null) {
            var index = paintInfo.inThumbIndex + firstImageIndex;
            var image = images[index];

            var offset = thumbnailInfo.Offset;

            var x = lButtonRect.x + lButtonRect.width + (offset + THUMBNAIL_LENGTH) * index;
            var srcRect = getSlicingSrcRect({ width: image.width, height: image.height },
                { width: THUMBNAIL_LENGTH, height: THUMBNAIL_LENGTH });
            var imageRect = {
                image: image,
                rect: {
                    x: x + offset,
                    y: navRegion.y + NAVBUTTON_YOFFSET - HL_OFFSET,
                    height: THUMBNAIL_LENGTH,
                    width: THUMBNAIL_LENGTH
                }
            }
            paintHighLightImage(srcRect, imageRect);
        }
    }

    // 原文中缺失该函数
    function getTime() {
        var t = new Date();
        return t.getTime();
    }

    // 原文中缺失该函数
    function updateIdleTime() {
        idleTime = getTime();
    }


    // ==== 加载和显示图像 ====

    // 加载图片
    function loadImages() {
        loadedImages = false;

        var total = imageLocations.length;
        var imageCounter = 0;
        var onLoad = function (err, msg) {
            if (err) {
                console.log(msg);
            }
            imageCounter++;
            if (imageCounter == total) { // 图片载入完成
                loadedImages = true;
                // 设置默认图片
                selectImage(0);
            }
        }

        for (var i = 0; i < imageLocations.length; i++) {
            var img = new Image();
            img.onload = function () { onLoad(false); };
            img.onerror = function () { onLoad(true, e); };
            img.src = imageLocations[i];
            images[i] = img;
        }
        imageCount = imageLocations.length;
    }

    // 绘制图片
    function paintImage(index) {
        if (!loadedImages)
            return;
        var image = images[index];
        var screen_h = canvas.height;
        var screen_w = canvas.width;
        var newImage = (scaleRatio < 0);
        
        if (newImage) { // 新载入的图片，重新计算缩放比率
            scaleRatio = getScaleRatio({ width: image.width, height: image.height },
                { width: screen_w, height: screen_h }
                );
        }
        var img_h = image.height * scaleRatio;
        var img_w = image.width * scaleRatio;
        if (newImage) // 新载入的图片，重新计算绘制的位置；但是，当用鼠标滑轮缩放时，需要在MouseWheel中更新drawImageAt
            drawImageAt = { x: (screen_w - img_w) / 2, y: (screen_h - img_h) / 2 };
        context.drawImage(image, drawImageAt.x + posVector.x, drawImageAt.y + posVector.y, img_w, img_h);
    }

    // 原文中缺失该函数
    function getScaleRatio(imageSize, canvasSize) {
        if (imageSize.width <= canvasSize.width && imageSize.height <= canvasSize.height) // 画布比图片大，使用原比例
            return 1;
        // 其它情况，分别判断宽、高比率，使用较小的那个
        var w = canvasSize.width / imageSize.width;
        var h = canvasSize.height / imageSize.height;
        return w >= h ? h : w;
    }

    function initScaleRatio(imageSize, canvasSize) {
        if (imageSize.width <= canvasSize.width && imageSize.height <= canvasSize.height) // 画布比图片大，使用原比例
        {
            scaleRatio = 1.0;
            return;
        }
        // 其它情况，分别判断宽、高比率，使用较小的那个
        var w = canvasSize.width / imageSize.width;
        var h = canvasSize.height / imageSize.height;
        scaleRatio = (w >= h ? h : w);
        return;
    }


    // ==== 缩略图 ====

    function computeThumbNailInfo() {
        var thumbnail_length = rButtonRect.x - lButtonRect.x - lButtonRect.width;
        var maxThumbNailCount = Math.ceil(thumbnail_length / THUMBNAIL_LENGTH);
        var offset = (thumbnail_length - THUMBNAIL_LENGTH * maxThumbNailCount) / (maxThumbNailCount + 1);
        if (offset < MIN_THUMBNAIL_LENGTH) {
            maxThumbNailCount = Math.ceil(thumbnail_length / (THUMBNAIL_LENGTH + MIN_THUMBNAIL_LENGTH));
            offset = (thumbnail_length - THUMBNAIL_LENGTH * maxThumbNailCount) / (maxThumbNailCount + 1);
        }
        return {
            MaxThumbNailCount: maxThumbNailCount,
            Offset: offset
        };
    }

    // 原文中缺失该函数：返回一个 rect 对象，包括了应该截取原图的哪些区域
    function getSlicingSrcRect(imageSize, thumbnailSize) {
        var x = 0;
        var y = 0;
        var w = 0;
        var h = 0;

        if (imageSize.width > canvas.width)
        {
            x = (imageSize.width - canvas.width) / 2;
            w = canvas.width;
        }
        else
        {
            x = 0;
            w = imageSize.width;
        }

        if (imageSize.height > canvas.height)
        {
            y = (imageSize.height - canvas.height) / 2;
            h = canvas.height;
        }
        else
        {
            y = 0;
            h = imageSize.height;
        }
        
        return {
            x: x,
            y: y,
            width: w,
            height: h
        };
    }

    // 绘制下方矩形导航栏上的缩略图，thumbNailCount（10左右）个
    function paintThumbNails(inThumbIndex) {
        if (!loadedImages)
            return;

        if (inThumbIndex != null) {
            inThumbIndex -= firstImageIndex;
        } else {
            inThumbIndex = -1;
        }

        //var thumbnail_length = rButtonRect.x - lButtonRect.x - lButtonRect.width;
        //maxThumbNailCount = Math.ceil(thumbnail_length / THUMBNAIL_LENGTH);
        //var offset = (thumbnail_length - THUMBNAIL_LENGTH * maxThumbNailCount) / (maxThumbNailCount + 1);
        //if (offset < MIN_THUMBNAIL_LENGTH) {
        //    maxThumbNailCount = Math.ceil(thumbnail_length / (THUMBNAIL_LENGTH + MIN_THUMBNAIL_LENGTH));
        //    offset = (thumbnail_length - THUMBNAIL_LENGTH * maxThumbNailCount) / (maxThumbNailCount + 1);
        //}
        
        var offset = thumbnailInfo.Offset;

        thumbNailCount = maxThumbNailCount > imageCount - firstImageIndex ? imageCount - firstImageIndex : maxThumbNailCount;

        imageRects = new Array(thumbNailCount);

        for (var i = 0; i < thumbNailCount; i++) {
            image = images[i + firstImageIndex];
            context.save();
            var x = lButtonRect.x + lButtonRect.width + (offset + THUMBNAIL_LENGTH) * i;
            srcRect = getSlicingSrcRect({ width: image.width, height: image.height },
                { width: THUMBNAIL_LENGTH, height: THUMBNAIL_LENGTH });
            imageRects[i] = {
                image: image,
                rect: {
                    x: x + offset,
                    y: inThumbIndex == i ? navRegion.y + NAVBUTTON_YOFFSET - HL_OFFSET : navRegion.y + NAVBUTTON_YOFFSET,
                    height: THUMBNAIL_LENGTH,
                    width: THUMBNAIL_LENGTH
                }
            }

            context.translate(x, navRegion.y);
            context.drawImage(image, srcRect.x, srcRect.y,
                srcRect.width, srcRect.height,
                offset, imageRects[i].rect.y - navRegion.y,
                THUMBNAIL_LENGTH, THUMBNAIL_LENGTH);
            context.restore();
        }
    }




    // ==== 缩略图预览 ====

    // 绘制预览图
    function paintHighLightImage(srcRect, imageRect) {
        var ratio = imageRect.image.width == srcRect.width ?
            THUMBNAIL_LENGTH / imageRect.image.width : THUMBNAIL_LENGTH / imageRect.image.height;
        ratio *= 1.5;

        var destRect = {
            x: imageRect.rect.x + imageRect.rect.width / 2 - imageRect.image.width * ratio / 2,
            y: navRegion.y - ARROW_HEIGHT - BORDER_WRAPPER - imageRect.image.height * ratio,
            width: imageRect.image.width * ratio,
            height: imageRect.image.height * ratio
        }

        var wrapperRect = {
            x: destRect.x - BORDER_WRAPPER,
            y: destRect.y - BORDER_WRAPPER,
            width: destRect.width + BORDER_WRAPPER * 2,
            height: destRect.height + BORDER_WRAPPER * 2
        }

        var arrowWidth = ARROW_HEIGHT * Math.tan(30 / 180 * Math.PI);

        context.save();
        context.fillStyle = 'white';
        context.translate(wrapperRect.x, wrapperRect.y);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(wrapperRect.width, 0);
        context.lineTo(wrapperRect.width, wrapperRect.height);
        context.lineTo(wrapperRect.width / 2 + arrowWidth, wrapperRect.height);
        context.lineTo(wrapperRect.width / 2, wrapperRect.height + ARROW_HEIGHT);
        context.lineTo(wrapperRect.width / 2 - arrowWidth, wrapperRect.height);
        context.lineTo(0, wrapperRect.height);
        context.lineTo(0, 0);
        context.closePath();
        context.fill();
        context.drawImage(imageRect.image, BORDER_WRAPPER, BORDER_WRAPPER,
            destRect.width, destRect.height);
        context.restore();
    }



    // 更新canvas大小，重绘
    function resize() {
        var size = getCanvasSize();
        canvas.width = size.width;
        canvas.height = size.height;
        canvasX = (document.documentElement.clientWidth - canvas.width) / 2;
        canvasY = (document.documentElement.clientHeight - canvas.height) / 2;
        
        // 更新导航栏区域的信息
        var navPanelWidth = canvas.width * 0.75; //THUMBNAIL_LENGTH * thumbNailCount + MIN_THUMBNAIL_LENGTH * (thumbNailCount + 1) + NAVBUTTON_WIDTH * 2 + NAVBUTTON_XOFFSET * 2;
        var posX = (canvas.width - navPanelWidth) / 2;
        var posY = canvas.height - NAVPANEL_HEIGHT - NAVPANEL_BOTTOM_OFFSET;
        navRegion = {
            x: posX,
            y: posY,
            width: navPanelWidth,
            height: NAVPANEL_HEIGHT
        };
        // 更新导航按钮区域的信息
        lButtonRect = {
            x: navRegion.x + NAVBUTTON_XOFFSET,
            y: navRegion.y + NAVBUTTON_YOFFSET,
            width: NAVBUTTON_WIDTH,
            height: navRegion.height - NAVBUTTON_YOFFSET * 2
        }
        rButtonRect = {
            x: navRegion.x + navRegion.width - NAVBUTTON_XOFFSET,
            y: navRegion.y + navRegion.width - NAVBUTTON_YOFFSET,
            width: NAVBUTTON_WIDTH,
            height: navRegion.height - NAVBUTTON_YOFFSET * 2
        }

        thumbnailInfo = computeThumbNailInfo();
        maxThumbNailCount = thumbnailInfo.MaxThumbNailCount;
        thumbNailCount = maxThumbNailCount > imageCount - firstImageIndex ? imageCount - firstImageIndex : maxThumbNailCount;

        // 重绘
        paint();
    }

    //// 获取屏幕大小
    //function getScreenSize() {
    //    return {
    //        width: document.documentElement.clientWidth,
    //        height: document.documentElement.clientHeight
    //    };
    //}
    // 获取Canvas大小
    function getCanvasSize() {
        // dialog window的内容区域：标题区域高32，Padding: 0,32,0,32
        return {
            width: window_width,
            height: window_height - 96
        };
    }

    // 原文中缺失该函数
    function startLoop() {
        // 初始图片选为第一张；或者使用定时器，每隔几秒翻页/移动一下
        if (images.length > 0)
            selectImage(0);
    }

    function setup () {
        //resize 
        resize();
        window.onresize = resize;

        //event binding 
        canvas.onclick = onMouseClick;
        canvas.onmousemove = onMouseMove;
        canvas.onmousedown = onMouseDown;
        canvas.onmouseup = onMouseUp;
        canvas.onmousewheel = onMouseWheel; // ie, opera
        if (canvas.addEventListener) { // firefox
            canvas.addEventListener('DOMMouseScroll', onMouseWheel, false);
        }

        loadImages();

        startLoop();
        updateIdleTime();
    }

    this.initialize = function(urlList, windowWidth, windowHeight) {
        if (urlList == null || urlList.length == 0)
            return;
        // clear
        while (imageLocations.length > 0)
            imageLocations.pop();
        // add new data
        for (var i = 0; i < urlList.length; i++)
            imageLocations.push(urlList[i]);

        if (windowWidth != null && windowWidth != undefined)
            window_width = windowWidth;
        if (windowHeight != null && windowHeight != undefined)
            window_height = windowHeight;
        // load
        setup();
    }

}

// 下面的函数用到了MetroUI的Dialog：http://metroui.org.ua/dialog.html
function showImagesInViewer(urisArray) {
    var w = document.documentElement.clientWidth * 0.75; //800;
    var h = document.documentElement.clientHeight * 0.8; //600;
    var windowPosX = (document.documentElement.clientWidth - w)/2;
    var windowPosY = (document.documentElement.clientHeight - h)/2;
    $.Dialog({
        overlay: true,
        shadow: true,
        flat: true,
        draggable: false,
        icon: '<span class="icon-image"></span>',
        title: '浏览图片',
        content: '',
        width: w,
        height: h,
        position: {offsetX: windowPosX, offsetY: windowPosY},
        onShow: function (_dialog) {
            var html = [
                '<div>',
                '<canvas id="image_viewer_canvas"></canvas>',
                '</div>'
            ].join("");
            $.Dialog.content(html);
            var viewer = new ImageViewer();
            viewer.initialize(urisArray, w, h);
        }
    });
}

function showImageInViewer(uri) {
    var data = [];
    data.push(uri);
    showImagesInViewer(data);
}