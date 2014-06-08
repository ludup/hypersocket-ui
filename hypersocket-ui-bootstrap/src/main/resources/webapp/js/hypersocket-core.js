// Main content div
var contentDiv = '#content';
var currentMenu = null;
var currentRealm = null;

// jQuery plugin for Spinner control
$.fn.spin = function(opts) {
	this
			.each(function() {
				var $this = $(this), data = $this.data();

				if (data.spinner) {
					data.spinner.stop();
					delete data.spinner;
				}
				if (opts !== false) {
					data.spinner = new Spinner($.extend({ color : $this.css('color') },
						opts)).spin(this);
				}
			});
	return this;
};

$.ajaxSetup({ error : function(xmlRequest) {

	log("AJAX ERROR: " + xmlRequest.status);

	if (xmlRequest.status == 401) {
		$(document).data('session', null);
		showLogon(null, getResource("error.sessionTimeout"));
	}
}, cache : false });

$.fn.prepareProperty = function(opts, id, originalValue, resourceKey) {
	// Setup the object, merge with defaults
	$(this).data('id', id);
	$(this).data('resourceKey', resourceKey);
	$(this).data('originalValue', originalValue);
	$(this).data('metaData', opts);
	$(this).data('updated', false);
	$(this).data('restart', opts.restart);
};

$.fn.revertProperty = function() {

	if ($(this).data('isMultipleSelect')) {
		$(this).multipleSelect();
	} else if ($(this).data('isMultipleTextInput')) {
		$(this).multipleTextInput();
	} else {
		var val = $(this).data('originalValue');
		$(this).val(val);
		if ($(this).hasClass('switch-input')) {
			val = (val == 'true' ? true : false);
			var checked = $(this).prop('checked');
			log($(this).attr('id') + ' checked=' + checked + ' and has value ' + val);
			if (checked != val) {
				$(this).trigger('click');
			}
		}
		$(this).attr('checked', val ? 'checked' : '');
		$(this).data('updated', false);
	}
};

$.fn.clearProperty = function() {
	$(this).val('');
	$(this).data('updated', false);
};

$.fn.markUpdated = function() {
	$(this).data('updated', true);
};

$.fn.isUpdated = function() {
	return $(this).data('updated');
};

$.fn.propertyId = function() {
	return $(this).data('id');
};

$.fn.resourceKey = function() {
	return $(this).data('resourceKey');
};

// jQuery validate plugin for metaData input tags
$.fn.validateProperty = function() {

	obj = $(this).data('metaData');

	log("Validating " + $(this).data('resourceKey'));
	if (obj.inputType == 'number') {
		return (obj.minValue <= $(this).val() && obj.maxValue >= $(this).val());
	} else if (obj.inputType == 'textarea') {
		return true;
	} else if (obj.inputType == 'text') {
		return true;
	} else if (obj.inputType == 'select') {
		return true;
	} else if (obj.inputType == 'password') {
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
	}

	log("Validation failed for " + $(this).data('resourceKey'));
	return false;
};

$.fn.propertyPage = function(opts) {

	log("Creating property page for div " + $(this).attr('id'));

	var options = $
			.extend(
				{ showButtons : true, canUpdate : false, title : '', icon : 'fa-th' },
				opts);

	$('body').append('<div id="tabTemp"/>');
	$('#tabTemp').hide();
	if (options.additionalTabs) {
		$.each(options.additionalTabs, function(idx, obj) {
			$('#' + obj.id).appendTo('#tabTemp');
		});
	}
	$(this).empty();
	propertyDiv = $(this).attr('id');

	getJSON(
		options.url,
		null,
		function(data) {

			contentTabs = '#' + propertyDiv + 'Tabs';
			contentActions = '#' + propertyDiv + 'Actions';
			revertButton = '#' + propertyDiv + 'Revert';
			applyButton = '#' + propertyDiv + 'Apply';
			panel = '#' + propertyDiv + 'Panel';

			$('#' + propertyDiv)
					.append(
						'<div id="' + propertyDiv + 'Panel" class="panel panel-default"><div class="panel-heading"><h2><i class="fa ' + options.icon + '"></i><span class="break"></span>' + options.title + '</h2><ul id="' + propertyDiv + 'Tabs" class="nav nav-tabs"/></div><div class="panel-body"><div id="' + propertyDiv + 'Content" class="tab-content"></div></div></div>');

			if (options.showButtons) {
				$(panel)
						.append(
							'<div id="' + propertyDiv + 'Actions" class="panel-footer tabActions"><button class="btn btn-small btn-danger" id="' + propertyDiv + 'Revert"><i class="fa fa-ban"></i>' + getResource('text.revert') + '</button><button class="btn btn-small btn-primary" id="' + propertyDiv + 'Apply"><i class="fa fa-check"></i>' + getResource('text.apply') + '</button></div>');
			}

			var first = true;
			
			if(data.resources) {
			$.each(	data.resources,
						function() {

							tab = "tab" + this.id;
							$(contentTabs)
									.append(
										'<li><a ' + (first ? 'class="active clickableTab"' : 'class="clickableTab"') + ' href="#' + tab + '"><span>' + getResource(this.categoryKey + '.label') + '</span></a></li>');
							first = false;

							$('#' + propertyDiv + 'Content').append(
								'<div id="' + tab + '" class="tab-pane"/>');

							var toSort = [];
							$.each(this.templates, function() {
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

							$
									.each(
										toSort,
										function() {

											$('#' + tab)
													.append(
														'<div class="propertyItem form-group" id="' + tab + '_item' + this.id + '"/>');
											$('#' + tab + '_item' + this.id)
													.append(
														'<label class="col-md-3 control-label">' + getResource(this.resourceKey) + '</label>');
											$('#' + tab + '_item' + this.id)
													.append(
														'<div class="propertyValue col-md-9" id="' + tab + '_value' + this.id + '"></div>');

											x = JSON.parse(this.metaData);
											var obj = $.extend(
												{ restart : false, nameIsResourceKey : false }, x);
											// Following vars are
											// needed for some
											// aysnchronous calls
											var inputId = this.id;
											var inputTab = tab;
											var inputObj = this;
											if (obj.inputType == 'textarea') {
												$('#' + tab + '_value' + this.id)
														.append(
															'<textarea ' + (options.canUpdate ? '' : 'disabled ') + 'class="form-control propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '" cols="' + (obj.cols ? obj.cols : 30) + '" rows="' + (obj.rows ? obj.rows : 5) + '" maxlength="' + obj.maxlength + '">' + stripNull(this.value) + '</textarea>');
											} else if (obj.inputType == 'select') {

												$('#' + tab + '_value' + this.id)
														.append(
															'<div class="btn-group"><input id="' + tab + '_input' + this.id + '" class="propertyInput" type="hidden" name="select_value_' + this.id + '" value="' + this.value + '"><button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown"><span id="select_button_' + this.id + '">' + (obj.nameIsResourceKey ? getResource(this.value) : this.value) + '</span>&nbsp;<span class="btn-icon caret"></span></button><ul id="' + inputTab + '_select' + inputId + '" class="dropdown-menu" role="menu"></div>');
												if (obj.options) {
													for (var i = 0; i < obj.options.length; i++) {
														if (this.value == obj.options[i].value) {
															$('#select_button_' + inputId)
																	.text(
																		obj.nameIsResourceKey ? getResource(obj.options[i].name) : obj.options[i].name);
															$('#' + tab + '_select' + this.id)
																	.append(
																		'<li><a class="selectButton_' + this.id + '" href="#" data-value="' + stripNull(obj.options[i].value) + '" data-label="' + (obj.nameIsResourceKey ? getResource(obj.options[i].name) : obj.options[i].name) + '">' + (obj.nameIsResourceKey ? getResource(obj.options[i].name) : obj.options[i].name) + '</a></li>');
														} else {
															$('#' + tab + '_select' + this.id)
																	.append(
																		'<li><a class="selectButton_' + this.id + '" href="#" data-value="' + stripNull(obj.options[i].value) + '" data-label="' + (obj.nameIsResourceKey ? getResource(obj.options[i].name) : obj.options[i].name) + '">' + (obj.nameIsResourceKey ? getResource(obj.options[i].name) : obj.options[i].name) + '</a></li>');
														}
													}
													;

													$('.selectButton_' + inputId).on(
														'click',
														function(evt) {
															evt.preventDefault();
															$('#' + inputTab + '_input' + inputId).val(
																$(this).attr('data-value'));
															$('#select_button_' + inputId).text(
																$(this).attr('data-label'));
															$('#' + inputTab + '_input' + inputId)
																	.markUpdated();
															if (options.showButtons) {
																$(revertButton).attr('disabled', false);
																$(applyButton).attr('disabled', false);
															}
														});

												} else if (obj.url) {
													getJSON(
														obj.url,
														null,
														function(data) {
															$
																	.each(
																		data.resources,
																		function(idx, option) {
																			if (option.value == inputObj.value) {
																				$('#select_button_' + inputId)
																						.text(
																							obj.nameIsResourceKey ? getResource(option.name) : option.name);
																				$('#' + inputTab + '_select' + inputId)
																						.append(
																							'<li><a class="selectButton_' + inputId + '" href="#" data-value="' + stripNull(option.value) + '" data-label="' + (obj.nameIsResourceKey ? getResource(option.name) : option.name) + '">' + (obj.nameIsResourceKey ? getResource(option.name) : option.name) + '</a></li>');
																			} else {
																				$('#' + inputTab + '_select' + inputId)
																						.append(
																							'<li><a class="selectButton_' + inputId + '" href="#" data-value="' + stripNull(option.value) + '" data-label="' + (obj.nameIsResourceKey ? getResource(option.name) : option.name) + '">' + (obj.nameIsResourceKey ? getResource(option.name) : option.name) + '</a></li>');
																			}
																		});

															$('.selectButton_' + inputId).on(
																'click',
																function(evt) {
																	evt.preventDefault();
																	$('#' + inputTab + '_input' + inputId).val(
																		$(this).attr('data-value'));
																	$('#select_button_' + inputId).text(
																		$(this).attr('data-label'));
																	$('#' + inputTab + '_input' + inputId)
																			.markUpdated();
																	if (options.showButtons) {
																		$(revertButton).attr('disabled', false);
																		$(applyButton).attr('disabled', false);
																	}

																});
														});
												}

											} else if (obj.inputType == 'multipleSelect') {
												$('#' + tab + '_value' + this.id)
														.multipleSelect(
															{ metaData : obj, url : obj.url, values : obj.values, disabled : !options.canUpdate, selected : splitFix(this.value), selectAllIfEmpty : obj.selectAllIfEmpty, resourceKey : this.resourceKey, change : function() {
																$(this).markUpdated();
																if (options.showButtons) {
																	$(revertButton).attr('disabled', false);
																	$(applyButton).attr('disabled', false);
																}
															} });
											} else if (obj.inputType == 'multipleTextInput') {
												$('#' + tab + '_value' + this.id)
														.multipleTextInput(
															{ values : splitFix(this.value), disabled : !options.canUpdate, resourceKey : this.resourceKey, change : function() {
																$(this).markUpdated();
																if (options.showButtons) {
																	$(revertButton).attr('disabled', false);
																	$(applyButton).attr('disabled', false);
																}
															} });
												// $('#' + tab +
												// '_value' +
												// this.id).addClass("propertyInput");

											} else if (obj.inputType == 'password') {
												$('#' + tab + '_value' + this.id)
														.append(
															'<input ' + (options.canUpdate ? '' : 'disabled ') + 'type="password" class="form-control propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '" value="' + stripNull(this.value) + '"/>');
											} else if (obj.inputType == 'boolean') {
												$('#' + tab + '_value' + this.id)
														.append(
															'<input ' + (options.canUpdate ? '' : 'disabled ') + 'type="checkbox" class="form-control propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '" value="true"' + (stripNull(this.value) == 'true' ? ' checked' : '') + '/>');
											} else if (obj.inputType == 'switch') {

												$('#' + tab + '_value' + this.id)
														.append(
															'<label class="switch"><input ' + (options.canUpdate ? '' : 'disabled ') + 'type="checkbox" class="switch-input propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '" value="true"' + (stripNull(this.value) == 'true' ? ' checked' : '') + '><span class="switch-label" data-on="' + getResource("text.on") + '" data-off="' + getResource("text.off") + '"></span> <span class="switch-handle"></span></label>');

											} else if (obj.inputType == 'image') {
												$('#' + tab + '_value' + this.id)
														.append(
															'<input ' + (options.canUpdate ? '' : 'disabled ') + 'type="file" class="form-control propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '"/>');
												$('#' + tab + '_value' + this.id)
														.append(
															'<img class="imagePreview" src="' + this.value + '">');
												var input = $('#' + tab + '_input' + this.id);
												input.change(function() {
													var reader = new FileReader();
													reader.onload = function(readerEvt) {
														var binaryString = readerEvt.target.result;
														var encoded = btoa(binaryString);
														var fileName = input.val().split('/').pop().split(
															'\\').pop();
														input.data('encoded', fileName + ";" + encoded);
													};
													reader.readAsBinaryString(input[0].files[0]);
												});

											} else if (obj.inputType == 'slider') {

												$('#' + tab + '_value' + this.id)
														.append(
															'<div id="slider_' + this.id + '" class="slider"></div><input class="propertyInput" id="' + tab + '_input' + this.id + '" type="hidden" name="' + tab + '_input' + this.id + '" value="' + this.value + '"/><div class="slider-value"><span id="slider_value_' + this.id + '">' + this.value + ' ' + getResource(obj.labelResourceKey) + '</span></div>');
												$('#slider_' + this.id)
														.slider(
															{ min : obj.minValue, max : obj.maxValue, value : parseInt(this.value), range : 'min' });
												var valueElement = $('#slider_value_' + this.id);
												var valueInput = $('#' + tab + '_input' + this.id);
												$('#slider_' + this.id)
														.slider(
															{ change : function(event, ui) {
																valueElement
																		.text(ui.value + ' ' + getResource(obj.labelResourceKey));
																valueInput.val(ui.value);
																valueInput.data('updated', true);
																$(revertButton).attr('disabled', false);
																$(applyButton).attr('disabled', false);
															} });
											} else {
												$('#' + tab + '_value' + this.id)
														.append(
															'<input ' + (options.canUpdate ? '' : 'disabled ') + 'type="text" class="form-control propertyInput" id="' + tab + '_input' + this.id + '" size="' + (obj.size ? obj.size : 30) + '" placeholder="' + (obj.placeholder ? obj.placeholder : '') + '" maxlength="' + (obj.maxlength ? obj.maxlength : '') + '" name="input' + this.id + '" value="' + stripNull(this.value) + '"/>');
											}

											$('#' + tab + '_value' + this.id)
													.append(
														'<div><span class="help-block">' + getResource(this.resourceKey + '.info') + '</span></div>');

											$('#' + tab + '_input' + this.id).prepareProperty(obj,
												this.id, this.value, this.resourceKey);

											$('#' + tab + '_input' + this.id)
													.change(
														function() {
															$('#' + tab + '_error' + this.id).remove();
															if ($(this).validateProperty()) {
																$(this).markUpdated();
																if (options.showButtons) {
																	$(revertButton).attr('disabled', false);
																	$(applyButton).attr('disabled', false);
																}
															} else {
																if ($('#error' + this.id).length == 0) {
																	$(this)
																			.after(
																				'<span id="' + tab + '_error' + this.id + '" class="ui-icon ui-icon-alert"></span>');
																}
																if (options.showButtons) {
																	$(revertButton).attr('disabled', true);
																	$(applyButton).attr('disabled', true);
																}
															}
														});

										});

						});
		}
			if (options.additionalTabs) {
				$
						.each(
							options.additionalTabs,
							function() {
								$(contentTabs)
										.append(
											'<li id="' + this.id + 'Li"><a href="#' + this.id + '" class="clickableTab"><span>' + this.name + '</span></a></li>');
								$('#' + this.id).appendTo('#' + propertyDiv + 'Content');
								$('#' + this.id).addClass('tab-pane');
							});
			}

			$('#tabTemp').remove();

			$('.clickableTab').click(function(e) {
				e.preventDefault();
				$(this).tab('show');
			});

			$('.clickableTab').first().tab('show');

			// $('#' + propertyDiv + 'Content').tabs();

			if (options.showButtons) {
				$(revertButton).attr('disabled', true);
				$(applyButton).attr('disabled', true);

				$(revertButton).click(function() {
					$('.propertyInput').each(function(i, obj) {
						$(this).revertProperty();
					});
					$(revertButton).attr('disabled', true);
					$(applyButton).attr('disabled', true);
				});
				$(applyButton).click(function() {

					$('#' + propertyDiv).saveProperties(false, function(items) {
						postJSON(options.url, items, function(data) {

							if (data.success) {
								showInformation(false, data.message);
								$('#' + propertyDiv).saveCompleted();
							} else {
								showError(false, data.message);
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
		$('#' + obj.id).revertProperty();
	});
};

$.fn.clearProperties = function() {
	$('.propertyInput', '#' + $(this).attr('id')).each(function(i, obj) {
		$('#' + obj.id).clearProperty();
	});
};

$.fn.saveProperties = function(includeAll, callback) {

	var items = new Array();
	var files = new Array();

	var restart = false;

	$('.propertyInput', '#' + $(this).attr('id')).each(
		function(i, obj) {

			var item = $('#' + obj.id);

			log("Checking property " + item.data('resourceKey'));

			restart |= item.data("restart");
			if (item.data('isMultipleSelect') || item.data('isMultipleTextInput')) {
				if (includeAll || item.data('updated')) {
					items.push(new PropertyItem(item.data('resourceKey'), item
							.multipleSelectValues({ isProperty : true }).join("]|[")));
				}
			} else {
				if (includeAll || item.isUpdated()) {
					log('Updating ' + item.data('resourceKey'));
					if (item.attr('type') == "checkbox") {
						items.push(new PropertyItem(item.data('resourceKey'), item
								.prop("checked") ? "true" : "false"));
					} else if (item.attr('type') == "file") {
						items.push(new PropertyItem(item.data('resourceKey'), item
								.data('encoded')));
					} else {
						items.push(new PropertyItem(item.data('resourceKey'), item.val()));
					}
				}
			}
		});

	callback(items);

	return restart;

};

$.fn.saveCompleted = function() {

	$('.propertyInput', '#' + $(this).attr('id')).each(function(i, obj) {

		var item = $('#' + obj.id);

		if (item.data('multipleSelect')) {
			item.data('updated', false);
		} else {
			item.data('updated', false);
			item.data('originalValue', item.val());
		}
	});
};

$.fn.multipleSelectValues = function(data) {

	result = new Array();

	var id = $(this).attr('id');
	id += 'IncludedSelect';

	$('#' + id + ' option').each(function() {
		result.push($(this).val());
	});
	return result;
};


$.fn.selectButton = function(data) {
	
	var obj = $.extend(
		{ idAttr: 'id', nameAttr: 'name', valueAttr: 'value', nameAttrIsResourceKey : false, 
			resourceKeyTemplate: '{0}', disabled : false, value: '' }, data);
	
	var id = obj.id;

	$(this).append('<div class="btn-group"><input id="' 
			 + id + '" class="propertyInput" type="hidden" name="select_value_' + id + '" value="'
			 + obj.value + '"><button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown"><span id="select_button_' 
			 + id + '">' + (obj.nameIsResourceKey ? getResource(obj.name) : obj.name) + '</span>&nbsp;<span class="btn-icon caret"></span></button><ul id="'
			 + 'select_' + id + '" class="dropdown-menu" role="menu"></div>');

	var selected = null;
	
	if (obj.options) {
		for (var i = 0; i < obj.options.length; i++) {
			if (obj.value == obj.options[i]['valueAttr']) {
				selected = obj.options[i];
				$('#select_button_' + id).text(obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i]['nameAttr'])) : obj.options[i]['nameAttr']);
				$('#select_' + id).append('<li><a id="data_' + obj.options[i][obj['nameAttr']] + '" class="selectButton_' + id + '" href="#" data-value="' 
						+ stripNull(obj.options[i][obj['valueAttr']]) + '" data-label="' 
						+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj['nameAttr']])) : obj.options[i][obj['nameAttr']]) + '">' 
						+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj['nameAttr']])) : obj.options[i][obj['nameAttr']]) + '</a></li>');
			} else {
				$('#select_' + id).append('<li><a id="data_' + obj.options[i][obj['nameAttr']] + '" class="selectButton_' + id + '" href="#" data-value="' 
						+ stripNull(obj.options[i][obj['valueAttr']]) + '" data-label="'
						+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj['nameAttr']])) : obj.options[i][obj['nameAttr']]) + '">'
						+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(obj.options[i][obj['nameAttr']])) : obj.options[i][obj['nameAttr']]) + '</a></li>');
			}
			$('#data_' + obj.options[i][obj['nameAttr']]).data('scheme', obj.options[i]);
		}
		

		$('.selectButton_' + id).on(
			'click',
			function(evt) {
				evt.preventDefault();
				$('#' + id).val($(this).attr('data-value'));
				$('#select_button_' + id).text($(this).attr('data-label'));
				$('#' + id).markUpdated();
				if(obj.changed) {
					obj.changed($(this).data('scheme'));
				}
			});
		
			if(obj.changed) {
				obj.changed(selected);
			}

	} else if (obj.url) {
		getJSON(obj.url, null,
			function(data) {
				$.each(data.resources, function(idx, option) {
								if (option[obj['valueAttr']] == obj.value) {
									selected = option;
									$('#select_button_' + id).text(obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]);
									$('#select_' + id).append('<li><a id="data_' + option[obj['nameAttr']] + '" class="selectButton_' + id + '" href="#" data-value="' 
											+ stripNull(option[obj['valueAttr']]) + '" data-label="' 
											+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]) + '">' 
											+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]) + '</a></li>');
								} else {
									$('#select_' + id).append('<li><a id="data_' + option[obj['nameAttr']] + '" class="selectButton_' + id + '" href="#" data-value="' 
											+ stripNull(option[obj['valueAttr']]) + '" data-label="' 
											+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]) + '">' 
											+ (obj.nameIsResourceKey ? getResource(obj.resourceKeyTemplate.format(option[obj['nameAttr']])) : option[obj['nameAttr']]) + '</a></li>');
								}
								$('#data_' + option[obj['nameAttr']]).data('scheme', option);
							});
		
				$('.selectButton_' + id).on(
					'click',
					function(evt) {
						evt.preventDefault();
						$('#' + id).val($(this).attr('data-value'));
						$('#select_button_' + id).text($(this).attr('data-label'));
						$('#' + id).markUpdated();
						if(obj.changed) {
							obj.changed($(this).data('scheme'));
						}
					});
				
				if(obj.changed) {
					obj.changed(selected);
				}
			});
	}

}

$.fn.multipleSelect = function(data) {

	if ($(this).data('created')) {

		options = $(this).data('options');
		if ((options.selected && options.selected.length == 0) && options.selectAllIfEmpty) {
			var allExcludedOptions = $('#' + $(this).attr('id') + 'ExcludedSelect option');
			if (allExcludedOptions.length > 0) {
				$('#' + $(this).attr('id') + 'IncludedSelect').append(
					$(allExcludedOptions).clone());
				$(allExcludedOptions).remove();
			}
			;
		} else {
			var allIncludedOptions = $('#' + $(this).attr('id') + 'IncludedSelect option');
			if (allIncludedOptions.length > 0) {
				$('#' + $(this).attr('id') + 'ExcludedSelect').append(
					$(allIncludedOptions).clone());
				$(allIncludedOptions).remove();
			}
			;
		}
		var select = $('#' + $(this).attr('id') + 'ExcludedSelect');
		var toSelect = $('#' + $(this).attr('id') + 'IncludedSelect');

		if (options.selected) {
			$
					.each(
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
			$
					.each(
						data.insert,
						function(idx, obj) {

							select
									.append('<option ' + 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? (getResource(obj[options.nameAttr]) == undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
						});
		}

		if (data && data.remove) {
			$
					.each(
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
			$
					.each(
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

		return;

	} else {

		var options = $
				.extend(
					{ idAttr : 'id', nameAttr : 'name', nameAttrIsResourceKey : false, selectAllIfEmpty : false, selectedIsObjectList : false, isPropertyInput : true, disabled : false },
					data);

		$(this).data('resourceKey', options.resourceKey);
		$(this).data('created', true);
		$(this).data('isMultipleSelect', true);
		$(this).data('updated', false);
		$(this).data('options', options);

		if (options.isPropertyInput) {
			$(this).addClass('propertyInput');
		}

		$('#' + $(this).attr('id') + 'Excluded').remove();
		$('#' + $(this).attr('id') + 'Buttons').remove();
		$('#' + $(this).attr('id') + 'Included').remove();

		$(this).addClass('container-fluid');
		if (getResourceNoDefault(options.resourceKey + '.' + $(this).attr('id') + '.tooltip') != undefined) {
			$(this)
					.append(
						'<div class="multiselectTooltip"><span id="' + $(this).attr('id') + 'Tooltip" class="ui-icon ui-icon-info" title="' + getResource(options.resourceKey + '.' + $(
							this).attr('id') + '.tooltip') + '"></span></div>');
			$('#' + $(this).attr('id') + 'Tooltip').tooltip();
		}
		$(this)
				.append(
					'<div class="excludedList col-md-5" id="' + $(this).attr('id') + 'Excluded"><label>' + getResource('text.excluded') + '</label></div>');
		$('#' + $(this).attr('id') + 'Excluded')
				.append(
					'<select ' + (!options.disabled ? '' : 'disabled ') + 'multiple="multiple" id="' + $(
						this).attr('id') + 'ExcludedSelect" class="formInput text form-control"/>');

		$(this).append(
			'<div class="listButtons" id="' + $(this).attr('id') + 'Buttons"/>');
		$('#' + $(this).attr('id') + 'Buttons')
				.append(
					'<button class="btn-multiple-select btn btn-primary" id="' + $(this)
							.attr('id') + 'AddButton"><i class="fa fa-chevron-circle-right"></i></button><br/>');
		$('#' + $(this).attr('id') + 'Buttons')
				.append(
					'<button class="btn-multiple-select btn btn-primary" id="' + $(this)
							.attr('id') + 'RemoveButton"><i class="fa fa-chevron-circle-left"></i></button>');
		$(this)
				.append(
					'<div class="includedList col-md-5" id="' + $(this).attr('id') + 'Included"><label>' + getResource('text.included') + '</label></div>');
		$('#' + $(this).attr('id') + 'Included')
				.append(
					'<select ' + (!options.disabled ? '' : 'disabled ') + 'multiple="multiple" id="' + $(
						this).attr('id') + 'IncludedSelect" class="formInput text form-control"/>');

		$('#' + $(this).attr('id') + 'AddButton').button();
		$('#' + $(this).attr('id') + 'RemoveButton').button();

		var property = $(this);
		var select = $('#' + $(this).attr('id') + 'ExcludedSelect');
		var toSelect = $('#' + $(this).attr('id') + 'IncludedSelect');

		$('#' + $(this).attr('id') + 'AddButton').click(function(e) {
			var selectedOpts = $('#' + select.attr('id') + ' option:selected');
			if (selectedOpts.length == 0) {
				e.preventDefault();
			}

			toSelect.append($(selectedOpts).clone());
			$(selectedOpts).remove();
			e.preventDefault();

			property.data('updated', true);
			if (data.change) {
				data.change();
			}
		});

		$('#' + $(this).attr('id') + 'RemoveButton').click(function(e) {
			var selectedOpts = $('#' + toSelect.attr('id') + ' option:selected');
			if (selectedOpts.length == 0) {
				e.preventDefault();
			}

			select.append($(selectedOpts).clone());
			$(selectedOpts).remove();
			e.preventDefault();

			property.data('updated', true);

			if (data.change) {
				data.change();
			}
		});

	}

	if (options.values) {

		$
				.each(
					options.values,
					function(idx, obj) {

						var selectItem = ((!options.selected || (options.selected && options.selected.length == 0)) && options.selectAllIfEmpty ? toSelect : select);
						selectItem
								.append('<option ' + 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? (getResource(obj[options.nameAttr]) == undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
					});

		if (options.selected) {
			$
					.each(
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

	} else if (options.url) {
		getJSON(
			options.url,
			null,
			function(data) {
				$
						.each(
							data.resources,
							function(idx, obj) {
								var selectItem = ((!options.selected || (options.selected && options.selected.length == 0)) && options.selectAllIfEmpty ? toSelect : select);
								selectItem
										.append('<option ' + 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? (getResource(obj[options.nameAttr]) == undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
							});

				if (options.selected) {
					$
							.each(
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
			});
	}

};

$.fn.multipleTextInput = function(data) {

	if ($(this).data('created')) {

		options = $(this).data('options');

		var inputText = $('#' + $(this).attr('id') + 'ExcludedSelect');
		inputText.val('');
		var allIncludedOptions = $('#' + $(this).attr('id') + 'IncludedSelect option');
		if (allIncludedOptions.length > 0) {
			$(allIncludedOptions).remove();
		}
		;

		var toSelect = $('#' + $(this).attr('id') + 'IncludedSelect');

		if (options.values) {
			$.each(options.values, function(idx, obj) {
				toSelect
						.append('<option ' + 'value="' + obj + '">' + obj + "</option>");
			});
		}

		// if(data && data.insert) {
		// $.each(data.insert, function(idx, obj) {
		//				
		// select.append('<option '
		// + 'value="' + obj[options.idAttr] + '">' +
		// (options.nameAttrIsResourceKey ?
		// (getResource(obj[options.nameAttr])==undefined ?
		// obj[options.nameAttr] : getResource(obj[options.nameAttr])) :
		// obj[options.nameAttr]) + "</option>");
		// });
		// }

		// if(data && data.remove) {
		// $.each(data.remove, function(idx, obj) {
		// if(options.selectedIsObjectList) {
		// selectedOpt = $('#' + select.attr('id') + ' option[value="' +
		// obj[options.idAttr] + '"]');
		// if(!selectedOpt) {
		// selectedOpt = $('#' + toSelect.attr('id') + ' option[value="' +
		// obj[options.idAttr] + '"]');
		// }
		// } else {
		// selectedOpt = $('#' + select.attr('id') + ' option[value="' + obj +
		// '"]');
		// if(!selectedOpt) {
		// selectedOpt = $('#' + toSelect.attr('id') + ' option[value="' + obj +
		// '"]');
		// }
		// }
		// if(selectedOpt) {
		// $(selectedOpt).remove();
		// }
		// });
		// }

		// if(data && data.selected) {
		// $.each(data.selected, function(idx, id) {
		// var selectedOpt;
		// if(options.selectedIsObjectList) {
		// selectedOpt = $('#' + select.attr('id') + ' option[value="' +
		// id[options.idAttr] + '"]');
		// } else {
		// selectedOpt = $('#' + select.attr('id') + ' option[value="' + id +
		// '"]');
		// }
		// if(selectedOpt) {
		// toSelect.append($(selectedOpt).clone());
		// $(selectedOpt).remove();
		// }
		// });
		// }

		return;

	} else {

		var options = $
				.extend(
					{ idAttr : 'id', nameAttr : 'name', nameAttrIsResourceKey : false, selectAllIfEmpty : false, selectedIsObjectList : false, isPropertyInput : true, disabled : false },
					data);

		$(this).data('created', true);
		$(this).data('isMultipleTextInput', true);
		$(this).data('options', options);

		$('#' + $(this).attr('id') + 'Excluded').remove();
		$('#' + $(this).attr('id') + 'Buttons').remove();
		$('#' + $(this).attr('id') + 'Included').remove();

		if (getResourceNoDefault(options.resourceKey + '.' + $(this).attr('id') + '.tooltip') != undefined) {
			$(this)
					.append(
						'<div class="multisearchTooltip"><span id="' + $(this).attr('id') + 'Tooltip" class="ui-icon ui-icon-info" title="' + getResource(options.resourceKey + '.' + $(
							this).attr('id') + '.tooltip') + '"></span></div>');
			$('#' + $(this).attr('id') + 'Tooltip').tooltip();
		}
		// $(this).append('<div class="excludedList" id="' + $(this).attr('id')
		// + 'Excluded"><label>' + getResource('text.excluded') +
		// '</label></div>');
		$(this)
				.append(
					'<div class="excludedList" id="' + $(this).attr('id') + 'Excluded"></div>');
		$('#' + $(this).attr('id') + 'Excluded')
				.append(
					'<input type="text" ' + (!options.disabled ? '' : 'disabled ') + 'id="' + $(
						this).attr('id') + 'ExcludedSelect" class="formInput text form-control" />');

		$(this)
				.append(
					'<div class="multipleTextInputButtons" id="' + $(this).attr('id') + 'Buttons"/>');
		$('#' + $(this).attr('id') + 'Buttons').append(
			'<button id="' + $(this).attr('id') + 'AddButton">&gt;</button><br/>');
		$('#' + $(this).attr('id') + 'Buttons').append(
			'<button id="' + $(this).attr('id') + 'RemoveButton">&lt;</button>');
		// $(this).append('<div class="includedList" id="' + $(this).attr('id')
		// + 'Included"><label>' + getResource('text.included') +
		// '</label></div>');
		$(this)
				.append(
					'<div class="includedList" id="' + $(this).attr('id') + 'Included"></div>');
		$('#' + $(this).attr('id') + 'Included')
				.append(
					'<select ' + (!options.disabled ? '' : 'disabled ') + 'multiple="multiple" id="' + $(
						this).attr('id') + 'IncludedSelect" class="formInput text form-control' + (options.isPropertyInput ? ' propertyInput' : '') + '"/>');

		$('#' + $(this).attr('id') + 'AddButton').button();
		$('#' + $(this).attr('id') + 'RemoveButton').button();

		var select = $('#' + $(this).attr('id') + 'ExcludedSelect');
		var toSelect = $('#' + $(this).attr('id') + 'IncludedSelect');

		$('#' + $(this).attr('id') + 'AddButton')
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

		$('#' + $(this).attr('id') + 'RemoveButton').click(function(e) {
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

	toSelect.data('id', options.resourceKey);
	toSelect.data('restart', options.restart);
	toSelect.data('updated', false);

	if (options.values) {

		$.each(options.values, function(idx, obj) {
			toSelect.append('<option ' + 'value="' + obj + '">' + obj + "</option>");
		});

		// if(options.selected) {
		// $.each(options.selected, function(idx, id) {
		// var selectedOpt;
		// if(options.selectedIsObjectList) {
		// selectedOpt = $('#' + select.attr('id') + ' option[value="' +
		// id[options.idAttr] + '"]');
		// } else {
		// selectedOpt = $('#' + select.attr('id') + ' option[value="' + id +
		// '"]');
		// }
		// if(selectedOpt) {
		// toSelect.append($(selectedOpt).clone());
		// $(selectedOpt).remove();
		// }
		// });
		// }

	}
	// else if(options.url) {
	// getJSON(options.url, null, function(data) {
	// $.each(data.interfaces, function(idx, obj) {
	// var selectItem = ((!options.selected || (options.selected &&
	// options.selected.length == 0)) && options.selectAllIfEmpty ? toSelect :
	// select);
	// selectItem.append('<option '
	// + 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey
	// ?
	// (getResource(obj[options.nameAttr])==undefined ? obj[options.nameAttr] :
	// getResource(obj[options.nameAttr])) : obj[options.nameAttr]) +
	// "</option>");
	// });
	//			
	// if(options.selected) {
	// $.each(options.selected, function(idx, id) {
	// var selectedOpt;
	// if(options.selectedIsObjectList) {
	// selectedOpt = $('#' + select.attr('id') + ' option[value="' +
	// id[options.idAttr] + '"]');
	// } else {
	// selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
	// }
	// if(selectedOpt) {
	// toSelect.append($(selectedOpt).clone());
	// $(selectedOpt).remove();
	// }
	// });
	// }
	// });
	// }

};

$.fn.ajaxResourcePage = function(params) {

	var divName = $(this).attr('id');

	log("Creating ajax resource page for div " + divName);

	var options = $
			.extend(
				{ divName : divName, canCreate : false, canUpdate : false, canDelete : false, icon : 'fa-cog' },
				params);

	$(this).data('options', options);

	$(this)
			.append(
				'<div class="panel panel-default"><div class="panel-heading"><h2><i class="fa ' + options.icon + '"></i><span class="break">' + options.title + '</span></h2></div><div id="' + divName + 'Panel" class="panel-body"><table class="table table-striped" id="' + divName + 'Table' + '"><thead><tr id="' + divName + 'TableHeader"></tr></thead></table></div><div id="' + divName + 'Actions" class="tabActions panel-footer"/></div>');

	$('div[dialog-for="' + divName + '"]').resourceDialog(options);

	var columns = new Array();
	var columnsDefs = new Array();

	$
			.each(
				options.fields,
				function(idx, obj) {
					$('#' + divName + 'TableHeader')
							.append(
								'<th>' + getResource(options.resourceKey + "." + obj.name + '.label') + '</th>');
					columns.push({ "mData" : obj.name, });
					if (obj.isResourceKey) {
						columnsDefs
								.push({ "aTargets" : [ idx ], "mData" : null, "mRender" : function(data, type, full) {
									return getResource(options.resourceKey + "." + data + '.label');
								} });
					}
				});

	var renderActions = function(idCol) {
		var id = idCol.aData.id;
		var renderedActions = '';

		if (options.additionalActions) {
			$
					.each(
						options.additionalActions,
						function(x, act) {
							if (act.enabled) {

								renderedActions += '<a class="btn ' + (act.buttonClass ? act.buttonClass : 'btn-success') + ' row-' + act.resourceKey + '" href="#"><i class="fa ' + act.iconClass + '"></i></a>';

								$(document).off('click',
									'#' + divName + 'Actions' + id + ' .row-' + act.resourceKey);

								$(document).on(
									'click',
									'#' + divName + 'Actions' + id + ' .row-' + act.resourceKey,
									function() {
										var curRow = $('#' + divName + 'Table').dataTable()
												.fnGetPosition($(this).closest("tr").get(0));
										var resource = $('#' + divName + 'Table').dataTable()
												.fnGetData(curRow);
										act.action(resource);
									});
							}

						});
		}

		if (options.canUpdate) {
			renderedActions += '<a class="btn btn-info row-edit" href="#"><i class="fa fa-edit"></i></a>';

			$(document).off('click', '#' + divName + 'Actions' + id + ' .row-edit');

			$(document).on(
				'click',
				'#' + divName + 'Actions' + id + ' .row-edit',
				function() {
					var curRow = $('#' + divName + 'Table').dataTable().fnGetPosition(
						$(this).closest("tr").get(0));
					var resource = $('#' + divName + 'Table').dataTable().fnGetData(
						curRow);
					$('div[dialog-for="' + divName + '"]').resourceDialog('edit',
						{ row : curRow, resource : resource });
				});
		}

		if (options.canDelete) {
			renderedActions += '<a class="btn btn-danger row-delete" href="#"><i class="fa fa-trash-o"></i></a>';

			$(document).off('click', '#' + divName + 'Actions' + id + ' .row-delete');

			$(document).on(
				'click',
				'#' + divName + 'Actions' + id + ' .row-delete',
				function() {

					log("Entering resource delete for id " + id);

					//$(document).data('modal', true);

					var row = $(this).closest("tr").get(0);
					var resource = $('#' + divName + 'Table').dataTable().fnGetData(row);

					bootbox.confirm(getResource(options.resourceKey + ".delete.desc")
							.format(resource.name), function(confirmed) {
						if (confirmed) {
							deleteJSON(options.resourceUrl + "/" + id, null, function(data) {
								if (data.success) {
									if (options.resourceDeleted) {
										options.resourceDeleted(resource);
									}
									$('#' + divName + 'Table').dataTable().fnDeleteRow(row);
									showInformation(true, data.message);
								} else {
									bootbox.alert(data.message);
								}
							});
						}
					});
				});
		}

		return '<div id="' + divName + 'Actions' + id + '" class="tableActions">' + renderedActions + '</div>';
	};

	$('#' + divName + 'TableHeader').append(
		'<th localize="text.actions" class="col-md-2"></th>');
	columns.push({ "mData" : null, 
		"fnRender" : renderActions, 
		"bAutoWidth" : false, 
		"sWidth" : "150px", 
		"bSortable" : false 
		});

	$('#' + divName + 'Table')
			.dataTable(
				{ "bProcessing" : true, 
					"bServerSide" : true, 
					"sAjaxSource" : basePath + "/api/" + options.tableUrl, 
					"iDisplayLength": 10,
					"aoColumns" : columns, 
					"aoColumnDefs" : columnsDefs });

	if (options.canCreate) {

		$('#' + divName + 'Actions')
				.append(
					'<button id="' + divName + 'Add" class="btn btn-primary"><i class="fa fa-plus-circle"></i>' + getResource('text.add') + '</button>');
		$('#' + divName + 'Add').click(function() {
			if (options.showCreate) {
				options.showCreate();
			}
			$('div[dialog-for="' + divName + '"]').resourceDialog('create');
		});
	}
	
	if(options.additionalButtons) {
		
		$.each(options.additionalButtons, function() {
			$('#' + divName + 'Actions').append(
				'<button id="' + this.resourceKey + '" class="btn ' + this.buttonClass + '"><i class="fa ' + this.icon + '"></i>' + getResource(this.resourceKey + '.label') + '</button>');
			var button = this;
			$('#' + this.resourceKey).click(function() {
				if(button.action) {
					button.action();
				}
			});
		});
	}

	if (options.complete) {
		options.complete();
	}

};

$.fn.resourceDialog = function(params, params2) {

	var dialog = $(this);
	var parent = $(this).parent();
	var options = $.extend(
		{ dialogWidth : 700, dialogHeight : 'auto', hasResourceTable : true },
		params);
	var dialogOptions = $(this).data('options');

	if (params === 'create') {

		log("Creating resource dialog");

		dialogOptions.clearDialog();
		dialog.resourceDialog('error', 'reset');

		$(this).find('.modal-title').text(
			getResource(dialogOptions.resourceKey + '.create.title'));
		$(this).appendTo('body');

		$(this).find('.modal-footer').empty();
		$(this)
				.find('.modal-footer')
				.append(
					'<button type="button" id="' + $(this).attr('id') + 'Action" class="btn btn-primary">' + getResource("text.create") + '</button>');
		$('#' + $(this).attr('id') + "Action").off('click');
		$('#' + $(this).attr('id') + "Action").on(
			'click',
			function() {
				log("Creating resource");

				if (dialogOptions.validate) {
					if (!dialogOptions.validate()) {
						log("Resource validation failed");
						return;
					}
				}
				var resource = dialogOptions.createResource();

				log("Created resource object for posting");

				postJSON(dialogOptions.resourceUrl, resource, function(data) {
					if (data.success) {
						log("Resource object created");
						dialog.resourceDialog('close');
						if (dialogOptions.hasResourceTable) {
							$('#' + dialogOptions.divName + 'Table').dataTable().fnAddData(
								data.resource);
						}
						if (dialogOptions.resourceCreated) {
							dialogOptions.resourceCreated(data.resource);
						}
						showInformation(true, data.message);
					} else {
						log("Resource object creation failed " + data.message);
						dialog.resourceDialog('error', data.message);
					}
				});
			});
		dialog.modal('show');

	} else if (params === 'edit') {

		dialogOptions.clearDialog();
		dialog.resourceDialog('error', 'reset');
		dialogOptions.displayResource(params2.resource);
		$(this).find('.modal-title').text(
			getResource(dialogOptions.resourceKey + '.update.title'));
		$(this).appendTo('body');

		$(this).find('.modal-footer').empty();
		$(this)
				.find('.modal-footer')
				.append(
					'<button type="button" id="' + $(this).attr('id') + 'Action" class="btn btn-primary">' + getResource("text.update") + '</button>');
		$('#' + $(this).attr('id') + "Action").off('click');
		$('#' + $(this).attr('id') + "Action").on(
			'click',
			function() {

				if (dialogOptions.validate) {
					if (!dialogOptions.validate()) {
						return;
					}
				}
				var resource = dialogOptions.createResource();

				postJSON(dialogOptions.resourceUrl, resource, function(data) {
					if (data.success) {
						dialog.resourceDialog('close');
						if (dialogOptions.hasResourceTable) {
							$('#' + dialogOptions.divName + 'Table').dataTable().fnUpdate(
								data.resource, params2.row);
						}
						if (dialogOptions.resourceUpdated) {
							dialogOptions.resourceUpdated(data.resource);
						}
						showInformation(true, data.message);
					} else {
						dialog.resourceDialog('error', data.message);
					}
				});

			});
		dialog.modal('show');

	} else if (params === 'close') {
		dialog.modal('hide');
	} else if (params === 'error') {

		$(this).find('.dialogError')

		$('#dialogErrorHighlight' + $(this).attr('id'), $(this)).remove();

		if (params2 != 'reset') {
			$(this)
					.prepend(
						'<div id="dialogErrorHighlight' + $(this).attr('id') + '" class="alert alert-danger"/>');
			$('#dialogErrorHighlight' + $(this).attr('id'))
					.append(
						'<i class="fa fa-warning"></i>&nbsp;&nbsp;<span>' + (getResourceNoDefault(params2) == undefined ? params2 : getResource(params2)) + '</span>');
		}
	} else {
		if (!options.resourceKey) {
			alert("Bad usage, resourceKey not set");
		} else {
			$(this).data('options', options);
		}
	}
};

function splitFix(value) {
	var result = value.split(']|[');
	if (result.length == 1) {
		if (result[0] == "") {
			return [];
		}
	}
	return result;
}

function PropertyItem(id, value) {
	this.id = id;
	this.value = value;
}

var progressOptions = { lines : 11, // The number of lines to draw
length : 0, // The length of each line
width : 3, // The line thickness
radius : 7, // The radius of the inner circle
corners : 1, // Corner roundness (0..1)
rotate : 0, // The rotation offset
color : '#fff', // #rgb or #rrggbb
speed : 1, // Rounds per second
trail : 46, // Afterglow percentage
shadow : false, // Whether to render a shadow
hwaccel : false, // Whether to use hardware acceleration
className : 'spinner', // The CSS class to assign to the spinner
zIndex : 2e9, // The z-index (defaults to 2000000000)
top : 'auto', // Top position relative to parent in px
left : 'auto' // Left position relative to parent in px
};

function showBusy() {

	log("Showing busy");

	if ($('#progress')) {
		$('#progress').spin(progressOptions);
	}
};

function hideBusy() {

	log("Hiding busy");

	if ($('#progress')) {
		$('#progress').spin(false);
	}
};

/**
 * Clear the main content div
 */
function clearContent() {
	log("Clearing content");
	$('#informationBar').empty();
	$(contentDiv).empty();
};

function showLogon(credentials, message) {

	log("Showing logon");

	$('div[role="dialog"]').remove();
	$('#actionLogoff').remove();
	$('#nav').hide();
	$('#navMenu').empty();
	$.getJSON('../api/logon', credentials, function(data) {

		processLogon(data, message);

	});
}

function processLogon(data, message) {
	log("Received logon data");

	$('#copyright').empty();
	$('#copyright')
			.append(
				"<p>" + getResource("label.version") + " " + data.version + "</p><p>&copy; 2013-2014 Hypersocket Limited. All rights reserved.</p>");

	if (!data.success) {

		log("Logon form present");

		clearContent();

		$(contentDiv).append(
			'<form id="logonForm" class="form-signin" role="form">');

		$('#currentRealm').remove();
		$('#lang').remove();
		$('#navMenu').empty();

		if (data.showLocales) {
			$('#navMenu')
					.append(
						'<li class="navicon" id="langMenu" class="dropdown"><a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="fa fa-globe"></i></a></li>');
			$('#langMenu')
					.append(
						'<ul id="lang" class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1"></ul>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("en") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("da") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("nl") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("fi") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("fr") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("de") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("it") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("no") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("pl") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("ru") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("sv") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("es") + '</li>');
			$('#lang')
					.append(
						'<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + getResource("ja") + '</li>');

			$('#lang').change(function() {

				log("Switching language to " + this.value);

				getJSON('switchLanguage/' + this.value, null, function() {
					document.location.reload();
				});
			});
		}

		if (data['errorMsg']) {
			$('#logonForm')
					.append(
						'<h2 class="form-signin-heading">' + (data.lastErrorIsResourceKey ? getResource(data['errorMsg']) : data['errorMsg']) + '</h2>');
		} else if (message) {
			$('#logonForm').append(
				'<h2 class="form-signin-heading">' + message + '</h2>');
		} else {
			$('#logonForm').append('<h2 class="form-signin-heading"></h2>');
		}

		$('#logonForm').attr("action", "../api/logon").attr("method", "post");
		$
				.each(
					data['formTemplate']['inputFields'],
					function() {

						if (this.type == 'hidden') {
							$('#logonForm')
									.append(
										'<input type="' + this.type + '" name="' + this.resourceKey + '" id="' + this.resourceKey + '" value="' + this.defaultValue + '"/>');
							return;
						} else if (this.type == 'p') {
							$('#logonForm').append('<p>' + this.defaultValue + '</p>');
							return;
						}

						if (this.type == 'select') {
							$('#logonForm')
									.append(
										'<select class="logonSelect" name="' + this.resourceKey + '" id="' + this.resourceKey + '"/>');
							currentKey = this.resourceKey;
							$
									.each(
										this.options,
										function() {
											option = '<option';
											if (this.selected) {
												option += ' selected';
											}
											if (this.value) {
												option += ' value="' + this.value + '"';
											}
											option += '>' + (this.isNameResourceKey ? getResource(this.name) : this.name) + '</option>';
											$('#' + currentKey).append(option);
										});

						} else {
							$('#logonForm')
									.append(
										'<input class="form-control" type="' + this.type + '" name="' + this.resourceKey + '" placeholder="' + (this.label != null ? this.label : getResource(this.resourceKey + ".label")) + '" id="' + this.resourceKey + '" value="' + this.defaultValue + '"/>');
						}

					});

		$('#logonForm')
				.append(
					'<button id="logonButton" class="btn btn-lg btn-primary btn-block" type="submit">' + (data.last ? getResource("text.logon") : getResource("text.next")) + '<i style="float: right; padding: 4px 10px 0px 0px" class="fa fa-sign-in"></i></button>');
		
		if(!data.newSession) {
			$('#logonForm').append('<div class="logonLink center"><a id="resetLogon" href="#">' + getResource("restart.logon") + '</a></div>');
			
			$('#resetLogon').click(function(e) {
				e.preventDefault();
				
				getJSON('logon/reset', null, function(data) {
					processLogon(data, null);
				});
			});
		}
		
		$('#logonButton')
				.click(
					function(evt) {

						log("Submitting logon");

						evt.preventDefault();
						credentials = 'action=logon';
						$
								.each(
									data['formTemplate']['inputFields'],
									function() {
										credentials = credentials + '&' + encodeURIComponent(this.resourceKey) + '=' + encodeURIComponent($(
											'#' + this.resourceKey).val());
									});

						logon(credentials);
					});

		// Logon banner?

		if (data['bannerMsg']) {
			$(contentDiv)
					.append(
						'<div class="col-md-3"></div><div id="logonBanner" class="col-md-6"><p>' + data['bannerMsg'] + '</p></div><div class="col-md-3"></div>');
		}

	} else {
		log("User is logged in");
		$(document).data('session', data.session);
		// Logging you in...
		clearContent();
		home(data);
	}

	hideBusy();
}
/**
 * Perform a logon against the REST API and/or show logon form in the specified
 * div id.
 * 
 * @param credentials
 */
function logon(credentials) {

	log("Logging on");

	loadResources(function() {
		showBusy();
		showLogon(credentials);
	});
}

function logoff() {

	log("Logging off");

	$(document).data('session', null);

	showBusy();

	$.get('../api/logoff', null, function() {
		showLogon();
	});

}

function home(data) {

	log("Entering home");

	showBusy();

	// Menu
	$('#navMenu').empty();
	$('#nav').show();
	$('#informationBar').empty();
	$('#main-menu').remove();

	$(contentDiv).empty();
	$(contentDiv)
			.append(
				'<div id="main-menu" class="sidebar col-md-2 col-sm-1"><div id="menu" class="sidebar-collapse"></div></div>');

	currentRealm = data.session.currentRealm;
	var showLocales = data.showLocales;
	getJSON(
		'menus',
		null,
		function(data) {

			log("Received menus");

			$('#menu').empty();

			$.each(
				data.menus,
				function() {
					$('#menu')
							.append(
								'<div id="menu_' + this.id + '" class="nav-sidebar title"><span>' + getResource(this.resourceKey + '.label') + '</span></div>');

					if (this.menus.length > 0) {
						var menu = '#sub_' + this.id;
						$("#menu").append(
							'<ul id="sub_' + this.id + '" class="nav nav-sidebar"/>');
						$
								.each(
									this.menus,
									function() {
										$(menu)
												.append(
													'<li><a id="' + this.id + '" href="#" class="sideMenu"><i class="fa ' + this.icon + '"></i><span class="hidden-sm text">' + getResource(this.resourceKey + '.label') + '</span></span></a></li>');
										$('#' + this.id).data('menu', this);
										$('#' + this.id).click(function() {
											$(".sideMenu").removeClass("active");
											$(this).addClass("active");
											loadMenu($('#' + $(this).attr('id')).data('menu'));
										});
										if (currentMenu == null) {
											currentMenu = this;
										}
									});
					}

					$('#' + this.id).click(function() {
						$(this).addClass("active");
						loadMenu($(this).data('menu'));
					});

				});

			$('#navMenu')
					.append(
						'<li class="navicon"><a id="main-menu-toggle" class="hidden-sm hidden-md hidden-lg" href="#"><i class="fa fa-bars"></i></a></li>');

			$('#currentRealm').remove();
			if (data.realms) {
				if(data.realms.length > 1) {
					loadRealms(data.realms);
				}
			}
			
			$(window).resize(function() {
				if ($(this).width() < 959) {
					if (!$('#main-menu').data('toggled')) {
						$('#main-menu').addClass('hidden-xs');
					}
				} else {
					$('#main-menu').data('toggled', false);
					$('#main-menu').removeClass('hidden-xs');
				}
			})

			$('#main-menu-toggle').click(function() {
				if ($(window).width() < 959) {
					$('#main-menu').data('toggled', true);
					if ($('#main-menu').hasClass('hidden-xs')) {
						$('#main-menu').removeClass('hidden-xs');
						$('#main-menu').show();
					} else {
						$('#main-menu').addClass('hidden-xs');
					}
				} else {
					$('#main-menu').data('toggled', false);
					if (!$('#main-menu').is(':visible')) {
						$('#main-menu').show();
					} else {
						$('#main-menu').hide();
					}

				}
			});

			$('#navMenu').append('<li class="navicon" id="powerMenu" class="dropdown"><a class="dropdown" data-toggle="dropdown" href="#"><i class="fa fa-power-off"></i></a></li>');
			
			$('#powerMenu')
			.append(
				'<ul id="power" class="dropdown-menu dropdown-menu-right" role="menu"></ul>');
			$('#power')
				.append(
					'<li role="presentation"><a class="powerClick" data-value="shutdown" role="menuitem" tabindex="-1" href="#">' + getResource("shutdown.label") + '</li>');
			$('#power')
				.append(
					'<li role="presentation"><a class="powerClick" data-value="restart" role="menuitem" tabindex="-1" href="#">' + getResource("restart.label") + '</li>');
			
			$('.powerClick').click(function(e) {
				var action = $(this).attr('data-value');
					bootbox.confirm(getResource("power.confirm").format(getResource(action + '.label')), function(result) {
							if(result) {
								getJSON(action + '/5', function(data) {
										if(data.success) {
											showInformation(false, getResource("power.completed").format(getResource(action + '.label')));
										} else {
												showError(data.error);
										}
								});
							}
					});
			});
	
		if (showLocales) {
				
				$('#navMenu')
						.append(
							'<li class="navicon" id="langMenu" class="dropdown"><a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="fa fa-globe"></i></a></li>');
				$('#langMenu')
						.append(
							'<ul id="lang" class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1"></ul>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="en" href="#">' + getResource("en") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="da" href="#">' + getResource("da") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="nl" href="#">' + getResource("nl") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="fi" href="#">' + getResource("fi") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="fr" href="#">' + getResource("fr") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="de" href="#">' + getResource("de") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="it" href="#">' + getResource("it") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="no" href="#">' + getResource("no") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="pl" href="#">' + getResource("pl") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="ru" href="#">' + getResource("ru") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="sv" href="#">' + getResource("sv") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="es" href="#">' + getResource("es") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation"><a class="langSelect" role="menuitem" tabindex="-1" data-value="ja" href="#">' + getResource("ja") + '</li>');

				$('.langSelect').click(function(e) {

					e.preventDefault();
					
					log("Switching language to " + $(this).attr('data-value'));

					getJSON('switchLanguage/' + $(this).attr('data-value'), null, function() {
						document.location.reload();
					});
				});
			}

			// Load current page
			$(contentDiv).append(
				'<div class="col-md-10 col-sm-11 main"><div id="informationBar"/><div id="mainContent"/></div>');

			// Setup header actions
			$('#navMenu')
					.append(
						'<li class="navicon"><a id="actionLogoff" href="#"><i class="fa fa-sign-out"></i></a></li>');

			$('#actionLogoff').tooltip();
			$('#actionLogoff').click(function() {
				logoff();
			});

			$('#' + currentMenu.id).trigger('click');

			hideBusy();
		});

	// checkNotifications();

}

function loadRealms(realms) {

	$('#currentRealm').remove();
	
	var deletedCurrentRealm = true;
	$.each(realms, function() {
		if (currentRealm.id === this.id) {
			deletedCurrentRealm = false;
		}
	});

	if (deletedCurrentRealm) {
		currentRealm = realms[0];
	}
	
	var func = function(realm) {
		getJSON('switchRealm/' + realm, null,
			function(data) {
				if (!data.success) {
					showError(false, data.errorMsg);
				} else {
					currentRealm = data.session.currentRealm;
					loadMenu(currentMenu);
				}
			});
	};
	
	if(realms.length > 1) {
		$('#main-menu-toggle').parent().after('<li id="currentRealm" class="navicon" class="dropdown"><a class="dropdown" data-toggle="dropdown" href="#"><i class="fa fa-database"></i></a></li>');

		$('#currentRealm').append('<ul id="realm" class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1"></ul>');
		$.each(realms, function() {
			$('#realm').append(
				'<li role="presentation"><a class="realmSelect" href="#" role="menuitem" tabindex="-1" data-value="' + this.id + '">' + this.name + '</a></li>');
		});
	
		$('.realmSelect').on(
			'click', function(evt) {
				evt.preventDefault();
				func($(this).attr('data-value'));
			}
		);
	}
	
	if (deletedCurrentRealm) {
		func(currentRealm.id);
	}
}

function reloadRealms() {
	$.getJSON(basePath + "/api/realms", null, function(data) {
		loadRealms(data.resources);
		// This should not be needed but some areas reload the page and so the state does not get updated
		// http://stackoverflow.com/questions/11519660/twitter-bootstrap-modal-backdrop-doesnt-disappear
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove();
	});
}

function checkNotifications() {

	if ($(document).data('session') != null) {
		$
				.getJSON(
					basePath + "/api/getNotifications/core",
					null,
					function(data) {

						if (data.success) {
							$.pnotify.defaults.styling = "jqueryui";

							$
									.each(
										data.resource,
										function(idx, obj) {
											$
													.pnotify({ title : obj.titleIsResourceKey ? getResource(obj.title) : obj.title, text : obj.textIsResourceKey ? getResource(obj.text) : obj.text });
										});

						}
					}).always(function() {
					if ($(document).data('session') != null) {
						log("Posting next notification check in 60 secs");
						setTimeout(function() {
							checkNotifications();
						}, 60000);
					}
				});
	}

}

function loadComplete(pageChange) {
	log("Signaling load complete");
	$('#mainContent').data('loadComplete', true);
	$('#mainContent').data('pageChange', pageChange);
}

function loadWait() {

	log("Waiting for page load");

	if($('#mainContent').data('pageChange')) {
		$('#mainContent').data('pageChange')();
		$('#mainContent').data('pageChange', null);
	}
	
	setTimeout(function() {
		if ($('#mainContent').data('loadComplete')) {
			log("Page has loaded");
			$('#mainContent').show();
			hideBusy();
		} else {
			loadWait();
		}
	}, 100);
}

function loadMenu(menu) {

	log("Loading menu " + menu);

	showBusy();

	if (currentMenu) {
		$('#' + currentMenu.id).removeClass('active');
	}
	currentMenu = menu;

	$('#mainContent').hide();
	$('#informationBar').empty();
	$('#mainContent').empty();
	
	$('div[role="dialog"]').remove();
	$('#mainContent').data('loadComplete', false);

	if(menu.menus.length > 0) {

		$('#mainContent').append('<div class="col-sm-12" id="subMenuContent">'
				+ '<div class="row">'
					+ '<div class="panel panel-default">'
						+ '<div id="subMenuIconPanel" class="panel-body"></div>'
					+ '</div>'
				+ '</div>'
			+ '</div>'
			+ '<div id="subMenuPageContent">'
				+ '<div class="row">'
					+ '<div class="col-sm-12" id="menuContent"></div>'
				+ '</div>'
			+ '</div>');
						
		$.each(menu.menus, function() {
			$('#subMenuIconPanel').append(
				'<div class="col-sm-2"><a class="large-button subMenu" data-value="' + this.resourceName + '" id="button_' + this.resourceName + '">'
						+ '<i class="fa ' + this.icon + '"></i><p>' + getResource(this.resourceKey + '.title') + '</p>'
					+ '</a>'
				+ '</div>');
		});
	
		for(var i=menu.menus.length;i<6;i++) {
			$('#subMenuIconPanel').append('<div class="col-sm-2"></div>');
		}
		
		currentMenu = menu.menus[0];

		$('.subMenu').click(function(e) {
			e.preventDefault();
			loadSubPage($(this).attr('data-value'), $(this));
		});
		
		$('.subMenu').first().trigger('click');
		
	} else {
	
	
		$('#mainContent').load('content/' + menu.resourceName + '.html', function() {
			loadWait();
		});
	}
}

function loadSubPage(page, element) {
	
	$('#subMenuIconPanel').find('.large-button-active').removeClass('large-button-active');
	element.addClass('large-button-active');
	$('#menuContent').load('content/' + page + '.html', function() {
		loadWait();
	});
}

