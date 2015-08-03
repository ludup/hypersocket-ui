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
	
	var id = (options && options.id ? options.id : $(this).attr('id') + "TextInput");
	var hasVariables = (options.variables && options.variables.length > 0);
	var html = '';

	var name = (options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : $(this).attr('id') ;
	
	if(options.inputType=='textarea') {
	
		if(options.variables || options.url) {
			html += '<div class="input-group">';
		}
				
		var html ='<textarea name="' + name + '" id="' + id + '" class="form-control" value="' 
				+ stripNull(options.value) + '"' + (!options.readOnly && !options.disabled ? '' : 'disabled="disabled" ') + ' cols="' 
				+ (options.cols ? options.cols : 30) + '" rows="' + (options.rows ? options.rows : 5) + '" ' 
				+ (options.maxlength > -1 ? 'maxlength="' + options.maxlength  + '"' : '' )
				+ (options.font ? 'style="font-family: ' + options.font + '"' : '')
				+ '>' 
				+ stripNull(options.valueIsResourceKey ? getResource(options.value) : options.value) + '</textarea>';
		
		if(options.variables || options.url) {
			html += '<ul id="' + id + 'Dropdown" class="dropdown-menu scrollable-menu dropdown-menu-right" role="menu"></ul><span class="input-group-addon dropdown-toggle unselectable" '
		    	+ 'data-toggle="dropdown">${}</span></div>';
		}

			    
	} else {
		
		var html = '';
		if(hasVariables || options.url) {
			html += '<div class="input-group">';
		}
		
		var type = options.inputType != 'text' && options.inputType != 'password' ? 'text' : options.inputType;
		html += '<input type="' + type + '" name="' + name + '" id="' + id + '" class="form-control" value="' 
				+ stripNull(options.valueIsResourceKey ? getResource(options.value) : options.value) + '"' + (!options.readOnly && !options.disabled ? '' : 'disabled="disabled" ') + '>';
		
		if(hasVariables || options.url) {
			html += '<ul id="' + id + 'Dropdown" class="dropdown-menu scrollable-menu dropdown-menu-right" role="menu"></ul><span class="input-group-addon dropdown-toggle unselectable" '
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
	$(this).addClass('widget');
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
 			},
 			setSize: function(w,h) {
 				myCodeMirror.setSize(w,h);
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
	$(this).addClass('widget');
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
 				myCodeMirror.refresh();
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
		  if(options.changed) {
			  options.changed(callback);
		  }
	});
	
	$('#' + id).data('codeMirror', myCodeMirror);
	$('#' + id).show();
	
	setTimeout(function() {
	    myCodeMirror.refresh();
	},1);
	
	$(this).data('widget', callback);
	$(this).addClass('widget');
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
	$(this).addClass('widget');
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
			notSetResourceKey: 'text.notSet',
			getUrlData: function(data) {
				return data;
			}
		}, data);
	
	var id = (obj && obj.id ? obj.id : $(this).attr('id') + "SelectButton");
	
	var name = (obj && obj.resourceKey != null ) ? formatResourceKey(obj.resourceKey) : $(this).attr('id') ;

	$(this).append('<div class="btn-group"><input id="' 
			 + id + '" type="hidden" name="select_value_' + id + '" value=""><button type="button" id="button_' + id + '" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" name="selectBtn_'+ name +'"><span id="select_button_' 
			 + id + '">' + getResource(obj.notSetResourceKey) + '</span>&nbsp;<span class="btn-icon caret"></span></button><ul id="'
			 + 'select_' + id + '" name="select_' + name +'" class="dropdown-menu' + (obj.dropdownPosition ? ' ' + obj.dropdownPosition : '') + '" role="menu"></div>');

	var selected = null;
	
	if(obj.emptySelectionAllowed == 'true') {
		$('#select_' + id).append('<li><a id="data_' + id + "_" + i + '" class="selectButton_'
				+ id + '" href="#" name="link_' + obj.emptySelectionText + '" data-value="" data-label="' + obj.emptySelectionText + '">' 
				+ obj.emptySelectionText + '</a></li>');
	}
	
	var callback = {
			setValue: function(val) {
				$('#' + id).val(val);
				var selected = $('#select_' + id).find('[data-value="' + $('#' + id).val() + '"]');
				if(selected) {
					$('#select_button_' + id).text(selected.attr('data-label'));
				} else {
					$('#select_button_' + id).text(getResource(options.notSetText));
				}
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
			getObject: function() {
				var selected = $('#select_' + id).find('[data-value="' + $('#' + id).val() + '"]');
				return selected.data('resource');
			},
			reset: function() {
				$('#select_' + id).empty();
				var listItem;
				if (obj.options) {
					
					for (var i = 0; i < obj.options.length; i++) {
						listItem = obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj.nameAttr])) : obj.options[i][obj.nameAttr];
						$('#select_' + id).append('<li><a id="data_' + id + "_" + i + '" class="selectButton_' + id + '" href="#" data-value="' 
								+ stripNull(obj.options[i][obj['valueAttr']]) + '" data-label="' + listItem + '" name="link_' + listItem + '">' 
								+ listItem + '</a></li>');
						if (obj.value == obj.options[i][obj.valueAttr]) {
							selected = obj.options[i];
							$('#select_button_' + id).text(listItem);
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
								listItem = obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']];
								
								$('#select_' + id).append('<li><a id="data_' + id + "_" + idx + '" class="selectButton_' + id + '" href="#" data-value="' 
										+ stripNull(option[obj['valueAttr']]) + '" data-label="'+ listItem + '" name="link_' + listItem + '">' 
										+ listItem + '</a></li>');
								if (option[obj['valueAttr']] == obj.value) {
									selected = option;
									$('#select_button_' + id).text(listItem);
								}
								$('#data_' + id + "_" + idx).data('resource', option);
							});

							$('.selectButton_' + id).on(
									'click',
									function(evt) {
										evt.preventDefault();
										var selected = $(this).attr('data-value');
										$('#' + id).val(selected);
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
			isEnabled: function() {
				return !$('#button_' + id).hasClass('btn-disabled-dark');
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
 			},
 			selectFirst: function() {
 				$('.selectButton_' + id).first().trigger('click');
 			}
		};
	
	callback.reset();
	
	if(obj.disabled) {
		callback.disable();
	}
	
	if(obj.value && obj.value!='') {
		callback.setValue(obj.value);
	} else {
		callback.selectFirst();
	}
	
	$(this).data('widget', callback);
	$(this).addClass('widget');
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
			selectedIsObjectList : false, 
			isResourceList: true,
			disabled : false, 
			remoteSearch: false,
			resourceKeyTemplate: '{0}',
			icon: 'fa-search'
		}, data);
	
	var id = (options.id ? options.id : $(this).attr('id') + "AutoComplete");

	$(this).append('<div class="dropdown input-group"><input type="hidden" id="' + id 
			+ '"><input type="text" id="input_' + id + '" class="form-control dropdown-toggle" data-toggle="dropdown" value=""' + (options.disabled ? 'disabled=\"disabled\"' : '') + '>' 
			+ '<ul id="' + 'auto_' + id + '" class="dropdown-menu scrollable-menu" role="menu"><li><a tabindex="-1" href="#">' + getResource('search.text') + '</a></li></ul>' 
			+ '<span class="input-group-addon"><a href="#" id="click_' + id + '"><i id="spin_' + id + '" class="fa ' + options.icon + '"></i></a></span></div>');
	
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
		if(options.selectedValue){
			$('#' + id).parent().parent().data('widget').setValue(options.selectedValue);
		}
	};
	
	var createDropdown = function(text) {
		var selected = new Array();
		if((text == '*') || (text == ' ')){
			$.each($('#input_' + id).data('values'), function(idx, obj) {
				var name = options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr];
				selected.push(obj);
			});
		} else if(text.startsWith('*')){
			var searchText = text.substring(1, text.length - 1);
			$.each($('#input_' + id).data('values'), function(idx, obj) {
				var name = options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr];
				if(name.toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
					selected.push(obj);
				}
			});
		} else if(text.endsWith('*')){
			var searchText = text.substring(0, text.length - 1);
			$.each($('#input_' + id).data('values'), function(idx, obj) {
				var name = options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr];
				if(name.toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
					selected.push(obj);
				}
			});
		} else{
			$.each($('#input_' + id).data('values'), function(idx, obj) {
				var name = options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr];
				if(name.toLowerCase().indexOf(text.toLowerCase()) == 0) {
					selected.push(obj);
				}
			});
		}
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
		if(selected.length > 0 && text != '') {
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
			
			if(text=='') {
				$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("search.text") + '</a></li>');
			} else {
				$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("noResults.text") + '</a></li>');
			}
			
		}
		$('#input_' + id).dropdown();
		$('[data-toggle="dropdown"]').parent().removeClass('open');
		$('#input_' + id).dropdown('toggle');
		$('#spin_' + id).removeClass('fa-spin');
		$('#spin_' + id).removeClass('fa-spinner');
		$('#spin_' + id).addClass('fa-search');
	}
	
	var updateValue = function(val) {
		$.each($('#input_' + id).data('values'), function(idx, obj) {
			if(obj[options.valueAttr]==val || obj[options.nameAttr]==val) {
				$('#' + id).val(obj[options.valueAttr]);
				$('#input_' + id).val(options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]);
				if(options.changed) {
					options.changed(obj);
				}
			}
		});
	};
	
	$('#input_' + id).change(function() {
		updateValue($(this).val());
	});
	
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
						$.each(data.rows, function(idx, obj) {
							map[obj[options.valueAttr]] = obj[options.nameAttr];
							if(obj[options.valueAttr]==options.value) {
								$('#' + id).val(options.value);
								$('#input_' + id).val(options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]);
							}
						});
						$('#input_' + id).data('values', data.rows);
						$('#input_' + id).data('map', map);
						
						createDropdown(text);
					});
			
		}
		
	});
	
	var callback = {
			setValue: function(val) {
				updateValue(val);
			},
			getValue: function() {
				return $('#' + id).val();
			},
			getObject: function() {
				return $('#input_' + id).data('map')[$('#' + id).val()];
			},
			reset: function(newValue) {
				
				if(options.url && !options.remoteSearch) {
					getJSON(
						options.url,
						null,
						function(data) {
							buildData(options.isResourceList ? data.resources : data);
							callback.setValue(newValue);
						});
				} else if(options.values && !options.remoteSearch) {
					buildData(options.values);
					callback.setValue(newValue);
				} 
				
			},
			disable: function() {
				$('#input_' + id).attr('disabled', true);
			},
			enable: function() {
				$('#input_' + id).attr('disabled', false);
			},
			isEnabled: function() {
				return !$('#input_' + id).attr('disabled');
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).val('');
				$('#input_' + id).val('');
 			},
 			addItem: function(item, select){
 				exists = false;
 				$.each($('#input_' + id).data('values'), function(idx, obj) {
 					if(item.value==obj.value && item.name==obj.name){
 						exists = true;
 						return false;
 					}
 				});
 				if(!exists){
 					$('#input_' + id).data('values').push(item);
 				}
 				if(select){
 					$('#' + id).parent().parent().data('widget').setValue(item.value);
 				}
 			}
	};

	$('#click_' + id).click(function(e){
		if(options.clicked) {
			options.clicked(callback);
		}
	});
	
	if(options.disabled) {
		callback.disable();
	}
	
	callback.reset();
	
	$(this).data('widget', callback);
	$(this).addClass('widget');
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
		
		var name = (options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id ;

		$(this).addClass('container-fluid');
		
		$(this).append('<div class="excludedList col-md-5" id="' + id 
				+ 'Excluded"><label>' + getResource(options.excludedLabelResourceKey) + '</label></div>');
		
		$('#' + id + 'Excluded').append(
					'<select ' + (!options.disabled ? '' : 'disabled="disabled" ') + 'multiple="multiple" id="' + id
						+ 'ExcludedSelect" name="ExcludedSelect_' + name + '" class="formInput text form-control"/>');

		$(this).append('<div class="listButtons" id="' + id + 'Buttons"/>');
		
		$('#' + id + 'Buttons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' + id + 'AddButton" name="AddButton_' + name + '"><i class="fa fa-chevron-circle-right"></i></button><br/>');
		
		$('#' + id + 'Buttons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' + id + 'RemoveButton" name="RemoveButton_' + name + '"><i class="fa fa-chevron-circle-left"></i></button>');
		
		$(this).append('<div class="includedList col-md-5" id="' + id 
				+ 'Included"><label>' + getResource(options.includedLabelResourceKey) + '</label></div>');
		
		$('#' + id + 'Included').append('<select ' + (!options.disabled ? '' : 'disabled="disabled" ') 
				+ 'multiple="multiple" id="' + id + 'IncludedSelect" name="IncludedSelect_' + name + '" class="formInput text form-control"/>');

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
		options.options = options.variables;
		options.valuesIsObjectList = false;
	}
	
	if (options.options || options.values) {
		if(options.values) {
			options.options = options.values;
		}
		$.each(options.options,
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
	$(this).addClass('widget');
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

		var name = ((data && data.resourceKey != null ) ? formatResourceKey(data.resourceKey) : id) ;
		
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
							+ id + 'ExcludedSelect" class="formInput text form-control" name="Excluded_' + name + '"/>');
		}

		$(this).append('<div class="multipleTextInputButtons" id="' + id + 'Buttons"/>');
		
		$('#' + id + 'Buttons').append(
		'<button class="btn-multiple-select btn btn-primary" id="' 
				+ id 
				+ 'AddButton" name="AddButton_' + name + '"><i class="fa fa-chevron-circle-right"></i></button><br/>');
		
		$('#' + id + 'Buttons').append(
				'<button class="btn-multiple-select btn btn-primary" id="' 
						+ id 
						+ 'RemoveButton" name="RemoveButton_' + name + '"><i class="fa fa-chevron-circle-left"></i></button>');

		$(this).append('<div class="includedList" id="' + id + 'Included"></div>');
		$('#' + id + 'Included').append(
					'<select ' + (!options.disabled ? '' : 'disabled="disabled" ') + 'multiple="multiple" id="' 
							+ id + 'IncludedSelect" name="IncludedSelect_' + name + '" class="formInput text form-control"/>');

		var select = $('#' + id + 'ExcludedSelect');
		var toSelect = $('#' + id + 'IncludedSelect');
		
		if(options.allowOrdering) {
			$(this).append('<div class="multipleTextInputButtons" id="' + id + 'OrderButtons"/>');
			
			$('#' + id + 'OrderButtons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' 
					+ id 
					+ 'UpButton" name="UpButton_' + name + '"><i class="fa fa-chevron-circle-up"></i></button><br/>');
			
			$('#' + id + 'OrderButtons').append(
					'<button class="btn-multiple-select btn btn-primary" id="' 
					+ id 
					+ 'DownButton" name="DownButton_' + name +'"><i class="fa fa-chevron-circle-down"></i></button>');
			
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
						if (options.changed) {
							options.changed(callback);
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

			if (options.changed) {
				options.changed(callback);
			}
		});

	}

	if (options.values) {
		$.each(options.values, function(idx, obj) {
			toSelect.append('<option ' + 'value="' + obj + '">' + obj + "</option>");
		});
	}
	
	

	if(options.disabled) {
		callback.disable();
	}
	
	$(this).data('created', true);
	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
};



/**
 Date Input
**/

$.fn.dateInput = function(options) {
	
	var id = (options && options.id ? options.id : $(this).attr('id') + "DateInput");
 
    var name = ((options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id) ;
    
	var options = $.extend(
			{   format: "yyyy-mm-dd",
			    startView: 0,
			    orientation: "top auto",
			    multidate: false,
			    forceParse: false,
			    autoclose: true
			},  options);
	
	$(this).append('<div id="' + id + '" class="input-group date">'
			+ '<input id="' + id + 'Field" type="text" name="date_' + name + '" class="form-control" value="' + options.value + '">' 
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
	$(this).addClass('widget');
	return callback;
};

/**
 * Time input
 */
$.fn.timeInput = function(options) {
	
	var id = (options && options.id ? options.id : $(this).attr('id') + "TimeInput");
	
	var name = ((options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id) ;
	
	var options = $.extend(
			{   template: 'dropdown',
				minuteStep: 15,
				showSeconds: false,
				secondStep: 15,
				defaultTime: (options.value ? (options.value=='' ? false : options.value) : false),
				showMeridian: false,
				showInputs: true,
				disableFocus: false,
				disableMouseWheel: false,
				modalBackdrop: false,
				showWidgetOnAddonClick: true
			},  options);
	
	$(this).append('<div class="input-group bootstrap-timepicker">'
			+ '<input id="' + id + '" type="text" name="time_' + name + '" class="input-small form-control">'
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
	$(this).addClass('widget');
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
				return obj;
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
	$(this).addClass('widget');
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
				return obj;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).prop('checked', false);
 			}
	};

	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
};


$.fn.switchInput = function(options) {
	
	var id = (options && options.id ? options.id : $(this).attr('id') + "BooleanInput");
	
	var obj = $.extend(
			{   readOnly: false,
			    disabled: false,
			    onResourceKey: 'text.on',
			    offResourceKey: 'text.off'
			},  options);

	var name = ((options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id) ;
	
	$(this).append('<label class="switch"><input type="checkbox" class="switch-input" id="'
						+ id + '" name="chk_' + name + '" value="true"' 
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
				return obj;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).prop('checked', false);
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
	$(this).addClass('widget');
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
				return obj;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				input.val('');
 			}
	};
	
	input.change(function() {
		var reader = new FileReader();
		reader.onload = function(readerEvt) {
			var binaryString = readerEvt.target.result;
			var encoded = btoa(binaryString);
			var fileName = input.val().split('/').pop().split('\\').pop();
			input.data('encoded', fileName + ";" + encoded);
		};
	
		reader.readAsBinaryString(input[0].files[0]);
		
		if(options.changed) {
			options.changed(callback);
		}
	});
	
	if(options.disabled || options.readOnly) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
};


$.fn.sliderInput = function(options) {
	
	var id = (options && options.id ? options.id : $(this).attr('id') + "SliderInput");
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
	
	var name = ((options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id) ;
	
	$(this).append('<input class="form-control" id="' + id + '" data-slider-id="slider_' + id + '" name="slider_' + name + '" value="' + obj.value + '" type="text">');

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
				return obj;
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
	$(this).addClass('widget');
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
				onlyName: false,
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
		$('#' + id).parent().widget().addRows(1);
	});
	
	var callback = {
 			getValue: function() {
 				var values = [];
 				$('#' + id + 'NamePairs').find('.namePairInput').each(function(){
 					name = $(this).find('.namePairName').widget().getValue();
 					if(options.onlyName) {
 	 					values.push(name);
 					} else {
 						name = encodeURIComponent(name);
 						value = encodeURIComponent($(this).find('.namePairValue').widget().getValue());
 	 					values.push(name + '=' + value);
 					}
 					
 				});
 				return values;
 			},
 			setValue: function(val) {
 				callback.removeRows();
 				$.each(val, function(index, value){
 					callback.addRows(1);
 					valuePair = value.split('=');
 					$('#' + id + 'NamePairName' + rowNum).data('widget').setValue(decodeURIComponent(valuePair[0]));
 					if(!options.onlyName){
 						$('#' + id + 'NamePairValue' + rowNum).data('widget').setValue(decodeURIComponent(valuePair[1]));
 					}
 					
 				});
 			},
 			disable: function() {
 				$('#' + id).find('.widget').each(function(){
 					$(this).widget().disable();
 				});
 				$('#' + id).find('.removePair').each(function(){
 					$(this).attr('disabled', 'disabled');
 				});
 				$('#' + id + 'AddPair').attr('disabled', 'disabled');
 				options.disabled = true;
 			},
 			enable: function() {
 				$('#' + id).find('.widget').each(function(){
 					if (!this.id.startsWith(id + 'NamePairName') || (this.id.startsWith(id + 'NamePairName') && !options.disableName)) {
 						$(this).widget().enable();
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
 	 				html =	'<div class="row namePairInput">';
 	 				if(options.onlyName){
 	 					html += '	<div id="' + id + 'NamePairName' + rowNum + '" class="form-group propertyValue col-xs-11 namePairName"></div>' 
 	 				}else{
 	 					html += '	<div id="' + id + 'NamePairName' + rowNum + '" class="form-group propertyValue ' + nameWeight + ' namePairName"></div>'
 	 						 +	'	<div id="' + id + 'NamePairValue' + rowNum + '" class="form-group propertyValue ' + valueWeight + ' namePairValue"></div>'; 
 	 				}
 	 				html += '	<div class="propertyValue col-xs-1 dialogActions">'
	 					 + 	'		<a href="#" class="removePair btn btn-danger"><i class="fa fa-trash-o"></i></a>'
	 					 + 	'	</div>'
	 					 +	'</div>';
 	 				$('#' + id + 'NamePairs').append(html);
 	 				if(options.renderNameFunc) {
 	 					var renderField = new Function('div', options.renderNameFunc);
 	 					renderField($('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairName'));
 	 				} else {
	 	 				$('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairName').textInput({
	 	 					variables: nameVariables,
	 	 					disabled: options.disabled || options.disableName
	 	 				});
 	 				}
 	 				if(!options.onlyName){
 	 					if(options.renderValueFunc) {
 	 						options.renderValueFunc($('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairValue'));
 	 					} else {
	 	 					$('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairValue').textInput({
	 	 	 					variables: valueVariables,
	 	 	 					disabled: options.disabled
	 	 	 				});
 	 					}
 	 				}
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
 				if($('#' + id).find('.widget').length) {
 					$('#' + id).find('.widget').each(function() {
 						$(this).widget().setValue('');
 					});
 				}
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
	$(this).addClass('widget');
	return callback;
}

$.fn.fileUploadInput = function(data) {
	
	
	var options = $.extend(
			{  
				disabled : false,
				showUploadButton: true,
				showDownloadButton: true,
				url: 'fileUpload/file',
				detailedView: true,
				getUrlData: function(data) {
					return data;
				}
			}, data);
	
	var id = (options.id ? options.id : $(this).attr('id') + "FileUpload");
	var html =	'<div id="' + id + '" class="col-xs-8" style="padding-left: 0px;">'
			+	'	<input type="file" id="' + id + 'File"/>'
			+	'</div>'
			+	'<div class="propertyValue col-xs-4 dialogActions">'
			+	'	<a href="#" class="btn btn-primary" id="' + id + 'UploadButton"><i class="fa fa-upload"></i></a>'
			+	'</div>'
			+	'<div class="col-xs-8">'
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
					+	'	<span>' + getResource('fileUpload.fileName.info') + '</span></br>';
		if(options.detailedView) {
			formattedHtml +=	'	<span>' + getResource('fileUpload.fileSize.info') + '</span></br>'
			+	'	<span>' + getResource('fileUpload.md5Sum.info') + '</span>';			
		}

		formattedHtml +=	'</div>'
					+	'<div class="file-upload-info">'
					+	'	<span>' + data.fileName + '</span></br>';
		
		if(options.detailedView) {
			formattedHtml +=	'	<span>' + fileSize + '</span></br>'
						+	'	<span>' + data.md5Sum + '</span>';			
		}
					
		formattedHtml +=	'</div>';
		
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
		$('#' + id + 'UploadButton').parent().append('<a class="btn btn-danger" id="' + id + 'RemoveButton"><i class="fa fa-trash"></i></a>');
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
 				getJSON('fileUpload/metainfo/' + uuid, null, function(data){
 					
 					if(data.success) {
	 					if($('#' + id + 'Info').length){
	 						$('#' + id + 'Info').empty();
	 						$('#' + id + 'Info').append(showInfoFormat(data.resource));
	 						$('#' + id + 'Info').data('uuid', data.resource.name);
	 						$('#' + id + 'RemoveButton').unbind('click');
	 						$('#' + id + 'RemoveButton').click(function(){
	 							callback.remove();
	 						});
	 						$('#' + id + 'DownloadButton').unbind('click');
	 						$('#' + id + 'DownloadButton').click(function(){
	 							callback.download();
	 						});
	 	 				}else{
	 	 					showInfo(data.resource);
	 	 				}
	 					
	 					if(options.disabled) {
	 						callback.disable();
	 					}
	 					$('#' + id + 'UpdateProgressHolder').hide();

 					}
 				});
 			},
 			clear: function() {
 				 // How to clear file input?
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
 			hasFile: function() {
 				if($('#' + id + 'File').val() == ''){
 					return false;
 				}
 				return true;
 			},
 			needsUpload: function() {
 				return $(this).data('needsUpload');
 			},
 			upload: function(notify) {
 				
 				if($('#' + id + 'File').val() == ''){
 					return false;
 				}
 				$('#' + id + 'UpdateProgressHolder').show();
 				$('#' + id + 'UpdateProgress').css("width",  "0%");
 				var formData = new FormData();
 				formData.append('file', $('#' + id + 'File')[0].files[0]);
 				
 		        var xhr = new XMLHttpRequest();
 		        xhr.upload.addEventListener("progress", uploadProgress, false);
 		        xhr.onreadystatechange=function()
 		        {
 		        	if (xhr.readyState==4 && xhr.status!=0)
 		        	{
 		        		if(xhr.status==200) {
 		        			data = jQuery.parseJSON(xhr.response);
	 		        		if(data.success) {
		 		        		showInfo(data.resource);
		 						if(options.disabled) {
		 							callback.disable();
		 						}
		 						 $(this).data('needsUpload', false);
		 						if(options.changed) {
		 							options.changed(callback);
		 						}
		 						if(notify) {
		 							notify(true);
		 						}
	 		        		} else {
	 		        			if(notify) {
	 		        				notify(false);
	 		        			}
	 		        		} 
 		        		} 
 		        	} 
 		        }
 		        xhr.open("POST", options.url);
 		        xhr.send(formData);
 		        
 		        return true;
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
 				window.location = basePath + '/api/fileUpload/file/' + uuid;
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

	$('#' + id + 'File').change(function() {
		$(this).data('needsUpload', true);
		if(options.changed) {
			options.changed(callback);
		}
	});
	
 	if(options.value) {
 		callback.setValue(options.value);
 	}
 	
	if(options.disabled) {
		callback.disable();
	}
	
	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

$.fn.multipleFileUpload = function(data) {
	
	var options = $.extend(
			{  
				text: "",
				maxRows : 0,
				disabled : false, 
				values: [],
				showUploadButton: true,
				showDownloadButton: true,
				showRemoveLine: true,
				isArrayValue: true,
				url: 'fileUpload/file'
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
			+	'		<div class="col-xs-12" style="padding-left: 0px; padding-right: 0px;">'
			+	'			<div class="propertyValue col-xs-10" style="padding-left: 0px;">'
			+	'				<span class="help-block">' + options.text + '</span>'
			+	'			</div>'
			+	'			<div class="propertyValue col-xs-2 dialogActions">'
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
 			clear: function() {
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
	$(this).addClass('widget');
	return callback;
}

$.fn.widget = function() {
	return $(this).data('widget');
}