/*
 * 参考：http://www.zhangxinxu.com/wordpress/2011/09/%E5%9F%BA%E4%BA%8Ehtml5%E7%9A%84%E5%8F%AF%E9%A2%84%E8%A7%88%E5%A4%9A%E5%9B%BE%E7%89%87ajax%E4%B8%8A%E4%BC%A0/
    http://geekswithblogs.net/shaunxu/archive/2013/07/01/upload-file-to-windows-azure-blob-in-chunks-through-asp.net.aspx
 * zxxFile.js 基于HTML5 文件上传的核心脚本 http://www.zhangxinxu.com/wordpress/?p=1923
 * by zhangxinxu 2011-09-12
*/


// 根据用户ID、文件名和当前时间拼接唯一的文件名
function computeUniqueFileName(userId, fileName) {
    var parts = fileName.split(".");
    // 文件后缀
    var extname = parts[parts.length - 1];
    // 文件后缀剩余的部分
    var fn = fileName.substring(0, fileName.length - 1 - extname.length);

    var time = new Date();
    // UserID @ TIME # FileName（无扩展名）
    var title = userId + "@" + time.toUTCString() + "#" + fn;
    var hex = hex_md5(title);
    return hex + "." + extname;
}

var filesCache = new Dictionary();

var ZXXFILE = {
	fileInput: null,				//html file控件
	dragDrop: null,					//拖拽敏感区域
	upButton: null,					//提交按钮
	url: "",						//ajax地址
	userId: "00000000000000000000000000000000",
    itemId: "",
    uploadDomain: "",
    uploadSingleImage: false,       // true：只支持上传一个文件；false：支持上传多个文件。
	fileFilter: [],					//过滤后的文件数组
	filter: function(files) {		//选择文件组的过滤方法
		return files;	
	},
    //resultUrls: [],                 // 上传成功后的URL数组
	onSelect: function() {},		//文件选择后
	onDelete: function() {},		//文件删除后
	onDragOver: function() {},		//文件拖拽到敏感区域时
	onDragLeave: function() {},	//文件离开到敏感区域时
	onProgress: function() {},		//文件上传进度
	onSuccess: function() {},		//文件上传成功时
	onFailure: function() {},		//文件上传失败时,
	onComplete: function () { },		//文件全部上传完毕时
	onShowMessage: function() { },  // 显示信息
	//onFinishedPerImage: function (response) { },      // 同onComplete，不过用于外部调用
	
	/* 开发参数和内置方法分界线 */
	
	//文件拖放
	funDragHover: function(e) {
		e.stopPropagation();
		e.preventDefault();
		this[e.type === "dragover"? "onDragOver": "onDragLeave"].call(e.target);
		return this;
	},
	//获取选择文件，file控件或拖放
	funGetFiles: function(e) {
		// 取消鼠标经过样式
		this.funDragHover(e);
				
		// 获取文件列表对象
		var files = e.target.files || e.dataTransfer.files;
		if (uploadSingleImage) {
		    // 移除
		    if (this.fileFilter != null && this.fileFilter.length > 0) {
		        for (var i = 0, file; file = this.fileFilter[i]; i++) {
		            this.onDelete(file);
		        }
		    }
            // 赋新值
		    this.fileFilter = files;
		}
		else {
		    //继续添加文件
		    this.fileFilter = this.fileFilter.concat(this.filter(files));
		}
		this.funDealFiles();
		return this;
	},
	
	//选中文件的处理与回调
	funDealFiles: function () {
	    filesCache.Clear();
		for (var i = 0, file; file = this.fileFilter[i]; i++) {
			//增加唯一索引值
		    file.index = i;
		    var uniqueName = computeUniqueFileName(self.userId, file.name);
		    filesCache.Add(file.name, uniqueName);
		}
		//执行选择回调
		this.onSelect(this.fileFilter);
		return this;
	},
	
	//删除对应的文件
	funDeleteFile: function(fileDelete) {
		var arrFile = [];
		for (var i = 0, file; file = this.fileFilter[i]; i++) {
			if (file != fileDelete) {
				arrFile.push(file);
			} else {
				this.onDelete(fileDelete);	
			}
		}
		this.fileFilter = arrFile;
		return this;
	},
	


   


    //文件上传
	funUploadFile: function () {
	    var self = this;
	    if (location.host.indexOf("sitepointstatic") >= 0) {
	        //非站点服务器上运行
	        return;
	    }
	    // assert the browser support html5
	    if (window.File && window.Blob && window.FormData) {
	    }
	    else {
	        alert("你的浏览器版本太旧了，请升级到Chrome 21 / FireFox 13 / IE 10 / Opera 12 / Safari 5.1或者更高。");
	        return;
	    }

	    // 512KB
	    var block_size_in_kb = 512;
	    var filesCount = this.fileFilter.length;
	    var count = 0;
	    var tmpIndex = 0;
	    var finished = false;
	    var isUploading = false;

	    // 重新上传失败的文件
	    function continueUploadFailedFiles() {
	        self.onShowMessage("部分文件上传失败，准备重新上传……");
	        // 开始上传
	        filesCount = self.fileFilter.length;
	        count = 0;
	        tmpIndex = 0;
	        finished = false;
	        isUploading = false;
	        //processNextFile();
	    }

	    // 文件全部上传完成
	    function afterUploadFinished() {
	        clearInterval(processNextFile);
	        // 单文件上传 count == 1 && 
	        if (self.uploadDomain == "logo" || self.uploadDomain == "avatar") {
	            self.onComplete();
	            finished = true;
	            filesCache.Clear();
	            return;
	        }
	        // 多文件上传
	        var data2 = {
	            itemId: self.itemId
	        };
	        $.post("/common/process-after-upload-completed", data2, function (data, textStatus, jqXHR) {
	            //var result = JSON.parse(jqXHR.responseText);
	            if (data.success == false) {
	                $.Notify({
	                    style: { background: 'red', color: 'white' },
	                    content: error
	                });
	                afterUploadFinished();
	                return;
	            }

	            self.onComplete();
	            finished = true;
	            filesCache.Clear();
	        });
	    }

	    processNextFile = setInterval(function () {
	        if (self.fileFilter.length == 0)
	            return;
	        else if (isUploading == true && finished == false) {
	            //setInterval(processNextFile(), 500);
	            return;
	        }
	        isUploading = true;
	        var file = self.fileFilter[tmpIndex]
	        var fileSize = file.size;
	        //var fileName = computeUniqueFileName(self.userId, file.name); //file.name;
	        var fileName = filesCache.Item(file.name);

	        var xhr = new XMLHttpRequest();
	        if (xhr.upload) {
	            // 上传中
	            xhr.upload.addEventListener("progress", function (e) {
	                self.onProgress(file, e.loaded, e.total);
	            }, false);

	            // 文件上传成功或是失败
	            xhr.onreadystatechange = function (e) {
	                if (xhr.readyState == 4) {
	                    var result = JSON.parse(xhr.responseText);
	                    count++;
	                    if (xhr.status == 200 && result.success == true) {
	                        // remove
	                        self.onSuccess(file, result.url);
	                        self.funDeleteFile(file);
	                        if (!self.fileFilter.length) { // 全部完毕
	                            afterUploadFinished();
	                        }
	                        else { // 继续
	                            //if (tmpIndex < self.fileFilter.length)
	                            //    processNextFile();
	                            //else
	                            //    continueUploadFailedFiles();
	                            if (tmpIndex >= self.fileFilter.length)
	                                continueUploadFailedFiles();
	                        }
	                    } else {
	                        self.onShowMessage(result.error);
	                        //self.onFailure(file, xhr.responseText);
	                        // 跳过并继续
	                        tmpIndex++;
	                        //if (tmpIndex < self.fileFilter.length)
	                        //    processNextFile();
	                        //else
	                        //    continueUploadFailedFiles();
	                        if (tmpIndex >= self.fileFilter.length)
	                            continueUploadFailedFiles();
	                    }
	                    isUploading = false;
	                }
	            };

	            // 开始上传
	            xhr.open("POST", "/common/upload-file", true);
	            xhr.setRequestHeader("X_FILENAME", fileName);
	            xhr.send(file);
	        }
	    }, 400); // processNextFile

        // 开始
	    //tmpIndex = 0;
	    //processNextFile();
	},

	
	init: function() {
		var self = this;
		
		if (this.dragDrop) {
			this.dragDrop.addEventListener("dragover", function(e) { self.funDragHover(e); }, false);
			this.dragDrop.addEventListener("dragleave", function(e) { self.funDragHover(e); }, false);
			this.dragDrop.addEventListener("drop", function(e) { self.funGetFiles(e); }, false);
		}
		
		//文件选择控件选择
		if (this.fileInput) {
			this.fileInput.addEventListener("change", function(e) { self.funGetFiles(e); }, false);	
		}
		
		//上传按钮提交
		if (this.upButton) {
			this.upButton.addEventListener("click", function(e) { self.funUploadFile(e); }, false);	
		} 
	}
};
