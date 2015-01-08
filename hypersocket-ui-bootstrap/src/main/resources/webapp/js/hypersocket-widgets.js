/**
* Displays a text input with button to insert a set of variables.
* 
* Options:
*   id:
*   resourceKey:
*   variableTemplate: '$\{{0}\}', // The format of the variable displayed. {0} is replaced with variable name, for example ${username}
*   disabled: false,              // Disable the input
*   type:     'text',             // The type of text box to use.. i.e. text, password, textarea
*   readOnly: false,              // Same as disabled
*   value:    '',                 // The current value to display
*   cols:     30,                 // columns (only used if type is textarea)
*   rows:     5,                  // rows (only used if type is textarea)
*   maxlength: -1,                // maxlength of value, -1 means nothing set.
*   variables: []                 // The variables to display
*   url							  // A url that returns a json array which will be used as the set of variables
**/
 
$.fn.textInput = function(data) {
	
	var options = $.extend(
			{  
				variableTemplate: '$\{{0}\}', 
				disabled : false, 
				inputType: 'text',
				readOnly: false, 
				maxlength: -1, 
				valueIsResourceKey: false,
				getUrlData: function(data) {
					return data;
				}
			}, data);
	
	var id = (options.id ? options.id : $(this).attr('id') + "TextInput");
	var hasVariables = (options.variables && options.variables.length > 0);
	var html = '';
	
	if(options.inputType=='textarea') {
	
		if(options.variables || options.url) {
			html += '<div class="input-group">';
		}
		
		var html ='<textarea name="' + id + '" id="' + id + '" class="form-control" value="' 
				+ stripNull(options.value) + '"' + (!options.readOnly && !options.disabled ? '' : 'disabled="disabled" ') + ' cols="' 
				+ (options.cols ? options.cols : 30) + '" rows="' + (options.rows ? options.rows : 5) + '" ' 
				+ (options.maxlength > -1 ? 'maxlength="' + options.maxlength  + '"' : '' ) + '>' 
				+ stripNull(options.valueIsResourceKey ? getResource(options.value) : options.value) + '</textarea>';
		
		if(options.variables || options.url) {
			html += '<ul id="' + id + 'Dropdown" class="dropdown-menu dropdown-menu-right" role="menu"></ul><span class="input-group-addon dropdown-toggle unselectable" '
		    	+ 'data-toggle="dropdown">${}</span></div>';
		}

			    
	} else {
		
		var html = '';
		if(hasVariables || options.url) {
			html += '<div class="input-group">';
		}
		
		var type = options.inputType != 'text' && options.inputType != 'password' ? 'text' : options.inputType;
		html += '<input type="' + type + '" name="' + id + '" id="' + id + '" class="form-control" value="' 
				+ stripNull(options.valueIsResourceKey ? getResource(options.value) : options.value) + '"' + (!options.readOnly && !options.disabled ? '' : 'disabled="disabled" ') + '>';
		
		if(hasVariables || options.url) {
			html += '<ul id="' + id + 'Dropdown" class="dropdown-menu dropdown-menu-right" role="menu"></ul><span class="input-group-addon dropdown-toggle unselectable" '
		 	  + 'data-toggle="dropdown">${}</span></div>';
		}
  
	}
	
	$(this).append(html);
	
 	if(hasVariables) {
 		$.each(options.variables, function(idx, obj) {
 			$('#' + id + 'Dropdown').append('<li><a href="#" class="' + id + 'Class">' + options.variableTemplate.format(obj) + '</a></li>');
 		});
 		
 		$('.' + id + 'Class').click(function(e) {
			e.preventDefault();
			var position = $('#' + id).getCursorPosition();
			var content = $('#' + id).val();
	 		var newContent = content.substr(0, position) + $(this).text() + content.substr(position);
	 		$('#' + id).val(newContent);
		});
	
 	} else if(options.url) {
 		getJSON(options.url, null, function(data) {
 			$.each(options.getUrlData(data), function(idx, obj) {
 	 			$('#' + id + 'Dropdown').append('<li><a href="#" class="' + id + 'Class">' + options.variableTemplate.format(obj) + '</a></li>');
 	 		});
 		
 			$('.' + id + 'Class').click(function(e) {
 				e.preventDefault();
 				var position = $('#' + id).getCursorPosition();
 				var content = $('#' + id).val();
 		 		var newContent = content.substr(0, position) + $(this).text() + content.substr(position);
 		 		$('#' + id).val(newContent);
 			});
 		});
 	}
 	
 	var callback = {
 			setValue: function(val) {
 				$('#' + id).val(val);
 			},
 			getValue: function() {
 				return $('#' + id).val();
 			},
 			reset: function() {
 				$('#' + id).val(options.value);
 			},
 			disable: function() {
 				$('#' + id).attr('disabled', true);
 			},
 			enable: function() {
 				$('#' + id).attr('disabled', false);
 			},
 			options: function() {
 				return options;
 			},
 			getInput: function() {
 				return $('#' + id);
 			},
 			clear: function() {
 				$('#' + id).val('');
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

$.fn.htmlInput = function(data) {
	
	var options = $.extend(
			{ disabled : false, 
			  value: '',
			  inputType: 'html',
			  lineNumbers: true}, 
		data);
		
	var id = (options.id ? options.id : $(this).attr('id') +  'HtmlInput');
	
	$(this).append('<div class="code form-control" id="' + id + '"></div>');
	
	
	var myCodeMirror = CodeMirror(document.getElementById(id), {
		  value: options.value,
		  htmlMode: options.inputType=='html',
		  mode:  options.inputType=='html' ? 'text/html' : 'application/xml',
		  lineNumbers: options.lineNumbers
	});
	
	var callback = {
 			setValue: function(val) {
 				myCodeMirror.setValue(val);
 				if(options.changed) {
 					options.changed(val);
 				}
 			},
 			getValue: function() {
 				return myCodeMirror.getValue();
 			},
 			reset: function() {
 				myCodeMirror.setValue(options.value);
 			},
 			disable: function() {
 				$('#' + id).attr('disabled', true);
 			},
 			enable: function() {
 				$('#' + id).attr('disabled', false);
 			},
 			options: function() {
 				return options;
 			},
 			getInput: function() {
 				return $('#' + id);
 			},
 			clear: function() {
 				myCodeMirror.setValue('');
 			}
 		};
	
	myCodeMirror.on("change", function(cm, change) {
		  if(options.change) {
			  options.changed(callback);
		  }
	});
	
	$('#' + id).data('codeMirror', myCodeMirror);
	$('#' + id).show();
	
	setTimeout(function() {
	    myCodeMirror.refresh();
	},1);
	
	$(this).data('widget', callback);
	return callback;
}

$.fn.codeInput = function(data) {
	
	var options = $.extend(
			{ disabled : false, 
			  value: '',
			  inputType: 'html',
			  lineNumbers: true}, 
		data);
		
	var id = (options.id ? options.id : $(this).attr('id') +  'CodeInput');
	
	$(this).append('<div class="code form-control" id="' + id + '"></div>');
	
	
	var myCodeMirror = CodeMirror(document.getElementById(id), {
		  value: options.value,
		  mode:  options.inputType=='java' ? 'text/x-java' : options.inputType,
		  lineNumbers: options.lineNumbers
	});
	
	var callback = {
 			setValue: function(val) {
 				myCodeMirror.setValue(val);
 				if(options.changed) {
 					options.changed(val);
 				}
 			},
 			getValue: function() {
 				return myCodeMirror.getValue();
 			},
 			reset: function() {
 				myCodeMirror.setValue(options.value);
 			},
 			disable: function() {
 				$('#' + id).attr('disabled', true);
 			},
 			enable: function() {
 				$('#' + id).attr('disabled', false);
 			},
 			options: function() {
 				return options;
 			},
 			getInput: function() {
 				return $('#' + id);
 			},
 			clear: function() {
 				myCodeMirror.setValue('');
 			}
 		};
	
	myCodeMirror.on("change", function(cm, change) {
		  if(options.change) {
			  options.changed(callback);
		  }
	});
	
	$('#' + id).data('codeMirror', myCodeMirror);
	$('#' + id).show();
	
	setTimeout(function() {
	    myCodeMirror.refresh();
	},1);
	
	$(this).data('widget', callback);
	return callback;
}

/**
* Displays a code editor
**/

$.fn.editor = function(data) {

	var options = $.extend(
		{ disabled : false, 
		  value: ''}, 
	data);
	
	var id = (options.id ? options.id : $(this).attr('id') + 'Editor');
	
	$(this).append( '<div class="btn-toolbar" data-role="editor-toolbar" data-target="#' + id + '">'
  + '  <div class="btn-group">'
  + '    <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="" data-original-title="Font"><i class="fa fa-font"></i><b class="caret"></b></a>'
  + '      <ul class="dropdown-menu">'
  + '       <li><a data-edit="fontName Serif" style="font-family:\'Serif\'">Serif</a>'
  + '       <li><a data-edit="fontName Sans" style="font-family:\'Sans\'">Sans</a></li>'
  + '       <li><a data-edit="fontName Arial" style="font-family:\'Arial\'">Arial</a></li>'
  + '       <li><a data-edit="fontName Arial Black" style="font-family:\'Arial Black\'">Arial Black</a></li>'
  + '       <li><a data-edit="fontName Courier" style="font-family:\'Courier\'">Courier</a></li>'
  + '       <li><a data-edit="fontName Courier New" style="font-family:\'Courier New\'">Courier New</a></li>'
  + '       <li><a data-edit="fontName Comic Sans MS" style="font-family:\'Comic Sans MS\'">Comic Sans MS</a></li>'
  + '       <li><a data-edit="fontName Helvetica" style="font-family:\'Helvetica\'">Helvetica</a></li>'
  + '       <li><a data-edit="fontName Impact" style="font-family:\'Impact\'">Impact</a></li>'
  + '       <li><a data-edit="fontName Lucida Grande" style="font-family:\'Lucida Grande\'">Lucida Grande</a></li>'
  + '       <li><a data-edit="fontName Lucida Sans" style="font-family:\'Lucida Sans\'">Lucida Sans</a></li>'
  + '       <li><a data-edit="fontName Tahoma" style="font-family:\'Tahoma\'">Tahoma</a></li>'
  + '       <li><a data-edit="fontName Times" style="font-family:\'Times\'">Times</a></li>'
  + '       <li><a data-edit="fontName Times New Roman" style="font-family:\'Times New Roman\'">Times New Roman</a></li>'
  + '       <li><a data-edit="fontName Verdana" style="font-family:\'Verdana\'">Verdana</a></li>'
  + '      </ul>'
  + '    </div>'
  + '  <div class="btn-group">'
  + '    <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="" data-original-title="Font Size"><i class="fa fa-text-height"></i>&nbsp;<b class="caret"></b></a>'
  + '      <ul class="dropdown-menu">'
  + '      <li><a data-edit="fontSize 5"><font size="5" localize="font.huge"></font></a></li>'
  + '      <li><a data-edit="fontSize 3"><font size="3" localize="font.normal"></font></a></li>'
  + '      <li><a data-edit="fontSize 1"><font size="1" localize="font.smal"></font></a></li>'
  + '      </ul>'
  + '  </div>'
  + '  <div class="btn-group">'
  + '    <a class="btn btn-default" data-edit="bold" title="" data-original-title="Bold (Ctrl/Cmd+B)"><i class="fa fa-bold"></i></a>'
  + '    <a class="btn btn-default" data-edit="italic" title="" data-original-title="Italic (Ctrl/Cmd+I)"><i class="fa fa-italic"></i></a>'
  + '    <a class="btn btn-default" data-edit="strikethrough" title="" data-original-title="Strikethrough"><i class="fa fa-strikethrough"></i></a>'
  + '    <a class="btn btn-default" data-edit="underline" title="" data-original-title="Underline (Ctrl/Cmd+U)"><i class="fa fa-underline"></i></a>'
  + '  </div>'
  + '  <div class="btn-group">'
  + '    <a class="btn btn-default" data-edit="insertunorderedlist" title="" data-original-title="Bullet list"><i class="fa fa-list-ul"></i></a>'
  + '    <a class="btn btn-default" data-edit="insertorderedlist" title="" data-original-title="Number list"><i class="fa fa-list-ol"></i></a>'
  + '    <a class="btn btn-default" data-edit="outdent" title="" data-original-title="Reduce indent (Shift+Tab)"><i class="fa fa-outdent"></i></a>'
  + '    <a class="btn btn-default" data-edit="indent" title="" data-original-title="Indent (Tab)"><i class="fa fa-indent"></i></a>'
  + '  </div>'
  + '  <div class="btn-group">'
  + '    <a class="btn btn-default" data-edit="justifyleft" title="" data-original-title="Align Left (Ctrl/Cmd+L)"><i class="fa fa-align-left"></i></a>'
  + '    <a class="btn btn-default" data-edit="justifycenter" title="" data-original-title="Center (Ctrl/Cmd+E)"><i class="fa fa-align-center"></i></a>'
  + '    <a class="btn btn-default" data-edit="justifyright" title="" data-original-title="Align Right (Ctrl/Cmd+R)"><i class="fa fa-align-right"></i></a>'
  + '    <a class="btn btn-default" data-edit="justifyfull" title="" data-original-title="Justify (Ctrl/Cmd+J)"><i class="fa fa-align-justify"></i></a>'
  + '  </div>'
  + '  <div class="btn-group">'
  + '<a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="" data-original-title="Hyperlink"><i class="fa fa-link"></i></a>'
  + '  <div class="dropdown-menu input-append">'
  + '	    <input class="span2" placeholder="URL" type="text" data-edit="createLink">'
  + '	    <button class="btn btn-default" type="button">Add</button>'
  + '    </div>'
  + '    <a class="btn btn-default" data-edit="unlink" title="" data-original-title="Remove Hyperlink"><i class="fa fa-unlink"></i></a>'
  + '  </div>'
  + '  <div class="btn-group">'
  + '    <a class="btn btn-default" title="" id="pictureBtn" data-original-title="Insert picture (or just drag &amp; drop)"><i class="fa fa-image"></i></a>'
  + '    <input type="file" data-role="magic-overlay" data-target="#pictureBtn" data-edit="insertImage" style="opacity: 0; position: absolute; top: 0px; left: 0px; width: 41px; height: 30px;">'
  + '  </div>'
  + '  <div class="btn-group">'
  + '    <a class="btn btn-default" data-edit="undo" title="" data-original-title="Undo (Ctrl/Cmd+Z)"><i class="fa fa-undo"></i></a>'
  + '    <a class="btn btn-default" data-edit="redo" title="" data-original-title="Redo (Ctrl/Cmd+Y)"><i class="fa fa-repeat"></i></a>'
  + '  </div>'
  + '  <input type="text" data-edit="inserttext" id="voiceBtn" x-webkit-speech="" style="position: absolute; top: 280px; left: 1287px;">'
  + '</div>'
  + '<div id="' + id + '" class="editor" contenteditable="true" style="overflow: scroll; height:300px">'
  + '</div>');

  $('#' + id).wysiwyg({
        hotKeys: {
            'ctrl+b meta+b': 'bold',
            'ctrl+i meta+i': 'italic',
            'ctrl+u meta+u': 'underline',
            'ctrl+z meta+z': 'undo',
            'ctrl+y meta+y meta+shift+z': 'redo'
        },
        dragAndDropImages: true
    });

	var callback = {
 			setValue: function(val) {
 				$('#' + id).html(val);
 			},
 			getValue: function() {
 				return $('#' + id).cleanHtml();
 			},
 			reset: function() {
 				var val = options.value;
 				$('#' + id).val(val);
 				$('#' + id).trigger('change');
 			},
 			disable: function() {
 				
 			},
 			enable: function() {

 			},
 			options: function() {
 				return options;
 			},
 			getInput: function() {
 				return $('#' + id);
 			},
 			clear: function() {
 				$('#' + id).html(val);
 			}
 		};

	callback.setValue(options.value);

	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	return callback;
}


/**
 * A buttonised dropdown
 */
$.fn.selectButton = function(data) {
	
	var obj = $.extend(
		{ idAttr: 'id', 
			nameAttr: 'name', 
			valueAttr: 'value', 
			nameIsResourceKey : false, 
			resourceKeyTemplate: '{0}', 
			disabled : false, 
			value: '', 
			nameIsResourceKey: false,
			getUrlData: function(data) {
				return data;
			}
		}, data);
	
	var id = (obj.id ? obj.id : $(this).attr('id') + "SelectButton");

	$(this).append('<div class="btn-group"><input id="' 
			 + id + '" type="hidden" name="select_value_' + id + '" value="'
			 + obj.value + '"><button type="button" id="button_' + id + '" class="btn btn-primary dropdown-toggle" data-toggle="dropdown"><span id="select_button_' 
			 + id + '">' + (obj.nameIsResourceKey ? getResource(obj.name) : obj.name) + '</span>&nbsp;<span class="btn-icon caret"></span></button><ul id="'
			 + 'select_' + id + '" class="dropdown-menu' + (obj.dropdownPosition ? ' ' + obj.dropdownPosition : '') + '" role="menu"></div>');

	var selected = null;
	
	if(obj.emptySelectionAllowed == 'true') {
		$('#select_' + id).append('<li><a id="data_' + id + "_" + i + '" class="selectButton_'
				+ id + '" href="#" data-value="" data-label="' + obj.emptySelectionText + '">' 
				+ obj.emptySelectionText + '</a></li>');
	}
	
	var callback = {
			setValue: function(val) {
				$('#' + id).val(val);
				var selected = $('#select_' + id).find('[data-value="' + $('#' + id).val() + '"]');
				$('#select_button_' + id).text(selected.attr('data-label'));
			},
			changed: function() {
				if(obj.changed) {
					obj.changed(callback);
				}
			},
			getValue: function() {
				return $('#' + id).val();
			},
			getSelectedObject: function() {
				var selected = $('#select_' + id).find('[data-value="' + $('#' + id).val() + '"]');
				return selected.data('resource');
			},
			reset: function() {
				$('#' + id).val(obj.value);
				var selected = $('#select_' + id).find('[data-value="' + $('#' + id).val() + '"]');
				$('#select_button_' + id).text(selected.attr('data-label'));
			},
			disable: function() {
				$('#button_' + id).removeAttr('data-toggle');
				$('#button_' + id).removeClass('btn-primary');
				$('#button_' + id).addClass('btn-disabled-dark');
			},
			enable: function() {
				$('#button_' + id).attr('data-toggle', 'dropdown');
				$('#button_' + id).removeClass('btn-disabled-dark');
				$('#button_' + id).addClass('btn-primary');
			},
			options: function() {
				return obj;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				if(obj.emptySelectionAllowed) {
 					$('#' + id).val('');			
 				} else {
 					$('#' + id).val(obj.value);
 				}
 				var selected = $('#select_' + id).find('[data-value="' + $('#' + id).val() + '"]');
					$('#select_button_' + id).text(selected.attr('data-label'));
 			}
		};
	
	if (obj.options) {
		
		for (var i = 0; i < obj.options.length; i++) {
			if (obj.value == obj.options[i][obj.valueAttr]) {
				selected = obj.options[i];
				$('#select_button_' + id).text(obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj.nameAttr])) : obj.options[i][obj.nameAttr]);
				$('#select_' + id).append('<li><a id="data_' + id + "_" + i + '" class="selectButton_' + id + '" href="#" data-value="' 
						+ stripNull(obj.options[i][obj['valueAttr']]) + '" data-label="' 
						+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj['nameAttr']])) : obj.options[i][obj['nameAttr']]) + '">' 
						+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj['nameAttr']])) : obj.options[i][obj['nameAttr']]) + '</a></li>');
			} else {
				$('#select_' + id).append('<li><a id="data_' + id + "_" + i + '" class="selectButton_' + id + '" href="#" data-value="' 
						+ stripNull(obj.options[i][obj['valueAttr']]) + '" data-label="'
						+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj['nameAttr']])) : obj.options[i][obj['nameAttr']]) + '">'
						+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj['nameAttr']])) : obj.options[i][obj['nameAttr']]) + '</a></li>');
			}
			$('#data_' + id + "_" + i).data('resource', obj.options[i]);
		}
		

		$('.selectButton_' + id).on('click',
			function(evt) {
				evt.preventDefault();
				
				$('#' + id).val($(this).attr('data-value'));
				$('#select_button_' + id).text($(this).attr('data-label'));
				if(obj.changed) {
					obj.changed(callback);
				}
			});
			
			if(selected==null) {
				var val = $('.selectButton_' + id).first().trigger('click');
			}

	} else if (obj.url) {
		getJSON(obj.url, null,
			function(data) {
				$.each(obj.getUrlData(data), function(idx, option) {
					if (option[obj['valueAttr']] == obj.value) {
						selected = option;
						$('#select_button_' + id).text(obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]);
						$('#select_' + id).append('<li><a id="data_' + id + "_" + idx + '" class="selectButton_' + id + '" href="#" data-value="' 
								+ stripNull(option[obj['valueAttr']]) + '" data-label="' 
								+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]) + '">' 
								+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]) + '</a></li>');
					} else {
						$('#select_' + id).append('<li><a id="data_' + id + "_" + idx + '" class="selectButton_' + id + '" href="#" data-value="' 
								+ stripNull(option[obj['valueAttr']]) + '" data-label="' 
								+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]) + '">' 
								+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]) + '</a></li>');
					}
					$('#data_' + id + "_" + idx).data('resource', option);
				});

				$('.selectButton_' + id).on(
						'click',
						function(evt) {
							evt.preventDefault();
							$('#' + id).val($(this).attr('data-value'));
							$('#select_button_' + id).text($(this).attr('data-label'));
							if(obj.changed) {
								obj.changed(callback);
							}
				});
				
				if(selected==null) {
					var val = $('.selectButton_' + id).first().trigger('click');
				}
			});
	}
		
	if(obj.disabled) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	return callback;
}

/**
 * A text box that shows a dropdown for auto-completion
 */
$.fn.autoComplete = function(data) {
	
	var options = $.extend(
		{ valueAttr : 'value', 
			nameAttr : 'name', 
			nameIsResourceKey : false, 
			selectAllIfEmpty : false, 
			selectedIsObjectList : false, 
			isResourceList: true,
			disabled : false, 
			remoteSearch: false,
			resourceKeyTemplate: '{0}' 
		}, data);
	
	var id = (options.id ? options.id : $(this).attr('id') + "AutoComplete");
	
	$(this).append('<div class="dropdown input-group"><input type="hidden" id="' + id 
			+ '"><input type="text" id="input_' + id + '" class="form-control dropdown-toggle" data-toggle="dropdown" value=""' + (options.disabled ? 'disabled=\"disabled\"' : '') + '>' 
			+ '<ul id="' + 'auto_' + id + '" class="dropdown-menu" role="menu"><li><a tabindex="-1" href="#">' + getResource('search.text') + '</a></li></ul>' 
			+ '<span class="input-group-addon"><i id="spin_' + id + '" class="fa fa-search"></i></span></div>');
	
	var buildData = function(values) {
		var map = [];
		$.each(values, function(idx, obj) {
			map[obj[options.valueAttr]] = obj;
			if(obj[options.valueAttr]==options.value) {
				$('#' + id).val(options.value);
				$('#input_' + id).val(options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]);
			}
		});
		$('#input_' + id).data('values', values);
		$('#input_' + id).data('map', map);
	};
	
	var createDropdown = function(text) {
		
		var selected = new Array();
		var tooManyResults = false;
		$.each($('#input_' + id).data('values'), function(idx, obj) {
			var name = options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr];
			if(name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
				selected.push(obj);
				tooManyResults = selected.length > 10;
			}
			return !tooManyResults;
		});
		
		selected.sort(function(a, b) {
			var nameA = options.nameIsResourceKey ? getResource(a[options.nameAttr]) : a[options.nameAttr];
			var nameB = options.nameIsResourceKey ? getResource(b[options.nameAttr]) : b[options.nameAttr];
			
			if(nameA > nameB) {
				return 1;
			}
			if(nameB > nameA) {
				return -1;
			}
			return 0;
		});
		
		$('#auto_' + id).empty();
		if(!tooManyResults && selected.length > 0 && text != '') {
			$.each(selected, function(idx, obj) {
				$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" data-value="' + obj[options.valueAttr] + '" href="#">' 
						+ (options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]) + '</a></li>');
			});
			$('.optionSelect').off('click');
			$('.optionSelect').on('click', function() {
				var value = $(this).data('value');
				var obj = $('#input_' + id).data('map')[value];
				$('#' + id).val(value);
				$('#input_' + id).val($(this).text());
				$('[data-toggle="dropdown"]').parent().removeClass('open');
				
				if(options.changed) {
					options.changed(obj);
				}
			});

		} else {
			if(tooManyResults) {
				$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("tooManyResults.text") + '</a></li>');
			} else {
				if(text=='') {
					$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("search.text") + '</a></li>');
				} else {
					$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("noResults.text") + '</a></li>');
				}
			}
		}
		$('#input_' + id).dropdown();
		$('[data-toggle="dropdown"]').parent().removeClass('open');
		$('#input_' + id).dropdown('toggle');
		$('#spin_' + id).removeClass('fa-spin');
		$('#spin_' + id).removeClass('fa-spinner');
		$('#spin_' + id).addClass('fa-search');
	}
	
	$('#input_' + id).keyup(function() {
		$('#spin_' + id).removeClass('fa-search');
		$('#spin_' + id).addClass('fa-spin');
		$('#spin_' + id).addClass('fa-spinner');
		var text = $(this).val();
		
		
		if(!options.remoteSearch) {
			createDropdown(text);
		} else {
			getJSON(
					options.url + '?iDisplayStart=0&iDisplayLength=10&sSearch=' + text,
					null,
					function(data) {
						
						var map = [];
						$.each(data.aaData, function(idx, obj) {
							map[obj[options.valueAttr]] = obj[options.nameAttr];
							if(obj[options.valueAttr]==options.value) {
								$('#' + id).val(options.value);
								$('#input_' + id).val(options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]);
							}
						});
						$('#input_' + id).data('values', data.aaData);
						$('#input_' + id).data('map', map);
						
						createDropdown(text);
					});
			
		}
		
	});
	
	var callback = {
			setValue: function(val) {
				$.each($('#input_' + id).data('values'), function(idx, obj) {
					if(obj[options.valueAttr]==val) {
						$('#' + id).val(val);
						$('#input_' + id).val(options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]);
						if(options.changed) {
							options.changed(obj);
						}
					}
				});
				
			},
			getValue: function() {
				return $('#' + id).val();
			},
			reset: function() {
				$.each($('#input_' + id).data('values'), function(idx, obj) {
					if(obj[options.valueAttr]==options.val) {
						$('#' + id).val(options.val);
						$('#input_' + id).val(options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]);
					}
				});
			},
			disable: function() {
				$('#input_' + id).attr('disabled', true);
			},
			enable: function() {
				$('#input_' + id).attr('disabled', false);
			},
			options: function() {
				return obj;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).val('');
				$('#input_' + id).val('');
 			}
	};

	if(options.disabled) {
		callback.disable();
	}
	
	if(options.url && !options.remoteSearch) {
		getJSON(
			options.url,
			null,
			function(data) {
				buildData(options.isResourceList ? data.resources : data);
			});
	} else if(options.values && !options.remoteSearch) {
		buildData(options.values);
	} 
	
	$(this).data('widget', callback);
	return callback;
	
}

/**
 * Shows 2 list boxes so that values can be moved between them.
 */
$.fn.multipleSelect = function(data) {

	var id = $(this).attr('id');

	if ($(this).data('created')) {

		options = $(this).widget().options();
		if ((options.selected && options.selected.length == 0) && options.selectAllIfEmpty) {
			var allExcludedOptions = $('#' + id + 'ExcludedSelect option');
			if (allExcludedOptions.length > 0) {
				$('#' + id + 'IncludedSelect').append(
					$(allExcludedOptions).clone());
				$(allExcludedOptions).remove();
			}
			;
		} else {
			var allIncludedOptions = $('#' + id + 'IncludedSelect option');
			if (allIncludedOptions.length > 0) {
				$('#' + id + 'ExcludedSelect').append(
					$(allIncludedOptions).clone());
				$(allIncludedOptions).remove();
			}
			;
		}
		var select = $('#' + id + 'ExcludedSelect');
		var toSelect = $('#' + id + 'IncludedSelect');

		if (options.selected) {
			$.each(
				options.selected,
				function(idx, id) {
					var selectedOpt;
					if (options.selectedIsObjectList) {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
					} else {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
					}
					if (selectedOpt) {
						toSelect.append($(selectedOpt).clone());
						$(selectedOpt).remove();
					}
				});
		}

		if (data && data.insert) {
			$.each(
				data.insert,
				function(idx, obj) {
					select.append('<option ' + 'value="' + obj[options.idAttr] + '">' 
							+ (options.nameIsResourceKey ? (getResource(obj[options.nameAttr]) == undefined 
									? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
				});
		}

		if (data && data.remove) {
			$.each(
				data.remove,
				function(idx, obj) {
					if (options.selectedIsObjectList) {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + obj[options.idAttr] + '"]');
						if (!selectedOpt) {
							selectedOpt = $('#' + toSelect.attr('id') + ' option[value="' + obj[options.idAttr] + '"]');
						}
					} else {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + obj + '"]');
						if (!selectedOpt) {
							selectedOpt = $('#' + toSelect.attr('id') + ' option[value="' + obj + '"]');
						}
					}
					if (selectedOpt) {
						$(selectedOpt).remove();
					}
				});
		}

		if (data && data.selected) {
			$.each(
				data.selected,
				function(idx, id) {
					var selectedOpt;
					if (options.selectedIsObjectList) {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
					} else {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
					}
					if (selectedOpt) {
						toSelect.append($(selectedOpt).clone());
						$(selectedOpt).remove();
					}
				});
		}

		if(data && data.disabled || options.disabled) {
			$(this).widget().disable();
		} else {
			$(this).widget().enable();
		}
		return;

	} else {

		var options = $
				.extend(
					{ idAttr : 'id', 
						nameAttr : 'name', 
						nameIsResourceKey : false, 
						selectAllIfEmpty : false, 
						selectedIsObjectList : false, 
						disabled : false, 
						valuesIsObjectList: true,
						resourceKeyTemplate: '{0}',
						excludedLabelResourceKey: 'text.excluded',
						includedLabelResourceKey: 'text.included',
						isArrayValue: true,
						allowOrdering: false,
						getUrlData: function(data) {
							return data;
						}
				}, data);


		var callback = {
				setValue: function(val) {
					// Cannot be done yet.
				},
				getValue: function() {
					result = new Array();

					$('#' + id + 'IncludedSelect option').each(function() {
						result.push($(this).val());
					});
					return result;
				},
				reset: function() {
					$('#' + id).multipleSelect();
				},
				disable: function() {
					$('#' + id + 'AddButton').attr('disabled', true);
					$('#' + id + 'RemoveButton').attr('disabled', true);
					$('#' + id + 'ExcludedSelect').attr('disabled', true);
					$('#' + id + 'IncludedSelect').attr('disabled', true);
				},
				enable: function() {
					$('#' + id + 'AddButton').attr('disabled', false);
					$('#' + id + 'RemoveButton').attr('disabled', false);
					$('#' + id + 'ExcludedSelect').attr('disabled', false);
					$('#' + id + 'IncludedSelect').attr('disabled', false);
				},
				options: function() {
					return options;
				},
				getInput: function() {
					return $('#' + id);
				},
	 			clear: function() {
	 				$('#' + id).multipleSelect();
	 			}
		};
		
		$('#' + id + 'Excluded').remove();
		$('#' + id + 'Buttons').remove();
		$('#' + id + 'Included').remove();

		$(this).addClass('container-fluid');
		
		$(this).append('<div class="excludedList col-md-5" id="' + id 
				+ 'Excluded"><label>' + getResource(options.excludedLabelResourceKey) + '</label></div>');
		
		$('#' + id + 'Excluded').append(
					'<select ' + (!options.disabled ? '' : 'disabled="disabled" ') + 'multiple="multiple" id="' + id
						+ 'ExcludedSelect" class="formInput text form-control"/>');

		$(this).append('<div class="listButtons" id="' + id + 'Buttons"/>');
		
		$('#' + id + 'Buttons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' + id + 'AddButton"><i class="fa fa-chevron-circle-right"></i></button><br/>');
		
		$('#' + id + 'Buttons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' + id + 'RemoveButton"><i class="fa fa-chevron-circle-left"></i></button>');
		
		$(this).append('<div class="includedList col-md-5" id="' + id 
				+ 'Included"><label>' + getResource(options.includedLabelResourceKey) + '</label></div>');
		
		$('#' + id + 'Included').append('<select ' + (!options.disabled ? '' : 'disabled="disabled" ') 
				+ 'multiple="multiple" id="' + id + 'IncludedSelect" class="formInput text form-control"/>');

		$('#' + id + 'AddButton').button();
		$('#' + id + 'RemoveButton').button();

		var select = $('#' + id + 'ExcludedSelect');
		var toSelect = $('#' + id + 'IncludedSelect');

		if(options.allowOrdering) {
			$(this).append('<div class="listButtons" id="' + id + 'OrderButtons"/>');
			
			$('#' + id + 'OrderButtons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' 
					+ id 
					+ 'UpButton"><i class="fa fa-chevron-circle-up"></i></button><br/>');
			
			$('#' + id + 'OrderButtons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' 
					+ id 
					+ 'DownButton"><i class="fa fa-chevron-circle-down"></i></button>');
			
			$('#' + id + 'UpButton').click(function(e) {
					e.preventDefault();
					$('#' + toSelect.attr('id') + ' option:selected').each(function(){
						$(this).insertBefore($(this).prev());
						if (options.changed) {
							options.changed(callback);
						}
					});
			});
			
			$('#' + id + 'DownButton').click(function(e) {
				e.preventDefault();
				$('#'  + toSelect.attr('id') + ' option:selected').each(function(){
					$(this).insertAfter($(this).next());
					if (options.changed) {
						options.changed(callback);
					}
				});
			});
		}
		
		$('#' + id + 'AddButton').click(function(e) {
			var selectedOpts = $('#' + select.attr('id') + ' option:selected');
			if (selectedOpts.length == 0) {
				e.preventDefault();
			}

			toSelect.append($(selectedOpts).clone());
			$(selectedOpts).remove();
			e.preventDefault();

			if (options.changed && selectedOpts.length != 0) {
				options.changed(callback);
			}
		});

		$('#' + id + 'RemoveButton').click(function(e) {
			var selectedOpts = $('#' + toSelect.attr('id') + ' option:selected');
			if (selectedOpts.length == 0) {
				e.preventDefault();
			}

			select.append($(selectedOpts).clone());
			$(selectedOpts).remove();
			e.preventDefault();

			if (options.changed && selectedOpts.length != 0) {
				options.changed(callback);
			}
		});

	}

	if(options.useVariablesAsValues) {
		options.values = options.variables;
		options.valuesIsObjectList = false;
	}
	
	if (options.values) {

		$.each(options.values,
			function(idx, obj) {
				var selectItem = options.selectAllIfEmpty == "true" && (options.selected && options.selected.length==0) ? toSelect : select;
				
				if(options.valuesIsObjectList) {
					selectItem.append('<option ' + 'value="' + obj[options.idAttr] + '">' + (options.nameIsResourceKey 
							? (getResource(options.resourceKeyTemplate.format(obj[options.nameAttr])) == undefined ? obj[options.nameAttr] 
								: getResource(options.resourceKeyTemplate.format(obj[options.nameAttr]))) : obj[options.nameAttr]) + "</option>");
				} else {
					selectItem.append('<option ' + 'value="' + obj + '">' + (options.nameIsResourceKey 
							? (getResource(options.resourceKeyTemplate.format(obj)) == undefined ? obj
								: getResource(options.resourceKeyTemplate.format(obj))) : obj) + "</option>");
				}
		});

		if (options.selected) {
			$.each(options.selected,
				function(idx, id) {
					var selectedOpt;
					if (options.selectedIsObjectList) {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
					} else {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
					}
					if (selectedOpt) {
						toSelect.append($(selectedOpt).clone());
						$(selectedOpt).remove();
					}
				});
		}

	} else if (options.url) {
		getJSON(
			options.url,
			null,
			function(data) {
				$.each(options.getUrlData(data),
					function(idx, obj) {
					
					var selectItem = ((!options.selected || (options.selected && options.selected.length == 0)) && options.selectAllIfEmpty ? toSelect : select);
					if(options.valuesIsObjectList) {
						selectItem.append('<option ' + 'value="' + obj[options.idAttr] + '">' + (options.nameIsResourceKey 
								? (getResource(options.resourceKeyTemplate.format(obj[options.nameAttr])) == undefined ? obj[options.nameAttr] 
									: getResource(options.resourceKeyTemplate.format(obj[options.nameAttr]))) : obj[options.nameAttr]) + "</option>");
					} else {
						selectItem.append('<option ' + 'value="' + obj + '">' + (options.nameIsResourceKey 
								? (getResource(options.resourceKeyTemplate.format(obj)) == undefined ? obj
									: getResource(options.resourceKeyTemplate.format(obj))) : obj) + "</option>");
					}
				});

				if (options.selected) {
					$.each(options.selected,
						function(idx, id) {
							var selectedOpt;
							if (options.selectedIsObjectList) {
								selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
							} else {
								selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
							}
							if (selectedOpt) {
								toSelect.append($(selectedOpt).clone());
								$(selectedOpt).remove();
							}
						});
				}
			});
	}

	if(options.disabled) {
		callback.disable();
	}
	
	$(this).data('created', true);
	$(this).data('widget', callback);
	return callback;

};

/**
 * Helper to support older resources that still use this
 * method of getting the values.
 */
$.fn.multipleSelectValues = function() {
	return $(this).data('widget').getValue();
};

/**
 * Shows a text box and list box with the ability to insert the text into the list.
 */
$.fn.multipleTextInput = function(data) {

	var id = $(this).attr('id');
	
	if ($(this).data('created')) {

		options = $(this).widget().options();

		var inputText = $('#' + id + 'ExcludedSelect');
		inputText.val('');
		var allIncludedOptions = $('#' + id + 'IncludedSelect option');
		if (allIncludedOptions.length > 0) {
			$(allIncludedOptions).remove();
		}

		var toSelect = $('#' + id + 'IncludedSelect');

		if(data && data.values) {
			options.values = data.values;
		} 
		
		if (options.values) {
			$.each(options.values, function(idx, obj) {
				toSelect.append('<option ' + 'value="' + obj + '">' + obj + "</option>");
			});
		}

		return;

	} else {

		var options = $
				.extend(
					{ idAttr : 'id', 
						nameAttr : 'name', 
						nameIsResourceKey : false, 
						selectAllIfEmpty : false, 
						selectedIsObjectList : false, 
						disabled : false,
						isArrayValue: true },
					data);


		$('#' + id + 'Excluded').remove();
		$('#' + id + 'Buttons').remove();
		$('#' + id + 'Included').remove();

		$(this).append('<div class="excludedList" id="' + id + 'Excluded"></div>');

		if(options.variables) {
			$('#' + id + 'Excluded').textInput({
				id: id + 'ExcludedSelect',
				isPropertyInput: false,
				variables: options.variables
			});
		} else {
			$('#' + id + 'Excluded').append(
					'<input type="text" ' + (!options.disabled ? '' : 'disabled="disabled" ') + 'id="' 
							+ id + 'ExcludedSelect" class="formInput text form-control" />');
		}

		$(this).append('<div class="multipleTextInputButtons" id="' + id + 'Buttons"/>');
		
		$('#' + id + 'Buttons').append(
		'<button class="btn-multiple-select btn btn-primary" id="' 
				+ id 
				+ 'AddButton"><i class="fa fa-chevron-circle-right"></i></button><br/>');
		
		$('#' + id + 'Buttons').append(
				'<button class="btn-multiple-select btn btn-primary" id="' 
						+ id 
						+ 'RemoveButton"><i class="fa fa-chevron-circle-left"></i></button>');

		$(this).append('<div class="includedList" id="' + id + 'Included"></div>');
		$('#' + id + 'Included').append(
					'<select ' + (!options.disabled ? '' : 'disabled="disabled" ') + 'multiple="multiple" id="' 
							+ id + 'IncludedSelect" class="formInput text form-control"/>');

		var select = $('#' + id + 'ExcludedSelect');
		var toSelect = $('#' + id + 'IncludedSelect');
		
		if(options.allowOrdering) {
			$(this).append('<div class="multipleTextInputButtons" id="' + id + 'OrderButtons"/>');
			
			$('#' + id + 'OrderButtons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' 
					+ id 
					+ 'UpButton"><i class="fa fa-chevron-circle-up"></i></button><br/>');
			
			$('#' + id + 'OrderButtons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' 
					+ id 
					+ 'DownButton"><i class="fa fa-chevron-circle-down"></i></button>');
			
			$('#' + id + 'UpButton').click(function(e) {
					e.preventDefault();
					$('#' + toSelect.attr('id') + ' option:selected').each(function(){
						$(this).insertBefore($(this).prev());
					});
			});
			
			$('#' + id + 'DownButton').click(function(e) {
				e.preventDefault();
				$('#'  + toSelect.attr('id') + ' option:selected').each(function(){
					$(this).insertAfter($(this).next());
				});
			});
		}

		

		$('#' + id + 'AddButton')
				.click(
					function(e) {
						e.preventDefault();
						var selectedText = select.val();
						if (selectedText == '') {

							return;
						}

						toSelect
								.append('<option ' + 'value="' + selectedText + '">' + selectedText + "</option>");
						select.val('');
						toSelect.data('updated', true);
						if (data.change) {
							data.change();
						}
					});

		$('#' + id + 'RemoveButton').click(function(e) {
			e.preventDefault();
			var selectedOpts = $('#' + toSelect.attr('id') + ' option:selected');
			if (selectedOpts.length == 0) {
				return;
			}

			select.val($(selectedOpts).val());
			$(selectedOpts).remove();

			toSelect.data('updated', true);

			if (data.change) {
				data.change();
			}
		});

	}

	if (options.values) {
		$.each(options.values, function(idx, obj) {
			toSelect.append('<option ' + 'value="' + obj + '">' + obj + "</option>");
		});
	}
	
	var callback = {
			setValue: function(val) {
				// Cannot be done yet.
			},
			getValue: function() {
				result = new Array();

				$('#' + id + 'IncludedSelect option').each(function() {
					result.push($(this).val());
				});
				return result;
			},
			reset: function() {
				$('#' + id).multipleTextInput();
			},
			disable: function() {
				$('#' + id + 'AddButton').attr('disabled', true);
				$('#' + id + 'RemoveButton').attr('disabled', true);
				$('#' + id + 'IncludedSelect').attr('disabled', true);
			},
			enable: function() {
				$('#' + id + 'AddButton').attr('disabled', false);
				$('#' + id + 'RemoveButton').attr('disabled', false);
				$('#' + id + 'IncludedSelect').attr('disabled', false);
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).multipleTextInput();
 			}
	};

	if(options.disabled) {
		callback.disable();
	}
	
	$(this).data('created', true);
	$(this).data('widget', callback);
	
	return callback;
};



/**
 Date Input
**/

$.fn.dateInput = function(options) {
	
	var id = (options.id ? options.id : $(this).attr('id') + "DateInput");
	
	var options = $.extend(
			{   format: "yyyy-mm-dd",
			    startView: 0,
			    orientation: "top auto",
			    multidate: false,
			    forceParse: false,
			    autoclose: true
			},  options);
	
	$(this).append('<div id="' + id + '" class="input-group date">'
			+ '<input id="' + id + 'Field" type="text" class="form-control">'
			+ '<span class="input-group-addon"><i class="fa fa-calendar"></i></span></div>');
	
	$('#' + id).datepicker(options).on('show', function() {
		// Fix for being in a modal
		var modal = $('#' + id).closest('.modal');
		var datePicker = $('body').find('.datepicker');
		if(!modal.length) {
			$(datePicker).css('z-index', 'auto');
			return;
		}
		var zIndexModal = $(modal).css('z-index');
			$(datePicker).css('z-index', zIndexModal + 1);
	});
	
	var callback = {
			setValue: function(val) {
				$('#' + id + 'Field').val(val);
			},
			getValue: function() {
				return $('#' + id + 'Field').val();
			},
			reset: function() {
				$('#' + id + 'Field').val(options.value);
			},
			disable: function() {
				$('#' + id + 'Field').attr('disabled', true);
			},
			enable: function() {
				$('#' + id + 'Field').attr('disabled', false);
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id + 'Field').val('');
 			}
	};

	if(options.disabled) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	return callback;
};

/**
 * Time input
 */
$.fn.timeInput = function(options) {
	
	var id = (options.id ? options.id : $(this).attr('id') + "TimeInput");
	
	var options = $.extend(
			{   template: 'dropdown',
				minuteStep: 15,
				showSeconds: false,
				secondStep: 15,
				defaultTime: (options.value ? options.value : 'current'),
				showMeridian: false,
				showInputs: true,
				disableFocus: false,
				disableMouseWheel: false,
				modalBackdrop: false,
				showWidgetOnAddonClick: true
			},  options);
	
	$(this).append('<div class="input-group bootstrap-timepicker">'
			+ '<input id="' + id + '" type="text" class="input-small form-control">'
			+ '<span class="input-group-addon"><i class="fa fa-clock-o"></i></span></div>');
	
	$('#'+ id).timepicker(options);
	
	$('#' + id).click(function(e) {
		$('#' + id).timepicker('showWidget');
	});
	
	var callback = {
			setValue: function(val) {
				$('#' + id).timepicker('setTime', val);
			},
			getValue: function() {
				return $('#' + id).val();
			},
			reset: function() {
				$('#' + id).timepicker('setTime', (options.value ? options.value : 'current'));
			},
			disable: function() {
				$('#' + id).attr('disabled', true);
			},
			enable: function() {
				$('#' + id).attr('disabled', false);
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).timepicker('setTime', false);
 			}
	};
	
	$('#'+ id).timepicker().on('changeTime.timepicker', function(e) {
	    if(options.changed) {
	    	options.changed(callback);
	    }
	});

	if(options.disabled) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	return callback;
	
};

$.fn.buttonAction = function(options) {
	
	var id = (options.id ? options.id : $(this).attr('id') + "ButtonAction");
	
	var obj = $.extend(
			{   readOnly: false,
			    disabled: false,
			    buttonClass: 'btn-primary',
			    buttonIcon: 'fa-save',
			    buttonLabel: 'button'
			},  options);
	
	$(this).append(
		'<button class="btn ' + obj.buttonClass 
				+ '" id="' + id + '"><i class="fa ' + obj.buttonIcon 
				+ '"></i>' + getResource(obj.buttonLabel) + '</button>');

	var el = $('#'+ id);
	el.on('click', function(e) {
		window[obj.script].apply(null, [el]);
	});
	
	var callback = {
			setValue: function(val) {
				
			},
			getValue: function() {
				return "";
			},
			reset: function() {

			},
			disable: function() {
				$('#' + id).attr('disabled', true);
			},
			enable: function() {
				$('#' + id).attr('disabled', false);
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				
 			}
	};

	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	return callback;
};


$.fn.booleanInput = function(options) {
	
	var id = (options.id ? options.id : $(this).attr('id') + "BooleanInput");
	
	var obj = $.extend(
			{   readOnly: false,
			    disabled: false
			},  options);
	
	$(this).append('<input type="checkbox" class="form-control" id="' + id + '" name="' + id + '" value="true"' + (stripNull(obj.value) == true ? ' checked' : '') + '/>');

	var callback = {
			setValue: function(val) {
				$('#' + id).prop('checked', val)
			},
			getValue: function() {
				return $('#' + id).is(':checked');
			},
			reset: function() {
				$('#' + id).prop('checked', options.value);
			},
			disable: function() {
				$('#' + id).attr('disabled', true);
			},
			enable: function() {
				$('#' + id).attr('disabled', false);
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).prop('checked', options.value);
 			}
	};

	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	return callback;
};


$.fn.switchInput = function(options) {
	
	var id = (options.id ? options.id : $(this).attr('id') + "BooleanInput");
	
	var obj = $.extend(
			{   readOnly: false,
			    disabled: false,
			    onResourceKey: 'text.on',
			    offResourceKey: 'text.off'
			},  options);

	$(this).append('<label class="switch"><input type="checkbox" class="switch-input" id="'
						+ id + '" name="input' + id + '" value="true"' 
						+ (stripNull(obj.value) == true ? ' checked' : '') 
						+ '><span class="switch-label" data-on="' 
						+ getResource(obj.onResourceKey) + '" data-off="' 
						+ getResource(obj.offResourceKey) + '"></span> <span class="switch-handle"></span></label>');

	
	var callback = {
			setValue: function(val) {
				$('#' + id).prop('checked', val ? 'checked' : '');
			},
			getValue: function() {
				return $('#' + id).is(':checked');
			},
			reset: function() {
				$('#' + id).prop('checked', obj.value ? 'checked' : '');
			},
			disable: function() {
				$('#' + id).attr('disabled', true);
			},
			enable: function() {
				$('#' + id).attr('disabled', false);
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).prop('checked', obj.value ? 'checked' : '');
 			}
	};

	$('#' + id).change(function() {
		if(options.changed) {
			options.changed(callback);
		}
	});
	
	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	return callback;
};


$.fn.imageInput = function(options) {
	
	var id = (options.id ? options.id : $(this).attr('id') + "ImageInput");
	
	var obj = $.extend(
			{   readOnly: false,
			    disabled: false,
			},  options);
	
	

	$(this).append('<input type="file" class="form-control" id="' + id + '" name="input' + id + '"/>');
	$(this).append('<img class="imagePreview" src="' + obj.value + '">');
	
	var input = $('#' + id);
	
	input.change(function() {
		var reader = new FileReader();
		reader.onload = function(readerEvt) {
			var binaryString = readerEvt.target.result;
			var encoded = btoa(binaryString);
			var fileName = input.val().split('/').pop().split('\\').pop();
			input.data('encoded', fileName + ";" + encoded);
		};
	
		reader.readAsBinaryString(input[0].files[0]);
	});
	
	var callback = {
			setValue: function(val) {
				input.val('');
			},
			getValue: function() {
				return input.data('encoded');
			},
			reset: function() {
				
			},
			disable: function() {
				$('#' + id).attr('disabled', true);
			},
			enable: function() {
				$('#' + id).attr('disabled', false);
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				input.val('');
 			}
	};

	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	return callback;
};


$.fn.sliderInput = function(options) {
	
	var id = (options.id ? options.id : $(this).attr('id') + "SliderInput");
	
	var obj = $.extend(options,
			{   min: parseInt(options.min),
			    max: parseInt(options.max),
			    step: options.step ? parseInt(options.step) : 1,
			    handle: options.handle ? options.handle : 'square',
			    tooltip: options.tooltip ? options.tooltip : 'show',
			    value: parseInt(options.value),
			    formater: function(value) {
			    	return value + ' ' + getResource(obj.labelResourceKey);
			    }
			});

	$(this).append('<input class="form-control" id="' + id + '" data-slider-id="slider_' + id + '" value="' + obj.value + '" type="text">');

	var slider = $('#' + id).slider(obj);
	
	var callback = {
			setValue: function(val) {
				$('#' + id).slider('setValue', val);
			},
			getValue: function() {
				return $('#' + id).val();
			},
			reset: function() {
				$('#' + id).slider('setValue', obj.value);
			},
			disable: function() {
				$('#' + id).attr('disabled', true);
			},
			enable: function() {
				$('#' + id).attr('disabled', false);
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			}, 
			clear: function() {
				$('#' + id).slider('setValue', obj.value);
			}
	};

	slider.on('slide', function(ev){
		   if(options.changed) {
			   options.changed(callback)
		   }
	});
	
	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	return callback;
};

$.fn.namePairInput = function(data) {
	
	var options = $.extend(
			{  
				text: "Add name/value pair",
				maxRows : 0,
				disabled : false, 
				readOnly: false,
				disableName: false,
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
	
	if(getResourceNoDefault(options.text)) {
		options.text = getResourceNoDefault(options.text);
	}
	
	var nameWeight = 'col-xs-5';
	var valueWeight = 'col-xs-6';
	if(options.columnWeight=='nameHeavy') {
		nameWeight = 'col-xs-8';
		valueWeight = 'col-xs-3';
	}else if(options.columnWeight=='valueHeavy'){
		nameWeight = 'col-xs-3';
		valueWeight = 'col-xs-8';
	}else if(options.columnWeight=='separateLines'){
		nameWeight = 'col-xs-11';
		valueWeight = 'col-xs-11';
	}
	
	var nameVariables = options.nameVariables.concat(options.variables);
	var valueVariables = options.valueVariables.concat(options.variables);
	var html = 	'<div id="' + id + '" class="propertyItem form-group">'
			+	'	<div id="' + id + 'NamePairs" ></div>'
			+	'	<div id="' + id + 'NewRow" class="row">'
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
 				callback.removeRows();
 				$.each(val, function(index, value){
 					callback.addRows(1);
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
 					if (!this.id.startsWith(id + 'NamePairName') || (this.id.startsWith(id + 'NamePairName') && !options.disableName)) {
 						$(this).data('widget').enable();
 					}
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
 	 				html =	'<div class="row namePairInput">'
 	 					+	'	<div id="' + id + 'NamePairName' + rowNum + '" class="form-group propertyValue ' + nameWeight + ' namePairName"></div>'
 	 					+	'	<div id="' + id + 'NamePairValue' + rowNum + '" class="form-group propertyValue ' + valueWeight + ' namePairValue"></div>'
 	 					+	'	<div class="propertyValue col-xs-1 dialogActions">'
 	 					+ 	'		<a href="#" class="removePair btn btn-danger"><i class="fa fa-trash-o"></i></a>'
 	 					+ 	'	</div>'
 	 					+	'</div>';
 	 				$('#' + id + 'NamePairs').append(html);
 	 				$('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairName').textInput({
 	 					variables: nameVariables,
 	 					disabled: options.disabled || options.disableName
 	 				});
 	 				$('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairValue').textInput({
 	 					variables: valueVariables,
 	 					disabled: options.disabled
 	 				});
 	 				$('.removePair').click(function(){
 	 					$(this).closest('.namePairInput').remove();
 	 					$('#' + id + 'NewRow').show();
 	 				});
 	 				if(options.maxRows != 0 && $('#' + id + 'NamePairs').children().length == options.maxRows){
 	 					$('#' + id + 'NewRow').hide();
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

$.fn.fileUploadInput = function(data) {
	
	
	var options = $.extend(
			{  
				disabled : false,
				showUploadButton: true,
				showDownloadButton: true,
				url: basePath + '/api/fileUpload/file',
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
		if(options.showDownloadButton){
			$('#' + id + 'UploadButton').parent().append('<a class="btn btn-primary" id="' + id + 'DownloadButton"><i class="fa fa-download"></i></a>');
		}
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
 		        xhr.open("POST", options.url);
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
// 					
// 				});
// 				$.ajax({
// 			        type : 'GET',
// 			        url : basePath + '/api/fileUpload/download/' + uuid,
// 			        dataType : 'text',
// 			        contentType : 'application/json;charset=UTF-8',
// 			        success : function(data) {
// 			        	
// 			            window.open(data);
// 			        },
// 			        error : function(xhr, ajaxOptions, thrownError) {
// 			            // error handling
// 			        	
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

$.fn.multipleFileUpload = function(data) {
	
	var options = $.extend(
			{  
				text: "Add file to upload",
				maxRows : 0,
				disabled : false, 
				values: [],
				showUploadButton: true,
				showDownloadButton: true,
				showRemoveLine: true,
				url: basePath + '/api/fileUpload/file'
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
			+	'	<div id="' + id + 'NewRow">'
			+	'		<div class"row">'
			+	'			<div class="propertyValue col-xs-11">'
			+	'				<span class="help-block">' + options.text + '</span>'
			+	'			</div>'
			+	'			<div class="propertyValue col-xs-1 dialogActions">'
			+	'				<a id="' + id + 'AddRow" href="#" class="btn btn-info addButton">'
			+	'					<i class="fa fa-plus"></i>'
			+	'				</a>'
			+	'			</div>'
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
 	 					showDownloadButton: options.showDownloadButton,
 	 					showUploadButton: options.showUploadButton
 	 				});
 	 				if(options.showRemoveLine){
 	 					$('#' + id + 'FileUploads').find('.fileUpload').last().find('.fileUploadInput').find('a').before('<a href="#" class="btn btn-danger" id="' + id + 'RemoveButton' + rowNum + '"><i class="fa fa-minus"></i></a>');
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
 					if($(this).find('input').length){
 						$(this).data('widget').upload();
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

$.fn.widget = function() {
	return $(this).data('widget');
}