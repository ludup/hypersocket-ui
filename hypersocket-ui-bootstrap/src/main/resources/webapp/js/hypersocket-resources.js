var newTable = true;

$.fn.ajaxResourcePageInsert = function(resource) {
	$(this).data('dataTable').fnAddData(resource);
};

$.fn.ajaxResourcePage = function(params) {

	if(newTable) {
		return $(this).resourceTable(params);
	} else {
		return $(this).oldResourcePage(params);
	}
	
}

$.fn.iconPage = function(params) {
	
	var divName = $(this).attr('id');
	
	$('#' + divName).append('<div class="panel panel-default"><div id="' + divName + 'Icons" class="panel-body"></div></div>');
	divName = '#' + divName + 'Icons';
	
	var options = $.extend({
		
	}, params);
	
	getJSON(options.url, null, function(data) {
		var row = 6;
		
		$(divName).append('<div class="row"></div>');
		$.each(data.resources, function(idx, resource) {
			
			row--;
			
			if(row==0) {
				$(divName).append('<div class="row"></div>');
				row = 12;
			}
			$(divName).children('.row').last().append('<div class="col-xs-2" style="height: 100px; margin: 10px;"></div>');
			
			var prefix = "logo://";
			var value = resource.logo;
			var itype = options.logoResourceTypeCallback ? options.logoResourceTypeCallback(resource) : 'default';
			if(!resource) {
				return;
			}
			if(!value) {
				value = 'logo://100_autotype_autotype_auto.png';
			}
			
			if(value.slice(0, prefix.length) == prefix) {
				var txt = resource.name;
				if(!txt || txt == '')
					txt = 'Default';
				var uri = basePath + '/api/logo/' + encodeURIComponent(itype) + "/" + encodeURIComponent(txt) + '/' + value.slice(prefix.length);
				$(divName).children('.row').children('.col-xs-2').last().append('<img width="100" height="100" src="' + uri + '"/>');
			}
			else {
				var idx = value.indexOf('/');
				if(idx == -1) {
					$(divName).children('.row').children('.col-xs-1').last().append(
							'<img width="100" height="100" src="' + (basePath + '/api/files/download/' + value)+ '"/>');
				} else {
					$(divName).children('.row').children('.col-xs-2').last().append('<img width="100" height="100" src="' + (basePath + '/api/' + value)+ '"/>');
				}
			}
		});
		
		if(options.complete) {
			options.complete();
		}
	});
};

$.fn.resourceDialog = function(params, params2) {
	$(this).bootstrapResourceDialog(params, params2);
};

$.fn.resourceTable = function(params) {
	
	var divName = $(this).attr('id');

	log("Creating resource table for div " + divName);

	var options = $.extend({
		checkbox: false,
		radio: false,
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
		sortName: 'name',
		sortOrder: 'asc',
		disableDecoration: false,
		disableActionsDropdown: false,
		createButtonText: "text.add",
		createButtonIcon: "fa-plus-circle",
		logo: false,
		defaultView: 'table',
		logoResourceTypeCallback: false,
		firstLoad: true
		},params);

	$(this).data('options', options);

	var html = '';

	if(!options.disableDecoration) {
		html += '<div class="panel panel-default"><div class="panel-heading"><h2><i class="fa '
			+ options.icon + '"></i><span class="break">' 
			+ options.title + '</span></h2></div>';
	}
	
	html += '<table id="' + divName + 'Placeholder"></table>';

	html += '<div id="' + divName + 'Actions" class="tabActions panel-footer"></div>';
	
	if(!options.disableDecoration) {
		html += '</div>';
	}
	
	$(this).append(html);

	$('div[dialog-for="' + divName + '"]').bootstrapResourceDialog(options);

	var columns = new Array();
	var columnsDefs = new Array();
	var sortColumns = new Array();
	
	if(options.logo) {
		var c = { field : 'logo',
				title: getResource(options.resourceKey + '.logo.label'),
				align:'left',
				sortable: false,
				formatter: function(value, row, index) {
					var prefix = "logo://";
					var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[index];
					var itype = options.logoResourceTypeCallback ? options.logoResourceTypeCallback(resource) : 'default';
					if(!resource) {
						return '';
					}
					if(!value) {
						value = 'logo://32_autotype_autotype_auto.png';
					}
					
					if(value.slice(0, prefix.length) == prefix) {
						var txt = resource.name;
						if(!txt || txt == '')
							txt = 'Default';
						var uri = basePath + '/api/logo/' + encodeURIComponent(itype) + "/" + encodeURIComponent(txt) + '/' + value.slice(prefix.length);
						return '<img class="resource-logo" src="' + uri + '"/>';
					}
					else {
						var idx = value.indexOf('/');
						if(idx == -1)
							return '<img class="resource-logo" src="' + (basePath + '/api/files/download/' + value)+ '"/>';
						else
							return '<img class="resource-logo" src="' + (basePath + '/api/' + value)+ '"/>';
					}
				}
		};
		columns.push(c);	
	}

	$.each(options.fields,function(idx, obj) {
		var c = { field : obj.name,
				title: getResource(options.resourceKey + "." + obj.name + '.label'),
				align:'left',
				sortable: obj.sortable || obj.name === options.sortName,
				formatter: obj.formatter
		};
		columns.push(c);	
	});
	
	if(options.searchFields) {
		$.each(options.searchFields,function(idx, obj) {
			var c = { value : obj.name,
					name: getResource(options.resourceKey + "." + obj.name + '.label')
			};
			sortColumns.push(c);	
		});
	}
	
	
	if(!$('#additionalActions').length) {
		$('body').append('<div id="additionalActions"></div>');
	}
	
	if(options.exportUrl) {
		if(!options.additionalActions) {
			options.additionalActions = new Array();
		}
		if(!options.toolbarButtons) {
			options.toolbarButtons = new Array();
		}

		options.additionalActions.push({
			resourceKey : 'exportResource',
			iconClass : 'fa-download',
			action : function(resource, callback) {
				window.location = basePath + '/api/' + options.exportUrl + '/' + resource.id;
				callback();
			},
			enabled : true
		});
		
		options.toolbarButtons.push({ 
			resourceKey: 'exportResources',
			icon: 'fa-download',
			action: function(selections, callback) {
				window.location = basePath + '/api/' + options.exportUrl;
				callback();
			}
		});
	}
	
	if(options.importUrl) {

		if(!options.toolbarButtons) {
			options.toolbarButtons = new Array();
		}
		
		if(!$('#importResourcesPlaceholder').length) {
			$('body').append('<div id="importResourcesPlaceholder"></div>');
			$('#importResourcesPlaceholder').load(uiPath + "content/importResourceDialog.html");
		}
		options.toolbarButtons.push({ 
			resourceKey: 'importResources',
			icon: 'fa-upload',
			action: function(selections, callback) {
				$('#importResources').data('importUrl', options.importUrl);
				$('#importResources').data('action')(callback);
			}
		});
	}
	
	var renderActions = function(value, row, index) {
		var id = row.id;
		var renderedActions = '';
		
		if (options.additionalActions) {

			if(!options.disableActionsDropdown && options.additionalActions.length > 1) {
				renderedActions += '<div id="dropdown_' + id + '" class="btn-group"><a class="btn btn-success row-additional dropdown-toggle btn-action" data-toggle="dropdown" href="#"><i class="fa fa-gears"></i></a>';
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
											$('#' + divName + 'Placeholder').bootstrapTable('refresh');
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
								var display = window[act.displayFunction].apply(null, [resource, act]);
								var el = $('.row-' + act.resourceKey, dropdown);   
								if(display) {
									el.show();
								} else {
									el.hide();
								}
							}
							if(act.enableFunction && act.enableFunction != '') {
								if(!window[act.enableFunction].apply(null, [resource, act])) {
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

								renderedActions += '<a class="btn ' + (act.buttonClass ? act.buttonClass : 'btn-success') + ' row-' 
												+ act.resourceKey + ' btn-action" href="#" data-toggle="tooltip" data-placement="top" title="' 
												+ getResource(act.resourceKey + ".label") + '"><i class="fa ' + act.iconClass + '"></i></a>';

								$(document).off('click','#' + divName + 'Actions' + id + ' .row-' + act.resourceKey);
								$(document).on('click',
									'#' + divName + 'Actions' + id + ' .row-' + act.resourceKey,
									function() {
										var curRow = $.inArray($(this).closest("tr").get(0), $('#' + divName + 'Placeholder').find('tbody').children()); 
										var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[curRow];
										act.action(resource, function(resource) {
											$('#' + divName + 'Placeholder').bootstrapTable('refresh');
										});
								});
						}

					});
				
	
				}

		}

			
		var canUpdate = options.canUpdate;
		if(options.checkUpdate) {
			canUpdate = options.checkUpdate(row);
		}

		if(!options.disableEditView) {
			renderedActions += '<a class="btn btn-info row-edit btn-action" href="#"><i class="fa ' + (options.canUpdate && canUpdate ? 'fa-edit' : 'fa-search') + '"></i></a>';
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
		}

		if (options.canDelete) {
			
			var canDelete = !row.system;
			if(options.checkDelete) {
				canDelete = !row.system && options.checkDelete(row);
			}
			
			if(canDelete) {
				renderedActions += '<a class="btn btn-danger row-delete btn-action" href="#"><i class="fa fa-trash-o"></i></a>';
	
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
										$('#' + divName + 'Placeholder').bootstrapTable('refresh');
										showSuccess(data.message);
									} else {
										showError(data.message);
									}
								});
							}
					});
				});
			} else {
				renderedActions += '<a class="btn btn-disabled btn-action" href="#"><i class="fa fa-trash-o"></i></a>';
			}
			
		}

		return '<div id="' + divName + 'Actions' + id + '" class="tableActions">' + renderedActions + '</div>';
	};
	
	columns.push({ field : "actions",
		align:'right',
		formatter: renderActions,
		width: 125
	});

	if (options.canCreate) {

		$('#' + divName + 'Actions')
				.append(
					'<button id="' + divName + 'Add" class="btn btn-primary"><i class="fa ' + options.createButtonIcon + '"></i>' + getResource(options.createButtonText) + '</button>');
		$('#' + divName + 'Add').click(function() {
			if (options.showCreate) {
				options.showCreate();
			}
			$('div[dialog-for="' + divName + '"]').bootstrapResourceDialog('create', $('#'+divName).data('createCallback'));
		});
	}

	$('#' + divName + 'Placeholder').on('post-body.bs.table', function() {
		$('[data-toggle="tooltip"]').tooltip();
	});
	
	$('#' + divName + 'Placeholder').bootstrapTable({
	    pagination: options.pagination,
	    checkbox: options.checkbox,
	    radio: options.radio,
	    showHeader: true,
	    page : options.page,
	    pageSize: options.pageSize,
	    pageList: options.pageList,
	    search: options.search,
	    showColumns : columns.length > 2 && options.showColumns,
		showRefresh : options.showRefresh,
	    method: options.method,
	    striped: options.striped,
	    showToggle : options.showToggle,
	    sidePagination: 'server',
	    url: basePath + '/api/' + options.tableUrl,
	    columns: columns,
	    sortName: options.sortName,
	    sortOrder: options.sortOrder,
	    sortable: true,
	    cache: false,
	    onSort: function(name, order) {

	    	$('#' + divName + 'Placeholder').bootstrapTable('refreshOptions', {
	    		sortName: name,
	    		sortOrder: order
	    	});
	    	
	    	$('#' + divName + 'Placeholder').bootstrapTable('refresh');
	    },
	    detailView: options.detailFormatter != undefined,
	    detailFormatter: options.detailFormatter,
	    onClickRow: function(row) {
	    	if(options.selected) {
	    		options.selected(row);
	    	}
	    },
	    queryParams: function(params) {
	    	if($('#searchColumn').widget()) {
	    		params.searchColumn = $('#searchColumn').widget().getValue();
	    	}
	    	return params;
	    },
	    onPageChange: function(number, size){
	    	if(options.id){
	    		var sortColumn = $('#' + divName + 'Placeholder').bootstrapTable('getOptions').sortName;
	    		var sortOrder = $('#' + divName + 'Placeholder').bootstrapTable('getOptions').sortOrder;
	    		var tableState = {'name': options.id, 'specific': true, 'preferences': JSON.stringify({'pageSize': size, 'sortColumn': sortColumn, 'sortOrder': sortOrder})};
	    		postJSON('interfaceState/state', tableState, function(data) {			
	    		});
	    	}
	    },
	    onSort: function(name, order){
	    	if(options.id){
	    		var size = $('#' + divName + 'Placeholder').bootstrapTable('getOptions').pageSize;
	    		var tableState = {'name': options.id, 'specific': true, 'preferences': JSON.stringify({'pageSize': size, 'sortColumn': name, 'sortOrder': order})};
	    		postJSON('interfaceState/state', tableState, function(data) {
	    		});
	    	}
	    },
	    onPreBody: function(args){
	    	if(options.firstLoad && options.id && args.length){
	    		options.firstLoad = false;
	    		$.ajax({
	    			type: 'GET',
	    			url: basePath + '/api/interfaceState/tableState/' + options.id,
	    			cache: false,
	    			async: false,
	    			success: function(data) {
	    				if(data.success){
	    					var preferences = JSON.parse(data.resource.preferences);
		    				$('#' + divName + 'Placeholder').bootstrapTable('refreshOptions', preferences);
	    				}
	    			},
	    			error: function(jqXHR, textStatus, errorThrown) {
	    				
	    			}
	    		});
	    	}
	    },
	    onLoadSuccess: function(){
	    	if (options.logo) {
	    		if(!$('#' + divName + 'ToggleGrid').length){
	    			$('#' + divName).find('.fixed-table-toolbar').find('.columns.columns-right.btn-group.pull-right').append('<button id="' + divName + 'ToggleGrid" class="btn btn-default" type="button" name="grid" title="' + getResource('text.toggleViewMode') + '"><i class="glyphicon fa fa-picture-o"></button>');
	    			$('#' + divName + 'Placeholder').parent().append('<div id="' + divName + 'Grid" class="fixed-table-container" style="padding-bottom: 0px;"></div>');
			    	$('#' + divName + 'ToggleGrid').click(function(){
			    		$('#' + divName + 'Placeholder').toggle();
			    		$('#' + divName + 'Grid').toggle();
			    	});
	    		}else{
	    			$('#' + divName + 'Grid').empty();
	    		}
	    		if(options.defaultView && options.defaultView == 'logo'){
	    			$('#' + divName + 'Placeholder').hide();
	    			$('#' + divName + 'Grid').show();
	    		}else{
	    			$('#' + divName + 'Placeholder').show();
	    			$('#' + divName + 'Grid').hide();
	    		}
	    		var gridResourceList = $('#' + divName + 'Placeholder').bootstrapTable('getData');
	    		if(!gridResourceList.length){
	    			$('#' + divName + 'Grid').append('<div class="no-records-found">' + getResource('text.noMatchingRecords') + '</div>');
	    		}else{
	    			$.each(gridResourceList, function(index, resource){
						var prefix = "logo://";
						var value = resource.logo;
						var itype = options.logoResourceTypeCallback ? options.logoResourceTypeCallback(resource) : 'default';
						if(!resource) {
							return;
						}
						if(!value) {
							value = 'logo://100_autotype_autotype_auto.png';
						}
						
						if(value.slice(0, prefix.length) == prefix) {
							var txt = resource.name;
							if(!txt || txt == '')
								txt = 'Default';
							var uri = basePath + '/api/logo/' + encodeURIComponent(itype) + "/" + encodeURIComponent(txt) + '/' + value.slice(prefix.length);
							$('#' + divName + 'Grid').append('<div id="' + resource.id + 'GridDiv" class="template" style="float:left; height:180px;"><div><img width="100" height="100" src="' + uri + '"/></div><span>' + resource.name + '</span><div id="' + resource.id + 'GridOptions" class="gridOptions"></div></div>');
						}
						else {
							var idx = value.indexOf('/');
							if(idx == -1) {
								$('#' + divName + 'Grid').append('<div id="' + resource.id + 'GridDiv" class="template" style="float:left; height:180px;"><div><img width="100" height="100" src="' + (basePath + '/api/files/download/' + value)+ '"/></div><span>' + resource.name + '</span><div id="' + resource.id + 'GridOptions" class="gridOptions"></div></div>');
							} else {
								$('#' + divName + 'Grid').append('<div id="' + resource.id + 'GridDiv" class="template" style="float:left; height:180px;"><div><img width="100" height="100" src="' + (basePath + '/api/' + value)+ '"/></div><span>' + resource.name + '</span><div id="' + resource.id + 'GridOptions" class="gridOptions"></div></div>');
							}
						}
						$('#' + resource.id + 'GridOptions').hide();
						$('#' + resource.id + 'GridDiv').hover(function() {
							$('#' + resource.id + 'GridOptions').show();
						}, function() {
							$('#' + resource.id + 'GridOptions').hide();
						});
						var renderedActions = '';
						if (options.additionalActions) {

							if(!options.disableActionsDropdown && options.additionalActions.length > 1) {
								renderedActions += '<div id="gridDropdown_' + resource.id + '" class="btn-group"><a class="btn btn-success row-additional dropdown-toggle btn-action" data-toggle="dropdown" href="#"><i class="fa fa-gears"></i></a>';
								renderedActions += '<ul class="dropdown-menu dropdown-menu-right" role="menu">';
								$.each(options.additionalActions, function(x, act) {
									if (act.enabled) {
										renderedActions += '<li><a class="row-' + act.resourceKey + '" href="#"><span>' + getResource(act.resourceKey + ".label") + '</span>&nbsp;&nbsp;<i class="fa ' + act.iconClass + '"></i></a></li>';
					
										$(document).off('click', '#' + resource.id + 'GridOptions .row-' + act.resourceKey);
										$(document).on('click', '#' + resource.id + 'GridOptions .row-' + act.resourceKey, function() {
											act.action(resource, function(resource) {
												$('#' + divName + 'Placeholder').bootstrapTable('refresh');
											});
										});
									}
								});
								renderedActions += '</ul></div>';
								
								$(document).on('show.bs.dropdown', '#' + divName + 'GridActions' + resource.id, function () {
									var dropdown = $(this);
									$.each(options.additionalActions, function(x, act) {
										if(act.enabled) {
											if(act.displayFunction && act.displayFunction != '') {
												var display = window[act.displayFunction].apply(null, [resource, act]);
												var el = $('.row-' + act.resourceKey, dropdown);   
												if(display) {
													el.show();
												} else {
													el.hide();
												}
											}
											if(act.enableFunction && act.enableFunction != '') {
												if(!window[act.enableFunction].apply(null, [resource, act])) {
													var el = $('.row-' + act.resourceKey, dropdown);    
													el.parent().addClass('disabled');
													el.attr('disabled', true);
												}
											} 
										}
									});
								});
							}else{
								$.each(options.additionalActions, function(x, act) {
									if (act.enabled) {
										renderedActions += '<a class="btn ' + (act.buttonClass ? act.buttonClass : 'btn-success') + ' row-' 
												+ act.resourceKey + ' btn-action" href="#" data-toggle="tooltip" data-placement="top" title="' 
												+ getResource(act.resourceKey + ".label") + '"><i class="fa ' + act.iconClass + '"></i></a>';
										$(document).off('click', '#' + resource.id + 'GridOptions .row-' + act.resourceKey);
										$(document).on('click', '#' + resource.id + 'GridOptions .row-' + act.resourceKey, function() {
											act.action(resource, function(resource) {
												$('#' + divName + 'Placeholder').bootstrapTable('refresh');
											});
										});
									}
								});
							}
						}
						var canUpdate = options.canUpdate;
						if(options.checkUpdate) {
							canUpdate = options.checkUpdate(resource);
						}

						if(!options.disableEditView) {
							renderedActions += '<a class="btn btn-info row-edit btn-action" href="#"><i class="fa ' + (options.canUpdate && canUpdate ? 'fa-edit' : 'fa-search') + '"></i></a>';
							$(document).off('click', '#' + resource.id + 'GridOptions .row-edit');
							$(document).on('click', '#' + resource.id + 'GridOptions .row-edit', function() {
								$('div[dialog-for="' + divName + '"]').bootstrapResourceDialog(options.canUpdate && canUpdate ? 'edit' : 'read', { row : index, resource : resource });
							});
							$(document).off('click', '#' + resource.id + 'GridDiv img');
							$(document).on('click', '#' + resource.id + 'GridDiv img', function() {
								$('div[dialog-for="' + divName + '"]').bootstrapResourceDialog(options.canUpdate && canUpdate ? 'edit' : 'read', { row : index, resource : resource });
							});
							$('#' + resource.id + 'GridDiv img').css('cursor', 'pointer');
						}

						if (options.canDelete) {
							var canDelete = !resource.system;
							if(options.checkDelete) {
								canDelete = !resource.system && options.checkDelete(resource);
							}
							
							if(canDelete) {
								renderedActions += '<a class="btn btn-danger row-delete btn-action" href="#"><i class="fa fa-trash-o"></i></a>';
								$(document).off('click', '#' + resource.id + 'GridOptions .row-delete');
								$(document).on('click', '#' + resource.id + 'GridOptions .row-delete', function() {
									log("Entering resource delete for id " + resource.id);
									bootbox.confirm(getResource(options.resourceKey + ".delete.desc").format(resource.name), function(confirmed) {
										if (confirmed) {
											deleteJSON(options.resourceUrl + "/" + resource.id, null, function(data) {
												if (data.success) {
													if (options.resourceDeleted) {
														options.resourceDeleted(resource, data.message);
													}
													$('#' + divName + 'Placeholder').bootstrapTable('remove', {field: 'id', values: [resource.id]});
													$('#' + divName + 'Placeholder').bootstrapTable('refresh');
													showSuccess(data.message);
												} else {
													showError(data.message);
												}
											});
										}
									});
								});
							} else {
								renderedActions += '<a class="btn btn-disabled btn-action" href="#"><i class="fa fa-trash-o"></i></a>';
							}
						}
						$('#' + resource.id + 'GridOptions').append(renderedActions);
					});
					$('#' + divName + 'Grid').append('<div class="template" style="float:left; width:100%; height:0px;"></div>');
	    		}
			}
	    }
	});
	
	if(sortColumns.length > 0) {
		$('#' + divName).find('.fixed-table-toolbar').last().append('<div class="tableToolbar pull-right search"><label>Search By:</label><div class="toolbarWidget" id="searchColumn"></div></div>');
		$('#searchColumn').textDropdown({
			values: sortColumns,
			value: sortColumns[0].name,
			changed: function(widget) {
				$('.search input[placeholder="Search"]').val('');
				$('#' + divName + 'Placeholder').bootstrapTable('refreshOptions', { searchText: ''});
				$('#' + divName + 'Placeholder').bootstrapTable('refresh');
			}
		});
	}
	if(options.toolbarButtons) {
		$.each(options.toolbarButtons, function(idx, action) {
			$('#' + divName).find('.fixed-table-toolbar').find('.btn-group').first().prepend('<button id="' 
					+ divName + action.resourceKey + 'TableAction" class="btn btn-default" data-toggle="tooltip" title="' 
					+ getResource(action.resourceKey + '.label') + '"><i class="fa ' 
					+ action.icon + '"></i></button>');
			
			$('#' + divName + action.resourceKey + 'TableAction').on('click', function(e) {
				if(action.action) {
					action.action($('#' + divName + 'Placeholder').bootstrapTable('getAllSelections'), function() {
						$('#' + divName + 'Placeholder').bootstrapTable('refresh');
					});
				}
			});
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
	
	if (options.complete) {
		options.complete();
	}
	
	var callback = {
		refresh: function() {
			$('#' + divName + 'Placeholder').bootstrapTable('refresh');
		},
		showCreate: function(callback) {
			$('#'+divName).data('createCallback', callback);
			$('#' + divName + 'Add').trigger('click');
			
		}
	}
	
	return callback;
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
		removeMessage();

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
							$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('refresh');
						}
						if (dialogOptions.resourceCreated) {
							dialogOptions.resourceCreated(data.resource);
						}
						if(params2 && params2.resourceCreated) {
							params2.resourceCreated(data.resource);
						}
						showSuccess(data.message);
					} else {
						log("Resource object creation failed " + data.message);
						showError(data.message);
					}
				}, null, function() { stopSpin(icon, 'fa-save');});
			});
		dialog.modal('show');

	} else if (params === 'edit' || params === 'read') {
		var readOnly = params==='read';
		dialogOptions.clearDialog(false);
		removeMessage();
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
							$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('refresh');
						}
						if (dialogOptions.resourceUpdated) {
							dialogOptions.resourceUpdated(data.resource);
						}
						if(params2.resourceUpdated) {
							params2.resourceUpdated(data.resource);
						}
						showSuccess(data.message);
					} else {
						showError(data.message);
					}
				}, null, function() { stopSpin(icon, 'fa-save');});

			});
		}
		
		dialog.modal('show');

	} else if (params === 'close') {
		dialog.modal('hide');
	} else if (params === 'error') {
		if(params2 == 'reset') {
			removeMessage();
		} else {
			showError(params2);
		}
	} else {
		if (!options.resourceKey) {
			alert("Bad usage, resourceKey not set");
		} else {
			$(this).data('options', options);
		}
	}
};