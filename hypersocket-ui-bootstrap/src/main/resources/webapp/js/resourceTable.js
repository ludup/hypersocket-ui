$.fn.resourceTable = function(params) {
	
	var divName = $(this).attr('id');

	log("Creating resource table for div " + divName);

	var options = $
			.extend(
				{ divName : divName, canCreate : false, canUpdate : false, canDelete : false,
					icon : 'fa-cog', disableDecoration: false, createButtonText: "text.add", createButtonIcon: "fa-plus-circle" },
				params);

	$(this).data('options', options);

	var html = '';
	
	if(!options.disableDecoration) {
		html += '<div class="panel panel-default"><div class="panel-heading"><h2><i class="fa '
			+ options.icon + '"></i><span class="break">' 
			+ options.title + '</span></h2></div>'
			//+ '<div id="' + divName + 'Panel" class="panel-body">';
	}
	
	/*html +=	'<table class="table'
		+ (options.selected ? '' : ' table-striped') + '" id="'
		+ divName + 'Table' + '"><thead><tr id="'
		+ divName + 'TableHeader"></tr></thead></table>';
	
	if(!options.disableDecoration) {
		html +=	'</div>';
	}*/
	html += '<div id="' + divName + 'Placeholder"></div>';

	html += '<div id="' + divName + 'Actions" class="tabActions panel-footer"></div>';
	

	if(!options.disableDecoration) {
		html += '</div>';
	}
	
	$(this).append(html);

	$('div[dialog-for="' + divName + '"]').resourceDialog(options);

	var columns = new Array();
	var columnsDefs = new Array();

	$.each(options.fields,function(idx, obj) {
		columns.push({ field : obj.name,
			title: getResource(options.resourceKey + "." + obj.name + '.label'),
			align:'left',
			sortable: true
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
										var curRow = $('#' + divName + 'Table').dataTable()
												.fnGetPosition($(this).closest("tr").get(0));
										var resource = $('#' + divName + 'Table').dataTable()
												.fnGetData(curRow);
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
					var curRow = $('#' + divName + 'Table').dataTable().fnGetPosition($(this).closest("tr").get(0));
					var resource = $('#' + divName + 'Table').dataTable().fnGetData(curRow);
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
										var curRow = $('#' + divName + 'Table').dataTable()
												.fnGetPosition($(this).closest("tr").get(0));
										var resource = $('#' + divName + 'Table').dataTable()
												.fnGetData(curRow);
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
				$('div[dialog-for="' + divName + '"]').resourceDialog(options.canUpdate && canUpdate ? 'edit' : 'read',
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

	/*$('#' + divName + 'TableHeader').append(
		'<th localize="text.actions" class="col-md-2"></th>');
	columns.push({ "mData" : null, 
		"fnRender" : renderActions, 
		"bAutoWidth" : false, 
		"sWidth" : "150px", 
		"bSortable" : false 
		});

	var oTable = $('#' + divName + 'Table')
			.dataTable(
				{ "bProcessing" : true, 
					"bServerSide" : true, 
					"sAjaxSource" : basePath + "/api/" + options.tableUrl, 
					"iDisplayLength": 10,
					"aoColumns" : columns, 
					"aoColumnDefs" : columnsDefs });

	if(options.selected) {
	    var tableTools = new $.fn.dataTable.TableTools( oTable, {
	        sRowSelect: "os",
	        fnRowSelected: function ( nodes ) {
	        	var full = oTable.fnGetData(nodes[0]);
	        	options.selected(full);
	        }
	    });
	}
	*/
	if (options.canCreate) {

		$('#' + divName + 'Actions')
				.append(
					'<button id="' + divName + 'Add" class="btn btn-primary"><i class="fa ' + options.createButtonIcon + '"></i>' + getResource(options.createButtonText) + '</button>');
		$('#' + divName + 'Add').click(function() {
			if (options.showCreate) {
				options.showCreate();
			}
			$('div[dialog-for="' + divName + '"]').resourceDialog('create');
		});
	}
	/*
	if(options.additionalButtons) {
		
		$.each(options.additionalButtons, function() {
			$('#' + divName + 'Actions').append(
				'<button id="' + this.resourceKey + '" class="btn ' + this.buttonClass + '"><i class="fa ' + this.icon + '"></i>' + getResource(this.resourceKey + '.label') + '</button>');
			var button = this;
			$('#' + this.resourceKey).click(function() {
				if(button.action) {
					button.action(function() {
						$('#' + divName + 'Table').dataTable().fnDraw();
					});
				}
			});
		});
	}*/
	
	$('#' + divName + 'Placeholder').bootstrapTable({
	    pagination: true,
	    showHeader: true,
	    pageSize: 5,
	    pageList: [5, 10, 25],
	    search: true,
	    method: 'get',
	    striped: true,
	    sidePagination: 'server',
	    url: basePath + '/api' + options.tableUrl,
	    onLoadSuccess: function(){
	    	$('#' + divName + 'Placeholder').find('thead').css('width', '100%');
	    	$('#' + divName + 'Placeholder').find('tbody').css('width', '100%');
	    },
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