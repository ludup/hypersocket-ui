$.fn.fileUploadInput = function(data) {
	
	var options = $.extend(
			{  
				disabled : false,
				showChooseFile: true,
				getUrlData: function(data) {
					return data;
				}
			}, data);
	
	var id = (options.id ? options.id : $(this).attr('id') + "FileUpload");
	var html =	'<div class="col-xs-11">'
			+	'	<input type="file" id="' + id + 'File"/>'
			+	'</div>'
			+	'<div class="propertyValue col-xs-1 dialogActions">'
			+	'	<a href="#" class="btn btn-primary" id="' + id + 'UploadButton"><i class="fa fa-upload"></i></a>'
			+	'</div>';
	$(this).append(html);
	
	if(!options.showChooseFile){
		$('#' + id + 'UploadButton').parent().hide();
		$('#' + id + 'File').parent().removeClass('col-xs-11').addClass('col-xs-12');
	}
	
	var callback = {
 			getValue: function() {
 				if(!$('#' + id + 'Info').length){
 					bootbox.alert(getResource("fileUpload.noExistingFile.text"));
 					return;
 				}
 				return $('#' + id + 'Info').data('uuid');
 			},
 			setValue: function(uuid) {
 				getJSON(options.url + '/' + uuid, null, function(data){
 					if($('#' + id + 'Info').length){
 						$('#' + id + 'Info').text(data.fileName + ', ' + data.fileSize + ', ' + data.md5Sum);
 						$('#' + id + 'Info').data('uuid', data.name);
 						$('#' + id + 'RemoveButton').unbind('click');
 						$('#' + id + 'RemoveButton').click(function(){
 							callback.remove();
 						});
 	 				}else{
 	 					$('#' + id + 'File').parent().append('<span id="' + id + 'Info">' + data.fileName + ', ' + data.fileSize + ', ' + data.md5Sum + '</span>');
 						$('#' + id + 'File').remove();
 						$('#' + id + 'UploadButton').parent().append('<a class="btn btn-danger" id="' + id + 'RemoveButton"><i class="fa fa-trash-o"></i></a>');
 						$('#' + id + 'UploadButton').remove();
 						$('#' + id + 'Info').data('uuid', data.name);
 						$('#' + id + 'RemoveButton').click(function(){
 							callback.remove();
 						});
 	 				}
 					if(options.disabled) {
 						callback.disable();
 					}
 				});
 			},
 			disable: function() {
 				$('#' + id + 'File').attr('disabled', 'disabled');
 				$('#' + id + 'UploadButton').attr('disabled', 'disabled');
 				$('#' + id + 'RemoveButton').attr('disabled', 'disabled');
 				options.disabled = true;
 			},
 			enable: function() {
 				$('#' + id + 'File').removeAttr('disabled');
 				$('#' + id + 'UploadButton').removeAttr('disabled');
 				$('#' + id + 'RemoveButton').removeAttr('disabled');
 				options.disabled = false;
 			},
 			upload: function() {
 				if($('#' + id + 'File').val() == ''){
 					bootbox.alert(getResource("fileUpload.emptyFileUploadInput.text"));
 					return;
 				}
 				var formData = new FormData();
 				formData.append('file', $('#' + id + 'File')[0].files[0]);
 				$.ajax({
 					type : 'POST',
 					url : basePath + '/api/' +options.url,
 					dataType : 'json',
 					cache : false,
 					contentType : false,
 					processData : false,
 					data : formData,
 					success : function(data) {
 						$('#' + id + 'File').parent().append('<span id="' + id + 'Info">' + data.resource.fileName + ', ' + data.resource.fileSize + ', ' + data.resource.md5Sum + '</span>');
 						$('#' + id + 'File').remove();
 						$('#' + id + 'UploadButton').parent().append('<a class="btn btn-danger" id="' + id + 'RemoveButton"><i class="fa fa-trash-o"></i></a>');
 						$('#' + id + 'UploadButton').remove();
 						$('#' + id + 'Info').data('uuid', data.resource.name);
 						$('#' + id + 'RemoveButton').click(function(){
 							callback.remove();
 						});
 						if(options.disabled) {
 							callback.disable();
 						}
 					},
 					error: function(jqXHR, textStatus, errorThrown) {
 						bootbox.alert(errorThrown);
 					}
 				});
 			},
 			remove: function() {
 				if(!$('#' + id + 'Info').length){
 					bootbox.alert(getResource("fileUpload.noExistingFile.text"));
 					return;
 				}
 				
 				deleteJSON(options.url + '/' + $('#' + id + 'Info').data('uuid'), null, function(data){
 					$('#' + id + 'Info').parent().append('<input type="file" id="' + id + 'File"/>');
					$('#' + id + 'Info').remove();
					$('#' + id + 'RemoveButton').parent().append('<a href="#" class="btn btn-primary" id="' + id + 'UploadButton"><i class="fa fa-upload"></i></a>');
					$('#' + id + 'RemoveButton').remove();
					$('#' + id + 'UploadButton').click(function(){
						callback.upload();
					});
					if(options.disabled) {
						callback.disable();
					}
 				});
 				
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