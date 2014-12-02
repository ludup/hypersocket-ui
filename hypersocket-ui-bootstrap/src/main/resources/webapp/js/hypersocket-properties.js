
function validate(widget) {
	obj = widget.options();
	
	obj = $.extend({ allowEmpty: true }, obj);
	
	var value = widget.getValue();
	
	log("Validating " + obj.resourceKey + ' value ' + value);
	
	if (obj.inputType == 'number') {
		if(parseInt(value) == value) {
			return (parseInt(obj.minValue) <= parseInt(value) && parseInt(obj.maxValue) >= parseInt(value));
		}
	} else if (obj.inputType == 'textarea') {
		if(!obj.allowEmpty && value == '') {
			return false;
		}
		return true;
	} else if (obj.inputType == 'text') {
		if(!obj.allowEmpty && value == '') {
			return false;
		}
		return true;
	} else if (obj.inputType == 'select') {
		return true;
	} else if (obj.inputType == 'password') {
		if(!obj.allowEmpty && value == '') {
			return false;
		}
		return true;
	} else if (obj.inputType == 'multipleSelect') {
		return true;
	} else if (obj.inputType == 'multipleTextInput') {
		return true;
	} else if (obj.inputType == 'boolean') {
		return true;
	} else if (obj.inputType == 'image') {
		return true;
	} else if (obj.inputType == 'switch') {
		return true;
	} else if (obj.inputType == 'css') {
		return true;
	} else if (obj.inputType == 'java') {
		return true;
	} else if (obj.inputType == 'javascript') {
		return true;
	} else if (obj.inputType == 'html') {
		return true;
	} else if (obj.inputType == 'xml') {
		return true;
	} else if (obj.inputType == 'sql') {
		return true;
	} 

	log("Validation failed for " + obj.resourceKey);
	return false;
}

$.fn.propertyPage = function(opts) {

	log("Creating property page for div " + $(this).attr('id'));
	debugger;
	var propertyDiv = $(this).attr('id');
	
	var options = $
			.extend(
				{ showButtons : true, displayMode: '', canUpdate : false, title : '', icon : 'fa-th', propertyTabsLast: true },
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
			;
			contentTabs = '#' + propertyDiv + 'Tabs';
			contentActions = '#' + propertyDiv + 'Actions';
			revertButton = '#' + propertyDiv + 'Revert';
			applyButton = '#' + propertyDiv + 'Apply';
			panel = '#' + propertyDiv + 'Panel';

			$('#' + propertyDiv)
					.append(
						'<div id="' + propertyDiv + 'Panel" class="panel panel-default"><div class="panel-heading"><h2><i class="fa ' 
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
										'<li id="' + this.id + 'Li"><a href="#' + this.id + '" class="' +  propertyDiv + 'Tab ' +  propertyDiv + 'Tab2"><span>' + this.name + '</span></a></li>');
							$('#' + this.id).appendTo('#' + propertyDiv + 'Content');
							$('#' + this.id).addClass('tab-pane');
						});
			};
			
			if (options.additionalTabs && options.propertyTabsLast) {
				createAdditionalTabs();
			}
			
			if(data.resources) {
				$.each(	data.resources,
							function() {

								if(this.displayMode && this.displayMode != '') {
									if(this.displayMode != options.displayMode) {
										return;
									}
								}
								var tab = "tab" + this.id;

								// Overwrite template values with any items passed in options
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
									// Do not display this category because there are no properties to show.
									log(this.categoryKey + " will not be displayed because there are no properties to show");
									return;
								}
								
								$(contentTabs)
										.append(
											'<li><a ' + (first ? 'class="active ' +  propertyDiv + 'Tab"' : 'class="' +  propertyDiv + 'Tab"')
											+ ' href="#' + tab + '"><span>' + getResource(this.categoryKey + '.label') + '</span></a></li>');
								first = false;
	
								$('#' + propertyDiv + 'Content').append(
									'<div id="' + tab + '" class="tab-pane"/>');
								
	
								$.each(toSort, function() {

										obj = JSON.parse(this.metaData);
										makeBooleanSafe(obj);
										
										obj = $.extend(obj, this);
										makeBooleanSafe(obj);
										
										var widget; 
										var inputId = this.id;
										var inputTab = tab;
										var inputObj = this;
										
										obj = $.extend({
											changed : function(widget) {
												if(!validate(widget)) {
													$('#' + tab + '_helpspan' + inputId).addClass('error');
													$('#' + tab + '_helpspan' + inputId).text(getResource("text.invalid"));
													if (options.showButtons) {
														$(revertButton).attr('disabled', true);
														$(applyButton).attr('disabled', true);
													}
												} else {
													$('#' + tab + '_helpspan' + inputId).removeClass('error');
													$('#' + tab + '_helpspan' + inputId).text(getResource(widget.options().resourceKey + '.info'));
													widget.getInput().data('updated', true);
													if (options.showButtons) {
														$(revertButton).attr('disabled', false);
														$(applyButton).attr('disabled', false);
													}
												}
											},
											getUrlData: function(data) {
												return data.resources;
											},
											disabled : !options.canUpdate  || obj.readOnly || obj.disabled,
											variables: options.variables
										}, obj);
										
										makeBooleanSafe(obj);
										
										if(obj.inputType!='hidden') {
											$('#' + tab).append('<div class="propertyItem form-group" id="' + tab + '_item' + this.id + '"/>');
											$('#' + tab + '_item' + this.id).append('<label class="col-md-3 control-label">' + getResource(this.resourceKey) + '</label>');
											$('#' + tab + '_item' + this.id).append('<div class="propertyValue col-md-9" id="' + tab + '_value' + this.id + '"></div>');
										}

										if (obj.inputType == 'namePairs') {
											
											var widgetOptions = $.extend(obj, {
												values : splitFix(obj.value)
											});
											
											widget = $('#' + tab + '_value' + this.id).namePairInput(obj);
			
										} else if (obj.inputType == 'textarea' || obj.inputType == 'text' || obj.inputType == 'password' || obj.inputType == 'number') {
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

										} else if (obj.inputType == 'autoComplete') {

											var url;
											if(obj.url && options.resource) {
												url = obj.url.replace('{id}', options.resource);
											} else { 
												url = obj.url;
											}
											
											var widgetOptions = $.extend(obj, {
												url: url
											});
											
											widget = $('#' + tab + '_value' + this.id).autoComplete(widgetOptions);
											

										} else if (obj.inputType == 'countries') { 
											
											var widgetOptions = $.extend(obj, {
												values : countries,
												nameAttr: 'name',
												valueAttr: 'code'
											});
											
											widget = $('#' + tab + '_value' + this.id).autoComplete(widgetOptions);

										} else if (obj.inputType == 'multipleSelect') {

											var url;
											if(obj.url && options.resource) {
												url = obj.url.replace('{id}', options.resource);
											} else { 
												url = obj.url;
											}
											
											var widgetOptions = $.extend(obj, {
												selected : splitFix(obj.value), 
												url: url
											});
											
											widget = $('#' + tab + '_value' + this.id).multipleSelect(widgetOptions);
												
										} else if (obj.inputType == 'multipleTextInput') {
											
											var widgetOptions = $.extend(obj, {
												values : splitFix(obj.value)
											});
											
											widget = $('#' + tab + '_value' + this.id).multipleTextInput(widgetOptions);

										} else if (obj.inputType == 'date') {
											
											widget = $('#' + tab + '_value' + this.id).dateInput(obj);
											
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

										widget.getInput().addClass('propertyInput');
										widget.getInput().data('widget', widget);
										
										$('#' + tab + '_value' + this.id).append(
												'<div><span id="' + tab + '_helpspan' + this.id + '" class="help-block">' + getResource(this.resourceKey + '.info') + '</span></div>');

									});
	
							});
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

$.fn.saveProperties = function(includeAll, callback) {

	var items = new Array();
	var files = new Array();

	var invalid = false;

	$(this).find('.propertyInput').each(
		function(i, obj) {

			var widget = $(this).data('widget');

			var invalid = false;
			
			if(!validate(widget)) {
				invalid = true;
			}

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

	if(!invalid) {
		callback(items);
	}
	return invalid;

};

