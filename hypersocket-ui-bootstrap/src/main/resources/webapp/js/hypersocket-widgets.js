/**
* Displays a text input with button to insert a set of variables.
**/

$.fn.textInputWithVariables = function(data) {
	
	var options = $.extend(
			{  
				variableTemplate: '$\{{0}\}', disabled : false, isPropertyInput: false, type: 'text',
				readOnly: false
			}, data);
	
	if(data && data.metaData) {
		options = $.extend(data.metaData, options);
	}
  
	var id = (options.isPropertyInput ? 'input_' : '' ) + options.id;
	
	if(options.type=='textarea') {
		$(this).append('<div class="input-group"><textarea name="' + id + '" id="' + id + '" class="form-control propertyInput" value="' 
				+ stripNull(options.value) + '"' + (!options.readOnly && !options.disabled ? '' : 'disabled="disabled" ') + ' cols="' 
				+ (options.cols ? options.cols : 30) + '" rows="' + (options.rows ? options.rows : 5) + '" maxlength="' + options.maxlength + '">' + stripNull(options.value) + '</textarea>'
			 	  + '<ul id="' + id + 'Dropdown" class="dropdown-menu dropdown-menu-right" role="menu"></ul><span class="input-group-addon dropdown-toggle unselectable" '
			 	  + 'data-toggle="dropdown">${}</span></div>');
	} else {
		$(this).append('<div class="input-group"><input type="' + options.type + '" name="' + id + '" id="' + id + '" class="form-control propertyInput" value="' 
				+ stripNull(options.value) + '"' + (!options.readOnly && !options.disabled ? '' : 'disabled="disabled" ') + '>'
			 	  + '<ul id="' + id + 'Dropdown" class="dropdown-menu dropdown-menu-right" role="menu"></ul><span class="input-group-addon dropdown-toggle unselectable" '
			 	  + 'data-toggle="dropdown">${}</span></div>');
	}

	if(options.isPropertyInput) {
		$('#' + id).prepareProperty(options,
			options.id, options.value, options.resourceKey);
	}
	
 	if(options.variables) {
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
 			$.each(data.resources, function(idx, obj) {
 	 			$('#' + id + 'Dropdown').append('<li><a href="#" class="' + id + 'Class">' + options.variableTemplate.format(obj) + '</a></li>');
 	 		});
 		});
 	}
 	
}


/**
* Displays a code editor
**/

$.fn.editor = function(data) {

	var options = $.extend(
		{ isPropertyInput : true, disabled : false, 
					value: ''}, data);

	if(data && data.metaData) {
		options = $.extend(data.metaData. options);
	}
	
	var id = $(this).attr('id') + 'Editor';
	
	$(this).data('resourceKey', options.resourceKey);
	$(this).data('created', true);
	$(this).data('updated', false);
	$(this).data('options', options);
	
	if (options.isPropertyInput) {
		$(this).addClass('propertyInput');
	}
	
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

	callback = {
		setValue: function(raw) {
			$('#' + id).html(raw);
		}, 
		getValue: function() {
			return $('#' + id).cleanHtml();
		},
		enable: function() {
			
		}, 
		disable: function() {
			
		}
	}
	
	$(this).data('editor', callback);
	callback.setValue(options.value);
	return callback;
}
