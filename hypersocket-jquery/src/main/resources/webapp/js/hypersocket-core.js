// Main content div
var contentDiv = '#content';
var currentMenu = null;
var currentRealm = null;

// jQuery plugin for Spinner control
$.fn.spin = function(opts) {
  this.each(function() {
    var $this = $(this),
        data = $this.data();

    if (data.spinner) {
      data.spinner.stop();
      delete data.spinner;
    }
    if (opts !== false) {
      data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin(this);
    }
  });
  return this;
};

$.ajaxSetup({
    error: function(xmlRequest) { 
    	
    	log("AJAX ERROR: " + xmlRequest.status);
    	
    	if(xmlRequest.status == 401) {
    		$(document).data('session', null);
    		showLogon(null, getResource("error.sessionTimeout"));  
    	}
    },
    cache: false
});

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
	if($(this).data('isMultipleSelect')) {
		$(this).multipleSelect();
	} else {
		$(this).val($(this).data('originalValue'));
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
	if(obj.inputType == 'number') {
		return (obj.minValue <= $(this).val() && obj.maxValue >= $(this).val());
	} else if(obj.inputType == 'textarea') {
		return true;
	} else if(obj.inputType == 'text') {
		return true;
	} else if(obj.inputType == 'select') {
		return true;
	} else if(obj.inputType == 'password') {
		return true;
	} else if(obj.inputType == 'multipleSelect') {
		return true;
	} else if(obj.inputType == 'boolean') {
		return true;
	}
	
	log("Validation failed for " + $(this).data('resourceKey'));
	return false;
};

$.fn.propertyPage = function(opts) {
	
	log("Creating property page for div " + $(this).attr('id'));
	
	var options = $.extend({ showButtons: true, canUpdate: false }, opts);
	
	$('body').append('<div id="tabTemp"/>');
	$('#tabTemp').hide();
	if(options.additionalTabs) {
		$.each(options.additionalTabs, function(idx, obj) {
			$('#' + obj.id).appendTo('#tabTemp');
		});
	}
	$(this).empty();
	
	propertyDiv = $(this).attr('id');
	getJSON(options.url, null, function(data) {
		
		   contentTabs = '#' + propertyDiv + 'Tabs';
		   contentActions = '#' + propertyDiv + 'Actions';
		   revertButton = '#' + propertyDiv + 'Revert';
		   applyButton = '#' + propertyDiv + 'Apply';
		   
		   $('#'+propertyDiv).append('<div id="' + propertyDiv + 'Content"><ul id="' + propertyDiv + 'Tabs"/></div>');
		   
		   if(options.showButtons) {
			   $('#'+propertyDiv).append('<div id="' + propertyDiv + 'Actions" class="tabActions"><button id="' + propertyDiv + 'Revert">' + getResource('text.revert') + '</button><button id="' + propertyDiv + 'Apply">' + getResource('text.apply') + '</button></div>');
		   }
		   $.each(data.resources, function() {
			
			   tab = "tab" + this.id;
			   $(contentTabs).append('<li><a href="#' + tab + '"><span>' + getResource(this.categoryKey + '.label') + '</span></a></li>');
			   $('#' + propertyDiv + 'Content').append('<div id="' + tab +'" class="tabContent"/>');
			   
			   var toSort = [];
			   $.each(this.templates, function() {
				   toSort.push(this); 
			   });

			   toSort.sort(function(a,b) {
				  if(a.weight < b.weight) {
					  return -1;
				  } else if(a.weight > b.weight) {
					  return 1;
				  }
				  return 0;
			   });
			   
			   $.each(toSort, function() {
				   
				  $('#' + tab).append('<div class="propertyItem" id="' + tab + '_item' + this.id + '"/>');
				  $('#' + tab + '_item' + this.id).append('<div class="propertyLabel" id="' + tab + '_label' + this.id + '"><span id="' + tab + '_info' + this.id + '" title="' + getResource(this.resourceKey + '.info') + '" class="ui-icon ui-icon-info"></span>&nbsp;<span>' + getResource(this.resourceKey) + '</span></div>');
				  $('#' + tab + '_item' + this.id).append('<div class="propertyValue" id="' + tab + '_value' + this.id + '"></div>');
				  
				  
				  $('#' + tab + '_info' + this.id).tooltip();
				  
				  x = JSON.parse(this.metaData);
				  var obj = $.extend({ restart: false, nameIsResourceKey: false }, x);
				  // Following vars are needed for some aysnchronous calls
				  var inputId = this.id; 
				  var inputTab = tab; 
				  var inputObj = this;
				  if(obj.inputType=='textarea') {
					  $('#' + tab + '_value' + this.id).append('<textarea ' + (options.canUpdate ? '' : 'disabled ') + 'class="ui-widget-content ui-corner-all propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '" cols="30" rows="' + obj.rows + '" maxlength="' + obj.maxlength + '">' + stripNull(this.value) + '</textarea>');
				  } else if(obj.inputType=='select') {
					  $('#' + tab + '_value' + this.id).append('<select ' + (options.canUpdate ? '' : 'disabled ') + 'class="ui-widget-content ui-corner-all propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '"/>');
					  if(obj.options) {
						  for (var i = 0; i < obj.options.length; i++) {
							  if(this.value==obj.options[i].value) {
								  $('#' + tab + '_input' + this.id).append('<option selected value="' + stripNull(obj.options[i].value) + '">' + (obj.nameIsResourceKey ? getResource(obj.options[i].name) : obj.options[i].name) + '</option>');
							  } else {
								  $('#' + tab + '_input' + this.id).append('<option value="' + stripNull(obj.options[i].value) + '">' + (obj.nameIsResourceKey ? getResource(obj.options[i].name) : obj.options[i].name) + '</option>');
							  }
						  };
					  } else if(obj.url) {
						  getJSON(obj.url, null, function(data) {
								$.each(data.resources, function(idx, option) {
									if(option.value==inputObj.value) {
										  $('#' + inputTab + '_input' + inputId).append('<option selected value="' + stripNull(option.value) + '">' + (obj.nameIsResourceKey ? getResource(option.name) : option.name) + '</option>');
									  } else {
										  $('#' + inputTab + '_input' + inputId).append('<option value="' + stripNull(option.value) + '">' + (obj.nameIsResourceKey ? getResource(option.name) : option.name) + '</option>');
									  }
								});	 
							});
					  }
			      } else if(obj.inputType=='multipleSelect') {
			    	  $('#' + tab + '_value' + this.id).multipleSelect({ 
			    			  url: obj.url,
			    			  values: obj.values,
			    			  disabled: !options.canUpdate,
			    			  selected: splitFix(this.value),
			    			  selectAllIfEmpty: obj.selectAllIfEmpty,
			    			  resourceKey: this.resourceKey,
			    			  change: function() {
			    				  $(this).markUpdated();
								  if(options.showButtons) {
									  $(revertButton).button({disabled:false});
									  $(applyButton).button({disabled:false});
								  }
			    			  }
			    	  });
			    	  $('#' + tab + '_value' + this.id).addClass("propertyInput");
			    	  
			    	
			      } else if(obj.inputType=='password') {
					  $('#' + tab + '_value' + this.id).append('<input ' + (options.canUpdate ? '' : 'disabled ') + 'type="password" class="ui-widget-content ui-corner-all propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '" value="' + stripNull(this.value) + '"/>');
				  } else if(obj.inputType=='boolean') {
					  $('#' + tab + '_value' + this.id).append('<input ' + (options.canUpdate ? '' : 'disabled ') + 'type="checkbox" class="ui-widget-content ui-corner-all propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '" value="true"' + (stripNull(this.value) == 'true' ? ' checked' : '') + '/>');
				  } else {
					  $('#' + tab + '_value' + this.id).append('<input ' + (options.canUpdate ? '' : 'disabled ') + 'type="text" class="ui-widget-content ui-corner-all propertyInput" id="' + tab + '_input' + this.id + '" name="input' + this.id + '" value="' + stripNull(this.value) + '"/>');
				  }
				  
				  $('#' + tab + '_input' + this.id).prepareProperty(obj, this.id, this.value, this.resourceKey);
				  
				  $('#' + tab + '_input' + this.id).change(function() {
					  $('#' + tab + '_error' + this.id).remove();
					  if($(this).validateProperty()) {
						  $(this).markUpdated();
						  if(options.showButtons) {
							  $(revertButton).button({disabled:false});
							  $(applyButton).button({disabled:false});
						  }
					  } else {
						    if($('#error' + this.id).length == 0) {
						  		$(this).after('<span id="' + tab + '_error' + this.id + '" class="ui-icon ui-icon-alert"></span>');
				  			}
						    if(options.showButtons) {
						    	$(applyButton).button({disabled:true});
						    }
					  }
				  });
				  
			   });
		   });
		   
		   if(options.additionalTabs) {
			   $.each(options.additionalTabs, function() {
				   $(contentTabs).append('<li><a href="#' + this.id + '"><span>' + this.name + '</span></a></li>');
				   $('#'+ this.id).appendTo('#' + propertyDiv + 'Content');
			   });
		   }
		   
		   $('#tabTemp').remove();
		   
		   $('#' + propertyDiv + 'Content').tabs();
		   
		   if(options.showButtons) {
			   $(revertButton).button({disabled: true}).click(function() {
				   $('.propertyInput').each(function(i,obj) {
					  $(this).revertProperty(); 
				   });
				   $(revertButton).button({disabled:true});
				   $(applyButton).button({disabled:true});
			   });
			   $(applyButton).button({disabled: true}).click(function() {
	
				   $('#' + propertyDiv).saveProperties(false, function(items) {
					   postJSON(options.url, items, function(data) {
							  
						   if(data.success) {
						   	   showInformation(false, data.message);
						   	   $('#' + propertyDiv).saveCompleted();
						   } else {
							   showError(false, data.message);
						   }
						  $(revertButton).button({disabled:true});
						  $(applyButton).button({disabled:true});	
					   });
				   });
				   
				   	   
			   });
		   }
		   
		   if(options.complete) {
			   options.complete();
		   }
	});
};

$.fn.resetProperties = function() {
	$('.propertyInput', '#' + $(this).attr('id')).each(function(i,obj) {
		$('#' + obj.id).revertProperty();
	});
};

$.fn.clearProperties = function() {
	$('.propertyInput', '#' + $(this).attr('id')).each(function(i,obj) {
		$('#' + obj.id).clearProperty();
	});
};

$.fn.saveProperties = function(includeAll, callback) {
	
	   var items = new Array();
	   
	   var restart = false;
	   
	   $('.propertyInput', '#' + $(this).attr('id')).each(function(i,obj) {
		   
		   var item = $('#' + obj.id);
		   restart |= item.data("restart");
		   var name = item.prop("tagName");
		   var isMultipleSelect = item.data('multipleSelect');
		   if(name =="SELECT" && isMultipleSelect) {
			   if(includeAll || item.data('updated')) {
				   items.push(new PropertyItem(item.data('id'), item.multipleSelectValues({ isProperty: true }).join("]|[")));
			   }
		
		   } else {
			   if(includeAll || item.isUpdated()) {
				    if(item.attr('type')=="checkbox") {
				    	items.push(new PropertyItem(item.data('resourceKey'), item.prop("checked") ? "true" : "false"));
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
	

	   $('.propertyInput', '#' + $(this).attr('id')).each(function(i,obj) {
		   
		   var item = $('#' + obj.id);
		   
		   if(item.prop("tagName")=="SELECT" && item.data('multipleSelect')) {
			   item.data('updated', false);
		   } else {
			   item.data('updated', false);
			   item.data('originalValue', item.val());
		   }
		});
};

$.fn.multipleSelectValues = function(data) {
	
	var options = $.extend({ isProperty: false }, data);
	result = new Array();
	
	var id = $(this).attr('id');
	if(!options.isProperty) {
		id += 'IncludedSelect';
	} 
	
	$('#' + id + ' option').each(function() {
		result.push($(this).val());
	});
	return result;
};

$.fn.multipleSelect = function(data) {
	
	if($(this).data('created')) {
		
		options = $(this).data('options');
		if((options.selected && options.selected.length == 0) && options.selectAllIfEmpty) {
			var allExcludedOptions = $('#' + $(this).attr('id') + 'ExcludedSelect option');
			if(allExcludedOptions.length>0) {
				$('#' + $(this).attr('id') + 'IncludedSelect').append($(allExcludedOptions).clone());
				$(allExcludedOptions).remove();
			};
		} else {
			var allIncludedOptions = $('#' + $(this).attr('id') + 'IncludedSelect option');
			if(allIncludedOptions.length>0) {
				$('#' + $(this).attr('id') + 'ExcludedSelect').append($(allIncludedOptions).clone());
				$(allIncludedOptions).remove();
			};
		}
		var select = $('#' + $(this).attr('id') + 'ExcludedSelect');
		var toSelect = $('#' + $(this).attr('id') + 'IncludedSelect');
		
		if(options.selected) {
			$.each(options.selected, function(idx, id) {
				var selectedOpt;
				if(options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
				} else {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
				}
				if(selectedOpt) {
					toSelect.append($(selectedOpt).clone());
					$(selectedOpt).remove();
				}
			});
		} 
		
		if(data && data.insert) {
			$.each(data.insert, function(idx, obj) {
				
				select.append('<option ' 
						+ 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? 
						(getResource(obj[options.nameAttr])==undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
			});
		}
		
		if(data && data.remove) {
			$.each(data.remove, function(idx, obj) {
				if(options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + obj[options.idAttr] + '"]');
					if(!selectedOpt) {
						selectedOpt = $('#' + toSelect.attr('id') + ' option[value="' + obj[options.idAttr] + '"]');
					}
				} else {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + obj + '"]');
					if(!selectedOpt) {
						selectedOpt = $('#' + toSelect.attr('id') + ' option[value="' + obj + '"]');
					}
				}
				if(selectedOpt) {
					$(selectedOpt).remove();
				}
			});
		}
		
		if(data && data.selected) {
			$.each(data.selected, function(idx, id) {
				var selectedOpt;
				if(options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
				} else {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
				}
				if(selectedOpt) {
					toSelect.append($(selectedOpt).clone());
					$(selectedOpt).remove();
				}
			});
		}
		
		return;
		
	} else {
		
		var options = $.extend({ idAttr: 'id', nameAttr: 'name', nameAttrIsResourceKey: false, selectAllIfEmpty: false, selectedIsObjectList: false, isPropertyInput: true, disabled: false }, data);
		
		$(this).data('created', true);
		$(this).data('isMultipleSelect', true);
		$(this).data('options', options);
		
		$('#' + $(this).attr('id') + 'Excluded').remove();
		$('#' + $(this).attr('id') + 'Buttons').remove();
		$('#' + $(this).attr('id') + 'Included').remove();
		
		if(getResourceNoDefault(options.resourceKey + '.' + $(this).attr('id') + '.tooltip')!=undefined) {
			$(this).append('<div class="multiselectTooltip"><span id="' + $(this).attr('id') + 'Tooltip" class="ui-icon ui-icon-info" title="' + getResource(options.resourceKey + '.' + $(this).attr('id') + '.tooltip') + '"></span></div>');
			$('#' + $(this).attr('id') + 'Tooltip').tooltip();
		}
		$(this).append('<div class="excludedList" id="' + $(this).attr('id') + 'Excluded"><label>' + getResource('text.excluded') + '</label></div>');
		$('#' + $(this).attr('id') + 'Excluded').append('<select ' + (!options.disabled ? '' : 'disabled ') + 'multiple="multiple" id="' + $(this).attr('id') + 'ExcludedSelect" class="formInput text ui-widget-content ui-corner-all"/>');
	
		$(this).append('<div class="listButtons" id="' + $(this).attr('id') + 'Buttons"/>');
		$('#' + $(this).attr('id') + 'Buttons').append('<button id="' + $(this).attr('id') + 'AddButton">&gt;</button><br/>');
		$('#' + $(this).attr('id') + 'Buttons').append('<button id="' + $(this).attr('id') + 'RemoveButton">&lt;</button>');
		$(this).append('<div class="includedList" id="' + $(this).attr('id') + 'Included"><label>' + getResource('text.included') + '</label></div>');
		$('#' + $(this).attr('id') + 'Included').append('<select ' + (!options.disabled ? '' : 'disabled ') + 'multiple="multiple" id="' + $(this).attr('id') + 'IncludedSelect" class="formInput text ui-widget-content ui-corner-all' + (options.isPropertyInput ? ' propertyInput' : '' ) + '"/>');
	
		$('#' + $(this).attr('id') + 'AddButton').button();
		$('#' + $(this).attr('id') + 'RemoveButton').button();
		
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
	        
	        toSelect.data('updated', true);
	        if(data.change) {
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
	        
	        toSelect.data('updated', true);
	        
	        if(data.change) {
	        	data.change();
	        }
	    });
	    
	}
	
    toSelect.data('id', options.resourceKey);
	toSelect.data('restart', options.restart);
	toSelect.data('multipleSelect', true);
	toSelect.data('updated', false);
	
	if(options.values) {
		
		$.each(options.values, function(idx, obj) {
			
			var selectItem = ((!options.selected || (options.selected && options.selected.length == 0)) && options.selectAllIfEmpty ? toSelect : select);
			selectItem.append('<option ' 
					+ 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? 
					(getResource(obj[options.nameAttr])==undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
		});
		
		if(options.selected) {
			$.each(options.selected, function(idx, id) {
				var selectedOpt;
				if(options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
				} else {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
				}
				if(selectedOpt) {
					toSelect.append($(selectedOpt).clone());
					$(selectedOpt).remove();
				}
			});
		} 
		
	} else if(options.url) {
		getJSON(options.url, null, function(data) {
			$.each(data.resources, function(idx, obj) {
				var selectItem = ((!options.selected || (options.selected && options.selected.length == 0)) && options.selectAllIfEmpty ? toSelect : select);
				selectItem.append('<option ' 
						+ 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? 
						(getResource(obj[options.nameAttr])==undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
			});	
			
			if(options.selected) {
				$.each(options.selected, function(idx, id) {
					var selectedOpt;
					if(options.selectedIsObjectList) {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
					} else {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
					}
					if(selectedOpt) {
						toSelect.append($(selectedOpt).clone());
						$(selectedOpt).remove();
					}
				});
			} 
		});
	}
	
};

$.fn.multipleSearch = function(data) {
	
	if($(this).data('created')) {
		
		options = $(this).data('options');

		var allIncludedOptions = $('#' + $(this).attr('id') + 'IncludedSelect option');
		if(allIncludedOptions.length > 0) {
			$(allIncludedOptions).remove();
		};
		
		var toSelect = $('#' + $(this).attr('id') + 'IncludedSelect');
		
		if(options.selected) {
			$.each(options.selected, function(idx, obj) {
				toSelect.append('<option ' 
						+ 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? 
						(getResource(obj[options.nameAttr])==undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
			});
		} 
		
		if(data && data.insert) {
			$.each(data.insert, function(idx, obj) {
				
				select.append('<option ' 
						+ 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? 
						(getResource(obj[options.nameAttr])==undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
			});
		}
		
		if(data && data.remove) {
			$.each(data.remove, function(idx, obj) {
				if(options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + obj[options.idAttr] + '"]');
					if(!selectedOpt) {
						selectedOpt = $('#' + toSelect.attr('id') + ' option[value="' + obj[options.idAttr] + '"]');
					}
				} else {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + obj + '"]');
					if(!selectedOpt) {
						selectedOpt = $('#' + toSelect.attr('id') + ' option[value="' + obj + '"]');
					}
				}
				if(selectedOpt) {
					$(selectedOpt).remove();
				}
			});
		}
		
		if(data && data.selected) {
			$.each(data.selected, function(idx, id) {
				var selectedOpt;
				if(options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
				} else {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
				}
				if(selectedOpt) {
					toSelect.append($(selectedOpt).clone());
					$(selectedOpt).remove();
				}
			});
		}
		
		return;
		
	} else {
		
		var options = $.extend({ idAttr: 'id', nameAttr: 'name', nameAttrIsResourceKey: false, selectAllIfEmpty: false, selectedIsObjectList: false, isPropertyInput: true, disabled: false }, data);
		
		$(this).data('created', true);
		$(this).data('isMultipleSelect', true);
		$(this).data('options', options);
		
		$('#' + $(this).attr('id') + 'Excluded').remove();
		$('#' + $(this).attr('id') + 'Buttons').remove();
		$('#' + $(this).attr('id') + 'Included').remove();
		
		if(getResourceNoDefault(options.resourceKey + '.' + $(this).attr('id') + '.tooltip')!=undefined) {
			$(this).append('<div class="multiselectTooltip"><span id="' + $(this).attr('id') + 'Tooltip" class="ui-icon ui-icon-info" title="' + getResource(options.resourceKey + '.' + $(this).attr('id') + '.tooltip') + '"></span></div>');
			$('#' + $(this).attr('id') + 'Tooltip').tooltip();
		}
		$(this).append('<div class="excludedList" id="' + $(this).attr('id') + 'Excluded"><label>' + getResource('text.excluded') + '</label></div>');
		$('#' + $(this).attr('id') + 'Excluded').append('<input type="text" ' + (!options.disabled ? '' : 'disabled ') + 'id="' + $(this).attr('id') + 'ExcludedSelect" class="formInput text ui-widget-content ui-corner-all"/>');
	
		$(this).append('<div class="listButtons" id="' + $(this).attr('id') + 'Buttons"/>');
		$('#' + $(this).attr('id') + 'Buttons').append('<button id="' + $(this).attr('id') + 'AddButton">&gt;</button><br/>');
		$('#' + $(this).attr('id') + 'Buttons').append('<button id="' + $(this).attr('id') + 'RemoveButton">&lt;</button>');
		$(this).append('<div class="includedList" id="' + $(this).attr('id') + 'Included"><label>' + getResource('text.included') + '</label></div>');
		$('#' + $(this).attr('id') + 'Included').append('<select ' + (!options.disabled ? '' : 'disabled ') + 'multiple="multiple" id="' + $(this).attr('id') + 'IncludedSelect" class="formInput text ui-widget-content ui-corner-all' + (options.isPropertyInput ? ' propertyInput' : '' ) + '"/>');
	
		$('#' + $(this).attr('id') + 'AddButton').button();
		$('#' + $(this).attr('id') + 'RemoveButton').button();
		
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
	        
	        toSelect.data('updated', true);
	        if(data.change) {
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
	        
	        toSelect.data('updated', true);
	        
	        if(data.change) {
	        	data.change();
	        }
	    });
	    
	}
	
    toSelect.data('id', options.resourceKey);
	toSelect.data('restart', options.restart);
	toSelect.data('multipleSelect', true);
	toSelect.data('updated', false);
	
	if(options.values) {
		
		$.each(options.values, function(idx, obj) {
			
			var selectItem = ((!options.selected || (options.selected && options.selected.length == 0)) && options.selectAllIfEmpty ? toSelect : select);
			selectItem.append('<option ' 
					+ 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? 
					(getResource(obj[options.nameAttr])==undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
		});
		
		if(options.selected) {
			$.each(options.selected, function(idx, id) {
				var selectedOpt;
				if(options.selectedIsObjectList) {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
				} else {
					selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
				}
				if(selectedOpt) {
					toSelect.append($(selectedOpt).clone());
					$(selectedOpt).remove();
				}
			});
		} 
		
	} else if(options.url) {
		getJSON(options.url, null, function(data) {
			$.each(data.interfaces, function(idx, obj) {
				var selectItem = ((!options.selected || (options.selected && options.selected.length == 0)) && options.selectAllIfEmpty ? toSelect : select);
				selectItem.append('<option ' 
						+ 'value="' + obj[options.idAttr] + '">' + (options.nameAttrIsResourceKey ? 
						(getResource(obj[options.nameAttr])==undefined ? obj[options.nameAttr] : getResource(obj[options.nameAttr])) : obj[options.nameAttr]) + "</option>");
			});	
			
			if(options.selected) {
				$.each(options.selected, function(idx, id) {
					var selectedOpt;
					if(options.selectedIsObjectList) {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id[options.idAttr] + '"]');
					} else {
						selectedOpt = $('#' + select.attr('id') + ' option[value="' + id + '"]');
					}
					if(selectedOpt) {
						toSelect.append($(selectedOpt).clone());
						$(selectedOpt).remove();
					}
				});
			} 
		});
	}
	
};

$.fn.resourcePage = function(params) {
	
	var divName = $(this).attr('id');
	
	log("Creating resource page for div " + divName);
	
	var options = $.extend({ divName: divName, canCreate: false, canUpdate: false, canDelete: false}, params);
	
	$(this).data('options', options);
	
	$(this).append('<table cellpadding="0" cellspacing="0" border="0" class="display" id="' + divName + 'Table'  
			+ '"><thead><tr id="' + divName + 'TableHeader"></tr></thead></table>');
	$(this).append('<div id="' + divName + 'Actions" class="tabActions"/>');
	
	$('div[dialog-for="' + divName + '"]').resourceDialog(options);
	
	getJSON(
			options.tableUrl,
			null,
			function(data) {
				
				var columns = new Array();
				var columnsDefs = new Array();
				
				$.each(options.fields, function(idx, obj) {
					$('#' + divName + 'TableHeader').append('<th>' + getResource(options.resourceKey + "." + obj.name + '.label') + '</th>');
					columns.push({ "mData": obj.name});
					if(obj.isResourceKey) {
						columnsDefs.push({
		                         "aTargets": [idx],
   		                         "mData": null,
   		                         "mRender": function (data, type, full) {
   		                             return getResource(options.resourceKey + "." + data + '.label');
   		                         }
   		                     });
					}
				});
				
				var renderActions = function(idCol) {
					var id = idCol.aData.id;
					var renderedActions = '';

					if(options.additionalActions) {
						$.each(options.additionalActions, function(x, act) {
							if(act.enabled) {
								renderedActions += '<span class="ui-icon ' + act.iconClass 
									+ ' row-' + act.resourceKey +'" title="' + getResource("text." + act.resourceKey) + '"></span>';
							
								$(document).off('click', '#' + divName + 'Actions' + id + ' .row-' + act.resourceKey);
								
								$(document).on('click', '#' + divName + 'Actions' + id + ' .row-' + act.resourceKey, function () {
									var curRow = $('#' + divName + 'Table').dataTable().fnGetPosition($(this).closest("tr").get(0));
									var resource = $('#' + divName + 'Table').dataTable().fnGetData(curRow);
									act.action(resource);
								});
							}
						});
					}
					
					
					if(options.canUpdate) {
						renderedActions += '<span class="ui-icon ui-icon-wrench row-edit" title="' + getResource("text.edit") + '"></span>';
					
						$(document).off('click', '#' + divName + 'Actions' + id + ' .row-edit');
						
						$(document).on('click', '#' + divName + 'Actions' + id + ' .row-edit', function () {
							var curRow = $('#' + divName + 'Table').dataTable().fnGetPosition($(this).closest("tr").get(0));
							var resource = $('#' + divName + 'Table').dataTable().fnGetData(curRow);
							$('div[dialog-for="' + divName + '"]').resourceDialog('edit', { 
									row: curRow, 
									resource : resource });
						});
					}
					
					if(options.canDelete) {
						renderedActions += '<span class="ui-icon ui-icon-trash row-delete" title="' + getResource("text.delete") + '"></span>';
					
						$(document).off('click', '#' + divName + 'Actions' + id + ' .row-delete');
						
						$(document).on('click', '#' + divName + 'Actions' + id + ' .row-delete', function () {
							
							log("Entering resource delete for id " + id);
							
							$(document).data('modal', true);
							
							var row = $(this).closest("tr").get(0);
							var resource = $('#' + divName + 'Table').dataTable().fnGetData(row);
							confirmBox( { title: getResource(options.resourceKey + ".delete.title"), 
								message: getResource(options.resourceKey + ".delete.desc").format(resource.name), 
								callback: function() {
				 		    		deleteJSON(options.resourceUrl + "/" + id, null, function(data) {
				 		    			if(data.success) {
				 		    				if(options.resourceDeleted) {
				 		    					options.resourceDeleted(resource);
				 		    				}
				 		    				$('#' + divName + 'Table').dataTable().fnDeleteRow(row);
				 						   showInformation(true, data.message);
				 						} else {
				 						  msgBox({ title: getResource("text.error"), message: data.message });
				 						}
			 		    		});
			 		    	}
			 		    	});
						});
					}
					
					return '<div id="' + divName + 'Actions' + id + '" class="tableActions">' + renderedActions + '</div>';
				};
				
				$('#' + divName + 'TableHeader').append('<th localize="text.actions"></th>');
				columns.push({ "mData": null, fnRender: renderActions});
			
				$('#' + divName + 'Table').dataTable(
						{
							"bJQueryUI" : true,
							"aaData" : data["resources"],
							"aoColumns" : columns,
							"aoColumnDefs": columnsDefs
						});

				if(options.canCreate) {
					$('#' + divName + 'Actions').append('<button id="' + divName + 'Add">' + getResource('text.add') + '</button>');
					$('#' + divName + 'Add').button();
					$('#' + divName + 'Add').click(function() {
						if(options.showCreate) {
							options.showCreate();
						}
						$('div[dialog-for="' + divName + '"]').resourceDialog('create');
					});
				}
				
				if(options.complete) {
					options.complete();
				}

			});
};

$.fn.ajaxResourcePage = function(params) {
	
	var divName = $(this).attr('id');
	
	log("Creating ajax resource page for div " + divName);
	
	var options = $.extend({ divName: divName, canCreate: false, canUpdate: false, canDelete: false}, params);
	
	$(this).data('options', options);
	
	$(this).append('<table cellpadding="0" cellspacing="0" border="0" class="display" id="' + divName + 'Table'  
			+ '"><thead><tr id="' + divName + 'TableHeader"></tr></thead></table>');
	$(this).append('<div id="' + divName + 'Actions" class="tabActions"/>');
	
	$('div[dialog-for="' + divName + '"]').resourceDialog(options);
	
	var columns = new Array();
	var columnsDefs = new Array();
	
	$.each(options.fields, function(idx, obj) {
		$('#' + divName + 'TableHeader').append('<th>' + getResource(options.resourceKey + "." + obj.name + '.label') + '</th>');
		columns.push({ "mData": obj.name});
		if(obj.isResourceKey) {
			columnsDefs.push({
                     "aTargets": [idx],
                        "mData": null,
                        "mRender": function (data, type, full) {
                            return getResource(options.resourceKey + "." + data + '.label');
                        }
                    });
		}
	});
	
	var renderActions = function(idCol) {
		var id = idCol.aData.id;
		var renderedActions = '';

		if(options.additionalActions) {
			$.each(options.additionalActions, function(x, act) {
				if(act.enabled) {
					renderedActions += '<span class="ui-icon ' + act.iconClass 
						+ ' row-' + act.resourceKey +'" title="' + getResource("text." + act.resourceKey) + '"></span>';
				
					$(document).off('click', '#' + divName + 'Actions' + id + ' .row-' + act.resourceKey);
					
					$(document).on('click', '#' + divName + 'Actions' + id + ' .row-' + act.resourceKey, function () {
						var curRow = $('#' + divName + 'Table').dataTable().fnGetPosition($(this).closest("tr").get(0));
						var resource = $('#' + divName + 'Table').dataTable().fnGetData(curRow);
						act.action(resource);
					});
				}
			});
		}
		
		
		if(options.canUpdate) {
			renderedActions += '<span class="ui-icon ui-icon-wrench row-edit" title="' + getResource("text.edit") + '"></span>';
		
			$(document).off('click', '#' + divName + 'Actions' + id + ' .row-edit');
			
			$(document).on('click', '#' + divName + 'Actions' + id + ' .row-edit', function () {
				var curRow = $('#' + divName + 'Table').dataTable().fnGetPosition($(this).closest("tr").get(0));
				var resource = $('#' + divName + 'Table').dataTable().fnGetData(curRow);
				$('div[dialog-for="' + divName + '"]').resourceDialog('edit', { 
						row: curRow, 
						resource : resource });
			});
		}
		
		if(options.canDelete) {
			renderedActions += '<span class="ui-icon ui-icon-trash row-delete" title="' + getResource("text.delete") + '"></span>';
		
			$(document).off('click', '#' + divName + 'Actions' + id + ' .row-delete');
			
			$(document).on('click', '#' + divName + 'Actions' + id + ' .row-delete', function () {
				
				log("Entering resource delete for id " + id);
				
				$(document).data('modal', true);
				
				var row = $(this).closest("tr").get(0);
				var resource = $('#' + divName + 'Table').dataTable().fnGetData(row);
				confirmBox( { title: getResource(options.resourceKey + ".delete.title"), 
					message: getResource(options.resourceKey + ".delete.desc").format(resource.name), 
					callback: function() {
	 		    		deleteJSON(options.resourceUrl + "/" + id, null, function(data) {
	 		    			if(data.success) {
	 		    				if(options.resourceDeleted) {
	 		    					options.resourceDeleted(resource);
	 		    				}
	 		    				$('#' + divName + 'Table').dataTable().fnDeleteRow(row);
	 						   showInformation(true, data.message);
	 						} else {
	 						  msgBox({ title: getResource("text.error"), message: data.message });
	 						}
 		    		});
 		    	}
 		    	});
			});
		}
		
		return '<div id="' + divName + 'Actions' + id + '" class="tableActions">' + renderedActions + '</div>';
	};
	
	$('#' + divName + 'TableHeader').append('<th localize="text.actions"></th>');
	columns.push({ "mData": null, fnRender: renderActions});

	$('#' + divName + 'Table').dataTable(
			{
				"bJQueryUI" : true,
				"bProcessing": true,
				"bServerSide": true,
				"sAjaxSource": basePath + "/api/" + options.tableUrl,
				"aoColumns" : columns,
				"aoColumnDefs": columnsDefs
			});

	if(options.canCreate) {
		$('#' + divName + 'Actions').append('<button id="' + divName + 'Add">' + getResource('text.add') + '</button>');
		$('#' + divName + 'Add').button();
		$('#' + divName + 'Add').click(function() {
			if(options.showCreate) {
				options.showCreate();
			}
			$('div[dialog-for="' + divName + '"]').resourceDialog('create');
		});
	}
	
	if(options.complete) {
		options.complete();
	}

};

$.fn.resourceDialog = function(params, params2) {
	
	var dialog = $(this);
	var parent = $(this).parent();
	var options = $.extend({ dialogWidth: 700, dialogHeight: 'auto', hasResourceTable: true}, params);
	var dialogOptions = $(this).data('options');
	
	if(params === 'create') {
		
			log("Creating resource dialog");
			
			dialogOptions.clearDialog();
			dialog.resourceDialog('error','reset');
			$(this).parent().appendTo('body');
			$(this).dialog('option', 'title',
					getResource(dialogOptions.resourceKey + '.create.title'));
			$(this).dialog('option', 'position',
					{ my: "center", at: "center", of: window });
			$(this).dialog(
					'option',
					'buttons',
					[ {
						text : getResource("text.create"),
						click : function() {
							
							log("Creating resource");
							
							if(dialogOptions.validate) {
								if(!dialogOptions.validate()) {
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
									if(dialogOptions.hasResourceTable) {
										$('#' + dialogOptions.divName + 'Table').dataTable().fnAddData(data.resource);
									}
									if(dialogOptions.resourceCreated) {
										dialogOptions.resourceCreated(data.resource);
									}
									showInformation(true, data.message);
								} else {
									log("Resource object creation failed " + data.message);
									dialog.resourceDialog('error',
											data.message);
								}
							});
						}
					} ]);
	
			$(this).dialog('open');

	} else if(params === 'edit') {
			
		dialogOptions.clearDialog();
		dialog.resourceDialog('error','reset');
		dialogOptions.displayResource(params2.resource);
		$(this).parent().appendTo('body');
		$(this).dialog('option', 'title',
				getResource($(this).data('options').resourceKey + '.update.title'));
		$(this).dialog('option', 'position',
				{ my: "center", at: "center", of: window });
		$(this).dialog(
				'option',
				'buttons',
				[ {
					text : getResource("text.update"),
					click : function() {
						if(dialogOptions.validate) {
							if(!dialogOptions.validate()) {
								return;
							}
						}
						var resource = dialogOptions.createResource();
						
						postJSON(dialogOptions.resourceUrl, resource, function(data) {
							if (data.success) {
								dialog.resourceDialog('close');
								if(dialogOptions.hasResourceTable) {
									$('#' + dialogOptions.divName + 'Table').dataTable().fnUpdate(data.resource, params2.row);
								}
								if(dialogOptions.resourceUpdated) {
									dialogOptions.resourceUpdated(data.resource);
								}
								showInformation(true, data.message);
							} else {
								dialog.resourceDialog('error',
										data.message);
							}
						});
					}
				} ]);

		$(this).dialog('open');
	
	} else if(params==='close') {
		$(this).dialog('close');
	} else if(params==='error') {
		$('#dialogErrorHighlight' + $(this).attr('id'), $(this)).remove();
		
		if(params2!='reset') {
		 	$(this).prepend('<div id="dialogErrorHighlight'  + $(this).attr('id') + '" class="ui-widget ui-state-error ui-corner-all"/>');
				$('#dialogErrorHighlight' + $(this).attr('id')).append('<span class="ui-icon ui-icon-alert"></span><span>' 
						+ (getResourceNoDefault(params2)==undefined ? params2 : getResource(params2))
						+ '</span>');
		}
	} else {
		if(!options.resourceKey) {
			alert("Bad usage, resourceKey not set");
		} else {
			
			$('.formInputField', $(this)).each(function(i, obj) {
				var label = $('label', $(this));
				if(label.attr('for')!=undefined) {
					if(getTooltip(options.resourceKey, label.attr('for'))!=undefined) {
						$(obj).prepend('<span class="ui-icon ui-icon-info" title="'
								+ getTooltip(options.resourceKey, label.attr('for')) + '"></span>').tooltip();
					} else {
						$(obj).prepend('<span class="ui-icon"></span>');
					}
				}
			});
			$(this).data('options', options);
			$(this).dialog({
				autoOpen : false,
				height : options.dialogHeight,
				width : options.dialogWidth,
				modal : true,
				close : function() {
					dialog.parent().appendTo(parent);
				}
			});
		}
	}
};


function splitFix(value) {
	var result = value.split(']|[');
	if(result.length==1) {
		if(result[0]=="") {
			return [];
		}
	}
	return result;
}

function PropertyItem(id, value) {
	this.id = id;
	this.value = value;
}

var progressOptions = {
		lines: 11, // The number of lines to draw
		  length: 0, // The length of each line
		  width: 3, // The line thickness
		  radius: 7, // The radius of the inner circle
		  corners: 1, // Corner roundness (0..1)
		  rotate: 0, // The rotation offset
		  color: '#fff', // #rgb or #rrggbb
		  speed: 1, // Rounds per second
		  trail: 46, // Afterglow percentage
		  shadow: false, // Whether to render a shadow
		  hwaccel: false, // Whether to use hardware acceleration
		  className: 'spinner', // The CSS class to assign to the spinner
		  zIndex: 2e9, // The z-index (defaults to 2000000000)
		  top: 'auto', // Top position relative to parent in px
		  left: 'auto' // Left position relative to parent in px
		};

function showBusy() {
	
	log("Showing busy");
	
	if($('#progress')) {
		 $('#progress').spin(progressOptions);
	 }
};

function hideBusy() {
	
	log("Hiding busy");
	
	if($('#progress')) {
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
	
	$.getJSON('../api/logon', credentials, 
			 function(data) {

		processLogon(data, message);
				
	 });
}

function processLogon(data, message) {
	log("Received logon data");
	
	$('#copyright').empty();
	$('#copyright').append("<p>" + getResource("label.version") + " " + data.version + "</p><p>&copy; 2013 Hypersocket Limited. All rights reserved.</p>");
	
	 if(!data.success) {
	
		log("Logon form present");
		
		clearContent();
		
		$(contentDiv).append('<div id="logonContent" class="ui-widget-content ui-widget ui-corner-all"/>');
		
		$('#currentRealm').remove();
		$('#lang').remove();
		if(data.showLocales) {
			$('#footerActions').append('<select id="lang"></select>');
			$('#lang').append('<option value="en">' + getResource("en") + '</option>');
			$('#lang').append('<option value="da">' + getResource("da") + '</option>');
			$('#lang').append('<option value="nl">' + getResource("nl") + '</option>');
			$('#lang').append('<option value="fi">' + getResource("fi") + '</option>');
			$('#lang').append('<option value="fr">' + getResource("fr") + '</option>');
			$('#lang').append('<option value="de">' + getResource("de") + '</option>');
			$('#lang').append('<option value="it">' + getResource("it") + '</option>');
			$('#lang').append('<option value="no">' + getResource("no") + '</option>');
			$('#lang').append('<option value="pl">' + getResource("pl") + '</option>');
			$('#lang').append('<option value="ru">' + getResource("ru") + '</option>');
			$('#lang').append('<option value="sv">' + getResource("sv") + '</option>');
			$('#lang').append('<option value="es">' + getResource("es") + '</option>');
			$('#lang').append('<option value="ja">' + getResource("ja") + '</option>');
			
			$("#lang option").filter(function() {
			    return $(this).val() == $(document).data('i18n')['LANG']; 
			}).prop('selected', true);
		
			$('#lang').change(function() {
				
				log("Switching language to " + this.value);
				
				getJSON('switchLanguage/' + this.value, null, function() {
						document.location.reload();
				});
			});
		}
		
		$('#logonContent').append('<div id="logonTitle" class="ui-widget-header ui-corner-all"><span>Logon</span></div>');
		$('#logonContent').append('<form id="logonForm"></form>');

		if(data['errorMsg']) {
			showError(false, (data.lastErrorIsResourceKey ? getResource(data['errorMsg']) : data['errorMsg']));
		} else if(message) {
			showError(false, message);
		}				
		
		
		$('#logonForm').attr("action", "../api/logon").attr("method", "post");
		$.each(data['formTemplate']['inputFields'], function() {
			
			if(this.type == 'hidden') {
				$('#logonForm').append('<input type="' + this.type 
						+ '" name="' + this.resourceKey 
						+ '" id="' + this.resourceKey
						+ '" value="' + this.defaultValue + '"/>');
				return;
			} else if(this.type == 'p') {	
				$('#logonForm').append('<div class="logonField"><p>' + this.defaultValue + '</p></div');
				return;
			}
			
			$('#logonForm').append('<div class="logonField" id="field_' + this.resourceKey + '"></div');
			$('#field_' + this.resourceKey).append('<div class="logonLabel"><label for="' + this.resourceKey +  '">' + getResource(this.resourceKey + ".label") + '</label></div>');
			
			if(this.type == 'select') {
				$('#field_' + this.resourceKey).append('<div class="logonSelect"><select name="' + this.resourceKey 
						+ '" id="' + this.resourceKey + '"/></div>');
				currentKey = this.resourceKey;
				$.each(this.options, function() {
					option = '<option';
					if(this.selected) {
						option += ' selected';
					}
					if(this.value) {
						option += ' value="' + this.value + '"';
					}
					option += '>' + (this.isNameResourceKey ? getResource(this.name) : this.name) + '</option>';
					$('#' + currentKey).append(option);
				});

			} else {
				$('#field_' + this.resourceKey).append('<div class="logonInput"><input type="' + this.type 
						+ '" name="' + this.resourceKey 
						+ '" id="' + this.resourceKey
						+ '" value="' + this.defaultValue + '" class="text ui-widget-content ui-corner-all"/></div>');
				
				if(this.type=="text" || this.type=="password") {
					$('#' + this.resourceKey).keyup(function(e) {
						if(e.keyCode == 13) {
							$('#logonButton').trigger("click");
						}
					});
				}
			}
			

		});
		
		$('#logonForm').append('<div id="logonSubmit"><input type="button" id="logonButton" name="logonButton" value="' + getResource("text.logon") + '"/></div>');
		$('#logonButton').button().click(function() {
			
			credentials = 'action=logon';
			$.each(data['formTemplate']['inputFields'], function() {
				credentials = credentials + '&' + encodeURIComponent(this.resourceKey) + '=' + encodeURIComponent($('#' + this.resourceKey).val());
			});
			
			logon(credentials);
		});
		
		
		// Logon banner?
		
		if(data['bannerMsg']) {
			$(contentDiv).append('<div id="logonBanner"><p>' + data['bannerMsg'] + '</p></div>');
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
 * Perform a logon against the REST API and/or show logon form in the specified div id.
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
	$('#navMenu').append('<ul id="menu"/>');
	
	$(contentDiv).empty();
	
	// Banner message (Todo: dialog)
	if(data.bannerMsg) {
		$.pnotify_remove_all();
		$.pnotify.defaults.styling = "jqueryui";
		$.pnotify({
			title: "Logon",
			text:  data.bannerMsg,
			delay: 2000,
			hide: true,
			animation: 'fade'
		});
	}
	
	currentRealm = data.session.currentRealm;
	var showLocales = data.showLocales;
	getJSON('menus', null, function(data) {
	
		log("Received menus");
		
		if(currentMenu==null) {
			currentMenu = data.menus[0];
		}
	
		$('#currentRealm').remove();
		if(data.realms) {
			$('#navActions').append('<select id="currentRealm"></select>');
			loadRealms(data.realms);
		}
		
		$('#lang').remove();
		if(showLocales) {
			$('#footerActions').append('<select id="lang"></select>');
			$('#lang').append('<option value="en">' + getResource("en") + '</option>');
			$('#lang').append('<option value="da">' + getResource("da") + '</option>');
			$('#lang').append('<option value="nl">' + getResource("nl") + '</option>');
			$('#lang').append('<option value="fi">' + getResource("fi") + '</option>');
			$('#lang').append('<option value="fr">' + getResource("fr") + '</option>');
			$('#lang').append('<option value="de">' + getResource("de") + '</option>');
			$('#lang').append('<option value="it">' + getResource("it") + '</option>');
			$('#lang').append('<option value="no">' + getResource("no") + '</option>');
			$('#lang').append('<option value="pl">' + getResource("pl") + '</option>');
			$('#lang').append('<option value="ru">' + getResource("ru") + '</option>');
			$('#lang').append('<option value="sv">' + getResource("sv") + '</option>');
			$('#lang').append('<option value="es">' + getResource("es") + '</option>');
			$('#lang').append('<option value="ja">' + getResource("ja") + '</option>');
			
		
			$("#lang option").filter(function() {
			    return $(this).val() == $(document).data('i18n')['LANG']; 
			}).prop('selected', true);
		
			$('#lang').change(function() {
				
				log("Switching language to " + this.value);
				
				getJSON('switchLanguage/' + this.value, null, function() {
						document.location.reload();
				});
			});
		}
		
		$.each(data.menus, function() {
		
			$('#menu').append('<li id="menu_' + this.id + '"><a id="' + this.id + '" href="#">' + getResource(this.resourceKey + '.label') + '</a></li>');
			$('#' + this.id).data('menu', this);
			
			if(this.menus.length > 0) {
				var menu = '#sub_' + this.id;
				$("#menu_" + this.id).append("<ul id='sub_" + this.id + "'></ul>");
				$.each(this.menus, function() {
					$(menu).append('<li id="menu_' + this.id + '"><a id="' + this.id + '" href="#">' + getResource(this.resourceKey + '.label') + '</a></li>');
					$('#' + this.id).data('menu', this);
					$('#' + this.id).click(function() {
						$(this).addClass("selected");
						loadMenu($(this).data('menu'));
					});
				});
			}
			
			$('#' + this.id).click(function() {
				$(this).addClass("selected");
				loadMenu($(this).data('menu'));
			});
		
		});

		$('#menu').ptMenu();
		
		// Load current page
		$(contentDiv).append('<div id="mainContent"/>');
		
		// Setup header actions
		$('#headerActions').append('&nbsp;<a title="' + getResource('label.logoff') + '" id="actionLogoff" href="#"><span class="ui-icon ui-icon-power"></span></a>');
		
		$('#actionLogoff').tooltip();
		$('#actionLogoff').click(function() {
			logoff();
		});
		
		
		$('#' + currentMenu.id).trigger('click');
		
		hideBusy();
	});
	
	
	checkNotifications();

	
}

function loadRealms(realms) {
	
	var deletedCurrentRealm = true;
	$('#currentRealm').off('change');
	$('#currentRealm').empty();

	$.each(realms, function() {
		$('#currentRealm').append('<option value="' + this.id + '">' + this.name + '</option>');
		if(currentRealm.id === this.id) {
			deletedCurrentRealm = false;
		}
	});
	
	if(deletedCurrentRealm) {
		currentRealm = realms[0];
	}
	
	$('#currentRealm option[value="' + currentRealm.id + '"]').attr('selected', true);	

	$('#currentRealm').on('change', function(evt) {
		getJSON('switchRealm/' + $('#currentRealm option:selected').val(), null, function(data) {
			if(!data.success) {
				showError(false, data.errorMsg);
			} else {
				currentRealm = data.session.currentRealm;
				$('#' + currentMenu.id).trigger('click');
				showInformation(false, data.bannerMsg);
			}
		});
	});
	
	if(deletedCurrentRealm) {
		$('#currentRealm').trigger('change');
	}

}

function reloadRealms() {
	$.getJSON(basePath + "/api/realms", null, function(data) {
		loadRealms(data.resources);
	});
}

function checkNotifications() {
	
	if($(document).data('session')!=null) {
		$.getJSON(basePath + "/api/getNotifications/core", null, function(data) {
			
			if(data.success) {
				$.pnotify.defaults.styling = "jqueryui";
				
				$.each(data.resource, function(idx, obj) {
					$.pnotify({
						title: obj.titleIsResourceKey ? getResource(obj.title) : obj.title,
						text:  obj.textIsResourceKey ? getResource(obj.text) : obj.text
					});
				});
				
			}
		}).always(function() {
			if($(document).data('session')!=null) {
				log("Posting next notification check in 60 secs");
				setTimeout(function() {
					checkNotifications();
				}, 60000);
			}	
		});
	}
	
}

function loadComplete() {
	log("Signaling load complete");
	$('#mainContent').data('loadComplete', true);
}

function loadWait() {
	
	log("Waiting for page load");
	
	setTimeout(function() {
	    if($('#mainContent').data('loadComplete')) {
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
	
	currentMenu = menu;
	
	$('#mainContent').hide();
	$('#mainContent').empty();
	$('div[role="dialog"]').remove();
	$('#mainContent').data('loadComplete', false);
	
	if(menu.resourceName==null)  {
		currentMenu = menu = menu.menus[0];
	}
	
	$('#mainContent').load('content/' + menu.resourceName + '.html', function() {
		loadWait();
	});
	
}


