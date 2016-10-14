function validateWidget(widget, widgetsByResourceKey) {
	var meta = widget.options();
	
	var invalid = false;
	
	if(meta.isArrayValue) {
		
		var values = widget.getValue();
		if(values.length > 0) {
			$.each(values, function(idx, v) {
				if(!validate(widget, v, widgetsByResourceKey)) {
					invalid = true;
				}
			});
		} else {
			// Attempt an empty validation
			if(!validate(widget, '', widgetsByResourceKey)) {
				invalid = true;
			}
		}
		
	} else {
		if(!validate(widget, widget.getValue(), widgetsByResourceKey)) {
			invalid = true;
		}
	}
	
	return !invalid;
}

function validate(widget, value, widgetsByResourceKey) {
	
	var options = widget.options();
	if(!internalValidate(widget, value, widgetsByResourceKey)) {
		$(options.errorElementId).addClass('error');
		$(options.errorElementId).text(getResource(options.invalidResourceKey ? options.invalidResourceKey : "text.invalid"));
		return false;
	} else {
		$(options.errorElementId).removeClass('error');
		$(options.errorElementId).text(getResourceWithNamespace(options.i18nNamespace, options.resourceKey + '.info'));
		return true;
	}
}

function checkReplacement(value, widgetsByResourceKey) {
	if(isReplacementVariable(value)) {
		var name = getVariableName(value);
		value = widgetsByResourceKey.get(name).getValue();
	}
	return value;
}

function internalValidate(widget, value, widgetsByResourceKey) {
	obj = widget.options();
	
	obj = $.extend({ allowEmpty: true, allowAttribute: true }, obj);
	
	log("Validating " + obj.resourceKey + ' value ' + value);
	
	if(!validateInputType(obj.inputType)){
		log("Validation failed for " + obj.resourceKey + " and value " + value);
		return false;
	}
	
	if(obj.allowAttribute) {
		if(isReplacementVariable(value)) {
			return true;
		}
	}
	
	if(isReplacementVariable(value)) {
		value = widgetsByResourceKey[getVariableName(value)];
	}
	
	if(!obj.allowEmpty && value=='') {
		log("Validation failed for " + obj.resourceKey + " with empty value");
		return false;
	} else if(obj.allowEmpty && value=='') {
		return true;
	}
	
	if(obj.requiredField && value=='') {
		log("Validation failed for " + obj.resourceKey + " with empty value");
		return false;
	}
	
	if (obj.inputType == 'number') {
		if(!(!isNaN(parseFloat(value)) && isFinite(value))) {
			return false;
		}
		if(parseFloat(checkReplacement(obj.minValue, widgetsByResourceKey)) > parseFloat(value) || parseFloat(checkReplacement(obj.maxValue, widgetsByResourceKey)) < parseFloat(value)){
			log("Validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		}
	} else if (obj.inputType == 'integer') {
		// Validate for integer
		if(!validateRegex('^[0-9]+$',value)){
			log("Validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		}
		if(parseInt(checkReplacement(obj.minValue, widgetsByResourceKey)) > parseInt(value) || parseInt(checkReplacement(obj.maxValue, widgetsByResourceKey)) < parseInt(value)){
			log("Validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		}
	} else if (obj.inputType == 'long') {
		// Validate for integer
		if(!validateRegex('^[0-9]+$',value)){
			log("Validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		}
		if(parseLong(checkReplacement(obj.minValue, widgetsByResourceKey)) > parseLong(value) || parseLong(checkReplacement(obj.maxValue, widgetsByResourceKey)) < parseLong(value)){
			log("Validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		}
	} else if (obj.inputType == 'textarea') {
		if(!obj.allowEmpty && value == '') {
			log("Validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		} else if(obj.allowEmpty && value == '') {
			return true;
		}
	} else if (obj.inputType == 'text' || obj.inputType == 'multipleTextInput') {
		if(!obj.allowEmpty && value == '') {
			log("Validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		} else if(obj.allowEmpty && value == '') {
			return true;
		}
	} else if (obj.inputType == 'password') {
		if(!obj.allowEmpty && value == '') {
			log("Validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		} else if(obj.allowEmpty && value == '') {
			return true;
		}
	} else if(obj.inputType == 'fileInput' || obj.inputType == 'multipleFileInput') {
		
		if(!obj.allowEmpty && value == '') {
			log("validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		} else if(obj.allowEmpty && value == '') {
			return true;
		} else if(widget.needsUpload()) {
			log("File upload widget needs upload");
			return false;
		}
	} else if(obj.inputType == 'html5Upload'){
		
		if(!obj.allowEmpty && value == '') {
			log("validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		} else if(obj.allowEmpty && value == '') {
			return true;
		} else if(widget.needsUpload()) {
			log("File drag and drop widget needs upload");
			return false;
		}
	} else if(obj.inputType == 'logoInput') {
		if(!obj.allowEmpty && value == '') {
			log("validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		} else if(obj.allowEmpty && value == '') {
			return true;
		} 
		else if(widget.needsUpload()) {
			log("Logo widget needs upload");
			return false;
		}
	}
	if(obj.maxLength){
	   if(value) {
		   if(parseInt(obj.maxLength) < value.length){
			 log("Validation failed for " + obj.resourceKey + " and value " + value);  
			 return false;
		   }
	   } 
    }
	if(obj.allowedCharacters && !validateAllowedCharacters(obj,value)){
		log("Validation failed for " + obj.resourceKey + " and value " + value);  
		return false ;
	}
	if(obj.regex && !validateRegex(obj.regex,value)){
		log("Validation failed for " + obj.resourceKey + " and value " + value);
		return false ;
	}
	if(obj.alphaNumericOnly && !validateRegex('^[a-zA-Z0-9]+$',value)){
		log("Validation failed for " + obj.resourceKey + " and value " + value);
		return false ;
	}
	if(obj.alphaNumericSpacesOnly && !validateRegex('^[ a-zA-Z0-9]+$',value)){
		log("Validation failed for " + obj.resourceKey + " and value " + value);
		return false ;
	}
	if(obj.alphaOnly && !validateRegex('^[a-zA-Z]+$',value)){
		log("Validation failed for " + obj.resourceKey + " and value " + value);
		return false ;
	}
	if(obj.validateAny && !validateAny(obj,value)){
		log("Validation failed for " + obj.resourceKey + " and value " + value);
		return false ;
	}
	if(obj.validateAll && !validateAll(obj,value)){
		log("Validation failed for " + obj.resourceKey + " and value " + value);
		return false ;
	}
	log("Validation success for " + obj.resourceKey + " and value " + value);
	return true;
}


function validateInputType(type){
	switch(type){
		case 'number' :
		case 'integer' :
		case 'long' :
		case 'autoComplete' :
		case 'countries' :
		case 'fileInput' :
		case 'logoInput' :
		case 'multipleFileInput' :
		case 'textarea' :
		case 'text' :
		case 'color' :
		case 'textAndSelect' :
		case 'timeAndAutoComplete':
		case 'select' :
		case 'dropdown':
		case 'password' :
		case 'multipleSelect' :
		case 'multipleTextInput' :
		case 'multipleSearchInput' :
		case 'boolean' :
		case 'image' :
		case 'switch' :
		case 'css' :
		case 'java' :
		case 'javascript' :
		case 'html' :
		case 'xml' :
		case 'sql' :
		case 'slider' :
		case 'namePairs' :
		case 'date' :
		case 'time' : 
		case 'checkbox' : return true;	
		default : return false;
	}
}

function validateAllowedCharacters(option,value){
	var patt = new RegExp('[^' + option.allowedCharacters + ']') ;
	return !value.match(patt);	
}

function validateAny(option,value){
	var conditions = option.validateAny;
	var arr = conditions.split(',');
	var matched = false;
	for (i = 0; i < arr.length; ++i) {
		switch(arr[i]){
			case 'ipv4' :
				if(isValidIpv4Address(value)){
					matched = true;
				}
				break;
			case 'ipv6' :
				if(isValidIpv6Address(value)){
					matched = true;
			    }
			    break;
			case 'hostname' :
				if(isValidHostname(value)){
					matched = true;
			    }
			    break;
			case 'url' :
				if(isValidURL(value)){
					matched = true;
			    }
			    break;
			case 'email' :
				if(isValidEmail(value)){
					matched = true;
			    }
			    break;
			case 'cidr' :
				if(isValidCIDR(value)){
					matched = true;
			    }
			    break;
			case 'attribute':
				if(isReplacementVariable(value)) {
					matched = true;
				}
				break;
			case 'uuid':
				matched = validateRegex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, value);
				break;
			default : 
				matched = false;
			break;
		}
		if(matched){
			break;
		}	
	}
	if(matched){
         return true;
    }else{
         return false;
    }
}

function validateAll(option,value){
	var conditions = option.validateAll;
	var arr = conditions.split(',');
	var matched = false;
	for (i = 0; i < arr.length; ++i) {
		switch(arr[i]){
			case 'ipv4' :
				if(isValidIpv4Address(value)){
					matched = true;
				}else{
					matched = false;
				}
				break;
			case 'ipv6' :
				if(isValidIpv6Address(value)){
					matched = true;
			    }else{
					matched = false;
				}
			    break;
			case 'hostname' :
				if(isValidHostname(value)){
					matched = true;
			    }else{
					matched = false;
				}
			    break;
			case 'url' :
				if(isValidURL(value)){
					matched = true;
			    }else{
					matched = false;
				}
			    break;
			case 'email' :
				if(isValidEmail(value)){
					matched = true;
			    }else{
					matched = false;
				}
			    break;
			case 'cidr' :
				if(isValidCIDR(value)){
					matched = true;
			    }else{
					matched = false;
				}
				break;
			case 'notGmail' :
				if(isNotGmail(value)){
					matched = true;
			    }else{
					matched = false;
				}
				break;
			case 'attribute':
				if(isReplacementVariable(value)) {
					matched = true;
				} else {
					matched = false;
				}
			    break;  
			case 'uuid':
				matched = validateRegex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, value);
				break;
			default : matched = false;
		}
		if(!matched){
			break;
		}	
	}
	if(matched){
         return true;
    }else{
         return false;
    }
}

function validateRegex(regex,value){
	if(value) {
		var patt = new RegExp(regex) ;
		return patt.test(value);
	} else {
		return false;
	}
}

$.fn.resetProperties = function() {
	$('.propertyInput', '#' + $(this).attr('id')).each(function(i, obj) {
		var widget = $(this).data('widget');
		widget.reset();
	});
};

$.fn.clearProperties = function() {
	$('.propertyInput', '#' + $(this).attr('id')).each(function(i, obj) {
		var widget = $(this).data('widget');
		widget.clear();
	});
};

$.fn.validateProperties = function() {

	var invalid = false;
	var widgetsByResourceKey = new Map();
	var invalidWidgets = new Array();
	
	$(this).find('.propertyInput').each(
		function(i, obj) {
			var widget = $(this).data('widget');
			widgetsByResourceKey.set(widget.options().resourceKey, widget);
	});
	
	$(this).find('.propertyInput').each(
		function(i, obj) {
			var widget = $(this).data('widget');
			
			if(!validateWidget(widget, widgetsByResourceKey)) {
				invalidWidgets.push(widget);
				invalid = true;
			}
			
		});

	if(invalid) {
		invalidWidgets[0].showTab();
	}
	
	return !invalid;

};

$.fn.validateProperty = function(widget) {

	var widgetsByResourceKey = new Map();
	
	$(this).find('.propertyInput').each(
		function(i, obj) {
			var widget = $(this).data('widget');
			widgetsByResourceKey.set(widget.options().resourceKey, widget);
	});

	return validateWidget(widget, widgetsByResourceKey);

};

$.fn.saveProperties = function(includeAll, callback) {

	var items = new Array();
	var files = new Array();

	$(this).find('.propertyInput').each(
		function(i, obj) {

			var widget = $(this).data('widget');
			
			var meta = widget.options();
			
			log("Checking property " + meta.resourceKey);

			if (includeAll || $(this).data('updated')) {
				if(meta.isArrayValue) {
					
					items.push(new PropertyItem(meta.resourceKey, widget.getValue().join(']|[')));
				} else {
					items.push(new PropertyItem(meta.resourceKey, widget.getValue()));
				}
			}
		});

	callback(items);

};

$.fn.tabPage = function(opts) {

	log("Creating tab page for div " + $(this).attr('id'));

	var propertyDiv = $(this).attr('id');

	var options = $
			.extend(
				{ tabs: [],
				  title : '', 
				  icon : 'fa-th', 
				  showAdditionalTabButtons: false,
				  i18nNamespace: ''},
				opts);
	
	makeBooleanSafe(options);
	
	contentTabs = '#' + propertyDiv + 'Tabs';
	panel = '#' + propertyDiv + 'Panel';
	
	$('body').append('<div id="tabTemp' + propertyDiv + '"/>');
	$('#tabTemp' + propertyDiv).hide();
	$.each(options.tabs, function(idx, obj) {
		$('#' + obj.id).appendTo('#tabTemp' + propertyDiv);
	});
	$(this).empty();
	
	$('#' + propertyDiv)
	.append(
		'<div class="row"><div class="col-xs-12 propertyFilter" id="' + propertyDiv + 'PropertyFilter"></div></div>'
		+ '<div id="' + propertyDiv + 'Panel" class="panel panel-default"><div class="panel-heading"><h2><i class="fa ' 
		+ options.icon + '"></i><span class="break"></span>' + options.title + '</h2><ul id="' 
		+ propertyDiv + 'Tabs" class="nav nav-tabs"/></div><div class="panel-body"><div id="' 
		+ propertyDiv + 'Content" class="tab-content"></div></div></div>');
	
	$.each(options.tabs,
		function(idx, o) {
			$(contentTabs)
					.append(
						'<li class="class_default" id="' + this.id + 'Li" name="tab_' + this.name + '"><a href="#' + this.id + '" class="' +  propertyDiv + 'Tab ' +  propertyDiv + 'Tab2" name="link_' + this.name + '"><span>' + this.name + '</span></a></li>');
			$('#' + this.id).appendTo('#' + propertyDiv + 'Content');
			$('#' + this.id).addClass('tab-pane');
		});
	
	$('#tabTemp' + propertyDiv).remove();

	$('.' +  propertyDiv + 'Tab').click(function(e) {
		e.preventDefault();
		if(!options.showAdditionalTabButtons) {
			if($(this).hasClass(propertyDiv + 'Tab2')) {
				$('#' + propertyDiv + 'Actions').hide();
			} else {
				$('#' + propertyDiv + 'Actions').show();
			}
		}
		$(this).tab('show');
		$('.code').each(function() {
			$(this).data('codeMirror').refresh();
		});
	});

	$('.' +  propertyDiv + 'Tab').first().tab('show');
	$('.code').each(function() {
		$(this).data('codeMirror').refresh();
	});

	if (options.complete) {
		options.complete();
	}
}

$.fn.propertyPage = function(opts) {

	log("Creating property page for div " + $(this).attr('id'));

	var propertyDiv = $(this).attr('id');

	var options = $
			.extend(
				{ resourceNameField: false, 
				  resourceNameCallback: false, 
				  typeCallback: false, 
				  showButtons : true, 
				  showAdditionalTabButtons: false,
				  maintainButtonState: true,
				  displayMode: '', 
				  editMode: '',
				  canUpdate : false, 
				  title : '', 
				  icon : 'fa-th', 
				  revertText: 'text.revert',
				  applyText: 'text.apply',
				  propertyTabsLast: true, 
				  i18nNamespace: '',
				  useFilters: false,
				  alwaysShowStandardFilter: false},
				opts);
	
	makeBooleanSafe(options);
	
	$('body').append('<div id="tabTemp' + propertyDiv + '"/>');
	$('#tabTemp' + propertyDiv).hide();
	if (options.additionalTabs) {
		$.each(options.additionalTabs, function(idx, obj) {
			$('#' + obj.id).appendTo('#tabTemp' + propertyDiv);
		});
	}
	
	$(this).empty();

	getJSON(
		options.url,
		null,
		function(data) {
			
			if((data.resources && data.resources.length == 0)
					&& (!options.additionalTabs || options.additionalTabs.length == 0)) {
				if (options.complete) {
					options.complete();
				}
				return;
			}
			contentTabs = '#' + propertyDiv + 'Tabs';
			contentActions = '#' + propertyDiv + 'Actions';
			revertButton = '#' + propertyDiv + 'Revert';
			applyButton = '#' + propertyDiv + 'Apply';
			panel = '#' + propertyDiv + 'Panel';

			$('#' + propertyDiv)
						.append(
							'<div class="row"><div class="col-xs-12 propertyFilter" id="' + propertyDiv + 'PropertyFilter"></div></div>'
							+ '<div id="' + propertyDiv + 'Panel" class="panel panel-default"><div class="panel-heading"><h2><i class="fa ' 
							+ options.icon + '"></i><span class="break"></span>' + options.title + '</h2><ul id="' 
							+ propertyDiv + 'Tabs" class="nav nav-tabs"/></div><div class="panel-body"><div id="' 
							+ propertyDiv + 'Content" class="tab-content"></div></div></div>');
			
			if (options.showButtons) {
				$(panel)
						.append(
							'<div id="' + propertyDiv + 'Actions" class="panel-footer tabActions"><button class="btn btn-small btn-danger" id="' 
							+ propertyDiv + 'Revert"><i class="fa fa-ban"></i>' + getResource(options.revertText)
							+ '</button><button class="btn btn-small btn-primary" id="' + propertyDiv 
							+ 'Apply"><i class="fa fa-save"></i>' + getResource(options.applyText) + '</button></div>');
			}

			var first = true;
			
			var createAdditionalTabs = function() {
				$.each(options.additionalTabs,
						function(idx, o) {
					var hide = false;
					if(o.checkDisplay && !o.checkDisplay()) {
						hide = true;
					}
					$(contentTabs)
							.append(
								'<li class="class_default" id="' + this.id + 'Li" name="tab_' + this.name + '"' + (hide ? ' style="display:none"' : '') + '><a href="#' + this.id + '" class="' +  propertyDiv + 'Tab ' +  propertyDiv + 'Tab2" name="link_' + this.name + '"><span>' + this.name + '</span></a></li>');
					$('#' + this.id).appendTo('#' + propertyDiv + 'Content');
					$('#' + this.id).addClass('tab-pane');
				});
			};
			
			if (options.additionalTabs && options.propertyTabsLast) {
				createAdditionalTabs();
			}
			
			
			if(data.resources) {
				
				var widgets = new Array();
				var tabs = new Array();
				var filters = new Array();
				$.each(	data.resources,
							function(idx) {

								if(this.hidden) {
									return;
								}
								
								if(this.displayMode && this.displayMode != '') {
									if(!options.displayMode.contains(this.displayMode)) {
										return;
									}
								}
								
								if(this.systemOnly) {
									if($(document).data('session') && $(document).data('session').currentRealm) {
										if(!$(document).data('session').currentRealm.system) {
											return;
										}
									} else {
										return;
									}
								}
								var tab = propertyDiv + "Tab" + Math.abs(this.id);

								// Overwrite template values with any items
								// passed in options
								var values = [];
								if(options.items) {
									$.each(options.items, function() {
										values[this.id] = this.value;
									});
								}
								
								var toSort = [];
								$.each(this.templates, function() {
									if(values[this.resourceKey]) {
										this.value = values[this.resourceKey];
									}
									toSort.push(this);
								});
	
								
								toSort.sort(function(a, b) {
									if (a.weight < b.weight) {
										return -1;
									} else if (a.weight > b.weight) {
										return 1;
									}
									return 0;
								});
								
							
								if(toSort.length  == 0) {
									// Do not display this category because
									// there are no properties to show.
									log(this.categoryKey + " will not be displayed because there are no properties to show");
									return;
								}
								
								
								var tabfilterClass = "class_default";
								var categoryKey = this.categoryKey;
								
								if(options.useFilters) {
									if(this.filter && this.filter != 'default') {
										if($.inArray(this.filter, filters) == -1) {
											filters.push(this.filter);
										}
										tabfilterClass = "class_" + this.filter;
									}
								}
								
								$(contentTabs)
										.append(
											'<li class="tab' + idx + ' ' + tabfilterClass + '" name="tab_'+ this.categoryKey +'"><a ' + (first ? 'class="active ' +  propertyDiv + 'Tab"' : 'class="' +  propertyDiv + 'Tab"')
											+ ' href="#' + tab + '"  name="link_' + this.categoryKey + '"><span>' + ( this.name ? this.name : getResource(this.categoryKey + '.label') ) + '</span></a></li>');
								
								
								
								first = false;
	
								$('#' + propertyDiv + 'Content').append(
									'<div id="' + tab + '" class="tab-pane"/>');
								
								tabs.push(this);
								
								$.each(toSort, function() {

										
										makeBooleanSafe(this);
										makeBooleanSafe(this.attributes);
										obj = $.extend(this, this.attributes);
									
										if(obj.options && !Array.isArray(obj.options)) {
											var tmp = obj.options.split(",");
											var arr = new Array();
											$.each(tmp, function(idx, obj) {
												arr.push({ name: obj, value: obj});
											});
											obj.options = arr;
											obj.nameAttr = 'name';
											obj.valueAttr = 'value';
										}
										
										var widget; 
										var inputId = Math.abs(this.id);
										var inputTab = tab;
										var inputObj = this;
										
										var allowEdit = options.canUpdate;
										
										if(allowEdit && obj.editMode && obj.editMode != '') {
											if(!options.displayMode.contains(obj.editMode)) {
												allowEdit = false;
											}
										}
										obj = $.extend({
											changed : function(widget) {
												if(!$('#' + propertyDiv).validateProperty(widget)) {
													if (options.showButtons && options.maintainButtonState) {
														$(revertButton).attr('disabled', true);
														$(applyButton).attr('disabled', true);
													}
												} else {
													widget.getInput().data('updated', true);
													if (options.showButtons && options.maintainButtonState) {
														$(revertButton).attr('disabled', false);
														$(applyButton).attr('disabled', false);
													}
													if(widget.options().visibilityCallbacks) {
														$.each(widget.options().visibilityCallbacks, function(idx, func) {
															func();
														});
													}
												}
											},
											initialized: function(widget) {
												this.changed(widget);
											},
											displayMode: '',
											getUrlData: function(data) {
												return data.resources;
											},
											disabled : !allowEdit  || obj.readOnly || obj.disabled,
											variables: options.variables,
											errorElementId: '#' + tab + '_helpspan' + inputId,
											i18nNamespace: options.i18nNamespace,
											resourceKeyTemplate: (options.i18nNamespace != '' ? (options.i18nNamespace + '.{0}') : '{0}')
										}, obj);
										
										makeBooleanSafe(obj);
										if(obj.url) {
											
											obj.url = obj.url.replace('$' + '{uiPath}', '${uiPath}').replace('$' + '{basePath}', '${basePath}');
										}
										
										if(obj.displayMode && obj.displayMode != '') {
											if(!options.displayMode.contains(obj.displayMode)) {
												return;
											}
										}
										
										
										var filterClass = tabfilterClass;
										
										if(options.useFilters) {
											if(filterClass=='class_default') {
												if(obj.filter && obj.filter != 'default') {
													if($.inArray(obj.filter, filters) == -1) {
														filters.push(obj.filter);
													}
													filterClass = "class_" + obj.filter;
												}
											}
										}
										
										if(obj.inputType!='hidden') {
											var sizeClass = 'col-md-9';
											if(obj.numCols && obj.numCols > 0 && obj.numCols <= 9) {
												sizeClass = 'col-md-' + obj.numCols;
											}

											$('#' + tab).append('<div class="propertyItem form-group ' + filterClass + '"><div id="' + tab + '_item' + inputId + '"/></div>');
											$('#' + tab + '_item' + inputId).append('<label class="col-md-3 control-label ' + (obj.requiredField ? 'requiredField' : 'optionalField') + '">' + ( this.name ? this.name : getResourceWithNamespace(options.i18nNamespace, this.resourceKey) ) + '</label>');
											$('#' + tab + '_item' + inputId).append('<div class="propertyValue ' + sizeClass + '" id="' + tab + '_value' + inputId + '"></div>');

											if(obj.numCols && obj.numCols > 0 && obj.numCols <= 9) {
												sizeClass = 'col-md-' + (9 - obj.numCols);
												$('#' + tab + '_item' + inputId).append('<div class="' + sizeClass + '">&nbsp;</div>');
											}
										} 


										if (obj.inputType == 'namePairs') {
											var widgetOptions = $.extend(obj, {
												values : splitFix(obj.value),
												isArrayValue: true
											});
											
											widget = $('#' + tab + '_value' + inputId).namePairInput(obj);
			
										} else if (obj.inputType == 'textarea' 
											|| obj.inputType == 'text' 
											|| obj.inputType == 'password' 
											|| obj.inputType == 'number' 
											|| obj.inputType == 'long'
											|| obj.inputType == 'integer') {
											widget = $('#' + tab + '_value' + inputId).textInput(obj);
			
										} else if(obj.inputType == 'css' || obj.inputType == 'javascript' || obj.inputType=='java' || obj.inputType=='sql') {
									    	
											widget = $('#' + tab + '_value' + inputId).codeInput(obj);
									    								    	
									    } else if(obj.inputType == 'xml' || obj.inputType == 'html') {
									    	
									    	widget = $('#' + tab + '_value' + inputId).htmlInput(obj);
									    	
									    } else if(obj.inputType == 'color') {
									    	
									    	widget = $('#' + tab + '_value' + inputId).colorInput(obj);
									    	
									    } else if(obj.inputType == 'editor') {
									    	
									    	widget = $('#' + tab + '_value' + inputId).editor(obj);
									    	
									    } else if(obj.inputType == 'rich') {
									    	
									    	widget = $('#' + tab + '_value' + inputId).richInput(obj);
									    	
									    } else if (obj.inputType == 'select') {

									    	var widgetOptions = $.extend(obj, {
									    		url : (obj.url && options.resource ? obj.url.replace('{id}', options.resource.id) : obj.url), 
									    		notSetResourceKey: obj.emptySelectionResourceKey
											});
									    	
									    	widget = $('#' + tab + '_value' + inputId).selectButton(obj);

										} else if (obj.inputType == 'dropdown') {

									    	var widgetOptions = $.extend(obj, {
									    		url : (obj.url && options.resource ? obj.url.replace('{id}', options.resource.id) : obj.url), 
									    		notSetResourceKey: obj.emptySelectionResourceKey
											});
									    	
									    	widget = $('#' + tab + '_value' + inputId).textDropdown(obj);

										} else if (obj.inputType == 'textAndSelect') {

											obj = $.extend(obj, {
												selectOptions: obj.options
											});
											
											var values;
											if(obj.value) {
												values = obj.value.split('=');
											
												obj.textValue = decodeURIComponent(values[0]);
												obj.selectValue = decodeURIComponent(values[1]);
											}
											
									    	obj.valueTemplate = '{0}={1}';
									    	widget = $('#' + tab + '_value' + inputId).textAndSelect(obj);

										} else if (obj.inputType == 'autoComplete') {

											var url;
											if(obj.url && options.resource) {
												url = obj.url.replace('{id}', options.resource);
											} else { 
												url = obj.url;
											}
											
											var widgetOptions = $.extend(obj, {
												url : (obj.url && options.resource ? obj.url.replace('{id}', options.resource.id) : obj.url), 
											});
											
											widget = $('#' + tab + '_value' + inputId).autoComplete(widgetOptions);
											

										} else if (obj.inputType == 'countries') { 
											
											var widgetOptions = $.extend(obj, {
												values : countries,
												nameAttr: 'name',
												valueAttr: 'code'
											});
											
											widget = $('#' + tab + '_value' + inputId).autoComplete(widgetOptions);

										} else if (obj.inputType == 'logoInput') { 
											var widgetOptions = $.extend(obj, {
												url : basePath + '/api/files/file',
												typeCallback: function() {
													return options.typeCallback ? options.typeCallback() : 'default';
												},
												defaultTextCallback : function() {
													return options.resourceNameCallback ? options.resourceNameCallback() : ( options.resourceNameField ? $(options.resourceNameField).val() : 'X X' );
												}
											});
											
											widget = $('#' + tab + '_value' + inputId).logoInput(obj);
											if(options.resourceNameField) {
												$(options.resourceNameField).on('input', function(){
													widget.defaultTextChanged();
												});
											}

										} else if (obj.inputType == 'fileInput') { 
											
											var widgetOptions = $.extend(obj, {
												url : basePath + '/api/files/file'
											});
											
											widget = $('#' + tab + '_value' + inputId).fileUploadInput(obj);

										} else if (obj.inputType == 'multipleFileInput') { 
											
											var widgetOptions = $.extend(obj, {
												isArrayValue: true,
												values: splitFix(obj.value),
												url : basePath + '/api/files/file'
											});
											
											widget = $('#' + tab + '_value' + inputId).multipleFileUpload(widgetOptions);
										} else if (obj.inputType == 'html5Upload') { 
											
											var widgetOptions = $.extend(obj, {
												isArrayValue: true,
												values: splitFix(obj.value),
												url : basePath + '/api/files/file'
											});
											
											widget = $('#' + tab + '_value' + inputId).html5Upload(widgetOptions);

										} else if (obj.inputType == 'multipleSelect') {

											var url;
											if(obj.url && options.resource) {
												url = obj.url.replace('{id}', options.resource);
											} else { 
												url = obj.url;
											}
											
											var widgetOptions = $.extend(obj, {
												selected : splitFix(obj.value), 
												isArrayValue: true,
												url: url
											});
											
											widget = $('#' + tab + '_value' + inputId).multipleSelect(widgetOptions);
												
										} else if (obj.inputType == 'multipleTextInput') {
											
											var widgetOptions = $.extend(obj, {
												values : splitFix(obj.value),
												isArrayValue: true
											});
	
											widget = $('#' + tab + '_value' + inputId).multipleTextInput(widgetOptions);

										} else if (obj.inputType == 'multipleSearchInput') {
											var widgetOptions = $.extend({
												url : (obj.url && options.resource ? obj.url.replace('{id}', options.resource.id) : obj.url),
												isNamePairValue: true,
												values: obj.isNamePairValue == false ? splitFix(obj.value) : splitNamePairs(obj.value)
											}, obj);
											
											widget = $('#' + tab + '_value' + inputId).multipleSearchInput(widgetOptions);

										} else if (obj.inputType == 'date') {
											
											widget = $('#' + tab + '_value' + inputId).dateInput(obj);
											
										} else if (obj.inputType == 'time') {
											
											widget = $('#' + tab + '_value' + inputId).timeInput(obj);
											
										} else if (obj.inputType == 'button') {
											
											widget = $('#' + tab + '_value' + inputId).buttonAction(obj);
											
										} else if (obj.inputType == 'boolean') {
											
											widget = $('#' + tab + '_value' + inputId).booleanInput(obj);
											
										} else if (obj.inputType == 'switch') {

											widget = $('#' + tab + '_value' + inputId).switchInput(obj);
											
										} else if (obj.inputType == 'image') {
											
											widget = $('#' + tab + '_value' + inputId).imageInput(obj);

										} else if (obj.inputType == 'slider') {

											widget = $('#' + tab + '_value' + inputId).sliderInput(obj);

										}
										
										if(obj.inputType != 'hidden') {
											
											if(!widget) {
												log("Cannot find input for widget " + obj.inputType);
											} else {
										
												widget = $.extend({
													showTab: function() {
														$('a[name="link_' + categoryKey + '"]').tab('show');
													}
												}, widget);
												widget.getInput().addClass('propertyInput');
												widget.getInput().data('widget', widget);
												
												$(document).data(this.resourceKey, widget);
												widgets.push(widget);
												
												$('#' + tab + '_value' + inputId).append(
														'<div class="clear"><span id="' + tab + '_helpspan' + inputId + '" class="help-block">' 
														+  ( this.description ? this.description : getResourceWithNamespace(options.i18nNamespace, this.resourceKey + '.info') ) 

														+ '</span></div>');
											}
										}
										
									});
	
							});
				
				
				$.each(widgets, function(idx, w) {
					if(w.options().visibilityDependsOn) {
						var props = w.options().visibilityDependsOn.split(',');
						var w2 = [];
						for(i=0;i<props.length;i++) {
							w2.push($(document).data(props[i]));
							if(!w2[i]) {
								log("WARNING: " + w.options().resourceKey + " visibility depends on " + props[i] + " but a property with that resource key does not exist");
								return;
							}
						}

						w.getInput().parents('.propertyItem').hide();
						var visibilityCallback = function() {
							
							var dependsValue = w.options().visibilityDependsValue.toString().split(',');
							var show = false;
							for(i=0;i<w2.length;i++) {
								if(i > 0 && !show) {
									break;
								}
								if(dependsValue[i].startsWith('!')) {
									dependsValue[i] = dependsValue[i].substring(1);
									show = w2[i].getValue() != makeVariableSafe(dependsValue[i]);
								} else {
									var v = w2[i].getValue();
									show = (v == makeVariableSafe(dependsValue[i]));
								}
							}
							
							if(show) {
								w.getInput().parents('.propertyItem').show();
							} else {
								if(w.options().clearOnVisibilityChange) {
									w.clear();
								}
								w.getInput().parents('.propertyItem').hide();
							}
						}
						visibilityCallback();
						for(i=0;i<w2.length;i++) {
							if(!w2[i].options().visibilityCallbacks) {
								w2[i].options().visibilityCallbacks = new Array();
							}
							w2[i].options().visibilityCallbacks.push(visibilityCallback);
						}
					}
					
				});
				
				$.each(tabs, function(idx, t) {
					if(t.visibilityDependsOn) {
						
						var props = t.visibilityDependsOn.split(',');
						var w2 = [];
						for(i=0;i<props.length;i++) {
							w2.push($(document).data(props[i]));
							if(!w2[i]) {
								log("WARNING: " + t.resourceKey + " visibility depends on " + props[i] + " but a property with that resource key does not exist");
								return;
							}
						}
						
						// Hide tab
						$('.tab' + idx).hide();
						var visibilityCallback = function() {
							
							var dependsValue = t.visibilityDependsValue.toString().split(',');
							var show = false;
							for(i=0;i<w2.length;i++) {
								if(i > 0 && !show) {
									break;
								}
								if(dependsValue[i].startsWith('!')) {
									dependsValue[i] = dependsValue[i].substring(1);
									show = w2[i].getValue() != makeVariableSafe(dependsValue[i]);
								} else {
									var v = w2[i].getValue();
									show = v == makeVariableSafe(dependsValue[i]);
								}
							}
							
							if(show) {
								// Show tab
								$('.tab' + idx).show();
//								$('li.tab' + idx + ':first a').tab('show');
							} else {
								// Hide tab
								$('.tab' + idx).hide();
							}
						}
						visibilityCallback();
						for(i=0;i<w2.length;i++) {
							if(!w2[i].options().visibilityCallbacks) {
								w2[i].options().visibilityCallbacks = new Array();
							}
							w2[i].options().visibilityCallbacks.push(visibilityCallback);
						}
					}
				});
			
				
				$.each(widgets, function(idx, w) {
					if(w.options().valueChanges) {
						var w2 = $(document).data(w.options().valueChanges);
						if(!w2) {
							log("WARNING: " + w.options().resourceKey + " value changes " + w.options().valueChanges + " but a property with that resource key does not exist");
						} else {
							var visibilityCallback = function() {
								var val = w.options().attributes["value" + w.getValue()];
								if(val) {
									w2.setValue(val);
								}
							}
							visibilityCallback();
							if(!w.options().visibilityCallbacks) {
								w.options().visibilityCallbacks = new Array();
							}
							w.options().visibilityCallbacks.push(visibilityCallback);
						}
					}
				});
				
				if(filters.length > 0 && options.useFilters) {
					$('#' + propertyDiv + 'PropertyFilter').append('<a href="#" class="click_default">' + getResource('default.label') + '</a>');
					filters.push('default');
					$.each(filters, function(idx, filter) {
						if(filter!='default') {
							$('#' + propertyDiv + 'PropertyFilter').append(' | <a href="#" class="click_' + filter + '">' + getResource(filter + '.label') + '</a>');
							$('.class_' + filter).hide();
						}
						$('.click_' + filter).on('click', function(e) {
							e.preventDefault();
							$.each(filters, function(i,f) {
								if(f!=filter) {
									if(f!='default' || !options.alwaysShowStandardFilter)
									$('.class_' + f).hide();
								}
							});
							$('.class_' + filter).show();
							$('li.class_' + filter + ':first a').tab('show');
						});
					});
				}
			}
			
			if (options.additionalTabs && !options.propertyTabsLast) {
				createAdditionalTabs();
			}
			
			$('#tabTemp' + propertyDiv).remove();

			$('.' +  propertyDiv + 'Tab').click(function(e) {
				e.preventDefault();
				if(!options.showAdditionalTabButtons) {
					if($(this).hasClass(propertyDiv + 'Tab2')) {
						$('#' + propertyDiv + 'Actions').hide();
					} else {
						$('#' + propertyDiv + 'Actions').show();
					}
				}
				$(this).tab('show');
				$('.code').each(function() {
					$(this).data('codeMirror').refresh();
				});
			});

			$('.' +  propertyDiv + 'Tab').first().tab('show');
			$('.code').each(function() {
				$(this).data('codeMirror').refresh();
			});
			
			if (options.showButtons) {
				
				if(options.maintainButtonState) {
					$(revertButton).attr('disabled', true);
					$(applyButton).attr('disabled', true);
				}
				
				$(revertButton).click(function() {
					
					if(options.revertButtonClick) {
						options.revertButtonClick($(revertButton));
					} else {
						$('.propertyInput').each(function(i, obj) {
							widget = $(this).data('widget');
							widget.reset();
						});
						if(options.maintainButtonState) {
							$(revertButton).attr('disabled', true);
							$(applyButton).attr('disabled', true);
						}
					}
				});
				$(applyButton).click(function() {

					if(options.applyButtonClick) {
						options.applyButtonClick($(applyButton));
					} else {
						if(!$('#' + propertyDiv).validateProperties()) {
							showError("error.correctValidationErrors");
							return;
						}
						
						$('#' + propertyDiv).saveProperties(false, function(items) {
							postJSON(options.url, items, function(data) {
	
								if (data.success) {
									showSuccess(data.message);
									
									$('.propertyInput', '#' + propertyDiv).each(function(i, obj) {
										var item = $('#' + obj.id);
										item.data('updated', false);
									});
								} else {
									showError(data.message);
								}
								if(options.maintainButtonState) {
									$(revertButton).attr('disabled', true);
									$(applyButton).attr('disabled', true);
								}
							});
						});
					}

				});
			}

			if (options.complete) {
				options.complete();
			}
		});
};



