$.fn.multipleFileUpload = function(data) {
	
	var options = $.extend(
			{  
				text: "Add file to upload",
				maxRows : 0,
				disabled : false, 
				values: [],
				showUploadButton: true,
				showRemoveLine: true
			}, data);
	
	var id = (options.id ? options.id : $(this).attr('id') + "MultipleFileUpload");
	
	if(!rowNum){
		var rowNum = 0;
	}
	maxRows = options.maxRows;
	if(options.maxRows > 10 || options.maxRows <= 0){
		maxRows = 10;
	}
	
	var html = 	'<div id="' + id + '" class="propertyItem form-group">'
			+	'	<div id="' + id + 'FileUploads" ></div>'
			+	'	<div id="' + id + 'NewRow" class="row">'
			+	'		<div class="propertyValue col-xs-11">'
			+	'			<span class="help-block">' + options.text + '</span>'
			+	'		</div>'
			+	'		<div class="propertyValue col-xs-1 dialogActions">'
			+	'			<a id="' + id + 'AddRow" href="#" class="btn btn-info addButton">'
			+	'				<i class="fa fa-plus"></i>'
			+	'			</a>'
			+	'		</div>'
			+	'	</div>'
			+	'</div>';
	
	
	$(this).append(html);
	
	$('#' + id + 'AddRow').click(function() {
		$('#' + id).parent().data('widget').addRows(1);
	});
	
	var callback = {
 			getValue: function() {
 				values = [];
 				$('#' + id).find('.fileUploadInput').each(function(){
 					values.push($(this).data('widget').getValue());
 				});
 				return values;
 			},
 			setValue: function(val) {
 				callback.removeRows();
 				$.each(val, function(index, value){
 					callback.addRows(1);
 					$('#' + id + 'FileUpload' + rowNum).data('widget').setValue(value);
 				});
 			},
 			disable: function() {
 				$('#' + id).find('.fileUploadInput').each(function(){
 					$(this).data('widget').disable();
 				});
 				$('#' + id + 'AddRow').attr('disabled', 'disabled');
 				options.disabled = true;
 			},
 			enable: function() {
 				$('#' + id).find('.fileUploadInput').each(function(){
 					$(this).data('widget').enable();
 				});
 				$('#' + id + 'AddRow').attr('disabled', 'disabled');
 				options.disabled = true;
 				if(maxRows == 0 || (maxRows != 0 && $('#' + id + 'FileUploads').children().length < maxRows)){
 					$('#' + id + 'AddRow').removeAttr('disabled');
 				}
 				options.disabled = false;
 			},
 			addRows: function(val){
 				for (i = 0; i < val; i++) {
 					rowNum++;
 					html = '';
 	 				html =	'<div class="row fileUpload">'
 	 					+	'	<div id="' + id + 'FileUpload' + rowNum + '" class="form-group propertyValue col-xs-12 fileUploadInput"></div>'
 	 					+	'</div>';
 	 				$('#' + id + 'FileUploads').append(html);
 	 				$('#' + id + 'FileUploads').find('.fileUpload').last().find('.fileUploadInput').fileUploadInput({
 	 					url: options.url,
 	 					disabled: options.disabled,
 	 					showUploadButton: options.showUploadButton
 	 				});
 	 				if(options.showRemoveLine){
 	 					$('#' + id + 'FileUploads').find('.fileUpload').last().find('.fileUploadInput').find('a').parent().removeClass('col-xs-1');
 	 					$('#' + id + 'FileUploads').find('.fileUpload').last().find('.fileUploadInput').find('a').parent().addClass('col-xs-2');
 	 					$('#' + id + 'FileUploads').find('.fileUpload').last().find('.fileUploadInput').find('input').parent().removeClass('col-xs-11');
 	 					$('#' + id + 'FileUploads').find('.fileUpload').last().find('.fileUploadInput').find('input').parent().addClass('col-xs-10');
 	 					$('#' + id + 'FileUploads').find('.fileUpload').last().find('.fileUploadInput').find('a').after('<a href="#" class="btn btn-danger" id="' + id + 'RemoveButton' + rowNum + '"><i class="fa fa-trash-o"></i></a>');
 	 					$('#' + id + 'RemoveButton' + rowNum).click(function(){
 	 						$(this).closest('.fileUpload').remove();
 	 						$('#' + id + 'NewRow').show();
 	 					});
 	 				}
 	 				
 	 				if(maxRows != 0 && $('#' + id + 'FileUploads').children().length == maxRows){
 	 					$('#' + id + 'NewRow').hide();
 	 				}
 				}
 			},
 			removeRows: function(){
 				$('#' + id + 'FileUploads').empty();
 			},
 			removeFiles: function() {
 				$('#' + id).find('.fileUploadInput').each(function(){
 					$(this).data('widget').remove();
 				});
 			},
 			upload: function(){
 				$('#' + id).find('.fileUploadInput').each(function(){
 					$(this).data('widget').upload();
 				});
 			},
 			options: function() {
 				return options;
 			},
 			getInput: function() {
 				return $('#' + id);
 			}
 		};

 	$('#' + id).change(function(e) {
 		if(options.changed) {
 			options.changed(callback);
 		}
 	});
 	
 	if(options.values) {
 		callback.setValue(options.values);
 	}
 	
	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	
	return callback;
}