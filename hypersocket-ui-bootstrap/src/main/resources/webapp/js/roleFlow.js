/*
 * Role to Authentication Flow
 */
$.fn.roleFlow = function(options) {

	return $(this).multipleRows({
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
			element.append('<div id="' + id + 'Role" class="role col-xs-6" style="padding-left: 0px;"></div><div id="' + id + 'Flow" class="flow col-xs-6" style="padding-left: 0px;"></div>');
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
		},
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
	});
	
}