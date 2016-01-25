function validateWidget(widget) {
	var meta = widget.options();
	
	var invalid = false;
	
	if(meta.isArrayValue) {
		
		var values = widget.getValue();
		if(values.length > 0) {
			$.each(values, function(idx, v) {
				if(!validate(widget, v)) {
					invalid = true;
				}
			});
		} else {
			// Attempt an empty validation
			if(!validate(widget, '')) {
				invalid = true;
			}
		}
		
	} else {
		if(!validate(widget, widget.getValue())) {
			invalid = true;
		}
	}
	
	return !invalid;
}

function validate(widget, value) {
	
	var options = widget.options();
	if(!internalValidate(widget, value)) {
		$(options.errorElementId).addClass('error');
		$(options.errorElementId).text(getResource(options.invalidResourceKey ? options.invalidResourceKey : "text.invalid"));
		return false;
	} else {
		$(options.errorElementId).removeClass('error');
		$(options.errorElementId).text(getResourceWithNamespace(options.i18nNamespace, options.resourceKey + '.info'));
		return true;
	}
}

function internalValidate(widget, value) {
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
	
	if(!obj.allowEmpty && value=='') {
		return false;
	}
	
	if (obj.inputType == 'number') {
		return !isNaN(parseFloat(value)) && isFinite(value);
	} if (obj.inputType == 'integer') {
		// Validate for integer
		if(!validateRegex('^[0-9]+$',value)){
			log("Validation failed for " + obj.resourceKey + " and value " + value);
			return false;
		}
		if(parseInt(obj.minValue) > parseInt(value) || parseInt(obj.maxValue) < parseInt(value)){
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
		} 
		else if(widget.needsUpload()) {
			log("File upload widget needs upload");
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
		case 'autoComplete' :
		case 'countries' :
		case 'fileInput' :
		case 'logoInput' :
		case 'multipleFileInput' :
		case 'textarea' :
		case 'text' :
		case 'textAndSelect' :
		case 'timeAndAutoComplete':
		case 'select' :
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
			default : matched = false;
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

$.fn.propertyPage = function(opts) {

	log("Creating property page for div " + $(this).attr('id'));

	var propertyDiv = $(this).attr('id');
	
	var options = $
			.extend(
				{ resourceNameField: false, 
				  resourceNameCallback: false, 
				  typeCallback: false, 
				  showButtons : true, 
				  displayMode: '', 
				  editMode: '',
				  canUpdate : false, 
				  title : '', 
				  icon : 'fa-th', 
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
							'<div class="row"><div class="col-xs-12" id="propertyFilter"></div></div>'
							+ '<div id="' + propertyDiv + 'Panel" class="panel panel-default"><div class="panel-heading"><h2><i class="fa ' 
							+ options.icon + '"></i><span class="break"></span>' + options.title + '</h2><ul id="' 
							+ propertyDiv + 'Tabs" class="nav nav-tabs"/></div><div class="panel-body"><div id="' 
							+ propertyDiv + 'Content" class="tab-content"></div></div></div>');
			
			if (options.showButtons) {
				$(panel)
						.append(
							'<div id="' + propertyDiv + 'Actions" class="panel-footer tabActions"><button class="btn btn-small btn-danger" id="' 
							+ propertyDiv + 'Revert"><i class="fa fa-ban"></i>' + getResource('text.revert')
							+ '</button><button class="btn btn-small btn-primary" id="' + propertyDiv 
							+ 'Apply"><i class="fa fa-check"></i>' + getResource('text.apply') + '</button></div>');
			}

			var first = true;
			
			var createAdditionalTabs = function() {
				$.each(options.additionalTabs,
						function(idx, o) {
							$(contentTabs)
									.append(
										'<li class="class_default" id="' + this.id + 'Li" name="tab_' + this.name + '"><a href="#' + this.id + '" class="' +  propertyDiv + 'Tab ' +  propertyDiv + 'Tab2" name="link_' + this.name + '"><span>' + this.name + '</span></a></li>');
							$('#' + this.id).appendTo('#' + propertyDiv + 'Content');
							$('#' + this.id).addClass('tab-pane');
						});
			};
			
			if (options.additionalTabs && options.propertyTabsLast) {
				createAdditionalTabs();
			}
			
			
			if(data.resources) {
				
				var widgets = new Array();
				var filters = new Array();
				$.each(	data.resources,
							function() {

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
								var tab = "tab" + this.id;

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
											'<li class="' + tabfilterClass + '" name="tab_'+getResource(this.categoryKey + '.label')+'"><a ' + (first ? 'class="active ' +  propertyDiv + 'Tab"' : 'class="' +  propertyDiv + 'Tab"')
											+ ' href="#' + tab + '"  name="link_' + getResource(this.categoryKey + '.label') + '"><span>' + getResource(this.categoryKey + '.label') + '</span></a></li>');
								
								
								
								first = false;
	
								$('#' + propertyDiv + 'Content').append(
									'<div id="' + tab + '" class="tab-pane"/>');
								
	
								$.each(toSort, function() {

										
										makeBooleanSafe(this);
										makeBooleanSafe(this.attributes);
										
										obj = JSON.parse(this.metaData);
										makeBooleanSafe(obj);
										
										obj = $.extend(this, obj);
										obj = $.extend(this, this.attributes);
									
										if(obj.options && !Array.isArray(obj.options)) {
											var tmp = obj.options.split(",");
											var arr = new Array();
											$.each(tmp, function(idx, obj) {
												arr.push({ name: obj, value: obj});
											});
											obj.options = arr;
										}
										
										var widget; 
										var inputId = this.id;
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
												if(!validateWidget(widget)) {
													if (options.showButtons) {
														$(revertButton).attr('disabled', true);
														$(applyButton).attr('disabled', true);
													}
												} else {
													widget.getInput().data('updated', true);
													if (options.showButtons) {
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
											$('#' + tab).append('<div class="propertyItem form-group ' + filterClass + '"><div id="' + tab + '_item' + this.id + '"/></div>');
											$('#' + tab + '_item' + this.id).append('<label class="col-md-3 control-label">' + getResourceWithNamespace(options.i18nNamespace, this.resourceKey) + '</label>');
											$('#' + tab + '_item' + this.id).append('<div class="propertyValue col-md-9" id="' + tab + '_value' + this.id + '"></div>');
										} 


										if (obj.inputType == 'namePairs') {
											var widgetOptions = $.extend(obj, {
												values : splitFix(obj.value),
												isArrayValue: true
											});
											
											widget = $('#' + tab + '_value' + this.id).namePairInput(obj);
			
										} else if (obj.inputType == 'textarea' 
											|| obj.inputType == 'text' 
											|| obj.inputType == 'password' 
											|| obj.inputType == 'number' 
											|| obj.inputType == 'integer') {
											widget = $('#' + tab + '_value' + this.id).textInput(obj);
			
										} else if(obj.inputType == 'css' || obj.inputType == 'javascript' || obj.inputType=='java') {
									    	
											widget = $('#' + tab + '_value' + this.id).codeInput(obj);
									    								    	
									    } else if(obj.inputType == 'xml' || obj.inputType == 'html') {
									    	
									    	widget = $('#' + tab + '_value' + this.id).htmlInput(obj);
									    	
									    } else if(obj.inputType == 'editor') {
									    	
									    	widget = $('#' + tab + '_value' + this.id).editor(obj);
									    	
									    } else if (obj.inputType == 'select') {

									    	var widgetOptions = $.extend(obj, {
									    		url : (obj.url && options.resource ? obj.url.replace('{id}', options.resource.id) : obj.url), 
									    		emptySelectionText: getResource(obj.emptySelectionResourceKey)
											});
									    	
									    	widget = $('#' + tab + '_value' + this.id).selectButton(obj);

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
									    	widget = $('#' + tab + '_value' + this.id).textAndSelect(obj);

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
											
											widget = $('#' + tab + '_value' + this.id).autoComplete(widgetOptions);
											

										} else if (obj.inputType == 'countries') { 
											
											var widgetOptions = $.extend(obj, {
												values : countries,
												nameAttr: 'name',
												valueAttr: 'code'
											});
											
											widget = $('#' + tab + '_value' + this.id).autoComplete(widgetOptions);

										} else if (obj.inputType == 'logoInput') { 
											var widgetOptions = $.extend(obj, {
												url : basePath + '/api/fileUpload/file',
												typeCallback: function() {
													return options.typeCallback ? options.typeCallback() : 'default';
												},
												defaultTextCallback : function() {
													return options.resourceNameCallback ? options.resourceNameCallback() : ( options.resourceNameField ? $(options.resourceNameField).val() : 'X X' );
												}
											});
											
											widget = $('#' + tab + '_value' + this.id).logoInput(obj);
											if(options.resourceNameField) {
												$(options.resourceNameField).on('input', function(){
													widget.defaultTextChanged();
												});
											}

										} else if (obj.inputType == 'fileInput') { 
											
											var widgetOptions = $.extend(obj, {
												url : basePath + '/api/fileUpload/file'
											});
											
											widget = $('#' + tab + '_value' + this.id).fileUploadInput(obj);

										} else if (obj.inputType == 'multipleFileInput') { 
											
											var widgetOptions = $.extend(obj, {
												isArrayValue: true,
												values: splitFix(obj.value),
												url : basePath + '/api/fileUpload/file'
											});
											
											widget = $('#' + tab + '_value' + this.id).multipleFileUpload(widgetOptions);

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
											
											widget = $('#' + tab + '_value' + this.id).multipleSelect(widgetOptions);
												
										} else if (obj.inputType == 'multipleTextInput') {
											
											var widgetOptions = $.extend(obj, {
												values : splitFix(obj.value),
												isArrayValue: true
											});
	
											widget = $('#' + tab + '_value' + this.id).multipleTextInput(widgetOptions);

										} else if (obj.inputType == 'multipleSearchInput') {
											
											var widgetOptions = $.extend(obj, {
												url : (obj.url && options.resource ? obj.url.replace('{id}', options.resource.id) : obj.url)
											});
											
											widget = $('#' + tab + '_value' + this.id).multipleSearchInput(widgetOptions);

										} else if (obj.inputType == 'date') {
											
											widget = $('#' + tab + '_value' + this.id).dateInput(obj);
											
										} else if (obj.inputType == 'time') {
											
											widget = $('#' + tab + '_value' + this.id).timeInput(obj);
											
										} else if (obj.inputType == 'button') {
											
											widget = $('#' + tab + '_value' + this.id).buttonAction(obj);
											
										} else if (obj.inputType == 'boolean') {
											
											widget = $('#' + tab + '_value' + this.id).booleanInput(obj);
											
										} else if (obj.inputType == 'switch') {

											widget = $('#' + tab + '_value' + this.id).switchInput(obj);
											
										} else if (obj.inputType == 'image') {
											
											widget = $('#' + tab + '_value' + this.id).imageInput(obj);

										} else if (obj.inputType == 'slider') {

											widget = $('#' + tab + '_value' + this.id).sliderInput(obj);

										}
										
										if(obj.inputType != 'hidden') {
											
											if(!widget) {
												log("Cannot find input for widget " + obj.inputType);
											} else {
												widget.getInput().addClass('propertyInput');
												widget.getInput().data('widget', widget);
												
												$(document).data(this.resourceKey, widget);
												widgets.push(widget);
												
												$('#' + tab + '_value' + this.id).append(
														'<div class="clear"><span id="' + tab + '_helpspan' + this.id + '" class="help-block">' 
														+  getResourceWithNamespace(options.i18nNamespace, this.resourceKey + '.info') 
														+ '</span></div>');
											}
										}
										
									});
	
							});
				
				$.each(widgets, function(idx, w) {
					if(w.options().visibilityDependsOn) {
						var w2 = $(document).data(w.options().visibilityDependsOn);
						if(!w2) {
							log("WARNING: " + w.options().resourceKey + " visibility depends on " + w.options().visibilityDependsOn + " but a property with that resource key does not exist");
						} else {
							w.getInput().parents('.propertyItem').hide();
							var visibilityCallback = function() {
								if(w2.getValue() == w.options().visibilityDependsValue) {
									w.getInput().parents('.propertyItem').show();
								} else {
									if(w.options().clearOnVisibilityChange) {
										w.clear();
									}
									w.getInput().parents('.propertyItem').hide();
								}
							}
							visibilityCallback();
							if(!w2.options().visibilityCallbacks) {
								w2.options().visibilityCallbacks = new Array();
							}
							w2.options().visibilityCallbacks.push(visibilityCallback);
						}
					}
				});
				
				if(filters.length > 0 && options.useFilters) {
					$('#propertyFilter').append('<a href="#" class="click_default">' + getResource('default.label') + '</a>');
					filters.push('default');
					$.each(filters, function(idx, filter) {
						if(filter!='default') {
							$('#propertyFilter').append(' | <a href="#" class="click_' + filter + '">' + getResource(filter + '.label') + '</a>');
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
							$('.class_' + filter + ':first a').tab('show');
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
				if($(this).hasClass(propertyDiv + 'Tab2')) {
					$('#' + propertyDiv + 'Actions').hide();
				} else {
					$('#' + propertyDiv + 'Actions').show();
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
				$(revertButton).attr('disabled', true);
				$(applyButton).attr('disabled', true);

				$(revertButton).click(function() {
					$('.propertyInput').each(function(i, obj) {
						widget = $(this).data('widget');
						widget.reset();
					});
					$(revertButton).attr('disabled', true);
					$(applyButton).attr('disabled', true);
				});
				$(applyButton).click(function() {

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
							$(revertButton).attr('disabled', true);
							$(applyButton).attr('disabled', true);
						});
					});

				});
			}

			if (options.complete) {
				options.complete();
			}
		});
};

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

	var items = new Array();
	var files = new Array();

	var invalid = false;

	$(this).find('.propertyInput').each(
		function(i, obj) {

			var widget = $(this).data('widget');
			
			if(!validateWidget(widget)) {
				invalid = true;
			}
			
		});

	return !invalid;

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
					debugger;
					items.push(new PropertyItem(meta.resourceKey, widget.getValue().join(']|[')));
				} else {
					items.push(new PropertyItem(meta.resourceKey, widget.getValue()));
				}
			}
		});

	callback(items);

};

