var baseMultipleRowModel = {
		generateValue: function(element) {
			var result = '';
			$.each(element.find('.widget'), function(idx, obj) {
				if(result!=='') {
					result += '=';
				}
				result += $(this).widget().getValue();
			});
			return result;
		},
		enable: function(element) {
			$.each(element.find('.widget'), function(idx, obj) {
				$(this).widget().enable();
			});
		},
		disable: function(element) {
			$.each(element.find('.widget'), function(idx, obj) {
				$(this).widget().disable();
			});
		}, 
		clear: function(element) {
			$.each(element.find('.widget'), function(idx, obj) {
				$(this).widget().clear();
			});
		}
}

$.fn.ipFlowCheck = function(widget, value) {
	
	if (typeof(value) !== 'undefined' && value.trim().length == 0) {
		showError(getResource('ip2Flow.mapping.error.no.mapping'));
		return false;
	}
	
	var values = value.split('=');
		
	var cidr = values[0];
	var flow = values[1];
	
	if (cidr && !isValidCIDR(cidr)) {
		showError(getResource('ip2Flow.mapping.error.invalid.cidr').format(cidr));
		return false;
	}
	
	if (typeof(flow) !== 'undefined' && flow.trim().length == 0) {
		showError(getResource('ip2Flow.mapping.error.no.mapping.for.cidr').format(cidr));
		return false;
	}
	
	return true;
}

/*
 * Role to Authentication Flow
 */
$.fn.roleFlow = function(options) {
	
	var roleFlowModel = $.extend({
		resourceKey: options.resourceKey,
		inputType: 'roleFlow',
		value: options.value,
		render: function(element, value) {
			var id = element.attr('id');
			
			var values = [ "", "" ];
			if(value && value.length > 0) {
				values = value.split('=');
			}
			element.attr("style", "padding-left: 0px;");
			element.append('<div id="' + id + 'Role" class="role col-xs-6" style="padding-left: 0px;padding-right:5px;"></div><div id="' + id + 'Flow" class="flow col-xs-6" style="padding-left: 0px;"></div>');
			$('#' + id + 'Role').autoComplete({
				remoteSearch: true,
				url: 'roles/tableAllRoles',
				resourceKey: 'role',
				valueAttr: 'id',
				value: values[0],
			});
			
			$('#' + id + 'Flow').textDropdown({
				resourceKey: 'flow',
				value: values[1],
		    	url: "authentication/customSchemes",
		    	nameAttr: "resourceKey",
		    	nameIsResourceKey: false,
		    	valueAttr: "id"
			});
		}
	}, baseMultipleRowModel);

	return $(this).multipleRows(roleFlowModel);
	
}


/*
 * IP to Authentication Flow
 */
$.fn.ipFlow = function(options) {
	
	var ipFlowModel = $.extend({
		resourceKey: options.resourceKey,
		inputType: 'ipFlow',
		value: options.value,
		validateAll: 'ipFlowCheck',
		allowEmpty: false,
		errorElementId: '#ipFlowCheckComponentError',
		description: '  ', // non trimmed empty string required as empty string '' evaluates to false in if check
		render: function(element, value) {
			var id = element.attr('id');
			
			var values = [ "", "" ];
			if(value && value.length > 0) {
				values = value.split('=');
			}
			element.attr("style", "padding-left: 0px;");
			element.append('<div id="' + id + 'IP" class="role col-xs-6" style="padding-left: 0px;padding-right: 5px;"></div><div id="' + id + 'Flow" class="flow col-xs-6" style="padding-left: 0px;"></div>');
			$("#ipFlowCheckComponentError").remove();// push it to the last element in multiple rows
			element.append('<div id="ipFlowCheckComponentError"></div>');
			
			$('#' + id + 'IP').textInput({
				resourceKey: 'ip',
				value: values[0]
			});
			
			$('#' + id + 'Flow').textDropdown({
				resourceKey: 'flow',
				value: values[1],
		    	url: "authentication/customSchemes",
		    	nameAttr: "resourceKey",
		    	nameIsResourceKey: false,
		    	valueAttr: "id"
			});
		}
	}, baseMultipleRowModel);

	return $(this).multipleRows(ipFlowModel);
	
}