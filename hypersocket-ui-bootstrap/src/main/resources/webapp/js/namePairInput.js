$.fn.namePairInput = function(data) {
	
	var options = $.extend(
			{  
				text: "Add name/value pair",
				maxRows : 0,
				disabled : false, 
				readOnly: false,
				columnWeight: 'equal',
				valueVariables: [],
				nameVariables: [],
				variables: [],
				isArrayValue: true
			}, data);
	
	var id = (options.id ? options.id : $(this).attr('id') + "NamePairInput");
	
	if(!rowNum){
		var rowNum = 0;
	}
	
	var nameWeight = 'col-xs-5';
	var valueWeight = 'col-xs-5';
	if(options.columnWeight=='nameHeavy') {
		nameWeight = 'col-xs-8';
		valueWeight = 'col-xs-3';
	}else if(options.columnWeight=='valueHeavy'){
		nameWeight = 'col-xs-3';
		valueWeight = 'col-xs-8';
	}
	
	var nameVariables = options.nameVariables.concat(options.variables);
	var valueVariables = options.valueVariables.concat(options.variables);
	
	var html = 	'<div id="' + id + '" class="propertyItem form-group">'
			+	'	<div id="' + id + 'NamePairs" ></div>'
			+	'	<div class="row">'
			+	'		<div class="propertyValue col-xs-11">'
			+	'			<span class="help-block">' + options.text + '</span>'
			+	'		</div>'
			+	'		<div class="propertyValue col-xs-1 dialogActions">'
			+	'			<a id="' + id + 'AddPair" href="#" class="btn btn-info addButton">'
			+	'				<i class="fa fa-plus"></i>'
			+	'			</a>'
			+	'		</div>'
			+	'	</div>'
			+	'</div>';
	
	
	$(this).append(html);
	
	$('#' + id + 'AddPair').click(function() {
		$('#' + id).parent().data('widget').addRows(1);
	});
	
	var callback = {
 			getValue: function() {
 				var values = [];
 				$('#' + id + 'NamePairs').find('.namePairInput').each(function(){
 					name = $(this).find('.namePairName input').val();
 					value = $(this).find('.namePairValue input').val();
 					values.push(name + '=' + value);
 				});
 				return values;
 			},
 			setValue: function(val) {
 				$('#' + id).parent().removeRows();
 				$.each(val, function(index, value){
 					$('#' + id).parent().data('widget').addRows(1);
 					valuePair = value.split('=');
 					$('#' + id + 'NamePairName' + rowNum).data('widget').setValue(valuePair[0]);
 					$('#' + id + 'NamePairValue' + rowNum).data('widget').setValue(valuePair[1]);
 				});
 			},
 			disable: function() {
 				$('#' + id).find('input').parent().each(function(){
 					$(this).data('widget').disable();
 				});
 				$('#' + id).find('.removePair').each(function(){
 					$(this).attr('disabled', 'disabled');
 				});
 				$('#' + id + 'AddPair').attr('disabled', 'disabled');
 				options.disabled = true;
 			},
 			enable: function() {
 				$('#' + id).find('input').parent().each(function(){
 					$(this).data('widget').enable();
 				});
 				$('#' + id).find('.removePair').each(function(){
 					$(this).removeAttr('disabled');
 				});
 				if(options.maxRows == 0 || (options.maxRows != 0 && $('#' + id + 'NamePairs').children().length < options.maxRows)){
 					$('#' + id + 'AddPair').removeAttr('disabled');
 				}
 				options.disabled = false;
 			},
 			addRows: function(val){
 				for (i = 0; i < val; i++) {
 					rowNum++;
 					html = '';
 	 				html =	'<div class="row namePairInput form-group">'
 	 					+	'	<div id="' + id + 'NamePairName' + rowNum + '" class="propertyValue ' + nameWeight + ' namePairName"></div>'
 	 					+	'	<div id="' + id + 'NamePairValue' + rowNum + '" class="propertyValue ' + valueWeight + ' namePairValue"></div>'
 	 					+	'	<div class="propertyValue col-xs-1 dialogActions">'
 	 					+ 	'		<a href="#" class="removePair btn btn-danger"><i class="fa fa-trash-o"></i></a>'
 	 					+ 	'	</div>'
 	 					+	'</div>';
 	 				$('#' + id + 'NamePairs').append(html);
 	 				$('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairName').textInput({
 	 					variables: nameVariables,
 	 					disabled: options.disabled
 	 				});
 	 				$('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairValue').textInput({
 	 					variables: valueVariables,
 	 					disabled: options.disabled
 	 				});
 	 				$('.removePair').click(function(){
 	 					$(this).closest('.namePairInput').remove();
 	 					$('#' + id + 'AddPair').removeAttr('disabled');
 	 				});
 	 				if(options.maxRows != 0 && $('#' + id + 'NamePairs').children().length == options.maxRows){
 	 					$('#' + id + 'AddPair').attr('disabled', 'disabled');
 	 				}
 				}
 			},
 			removeRows: function(){
 				$('#' + id + 'NamePairs').empty();
 			},
 			options: function() {
 				return options;
 			},
 			clear: function() {
 				$('#' + id).find('input').val('');
 			}
 		};

 	$('#' + id).change(function(e) {
 		if(options.changed) {
 			options.changed(callback);
 		}
 	});
 	
	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	
	return callback;
}