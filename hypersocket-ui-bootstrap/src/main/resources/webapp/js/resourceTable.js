$.fn.resourceTable = function(params) {
	
	var divName = $(this).attr('id');

	log("Creating resource table for div " + divName);

	var options = $.extend({
		divName : divName,
		striped	: true,
		method : 'get',
		pagination : true,
		page : 1,
		pageSize: 5,
		pageList: [5, 10, 25],
		search: true,
		showColumns : true,
		showRefresh : true,
	    showToggle : false,
		canCreate : false,
		canUpdate : false,
		canDelete : false,
		icon : 'fa-cog',
		disableDecoration: false,
		createButtonText: "text.add",
		createButtonIcon: "fa-plus-circle"
		},params);

	$(this).data('options', options);

	var html = '';
	
	if(!options.disableDecoration) {
		html += '<div class="panel panel-default"><div class="panel-heading"><h2><i class="fa '
			+ options.icon + '"></i><span class="break">' 
			+ options.title + '</span></h2></div>';
	}
	
	html += '<div id="' + divName + 'Placeholder"></div>';

	html += '<div id="' + divName + 'Actions" class="tabActions panel-footer"></div>';
	
	if(!options.disableDecoration) {
		html += '</div>';
	}
	
	$(this).append(html);

	$('div[dialog-for="' + divName + '"]').bootstrapResourceDialog(options);

	var columns = new Array();
	var columnsDefs = new Array();

	$.each(options.fields,function(idx, obj) {
		columns.push({ field : obj.name,
			title: getResource(options.resourceKey + "." + obj.name + '.label'),
			align:'left',
			sortable: true,
			width: '300'
		});	
	});
	
	var renderActions = function(value, row, index) {
		var id = row.id;
		var renderedActions = '';
		if (options.additionalActions) {

			if(options.additionalActionsDropdown && options.additionalActions.length > 0) {
				renderedActions += '<div id="dropdown_' + id + '" class="btn-group"><a class="btn btn-success row-additional dropdown-toggle" data-toggle="dropdown" href="#"><i class="fa fa-gears"></i></a>';
				renderedActions += '<ul class="dropdown-menu dropdown-menu-right" role="menu">';
				$.each(
						options.additionalActions,
						function(x, act) {
							if (act.enabled) {
								renderedActions += '<li><a class="row-' + act.resourceKey + '" href="#"><span>' + getResource(act.resourceKey + ".label") + '</span>&nbsp;&nbsp;<i class="fa ' + act.iconClass + '"></i></a></li>';
			
								$(document).off('click',
									'#' + divName + 'Actions' + id + ' .row-' + act.resourceKey);
								$(document).on(
									'click',
									'#' + divName + 'Actions' + id + ' .row-' + act.resourceKey,
									function() {
										var curRow = $.inArray($(this).closest("tr").get(0), $('#' + divName + 'Placeholder').find('tbody').children()); 
										var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[curRow];
										act.action(resource, function(resource) {
											$('#' + divName + 'Table').dataTable().fnUpdate(resource, curRow);
											$('#' + divName + 'Table').dataTable().fnDraw();
										});
									});
							}
				});
				renderedActions += '</ul></div>';
				
				$(document).on('show.bs.dropdown', '#' + divName + 'Actions' + id, function () {
					var dropdown = $(this);
					
					var curRow = $.inArray($(this).closest("tr").get(0), $('#' + divName + 'Placeholder').find('tbody').children()); 
					var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[curRow];
					
					$.each(options.additionalActions, function(x, act) {
						if(act.enabled) {
							if(act.displayFunction && act.displayFunction != '') {
								var display = window[act.displayFunction].apply(null, [resource]);
								var el = $('.row-' + act.resourceKey, dropdown);   
								if(display) {
									el.show();
								} else {
									el.hide();
								}
							}
							if(act.enableFunction && act.enableFunction != '') {
								if(!window[act.enableFunction].apply(null, [resource])) {
									var el = $('.row-' + act.resourceKey, dropdown);    
									el.parent().addClass('disabled');
									el.attr('disabled', true);
								}
							} 
						}
						
					});
				});
				
			}  else {
				$.each(options.additionalActions,
						function(x, act) {
							if (act.enabled) {

								renderedActions += '<a class="btn ' + (act.buttonClass ? act.buttonClass : 'btn-success') + ' row-' + act.resourceKey + '" href="#"><i class="fa ' + act.iconClass + '"></i></a>';

								$(document).off('click','#' + divName + 'Actions' + id + ' .row-' + act.resourceKey);
								$(document).on('click',
									'#' + divName + 'Actions' + id + ' .row-' + act.resourceKey,
									function() {
										var curRow = $.inArray($(this).closest("tr").get(0), $('#' + divName + 'Placeholder').find('tbody').children()); 
										var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[curRow];
										act.action(resource);
								});
						}

					});
				}

		}

			
		var canUpdate = options.canUpdate;
		if(options.checkUpdate) {
			canUpdate = options.checkUpdate(row);
		}

		renderedActions += '<a class="btn btn-info row-edit" href="#"><i class="fa ' + (options.canUpdate && canUpdate ? 'fa-edit' : 'fa-search') + '"></i></a>';

		$(document).off('click', '#' + divName + 'Actions' + id + ' .row-edit');

		$(document).on(
			'click',
			'#' + divName + 'Actions' + id + ' .row-edit',
			function() {
				var curRow = $.inArray($(this).closest("tr").get(0), $('#' + divName + 'Placeholder').find('tbody').children()); 
				var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[curRow];
				$('div[dialog-for="' + divName + '"]').bootstrapResourceDialog(options.canUpdate && canUpdate ? 'edit' : 'read',
					{ row : curRow, resource : resource });
		});

		if (options.canDelete) {
			
			var canDelete = !row.system;
			if(options.checkDelete) {
				canDelete = !row.system && options.checkDelete(row);
			}
			
			if(canDelete) {
				renderedActions += '<a class="btn btn-danger row-delete" href="#"><i class="fa fa-trash-o"></i></a>';
	
				$(document).off('click', '#' + divName + 'Actions' + id + ' .row-delete');
	
				$(document).on(
					'click',
					'#' + divName + 'Actions' + id + ' .row-delete',
					function() {
						
						log("Entering resource delete for id " + id);
	
						var row = $.inArray($(this).closest("tr").get(0), $('#' + divName + 'Placeholder').find('tbody').children()); 
						var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[row];
	
						bootbox.confirm(getResource(options.resourceKey + ".delete.desc")
								.format(resource.name), function(confirmed) {
							if (confirmed) {
								
								deleteJSON(options.resourceUrl + "/" + id, null, function(data) {
									if (data.success) {
										if (options.resourceDeleted) {
											options.resourceDeleted(resource, data.message);
										}
										$('#' + divName + 'Placeholder').bootstrapTable('remove', {
						                    field: 'id',
						                    values: [resource.id]
						                });
										showSuccess(data.message);
									} else {
										showError(data.message);
									}
								});
							}
					});
				});
			} else {
				renderedActions += '<a class="btn btn-disabled" href="#"><i class="fa fa-trash-o"></i></a>';
			}
			
		}

		return '<div id="' + divName + 'Actions' + id + '" class="tableActions">' + renderedActions + '</div>';
	};
	
	columns.push({ field : "actions",
		align:'center',
		sortable: false,
		formatter: renderActions
	});

	if (options.canCreate) {

		$('#' + divName + 'Actions')
				.append(
					'<button id="' + divName + 'Add" class="btn btn-primary"><i class="fa ' + options.createButtonIcon + '"></i>' + getResource(options.createButtonText) + '</button>');
		$('#' + divName + 'Add').click(function() {
			if (options.showCreate) {
				options.showCreate();
			}
			$('div[dialog-for="' + divName + '"]').bootstrapResourceDialog('create');
		});
	}
	
	if(options.additionalButtons) {
		
		$.each(options.additionalButtons, function() {
			$('#' + divName + 'Actions').append(
				'<button id="' + this.resourceKey + '" class="btn ' + this.buttonClass + '"><i class="fa ' + this.icon + '"></i>' + getResource(this.resourceKey + '.label') + '</button>');
			var button = this;
			$('#' + this.resourceKey).click(function() {
				if(button.action) {
					button.action(function() {
						$('#' + divName + 'Placeholder').bootstrapTable('refresh');
					});
				}
			});
		});
	}
	
	$('#' + divName + 'Placeholder').bootstrapTable({
	    pagination: options.pagination,
	    showHeader: true,
	    page : options.page,
	    pageSize: options.pageSize,
	    pageList: options.pageList,
	    search: options.search,
	    showColumns : options.showColumns,
		showRefresh : options.showRefresh,
	    method: options.method,
	    striped: options.striped,
	    showToggle : options.showToggle,
	    sidePagination: 'server',
	    url: basePath + '/api' + options.tableUrl,
	    columns: columns,
	    onSort: function (name, order) {
	    	var sortColumn;
	    	$.each(options.fields,function(idx, obj) {
	    		if(obj.name == name){
	    			sortColumn = idx;
	    			return false;
	    		}
	    	});
	    	if(sortColumn != undefined){
	    		this.sortName = sortColumn;
	    	}
	    	return false;
	    }
	    
	});

	if (options.complete) {
		options.complete();
	}
};

$.fn.bootstrapResourceDialog = function(params, params2) {

	var dialog = $(this);
	var parent = $(this).parent();
	var options = $.extend(
		{ dialogWidth : 700, dialogHeight : 'auto', hasResourceTable : true },
		params);
	var dialogOptions = $(this).data('options');

	if (params === 'create') {

		log("Creating resource dialog");

		dialogOptions.clearDialog(true);
		dialog.bootstrapResourceDialog('error', 'reset');

		$(this).find('.modal-title').text(
			getResource(dialogOptions.resourceKey + '.create.title'));

		$(this).find('.modal-footer').empty();
		$(this).find('.modal-footer').append(
					'<button type="button" id="' + $(this).attr('id') + 'Action" class="btn btn-primary"><i class="fa fa-save"></i>' + getResource("text.create") + '</button>');
		$('#' + $(this).attr('id') + "Action").off('click');
		$('#' + $(this).attr('id') + "Action").on('click', function() {
				
				var icon = $(this).find('i');
				startSpin(icon, 'fa-save');
				
				log("Creating resource");

				if (dialogOptions.validate) {
					if (!dialogOptions.validate(true)) {
						stopSpin(icon, 'fa-save');
						log("Resource validation failed");
						return;
					}
				}
				
				var resource = dialogOptions.createResource();

				log("Created resource object for posting");

				postJSON(dialogOptions.resourceUrl, resource, function(data) {
					if (data.success) {
						log("Resource object created");
						dialog.bootstrapResourceDialog('close');
						if (dialogOptions.hasResourceTable) {
//							$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('append',	data.resource);
							$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('refresh');
						}
						if (dialogOptions.resourceCreated) {
							dialogOptions.resourceCreated(data.resource);
						}
						showSuccess(data.message);
					} else {
						log("Resource object creation failed " + data.message);
						dialog.bootstrapResourceDialog('error', data.message);
					}
				}, null, function() { stopSpin(icon, 'fa-save');});
			});
		dialog.modal('show');

	} else if (params === 'edit' || params === 'read') {
		var readOnly = params==='read';
		dialogOptions.clearDialog(false);
		dialog.bootstrapResourceDialog('error', 'reset');
		dialogOptions.displayResource(params2.resource, readOnly);
		
		if(readOnly) {
			$(this).find('.modal-title').text(
					getResource(dialogOptions.resourceKey + '.view.title'));
		} else {
			$(this).find('.modal-title').text(
					getResource(dialogOptions.resourceKey + '.update.title'));
		}

		$(this).find('.modal-footer').empty();
		if(!readOnly) {
			$(this).find('.modal-footer').append(
						'<button type="button" id="' + $(this).attr('id') + 'Action" class="btn btn-primary"><i class="fa fa-save"></i>' + getResource("text.update") + '</button>');
			$('#' + $(this).attr('id') + "Action").off('click');
			$('#' + $(this).attr('id') + "Action").on('click', function() {

				var icon = $(this).find('i');
				startSpin(icon, 'fa-save');
				
				log('Updating resource');
				
				if (dialogOptions.validate) {
					if (!dialogOptions.validate(false)) {
						stopSpin(icon, 'fa-save');
						return;
					}
				}
				
				var resource = dialogOptions.createResource();

				postJSON(dialogOptions.resourceUrl, resource, function(data) {
					if (data.success) {
						dialog.bootstrapResourceDialog('close');
						if (dialogOptions.hasResourceTable) {
							updateRow = {index: params2.row, row: data.resource}
							$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('updateRow',	updateRow);
						}
						if (dialogOptions.resourceUpdated) {
							dialogOptions.resourceUpdated(data.resource);
						}
						showSuccess(data.message);
					} else {
						dialog.bootstrapResourceDialog('error', data.message);
					}
				}, null, function() { stopSpin(icon, 'fa-save');});

			});
		}
		
		dialog.modal('show');

	} else if (params === 'close') {
		dialog.modal('hide');
	} else if (params === 'error') {

		$('#dialogErrorHighlight' + $(this).attr('id'), $(this)).remove();

		if (params2 != 'reset') {
			$(this).prepend(
						'<div id="dialogErrorHighlight' + $(this).attr('id') + '" class="alert alert-danger"/>');
			$('#dialogErrorHighlight' + $(this).attr('id')).append('<i class="fa fa-warning"></i>&nbsp;&nbsp;<span>' 
					+ (getResourceNoDefault(params2) == undefined ? params2 : getResource(params2)) + '</span>');
		}
	} else {
		if (!options.resourceKey) {
			alert("Bad usage, resourceKey not set");
		} else {
			$(this).data('options', options);
		}
	}
};