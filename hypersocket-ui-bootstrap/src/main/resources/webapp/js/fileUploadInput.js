$.fn.fileUploadInput = function(data) {
	
	var options = $.extend(
			{  
				disabled : false,
				showUploadButton: true,
				getUrlData: function(data) {
					return data;
				}
			}, data);
	
	var id = (options.id ? options.id : $(this).attr('id') + "FileUpload");
	var html =	'<div class="col-xs-10">'
			+	'	<input type="file" id="' + id + 'File"/>'
			+	'</div>'
			+	'<div class="propertyValue col-xs-2 dialogActions">'
			+	'	<a href="#" class="btn btn-primary" id="' + id + 'UploadButton"><i class="fa fa-upload"></i></a>'
			+	'</div>'
			+	'<div class="col-xs-10">'
			+	'	<div id="' + id + 'UpdateProgressHolder" class="progress">'
			+	'		<div id="' + id + 'UpdateProgress" class="progress-bar" role="progressbar"></div>'
			+	'	</div>'
			+	'</div>';
	
	$(this).append(html);
	$('#' + id + 'UpdateProgressHolder').css('height', '12px');
	$('#' + id + 'UpdateProgressHolder').hide();
	
	if(!options.showUploadButton){
		$('#' + id + 'UploadButton').parent().hide();
		$('#' + id + 'File').parent().removeClass('col-xs-11').addClass('col-xs-12');
	}
	
	var uploadProgress = function(evt){
		if (evt.lengthComputable) {
			var width = Math.round(evt.loaded * 100 / evt.total);
			$('#' + id + 'UpdateProgress').css("width", width + "%");
		}
	}
	
	var showInfoFormat = function(data){
		fileSize = data.fileSize + ' Bytes';
		if(data.fileSize > 1024 * 1024){
			fileSize = (Math.round((data.fileSize / (1024 * 1024)) * 100)/100).toFixed(2) + ' MB';
		}
		formattedHtml = '<div class="file-upload-info">'
					+	'	<span>' + getResource('fileUpload.fileName.info') + '</span></br>'
					+	'	<span>' + getResource('fileUpload.fileSize.info') + '</span></br>'
					+	'	<span>' + getResource('fileUpload.md5Sum.info') + '</span>'
					+	'</div>'
					+	'<div class="file-upload-info">'
					+	'	<span>' + data.fileName + '</span></br>'
					+	'	<span>' + fileSize + '</span></br>'
					+	'	<span>' + data.md5Sum + '</span>'
					+	'</div>';
		
//					This code shows the delete button next to file's info
		
//					+	'<div class="propertyValue dialogActions">'
//					+	'<a class="btn btn-danger" id="' + id + 'RemoveButton"><i class="fa fa-trash-o"></i></a>';
//		$('#' + id + 'RemoveButton').click(function(){
//			callback.remove();
//		});
			
		return formattedHtml;
	}
	
	var showInfo = function(data){
		fileSize = data.fileSize + ' KB';
		if(data.fileSize > 1024 * 1024){
			fileSize = (Math.round((data.fileSize / (1024 * 1024)) * 100)/100).toFixed(2) + ' MB';
		}
		$('#' + id + 'File').parent().append(
				'<div id="' + id + 'Info">' + showInfoFormat(data) + '</div>');
		$('#' + id + 'File').remove();
		$('#' + id + 'UploadButton').parent().append('<a class="btn btn-danger" id="' + id + 'RemoveButton"><i class="fa fa-close"></i></a>');
		$('#' + id + 'UploadButton').parent().append('<a class="btn btn-primary" id="' + id + 'DownloadButton"><i class="fa fa-download"></i></a>');
		$('#' + id + 'UploadButton').remove();
		$('#' + id + 'Info').data('uuid', data.name);
		$('#' + id + 'RemoveButton').click(function(){
			bootbox.confirm(getResource('fileUpload.confirmRemoveFile'),
			function(confirmed) {
				if(confirmed){
					callback.remove();
				}
			});
		});
		$('#' + id + 'DownloadButton').click(function(){
			callback.download();
		});
	}
	
	var callback = {
 			getValue: function() {
 				if(!$('#' + id + 'Info').length){
 					return '';
 				}
 				return $('#' + id + 'Info').data('uuid');
 			},
 			setValue: function(uuid) {
 				getJSON(options.url + '/' + uuid, null, function(data){
 					if($('#' + id + 'Info').length){
 						$('#' + id + 'Info').empty();
 						$('#' + id + 'Info').append(showInfoFormat(data));
 						$('#' + id + 'Info').data('uuid', data.name);
 						$('#' + id + 'RemoveButton').unbind('click');
 						$('#' + id + 'RemoveButton').click(function(){
 							callback.remove();
 						});
 						$('#' + id + 'DownloadButton').unbind('click');
 						$('#' + id + 'DownloadButton').click(function(){
 							callback.download();
 						});
 	 				}else{
 	 					showInfo(data);
 	 				}
 					
 					if(options.disabled) {
 						callback.disable();
 					}
 					$('#' + id + 'UpdateProgressHolder').hide();
 				});
 			},
 			disable: function() {
 				$('#' + id + 'File').attr('disabled', 'disabled');
 				$('#' + id + 'UploadButton').attr('disabled', 'disabled');
 				$('#' + id + 'RemoveButton').attr('disabled', 'disabled');
 				$('#' + id + 'DownloadButton').attr('disabled', 'disabled');
 				options.disabled = true;
 			},
 			enable: function() {
 				$('#' + id + 'File').removeAttr('disabled');
 				$('#' + id + 'UploadButton').removeAttr('disabled');
 				$('#' + id + 'RemoveButton').removeAttr('disabled');
 				$('#' + id + 'DownloadButton').removeAttr('disabled');
 				options.disabled = false;
 			},
 			upload: function() {
 				if($('#' + id + 'File').val() == ''){
 					return;
 				}
 				$('#' + id + 'UpdateProgressHolder').show();
 				$('#' + id + 'UpdateProgress').css("width",  "0%");
 				var formData = new FormData();
 				formData.append('file', $('#' + id + 'File')[0].files[0]);
 				
 		        var xhr = new XMLHttpRequest();
 		        xhr.upload.addEventListener("progress", uploadProgress, false);
 		        xhr.onreadystatechange=function()
 		        {
 		        	if (xhr.readyState==4 && xhr.status==200)
 		        	{
 		        		data = jQuery.parseJSON(xhr.response).resource;
 		        		showInfo(data);
 						if(options.disabled) {
 							callback.disable();
 						}
 		        	}
 		        }
 		        xhr.open("POST", basePath + '/api/' +options.url);
 		        xhr.send(formData);
 			},
 			remove: function() {
 				if(!$('#' + id + 'Info').length){
 					return;
 				}
 				$('#' + id + 'UpdateProgressHolder').hide();
 				deleteJSON(options.url + '/' + $('#' + id + 'Info').data('uuid'), null, function(data){
 					$('#' + id + 'Info').parent().append('<input type="file" id="' + id + 'File"/>');
					$('#' + id + 'Info').remove();
					$('#' + id + 'RemoveButton').parent().append('<a href="#" class="btn btn-primary" id="' + id + 'UploadButton"><i class="fa fa-upload"></i></a>');
					$('#' + id + 'RemoveButton').remove();
					$('#' + id + 'DownloadButton').remove();
					$('#' + id + 'UploadButton').click(function(){
						callback.upload();
					});
					if(options.disabled) {
						callback.disable();
					}
 				});
 				
 			},
 			download: function(){
 				uuid = $('#' + id + 'Info').data('uuid');
 				
// 				Commented until I fix the download issue
 				
// 				getJSON('fileUpload/download/' + uuid, null, function(data){
// 					debugger;
// 				});
// 				$.ajax({
// 			        type : 'GET',
// 			        url : basePath + '/api/fileUpload/download/' + uuid,
// 			        dataType : 'text',
// 			        contentType : 'application/json;charset=UTF-8',
// 			        success : function(data) {
// 			        	debugger;
// 			            window.open(data);
// 			        },
// 			        error : function(xhr, ajaxOptions, thrownError) {
// 			            // error handling
// 			        	debugger;
// 			        }
// 			    });
// 				window.location.href =  basePath + '/api/fileUpload/download/' + uuid;
 				window.open(basePath + '/api/fileUpload/download/' + uuid);
 			},
 			options: function() {
 				return options;
 			},
 			getInput: function() {
 				return $('#' + id);
 			}
 		};
	
	$('#' + id + 'UploadButton').click(function(){
		callback.upload();
	});

 	$('#' + id).change(function(e) {
 		if(options.changed) {
 			options.changed(callback);
 		}
 	});
 	
 	if(options.value) {
 		callback.setValue(options.values);
 	}
 	
	if(options.disabled) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	
	return callback;
}