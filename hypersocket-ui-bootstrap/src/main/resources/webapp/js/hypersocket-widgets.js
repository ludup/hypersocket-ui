
$.fn.widget = function() {
	return $(this).data('widget');
}

function processURL(widget, url) {

	const regex = /{(.*?)}/g;
	let m;

	while ((m = regex.exec(url)) !== null) {
	    // This is necessary to avoid infinite loops with zero-width matches
	    if (m.index === regex.lastIndex) {
	        regex.lastIndex++;
	    }
	    // The result can be accessed through the `m`-variable.
    	if($(document).data('widgetMap')) {
	    	var w = $(document).data('widgetMap')[m[1]];
	    	if(w) {
	    		log("Replacing value " + w.getValue());
	    		url = url.replace(m[0], w.getValue());
	    	}
    	}

	}

	return url;
}

function checkGetParams(url) {
	if(url.indexOf('?') > -1) {
		return url + '&';
	}
	return url + '?';
}


/**
 * Attach an event handler to an element, so that when clicked, it will
 * copy some text to the clipboard.
 *
 * Options:
 * 		text: The text to copy to the clipboard
 *
 * TODO
 * 1. Provide an option to use a callback instead of fixed text
 */
$.fn.clipboardCopy = function(data) {
	var options = $.extend(
	{
		text: false,
		disabled : false
	}, data);


	var id = checkElementHasId($(this)).attr('id') + "ClipboardCopy";
	var name = (options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : $(this).attr('id') ;

	$(this).on('click', function() {
		$(this).append('<input type="text" id="' + id + 'Text" name="' + id + 'Text"/>');
		if(options.text && {}.toString.call(options.text) === '[object Function]')
			$('#' + id + 'Text').val(options.text());
		else
			$('#' + id + 'Text').val(options.text);
		$('#' + id + 'Text').select();
		try {
			var successful = document.execCommand('copy');
			var msg = successful ? 'successful' : 'unsuccessful';
			console.log('Copying text command was ' + msg);
		} catch (err) {
			console.log('Oops, unable to copy');
		}
		$('#' + id + 'Text').remove();
	});

	var callback = {
 			disable: function() {
 				$('#' + id).attr('disabled', true);
 			},
 			enable: function() {
 				$('#' + id).attr('disabled', false);
 			},
 			options: function() {
 				return options;
 			}
 		};

	if(options.disabled || options.readOnly) {
		callback.disable();
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

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
				showVariables: false,
				showScript: false,
				toggleToText: false,
				getUrlData: function(data) {
					return data;
				}
			}, data);

	var id = 'input' + checkElementHasId($(this)).attr('id') + "TextInput";
	var hasVariables = (options.variables && options.variables.length > 0);
	if(hasVariables && options.variables.constructor !== Array) {
		options.variables = options.variables.split(',');
	}
	if(options.showVariables && !options.url) {
		options.url = 'currentRealm/user/variableNames';
	}

	var html = '';

	var name = (options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : $(this).attr('id') ;

	if(options.inputType=='textarea') {

		if(options.variables || options.url) {
			html += '<div class="input-group">';
		}
				
		html ='<textarea name="' + name + '" id="' + id + '" class="form-control" value="' 
				+ stripNull(options.value) + '"' + (!options.readOnly && !options.disabled ? '' : 'disabled="disabled" ') + ' cols="' 
				+ (options.cols ? options.cols : 30) + '" rows="' + (options.rows ? options.rows : 5) + '" ' 
				+ (options.maxlength > -1 ? 'maxlength="' + options.maxlength  + '"' : '' )
				+ (options.font ? 'style="font-family: ' + options.font + '"' : '')
				+ '></textarea>';

		if(options.variables || options.url) {
			html += '<ul id="' + id + 'Dropdown" class="dropdown-menu scrollable-menu dropdown-menu-right" role="menu"></ul><span id="variableToggle' + id + '" class="input-group-addon dropdown-toggle unselectable" '
		    	+ 'data-toggle="dropdown">${}</span></div>';
		}

			    
	} else if(options.inputType=='paragraph') {
		
		html += '<pre  id="' + id + '" class="form-control"></pre>';
		
	} else {
		html = '';

		if(hasVariables || options.url || (options.inputType === "password" && options.toggleToText)) {
			html += '<div class="input-group">';
		}

		var type = options.inputType != 'text' && options.inputType != 'password' ? 'text' : options.inputType;
		html += '<input type="' + type + '" name="' + name + '" id="' + id + '" class="form-control" autocomplete="off" value=""'
					+ (!options.readOnly && !options.disabled ? '' : 'disabled="disabled" ') + '>';

		if (options.inputType === "password" && options.toggleToText) {
			html += '<span id="passwordToggle' + id +
			 '" class="input-group-addon eye-password-toggle" title="' + getResourceOrText("password.eye.show") + '" ><i class="fa fa-eye"></i</span></div>';
		
			const eyeIcon = '#' + "passwordToggle" + id;
			const inputField = '#' + id;
			
			$('body').on('click', eyeIcon, function(e){
				
				const type = $(inputField).attr('type');
				
				if (type === "text") {
					$(inputField).attr('type', 'password');
					$(eyeIcon + " i").removeClass("fa-eye-slash").addClass("fa-eye");
					$(eyeIcon).attr("title", getResourceOrText("password.eye.show"));
				} else {
					$(inputField).attr('type', 'text');
					$(eyeIcon + " i").removeClass("fa-eye").addClass("fa-eye-slash");
					$(eyeIcon).attr("title", getResourceOrText("password.eye.hide"));
				}
			});
		}

		if(hasVariables || options.url) {
			html += '<ul id="' + id + 'Dropdown" class="dropdown-menu scrollable-menu dropdown-menu-right" role="menu"></ul><span id="variableToggle' + id + '" class="input-group-addon dropdown-toggle unselectable" '
		 	  + 'data-toggle="dropdown">${}</span></div>';
		}

	}

	$(this).append(html);
	
	

	$('#' + id).val(stripNull(options.valueIsResourceKey ? getResource(options.value) : options.value));
	if(options.placeholder) {
		$('#' + id).prop('placeholder', getResourceOrDefault(options.placeholder));
	}
	if(options.showScript) {
		var self = $(this);
		var morphToScriptEditor = function(e) {
			var html ='<div id="' + id + '_propertyScript"></div>';
			self.prepend(html);
			var initVal = $('#' + id).val();
			var openStart = initVal.indexOf('$(script');
			var scriptType = false;
			if (openStart != -1) {
				var openStartEnd = initVal.indexOf(')', openStart);
				if (openStartEnd != -1) {
					scriptType = initVal.substring(openStart + 9, openStartEnd).trim();
					initVal = initVal.substring(openStartEnd + 1);
				}
			}
			if(!scriptType)
				scriptType = 'javascript';
			var closeStart = initVal.lastIndexOf('$(/script)');
			if(closeStart != -1)
				initVal = initVal.substring(0, closeStart);
			var editorWidget = $('#' + id + '_propertyScript').codeInput({
				disabled : false,
				value: initVal,
				inputType: scriptType,
				lineNumbers: true,
				size: 'normal',
				changed: function(callback) {
					var val = callback.getValue().trim();
					if(val.length == 0)
						$('#' + id).val('');
					else
						$('#' + id).val('$(script ' + scriptType + ')' + val + '$(/script)');
				}
			});
			$('#' + id).hide();
			$('#variableToggle' + id).hide();
			self.prepend('<a ref="#" id="closeScriptEditor' + id + '">' + getResource('textInput.simpleVariable') + '</a>');
			$('#closeScriptEditor' + id).click(function() {
				$(this).remove();
				$('#' + id + '_propertyScript').remove();
				$('#variableToggle' + id).show();
				$('#' + id).show();
			});
		}
		if(options.value && options.value.startsWith('$(script')) {
			morphToScriptEditor();
		}
		$('#' + id + 'Dropdown').append('<li><a href="#" class="' + id + 'Script">' + getResource('textInput.insertScript') + '</a></li>');
		$('.' + id + 'Script').click(morphToScriptEditor);
	}
	
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

 	}
 	
 	if(options.url) {
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
 				if(options.inputType=='paragraph') {
 					$('#' + id).text(val);
 				} else {
 					$('#' + id).val(val);
 				}
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

 	$('#' + id).keyup(function(e) {
 		if(options.value !== $('#' + id).val()) {
	 		if(options.changed) {
	 			options.changed(callback);
	 		}
 		}
 	});

	if(options.disabled || options.readOnly) {
		callback.disable();
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

function getCodeMirrorWidth() {
	if($(window).width() > 990) {
		return 600;
	} else if($(window).width() > 770) {
		return 500;
	} else {
		return ($(window).width() - 100);
	}
}

$.fn.htmlInput = function(data) {

	var options = $.extend(
			{ disabled : false,
			  value: '',
			  inputType: 'html',
			  lineNumbers: true,
			  size: 'normal'},
		data);

	var id = checkElementHasId($(this)).attr('id') +  'HtmlInput';

	var heightCss = '';
	if(options.size==='small') {
		heightCss = 'height: 75px';
	} else if(options.size==='large') {
		heightCss = 'height: 600px';
	}
	$(this).append('<div class="code form-control" id="' + id + '" style="width: ' + getCodeMirrorWidth() + 'px; ' + heightCss + '"></div>');
	var myCodeMirror = CodeMirror(document.getElementById(id), {
		  value: options.value,
		  htmlMode: options.inputType=='html',
		  mode:  options.inputType=='html' ? 'text/html' : 'application/xml',
		  lineNumbers: options.lineNumbers,
		  relative_urls: false,
		  convert_urls: false,
		  remove_script_host : false,
		  readOnly: options.disabled
	});

	var callback = {
 			setValue: function(val) {
 				myCodeMirror.setValue(val);
 				if(options.changed) {
 					options.changed(callback);
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

	$(window).resize(function() {
		$('#' + id).width(getCodeMirrorWidth());
	});

	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

$.fn.codeInput = function(data) {

	var options = $.extend(
			{ disabled : false,
			  value: '',
			  inputType: 'html',
			  lineNumbers: true,
			  size: 'normal'},
		data);

	var id = checkElementHasId($(this)).attr('id') +  'CodeInput';

	var heightCss = '';
	if(options.size==='small') {
		heightCss = 'height: 75px';
	} else if(options.size==='large') {
		heightCss = 'height: 600px';
	}

	$(this).append('<div class="code form-control" id="' + id + '" style="width: ' + getCodeMirrorWidth() + 'px; ' + heightCss + '"></div>');

	var myCodeMirror = CodeMirror(document.getElementById(id), {
		  value: options.value,
		  mode:  options.inputType=='java' ? 'text/x-java' : options.inputType,
		  lineNumbers: options.lineNumbers,
		  readOnly: options.disabled,
		  autoRefresh: true
	});

	var callback = {
 			setValue: function(val) {
 				myCodeMirror.setValue(val);
 				myCodeMirror.refresh();
 				if(options.changed) {
 					options.changed(callback);
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

	$(window).resize(function() {
		$('#' + id).width(getCodeMirrorWidth());
	});

	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

/**
* Displays a rich text editor (TinyMCE)
**/

$.fn.richInput = function(data) {
	var options = $.extend(
		{ disabled : false,
		  height: 500,
		  pasteDataImages: false,
		  inline: false,
		  focus: false,
		  menubar: false,
		  usePlugins: false,
		  extraPlugins: false,
		  tinyMCEOptions: false,
		  plugins: [
				    'advlist autolink lists link image charmap print preview hr anchor pagebreak',
				    'searchreplace wordcount visualblocks visualchars code fullscreen',
				    'insertdatetime media nonbreaking save table contextmenu directionality',
				    'emoticons template paste textcolor colorpicker textpattern imagetools'
				  ],
		  toolbar1: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | forecolor backcolor emoticons' },
	data);

	var id = checkElementHasId($(this)).attr('id');
	var tn = $(this).prop('tagName');
	if(tn !== 'TEXTAREA' ) {
		id = 'rich' + id;
		$(this).append('<div class="form-control" id="' + id + '"></div>');
	}

	var callback;
	var textOnInit = false;
	
	callback = {
			editor: false,
			originalValue: '',
 			setValue: function(val) {
 				if(!callback.editor) {
 					textOnInit = val;
 				}
 				else {
     				callback.editor.setContent(val);
     				if(options.changed) {
     					options.changed(callback);
     				}
 				}
 			},
 			getValue: function() {
 				return callback.editor.getContent();
 			},
 			removeWidget: function() {
 				if(callback.editor)
 					callback.editor.remove();
 			},
 			reset: function() {
 				if(callback.editor)
 					callback.editor.setContent(callback.originalValue);
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
 				callback.editor.setContent('');
 			},
 			focus: function() {
 				callback.editor.focus();
 			}
 		};


	
	var lastCallback = $(this).data('widget');
	if(lastCallback) {
		/* Remove the previous editor cleanly - https://stackoverflow.com/questions/4651676/how-do-i-remove-tinymce-and-then-re-add-it#4655467 */
		var i = tinymce.EditorManager.editors.indexOf(lastCallback.editor);
		if(i > -1) {
			tinymce.EditorManager.execCommand('mceRemoveEditor',true, lastCallback.editor.id);
			tinymce.EditorManager.editors.splice(i, 1);
		}
	}
	else {
		/* Try find by ID instead */
		$.each(tinymce.EditorManager.editors, function(idx, option) {
			if(this.id === id) {
				tinymce.EditorManager.execCommand('mceRemoveEditor', true, this.id);
				tinymce.EditorManager.editors.splice(idx, 1);
			}
		});
	}

	var tinyopts = {
		  selector: '#' + id,
		  height: options.height,
		  theme: 'modern',
		  menubar: options.menubar,
		  inline: options.inline,
		  relative_urls: false,
		  convert_urls: false,
		  remove_script_host : false,
		  paste_data_images: options.pasteDataImages,
		  toolbar1: options.toolbar1,
		  toolbar2: options.toolbar2,
		  image_advtab: true,
		  plugins: options.plugins,
		  templates: [
		    { title: 'Test template 1', content: 'Test 1' },
		    { title: 'Test template 2', content: 'Test 2' }
		  ],
		  /*
		   * https://stackoverflow.com/questions/41724713/tinymce-get-http-fast-fonts-error-in-console
		   *
		   * BPS - leaving this in results in 404 error in console, doesn't seem to have any
		   * effect so I am not sure of the original intention here
		   */
		  /*content_css: [
		    '//fast.fonts.net/cssapi/e6dc9b99-64fe-4292-ad98-6974f93cd2a2.css',
		    '//www.tinymce.com/css/codepen.min.css'
		  ],*/
		  init_instance_callback : function(editor) {
			  callback.editor = editor;
			  var newval = textOnInit ? textOnInit : options.value;
			  if(!newval) {
				  var tagName = $('#' + id).prop('tagName');
				  if(tagName == 'textarea' || tagName == 'input' || tagName == 'TEXTAREA' || tagName == 'INPUT')
					  newval = $('#' + id).val();
				  else
					  newval = $('#' + id).html();
			  }

			  callback.originalValue = newval;
			  editor.setContent(newval);

			  if(options.focus) {
				  callback.editor.execCommand('mceFocus', true, id);
			  }

			  editor.on('change', function(e) {
				  var tagName = $('#' + id).prop('tagName');
				  if(tagName == 'textarea' || tagName == 'input' || tagName == 'TEXTAREA' || tagName == 'INPUT') {
					  $('#' + id).val(callback.getValue());
				  }
				  if(options.changed) {
					  options.changed(callback);
				  }
			  });
		  }
	};
	if(options.usePlugins) 
		tinyopts.plugins = options.plugins;
	if(options.extraPlugins)
		if(tinyopts.plugins) tinyopts.plugins += options.extraPlugins; else tinyopts.plugins = options.extraPlugins;
	if(options.tinyMCEOptions) 
		tinyopts = $.extend(options.tinyMCEOptions, tinyopts);
	
	tinymce.init(tinyopts);
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

	var id = checkElementHasId($(this)).attr('id') + 'Editor';

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
		{ nameAttr: 'name',
			valueAttr: 'value',
			nameIsResourceKey : false,
			resourceKeyTemplate: '{0}',
			disabled : false,
			onLoad: false,
			value: '',
			sortOptions: true,
			notSetResourceKey: 'text.notSet',
			getUrlData: function(data) {
				return data;
			}
		}, data);

	var id = checkElementHasId($(this)).attr('id') + "SelectButton";

	var name = (obj && obj.resourceKey != null ) ? formatResourceKey(obj.resourceKey) : $(this).attr('id') ;

	$(this).append('<div class="btn-group"><input id="'
			 + id + '" type="hidden" name="select_value_' + id + '" value=""><button type="button" id="button_' + id + '" class="btn btn-primary dropdown-toggle" data-toggle="dropdown" name="selectBtn_'+ name +'"><span id="select_button_'
			 + id + '">' + getResource(obj.notSetResourceKey) + '</span>&nbsp;<span class="btn-icon caret"></span></button><ul id="'
			 + 'select_' + id + '" name="select_' + name +'" class="dropdown-menu' + (obj.dropdownPosition ? ' ' + obj.dropdownPosition : '') + '" role="menu"></div>');

	var selected = null;

	if(obj.emptySelectionAllowed) {
		$('#select_' + id).append('<li><a id="data_no_set_' + id + '" class="selectButton_'
				+ id + '" href="#" name="link_' + obj.notSetResourceKey + '" data-value="" data-label="' + getResource(obj.notSetResourceKey) + '">'
				+ getResource(obj.notSetResourceKey) + '</a></li>');
	}

	var loading = true;
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
				if(!loading) {
					if(obj.changed) {
						obj.changed(callback);
					}
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
			load: function(loadCallback) {

				$('#select_' + id).empty();
				if(obj.emptySelectionAllowed) {
					$('#select_' + id).append('<li><a id="data_no_set_' + id + '" class="selectButton_'
							+ id + '" href="#" name="link_' + obj.notSetResourceKey + '" data-value="" data-label="' + getResource(obj.notSetResourceKey) + '">'
							+ getResource(obj.notSetResourceKey) + '</a></li>');
				}
				var listItem;
				if (obj.options) {

					if(obj.sortOptions) {
						obj.options.sort(function(a,b) {
							if(obj.nameIsResourceKey) {
								return getResource(obj.resourceKeyTemplate.format(a[obj.nameAttr])) > getResource(obj.resourceKeyTemplate.format(b[obj.nameAttr]));
							} else {
								return a[obj.nameAttr] > b[obj.nameAttr];
							}
						});
					}

					var ignoreValues = [];
					if(obj.ignoreValues) {
						ignoreValues = obj.ignoreValues.split(',');
					}
					for (var i = 0; i < obj.options.length; i++) {

						var ignore = false;
						for(var x = 0; x < ignoreValues.length; x++) {
							if(ignoreValues[x] ==  obj.options[i][obj.valueAttr]) {
								ignore = true;
							}
						}
						if(!ignore) {
							listItem = obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj.nameAttr])) : obj.options[i][obj.nameAttr];
							$('#select_' + id).append('<li><a id="data_' + id + "_" + i + '" class="selectButton_' + id + '" href="#" data-value="'
									+ stripNull(obj.options[i][obj.valueAttr]) + '" data-label="' + listItem + '" name="link_' + listItem + '">'
									+ listItem + '</a></li>');
							if (obj.value == obj.options[i][obj.valueAttr]) {
								selected = obj.options[i];
								$('#select_button_' + id).text(listItem);
								$('#' + id).val(obj.value);
								if(obj.initialized) {
									obj.initialized(callback);
								}
							}
							$('#data_' + id + "_" + i).data('resource', obj.options[i]);
						}
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

						if(selected==null && !obj.emptySelectionAllowed) {
							loading = true;
							var val = $('.selectButton_' + id).first().trigger('click');
							loading = false;
						}


					if(loadCallback) {
						loadCallback(callback);
					}

				}
				else if (obj.url) {

					getJSON(obj.url, null,
						function(data) {

						var items = obj.getUrlData(data);
						if(obj.sortOptions) {
							items.sort(function(a,b) {
								if(obj.nameIsResourceKey) {
									if(getResource(obj.resourceKeyTemplate.format(a[obj.nameAttr])) > getResource(obj.resourceKeyTemplate.format(b[obj.nameAttr]))) {
										return 1;
									} else {
										return -1;
									}
								} else {
									if(a[obj.nameAttr] > b[obj.nameAttr]) {
										return 1;
									} else {
										return -1;
									}
								}
							});
						}


						var ignoreValues = [];
						if(obj.ignoreValues) {
							ignoreValues = obj.ignoreValues.split(',');
						}

						$.each(items, function(idx, option) {

							for(var x = 0; x < ignoreValues.length; x++) {
								if(ignoreValues[x] ==  option[obj.valueAttr]) {
									return;
								}
							}

							listItem = obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj.nameAttr])) : option[obj.nameAttr];

							$('#select_' + id).append('<li><a id="data_' + id + "_" + idx + '" class="selectButton_' + id + '" href="#" data-value="'
									+ stripNull(option[obj.valueAttr]) + '" data-label="'+ listItem + '" name="link_' + listItem + '">'
									+ listItem + '</a></li>');
							/**
							 * Use == NOT === because types may vary but we still want string "1" to equal 1
							 */
							if (option[obj.valueAttr] == obj.value) {
								selected = option;
								$('#select_button_' + id).text(listItem);
								$('#' + id).val(option[obj.valueAttr]);
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
									if(obj.changed && !loading) {
										obj.changed(callback);
									}
						});

						if(selected==null && !obj.emptySelectionAllowed) {
							loading = true;
							var val = $('.selectButton_' + id).first().trigger('click');
							loading = false;
						}

						if(loadCallback) {
							loadCallback(callback);
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
			isLoading: function() {
				return loading;
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
			reset: function() {
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

	callback.load(obj.onLoad);

	if(obj.disabled) {
		callback.disable();
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	loading = false;
	return callback;
}

/**
 * A text box that shows a dropdown for auto-completion
 */
$.fn.autoComplete = function(data) {

	var options = $.extend(
		{ 
			valueAttr : 'value', 
			nameAttr : 'name', 
			nameIsResourceKey : false, 
			selectedIsObjectList : false, 
			variableTemplate: '$\{{0}\}',
			isResourceList: true,
			disabled : false,
			remoteSearch: false,
			resourceKeyTemplate: '{0}',
			icon: 'fa-search',
			sortOptions: true,
			doNotInit: false,
			selectFirst: false,
			setOnLoad: false,
			formatter: false,
			maxResults: 100
		}, data);
	var callback;
	var id = checkElementHasId($(this)).attr('id') + "AutoComplete";
	var thisWidget = $(this);

	var hasVariables = (options.variables && options.variables.length > 0);
	
    var html = '<div class="input-group dropdown"><input type="hidden" id="' + id
			+ '"><input type="text" ' + (!options.alwaysDropdown ? 'class="form-control dropdown-toggle" autocomplete="off" data-toggle="dropdown"' : 'class="form-control"')
			+ (options.placeholder ? ' placeholder="' + options.placeholder + '"' : '')
			+ ' id="input_' + id + '" value="" ' + (options.disabled ? 'disabled="disabled"' : '') + (options.alwaysDropdown ? ' readOnly="true"' : '') + '>'
			+ '<ul id="' + 'auto_' + id + '" class="dropdown-menu scrollable-menu" role="menu"></ul>';
    
    html += '<span id="click_' + id + '" class="input-group-addon">'
		 +  '<a href="#" ' + (options.alwaysDropdown ? 'class="dropdown-toggle" data-toggle="dropdown"' : '') + '><i id="spin_' + id + '" class="fa ' + options.icon + '"></i></a></span></div>';
    	
	if(hasVariables || options.variablesUrl) {
		html += '<div class="dropdown floatRight"><ul id="vars_' + id + 'Dropdown" class="dropdown-menu scrollable-menu dropdown-menu-right" role="menu"></ul><a href="#" class="dropdown-toggle unselectable" data-toggle="dropdown">${} Insert Variable</span></div>';
	} 
	
	$(this).append(html);
	
	if(options.remoteSearch) {
		$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("search.text") + '</a></li>');
	}
	
 	if(hasVariables) {
 		$.each(options.variables, function(idx, obj) {
 			$('#vars_' + id + 'Dropdown').append('<li><a href="#" class="' + id + 'Class">' + options.variableTemplate.format(obj) + '</a></li>');
 		});
 		
 		$('.' + id + 'Class').click(function(e) {
			e.preventDefault();
			var obj = new Object();
			obj[options.valueAttr] = $(this).text();
			obj[options.nameAttr] = $(this).text()
			thisWidget.data('selectedObject', obj);
			thisWidget.data('selectedObject', obj);
			$('#' + id).val($(this).text());
			$('#input_' + id).val($(this).text());
			$('[data-toggle="dropdown"]').parent().parent().removeClass('open');
			
			if(options.changed) {
				options.changed(callback);
			}
		});
	
 	}

	var buildData = function(values) {
		var map = [];
		if(values) {
			$.each(values, function(idx, obj) {
				map[obj[options.valueAttr]] = obj;
				if(obj[options.valueAttr]==options.value) {
					thisWidget.data('selectedObject', obj);
					$('#' + id).val(options.value);
					$('#input_' + id).val(options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]);
				}
			});
		}

		$('#input_' + id).data('values', values);
		$('#input_' + id).data('map', map);
		if(options.selectedValue){
			$('#' + id).parent().parent().data('widget').setValue(options.selectedValue);
		} else if(options.selectFirst) {
			$('#' + id).parent().parent().data('widget').setValue(values[0][options.valueAttr]);
		}
	};

	var createDropdown = function(text, show, prefiltered) {
		var selected = new Array();
		if(options.alwaysDropdown || (text == '*') || (text == ' ')){
			if(options.allowEmpty) {
				var obj = {};
				obj[options.nameAttr] = "&nbsp;";
				obj[options.valueAttr] = "";
				selected.push(obj);
			}
			$.each($('#input_' + id).data('values'), function(idx, obj) {
				//var name = options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr];
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
			if($('#input_' + id).data('values')) {
				$.each($('#input_' + id).data('values'), function(idx, obj) {
					var name = options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr];
					if(prefiltered || name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
						selected.push(obj);
					}
				});
			}
		}
		if(options.sortOptions) {
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
		}

		$('#auto_' + id).empty();
		if(selected.length > 0 && (text != '' || options.alwaysDropdown)) {
			$.each(selected, function(idx, obj) {
				if(options.valueAttr in obj) {
    				if(options.formatter) {
        				$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" data-value="' + obj[options.valueAttr] + '" href="#">'
        						+ options.formatter(obj, idx, thisWidget) + '</a></li>');
    				}
    				else {
        				$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" data-value="' + obj[options.valueAttr] + '" href="#">'
        						+ (options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]) + '</a></li>');
    				}
				}
				else
    				throw 'No attribute with name of ' + options.valueAttr + ' in the autocomplete options object. Is your options.valueAttr correct?';
			});
			$('#auto_' + id + ' .optionSelect').off('click');
			$('#auto_' + id + ' .optionSelect').on('click', function(e) {
				e.preventDefault();
				var value = $(this).data('value');
				var obj = $('#input_' + id).data('map')[value];
				thisWidget.data('selectedObject', obj);
				$('#' + id).val(value.toString());
				$('#input_' + id).val($(this).text());
				$('[data-toggle="dropdown"]').parent().parent().removeClass('open');

				if(options.changed) {
					options.changed(callback);
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
		$('#input_' + id).on('keyup', function (e) {
		    if (e.keyCode === 13) {
				var value = $('#input_' + id).val();
				var obj = $('#input_' + id).data('map')[value];
				thisWidget.data('selectedObject', obj);
				$('#' + id).val(value.toString());
				$('[data-toggle="dropdown"]').parent().parent().removeClass('open');
				if(options.changed) {
					options.changed(callback);
				}
		    }
		});
		$('[data-toggle="dropdown"]').parent().parent().removeClass('open');

		if(show) {
			$('#input_' + id).dropdown('toggle');
			$('#input_' + id).parent().addClass('open');
		}
		$('#spin_' + id).removeClass('fa-spin');
		$('#spin_' + id).removeClass('fa-spinner');
		$('#spin_' + id).addClass('fa-search');
	}

	var updateValue = function(val, event) {
		if(val && val.toString().startsWith('${') && val.toString().endsWith('}')) {
			$('#' + id).val(val);
			$('#input_' + id).val(val);
			if(event && options.changed) {
				options.changed(callback);
			}
			return;
		}
		$('#' + id).val('');
		$('#input_' + id).val('');
		thisWidget.data('selectedObject', null);
		options.setOnLoad = val;
		var values = $('#input_' + id).data('values');
		if(values) {
			options.setOnLoad = false;
			if(val!=='') {
				$.each($('#input_' + id).data('values'), function(idx, obj) {
					if(obj[options.valueAttr]==val || obj[options.nameAttr]==val) {
	
						thisWidget.data('selectedObject', obj);
						$('#' + id).val(obj[options.valueAttr]);
						$('#input_' + id).val(options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]);
						if(event && options.changed) {
							options.changed(callback);
						}
					}
				});
			}
		}
	};

	var doDropdown = function(text) {

		$('#spin_' + id).removeClass('fa-search');
		$('#spin_' + id).addClass('fa-spin');
		$('#spin_' + id).addClass('fa-spinner');

		if(!options.remoteSearch) {
			createDropdown(text, true, false);
		} else {
			var url = checkGetParams(options.url) + 'iDisplayStart=0&iDisplayLength=' + options.maxResults + '&sSearch=' + text;
			if(options.searchParams) {
				url += '&' + options.searchParams;
			}
			getJSON(processURL(thisWidget.widget(), url),
					null,
					function(data) {
						$('#input_' + id).data('values', data.rows);

						if(data.rows && data.rows.length > 0) {
							var map = [];
							$.each(data.rows, function(idx, obj) {
								map[obj[options.valueAttr]] = obj;
							});
							$('#input_' + id).data('map', map);
						} else {
							$('#auto_' + id).empty();
							if(text=='') {
								$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("search.text") + '</a></li>');
							} else {
								$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("noResults.text") + '</a></li>');
							}
						}
						createDropdown(text, true, true);
					});
		}

	};

	var remoteDropdown = false;
	callback = {
			setValue: function(val) {
				updateValue(val, true);
			},
			getInputValue: function() {
				return $('#input_' + id).val();
			},
			getValue: function() {
				return $('#' + id).val();
			},
			getObject: function() {
				return thisWidget.data('selectedObject');
			},
			getSelectedObject: function() {
				return thisWidget.data('selectedObject');
			},
			_reload: function(newValue) {
			 	$('#' + id).val('');
				$('#input_' + id).val('');
				thisWidget.data('selectedObject', null);
				$('#auto_' + id).empty();
				$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("search.text") + '</a></li>');
				
				if(options.url && !options.remoteSearch) {
					var url = options.url;
					if(options.searchParams) {
						url += '&' + options.searchParams;
					}
					getJSON(
						processURL(callback, url),
						null,
						function(data) {

							if(data.success) {
								buildData(options.isResourceList ? data.resources : data);
								if(options.alwaysDropdown) {
									createDropdown("", false, false);
								}
								callback.setValue(newValue);
							}
						});
				} else if(options.values && !options.remoteSearch) {
					buildData(options.values);
					callback.setValue(newValue);
				} else if(options.remoteSearch) {
					var url = checkGetParams(options.url) + 'iDisplayStart=0&iDisplayLength=' + options.maxResults + '&searchColumn=' + options.valueAttr + '&sSearch=' + newValue;
					if(options.searchParams) {
						url += '&' + options.searchParams;
					}
					getJSON(processURL(thisWidget.widget(), url),
							null,
							function(data) {
								$('#input_' + id).data('values', data.rows);

								if(data.rows && data.rows.length > 0) {
									var map = [];
									$.each(data.rows, function(idx, obj) {
										map[obj[options.valueAttr]] = obj;
									});
									
									var obj = map[newValue];
									if(obj) {
										thisWidget.data('selectedObject', obj);
										$('#' + id).val(newValue.toString());
										$('#input_' + id).val(obj[options.nameAttr]);
										$('[data-toggle="dropdown"]').parent().parent().removeClass('open');
	
										if(options.changed) {
											options.changed(callback);
										}
								    }
								} else {
									$('#auto_' + id).empty();
									if(text=='') {
										$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("search.text") + '</a></li>');
									} else {
										$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("noResults.text") + '</a></li>');
									}
								}

							});
				}
			},
			/**
			 * LDP - Reset should not have a newValue. It should initialise from options.
			 * Added reload method instead if you want to set a specific value and reload
			 * at the same time.
			 */
			reset: function() {
				this._reload(options.value);
			},
			reload: function(newValue) {
				this._reload(newValue);
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
				thisWidget.data('selectedObject', null);
				$('#auto_' + id).empty();
				$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("search.text") + '</a></li>');
 			},
 			addItem: function(item, select){
 				exists = false;
 				if($('#input_' + id).data('values')) {
	 				$.each($('#input_' + id).data('values'), function(idx, obj) {
	 					if(item[options.nameAttr]==obj[options.nameAttr] && item[options.valueAttr]==obj[options.valueAttr]){
	 						exists = true;
	 						return false;
	 					}
	 				});
 				} else {
 					$('#input_' + id).data('values', new Array());
 				}

 				if(!exists){
 					$('#input_' + id).data('values').push(item);
 				}
 				if(select){
 					$('#' + id).parent().parent().data('widget').setValue(item[options.valueAttr]);
 				}
 			},
 			dropdown: function() {
 				doDropdown($('#input_' + id).val());
 			}
	};

	var f = function(e) {
		e.preventDefault();
		if(options.alwaysDropdown) {
			createDropdown("", true, false);
		} else {
			if(options.clicked) {
				options.clicked(callback);
			}
		}
	};
	$('#click_' + id).click(f);
	//$('#spin_' + id).click(f);


	$('#input_' + id).change(function() {
		updateValue($(this).val(), true);
	});

	$('#input_' + id).keyup(function() {
		if(options.alwaysDropdown) {
			createDropdown("", true, false);
		} else {
			var text = $(this).val();
			doDropdown(text);
		}
	});

	if(options.disabled) {
		callback.disable();
	}

	if(!options.doNotInit) {
		if(options.url && !options.remoteSearch) {
			getJSON(
				processURL(callback, options.url),
				null,
				function(data) {
					buildData(options.isResourceList ? data.resources : data);
					if(!options.url || !options.setOnLoad)
						updateValue(options.value, options.alwaysFireChange);
					else {
						updateValue(options.setOnLoad, true);
						options.setOnLoad = false;
					}
					createDropdown('', false, false);
				});
		} else if(options.values && !options.remoteSearch) {
			buildData(options.values);
			updateValue(options.value, false);
			createDropdown('', false, false);
		} else if(options.remoteSearch) {
			if(isReplacementVariable(options.value)) {
				updateValue(options.value, false);
			} else {
				if(options.value && options.value !== '') {
					$('#' + id).val(options.value);
					var url = checkGetParams(options.url) + 'iDisplayStart=0&iDisplayLength=' + options.maxResults + '&sSearch=' + (options.nameIsResourceKey ? encodeURIComponent(getResource(options.value)) : options.value) + "&searchColumn=" + options.valueAttr;
					if(options.searchParams) {
						url += '&' + options.searchParams;
					}
					getJSON(processURL(callback, url),
							null,
							function(data) {

								var map = [];
								$.each(data.rows, function(idx, obj) {
									map[obj[options.valueAttr]] = obj;
									if(obj[options.valueAttr]==options.value) {
										thisWidget.data('selectedObject', obj);
										$('#' + id).val(options.value);
										$('#input_' + id).val(options.nameIsResourceKey ? getResource(obj[options.nameAttr]) : obj[options.nameAttr]);
									}
								});
								$('#input_' + id).data('values', data.rows);
								$('#input_' + id).data('map', map);
							});
				} else {
					$('#auto_' + id).empty();
					$('#auto_' + id).append('<li><a tabindex="-1" class="optionSelect" href="#">' + getResource("search.text") + '</a></li>');
				}
			}
		}
	}
	$(this).data('widget', callback);
	$(this).addClass('widget');

	return callback;

}

$.fn.textDropdown = function(data) {
	return $(this).autoComplete($.extend(data, {
		alwaysDropdown: true,
		icon: 'fa-caret-down',
	}));
}

/**
 * Shows 2 list boxes so that values can be moved between them.
 */
$.fn.multipleSelect = function(data) {
	var id = checkElementHasId($(this)).attr('id');
	var multipleSelectDisabled = false;
	var addElement = function(element){
		var newElement = element.clone();
		newElement.find('i').removeClass('fa-arrow-down').addClass('fa-arrow-up');
		newElement.removeClass(id + 'excludedDraggable').addClass(id + 'includedDraggable');
		newElement.find('i').click(function(e){
			e.preventDefault();
			removeElement($(e.target).parent());
			if (options.changed) {
				options.changed(callback);
			}
		});
		$('#' + id + 'IncludedSelect').append(newElement);
		element.remove();
		addListeners(newElement);
	}

	var addElementBefore = function(elementToAdd, element){
		var newElement = elementToAdd.clone();
		newElement.find('i').removeClass('fa-arrow-down').addClass('fa-arrow-up');
		newElement.removeClass(id + 'excludedDraggable').addClass(id + 'includedDraggable');
		newElement.find('i').click(function(e){
			e.preventDefault();
			removeElement($(e.target).parent());
			if (options.changed) {
				options.changed(callback);
			}
		});
		element.before(newElement);
		elementToAdd.remove();
		addListeners(newElement);
	}

	var removeElement = function(element){
		var newElement = element.clone();
		newElement.find('i').removeClass('fa-arrow-up').addClass('fa-arrow-down');
		newElement.removeClass(id + 'includedDraggable').addClass(id + 'excludedDraggable');
		newElement.find('i').click(function(e){
			e.preventDefault();
			addElement($(e.target).parent());
			if (options.changed) {
				options.changed(callback);
			}
		});
		var placeFound = false;
		$('#' + id + 'ExcludedSelect').find('li').each(function(index, excludedElement){
			if($(newElement).find('span').text() < $(excludedElement).find('span').text()){
				$(excludedElement).before($(newElement));
				placeFound = true;
				return false;
			}
		});
		if(!placeFound){
			$('#' + id + 'ExcludedSelect').append(newElement);
		}
		addListeners(newElement);
		element.remove();
	}

	dragSrcEl = null;

	var handleDragStart = function(e){
		if(multipleSelectDisabled){
			return;
		}
		dragSrcEl = this;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', this.innerHTML);
	}

	var handleDragOver = function(e){
		if(multipleSelectDisabled){
			return;
		}
		if (e.preventDefault) {
			e.preventDefault();
		}
		e.dataTransfer.dropEffect = 'move';
		return false;
	}

	var handleDragEnter = function(e) {


		if(!multipleSelectDisabled
			&& dragSrcEl != this
			&& (!$(dragSrcEl).hasClass(id + 'excludedDraggable') || !$(this).hasClass(id + 'excludedDraggable'))
			&& (
				(options.allowOrdering && $(dragSrcEl).hasClass(id + 'includedDraggable') && $(this).hasClass(id + 'includedDraggable'))
				|| ($(dragSrcEl).hasClass(id + 'excludedDraggable') && $(this).attr('id') == id + 'Included')
				|| ($(dragSrcEl).hasClass(id + 'includedDraggable') && $(this).attr('id') == id + 'Excluded')
				|| ($(dragSrcEl).hasClass(id + 'excludedDraggable') && $(this).hasClass(id + 'includedDraggable'))
			)){
			this.classList.add('overMultipleSearchInput');
		}/*else if(!multipleSelectDisabled && $(dragSrcEl).hasClass(id + 'includedDraggable') && $(this).closest('[name="ExcludedSelect_' + id + '"]').length == 1){

			$(this).closest('.excludedSelect')[0].classList.add('overMultipleSearchInput');
		}*/
	}

	var handleDragLeave = function(e) {
		if(!multipleSelectDisabled){
			this.classList.remove('overMultipleSearchInput');
		}

	}

	var handleDrop = function (e) {
		if(multipleSelectDisabled){
			return;
		}
		if (e.stopPropagation) {
			e.stopPropagation();
		}

		if(dragSrcEl && dragSrcEl != this && ($(dragSrcEl).hasClass(id + 'includedDraggable') || $(dragSrcEl).hasClass(id + 'excludedDraggable'))) {
			if($(dragSrcEl).hasClass(id + 'includedDraggable') && ($(this).attr('id') == id + 'Excluded' || $(this).closest('div.excludedSelect').length)){
				removeElement($(dragSrcEl));
				if (options.changed) {
					options.changed(callback);
				}
			}else if($(dragSrcEl).hasClass(id + 'excludedDraggable') && $(this).attr('id') == id + 'Included'){
				addElement($(dragSrcEl));
				if (options.changed) {
					options.changed(callback);
				}
			}else if($(dragSrcEl).hasClass(id + 'excludedDraggable') && $(this).closest('div.includedSelect').length){
				addElementBefore($(dragSrcEl), $(this));
				if (options.changed) {
					options.changed(callback);
				}
			}else if($(dragSrcEl).hasClass(id + 'includedDraggable') && $(this).hasClass(id + 'includedDraggable') && options.allowOrdering){
				dragSrcEl.innerHTML = this.innerHTML;
				var dragId = dragSrcEl.getAttribute('id');
				var dragValue = dragSrcEl.getAttribute('value');
				dragSrcEl.setAttribute('id', this.getAttribute('id'));
				dragSrcEl.setAttribute('value', this.getAttribute('value'));
				this.innerHTML = e.dataTransfer.getData('text/html');
				this.setAttribute('id', dragId);
				this.setAttribute('value', dragValue);
				if (options.changed) {
					options.changed(callback);
				}
				$('#' + dragSrcEl.id).find('i').click(function(e){
					removeElement($(e.target).parent());
				});
				$('#' + this.id).find('i').click(function(e){
					removeElement($(e.target).parent());
				});
			}
			$(this).removeClass('overMultipleSearchInput');
		}

		return false;
	}

	var handleDragEnd = function (e) {
		if(multipleSelectDisabled){
			return;
		}
		$('#' + id + 'IncludedSelect li.overMultipleSearchInput').removeClass('overMultipleSearchInput');
		dragSrcEl = null;
	}

	var addListeners = function(newElement){
		var element = document.getElementById($(newElement).attr('id'));
		element.addEventListener('dragenter', handleDragEnter, false);
		element.addEventListener('dragleave', handleDragLeave, false);
		element.addEventListener('dragover', handleDragOver, false);
		element.addEventListener('drop', handleDrop, false);
		element.addEventListener('dragend', handleDragEnd, false);
		if($(element).hasClass(id + 'includedDraggable') || $(element).hasClass(id + 'excludedDraggable')){
			element.addEventListener('dragstart', handleDragStart, false);
		}
	}

	if ($(this).data('created')) {

		options = $(this).widget().options();

		var options = $.extend(options, data);
		if ((options.selected && options.selected.length == 0) && options.selectAllIfEmpty) {
			var allExcludedOptions = $('#' + id + 'ExcludedSelect li');
			if (allExcludedOptions.length > 0) {
				allExcludedOptions.each(function(index, element){
					addElement($(element));
				});
			}
		} else {
			var allIncludedOptions = $('#' + id + 'IncludedSelect li');
			if (allIncludedOptions.length > 0) {
				allIncludedOptions.each(function(index, element){
					removeElement($(element));
				});
			}
		}
		var select = $('#' + id + 'ExcludedSelect');
		var toSelect = $('#' + id + 'IncludedSelect');

		if (options.selected) {
			$.each(options.selected,function(idx, id) {
				var selectedOpt;
				if (options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id[options.valueAttr]) + '"]');
				} else {
					selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id) + '"]');
				}
				if (selectedOpt.length) {
					addElement(selectedOpt);
				}
			});
		}

		if (data && data.insert) {
			$.each(data.insert,function(idx, obj) {
				newElement = $('<li id="' + id + 'Element' + he.encode(obj[options.valueAttr]) + '" value="' + he.encode(obj[options.valueAttr]) + '" draggable="true" class="draggable ' + id + 'includedDraggable"><span>'
						+ (options.nameIsResourceKey ? (getResource(obj[options.nameAttr]) == undefined
								? he.encode(obj[options.nameAttr]) : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + '</span>&ensp;<i class="fa fa-arrow-down"></i></li>');
				removeElement(newElement);
			});
		}

		if (data && data.remove) {
			$.each(data.remove,function(idx, obj) {
				if (options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(obj[options.valueAttr]) + '"]');
					if (!selectedOpt) {
						selectedOpt = $('#' + toSelect.attr('id') + ' li[value="' + he.encode(obj[options.valueAttr]) + '"]');
					}
				} else {
					selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(obj) + '"]');
					if (!selectedOpt) {
						selectedOpt = $('#' + toSelect.attr('id') + ' li[value="' + he.encode(obj) + '"]');
					}
				}
				if (selectedOpt && selectedOpt.length) {
					$(selectedOpt).remove();
				}
			});
		}

		if (data && data.selected) {
			$.each(data.selected,function(idx, id) {
				var selectedOpt;
				if (options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id[options.valueAttr]) + '"]');
				} else {
					selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id) + '"]');
				}
				if (selectedOpt && selectedOpt.length) {
					addElement(selectedOpt);
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
					{ valueAttr : 'id',
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
					if (val) {
						var select = $('#' + id + 'ExcludedSelect');
						var toSelect = $('#' + id + 'IncludedSelect');
						$.each(
							splitFix(val),
							function(idx, id) {
								var selectedOpt;
								if (options.selectedIsObjectList) {
									selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id[options.valueAttr]) + '"]');
								} else {
									selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id) + '"]');
								}
								if (selectedOpt) {
									toSelect.append($(selectedOpt).clone());
									$(selectedOpt).remove();
								}
							});
					}
				},
				getValue: function() {
					result = new Array();

					$('#' + id + 'IncludedSelect li').each(function() {
						result.push(he.decode($(this).attr('value')));
					});
					return result;
				},
				reset: function() {
					$('#' + id).multipleSelect();
				},
				disable: function() {
					$('#' + id + 'IncludedSelect li i').hide();
					$('#' + id + 'ExcludedSelect li i').hide();
					$('#' + id + 'IncludedSelect li').attr('draggable', false);
					$('#' + id + 'IncludedSelect li').css('cursor', 'default');
					$('#' + id + 'ExcludedSelect li').attr('draggable', false);
					$('#' + id + 'ExcludedSelect li').css('cursor', 'default');
					multipleSelectDisabled = true;
				},
				enable: function() {
					$('#' + id + 'IncludedSelect li i').show();
					$('#' + id + 'ExcludedSelect li i').show();
					$('#' + id + 'ExcludedSelect li i').css('cursor', 'pointer');
					$('#' + id + 'IncludedSelect li').attr('draggable', true);
					$('#' + id + 'IncludedSelect li').css('cursor', 'move');
					$('#' + id + 'ExcludedSelect li').attr('draggable', true);
					$('#' + id + 'ExcludedSelect li').css('cursor', 'move');
					multipleSelectDisabled = false;
				},
				isEnabled: function() {
					//return !$('#' + id + 'IncludedSelect').attr('disabled');
					return !multipleSelectDisabled;
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
		$('#' + id + 'Included').remove();

		var name = (options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id ;

		//$(this).addClass('container-fluid');

		$(this).append('<div id="' + id + '"></div>');
		$('#' + id).append('<div id="' + id + 'ExcludedList" style="overflow: auto"><label>' + getResource(options.excludedLabelResourceKey) + '</label><div class="excludedList col-md-5 formInput form-control excludedSelect" id="' + id
				+ 'Excluded"></div></div>');

		$('#' + id + 'Excluded').append(
					'<ul ' + (!options.disabled ? '' : 'disabled="disabled" ') + 'id="' + id
						+ 'ExcludedSelect" name="ExcludedSelect_' + name + '"/>');

		$('#' + id).append('<div id="' + id + 'IncludedList" class="includedList1"><label>' + getResource(options.includedLabelResourceKey) + '</label><div class="includedList col-md-5 formInput form-control includedSelect" id="' + id
				+ 'Included"></div></div>');

		$('#' + id + 'Included').append('<ul ' + (!options.disabled ? '' : 'disabled="disabled" ')
				+ 'id="' + id + 'IncludedSelect" name="IncludedSelect_' + name + '"/>');

		var select = $('#' + id + 'ExcludedSelect');
		var toSelect = $('#' + id + 'IncludedSelect');
	}

	addListeners($('#' + id + 'Excluded'));
	addListeners($('#' + id + 'Included'));

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
				var newElement;
				if(options.valuesIsObjectList) {
					newElement = $('<li id="' + id + 'Element' + he.encode(obj[options.valueAttr]) + '" draggable="true" class="draggable ' + id + 'excludedDraggable" value="' + he.encode(obj[options.valueAttr]) + '"><span>' + (options.nameIsResourceKey
							? (getResource(options.resourceKeyTemplate.format(obj[options.nameAttr])) == undefined ? he.encode(obj[options.nameAttr])
								: getResource(options.resourceKeyTemplate.format(obj[options.nameAttr]))) : he.encode(obj[options.nameAttr])) + '</span>&ensp;<i class="fa fa-arrow-down"></i></li>');

				} else {
					newElement = $('<li id="' + id + 'Element' + he.encode(obj[options.valueAttr]) + '" draggable="true" class="draggable ' + id + 'excludedDraggable" value="' + obj + '"><span>' + (options.nameIsResourceKey
							? (getResource(options.resourceKeyTemplate.format(obj)) == undefined ? he.encode(obj)
								: getResource(options.resourceKeyTemplate.format(obj))) : he.encode(obj)) + '</span>&ensp;<i class="fa fa-arrow-down"></i></li>');
				}
				if(options.selectAllIfEmpty == "true" && (options.selected && options.selected.length==0)){
					addElement(newElement);
				}else{
					removeElement(newElement);
				}
		});

		if (options.selected) {
			$.each(options.selected, function(idx, id) {
				var selectedOpt;
				if (options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id[options.valueAttr]) + '"]');
				} else {
					selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id) + '"]');
				}
				if (selectedOpt && selectedOpt.length) {
					addElement(selectedOpt);
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
					var newElement;
					if(options.valuesIsObjectList) {
						newElement = $('<li id="' + id + 'Element' + he.encode(obj[options.valueAttr]) + '" draggable="true" class="draggable ' + id + 'excludedDraggable" value="' + he.encode(obj[options.valueAttr]) + '"><span>' + (options.nameIsResourceKey
								? (getResource(options.resourceKeyTemplate.format(obj[options.nameAttr])) == undefined ? he.encode(obj[options.nameAttr])
										: getResource(options.resourceKeyTemplate.format(obj[options.nameAttr]))) : he.encode(obj[options.nameAttr])) + '</span>&ensp;<i class="fa fa-arrow-down"></i></li>');
					} else {
						newElement = $('<li id="' + id + 'Element' + he.encode(obj[options.valueAttr]) + '" draggable="true" class="draggable ' + id + 'excludedDraggable" value="' + he.encode(obj) + '"><span>' + (options.nameIsResourceKey
								? (getResource(options.resourceKeyTemplate.format(obj)) == undefined ? he.encode(obj)
									: getResource(options.resourceKeyTemplate.format(obj))) : he.encode(obj)) + '</span>&ensp;<i class="fa fa-arrow-down"></i></li>');
					}
					if((!options.selected || (options.selected && options.selected.length == 0)) && options.selectAllIfEmpty){
						addElement(newElement);
					}else{
						removeElement(newElement);
					}
				});

				if (options.selected) {
					$.each(options.selected, function(idx, id) {
						var selectedOpt;
						if (options.selectedIsObjectList) {
							selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id[options.valueAttr]) + '"]');
						} else {
							selectedOpt = $('#' + select.attr('id') + ' li[value="' + he.encode(id) + '"]');
						}
						if (selectedOpt && selectedOpt.length) {
							addElement(selectedOpt);
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


$.fn.multipleSearchInput = function(data) {
	var id = checkElementHasId($(this)).attr('id');
	var removeElement = function(e){
	    if(options.preRemoveCallback){
	        if(!options.preRemoveCallback(e, callback)){
	            return;
	        }
	    }

		$(e.target).parent().remove();
		toSelect.data('updated', true);
		if (options.changed) {
			options.changed(callback);
		}
	}

	var processCrossDeletable = function(cross, obj) {
	    if(typeof options.objectDeletable == 'undefined' || options.objectDeletable(obj)) {
            cross.data('value', obj);
            cross.click(function(e){
                if(options.confirmRemove){
                    bootbox.confirm({
                        message: getResource(options.confirmRemoveMsgKey || 'confirm.remove.operation'),
                        buttons: {
                            confirm: {
                                label: getResource('text.yes'),
                                className: 'btn-success'
                            },
                            cancel: {
                                label: getResource('text.no'),
                                className: 'btn-danger'
                            }
                        },
                        callback: function (result) {
                            if(result) {
                                removeElement(e);
                            }
                        }
                    });
                } else {
                    removeElement(e);
                }
            });
        } else {
            cross.remove();
        }
	}

	dragSrcEl = null;

	var handleDragStart = function(e){
		dragSrcEl = this;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', this.innerHTML);
	}

	var handleDragOver = function(e){
		if (e.preventDefault) {
			e.preventDefault();
		}
		if(this != dragSrcEl && $(this).hasClass(id + 'Draggable')){
			e.dataTransfer.dropEffect = 'move';
		}

		return false;
	}

	var handleDragEnter = function(e) {
		if(this != dragSrcEl && $(this).hasClass(id + 'Draggable')){
			this.classList.add('overMultipleSearchInput');
		}
	}

	var handleDragLeave = function(e) {
		this.classList.remove('overMultipleSearchInput');
	}

	var handleDrop = function (e) {
		if (e.stopPropagation) {
			e.stopPropagation();
		}
		if(this != dragSrcEl && $(this).hasClass(id + 'Draggable')){
			dragSrcEl.innerHTML = this.innerHTML;
			var dragId = dragSrcEl.getAttribute('id');
			var dragValue = dragSrcEl.getAttribute('value');
			dragSrcEl.setAttribute('id', this.getAttribute('id'));
			dragSrcEl.setAttribute('value', this.getAttribute('value'));
			this.innerHTML = e.dataTransfer.getData('text/html');
			this.setAttribute('id', dragId);
			this.setAttribute('value', dragValue);
			if (options.changed) {
				options.changed(callback);
			}

			$('#' + dragSrcEl.id).find('i').click(function(e){
				removeElement(e);
			});
			$('#' + this.id).find('i').click(function(e){
				removeElement(e);
			});
		}
		return false;
	}

	var handleDragEnd = function (e) {
		$('#' + id + 'IncludedSelect li.overMultipleSearchInput').removeClass('overMultipleSearchInput');
	}

	var addListeners = function(newElement){
		if(options.allowOrdering){
			var element = document.getElementById($(newElement).attr('id'));
			element.addEventListener('dragstart', handleDragStart, false);
			element.addEventListener('dragenter', handleDragEnter, false);
			element.addEventListener('dragover', handleDragOver, false);
			element.addEventListener('dragleave', handleDragLeave, false);
			element.addEventListener('drop', handleDrop, false);
			element.addEventListener('dragend', handleDragEnd, false);
		}
	}

	if ($(this).data('created')) {
		options = $(this).widget().options();

		var inputText = $('#' + id + 'ExcludedSelect');
		inputText.val('');
		var allIncludedOptions = $('#' + id + 'IncludedSelect li');
		if (allIncludedOptions.length > 0) {
			$(allIncludedOptions).remove();
		}

		var select = $('#' + id + 'ExcludedSelect');
		var toSelect = $('#' + id + 'IncludedSelect');
		if (data && data.selected) {
			$.each(data.selected, function(idx, obj) {
				var newElement = $('<li id="' + id + 'Li' + obj[options.valueAttr] + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + 'value="' + obj[options.valueAttr] + '"><span>' + obj[options.nameAttr] + '</span>&ensp;<i class="fa fa-times"></i></li>');
				var cross = newElement.find('i');
				processCrossDeletable(cross, obj);
				toSelect.append(newElement);
				addListeners(newElement);
			});
		}

		if(data && data.disabled) {
			$(this).widget().disable();
		} else {
			$(this).widget().enable();
		}

		return;

	} else {

		var options = $
				.extend(
					{ valueAttr : 'id',
						nameAttr : 'name',
						nameIsResourceKey : false,
						selectAllIfEmpty : false,
						selectedIsObjectList : false,
						disabled : false,
						isNamePairValue: true,
						addOnSelect: true,
						isArrayValue: true },
					data);

		var name = ((data && data.resourceKey != null ) ? formatResourceKey(data.resourceKey) : id) ;

		$('#' + id + 'Excluded').remove();
		$('#' + id + 'Included').remove();

		$(this).append('<div id="' + id + '"></div>');
		$('#' + id).append('<div id="' + id + 'ExcludedSearch"><div class="excludedList" id="' + id + 'Excluded"></div></div>');
		$('#' + id).append('<div id="' + id + 'SelectedItems"><div class="includedList widget" id="' + id + 'Included"></div></div></div>');

		var searchInput = $('#' + id + 'Excluded').autoComplete({
			remoteSearch: true,
			searchParams: options.searchParams,
			url: options.url,
			variables: options.variables,
			nameAttr: options.nameAttr,
			valueAttr: options.valueAttr,
			selectedIsObjectList: true,
			disabled: options.disabled,
			icon: options.addOnSelect ? 'fa-search' : 'fa-plus',
			nameIsResourceKey: options.nameIsResourceKey,
			clicked: function(element) {
				var selectedObj = element.getObject();
				if (!selectedObj) {
					return;
				}
				if(options.preAddCallback) {
				    if(!options.preAddCallback(selectedObj, callback)){
				        return;
				    }
                }
				var newElement = $('<li id="' + id + 'Li' + selectedObj[options.valueAttr] + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + 'value="' + selectedObj[options.valueAttr] + '"><span>'
						+ (options.nameIsResourceKey ? getResource(selectedObj[options.nameAttr]) : selectedObj[options.nameAttr]) + '</span>&ensp;<i class="fa fa-times"></i></li>');
				var cross = newElement.find('i');
                processCrossDeletable(cross, selectedObj);
				toSelect.append(newElement);
				addListeners(newElement);
				searchInput.clear();
				toSelect.data('updated', true);

				if (options.changed) {
					options.changed(callback);
				}
			},
			changed: function(element){
				if(options.addOnSelect) {
					this.clicked(element);
				} else {
//					element.dropdown();
				}
			}
		});

		$('#' + id + 'Included').append('<div class="formInput form-control includedSelect">' +
					'<ul ' + (!options.disabled ? '' : 'disabled="disabled" ') + ' id="'
							+ id + 'IncludedSelect" name="IncludedSelect_' + name + '" /></div>');

		var select = $('#' + id + 'ExcludedSelect');
		var toSelect = $('#' + id + 'IncludedSelect');

		var callback = {
			setValue: function(val) {
				toSelect.empty();
				$.each(val, function(idx, obj) {
					var newElement = $('<li id="' + id + 'Li' + obj[options.valueAttr] + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + 'value="' + obj[options.valueAttr] + '"><span>' + obj[options.nameAttr] + '</span>&ensp;<i class="fa fa-times"></i></li>');
					var cross = newElement.find('i');
					processCrossDeletable(cross, obj);
					toSelect.append(newElement);
					addListeners(newElement);
				});
			},
			getValue: function() {
				result = new Array();
				if(options.isNamePairValue) {
					$('#' + id + 'IncludedSelect li').each(function() {
						result.push(he.encode($(this).attr('value')) + "=" + he.encode($(this).find('span').text()));
					});
				} else {
					$('#' + id + 'IncludedSelect li').each(function() {
						result.push(he.encode($(this).attr('value')));
					});
				}
				return result;
			},
			reset: function() {
				$('#' + id).multipleSearchInput();
			},
			disable: function() {
				$('#' + id + 'Excluded').widget().disable();
				if(options.allowOrdering){
					$('#' + id + 'IncludedSelect li').attr('draggable', false);
					$('#' + id + 'IncludedSelect li').css('cursor', 'default');
				}
				$('#' + id + 'IncludedSelect li i').hide();
			},
			enable: function() {
				$('#' + id + 'Excluded').widget().enable();
				if(options.allowOrdering){
					$('#' + id + 'IncludedSelect li').attr('draggable', true);
					$('#' + id + 'IncludedSelect li').css('cursor', 'move');
				}
				$('#' + id + 'IncludedSelect li i').show();
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).multipleSearchInput();
 			}
		};
	}

	if (options.values) {
		if(options.isNamePairValue) {
			$.each(options.values, function(idx, obj) {
				var newElement = $('<li id="' + id + 'Li' + he.decode(obj.value) + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + 'value="' + he.decode(obj.value) + '"><span>' + he.decode(obj.name) + '</span>&ensp;<i class="fa fa-times"></i></li>');
				var cross = newElement.find('i');
                processCrossDeletable(cross, obj);
				toSelect.append(newElement);
				addListeners(newElement);
			});
		} else {
			$.each(options.values, function(idx, obj) {
				var newElement = $('<li id="' + id + 'Li' + obj + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + 'value="' + obj + '"><span>' + obj + '</span>&ensp;<i class="fa fa-times"></i></li>');
				var cross = newElement.find('i');
                processCrossDeletable(cross, obj);
				toSelect.append(newElement);
				addListeners(newElement);
			});
		}
	} else if(options.selected) {
		$.each(options.selected, function(idx, obj) {
			var newElement = $('<li id="' + id + 'Li' + obj[options.valueAttr] + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + 'value="' + obj[options.valueAttr] + '"><span>' + obj[options.nameAttr] + "</span>&ensp;<i class='fa fa-times'></i></li>");
			var cross = newElement.find('i');
			processCrossDeletable(cross, obj);
			toSelect.append(newElement);
			addListeners(newElement);
		});
	}

	if(options.disabled) {
		callback.disable();
	}

	$(this).data('created', true);
	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}
/**
 * Shows a text box and list box with the ability to insert the text into the list.
 */
$.fn.multipleTextInput = function(data) {

	var id = checkElementHasId($(this)).attr('id');

	var removeElement = function(e){
		$(e.target).parent().remove();
		toSelect.data('updated', true);
		if (options.changed) {
			options.changed(callback);
		}
	}

	dragSrcEl = null;

	var handleDragStart = function(e){
		dragSrcEl = this;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', this.innerHTML);
	}

	var handleDragOver = function(e){
		if (e.preventDefault) {
			e.preventDefault();
		}
		if(this != dragSrcEl && $(this).hasClass(id + 'Draggable')){
			e.dataTransfer.dropEffect = 'move';
		}

		return false;
	}

	var handleDragEnter = function(e) {
		if(this != dragSrcEl && $(this).hasClass(id + 'Draggable')){
			this.classList.add('overMultipleSearchInput');
		}
	}

	var handleDragLeave = function(e) {
		this.classList.remove('overMultipleSearchInput');
	}

	var handleDrop = function (e) {
		if (e.stopPropagation) {
			e.stopPropagation();
		}
		if(this != dragSrcEl && $(this).hasClass(id + 'Draggable')){
			dragSrcEl.innerHTML = this.innerHTML;
			var dragId = dragSrcEl.getAttribute('id');
			var dragValue = $(dragSrcEl).data('value');
			dragSrcEl.setAttribute('id', this.getAttribute('id'));
			$(dragSrcEl).data('value', dragValue);
			this.innerHTML = e.dataTransfer.getData('text/html');
			this.setAttribute('id', dragId);
			$(this).data('value', dragValue);
			if (options.changed) {
				options.changed(callback);
			}
			$('[id="' + dragSrcEl.id + '"]').find('i').click(function(e){
				removeElement(e);
			});

			$('[id="' + this.id + '"]').find('i').click(function(e){
				removeElement(e);
			});
		}
		return false;
	}

	var handleDragEnd = function (e) {
		$('#' + id + 'IncludedSelect li.overMultipleSearchInput').removeClass('overMultipleSearchInput');
		dragSrcEl = null;
	}

	var addListeners = function(newElement){
		if(options.allowOrdering){
			var element = document.getElementById($(newElement).attr('id'));
			element.addEventListener('dragstart', handleDragStart, false);
			element.addEventListener('dragenter', handleDragEnter, false);
			element.addEventListener('dragover', handleDragOver, false);
			element.addEventListener('dragleave', handleDragLeave, false);
			element.addEventListener('drop', handleDrop, false);
			element.addEventListener('dragend', handleDragEnd, false);
		}
	}

	var removeListeners = function(newElement){
		if(options.allowOrdering){
			var element = document.getElementById($(newElement).attr('id'));
			element.removeEventListener('dragstart', handleDragStart, false);
			element.removeEventListener('dragenter', handleDragEnter, false);
			element.removeEventListener('dragover', handleDragOver, false);
			element.removeEventListener('dragleave', handleDragLeave, false);
			element.removeEventListener('drop', handleDrop, false);
			element.removeEventListener('dragend', handleDragEnd, false);
		}
	}

	if ($(this).data('created')) {

		options = $(this).widget().options();

		var inputText = $('#' + id + 'ExcludedSelect');
		inputText.val('');
		var allIncludedOptions = $('#' + id + 'IncludedSelect li');
		if (allIncludedOptions.length > 0) {
			$(allIncludedOptions).remove();
		}

		var toSelect = $('#' + id + 'IncludedSelect');

		if(data && data.values) {
			options.values = data.values;
		}

		if (options.values) {
			$.each(options.values, function(idx, obj) {
				var newElementId = (id + 'Li' + encodeURIComponent(he.encode(obj)));
				var newElement = $('<li id="' + newElementId + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + '><span>' + he.encode(obj) + '</span>&ensp;<i class="fa fa-times"></i></li>');
				newElement.find('i.fa.fa-times').click(function(e){
					removeElement(e);
				});
				toSelect.append(newElement);
				$(newElement).data("value", encodeURIComponent(he.encode(obj)));
				addListeners(newElement);
			});
		}

		return;

	} else {

		var options = $
				.extend(
					{ valueAttr : 'id',
						nameAttr : 'name',
						nameIsResourceKey : false,
						selectAllIfEmpty : false,
						selectedIsObjectList : false,
						disabled : false,
						isArrayValue: true },
					data);

		var name = ((data && data.resourceKey != null ) ? formatResourceKey(data.resourceKey) : id) ;

		$('#' + id + 'Excluded').remove();
		$('#' + id + 'Included').remove();

		$(this).append('<div id="' + id + '"></div>');
		$('#' + id).append('<div id="' + id + 'ExcludedSearch"><div class="excludedList input-group " id="' + id + 'Excluded"></div></div>');

		var textInput = $('#' + id + 'Excluded').textInput({
				id: id + 'ExcludedSelect',
				isPropertyInput: false,
				variables: options.variables
		});

		var searchAction = function() {
		    var selectedText = textInput.getValue();
            if (selectedText.trim() == '') {
                return;
            }
		    var newElementId =  (id + 'Li' + encodeURIComponent(he.encode(selectedText)));
		    var newElement = $('<li id="' + newElementId + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + '><span>' + he.encode(selectedText) + '</span>&ensp;<i class="fa fa-times"></i></li>');
            newElement.find('i.fa.fa-times').click(function(e){
                removeElement(e);
            });
            toSelect.append(newElement);
            $(newElement).data("value", encodeURIComponent(he.encode(selectedText)));
            addListeners(newElement);
            textInput.clear();
    		if (options.changed) {
    			options.changed(callback);
    		}
		}

		$('#' + id + 'Excluded').append('<span id="' + id + 'ExcludedSearchAddButton" class="input-group-addon"><i class="fa fa-plus"></i></span>');
		$('#input' + id + 'ExcludedSelect').after('<ul id="auto_' + id + 'ExcludedAutoComplete" class="dropdown-menu scrollable-menu" role="menu"><li><a>' + getResource('pressEnter.text') + '</a></li></ul>');
		$('#input' + id + 'ExcludedSelect').focus(function(){
			$('#auto_' + id + 'ExcludedAutoComplete').show();
		});
		$('#input' + id + 'ExcludedSelect').blur(function(){
			$('#auto_' + id + 'ExcludedAutoComplete').hide();
		});
		$('#' + id + 'Excluded').keyup(function(e) {
			var code = e.which;
		    if(code==13){
		    	e.preventDefault();
		    	searchAction();
		    }
		});

		$('#' + id + 'ExcludedSearchAddButton').click(function(e) {
           searchAction();
        });

		$('#' + id).append('<div class="includedList" id="' + id + 'Included"></div>');
		$('#' + id + 'Included').append('<div class=" formInput form-control includedSelect wrap">'
					+ '<ul ' + (!options.disabled ? '' : 'disabled="disabled" ') + 'multiple="multiple" id="'
							+ id + 'IncludedSelect" name="IncludedSelect_' + name + '"/></div>');

		var toSelect = $('#' + id + 'IncludedSelect');

		var callback = {
				setValue: function(val) {
					// Cannot be done yet.
				},
				getValue: function() {
					result = new Array();

					$('#' + id + 'IncludedSelect li').each(function() {
						result.push(decodeURIComponent(he.decode($(this).data('value'))));
					});
					return result;
				},
				reset: function() {
					$('#' + id).multipleTextInput();
				},
				disable: function() {
					$('#' + id + 'Excluded').widget().disable();
					if(options.allowOrdering){
						$('#' + id + 'IncludedSelect li').attr('draggable', false);
						$('#' + id + 'IncludedSelect li').css('cursor', 'default');
						$('#' + id + 'IncludedSelect li').each(function(){
							removeListeners($(this));
						});
					}
					$('#' + id + 'IncludedSelect li i').off();
					$('#' + id + 'IncludedSelect li i').css('cursor', 'default');
				},
				enable: function() {
					$('#' + id + 'Excluded').widget().enable();
					if(options.allowOrdering){
						$('#' + id + 'IncludedSelect li').attr('draggable', true);
						$('#' + id + 'IncludedSelect li').css('cursor', 'move');
						$('#' + id + 'IncludedSelect li').each(function(){
							addListeners($(this));
						});
					}
					$('#' + id + 'IncludedSelect li i').on('click', removeElement);
					$('#' + id + 'IncludedSelect li i').css('cursor', 'pointer');
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
	}

	if (options.values) {
		$.each(options.values, function(idx, obj) {
			var newElementId =  (id + 'Li' + encodeURIComponent(he.encode(obj)));
			var newElement = $('<li id="' + newElementId + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + '><span class="wrap">' + obj + '</span>&ensp;<i class="fa fa-times"></i></li>');

			newElement.find('i.fa.fa-times').click(function(e){
				removeElement(e);
			});
			toSelect.append(newElement);
			$(newElement).data("value", encodeURIComponent(he.encode(obj)));
			addListeners(newElement);
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
 * Shows a name pair component
 */
$.fn.multipleNamePairInput = function(data) {

	var id = checkElementHasId($(this)).attr('id');

	var removeElement = function(e){
		$(e.target).parent().remove();
		toSelect.data('updated', true);
		if (options.changed) {
			options.changed(callback);
		}
	}

	dragSrcEl = null;

	var handleDragStart = function(e){
		dragSrcEl = this;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/html', this.innerHTML);
	}

	var handleDragOver = function(e){
		if (e.preventDefault) {
			e.preventDefault();
		}
		if(this != dragSrcEl && $(this).hasClass(id + 'Draggable')){
			e.dataTransfer.dropEffect = 'move';
		}

		return false;
	}

	var handleDragEnter = function(e) {
		if(this != dragSrcEl && $(this).hasClass(id + 'Draggable')){
			this.classList.add('overMultipleSearchInput');
		}
	}

	var handleDragLeave = function(e) {
		this.classList.remove('overMultipleSearchInput');
	}

	var handleDrop = function (e) {
		if (e.stopPropagation) {
			e.stopPropagation();
		}
		if(this != dragSrcEl && $(this).hasClass(id + 'Draggable')){
			dragSrcEl.innerHTML = this.innerHTML;
			var dragId = dragSrcEl.getAttribute('id');
			var dragValue = dragSrcEl.getAttribute('value');
			dragSrcEl.setAttribute('id', this.getAttribute('id'));
			dragSrcEl.setAttribute('value', this.getAttribute('value'));
			this.innerHTML = e.dataTransfer.getData('text/html');
			this.setAttribute('id', dragId);
			this.setAttribute('value', dragValue);
			if (options.changed) {
				options.changed(callback);
			}
			$('[id="' + dragSrcEl.id + '"]').find('i').click(function(e){
				removeElement(e);
			});

			$('[id="' + this.id + '"]').find('i').click(function(e){
				removeElement(e);
			});
		}
		return false;
	}

	var handleDragEnd = function (e) {
		$('#' + id + 'IncludedSelect li.overMultipleSearchInput').removeClass('overMultipleSearchInput');
		dragSrcEl = null;
	}

	var addListeners = function(newElement){
		if(options.allowOrdering){
			var element = document.getElementById($(newElement).attr('id'));
			element.addEventListener('dragstart', handleDragStart, false);
			element.addEventListener('dragenter', handleDragEnter, false);
			element.addEventListener('dragover', handleDragOver, false);
			element.addEventListener('dragleave', handleDragLeave, false);
			element.addEventListener('drop', handleDrop, false);
			element.addEventListener('dragend', handleDragEnd, false);
		}
	}

	var removeListeners = function(newElement){
		if(options.allowOrdering){
			var element = document.getElementById($(newElement).attr('id'));
			element.removeEventListener('dragstart', handleDragStart, false);
			element.removeEventListener('dragenter', handleDragEnter, false);
			element.removeEventListener('dragover', handleDragOver, false);
			element.removeEventListener('dragleave', handleDragLeave, false);
			element.removeEventListener('drop', handleDrop, false);
			element.removeEventListener('dragend', handleDragEnd, false);
		}
	}

	if ($(this).data('created')) {

		options = $(this).widget().options();

		var inputText = $('#' + id + 'ExcludedSelect').widget();
		inputText.setValue('');
		var allIncludedOptions = $('#' + id + 'IncludedSelect li');
		if (allIncludedOptions.length > 0) {
			$(allIncludedOptions).remove();
		}

		var toSelect = $('#' + id + 'IncludedSelect');

		if(data && data.values) {
			options.values = data.values;
		}

		if (options.values) {
			$.each(options.values, function(idx, obj) {
				var newElement = $('<li id="' + id + 'Li' + obj[options.valueAttr] + '" '
						+ (options.allowOrdering ? 'draggable="true" class="draggable '
								+ id + 'Draggable" ' : '' ) + '><span>' + decodeFormParameter(obj[options.nameAttr])
								+ '</span>&ensp;<i class="fa fa-times"></i></li>');
				newElement.data('value', decodeFormParameter(obj[options.valueAttr]));
				newElement.data('name', decodeFormParameter(obj[options.nameAttr]));
				newElement.find('i.fa.fa-times').click(function(e){
					removeElement(e);
				});
				toSelect.append(newElement);
				addListeners(newElement);
			});
		}

		return;

	} else {

		var options = $
				.extend(
					{ valueAttr : 'id',
						nameAttr : 'name',
						valueAttr: 'value',
						nameIsResourceKey : false,
						selectAllIfEmpty : false,
						selectedIsObjectList : false,
						disabled : false,
						isArrayValue: true,
						namePlaceholder: 'Name',
						valuePlaceholder: 'Value'
					},
					data);

		options.isNamePairValue = true;
		var name = ((data && data.resourceKey != null ) ? formatResourceKey(data.resourceKey) : id) ;

		$('#' + id + 'Excluded').remove();
		$('#' + id + 'Included').remove();

		$(this).append('<div id="' + id + '"></div>');
		$('#' + id).append('<div id="' + id + 'NameValuePair"><div class="excludedList input-group" id="' + id + 'Name"></div>'
				+ '<div class="excludedList input-group" id="' + id + 'Value"></div></div>');

		var nameInput = $('#' + id + 'Name').textInput({
				isPropertyInput: false,
				variables: options.variables,
				placeholder: options.namePlaceholder
		});

		var valueInput = $('#' + id + 'Value').textInput({
			isPropertyInput: false,
			variables: options.variables,
			placeholder: options.valuePlaceholder

		});

		var searchAction = function() {
		    var selectedText = nameInput.getValue();
            if (selectedText.trim() == '') {
                return;
            }
            var val = selectedText + '=' + valueInput.getValue();
            var newElement = $('<li id="' + id + 'Li' + he.encode(val) + '" ' + (options.allowOrdering ? 'draggable="true" class="draggable ' + id + 'Draggable" ' : '' ) + 'value="' + he.encode(val) + '"><span>' + selectedText + '</span>&ensp;<i class="fa fa-times"></i></li>');
            newElement.data('value', valueInput.getValue());
			newElement.data('name', selectedText);
            newElement.find('i.fa.fa-times').click(function(e){
                removeElement(e);
            });
            toSelect.append(newElement);
            addListeners(newElement);
            nameInput.clear();
            valueInput.clear();
		}

		$('#' + id + 'Value').append('<span id="' + id + 'ExcludedSearchAddButton" class="input-group-addon"><i class="fa fa-plus"></i></span>');
		$('#input' + id + 'ExcludedSelect').blur(function(){
			$('#auto_' + id + 'ExcludedAutoComplete').hide();
		});
		$('#' + id + 'Value').keyup(function(e) {
			var code = e.which;
		    if(code==13){
		    	e.preventDefault();
		    	searchAction();
		    }
		});

		$('#' + id + 'ExcludedSearchAddButton').click(function(e) {

           searchAction();
        });

		$('#' + id).append('<div class="includedList" id="' + id + 'Included"></div>');
		$('#' + id + 'Included').append('<div class=" formInput form-control includedSelect">'
					+ '<ul ' + (!options.disabled ? '' : 'disabled="disabled" ') + 'multiple="multiple" id="'
							+ id + 'IncludedSelect" name="IncludedSelect_' + name + '"/></div>');

		var toSelect = $('#' + id + 'IncludedSelect');

		var callback = {
				setValue: function(val) {
					// Cannot be done yet.
				},
				getValue: function() {
					result = new Array();

					$('#' + id + 'IncludedSelect li').each(function() {
						result.push(he.encode($(this).data('name')) + '=' + he.encode($(this).data('value')));
					});
					return result;
				},
				reset: function() {
					$('#' + id).multipleTextInput();
				},
				disable: function() {
					$('#' + id + 'Excluded').widget().disable();
					if(options.allowOrdering){
						$('#' + id + 'IncludedSelect li').attr('draggable', false);
						$('#' + id + 'IncludedSelect li').css('cursor', 'default');
						$('#' + id + 'IncludedSelect li').each(function(){
							removeListeners($(this));
						});
					}
					$('#' + id + 'IncludedSelect li i').off();
					$('#' + id + 'IncludedSelect li i').css('cursor', 'default');
				},
				enable: function() {
					$('#' + id + 'Excluded').widget().enable();
					if(options.allowOrdering){
						$('#' + id + 'IncludedSelect li').attr('draggable', true);
						$('#' + id + 'IncludedSelect li').css('cursor', 'move');
						$('#' + id + 'IncludedSelect li').each(function(){
							addListeners($(this));
						});
					}
					$('#' + id + 'IncludedSelect li i').on('click', removeElement);
					$('#' + id + 'IncludedSelect li i').css('cursor', 'pointer');
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
	}

	if (options.values) {
		$.each(options.values, function(idx, obj) {

			var newElement = $('<li id="' + id + 'Li'
					+ obj[options.valueAttr] + '" '
					+ (options.allowOrdering ? 'draggable="true" class="draggable '
							+ id + 'Draggable"' : '' ) + '><span>'
							+ decodeFormParameter(obj[options.nameAttr]) + '</span>&ensp;<i class="fa fa-times"></i></li>');
			newElement.data('value', decodeFormParameter(obj[options.valueAttr]));
			newElement.data('name', decodeFormParameter(obj[options.nameAttr]));

			newElement.find('i.fa.fa-times').click(function(e){
				removeElement(e);
			});
			toSelect.append(newElement);
			addListeners(newElement);
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

	var id = checkElementHasId($(this)).attr('id') + "DateInput";

    var name = ((options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id) ;

	var options = $.extend(
			{   format: "yyyy-mm-dd",
			    startView: 0,
			    orientation: "top auto",
			    multidate: false,
			    forceParse: false,
			    autoclose: true,
			    clearBtn: true,
			},  options);

	$(this).append('<div id="' + id + '" class="input-group date">'
			+ '<input id="' + id + 'Field" type="text" name="date_' + name + '" class="form-control" value="' + ( options.value ? options.value : '' ) + '">'
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
	
	$('#' + id).datepicker().on('clearDate', function(e) {
        $(this).data('updated', true);
    });

	var callback = {
			setValue: function(val) {
				$('#' + id + 'Field').val(val ? val : '');
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

	$('#' + id).datepicker().on('changeDate', function() {
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

/**
 * Time input
 */
$.fn.timeInput = function(options) {

	var id = checkElementHasId($(this)).attr('id') + "TimeInput";

	var name = ((options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id) ;

	var options = $.extend(
			{   template: 'dropdown',
				minuteStep: 1,
				showSeconds: false,
				secondStep: 1,
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

	if(options.defaultTime) {
		callback.setValue(options.defaultTime);
	}
	if(options.disabled) {
		callback.disable();
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;

};

$.fn.buttonAction = function(options) {

	var id = checkElementHasId($(this)).attr('id') + "ButtonAction";

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
		if('script' in obj) {
			window[obj.script].apply(null, [el]);
		}
		else if('eval' in obj) {
			eval(obj.eval) ;
		}
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

	var id =  checkElementHasId($(this)).attr('id') + "BooleanInput";

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

	var id = checkElementHasId($(this)).attr('id') + "SwitchInput";

	var obj = $.extend(
			{   readOnly: false,
			    disabled: false,
			    onResourceKey: 'text.on.upper',
			    offResourceKey: 'text.off.upper'
			},  options);
	obj.onText = getResource(obj.onResourceKey);
	obj.offText = getResource(obj.offResourceKey);
	obj.state = obj.value;
	obj.size = 'small';

	var name = ((options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id) ;

	var callback = {
			setValue: function(val) {
				$('#' + id).bootstrapSwitch('state', val);
			},
			getValue: function() {
				return $('#' + id).bootstrapSwitch('state');
			},
			reset: function() {
				$('#' + id).bootstrapSwitch('state', obj.value);
			},
			disable: function() {
				$('#' + id).bootstrapSwitch('disabled', true);
			},
			enable: function() {
				$('#' + id).bootstrapSwitch('disabled', false);
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

	obj.onSwitchChange = function(event, state) {
		if(options.changed) {
			options.changed(callback);
		}
	};

	$(this).append('<label class="switch"><input type="checkbox" class="switch-input" id="'
			+ id + '" name="chk_' + name + '" value="true"'
			+ '><span class="switch-label" data-on="'
			+ getResource(obj.onResourceKey) + '" data-off="'
			+ getResource(obj.offResourceKey) + '"></span> <span class="switch-handle"></span></label>');

	$('#' + id).bootstrapSwitch(obj);

	$(this).find('.bootstrap-switch-primary').addClass('btn-primary');
	$(this).find('.bootstrap-switch-default').addClass('btn-default');
	$(this).find('.bootstrap-switch-primary').removeClass('bootstrap-switch-primary');
	$(this).find('.bootstrap-switch-default').removeClass('bootstrap-switch-default');

	if(options.disabled || options.readOnly) {
		callback.disable();
	}

	if(obj.value) {
		callback.setValue(true);
	}
	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
};

$.fn.colorInput = function(options) {

	var id = checkElementHasId($(this)).attr('id') + "ColorInput";

	var obj = $.extend(
			{   format: 'hex',
				color: options.value,
			},  options);


	$(this).append('<div id="' + id  + '" class="input-group colorpicker-component"><input type="text" value="'
			+ obj.value + '" class="form-control"/><span class="input-group-addon"><i></i></span></div>');

	$('#' + id).colorpicker(obj);

	var callback = {
			setValue: function(val) {
				$('#' + id).colorpicker('getValue', val);
			},
			getValue: function() {
				return $('#' + id).colorpicker('getValue', options.value);
			},
			reset: function() {
				$('#' + id).colorpicker('setValue', options.value);
			},
			disable: function() {
				$('#' + id).colorpicker('disable', options.value);
			},
			enable: function() {
				$('#' + id).colorpicker('enable', options.value);
			},
			options: function() {
				return obj;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				$('#' + id).colorpicker('setValue', options.value);
 			}
	};

	$('#' + id).on('changeColor', function() {
		if(options.changed) {
			options.changed(callback);
		}
	});

	if(options.disabled || options.readOnly) {
		callback.disable();
	}

	if(obj.value) {
		callback.setValue(obj.value);
	}
	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
};


$.fn.imageInput = function(options) {

	var id = checkElementHasId($(this)).attr('id') + "ImageInput";

	var obj = $.extend(
			{   readOnly: false,
			    disabled: false,
			},  options);



	$(this).append('<input type="file" class="form-control" id="' + id + '" name="input' + id + '"/>');
	$(this).append('<a id="reset' + id + '" href="#" style="display: none" class="imageReset">Reset</a><br>');

	if(obj.value && obj.value !== '') {
		$('#reset' + id).show();
		$(this).append('<img id="image' + id + '" class="imagePreview" src="' + obj.value + '">');
	}

	var input = $('#' + id);

	var callback = {
			setValue: function(val) {
				input.val(val);
				if(val && val !=='') {
					$('#reset' + id).show();
				} else {
					$('#reset' + id).hide();
					$('#image' + id).remove();
				}

			},
			getValue: function() {
				return input.data('encoded');
			},
			reset: function() {
				this.setValue(obj.value);
			},
			disable: function() {
				$('#' + id).attr('disabled', true);
				$('#reset' + id).attr('disabled', true);
			},
			enable: function() {
				$('#' + id).attr('disabled', false);
				$('#reset' + id).attr('disabled', false);
			},
			options: function() {
				return obj;
			},
			getInput: function() {
				return $('#' + id);
			},
 			clear: function() {
 				this.setValue('');
 			}
	};

	$('#reset' + id).click(function(e) {
		e.preventDefault();
		callback.setValue('');
		if(options.changed) {
			options.changed(callback);
		}
	});

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

	var id = checkElementHasId($(this)).attr('id') + "SliderInput";
	var obj = $.extend(options,
			{   min: parseFloat(options.min),
			    max: parseFloat(options.max),
			    step: options.step ? parseFloat(options.step) : 1,
			    handle: options.handle ? options.handle : 'square',
			    tooltip: options.tooltip ? options.tooltip : 'show',
			    value: parseFloat(options.value),
			    formater: function(value) {
			    	return getResource(obj.labelResourceKey).format(value);
			    }
			});

	var name = ((options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id) ;

	$(this).append('<input class="form-control" id="' + id + '" data-slider-id="slider_' + id + '" name="slider_' + name + '" value="' + obj.value + '" type="text">');

	var slider = $('#' + id).slider(obj);

	var callback = {
			setValue: function(val) {
				$('#' + id).slider('setValue', parseFloat(val));
			},
			getValue: function() {
				return $('#' + id).val();
			},
			reset: function() {
				$('#' + id).slider('setValue', parseFloat(obj.value));
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
				$('#' + id).slider('setValue', parseFloat(obj.value));
			}
	};

	slider.on('slideStop', function(ev){
		   if(options.changed) {
			   options.changed(callback)
		   }
	});

	slider.on('slide', function(ev){
		   if(options.update) {
			   options.update(callback)
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
	var init = false;
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
				urlEncode: true,
				variables: [],
				onlyName: false,
				isArrayValue: true,
				showEmptyRow: false,
				password: false,
				showNameVariables: false,
				showValueVariables: false
			}, data);

	var id =  checkElementHasId($(this)).attr('id') + "NamePairInput";

	if(!rowNum){
		var rowNum = 0;
	}

	if(getResourceNoDefault(options.text)) {
		options.text = getResourceNoDefault(options.text);
	}

	var nameWeight = 'col-xs-5';
	var valueWeight = 'col-xs-5';
	if(options.columnWeight=='nameHeavy') {
		nameWeight = 'col-xs-7';
		valueWeight = 'col-xs-3';
	}else if(options.columnWeight=='valueHeavy'){
		nameWeight = 'col-xs-3';
		valueWeight = 'col-xs-7';
	}else if(options.columnWeight=='separateLines'){
		nameWeight = 'col-xs-10';
		valueWeight = 'col-xs-10';
	}

	var nameVariables = options.nameVariables.concat(options.variables);
	var valueVariables = options.valueVariables.concat(options.variables);


	if(!$(this).data('created')){
		var html = 	'<div id="' + id + '" class="propertyItem form-group">'
		+	'	<div id="' + id + 'NamePairs" ></div>'
		+	'	<div id="' + id + 'NewRow" class="row">'
		+	'		<div class="propertyValue col-xs-10">'
		+	'			<span class="help-block">&nbsp;</span>'
		+	'		</div>'
		+	'		<div class="propertyValue col-xs-1 dialogActions">'
		+	'			<a id="' + id + 'AddPair" href="#" class="btn btn-info addButton">'
		+	'				<i class="fa fa-plus"></i>'
		+	'			</a>'
		+	'		</div>'
		+	'	</div>'
		+	'</div>';
		$(this).append(html);
		$('#' + id + 'AddPair').click(function(e) {
			e.preventDefault();
			$('#' + id).parent().widget().addRows(1);
		});
	}

	var callback = {
 			getValue: function() {
 				var values = [];
 				if(init) {
 					return values;
 				}
 				$('#' + id + 'NamePairs').find('.namePairInput').each(function(){
 					if(options.urlEncode)
 						name = encodeURIComponent($(this).find('.namePairName').widget().getValue());
 					else
 						name = $(this).find('.namePairName').widget().getValue();
 					if(options.onlyName) {
 	 					values.push(name);
 					} else {
 	 					if(options.urlEncode)
 	 						value = encodeURIComponent($(this).find('.namePairValue').widget().getValue());
 	 					else
 	 						value = $(this).find('.namePairValue').widget().getValue();
 	 					values.push(name + '=' + value);
 					}

 				});
 				return values;
 			},
 			setValue: function(val) {
 				callback.removeRows();
 				$.each(val, function(index, value){
 					var idx = value.indexOf('=');
 					valuePair = idx == -1 ? [value] : [value.substring(0, idx), value.substring(idx + 1)];
					if(options.urlEncode) {
     					for(valueIndex = 0; valueIndex < valuePair.length; valueIndex++){
     							valuePair[valueIndex] = decodeURIComponent(valuePair[valueIndex]);
     					}
					}
 					callback.addRows(1, valuePair);
 				});

 				if(options.showEmptyRow) {
 					if($('#' + id + 'NamePairs').children().length == 0) {
 						callback.addRows(1);
 					}
 				}
 			},
 			disable: function() {
 				$('#' + id).find('.widget').each(function(){
 					$(this).widget().disable();
 				});
 				$('#' + id).find('.removePair').each(function(){
 					$(this).attr('disabled', 'disabled');
 				});
 				$('#' + id + 'AddPair').attr('disabled', 'disabled');
 				$('#' + id + 'NewRow').hide();
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
 				$('#' + id + 'NewRow').show();
 				options.disabled = false;
 			},
 			addRows: function(val, values){
 				init = true;
 				for (i = 0; i < val; i++) {
 					rowNum++;
 					html = '';
 	 				html =	'<div class="row namePairInput">';
 	 				if(options.onlyName){
 	 					html += '	<div id="' + id + 'NamePairName' + rowNum + '" class="form-group propertyValue col-xs-10 namePairName"></div>'
 	 				}else{
 	 					html += '	<div id="' + id + 'NamePairName' + rowNum + '" class="form-group propertyValue ' + nameWeight + ' namePairName"></div>'
 	 						 +	'	<div id="' + id + 'NamePairValue' + rowNum + '" class="form-group propertyValue ' + valueWeight + ' namePairValue"></div>';
 	 				}
 	 				html += '	<div class="propertyValue col-xs-1 dialogActions">';
 	 				if(!options.readOnly && !options.disabled) {
 	 					html +=  '<a href="#" class="removePair btn btn-danger"><i class="fa fa-trash-o"></i></a>';
 	 				}

	 				html +=  '</div></div>';

 	 				$('#' + id + 'NamePairs').append(html);
 	 				if(options.renderNameFunc) {
 	 					if(values) {
 	 						var renderField = new Function('div', 'val', 'list', options.renderNameFunc);
 	 						renderField($('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairName'), decodeURIComponent(values[0]), options.autoCompleteList);
 	 					} else {
 	 						var renderField = new Function('div', 'val', 'list', options.renderNameFunc);
 	 						renderField($('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairName'), undefined, options.autoCompleteList);
 	 					}
 	 				} else {
	 	 				$('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairName').textInput({
	 	 					variables:  options.showNameVariables ? nameVariables : null,
	 	 					url: options.nameVariablesUrl,
 	 	 					getUrlData: function(data) {
 	 	 						return data.resources;
 	 	 					},
	 	 					disabled: options.disabled || options.disableName,
	 	 					value: values ? values[0] : '',
	 	 					showVariables: options.showNameVariables
	 	 				});
 	 				}
 	 				if(!options.onlyName){
 	 					if(options.renderValueFunc) {

 	 						if(values) {
	 	 						var renderField = new Function('div', 'val', options.renderValueFunc);
	 	 						if(options.urlEncode)
	 	 							renderField($('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairValue'), decodeURIComponent(values[1]));
	 	 						else
	 	 							renderField($('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairValue'), values[1]);
 	 						} else {
 	 							var renderField = new Function('div', 'val', options.renderValueFunc);
	 	 	 					renderField($('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairValue'), undefined);
 	 						}
 	 					} else {
 	 						var inputType = 'text';
 	 	 					if(options.password){
 	 	 						inputType = 'password';
 	 	 					}
	 	 					$('#' + id + 'NamePairs').find('.namePairInput').last().find('.namePairValue').textInput({
	 	 	 					variables: options.showValueVariables ? valueVariables : null,
	 	 	 					url: options.valueVariablesUrl,
	 	 	 					inputType: inputType,
	 	 	 					getUrlData: function(data) {
	 	 	 						return data.resources;
	 	 	 					},
	 	 	 					disabled: options.disabled,
	 	 	 					value: values && values.length > 1 ? values[1] : '',
	 	 	 					showVariables: options.showValueVariables
	 	 	 				});
 	 					}
 	 				}
 	 				$('.removePair').click(function(e){
 	 					e.preventDefault();
 	 					$(this).closest('.namePairInput').remove();
 	 					$('#' + id + 'NewRow').show();
 	 				});
 	 				if(options.maxRows != 0 && $('#' + id + 'NamePairs').children().length == options.maxRows){
 	 					$('#' + id + 'NewRow').hide();
 	 				}
 				}
 				init = false;
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
	$(this).data('created', true);
	return callback;
}

$.fn.namePairsAutoComplete = function(data) {
	var options = $.extend({}, data);
	var div = $(this);
	var id =  checkElementHasId(div).attr('id') + "NamePairsAutoComplete";

	if(!$(this).data('created')) {
		var html = 	'<div id="' + id + '" class="propertyItem form-group"></div>';
		div.append(html);
	}

	div.addClass('widget');
	var namePairInput = $('#' + id).namePairInput(options);
	var callback;
	function declareCallback(){
		callback = {
	 			getValue: function() {
	 				return namePairInput.getValue();
	 			},
	 			setValue: function(val) {
	 				return namePairInput.setValue(val);
	 			},
	 			disable: function() {
	 				return namePairInput.disabled();
	 			},
	 			enable: function() {
	 				return namePairInput.enabled();
	 			},
	 			addRows: function(val, values){
	 				return namePairInput.addRows(val, values);
	 			},
	 			removeRows: function(){
	 				return namePairInput.removeRows();
	 			},
	 			options: function() {
	 				return options;
	 			},
	 			clear: function() {
	 				if($('#' + id).find('.widget').length) {
	 					$('#' + id).find('.widget').each(function() {
	 						div.widget().setValue('');
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


		return callback;
	}

	if(options.url && options.url != ''){
		getJSON(options.url, null, function(data){
			options = $.extend(
					{
						autoCompleteList: options.isResourceList ? data.rows : data,
						renderNameFunc: '$(div).autoComplete({nameIsResourceKey: ' + options.nameIsResourceKey + ','
														+	'isResourceList: ' + options.isResourceList + ','
														+	'valueAttr: "' + options.valueAttr + '",'
														+	'value: val,'
														+	'values: list'
														+ '})'

					}, options);

			namePairInput = $('#' + id).namePairInput(options);
		});
	}else{
		options = $.extend(
				{
					renderNameFunc: '$(div).autoComplete({nameIsResourceKey: ' + options.nameIsResourceKey + ','
													+	'isResourceList: ' + options.isResourceList + ','
													+	'valueAttr: "' + options.valueAttr + '",'
													+	'value: val,'
													+	'values: list'
													+ '})'

				}, options);

		namePairInput = $('#' + id).namePairInput(options);
	}
	div.data('widget', callback);
	div.data('created', true);
	return declareCallback();
};

$.fn.fileUploadInput = function(data) {


	var options = $.extend(
			{
				disabled : false,
				useUUID: true,
				showUploadButton: true,
				showDownloadButton: true,
				showDownloadLink: true,
				url: basePath + '/api/files/file',
				detailedView: true,
				getUrlData: function(data) {
					return data;
				}
			}, data);

	var id = checkElementHasId($(this)).attr('id') + "FileUpload";
	var html =	'<div id="' + id + '" class="col-xs-12" style="padding-left: 0px;">'
			+	'	<input type="file" id="' + id + 'File"/>'
			+	'</div>'
			+	'<div class="propertyValue col-xs-12 fileInputActions" id="' + id + 'Buttons">'
			+	'	<a href="#" class="btn btn-primary" id="' + id + 'UploadButton"><i class="fa fa-upload"></i></a>'
			+	'</div>'
			+	'<div class="col-xs-12 uploadProgress">'
			+	'	<div id="' + id + 'UpdateProgressHolder" class="progress">'
			+	'		<div id="' + id + 'UpdateProgress" class="progress-bar" role="progressbar"></div>'
			+	'	</div>'
			+	'</div>';


	$(this).append(html);
	$('#' + id + 'UpdateProgressHolder').css('height', '12px');
	$('#' + id + 'UpdateProgressHolder').hide();

	if(!options.showUploadButton){
		$('#' + id + 'UploadButton').hide();
		//$('#' + id + 'File').parent().removeClass('col-xs-11').addClass('col-xs-12');
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
					+	'	<span>' + data.fileName.slice(-20) + '</span><br>';

		if(options.detailedView) {
			formattedHtml +=	'	<span>' + fileSize + '</span><br>'
						+	'	<span>' + data.md5Sum + '</span>';
			if(options.showDownloadLink) {
				formattedHtml +=   '   <br><span><a href="' + basePath + '/api/files/download/' + data.shortCode + '/' + data.fileName + '">' + basePath + '/api/files/download/' + data.shortCode + '/' + data.fileName + '</a></span>';
			}
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
		$('#' + id + 'File').hide();
		if(!options.disabled && options.showDeleteButton) {
			$('#' + id + 'Buttons').append('<a class="btn btn-danger" id="' + id + 'RemoveButton"><i class="fa fa-trash"></i></a>');
		}

		if(options.showDownloadButton){
			$('#' + id + 'UploadButton').parent().append('<a class="btn btn-primary" id="' + id + 'DownloadButton"><i class="fa fa-download"></i></a>');
		}
		$('#' + id + 'UploadButton').remove();
		$('#' + id + 'Info').data('uuid', data.name);
		$('#' + id + 'Info').data('id', data.id);
		$('#' + id + 'RemoveButton').click(function(){
			bootbox.confirm(getResource('fileUpload.confirmRemoveFile'),
			function(confirmed) {
				if(confirmed){
					callback.remove();
					if(options.changed) {
						options.changed(callback);
					}
				}
			});
			return false;
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
 				if(options.useUUID)
 					return $('#' + id + 'Info').data('uuid');
 				else
 					return $('#' + id + 'Info').data('id');
 			},
 			reset: function() {
 				if(options.value == '') {
 					this.clear();
 				} else {
 					this.setValue(options.value);
 				}
 			},
 			setValue: function(uuid) {
 				getJSON('files/file/' + uuid, null, function(data){

 					if(data.success) {
	 					if($('#' + id + 'Info').length){
	 						$('#' + id + 'Info').empty();
	 						$('#' + id + 'Info').append(showInfoFormat(data.resource));
	 						$('#' + id + 'Info').data('uuid', data.resource.name);
	 						$('#' + id + 'Info').data('id', data.resource.id);
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

 				if(callback.hasFile()) {
 					$('#' + id + 'File').val('');
 					$('#' + id + 'File').show();
					$('#' + id + 'Info').remove();
					$('#' + id + 'Buttons').append('<a href="#" class="btn btn-primary" id="' + id + 'UploadButton"><i class="fa fa-upload"></i></a>');
					if(!options.showUploadButton) {
						$('#' + id + 'UploadButton').hide();
					}
					$('#' + id + 'RemoveButton').remove();
					$('#' + id + 'DownloadButton').remove();
					$('#' + id + 'UpdateProgressHolder').hide();
					$('#' + id + 'UploadButton').click(function(e){
						e.preventDefault();
						callback.upload();
					});
					if(options.disabled) {
						callback.disable();
					}
 				}
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
		 		        		showSuccess(data.message);
		 						if(options.disabled) {
		 							callback.disable();
		 						}
		 						 $(this).data('needsUpload', false);
		 						if(options.changed) {
		 							options.changed(callback);
		 						}
		 						if(options.uploaded) {
	 		        		    	options.uploaded(data.resource);
	 		        		    }
		 						if(notify) {
		 							notify(true);
		 						}
	 		        		} else {
	 		        			showError(data.message);
	 		        			if(notify) {
	 		        				notify(false);
	 		        			}
	 		        		}
 		        		}
 		        	}
 		        }
 		        xhr.open("POST",  options.url + (options.publicFile ? '/true' : ''));
 		        xhr.setRequestHeader("X-Csrf-Token", getCsrfToken());
 		        xhr.send(formData);

 		        return true;
 			},
 			uploadBlob: function(blobInfo) {
 				$('#' + id + 'UpdateProgressHolder').show();
 				$('#' + id + 'UpdateProgress').css("width",  "0%");
			    var formData = new FormData();
			    formData.append('file', blobInfo.blob(), blobInfo.filename());

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
		 		        		showSuccess(data.message);
		 						if(options.disabled) {
		 							callback.disable();
		 						}
		 						$(this).data('needsUpload', false);
		 						if(options.changed) {
		 							options.changed(callback);
		 						}
		 						if(options.uploaded) {
	 		        		    	options.uploaded(data.resource);
	 		        		    }
		 						if(notify) {
		 							notify(true);
		 						}
	 		        		} else {
	 		        		    showError(data.message);
	 		        			if(notify) {
	 		        				notify(false);
	 		        			}
	 		        		}
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
 					$('#' + id + 'File').show();
					$('#' + id + 'Info').remove();
					$('#' + id + 'Buttons').append('<a href="#" class="btn btn-primary" id="' + id + 'UploadButton"><i class="fa fa-upload"></i></a>');
					if(!options.showUploadButton) {
						$('#' + id + 'UploadButton').hide();
					}
					$('#' + id + 'RemoveButton').remove();
					$('#' + id + 'DownloadButton').remove();
					$('#' + id + 'UploadButton').click(function(e){
						e.preventDefault();
						callback.upload();
					});
					if(options.removed) {
						options.removed();
					}	
					if(options.disabled) {
						callback.disable();
					}
 				});

 			},
 			download: function(){
 				uuid = $('#' + id + 'Info').data('uuid');
 				window.location = basePath + '/api/files/download/' + uuid + '?token=' + getCsrfToken();
 			},
 			options: function() {
 				return options;
 			},
 			getInput: function() {
 				return $('#' + id);
 			}
 		};

	$('#' + id + 'UploadButton').click(function(e){
		e.preventDefault();
		callback.upload();
	});

	$('#' + id + 'File').change(function() {
		$(this).data('needsUpload', true);
		if(options.automaticUpload) {
			callback.upload();
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

$.fn.profileImage = function(data) {
		
	var options = $.extend(
		{
			disabled : false,
			previewSize: 96,
			getUrlData: function(data) {
				return data;
			}
		}, data);

    var id = checkElementHasId($(this)).attr('id') + "ProfileImage";
	var html = '<div id="' + id + 'Preview" class="col-md-4 text-center">';
	html += '<img src="' + basePath + '/api/userLogo/fetch" id="' + id + 'Preview" width="96"/>';
	html += '</div>';
	html += '<div id="' + id + 'Upload" class="col-md-8">';
	html += '</div>';
	
	$(this).append(html);
	
	var val = '';
	if(options.value) {
		if(!options.value.startsWith('logo://')) {
			val = options.value;
		}
	}
	return $('#' + id + "Upload").fileUploadInput({
	    inputType: options.inputType,
	    resourceKey: options.resourceKey,
		url: basePath + '/api/files/image',
		disabled: options.disabled,
		showDownloadButton: true,
		showUploadButton: false,
		showDeleteButton: true,
		automaticUpload: true,
		showDownloadLink: false,
		publicFile: true,
		useUUID: true,
		value: val,
		uploaded: function(resource) {
			$('#' + id + 'Preview img').remove();
			$('#' + id + 'Preview').append('<img width="96" src="' + basePath + '/api/files/public/' + resource.name + '" id="' + id + 'Preview"/>');
		},
		removed: function() {
			$('#' + id + 'Preview img').remove();
			$('#' + id + 'Preview').append('<img src="' + basePath + '/api/userLogo/fetch/__DEFAULT__" id="' + id + 'Preview" width="96"/>');
		},
		changed: function(callback) {
			if(options.changed) {
				options.changed(callback);
			}
			$('#' + id + 'Preview img').remove();
			$('#' + id + 'Preview').append('<img src="' + basePath + '/api/userLogo/fetch" id="' + id + 'Preview" width="96"/>');
		}
	});
}

$.fn.logoInput = function(data) {
	var generated = true;
	var options = $.extend(
			{
				disabled : false,
				showUploadButton: true,
				showDownloadButton: true,
				previewSize: 96,
				defaultTextCallback: false,
				typeCallback: false,
				url: 'files/image',
				getUrlData: function(data) {
					return data;
				}
			}, data);

	var imagePath = basePath + "/api/logo/default/default/" + options.previewSize + "_auto_auto_auto.png";

	var id = checkElementHasId($(this)).attr('id') + "LogoInput";

	var generatorHtml =	'<div id="' + id + 'Generator" class="logo-generator">'
		+	'<div class="logo-text-container logo-row">'
        +	'<span class="help-block">' + getResource('logo.text.label') + ':</span>'
        +   '<select id="' + id + 'TextSource" class="logo-shape form-control">'
        +   '<option value="auto">' + getResource('logo.text.auto') + '</option>'
        +   '<option value="autoname">' + getResource('logo.text.autoname') + '</option>'
        +   '<option value="autoicon">' + getResource('logo.text.autoicon') + '</option>'
        +   '<option value="icon">' + getResource('logo.text.icon') + '</option>'
        +   '<option value="text">' + getResource('logo.text.text') + '</option>'
        +   '</select>'
        +   '<input class="form-control logo-shape logo-text" maxlength="3" type="text" id="' + id + 'Text"/>'
        +   '<div id="' + id + 'Icon" class="logo-icon"/>'
        +	'</div>'
		+	'<div class="logo-shape-container logo-row">'
        +	'<span class="help-block">' + getResource('logo.shape.label') + ':</span>'
        +   '<select id="' + id + 'Shape" class="logo-shape form-control">'
        +   '<option value="autoname">' + getResource('logo.shape.autoname') + '</option>'
        +   '<option value="autotype">' + getResource('logo.shape.autotype') + '</option>'
        +   '<option value="round">' + getResource('logo.shape.circle') + '</option>'
        +   '<option value="rectangle">' + getResource('logo.shape.square') + '</option>'
        +   '<option value="rounded">' + getResource('logo.shape.rounded') + '</option>'
        +   '</select>'
        +	'</div>'
		+	'<div class="logo-colour-container logo-row">'
        +   '<span class="logo-colour-label help-block">' + getResource('logo.colour.label') + ':</span>'
        +	'<select id="' + id + 'ColourSource" class="logo-shape form-control">'
        +   '<option value="autoname">' + getResource('logo.colour.autoname') + '</option>'
        +   '<option value="autotype">' + getResource('logo.colour.autotype') + '</option>'
        +   '<option value="fixed">' + getResource('logo.colour.fixed') + '</option>'
        +   '</select>'
	    +   '<div class="logo-colour-outer"><div id="' + id + 'FixedColour" class="input-group logo-colour">'
	    +	'	<input id="' + id + 'FixedColourInput" class="logo-shape form-control" type="text"/>'
	    +	'	<span class="input-group-addon"><i></i></span>'
	    +	'</div></div>'
        +	'</div>'
    	+	'</div>';


	var uploadHtml =  '<div id="' + id + '" class="col-xs-8" style="padding-left: 0px;">'
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

	var html = '<div id="' + id + 'Container" class="logo-container">'
			+	'<div class="logo-preview">'
			+	'	<img src="' + imagePath + '" id="' + id + 'Preview"/>'
			+	'</div>'
			+ 	generatorHtml
			+	'<div class="logo-separator help-block">'
			+	'	<span id="' + id + 'Separator">' + getResource('logo.separator')  + '</span>'
			+	'</div>'
			+	uploadHtml
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
		formattedHtml +=	'</div>'
					+	'<div class="file-upload-info">'
					+	'	<span>' + data.fileName + '</span></br>';

		formattedHtml +=	'</div>';

		return formattedHtml;
	}

	var rebuildPreview = function(data) {
		var val = callback.getValue();
		var prefix = "logo://";
		var itype = options.typeCallback ? options.typeCallback() : 'default';
		if(val.slice(0, prefix.length) == prefix) {
			var txt = options.defaultTextCallback ? options.defaultTextCallback() : id;
			if(!txt || txt == '')
				txt = 'Default';
			var uri = basePath + '/api/logo/' + encodeURIComponent(itype) + "/" + encodeURIComponent(txt) + '/' + val.slice(prefix.length);
			$('#' + id + 'Preview').attr('src', uri);
		}
		else {
			var idx = val.indexOf('/');
			if(idx == -1)
				$('#' + id + 'Preview').attr('src', basePath + '/api/files/download/' + val);
			else
				$('#' + id + 'Preview').attr('src', basePath + '/api/' + val);
		}
	}

	var showInfo = function(data){

		fileSize = data.fileSize + ' KB';
		if(data.fileSize > 1024 * 1024){
			fileSize = (Math.round((data.fileSize / (1024 * 1024)) * 100)/100).toFixed(2) + ' MB';
		}
		$('#' + id + 'File').parent().append(
				'<div id="' + id + 'Info">' + showInfoFormat(data) + '</div>');
		$('#' + id + 'File').remove();
		$('#' + id + 'RemoveButton').remove();
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
			return false;
		});
		$('#' + id + 'DownloadButton').click(function(){
			callback.download();
		});

		$('#' + id + 'Generator').hide();
		$('#' + id + 'Separator').hide();
		generated = false;
		rebuildPreview();
	}

	var _showOrHideTextFields = function() {
		var txtSrc = $('#' + id + 'TextSource').val();
		if(txtSrc == 'icon') {
			if(!options.disabled)
				$('#' + id + 'Icon').data('widget').enable();
			$('#' + id + 'Text').attr('disabled', 'disabled');
			$('#' + id + 'Text').hide();
			$('#' + id + 'Icon').show();
		}
		else if(txtSrc == 'text') {
			if(!options.disabled)
				$('#' + id + 'Text').removeAttr('disabled');
			$('#' + id + 'Icon').attr('disabled', 'disabled');
			$('#' + id + 'Text').show();
			$('#' + id + 'Icon').hide();
		}
		else {
			$('#' + id + 'Text').attr('disabled', 'disabled');
			$('#' + id + 'Icon').hide();
			$('#' + id + 'Text').hide();
		}
	}

	var _doClear = function() {
		$('#' + id + 'Shape').val('autotype');
		$('#' + id + 'TextSource').val('auto');
		$('#' + id + 'Text').hide();
		$('#' + id + 'Icon').hide();
		$('#' + id + 'Text').val('');
		$('#' + id + 'FixedColour').colorpicker('setValue', '#000000');
		$('#' + id + 'ColourSource').val('autotype');
		var src = $('#' + id + 'ColourSource').val();
		$('#' + id + 'FixedColour').colorpicker(src == 'autoname' || src == 'autotype' || options.disabled ? 'disable' : 'enable');
		rebuildPreview();
			 // How to clear file input?
	}

	var callback = {
			defaultTextChanged: function() {
				rebuildPreview();
			},
 			getValue: function() {
 				if(generated) {
 					// Text
 					var textSource = $('#' + id + 'TextSource').val();
 					var text = $('#' + id + 'Text').val();
 					if(textSource == 'auto' ||textSource == 'autoname' || textSource == 'autoicon') {
 						text = textSource;
 					}
 					else if(textSource == 'icon') {
 						text = 'icon' + icon.getValue();;
 					}
 					if(text == '')
 						text = 'autoname';

 					// Colour
 					var colSource = $('#' + id + 'ColourSource').val();
 					var col = colSource;
 					if(colSource == 'fixed')
 						col = $('#' + id + 'FixedColour').colorpicker('getValue', '#000000');
 					if(!col || col == '')
 						col = "autotype";

 					// Shape
 					var shape = $('#' + id + 'Shape').val();
 					if(!shape || shape == '')
 						shape = 'autotype';
 					return "logo://" + options.previewSize + '_' + shape + '_' + encodeURIComponent(col) + '_' + encodeURIComponent(text) + '.png';
 				}
 				else {
	 				if(!$('#' + id + 'Info').length){
	 					return '';
	 				}
	 				return $('#' + id + 'Info').data('uuid');
 				}
 			},
 			setValue: function(uuid) {
 				var prefix = "logo://";
 				if(uuid && uuid.length > 0) {
	 				if(uuid.slice(0, prefix.length) == prefix) {
	 					var spec = uuid.slice(prefix.length);
	 					var idx = spec.indexOf('.');
	 					if(idx != -1) {
	 						spec = spec.slice(0, idx);
	 					}
	 					var arr = spec.split("_");

	 					if(arr.length > 1)
	 						$('#' + id + 'Shape').val(arr[1] == 'auto' ? 'autotype' : arr[1]);
	 					else
							$('#' + id + 'Shape').val('autotype');

	 					if(arr.length > 2) {
	 						var col = decodeURIComponent(arr[2]);
	 						if(col.slice(0, 1) == '#')
	 							col = col.slice(1);
	 						var colSource = col;
	 						if(colSource == 'auto') {
	 							colSource == 'autotype';
	 						}
	 						if(colSource != 'autoname' && colSource != 'autotype') {
	 							colSource = 'fixed'
	 						}
	 						else
	 							col = '#000000';
	 						$('#' + id + 'FixedColour').colorpicker('setValue', col);
							$('#' + id + 'ColourSource').val(colSource);
	 					}
	 					else {
							$('#' + id + 'ColourSource').val('autotype');
	 						$('#' + id + 'FixedColour').colorpicker('setValue', '#000000');
	 					}
	 					var src = $('#' + id + 'ColourSource').val();
	 	 				$('#' + id + 'FixedColour').colorpicker(src == 'autoname' || src == 'autotype' || options.disabled ? 'disable' : 'enable');

	 					if(arr.length > 3) {
	 						var txt = decodeURIComponent(arr[3]);
	 						var txtSource = txt;
	 						if(txtSource == 'auto' || txtSource == 'autoicon' || txtSource == 'autoname') {
		 						$('#' + id + 'Text').val('');
	 						}
	 						else {
	 							if(txt.slice(0, 4) == 'icon') {
		 							$('#' + id + 'Text').val('');
		 							txtSource = 'icon';
		 							icon.setValue(txt.slice(4));
	 							}
	 							else {
		 							txtSource = 'text';
		 							$('#' + id + 'Text').val(txt);
		 							icon.setValue('');
	 							}
	 						}
							$('#' + id + 'TextSource').val(txtSource);
	 					}
	 					else {
							$('#' + id + 'TextSource').val('auto');
	 						$('#' + id + 'Text').val('');
 							icon.setValue('');
	 					}
	 					var txtSrc = $('#' + id + 'TextSource').val();
	 	 				if(options.disable) {
	 	 	 				$('#' + id + 'Text').attr('disabled', 'disabled');
	 	 	 				icon.disable();
	 	 				}
	 	 				else if(txtSrc == 'text') {
	 	 	 				$('#' + id + 'Text').removeAttr('disabled');
	 	 	 				icon.disable();
	 	 				}
	 	 				else {
	 	 	 				$('#' + id + 'Text').attr('disabled', 'disabled');
	 	 	 				icon.enable();
	 	 				}
	 					$('#' + id + 'Generator').show();
 						$('#' + id + 'Separator').show();
	 					generated = true;
	 					rebuildPreview();
	 					_showOrHideTextFields();
	 				}
	 				else {
	 					var idx = uuid.indexOf('/');
	 					if(idx == -1) {
			 				getJSON('files/file/' + uuid, null, function(data){
			 					if(data.success) {
				 					if($('#' + id + 'Info').length){
				 						$('#' + id + 'Separator').hide();
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
	 					}
	 					else {
	 						// Path
	 						$('#' + id + 'Separator').hide();
	 						$('#' + id + 'RemoveButton').remove();
		 					$('#' + id + 'UpdateProgressHolder').hide();
	 						$('#' + id + 'Info').empty();
	 						$('#' + id + 'File').parent().append(
	 								'<div id="' + id + 'Info"></div>');
	 						$('#' + id + 'Info').data('uuid',uuid);
	 						$('#' + id + 'UploadButton').parent().append('<a class="btn btn-danger" id="' + id + 'RemoveButton"><i class="fa fa-trash"></i></a>');
	 						$('#' + id + 'RemoveButton').unbind('click');
	 						$('#' + id + 'RemoveButton').click(function(){
	 							callback.remove();
	 						});
	 						$('#' + id + 'Generator').hide();
		 					generated = false;
		 					rebuildPreview();
	 					}
	 				}
 				}
 				else {
 					_doClear();
 				}
 			},
 			clear: function() {
 				_doClear();
 			},
 			disable: function() {
 				$('#' + id + 'TextSource').attr('disabled', 'disabled');
 				$('#' + id + 'ColourSource').attr('disabled', 'disabled');
 				$('#' + id + 'FixedColour').colorpicker('disable');
 				$('#' + id + 'Shape').attr('disabled', 'disabled');
 				$('#' + id + 'Text').attr('disabled', 'disabled');
 				$('#' + id + 'File').attr('disabled', 'disabled');
 				$('#' + id + 'UploadButton').attr('disabled', 'disabled');
 				$('#' + id + 'RemoveButton').attr('disabled', 'disabled');
 				$('#' + id + 'DownloadButton').attr('disabled', 'disabled');
 				icon.disable();
 				options.disabled = true;
 			},
 			enable: function() {
 				$('#' + id + 'ColourSource').removeAttr('disabled');
 				var src = $('#' + id + 'ColourSource').val();
 				$('#' + id + 'FixedColour').colorpicker(src == 'autoname' || src == 'autotype' ? 'disable' : 'enable');
 				var txtSrc = $('#' + id + 'TextSource').val();
 				if(txtSrc == 'text') {
 	 				$('#' + id + 'Text').removeAttr('disabled');
 	 				icon.disable();
 				}
 				else {
 	 				$('#' + id + 'Text').attr('disabled', 'disabled');
 	 				icon.enable();
 				}
 				$('#' + id + 'Shape').removeAttr('disabled');
 				$('#' + id + 'TextSource').removeAttr('disabled');
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
		 		        		showSuccess(data.message);
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
	 		        		    showError(data.message);
	 		        			if(notify) {
	 		        				notify(false);
	 		        			}
	 		        		}
 		        		}
 		        	}
 		        }
 		        xhr.open("POST", options.url);
 		        xhr.setRequestHeader("X-Csrf-Token", getCsrfToken());
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
					$('#' + id + 'UploadButton').click(function(e){
						e.preventDefault();
						callback.upload();
					});
					if(options.disabled) {
						callback.disable();
					}
 				});

 				generated = true;
 				$('#' + id + 'Separator').show();
 				$('#' + id + 'Generator').show();
				_showOrHideTextFields();
 				rebuildPreview();
 			},
 			download: function(){
 				uuid = $('#' + id + 'Info').data('uuid');
 				window.location = basePath + '/api/files/download/' + uuid + '?token=' + getCsrfToken();
 			},
 			options: function() {
 				return options;
 			},
 			getInput: function() {
 				return $('#' + id);
 			}
 		};

	$('#' + id + 'UploadButton').click(function(e){
		e.preventDefault();
		callback.upload();
	});

	$('#' + id + 'File').change(function() {
		$(this).data('needsUpload', true);
		if(options.changed) {
			options.changed(callback);
		}
	});

	$('#' + id + 'Shape').change(function() {
		rebuildPreview();
		if(options.changed) {
			options.changed(callback);
		}
	});

	$('#' + id + 'TextSource').change(function() {
		rebuildPreview();
		_showOrHideTextFields();
		if(options.changed) {
			options.changed(callback);
		}
	});

	$('#' + id + 'ColourSource').change(function() {
		rebuildPreview();
		var src = $('#' + id + 'ColourSource').val();
		$('#' + id + 'FixedColour').colorpicker(src == 'autoname' || src == 'autotype' ? 'disable' : 'enable');
		if(options.changed) {
			options.changed(callback);
		}
	});

	var icon = $('#' + id + 'Icon').autoComplete({
		url : 'icons/list',
		valueAttr : 'name',
		nameIsResourceKey: false,
		changed: function(widget) {
			rebuildPreview();
		}
	});
	$('#' + id + 'Icon').hide();

	$('#' + id + 'Text').on('input', function(){
		rebuildPreview();
		if(options.changed) {
			options.changed(callback);
		}
	});
	$('#' + id + 'Text').hide();

	$('#' + id + 'FixedColour').colorpicker({
		format: 'hex'
	}).on('changeColor.colorpicker', function(event){
		rebuildPreview();
		if(options.changed) {
			options.changed(callback);
		}
	});;

 	if(options.value || options.value === '') {
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
				showEmptyRow: false,
				showUploadButton: true,
				showDownloadButton: true,
				showRemoveLine: true,
				useUUID: true,
				isArrayValue: true,
				showEmptyRow: false,
				automaticUpload: false,
				url: 'files/file'
			}, data);

	var id = checkElementHasId($(this)).attr('id') + "MultipleFileUpload";

	if(!rowNum){
		var rowNum = 0;
	}
	maxRows = options.maxRows;
	if(options.maxRows <= 0){
		maxRows = 10;
	}

	var html = 	'<div id="' + id + '" class="propertyItem form-group">'
			+	'	<div id="' + id + 'FileUploads"></div>'
			+	'	<div id="' + id + 'NewRow">'
			+	'		<div class="col-xs-12" style="padding-left: 0px; padding-right: 0px;">'
			+	'			<div class="propertyValue col-xs-8" style="padding-left: 0px;">'
			+	'				<span class="help-block">' + options.text + '</span>'
			+	'			</div>'
			+	'			<div class="propertyValue col-xs-4 dialogActions">';
	if(!options.disabled) {
			html +=	'				<a id="' + id + 'AddRow" href="#" class="btn btn-primary addButton">'
				+	'					<i class="fa fa-plus"></i>'
				+   '				</a>';
	}

	html +=	'			</div>'
	+	'		</div>'
	+	'	</div>'
	+	'</div>';


	$(this).append(html);

	$('#' + id + 'AddRow').click(function(e) {
		e.preventDefault();
		$('#' + id).parent().data('widget').addRows(1);
		return false;
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
 					if(value && value!=='') {
	 					callback.addRows(1);
	 					$('#' + id + 'FileUpload' + rowNum).data('widget').setValue(value);
 					}
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
 	 					useUUID: options.useUUID,
 	 					disabled: options.disabled,
 	 					showDownloadButton: options.showDownloadButton,
 	 					showUploadButton: options.showUploadButton,
 	 					automaticUpload: options.automaticUpload,
 	 					publicFile: options.publicFile
 	 				});
 	 				if(options.showRemoveLine && !options.disabled){
 	 					$('#' + id + 'FileUploads').find('.fileUpload').last().find('.fileUploadInput').find('a').before('<a href="#" class="btn btn-danger" id="' + id + 'RemoveButton' + rowNum + '"><i class="fa fa-minus"></i></a>');
 	 					$('#' + id + 'RemoveButton' + rowNum).click(function(e){
 	 						e.preventDefault();
 	 						$(this).closest('.fileUpload').remove();
 	 						$('#' + id + 'NewRow').show();
 	 						if(options.changed)
 	 							options.changed(callback);
 	 						return false;
 	 					});
 	 				}

 	 				if(maxRows != 0 && $('#' + id + 'FileUploads').children().length == maxRows){
 	 					$('#' + id + 'NewRow').hide();
 	 				}
 				}
 			},
 			addFile: function(blob) {
 				var widget = $('#' + id + 'FileUploads .fileUploadInput').last().widget();
 				widget.uploadBlob(blob);
 				this.addRows(1);
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
 			needsUpload: function() {
 				var needs = false;
 				$('#' + id).find('.fileUploadInput').each(function(){
 					if(!needs) {
 						needs = $(this).data('widget').needsUpload();
 					}
 				});
 				return needs;
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

 	if(options.showEmptyRow) {
		if($('#' + id + 'FileUploads').children().length == 0) {
			callback.addRows(1);
		}
	}

	if(options.disabled || options.readOnly) {
		callback.disable();
	}

	if(rowNum==0 && options.showEmptyRow) {
		callback.addRows(1);
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

$.fn.html5Upload = function(data) {
	var options = $.extend(
		{
			text: data.showFileInputLink == false ? getResource('dragAndDrop.text') : getResource('dragAndDrop.fileInput.text'),
			disabledText: getResource('dragAndDrop.disabledText'),
			maxFiles: 0,
			maxBytes: 0,
			useUUID: true,
			disabled: false,
			values: [],
			showFileInputLink: true,
			showCancel: true,
			showDownload: true,
			showRemove: true,
			showPercent: true,
			fadeBars: true,
			isArrayValue: true,
			url: basePath + '/api/fs/upload'
		}, data);
	var fileIndex = 0;
	var id = checkElementHasId($(this)).attr('id') + "FileDragAndDrop";
	var html = 	'<div id="' + id + 'Div" style="padding:20px;">'
			+	'	<div id="' + id + 'Area" class="fileDragAndDrop">'
			+	'		<span class="optionalField" id="' + id + 'ProgressText" hidden><i class="fa fa-spinner fa-spin" aria-hidden="true"></i>&nbsp;' + getResource('dragAndDrop.progresText') + '</span>'
			+	'		<span class="optionalField" id="' + id + 'StandByText">' + options.text + '</span>'
			+	'	</div>'
			+	'	<table id="' + id + 'List" class="dragAndDrop-table"></table>';
	if(options.showFileInputLink){
		html = html + '		<input type="file" id="' + id + 'FileInput" style="display: none;" multiple>'
	}
	html = html + '</div>';
	$(this).append(html);
	if(options.showFileInputLink){
		$('#' + id + 'Area a').click(function(){
			if(!options.disabled){
				$('#' + id + 'FileInput').click();
			}
		});
		$('#' + id + 'FileInput').change(function () {
		    callback.upload($(this)[0].files);
		});
	}

	var dropArea = $('#' + id + 'Area');
	dropArea.on('dragenter', function (e){
		e.stopPropagation();
	    e.preventDefault();
		if(!options.disabled){
		    $(this).addClass('fileDragAndDrop-hover');
		}
	});
	dropArea.on('dragover', function (e) {
		e.stopPropagation();
		e.preventDefault();
		if(!options.disabled){
			$(this).addClass('fileDragAndDrop-hover');
		}
	});
	dropArea.on('dragleave', function (e) {
		if(!options.disabled){
			$(this).removeClass('fileDragAndDrop-hover');
		}
	});
	dropArea.on('drop', function (e){
		e.preventDefault();
		var files = e.originalEvent.dataTransfer.files;
		callback.upload(files);
		if(!options.disabled){
			$(this).removeClass('fileDragAndDrop-hover');
		}
	});

	var getFileSize = function(fileSize) {
		if(fileSize > 1024 * 1024){
			fileSize = (Math.round((fileSize / (1024 * 1024)) * 100)/100).toFixed(0) + ' MB';
		} else if(fileSize > 1024){
			fileSize = (Math.round((fileSize / 1024) * 100)/100).toFixed(0) + ' KB';
		} else{
			fileSize = parseFloat(fileSize).toFixed(0) + ' B';
		}
		return fileSize;
	}

	var drawRow = function(fileName, fileSize, uuid){
		fileSize = getFileSize(fileSize);

		var fileRow =
					'<tr id="' + id + 'ListElementDiv_' + fileIndex + '" style="height:40px;" class="' + id + 'ListEventDiv">'
				+	'	<td class="dragAndDrop-info dragAndDrop-name">'
				+	'		<span class="optionalField">' + fileName + '</span>'
				+	'	</td>'
				+	'	<td class="dragAndDrop-info dragAndDrop-size">'
				+	'		<span class="optionalField" id="' + id + 'UpdateSize_' + fileIndex + '">0B of ' + fileSize + '</span>'
				+	'	</td>'
				+	'	<td class="dragAndDrop-progress">'
				+	'		<div class="progress">'
				+	'			<div id="' + id + 'UpdateProgress_' + fileIndex + '" class="progress-bar" role="progressbar"></div>'
				+	'		</div>'
				+	'	</td>'
				+	'	<td>'
				+	'		<div id="' + id + 'Buttons_' + fileIndex + '">';
		if(options.showCancel){
			fileRow = fileRow +
					'			<a class="btn btn-danger dragAndDrop-cancel" href="#" id="' + id + 'Cancel_' + fileIndex + '"><i class="fa fa-ban"></i></a>';
		}
		if(options.showDownload){
			fileRow = fileRow +
					'			<a class="btn btn-primary dragAndDrop-download" href="#" id="' + id + 'Download_' + fileIndex + '" disabled="disabled"><i class="fa fa-download"></i></a>';
		}
		if(options.showRemove){
			fileRow = fileRow +
					'			<a class="btn btn-danger dragAndDrop-remove" href="#" id="' + id + 'Remove_' + fileIndex + '" disabled="disabled"><i class="fa fa-trash-o"></i></a>';
		}
		fileRow = fileRow
				+	'		</div>'
				+	'	</td>'
				+	'</tr>';
		$('#' + id + 'List').append(fileRow);
		$('#' + id + 'Buttons_' + fileIndex).css('width', ($('#' + id + 'Buttons_' + fileIndex).find('a').length * 50) + 'px');
		$('#' + id + 'ListElementDiv_' + fileIndex).data('fileIndex', fileIndex);
		$('#' + id + 'ListElementDiv_' + fileIndex).data('finished', false);
		if(uuid){
			$('#' + id + 'ListElementDiv_' + fileIndex).data('uuid', uuid);
			$('#' + id + 'ListElementDiv_' + fileIndex).data('finished', true);
			if(options.showCancel){
        		$('#' + id + 'Cancel_' + fileIndex).attr('disabled', 'disabled');
        	}
        	if(options.showDownload){
        		$('#' + id + 'Download_' + fileIndex).removeAttr('disabled');
        		$('#' + id + 'Download_' + fileIndex).click(function(){
        			callback.download(fileIndex);
        		});
        	}
        	if(options.showRemove){
        		$('#' + id + 'Remove_' + fileIndex).removeAttr('disabled');
        		$('#' + id + 'Remove_' + fileIndex).click(function(){
        			callback.remove(fileIndex);
        		});
        	}
        	$('#' + id + 'UpdateProgress_' + fileIndex).css("width",  100 + "%");
			if(options.showPercent){
				$('#' + id + 'UpdateProgress_' + fileIndex).html(100 + '%');
			}
		}
		fileIndex++;
	}

	var checkUploadsFinished = function(){
		var uploadsFinished = true;
      	$('.' + id + 'ListEventDiv').each(function(){
      		if(!$(this).data('finished')){
      			uploadsFinished = false;
      			return false;
      		}
      	});
      	if(uploadsFinished){
      		$('#' + id + 'ProgressText').hide();
      	}
	}

	var callback = {
 			getValue: function() {
 				values = [];
 				if(!$('#' + id + 'List').find('tr').length){
 					return '';
 				}
 				$('#' + id + 'List').find('tr').each(function(){
 					values.push($(this).data('uuid'));
 				});
 				return values;
 			},

 			setValue: function(val) {
 				if(!(val instanceof Array)){
 					val = [val];
 				}
 				$.each(val, function(index, uuid){
 					getJSON('files/file/' + uuid, null, function(data){
 	 					if(data.success) {
 	 						drawRow(data.resource.fileName, data.resource.fileSize, options.useUUID ? data.resource.name : data.resource.id);
 	 					}
 	 				});
 				});
 			},

 			disable: function() {
 				$('#' + id + 'List').find('a').each(function(){
 					$(this).attr('disabled', 'disabled');
 				});
 				$('#' + id + 'Area').addClass('dragAndDrop-backrgound-disabled');
// 				$('#' + id + 'StandByText').html(options.disabledText);
 				options.disabled = true;
 			},
 			enable: function() {
 				$('#' + id + 'List').find('tr').each(function(){
 					if($(this).data('uuid')){
 						$(this).find('a.dragAndDrop-cancel').attr('disabled', 'disabled');
 						$(this).find('a.dragAndDrop-download').removeAttr('disabled');
 						$(this).find('a.dragAndDrop-remove').removeAttr('disabled');
 					}else{
 						$(this).find('a.dragAndDrop-cancel').removeAttr('disabled');
 						$(this).find('a.dragAndDrop-download').attr('disabled', 'disabled');
 						$(this).find('a.dragAndDrop-remove').attr('disabled', 'disabled');
 					}
 				});
 				$('#' + id + 'Area').removeClass('dragAndDrop-backrgound-disabled');
// 				$('#' + id + 'StandByText').html(options.text);
 				options.disabled = false;
 			},
			cancel: function(index, jqXHR){
				jqXHR.abort();
				$('#' + id + 'ListElementDiv_' + index).remove();
			},
 			clear: function() {
 				$('#' + id + 'List').find('tr').each(function(index, file){
 					$('#' + id + 'ListElementDiv_' + $(this).data('fileIndex')).remove();
 				});
 			},
 			upload: function(files){
 				if(!options.disabled){

 	 				if(!files instanceof Array){
 	 					files = [files];
 	 				}
 	 				var uploadedFileNum = $('#' + id + 'List').find('.progress').length;
 	 				$.each(files, function(index, file){
 	 					if(options.maxFiles > 0 && $('#' + id + 'List').find('.progress').length >= options.maxFiles){
 	 	 					showError(getResource('dragAndDrop.maxFileNum.error').replace('{0}', options.maxFiles));
 	 	 					return;
 	 	 				}

 	 					if(options.maxBytes > 0 && file.size > options.maxBytes){
 	 	 					showError(getResource('dragAndDrop.maxBytes.error').replace('{0}', options.maxBytes));
 	 	 					return;
 	 	 				}
 	 					var formData = new FormData();
 	 					formData.append('file', files[index]);
 	 					var progressFileIndex = fileIndex;

 	 					drawRow(file.name, file.size);
 	 					$('#' + id + 'ProgressText').show();
 	 				    var jqXHR=doAjax({
 	 				    	xhr: function() {
 	 				    		var xhrobj = $.ajaxSettings.xhr();
 	 				    		if (xhrobj.upload) {
 	 				    			xhrobj.upload.addEventListener('progress', function(event) {
 	 				    				var percent = 0;
 	 				    				var position = event.loaded || event.position;
 	 				    				var total = event.total;
 	 				    				if (event.lengthComputable) {
 	 				    					percent = Math.ceil(position / total * 100);
 	 				    				}
 	 				    				$('#' + id + 'UpdateProgress_' + progressFileIndex).css("width", percent + "%");
 	 				    				if(options.showPercent){
 	 				    					$('#' + id + 'UpdateProgress_' + progressFileIndex).html(percent + '%');
 	 				    				}
 	 				    				$('#' + id + 'UpdateSize_' + progressFileIndex).text(getFileSize(position) + ' of ' + getFileSize(total));
 	 				    			}, false);
 	 				    		}
 	 				            return xhrobj;
 	 				        },
 	 				        url: options.url,
 	 				        type: "POST",
 	 				        contentType:false,
 	 				        processData: false,
 	 				        cache: false,
 	 				        data: formData,
 	 				        success: function(data){
 	 				        	$('#' + id + 'ListElementDiv_' + progressFileIndex).data('finished', true);
 	 				        	checkUploadsFinished();
 	 				        	if(!data.success) {
 	 				        		if(data.message && data.message != null && data.message != ''){
 	 				        			$('#' + id + 'UpdateProgress_' + progressFileIndex).parent().hide().parent().append('<span>' + getResource('dragAndDrop.uploadError') + '&nbsp;' + data.message + '</span>');
 	 				        		}else{
 	 				        			$('#' + id + 'UpdateProgress_' + progressFileIndex).parent().hide().parent().append('<span>' + getResource('dragAndDrop.uploadError') + '&nbsp;' + getResource('dragAndDrop.genericError').replace('{0}', file.name) + '</span>');
 	 				        		}
 	 				        		$('#' + id + 'UpdateProgress_' + progressFileIndex).parent().parent().append('<button id="' + id + 'CloseUpdateProgress_' + progressFileIndex + '" type="button" class="close" aria-hidden="true">&times;</button>');
 	 				        		$('#' + id + 'CloseUpdateProgress_' + progressFileIndex).click(function(){
 	 				        			$('#' + id + 'ListElementDiv_' + progressFileIndex).fadeTo(1000 , 0, function() {
 	 	 				        			$('#' + id + 'ListElementDiv_' + progressFileIndex).remove();
 	 	 	 							});
 	 				        		});
 				    				if(options.showPercent){
 				    					$('#' + id + 'UpdateProgress_' + progressFileIndex).html('');
 				    				}
 	 				        		return;
 	 				        	}

 	 				        	if(options.useUUID)
 	 				        		$('#' + id + 'ListElementDiv_' + progressFileIndex).data('uuid', data.resource.name);
 	 				        	else
 	 				        		$('#' + id + 'ListElementDiv_' + progressFileIndex).data('uuid', data.resource.id);
 	 				            if(options.showCancel){
 	 				        		$('#' + id + 'Cancel_' + progressFileIndex).attr('disabled', 'disabled');
 	 				        	}
 	 				        	if(options.showDownload){
 	 				        		$('#' + id + 'Download_' + progressFileIndex).removeAttr('disabled');
 	 				        		$('#' + id + 'Download_' + progressFileIndex).click(function(){
 	 				        			callback.download(progressFileIndex);
 	 				        		});
 	 				        	}
 	 				        	if(options.showRemove){
 	 				        		$('#' + id + 'Remove_' + progressFileIndex).removeAttr('disabled');
 	 				        		$('#' + id + 'Remove_' + progressFileIndex).click(function(){
 	 				        			callback.remove(progressFileIndex);
 	 				        		});
 	 				        	}
 	 				        	if(options.uploadCallback){
 	 				        		options.uploadCallback(data);
 	 				        	}
 	 				        	if(options.fadeBars){
 	 				        		setTimeout(function() {
 	 				        			$('#' + id + 'ListElementDiv_' + progressFileIndex).fadeTo(2000 , 0, function() {
 	 	 				        			$('#' + id + 'ListElementDiv_' + progressFileIndex).remove();
 	 	 	 							});
	 	 				  			}, 3000);
 	 				        	}
 	 				        },
 	 				        error: function(jqXHR, textStatus, errorThrown) {
 	 				        	$('#' + id + 'ListElementDiv_' + progressFileIndex).data('finished', true);
 	 				        	checkUploadsFinished();
			    				if(jqXHR.status == 401){
			    					$('#' + id + 'UpdateProgress_' + progressFileIndex).parent().hide().parent().append('<span>' + getResource('dragAndDrop.uploadError') + '&nbsp;' + getResource('dragAndDrop.unauthorisedError').replace('{0}', file.name) + '</span>');
			    				}else if(jqXHR.status == 500){
			    					$('#' + id + 'UpdateProgress_' + progressFileIndex).parent().hide().parent().append('<span>' + getResource('dragAndDrop.uploadError') + '&nbsp;' + getResource('dragAndDrop.serverError').replace('{0}', file.name) + '</span>');
			    				}else if(jqXHR.statusText == 'abort'){
			    					$('#' + id + 'UpdateProgress_' + progressFileIndex).parent().hide().parent().append('<span>' + getResource('dragAndDrop.uploadError') + '&nbsp;' + getResource('dragAndDrop.uploadCanceled') + '</span>');
			    				}else{
			    					$('#' + id + 'UpdateProgress_' + progressFileIndex).parent().hide().parent().append('<span>' + getResource('dragAndDrop.uploadError') + '&nbsp;' + getResource('dragAndDrop.genericError').replace('{0}', file.name) + '</span>');
			    				}
			    				$('#' + id + 'UpdateProgress_' + progressFileIndex).parent().parent().append('<button id="' + id + 'CloseUpdateProgress_' + progressFileIndex + '" type="button" class="close" aria-hidden="true">&times;</button>');
 				        		$('#' + id + 'CloseUpdateProgress_' + progressFileIndex).click(function(){
 				        			$('#' + id + 'ListElementDiv_' + progressFileIndex).fadeTo(1000 , 0, function() {
 	 				        			$('#' + id + 'ListElementDiv_' + progressFileIndex).remove();
 	 	 							});
 				        		});
 	 				        }
 	 				    });
 	 				    $('#' + id + 'Cancel_' + progressFileIndex).click(function(){
 	 				    	callback.cancel(progressFileIndex, jqXHR);
 						});
 	 				});
 				}

 			},
 			download: function(index){
 				var uuid = $('#' + id + 'ListElementDiv_' + index).data('uuid');
 				window.location = basePath + '/api/files/download/' + uuid + '?token=' + getCsrfToken();
 				//window.location = basePath + '/api/fs/download/' + uuid;
 			},
 			remove: function(index) {
 				if(!$('#' + id + 'List').length){
 					return;
 				}
 				if($('#' + id + 'ListElementDiv_' + index).data('uuid')){
 					var uuid = $('#' + id + 'ListElementDiv_' + index).data('uuid');
 	 				deleteJSON(options.url + '/' + uuid, null, function(data){
 	 					$('#' + id + 'ListElementDiv_' + index).remove();
 	 				});
 				} else{
 					$('#' + id + 'ListElementDiv_' + index).remove();
 				}
 			},
 			options: function() {
 				return options;
 			},
 			setOptions: function(newOptions){
 				options = $.extend(options, newOptions);
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

$.fn.wizardPage = function(data) {

	var options = $.extend(
			{
				allowReset: true,
				allowBack: false
			}, data);


	if(options.allowReset) {
		$(this).append('<div class="propertyItem form-group buttonBar">' +
						'<a id="resetForm" href="#" localize="text.reset"></a>' +
					'</div>');
	}

	$(this).append('<div id="wizardPages" class="panel-group" id="accordion" role="tablist" aria-multiselectable="false"></div>');

	$.each(options.steps, function(index, obj) {

			var page = $.extend({
				titleText: getResource('text.step') + '. ' + (index+1),
				titleIcon: 'fa-flash',
				buttonText: 'text.next',
				buttonIcon: 'fa-forward'
			}, obj);


			var html;

			if(options.useNumberIcons) {

				html = '<div id="panel' + index + '" class="panel panel-default wizardPage" style="display: none">'
				+ '<div class="panel-heading" role="tab" id="heading' + index + '">'
				+ ' 	<h5 class="panel-title wizardTitle"><span class="fa-stack"><i class="fa fa-circle fa-stack-2x"></i>'
				+ '<i class="fa fa-stack-1x" style="color: white"><strong>' + (index+1) + '</strong></i></span>'
				+ '		    <a data-toggle="collapse" data-parent="#accordion"'
				+ '				href="#collapse' + index + '" aria-expanded="' + (index > 0 ? "false" : "true") + '"'
				+ '				aria-controls="collapse' + index + '" >' + getResourceOrText(page.titleText) + '</a>'
				+ '	    </h5>'
				+ '</div>'
				+ '<div id="collapse' + index + '" class="panel-collapse collapse' + (index == 0 ? ' in' : '') + '"'
				+ '	role="tabpanel" aria-labelledby="heading' + index + '">'
				+ '	<div class="panel-body"><div id="page' + index + '"></div>';

			} else {
				html = '<div id="panel' + index + '" class="panel panel-default wizardPage" style="display: none">'
					+ '<div class="panel-heading" role="tab" id="heading' + index + '">'
					+ ' 	<h4 class="panel-title wizardTitle"><i class="fa ' + page.titleIcon + '"></i>&nbsp;'
					+ '		    <a data-toggle="collapse" data-parent="#accordion"'
					+ '				href="#collapse' + index + '" aria-expanded="' + (index > 0 ? "false" : "true") + '"'
					+ '				aria-controls="collapse' + index + '" >' + getResourceOrText(page.titleText) + '</a>'
					+ '	    </h4>'
					+ '</div>'
					+ '<div id="collapse' + index + '" class="panel-collapse collapse' + (index == 0 ? ' in' : '') + '"'
					+ '	role="tabpanel" aria-labelledby="heading' + index + '">'
					+ '	<div class="panel-body"><div id="page' + index + '"></div>';
			}

			if(page.onNext) {
				html += '		<div class="propertyItem form-group buttonBar">';
				if(index > 0) {
					html += '			<button id="backButton' + index + '" class="backButton pageState' + index + ' btn btn-danger">'
					+ '				<i class="fa fa-step-backward"></i><span localize="text.back"></span>'
					+ '			</button>&nbsp';
				}
				html += '			<button id="button' + index + '" class="nextButton pageState' + index + ' btn btn-primary">'
					+ '				<i class="fa ' + page.buttonIcon + '"></i><span localize="' + page.buttonText + '"></span>'
					+ '			</button>'
					+ '		</div>';
			}

			html += '</div>'
				+ '</div>'
				+ '</div>';

			$('#wizardPages').append(html);
			$('#panel' + index).data('page', page);
			$('#panel' + index).data('index', index);

			$('#' + page.pageDiv).detach().appendTo('#page' + index).show();

		});

		$('.wizardPage').first().show();

		$(this).localize();

		$('.backButton').click(function() {

			$('.wizardError').remove();
			var page = $(this).closest('.panel').data('page');
			var idx = $(this).closest('.panel').data('index');

			var previousPage = idx - 1;
			$('.pageState' + idx).attr('disabled', true);

			var previousPageW = $('#panel' + previousPage).data('page');

			var doShow = function() {
				$('.pageState' + previousPage).attr('disabled', false);
				$('.pageState' + idx).attr('disabled', false);
				$('#button' + previousPage).attr('disabled', false);
				$('#panel' + previousPage).show();
				$('#panel' + idx).hide();
				$('#collapse' + idx).collapse('hide');
				$('#collapse' + previousPage).collapse('show');
			};
			if(previousPageW.onShow) {
				if(previousPageW.onShow(doShow)) {
					doShow();
				};
			} else {
				doShow();
			}
		});

		$('.nextButton').click(function() {

			if(options.pageDone) {
				options.done();
				return;
			}
			var page = $(this).closest('.panel').data('page');
			var idx = $(this).closest('.panel').data('index');

			if(page.onNext) {
				var clicked = false;
				startSpin($('#button' + idx).find('i'), page.buttonIcon);

				var onError = function(val) {
					$('.wizardError').remove();
					$('#page' + idx).prepend('<div class="wizardError alert alert-danger"><i class="fa fa-warning"></i> <span>' + val + '</span></p>')
				};

				page.onNext(function() {

					if(clicked) {
						return;
					}

					clicked = true;

					if(options.steps.length > idx + 1) {
						stopSpin($('#button' + idx).find('i'), page.buttonIcon);
						var nextPage = idx + 1;
						$('.pageState' + idx).attr('disabled', true);

						var nextPageW = $('#panel' + nextPage).data('page');

						var doShow = function() {
							$('#panel' + nextPage).show();
							$('#collapse' + idx).collapse('hide');
							$('#collapse' + nextPage).collapse('show');
						};
						if(nextPageW.onShow) {
							if(nextPageW.onShow(doShow)) {
								doShow();
							};
						} else {
							doShow();
						}


					} else {
						stopSpin($('#button' + idx).find('i'), options.doneIcon);

						if(options.done) {
							options.pageDone = true;
							$('#button' + idx).find('span').text(getResource(options.doneText));
						} else {
							$('#button' + idx).attr('disabled', true);
						}

						$('.backButton').attr('disabled', true);
						if(options.hideResetOnComplete) {
							$('#resetForm').hide();
						}
					}
				}, function() {
					stopSpin($('#button' + idx).find('i'), page.buttonIcon);
				}, onError);
			}

		});

		$('#resetForm').click(function() {

		$.each(options.steps, function(idx, obj) {
			$('.pageState' + idx).attr('disabled', false);
			if(obj.onReset) {
				obj.onReset();
			}
		});

		$('.nextButton').attr('disabled', false);

		$('#wizardPages .panel').hide();
		$('#wizardPages .collapse').collapse('hide');

		$('#wizardPages .panel').first().show();
		$('#wizardPages .collapse').first().removeAttr('style');
		$('#wizardPages .collapse').first().collapse('show');


	});

	if(options.complete) {
		options.complete();
	}
	
	return {
		reset: function() {
				$.each(options.steps, function(idx, obj) {
				$('.pageState' + idx).attr('disabled', false);
				if(obj.onReset) {
					obj.onReset();
				}
			});

			$('.nextButton').attr('disabled', false);
	
			$('.panel:gt(0)').hide();
			$('.collapse:gt(0)').collapse('hide');
	
			$('.panel').first().show();
			$('.collapse').first().collapse('show');
		},
		showError: function(str) {

		}
	}
}

$.fn.textAndSelect = function(data) {

	var options = $.extend({
		selectValue: '',
		textValue: '',
		valueTemplate: '{0}={1}'
	}, data);

	var selectOptions = {
		nameAttr: options.nameAttr,
		valueAttr: options.valueAttr,
		nameIsResourceKey : options.nameIsResourceKey,
		resourceKeyTemplate: '{0}',
		disabled : options.disabled,
		notSetResourceKey: 'text.notSet',
		getUrlData: options.getUrlData,
		options: data.selectOptions,
		value: data.selectValue
	};

	var textOptions = {
		value: data.textValue,
		disabled: false
	};

	var textId = checkElementHasId($(this)).attr('id') + 'Text';
	var selectId = $(this).attr('id') + 'Select';

	$(this).append('<div class="propertyItem form-group">' +
			'<div class="row"><div class="col-xs-6" id="' + textId + '"></div><div class="col-xs-6" id="' +  selectId + '"></div></div>');

	var textInput = $('#' + textId).textInput(textOptions);

	var selectInput = $('#' + selectId).selectButton(selectOptions);

	var callback = {
			setValue: function(val) {

			},
			getValue: function() {
				return options.valueTemplate.format(
						encodeURIComponent(textInput.getValue()),
						encodeURIComponent(selectInput.getValue()));
			},
			reset: function() {
				textInput.setValue(textOptions.textValue);
				selectInput.setValue(selectOptions.selectValue);
			},
			disable: function() {
				textInput.disable();
				selectInput.disable();
			},
			enable: function() {
				textInput.enable();
				selectInput.enable();
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + textId);
			},
			clear: function() {
				textInput.clear();
				textInput.clear();
			}
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

$.fn.feedbackPanel = function(data) {

	var options = $.extend({
	}, data);

	var div = $(this);
	div.empty();

	var processFeedback = function(feedback) {
		var last;

		$('#feedbackNext').remove();
		$.each(feedback, function(idx, result) {
			last = result;
			var id = checkElementHasId(div).attr('id') + "f" + idx;
			if($('#' + id).length > 0) {
				return;
			}
			if($('#' + id).length) {
				$('#' + id).remove();
			}
			if(result.status === 'CONFIRM') {
				bootbox.confirm({
				    message: result.error.format(result.args),
				    buttons: {
				        confirm: {
				            label: getResource(result.options.confirmationButtonSuccess ? result.options.confirmationButtonSuccess : 'text.yes'),
				            className: 'btn-success'
				        },
				        cancel: {
				            label: getResource(result.options.confirmationButtonCancel ? result.options.confirmationButtonCancel : 'text.no'),
				            className: 'btn-danger'
				        }
				    },
				    callback: function (cbresult) {
				    	if(options.confirmed) {
			        		options.confirmed(cbresult, result);
				    	}
				    }
				});
			}
			else if(result.status === 'SUCCESS') {
				div.append('<div id="' + id + '" class="lb-row feedback-row">'
				 + '<div class="col-xs-12 feedback-success"><i class="fa fa-check-circle"></i>&nbsp;&nbsp;<span>' + getResource(result.resourceKey).format(result.args) + '</span></div></div>');
			} else if(result.status === 'INFO') {
				div.append('<div id="' + id + '" class="lb-row feedback-row">'
						 + '<div class="col-xs-12 feedback-info"><i class="fa fa-info-circle"></i>&nbsp;&nbsp;<span>' + getResource(result.resourceKey).format(result.args) + '</span></div></div>');
			} else if(result.status === 'WARNING') {
				div.append('<div id="' + id + '" class="lb-row feedback-row">'
						 + '<div class="col-xs-12 feedback-warning"><i class="fa fa-warning"></i>&nbsp;&nbsp;<span>' + getResource(result.resourceKey).format(result.args) + '</span></div></div>');
			} else {
				div.append('<div id="' + id + '" class="lb-row feedback-row">'
						 + '<div class="col-xs-12 feedback-error"><i class="fa fa-times-circle"></i>&nbsp;&nbsp;<span>' + getResource(result.resourceKey).format(result.args) + '</span>'
						 + '</div></div>');
			}
		});
		
		if(last && last.status === 'CONFIRM')
			return true;

		var ret = last && last.finished;
		if(ret) {
			if(options.finished) {
				options.finished(last.status === 'SUCCESS');
			}
		} else {
			div.append('<div id="feedbackNext" class="row feedback-row">'
					 + '<div class="col-xs-12"><i class="fa fa-spinner fa-spin"></i></div></div>');
		}
		return ret;
	}

	doAjax({
		method: 'post',
		url: basePath + '/api/' + options.startUrl,
		data: options.startParameters ? $.param(options.startParameters) : null,
		dataType: 'json',
		success: function(data) {
			if(!data.success) {
				showError(data.message);
			} else {
				processFeedback(data.resource.feedback);
				var updateFunc = function() {
					getJSON(options.progressUrl + "/" + data.resource.uuid, null, function(data) {
						if(!data.success) {
							showError(data.message);
							if(options.onError) {
								options.onError();
							}
						} else {
							if(!processFeedback(data.resource.feedback)) {
								setTimeout(updateFunc, 500);
							}

						}
					});
				}

				setTimeout(updateFunc, 500);
			}
		}
	});
};

$.fn.accordionPage = function(data) {

	var options = $.extend(
			{
				open: true,
				openOne: true,
				closeable: true
			}, data);

	var id = checkElementHasId($(this)).attr('id') + "AccordionPage";
	$(this).append('<div id="' + id + '" class="panel-group" role="tablist" aria-multiselectable="false"></div>');

	$.each(options.steps, function(index, obj) {

		var page = $.extend({
			titleText: getResource('text.step') + '. ' + (index+1),
			titleIcon: 'fa-flash'
		}, obj);

		var parent = '#' + id + 'Panel' + index;
		if(options.openOne){
			var parent = '#' + id;
		}
		var html =
				'<div id="' + id + 'Panel' + index + '" class="accordion-group panel panel-default wizardPage">'
			+	'	<div class="panel-heading accordion-header" role="tab" id="' + id + 'Heading' + index + '">'
			+	' 		<h4 class="panel-title wizardTitle">'
			+	'			<i class="fa ' + page.titleIcon + '"></i>&nbsp;'
			+	'		    <span>' + getResourceOrText(page.titleText) + '</span>'
			+ 	'	    </h4>'
			+ 	'	</div>'
			+ 	'	<div id="' + id + 'Collapse' + index + '" class="panel-collapse collapse' + ((options.open && index == 0) ? ' in' : '') + '"'
			+ 	'		role="tabpanel">'
			+ 	'		<div class="panel-body">'
			+	'			<div id="' + id + 'Page' + index + '"></div>'
			+	'		</div>'
			+ 	'	</div>'
			+ 	'</div>';
		$('#' + id).append(html);
		$('#' + id + 'Panel' + index).data('page', page);
		$('#' + id + 'Panel' + index).data('index', index);
		$('#' + id + 'Heading' + index).click(function(){
			if($('#' + id + 'Collapse' + index + ':hidden').length){
				if(options.openOne){
					$('#' + id).find('.panel-collapse:visible').animate({
						  height: "toggle",
						  opacity: "toggle"
						}, "fast" );
				}
				$('#' + id + 'Collapse' + index).animate({
					  height: "toggle",
					  opacity: "toggle"
					}, "fast" );
			}else if(options.closeable){
				$('#' + id + 'Collapse' + index).animate({
					  height: "toggle",
					  opacity: "toggle"
					}, "fast" );
			}
		});
		$('#' + page.pageDiv).detach().appendTo('#' + id + 'Page' + index).show();

	});
}

$.fn.multipleRows = function(data) {

	var options = $.extend(
			{
				maxRows: 0,
				count: 0,
				showAdd: true,
				isArrayValue: true,
				render: function(element, value) {
					element.textInput({ }).setValue(value);
				},
				generateValue: function(element) {
					return element.widget().getValue();
				},
				enable: function(element) {
					element.widget().enable();
				},
				disable: function(element) {
					element.widget().disable();
				},
				clear: function(element) {
					element.widget().clear();
				}
			}, data);

	var id = checkElementHasId($(this)).attr('id') + "Multiple";

	var html = 	'<div id="' + id + '" class="propertyItem form-group">'
	+	'	<div class="col-xs-11" id="' + id + 'Header"></div>'
	+	'	<div class="col-xs-1"></div>'
	+   '   </div>'
	+	'	<div id="' + id + 'Rows" ></div>'
	+	'	<div id="' + id + 'NewRow">'
	+	'		<div class="propertyValue col-xs-11">'
	+	'			<span class="help-block">&nbsp;</span>'
	+	'		</div>'
	+	'		<div class="propertyValue col-xs-1">'
	+	'			<a id="' + id + 'AddRow" href="#" class="btn btn-info addButton">'
	+	'				<i class="fa fa-plus"></i>'
	+	'			</a>'
	+	'		</div>'
	+	'   </div>';

	$(this).append(html);

	if(options.renderHeader) {
		options.renderHeader($('#' + id + 'Header'));
	}

	if(!options.showAdd) {
		$('#' + id + 'NewRow').hide();
	}

	var addRow = function(val) {

		var elementId = id + options.count++;
		$('#' + id + 'Rows').append(
				 '    <div class="rowParent">'
				+ '       <div id="' + elementId  + '" class="rowInput col-xs-11">'
				+ '       </div>'
				+ '       <div class="col-xs-1">'
				+	'		<a href="#" class="btn btn-danger delButton">'
				+	'			<i class="fa fa-minus"></i>'
				+	'		</a>'
				+ '       </div></div>');

		options.render($('#' + id + 'Rows').find('.rowInput').last(), val);

		$('.delButton').off('click');
		$('.delButton').on('click', function(e) {
			e.preventDefault();
			$(this).closest('.rowParent').remove();
			if(options.showAdd) {
				$('#' + id + 'NewRow').show();
			}
		});

		if(options.maxRows != 0 && $('#' + id + 'Rows').children().length == options.maxRows) {
			$('#' + id + 'NewRow').hide();
		}
	};

	$('#' + id + 'AddRow').click(function(e) {
		e.preventDefault();
		addRow();
	});


	var callback = {
			setValue: function(val) {
				$('#' + id + 'Rows').children().remove();
				$.each(val, function(idx, v) {
					addRow(v);
				});
			},
			getValue: function() {
				var res = [];
				$('#' + id + 'Rows .rowInput').each(function(idx, row) {
					res.push(options.generateValue($(this)));
				});

				return res;
			},
			reset: function() {
				$('#' + id + 'Rows').children().remove();
				$('#' + id + 'NewRow').show();
			},
			disable: function() {
				$('#' + id + 'Rows').children().each(function(idx, row) {
					options.disable($(row).find('.widget').first());
				});
			},
			enable: function() {
				$('#' + id + 'Rows').children().each(function(idx, row) {
					options.enable($(row).find('.widget').first());
				});
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return $('#' + id);
			},
			clear: function() {
				$('#' + id + 'Rows').children().each(function(idx, row) {
					options.clear($(row).find('.widget').first());
				});
			}
	}

	if(options.value) {
		callback.setValue(splitFix(options.value));
	}
	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

$.fn.roles = function(data) {
	var options = $.extend({}, data);
	var divId = checkElementHasId($(this)).attr('id');
	var roleDivId = "roles" + divId;

	var widgetConfig = {
			url: 'roles/table',
			isNamePairValue: false,
			selectedIsObjectList : true,
			resourceKey : options.resourceKey,
			disabled: options.disabled
		}

	if(!$('#' + roleDivId).data('created')) {
		var div = '<div class="propertyItem form-group">' +
			'<div>' +
				'<label class="col-md-3 control-label optionalField">' + getResource('roles.label') + '</label>' +
				'<div class="propertyValue col-md-9">' +
					'<div id="' + roleDivId + '" class="roles"></div>' +
				'<span class="help-block">' + getResource('roles.info') + '</span>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="propertyItem form-group">' +
			'<div>' +
				'<label class="col-md-3 control-label optionalField">' + getResource('users.label') + '</label>' +
				'<div class="propertyValue col-md-9">' +
					'<div id="' + roleDivId + 'Users" class="users"></div>' +
				'<span class="help-block">' + getResource('users.info') + '</span>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="propertyItem form-group">' +
			'<div>' +
				'<label class="col-md-3 control-label optionalField">' + getResource('groups.label') + '</label>' +
				'<div class="propertyValue col-md-9">' +
					'<div id="' + roleDivId + 'Groups" class="groups"></div>' +
				'<span class="help-block">' + getResource('groups.info') + '</span>' +
				'</div>' +
			'</div>' +
		'</div>';
		$(this).append(div);

		$('#' + roleDivId).multipleSearchInput(widgetConfig);
		$('#' + roleDivId + 'Users').multipleSearchInput({
			url: 'currentRealm/users/table',
			isNamePairValue: false,
			selectedIsObjectList : true,
			disabled: options.disabled,
			nameAttr: 'principalName'
		});
		$('#' + roleDivId + 'Groups').multipleSearchInput({
			url: 'currentRealm/groups/table',
			isNamePairValue: false,
			selectedIsObjectList : true,
			disabled: options.disabled,
			nameAttr: 'principalName'
		});
	}

	if(options.selected) {
		widgetConfig.selected = options.selected;
		$('#' + roleDivId).multipleSearchInput(widgetConfig);
	}

	var roleCallback = $('#' + roleDivId).widget();
	var userCallback = $('#' + roleDivId + 'Users').widget();
	var groupsCallback = $('#' + roleDivId + 'Groups').widget();

	var callback = {
			setValue: function(val) {
				var roles = [];
				var groups = [];
				var users = [];

				$.each(val, function(idx, obj) {
					if(obj.type === 'USER') {
						users.push(obj);
					} else if(obj.type === 'GROUP') {
						groups.push(obj);
					} else {
						roles.push(obj);
					}
				});

				roleCallback.setValue(roles);
				userCallback.setValue(users);
				groupsCallback.setValue(groups);
			},
			getValue: function() {
				var res  = [];
				res = res.concat(roleCallback.getValue());
				res = res.concat(userCallback.getValue());
				res = res.concat(groupsCallback.getValue());
				return res;
			},
			reset: function() {
				roleCallback.reset();
				userCallback.reset();
				groupsCallback.reset();
			},
			disable: function() {
				roleCallback.disable();
				userCallback.disable();
				groupsCallback.disable();
			},
			enable: function() {
				roleCallback.enable();
				userCallback.enable();
				groupsCallback.enable();
			},
			options: function() {
				return options;
			},
			getInput: function() {
				return roleCallback.getInput();
			},
			clear: function() {
				roleCallback.clear();
				userCallback.clear();
				groupsCallback.clear();
			}
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

$.fn.fileTree = function(data) {
	var id = checkElementHasId($(this)).attr('id');
	var include = function(node){
		if(node.id == '#' || node.text == '/'){
			for(var index = 0; index < node.children.length; index++){
				include($('#' + id + 'TreeView').jstree().get_node(node.children[index]));
			}
		}else{

			var fullPath = node.text;
			for(var index = 0; index < node.parents.length - 2; index++){
				fullPath = $('#' + id + 'TreeView').jstree().get_node(node.parents[index]).text + '/' + fullPath;
			}
			addFullPath('/' + fullPath);
		}
	}

	var addFullPath = function(fullPath){
		var found = false;
		$('#' + id + 'Included option[value^="' + fullPath + '"]').remove();
		$('#' + id + 'Included option').each(function(index, option){

			if(fullPath.startsWith($(option).attr('value'))){
				found = true;
				return false;
			}else if($(option).attr('value') > fullPath){
				$(option).before('<option value="' + fullPath + '">' + fullPath + '</option>');
				found = true;
				return false;
			}
		});
		if(!found){
			$('#' + id + 'Included').append('<option value="' + fullPath + '">' + fullPath + '</option>');
		}
	}

	if ($(this).data('created')) {
		options = $(this).widget().options();

		return;

	} else {

		var options = $.extend(
		{	valueAttr : 'id',
			nameAttr : 'name',
			nameIsResourceKey : false,
			disabled : false,
			fileTreeResourceKey: 'text.fileTree',
			includedLabelResourceKey: 'text.included',
			getUrlData: function(data) {
				return data;
			}
		}, data);


		var callback = {
				setValue: function(val) {
					if(Object.prototype.toString.call(val) === '[object Array]'){
						$.each(val, function(index, fullPath){
							addFullPath(fullPath);
						});
					}else if(typeof val === 'string'){
						addFullPath(fullPath);
					}
					if(options.changed) {
			 			options.changed(callback);
			 		}
				},
				getValue: function() {
					var values = [];
					$('#' + id + 'Included option').each(function(index, option){
						values.push($(option).val());
					});
					return values;
				},
				reset: function() {

				},
				disable: function() {
					options.disabled = true;
					$('#' + id + 'Included').attr('disabled', true);
					$('#' + id + 'Include').attr('disabled', 'disabled');
					$('#' + id + 'IncludeAll').attr('disabled', 'disabled');
					$('#' + id + 'Exclude').attr('disabled', 'disabled');
					$('#' + id + 'ExcludeAll').attr('disabled', 'disabled');
				},
				enable: function() {
					options.disabled = false;
					$('#' + id + 'Included').attr('disabled', false);
					$('#' + id + 'Include').removeAttr('disabled');
					$('#' + id + 'IncludeAll').removeAttr('disabled');
					$('#' + id + 'Exclude').removeAttr('disabled');
					$('#' + id + 'ExcludeAll').removeAttr('disabled');
				},
				options: function() {
					return options;
				},
				getInput: function() {
					return $('#' + id);
				},
	 			clear: function() {
	 				$('#' + id + 'Included option').remove();
	 			}
		};

		$('#' + id).append(
					'<div class="row" style="margin-bottom:25px;">'
				+	'	<div style="height:400px;" class="col-md-6">'
				+	'		<label>' + getResource(options.fileTreeResourceKey) + '</label>'
				+	'		<div class="panel panel-body" id="' + id + 'TreeView" style="height:100%; overflow: auto;"></div>'
				+	'	</div>'
				+	'	<div class="col-md-1" style="padding-top:140px; padding-left:0px; padding-right:0px;">'
				+	'		<button id="' + id + 'Include" class="btn btn-small btn-primary" style="margin-bottom:10px; width:100%;"><i class="fa fa-chevron-right" style="margin:0px;"></i></button>'
				+	'		<button id="' + id + 'IncludeAll" class="btn btn-small btn-primary" style="margin-bottom:10px; width:100%;"><i class="fa fa-chevron-right" style="margin:0px;"></i><i class="fa fa-chevron-right" style="margin:0px;"></i></button>'
				+	'		<button id="' + id + 'Exclude" class="btn btn-small btn-primary" style="margin-bottom:10px; width:100%;"><i class="fa fa-chevron-left" style="margin:0px;"></i></button>'
				+	'		<button id="' + id + 'ExcludeAll" class="btn btn-small btn-primary" style="margin-bottom:10px; width:100%;"><i class="fa fa-chevron-left" style="margin:0px;"></i><i class="fa fa-chevron-left" style="margin:0px;"></i></button>'
				+	'	</div>'
				+	'	<div style="height:400px;" class="col-md-5">'
				+	'		<label>' + getResource(options.includedLabelResourceKey) + '</label>'
				+	'		<select id="' + id + 'Included" multiple="multiple" class="panel-body formInput text form-control" style="height:100%;padding:5px;">'
				+	'		</select>'
				+	'	</div>'
				+	'</div>');

		if(options.values && options.values.length){
			$.each(options.values, function(index, value){
				$('#' + id + 'Included').append('<option value="' + value + '">' + value + '</option>');
			});

			if(options.changed) {
	 			options.changed(callback);
	 		}
		}

		$('#' + id + 'Include').click(function(){
			if(!options.disabled){
				var selected = $('#' + id + 'TreeView').jstree('get_selected', true);
				$.each(selected, function(index, node){
					include(node);
				});
				if(selected && selected.length > 0 && options.changed) {
			 		options.changed(callback);
				}
			}
		});

		$('#' + id + 'IncludeAll').click(function(){
			if(!options.disabled){
				include($('#' + id + 'TreeView').jstree().get_node('#'));
			}
		});

		$('#' + id + 'Exclude').click(function(){
			if(!options.disabled){
				var selected = $('#' + id + 'Included').val();
				var changed = false;
				if(selected && selected.length){
					$('#' + id + 'Included option').each(function(index, option){
						if(selected.indexOf($(option).val()) != -1){
							$(option).remove();
							changed = true;
						}
					});
				}
				if(changed && options.changed) {
		 			options.changed(callback);
		 		}
			}
		});

		$('#' + id + 'ExcludeAll').click(function(){
			if(!options.disabled){
				var numIncluded = $('#' + id + 'Included option').length;
				$('#' + id + 'Included option').remove();
				if(numIncluded > 0 && options.changed){
					options.changed(callback);
				}
			}
		});

		var name = (options && options.resourceKey != null ) ? formatResourceKey(options.resourceKey) : id ;
		$('#' + id + 'TreeView').jstree({
			"core" : {
				"animation" : 0,
			    "multiple" : true,
			    "themes" : { "stripes" : false },
			    "data": {
			    	"url" : function(node){
			    		var url = basePath + '/api/' + options.url;
		    			return url;
			    	},
			    	"data" : function(node){
			    		if(node.original && node.original.virtualPath){
			    			return {"token": getCsrfToken(), "path": node.original.virtualPath};
			    		}
			    		return {"token": getCsrfToken()};
			    	},
			    	"success": function (data) {
		            	$.each(data, function(index, object){
		            		if((object.fileType == 'FOLDER' || object.fileType == 'ROOT') && object.children && object.children.length > 0){
		            			$.each(object.children, function(index, children){
				            		if(children.fileType == 'FOLDER'){
				            			children.children = true;
				            		}
				            	});
		            		}else if(object.fileType == 'FOLDER' && !object.children){
		            			object.children = true;
		            		}
		            	});
		            	return data;
			    	},
			    	"error": function(error){
			    		showError(getResource('shareAction.folderNotAccessible'));
			    	}
			    }
			},
			"types" : {
		  		"folder" : {
		  			"icon" : "fa fa-2x fa-folder-o"
		  		},
		  		"pdf" : {
		  			"icon" : "fa fa-2x fa-file-pdf-o"
		  		},
		  		"xls" : {
		  			"icon" : "fa fa-2x fa-file-excel-o"
		  		},
		  		"mp3" : {
		  			"icon" : "fa fa-2x fa-file-sound-o"
		  		},
		  		"doc" : {
		  			"icon" : "fa fa-2x fa-file-word-o"
		  		},
		  		"zip" : {
		  			"icon" : "fa fa-2x fa-file-archive-o"
		  		},
		  		"png" : {
		  			"icon" : "fa fa-2x fa-file-image-o"
		  		},
		  		"txt" : {
		  			"icon" : "fa fa-2x fa-file-text-o"
		  		},
		  		"js" : {
		  			"icon" : "fa fa-2x fa-file-code-o"
		  		},
		  		"ppt" : {
		  			"icon" : "fa fa-2x fa-file-powerpoint-o"
		  		},
		  		"mp4" : {
		  			"icon" : "fa fa-2x fa-file-video-o"
		  		},
		  		"error" : {
		  			"icon" : "fa fa-2x fa-times"
		  		},
		  		"default" : {
		  			"icon" : "fa fa-2x fa-file-file-o"
		  		}
			},

			"plugins" : [
				"crrm", "types", "json_data"
			]
		});

		$('#' + id + 'TreeView').on("open_node.jstree", function (e, data) {
			data.instance.set_icon(data.node, 'fa fa-2x fa-folder-open-o');
		});
		$('#' + id + 'TreeView').on("close_node.jstree", function (e, data) {
			data.instance.set_icon(data.node, 'fa fa-2x fa-folder-o');
		});
	}

	if(options.disabled) {
		callback.disable();
	}

	$(this).data('created', true);
	$(this).data('widget', callback);
	$(this).addClass('widget');
	return callback;
}

$.fn.namePair = function(data) {

	var init = false;
	var options = $.extend(
			{
				disabled : false,
				readOnly: false,
				disableName: false,
				columnWeight: 'equal',
				valueVariables: [],
				nameVariables: [],
				variables: [],
				onlyName: false,
				password: false,
				showNameVariables: false,
				showValueVariables: false,
				showNameScript: false,
				showValueScript: false
			}, data);

	var id =  checkElementHasId($(this)).attr('id') + "NamePair";

	var nameWeight = 'col-xs-6';
	var valueWeight = 'col-xs-6';
	if(options.columnWeight=='nameHeavy') {
		nameWeight = 'col-xs-8';
		valueWeight = 'col-xs-4';
	}else if(options.columnWeight=='valueHeavy'){
		nameWeight = 'col-xs-4';
		valueWeight = 'col-xs-8';
	}else if(options.columnWeight=='separateLines'){
		nameWeight = 'col-xs-12';
		valueWeight = 'col-xs-12';
	}

	var nameVariables = options.nameVariables.concat(options.variables);
	var valueVariables = options.valueVariables.concat(options.variables);

	if(!$(this).data('created')){
		html =	'<div id="' + id + 'Input" class="row namePair">';
		if(options.onlyName){
			html += '	<div id="' + id + 'InputName" class="form-group propertyValue col-xs-10 namePairName"></div>'
		}else{
			html += '	<div id="' + id + 'InputName" class="form-group propertyValue ' + nameWeight + ' namePairName"></div>'
				 +	'	<div id="' + id + 'InputValue" class="form-group propertyValue ' + valueWeight + ' namePairValue"></div>';
		}

		html +=  '</div>';

		$(this).append(html);
		if(options.renderNameFunc) {
			options.renderNameFunc($('#' + id + 'InputName'), options);
		} else {
			var value = '';
			if(options.value){
				value = options.value.split('=')[0];
			}
			$('#' + id + 'InputName').textInput({
				variables: nameVariables,
				url: options.nameVariablesUrl,
				getUrlData: function(data) {
					return data.resources;
				},
				disabled: options.disabled || options.disableName,
				value: value,
				showVariables: options.showNameVariables,
				showScript: options.showNamecript
			});
		}
		if(!options.onlyName){
			if(options.renderValueFunc) {
				options.renderValueFunc($('#' + id + 'InputValue'), options);
			} else {
				var inputType = 'text';
				if(options.password){
					inputType = 'password';
				}
				var value = '';
				if(options.value && options.value.split('=').length > 1){
					value = options.value.split('=')[1];
				}
				$('#' + id + 'InputValue').textInput({
 					variables: valueVariables,
 					url: options.valueVariablesUrl,
 					inputType: inputType,
 					getUrlData: function(data) {
 						return data.resources;
 					},
 					disabled: options.disabled,
 					value: value,
 					showVariables: options.showValueVariables,
 					showScript: options.showValueScript
 				});
			}
		}
	}

	var callback = {
 			getValue: function() {
 				var value = '';
 				if(init) {
 					return value;
 				}
				name = encodeURIComponent($('#' + id + 'InputName').widget().getValue());
				if(options.onlyName) {
 					value = name;
				} else {
 					value = name + '=' + encodeURIComponent($('#' + id + 'InputValue').widget().getValue());
				}
 				return value;
 			},
 			setValue: function(val) {
 				if(val && val != ''){
 					valuePair = val.split('=');
 					$('#' + id + 'InputName').widget().setValue(valuePair[0]);
 					if(valuePair.length > 1){
 						$('#' + id + 'InputValue').widget().setValue(valuePair[1]);
 					}
 				}
 				if(options.changed) {
 		 			options.changed(callback);
 		 		}
 			},
 			disable: function() {
 				$('#' + id + 'InputName').widget().disable();
 				if(!options.onlyName) {
 					$('#' + id + 'InputValue').widget().disable();
 				}
 				options.disabled = true;
 			},
 			enable: function() {
 				$('#' + id + 'InputName').widget().enable();
 				if(!options.onlyName) {
 					$('#' + id + 'InputValue').widget().enable();
 				}
 				options.disabled = false;
 			},
 			options: function() {
 				return options;
 			},
 			clear: function() {
 				$('#' + id + 'InputName').widget().clear();
 				if(!options.onlyName) {
 					$('#' + id + 'InputValue').widget().clear();
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

 	if(options.value) {
 		callback.setValue(options.value);
 	}

	if(options.disabled || options.readOnly) {
		callback.disable();
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	$(this).data('created', true);
	return callback;
}

$.fn.autoCompleteNamePair = function(data) {
	var options = $.extend(
			{

			}, data);
	var autoCompleteNamePairOptions = {
		renderNameFunc: function(div, options){
			div.autoComplete(options);
		},
		url: options.url,
		nameIsResourceKey: options.nameIsResourceKey,
		isResourceList: options.isResourceList,
		readOnly: options.readOnly,
		disableName: options.disableName,
		columnWeight: options.columnWeight,
		valueVariables: options.valueVariables,
		nameVariables: options.nameVariables,
		variables: options.variables,
		onlyName: options.onlyName,
		password: options.password,
		showNameVariables: options.showNameVariables,
		showValueVariables: options.showValueVariables,
		showNameScript: options.showNameScript,
		showValueScript: options.showValueScript,
		disabled: options.disabled
	}
	var id =  checkElementHasId($(this)).attr('id') + "autoCompleteNamePair";
	var namePair = $(this).namePair(autoCompleteNamePairOptions);

	var callback = {
		getValue: function() {
			return namePair.getValue();
		},
		setValue: function(val) {
			namePair.setValue(val);
			if(options.changed) {
	 			options.changed(callback);
	 		}
		},
		disable: function() {
			namePair.disable();
			options.disabled = true;
		},
		enable: function() {
			namePair.enable();
			options.disabled = false;
		},
		options: function() {
			return options;
		},
		clear: function() {
			namePair.clear();
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

 	if(options.value) {
 		callback.setValue(options.value);
 	}

	if(options.disabled || options.readOnly) {
		callback.disable();
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	$(this).data('created', true);
	return callback;
}

$.fn.autoCompleteNamePairs = function(data) {
	var options = $.extend(
			{
				disable: function(element){
					element.widget().disable();
				},
				enable: function(element){
					element.widget().enable();
				},
				render: function(element, value) {
					autoCompleteNamePairOptions.value = value;
					element.autoCompleteNamePair(autoCompleteNamePairOptions);
				},
				generateValue: function(element){
					return element.widget().getValue();
				},
				clear: function(element){
					element.widget().clear();
				}
			}, data);
	var autoCompleteNamePairOptions = {
			url: options.url,
			nameIsResourceKey: options.nameIsResourceKey,
			isResourceList: options.isResourceList,
			readOnly: options.readOnly,
			disableName: options.disableName,
			columnWeight: options.columnWeight,
			valueVariables: options.valueVariables,
			nameVariables: options.nameVariables,
			variables: options.variables,
			onlyName: options.onlyName,
			password: options.password,
			showNameVariables: options.showNameVariables,
			showValueVariables: options.showValueVariables,
			showNameScript: options.showNameScript,
			showValueScript: options.showValueScript,
			disabled: options.disabled
	};
	var id =  checkElementHasId($(this)).attr('id') + "autoCompleteNamePairs";
	$(this).append('<div id="' + id + '"></div>');

	var multipleRows = $('#' + id).multipleRows(options);

	var callback = {
		getValue: function() {
			return multipleRows.getValue();
		},
		setValue: function(val) {
			multipleRows.setValue(val);
			if(options.changed) {
	 			options.changed(callback);
	 		}
		},
		disable: function() {
			multipleRows.disable();
			options.disabled = true;
		},
		enable: function() {
			multipleRows.enable();
			options.disabled = false;
		},
		options: function() {
			return options;
		},
		clear: function() {
			multipleRows.clear();
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

	if(options.disabled || options.readOnly) {
		callback.disable();
	}

	$(this).data('widget', callback);
	$(this).addClass('widget');
	$(this).data('created', true);
	return callback;
}

$.fn.switchingHtmlContent = function(data) {
	
	
	var id =  checkElementHasId($(this)).attr('id') + "switchingHtmlContent";
	$(this).append('<div id="' + id + '"><div id="' + id + 'Panel"><a id="' + id + 'ClickRich" href="#"></a> | <a id="' + id + 'ClickHtml" href="#"></a></div><div id="' + id + 'richInput"></div><div id="' + id + 'htmlInput"></div></div>');

	
	$('#' + id + 'ClickRich').click(function(e) {
		
	});
	
	$('#' + id + 'ClickHtml').click(function(e) {
		
	});
	
	
	
	var callback = {
			getValue: function() {
				return multipleRows.getValue();
			},
			setValue: function(val) {
				multipleRows.setValue(val);
				if(options.changed) {
		 			options.changed(callback);
		 		}
			},
			disable: function() {
				multipleRows.disable();
				options.disabled = true;
			},
			enable: function() {
				multipleRows.enable();
				options.disabled = false;
			},
			options: function() {
				return options;
			},
			clear: function() {
				multipleRows.clear();
			},
			getInput: function() {
				return $('#' + id);
			}
	};
	
	$(this).data('widget', callback);
	$(this).addClass('widget');
	$(this).data('created', true);
	return callback;
}