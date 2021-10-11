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
			
			if(!resource) {
				return;
			}

			var uri = getLogoPath(options.logoResourceTypeCallback ? options.logoResourceTypeCallback(resource) : 'default', resource.logo, resource.name);
			$(divName).children('.row').children('.col-xs-2').last().append('<img width="100" height="100" src="' + uri + '"/>');
		});
		
		if(options.complete) {
			options.complete();
		}
	});
};

$.fn.resourceDialog = function(params, params2) {
	$(this).bootstrapResourceDialog(params, params2);
};

function saveResource(resource, buttonElement, options, mode, closeCallback, alwaysCallback) {
	var icon = buttonElement.find('i');
	startSpin(icon, 'fa-save');
	
	log("Creating resource");

	if (options.validate) {
		if (!options.validate(mode === 'create' || mode === 'copy')) {
			stopSpin(icon, 'fa-save');
			log("Resource validation failed");
			return;
		}
	}

	log("Created resource object for posting");

	postJSON(options.resourceUrl, resource, function(data) {

		if (data.success) {
			
			log("Resource object created");
			stopSpin(icon, 'fa-save');
			if(closeCallback) {
				closeCallback(data.resource);
			}
			if (options.resourceCreated) {
				options.resourceCreated(data.resource);
			}
			checkBadges(false);
			showSuccess(data.message);
			$('.showOnComplete').show();
		} else if(data.confirmation) {
			
			bootbox.confirm({
			    message: data.message.format(data.args),
			    buttons: {
			        confirm: {
			            label: getResource(options.confirmationButtonSuccess ? options.confirmationButtonSuccess : 'text.yes'),
			            className: 'btn-success'
			        },
			        cancel: {
			            label: getResource(options.confirmationButtonCancel ? options.confirmationButtonCancel : 'text.no'),
			            className: 'btn-danger'
			        }
			    },
			    callback: function (result) {
			        if(result) {
			        	if(options.confirmed) {
			        		options.confirmed(resource, data.args);
			        	}
			        	saveResource(resource, buttonElement, options, mode, closeCallback);
			        }
			        else
			    		stopSpin(icon, 'fa-save');
			    }
			});

		} else if(data.information) {
			
			bootbox.confirm({
			    message: data.message.format(data.args),
			    buttons: {
			        confirm: {
			            label: getResource('text.ok'),
			            className: 'btn-success'
			        }
			    },
			    callback: function (result) {
			        if(result) {
			        	var proceed = true;
			        	if(options.confirmed) {
			        		proceed = !options.confirmed(resource, data.args);
			        	}
			        	if(proceed) {
			        		saveResource(resource, buttonElement, options, mode, closeCallback);
			        	}
			        	else
			        		stopSpin(icon, 'fa-save');
			        }
			    }
			});

		} else {
			log("Resource object creation failed " + data.message);
			showError(data.message);
			stopSpin(icon, 'fa-save');
		}
	}, null, function() { 
		log('Finalising save');
		if(alwaysCallback)
			alwaysCallback();
	});
}

$.fn.resourceTable = function(params) {
	
	var divName = $(this).attr('id');

	log("Creating resource table for div " + divName);

	var options = $.extend({
		additionalActionsId: 'additionalActions', 
		checkbox: false,
		radio: false,
		divName : divName,
		striped	: true,
		method : 'get',
		pagination : true,
		paginationVAlign: 'bottom',
		parameters: false,
		page : 1,
		pageSize: 25,
		pageList : [ 5, 10, 25, 50, 100, 250, 500],
		search: true,
		showColumns : true,
		showRefresh : true,
	    showToggle : false,
		canCreate : false,
		canCopy : true,
		canUpdate : false,
		checkReadOnly: true,
		canDelete : false,
		icon : 'fa-cog',
		sortName: 'name',
		sortOrder: 'asc',
		disableDecoration: false,
		disableActionsDropdown: false,
		createButtonText: "text.add",
		createButtonIcon: "fa-plus-circle",
		confirmationButtonSuccess: 'text.yes',
		confirmationButtonCancel: 'text.no',
		logo: false,
		defaultView: 'table',
		logoResourceTypeCallback: false,
		hasResourceTable: true,
		showViewButtons: true,
		onSave : false,
		stayOnPageAfterSave: false,
		bulkAssignment: false,
		assignable: false,
		rowStyle: false,
		loaded: false,
		onReady: false,
		}, params);
	
	
	/* Track when the table is COMPLETELY ready, i.e. data is loaded, header Dom is ready, 
	 * table Dom is ready.
	 */
	var checkReady = {
		readyDone: false,
		tableReady: false,
		headerReady: false,
		dataReady: false,
		check: function() {
			if(this.readyDone)
				return;
			if(this.tableReady && this.headerReady && this.dataReady) {
				this.readyDone = true;
				if(options.onReady)
					options.onReady($('#' + divName));
			}
		}
	};

	options.tableView = $('#' + divName);
	
	$(this).data('options', options);

	var resourceType  = "";
	if(options.resourceUrl.indexOf("/") != -1) {
	    var parts = options.resourceUrl.split("/");
	    resourceType = parts[0];
	}

	var html = '';
	if(!options.disableDecoration) {
		html += '<div class="panel panel-default showOnComplete" style="display: none"><div class="panel-heading"><h2><i class="fa '
			+ options.icon + '"></i><span class="break">' 
			+ options.title + '</span></h2></div>';
	}

	html += '<table id="' + divName + 'Placeholder"></table>';
	
	html += '<div id="' + divName + 'Actions" class="tabActions panel-footer"></div>';
	
	if(!options.disableDecoration) {
		html += '</div>';
	}
	
	$(this).append(html);
	
	if(options.infoHtml) {
		var theDiv = $(this).find('.panel-heading');
		if(!theDiv.length) {
			theDiv = $(this).find('.modal');
		}
		getState(divName+'-infoPanel', true, function(data) {
			if(data.resources.length == 0 || data.resources[0].show) {
				theDiv.after('<div id="infoPanel" class="col-xs-12"><div class="alert alert-info"><i class="fa fa-info"></i><i id="messageDismiss" '
						+ 'class="fa fa-times dismiss-icon"></i>&nbsp;&nbsp;<span>' + options.infoHtml + '</span></div></div>');
			
				$('.dismiss-icon').click(function(e) {
					var prefs = new Object();
					prefs.show = false;
					saveState(divName+'-infoPanel', prefs, true, function() {
						$('#infoPanel').fadeOut(1000);
					});
				});
			}
			
		});
	}


	var psl;
	options = $.extend({
		onDialogClose: function() {
			if(psl) {
		        removeEventListener('popstate', psl, false);
			}
			history.pushState(null, "", "#menu=" + getAnchorByName('menu'));
		}
	}, options);
	if(options.resourceView === 'samePage') {
		options.view = $('div[dialog-for="' + divName + '"]').samePageResourceView(options);
	} else {
		options.view = $('div[dialog-for="' + divName + '"]').bootstrapResourceDialog(options);
	}

	var columns = new Array();
	var columnsDefs = new Array();
	var searchColumns = new Array();
	
	if(options.checkbox) {
	    columns.push({
	        checkbox : true
	    });
	}

	if(options.radio) {
        columns.push({
            radio : true
        });
    }

	if(options.logo) {
		var c = { field : 'logo',
				title: getResource(options.resourceKey + '.logo.label'),
				align:'left',
				sortable: false,
				width: 40,
				formatter: function(value, row, index) {
					var prefix = "logo://";
					var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[index];
					if(!resource) {
						return '';
					}
					return '<img class="resource-logo" src="' + ( getLogoPath(options.logoResourceTypeCallback ? options.logoResourceTypeCallback(resource) : 'default', value, resource.name) ) + '"/>';
				}
		};
		columns.push(c);	
	}

	$.each(options.fields,function(idx, obj) {
		var c= $.extend({
			field : obj.name,
			title: getResource(options.resourceKey + "." + obj.name + '.label'),
			align: obj.align ? obj.align : 'left',
			sortable: obj.sortable || obj.name === options.sortName,
			formatter: obj.formatter
		}, obj);
		if(obj.width) {
			c.width = obj.width;
		}
		columns.push(c);	
	});
	
	searchColumns.push({ value: '',  name: '---', disableOptions: true });
	
	if(options.searchFields) {
		$.each(options.searchFields,function(idx, obj) {
			var c = { value : obj.name,
					name: getResource(options.resourceKey + "." + obj.name + '.label'),
					renderOptions: obj.renderOptions
			};
			searchColumns.push(c);	
		});
	}
	
	
	if(!$('#' + options.additionalActionsId).length) {
		$('body').append('<div id="' + options.additionalActionsId + '"></div>');
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
				window.location = basePath + '/api/' + options.exportUrl + '/' + resource.id + '?token=' + getCsrfToken();
				callback();
			},
			enabled : true
		});
		
		options.toolbarButtons.push({ 
			resourceKey: 'exportResources',
			icon: 'fa-download',
			action: function(selections, callback) {
				window.location = basePath + '/api/' + options.exportUrl + '?token=' + getCsrfToken();
				callback();
			}
		});
	}
	
	if(options.importUrl) {

		if(!options.toolbarButtons) {
			options.toolbarButtons = new Array();
		}
		
		if(!$('#importResources').length) {
            if(!$('#importResourcesPlaceholder').length) {
                $('body').append('<div id="importResourcesPlaceholder"></div>');
            }
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

			if(options.forceActionsDropdown || (!options.disableActionsDropdown && options.additionalActions.length > 1)) {
				renderedActions += '<div id="dropdown_' + id + '" class="btn-group"><a class="btn btn-success row-additional dropdown-toggle btn-action" data-toggle="dropdown" href="#"><i class="fa fa-gears"></i></a>';
				renderedActions += '<ul id="' + id + 'ActionDropdown" class="dropdown-menu dropdown-menu-right" role="menu">';
				$.each(
						options.additionalActions,
						function(x, act) {
							if (act.enabled) {
								renderedActions += '<li data-idx="' + index + '"><a class="row-' + act.resourceKey + '" href="#"><i class="fa ' + act.iconClass + '"></i>&nbsp;&nbsp;<span>' + getResource(act.resourceKey + ".label") + '</span></a></li>';
								$(document).off('click',
								                '#' + id + 'ActionDropdown .row-' + act.resourceKey);
								$(document).on(
									'click',
									'#' + id + 'ActionDropdown .row-' + act.resourceKey,
									function(e) {
										e.preventDefault();
										var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[parseInt($(this).parent().data('idx'))];
										act.action(resource, function(resource) {
											$('#' + divName + 'Placeholder').bootstrapTable('refresh');
											checkBadges(false);
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
							if(act.isDisplayable) {
								var el = $('.row-' + act.resourceKey, dropdown);   
								if(act.isDisplayable(resource)) {
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
							if(act.isEnabled && !act.isEnabled(resource)) {
								var el = $('.row-' + act.resourceKey, dropdown);    
								el.parent().addClass('disabled');
								el.attr('disabled', true);
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
											checkBadges(false);
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
			renderedActions += '<a class="btn btn-info row-edit btn-action" href="#"><i class="fa ' + (canUpdate && (options.checkReadOnly ? !row.readOnly : true) ? 'fa-edit' : 'fa-search') + '"></i></a>';
			$(document).off('click', '#' + divName + 'Actions' + id + ' .row-edit');
			$(document).on(
				'click',
				'#' + divName + 'Actions' + id + ' .row-edit',
				function(e) {
					e.preventDefault();
					history.pushState(null, "", "#menu=" + getAnchorByName('menu') + '&resource=' + row.id);
					var tr = $(this).closest("tr").get(0);
					var curRow = $(tr).data('index'); 
					var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[curRow];
					if(canUpdate && (options.checkReadOnly ? !resource.readOnly : true)) {
						psl = function() {
							options.view.closeResource();
					        removeEventListener('popstate', psl, false);
				        };
				        addEventListener('popstate', psl, false);
						options.view.editResource(resource);
					} else {
						options.view.viewResource(resource);
					}
			});
			if(options.canCopy) {
				renderedActions += '<a class="btn btn-primary row-copy btn-action" href="#"><i class="fa fa-copy"></i></a>';
				$(document).off('click', '#' + divName + 'Actions' + id + ' .row-copy');
				$(document).on(
					'click',
					'#' + divName + 'Actions' + id + ' .row-copy',
					function() {
						var row = parseInt($('#' + divName + ' [data-uniqueid="' + id + '"]').data('index'));
						var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[row];
						options.view.copyResource(resource);
				});
			}
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
	
						var row = parseInt($('#' + divName + ' [data-uniqueid="' + id + '"]').data('index'));
						var resource = $('#' + divName + 'Placeholder').bootstrapTable('getData')[row];
	
						bootbox.confirm(getResource(options.resourceKey + ".delete.desc")
								.format(resource.name), function(confirmed) {
							if (confirmed) {
								$('#mainContainer').startSpin(getResource("text.deleting").format(resource.name));
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
										checkBadges(false);
										showSuccess(data.message);
									} else {
										showError(data.message);
									}
									$('#mainContainer').stopSpin();
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
		width: 175,
		class: 'actionsColumn'
	});

	if (options.canCreate) {

		$('#' + divName + 'Actions').append('<button id="' + divName + 'Add" class="btn btn-primary"><i class="fa ' + options.createButtonIcon + '"></i>' + getResource(options.createButtonText) + '</button>');
		$('#' + divName + 'Add').click(function() {
			if (options.showCreate) {
				options.showCreate();
			}
			options.view.createResource($('#'+divName).data('createCallback'));
		});
	}

	$('#' + divName + 'Placeholder').on('post-body.bs.table', function() {
		$('[data-toggle="tooltip"]').tooltip();
	});
	
	var callback = {
			refresh: function() {
				$('#' + divName + 'Placeholder').bootstrapTable('refresh');
				checkBadges(false);
			},
			refreshView: function(resource) {
				options.view.refreshView(resource);
			},
			close: function() {
				options.view.closeResource();
			},
			openPage: function(page) {
				options.view.openPage(page);
			},
			options: function() {
				return options;
			},
			showCreate: function(callback) {
				options.currentView = 'create';
				if(options.showCreate) {
					options.showCreate();
				}
				options.view.createResource(callback);
			},
			showEdit: function(resource, callback) {
				options.currentView = 'edit';
				if(options.showEdit) {
					options.showEdit(resource);
				}
				options.view.editResource(resource);
			},
			showRead: function(resource, callback) {
				options.currentView = 'read';
				if(options.showView) {
					options.showView(resource);
				}
				options.view.viewResource(resource);
			},
			showCopy: function(resource, callback) {
				options.currentView = 'copy';
				if(options.showCopy) {
					options.showCopy(resource);
				}
				options.view.copyResource(resource);
			},
			saveResource: function(buttonElement, closeCallback) {
				saveResource(options.createResource(), buttonElement, options, options.currentView, closeCallback);
			},
			deleteResource: function(resource, callback) {
				if (options.canDelete) {
					var canDelete = !resource.system;
					if(options.checkDelete) {
						canDelete = !resource.system && options.checkDelete(resource);
					}
					
					if(canDelete) {
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
										checkBadges(false);
									} else {
										showError(data.message);
									}
								});
							}
						});
					}
				}
			},
			setFields: function(fields) {

				var columns = [];
				if(options.checkbox) {
				    columns.push({
				        checkbox : true
				    });
				}

				if(options.radio) {
			        columns.push({
			            radio : true
			        });
			    }
				$.each(fields,function(idx, obj) {
					var c= $.extend({
						field : obj.name,
						title: getResource(options.resourceKey + "." + obj.name + '.label'),
						align: obj.align ? obj.align : 'left',
						sortable: obj.sortable || obj.name === options.sortName,
						formatter: obj.formatter
					}, obj);
					if(obj.width) {
						c.width = obj.width;
					}
					columns.push(c);	
				});
				columns.push({ field : "actions",
					align:'right',
					formatter: renderActions,
					width: 175,
					minWidth: 175
				});
				$('#' + divName + 'Placeholder').bootstrapTable('refreshOptions', {
					columns: columns
				});
			},
			getSearch: function() {
				var params = {};
            	$('#' + divName + 'Placeholder').bootstrapTable('getOptions').queryParams(params);
				return params.search;
			},
			getSearchColumn: function() {
				var params = {};
            	$('#' + divName + 'Placeholder').bootstrapTable('getOptions').queryParams(params);
				return params.searchColumn;
			},
			getFilter: function() {
				var params = {};
            	$('#' + divName + 'Placeholder').bootstrapTable('getOptions').queryParams(params);
				return params.filter;
			}
		};
	
	getState(divName + 'Placeholder', true, function(data) {
		if(data.success && data.resources.length && data.resources[0].preferences){
			var preferences = JSON.parse(data.resources[0].preferences);
			if(preferences && preferences.sortName){
				options.sortName = preferences.sortName;				
			}
			if(preferences && preferences.sortOrder){
				options.sortOrder = preferences.sortOrder;
			}
			if(preferences && preferences.pageSize){
				options.pageSize = preferences.pageSize;
			}
		}
		
		$('#' + divName + 'Placeholder').bootstrapTable({
		    pagination: options.pagination,
		    paginationVAlign: options.paginationVAlign,
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
		    rowStyle: options.rowStyle,
		    sortable: true,
		    cache: false,
		    uniqueId: 'id',
		    ajaxOptions: {
		    	beforeSend: function(request) {
		    		request.setRequestHeader("X-Csrf-Token", getCsrfToken());
				}
		    },
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

	    		delete params.searchColumn;
	    		delete params.search;
	    		delete params.filter;
		    	
		    	if($('#' + divName + 'filterColumn').length > 0) {
		    		var val = $('#' + divName + 'filterColumn').widget().getValue();
		    		if(val && val.length >0)
		    			params.filter = val;
				}
		    	
		    	if($('#' + divName + 'searchColumn').widget()) {
		    		var val = $('#' + divName + 'searchColumn').widget().getValue();
		    		if(val && val.length > 0) {
    		    		params.searchColumn = val;
    		    		var selected = $('#' + divName + 'searchColumn').widget().getObject();
    		    		if(selected) {
    		    			if(selected.renderOptions)
    		    				params.search = $('#' + divName + 'searchValue').widget().getValue();
    		    			else
    		    				params.search = $('#' + divName + ' .search input[placeholder="Search"]').val();
    		    		}
		    		}
		    	}
	    		else {
	    			if(options.search)
	    				params.search = $('#' + divName + ' .search input[placeholder="Search"]').val();
	    		}
		    	if(options.queryParams) {
		    		options.queryParams(params);
		    	}
		    	return params;
		    },
		    onPageChange: function(number, size){
	    		var sortName = $('#' + divName + 'Placeholder').bootstrapTable('getOptions').sortName;
	    		var sortOrder = $('#' + divName + 'Placeholder').bootstrapTable('getOptions').sortOrder;
	    		saveState(divName + 'Placeholder', {'pageSize': size, 'sortOrder': sortOrder, 'sortName': sortName}, true);
		    },
		    onSort: function(name, order){
		    	var size = $('#' + divName + 'Placeholder').bootstrapTable('getOptions').pageSize;
		    	saveState(divName + 'Placeholder', {'pageSize': size, 'sortOrder': order, 'sortName': name}, true);
		    },
		    classes: 'table table-hover ' + divName,
		    onPostBody: function() {
		    	checkReady.tableReady = true;
		    	checkReady.check();
		    },
		    onPostHeader: function() {
		    	
		    	if($('#searchRendered' + divName).length == 0) {
		    		
		    		log("Rendering search");
		    		
		    		var loadSearchColumns = function(columns) {
		    			if(!$('#' + divName + 'searchHolder').length) {
		    				$('.' + divName).closest('.bootstrap-table').find('.fixed-table-toolbar').append('<div id="' + divName + 'searchHolder" class="tableToolbar pull-right search"><label>Search:</label><div class="toolbarWidget" id="' + divName + 'searchColumn"></div></div>');
		    			}
		    			$('#' + divName + 'searchColumn').empty();
		    			$('#' + divName + 'searchColumn').textDropdown({
							values: columns,
							changed: function(widget) {
								var selected = widget.getObject();
								$('#' + divName + 'searchValue').remove();
								$('#' + divName + ' .search input[placeholder="Search"]').hide();
								if(selected && !selected.disableOptions) {
									if(selected.renderOptions) {
										$('#' + divName + 'searchColumn').parent().append('<div id="' + divName + 'searchValue" class="searchValue toolbarWidget"></div>');
										selected.renderOptions($('#' + divName + 'searchValue'), function() {
											$('#' + divName + 'Placeholder').bootstrapTable('refresh');
										}, options.searchValue);
									} else {
										$('#' + divName + ' .search input[placeholder="Search"]').show();
									}
								}
								else
									$('#' + divName + 'Placeholder').bootstrapTable('refresh');
							}
						});
						if(options.searchColumn) {
							$('#' + divName + 'searchColumn').widget().setValue(options.searchColumn);
						}
		    		}
		    		
		    		if(options.searchColumnsUrl) {
		    			getJSON(options.searchColumnUrl, null, function(data) {
		    				$.each(data.resources, function(idx, obj) {
								var div = obj.resourceKey + 'Div';
								$('#' + options.additionalActionsId).append('<div id="' + div + '"></div>');
								$('#' + div).load(uiPath + '/content/' + obj.url + '.html');

								searchColumns.push({ value : obj.column,
										name: getResource(options.resourceKey + '.label'),
										renderOptions: function(element, refresh) {
											$('#' + obj.resourceKey).data('action')(element, refresh);
										}
								});
		    				});
		    				loadSearchColumns(searchColumns);
		    			});
		    		} else if(searchColumns.length > 1) {
		    			loadSearchColumns(searchColumns);
					}
		    		
		    		if(options.searchFiltersUrl) {
		    			getJSON(options.searchFiltersUrl, null, function(data) {
		    				$('.' + divName).closest('.bootstrap-table').find('.fixed-table-toolbar').append('<div class="tableToolbar pull-right search"><label>Filter:</label><div class="toolbarWidget" id="' + divName + 'filterColumn"></div></div>');
		    				var filters = [];
		    				if(options.searchFilters) {
		    					filters = options.searchFilters;
		    				}
		    				$.each(data.resources, function(idx, obj) {
		    					filters.push({ value: obj.resourceKey, 
		    						name: getResource(obj.resourceKey),
		    						searchColumns: obj.searchColumns,
		    						useDefaultColumns: obj.useDefaultColumns});
		    					if(obj.searchColumns) {
		    						$.each(obj.searchColumns, function(idx, obj) {
										var div = obj.resourceKey + 'Div';
										if(!$('#' + options.additionalActionsId).length) {
											$(body).append('<div id="' + options.additionalActionsId + '"></div>')
										}
										if(!$('#' + div).length) {
											$('#' + options.additionalActionsId).append('<div id="' + div + '"></div>');
											$('#' + div).load(uiPath + '/content/' + obj.url + '.html');
		    							}
										searchColumns.push({ value : obj.column,
												name: getResource(options.resourceKey + '.label'),
												renderOptions: function(element, refresh) {
													$('#' + obj.resourceKey).data('action')(element, refresh);
												}
										});
				    				});
		    					}
		    				});
		    				$('#' + divName + 'filterColumn').textDropdown({
								values: filters,
								value: '',
								changed: function(widget) {
									$('#' + divName + 'searchValue').remove();
									$('#' + divName + ' .search input[placeholder="Search"]').hide();
									$('#' + divName + ' .search input[placeholder="Search"]').val('');
									$('#' + divName + 'Placeholder').bootstrapTable('refresh');
									var arr = [];
									if(widget.getSelectedObject().useDefaultColumns) {
										arr = searchColumns.slice();
									}
									loadSearchColumns(arr.concat(widget.getSelectedObject().searchColumns));
								},
								sortOptions: false
							});
			    			if(options.defaultFilter) {
			    				$('#' + divName + 'filterColumn').widget().setValue(options.defaultFilter);
			    			}
		    			});
		    		} else if(options.searchFilters) {
		    			$('.' + divName).closest('.bootstrap-table').find('.fixed-table-toolbar').append('<div class="tableToolbar pull-right search"><label>Filter By:</label><div class="toolbarWidget" id="' + divName + 'filterColumn"></div></div>');
		    			$('#' + divName + 'filterColumn').textDropdown({
							values: options.searchFilters,
							changed: function(widget) {
								$('#' + divName + 'searchValue').remove();
								$('#' + divName + ' .search input[placeholder="Search"]').hide();
								$('#' + divName + ' .search input[placeholder="Search"]').val('');
								$('#' + divName + 'Placeholder').bootstrapTable('refresh');
								var arr = [];
								if(widget.getSelectedObject().useDefaultColumns) {
									arr = searchColumns.slice();
								}
								loadSearchColumns(arr.concat(widget.getSelectedObject().searchColumns));
							}
						});
		    			if(options.defaultFilter) {
		    				$('#' + divName + 'filterColumn').widget().setValue(options.defaultFilter);
		    			}
		    		}

                    if(options.bulkAssignment) {
                        var bulkAssignableTarget = resourceType + 'BulkAssignable';
                        if($('#' + bulkAssignableTarget).length == 0) {
                            $('#' + divName).append('<div id="' + bulkAssignableTarget + '"></div>');
                        }

                        $('.' + divName).closest('.bootstrap-table').find('.fixed-table-toolbar').find('.btn-group').first().prepend('<button id="'
                                + divName + 'BulkTableAction" class="btn btn-default" title="'
                                + getResource('bulk.assignment.tab.title') + '"><i class="fa fa-exchange"></i></button>');

                        $('#' + divName + 'BulkTableAction').click(function(){
                            var bulkAction = $('#' + bulkAssignableTarget).bulkAssignmentDialog({
                                resource : resourceType,
                                modalCallback : function(data) {$('#' + divName + 'Placeholder').bootstrapTable('refresh');}
                            });
                            bulkAction.show();
                        });
                    }

					if(options.toolbarButtons) {
						$.each(options.toolbarButtons, function(idx, action) {
							$('.' + divName).closest('.bootstrap-table').find('.fixed-table-toolbar').find('.btn-group').first().prepend('<button id="' 
									+ divName + action.resourceKey + 'TableAction" class="btn btn-default" data-toggle="tooltip" title="' 
									+ getResource(action.resourceKey + '.label') + '"><i class="fa ' 
									+ action.icon + '"></i></button>');
							
							$('#' + divName + action.resourceKey + 'TableAction').on('click', function(e) {
								if(action.action) {
									action.action($('#' + divName + 'Placeholder').bootstrapTable('getAllSelections'), function() {
										$('#' + divName + 'Placeholder').bootstrapTable('refresh');
										checkBadges(false);
									});
								}
							});
						});
					}
					
					if(options.toolbarButtonsUrl) {
						getJSON(options.toolbarButtonsUrl, null, function(data) {
							$.each(data.resources, function(idx, action) {
								$('.' + divName).closest('.bootstrap-table').find('.fixed-table-toolbar').find('.btn-group').first().prepend('<button id="' 
										+ divName + action.resourceKey + 'TableAction" class="btn btn-default" data-toggle="tooltip" title="' 
										+ getResource(action.resourceKey + '.label') + '"><i class="fa ' 
										+ action.icon + '"></i></button>');
								
								var div = action.resourceKey + 'Div';
								$('#' + options.additionalActionsId).append('<div id="' + div + '"></div>');
								$('#' + div).load(uiPath + '/content/' + action.url + '.html');

								$('#' + divName + action.resourceKey + 'TableAction').on('click', function(e) {
									if($('#' + action.resourceKey).data('action')) {
										var arr = $('#' + divName + 'Placeholder').bootstrapTable('getSelections');
										$('#' + action.resourceKey).data('action')(arr, function() {
											$('#' + divName + 'Placeholder').bootstrapTable('refresh');
											checkBadges(false);
										});
									}
								});
							});
						});
						
					}

					if (options.checkbox && options.canDelete) {
                        if($('#multipleDelete' + divName).length == 0) {
                            $('#' + divName +  ' .fixed-table-toolbar').find('.btn-group').first().prepend('<button id="multipleDelete' + divName +'" class="btn btn-default" type="button" name="multipleDelete' + divName +'" title="Delete"><i class="fa fa-trash"></i></button>');
                            $('#multipleDelete' + divName).click(function(e) {
                                var arr = $('#' + divName + 'Placeholder').bootstrapTable('getSelections');
                                if(arr.length > 0) {
                                    var ids = [];
                                    var names = [];
                                    $.each(arr, function(idx, val) {
                                    	ids.push(val.id);
                                    	names.push(val.name);
                                    });
                                    bootbox.confirm(getResource("bulk.delete.confirm").format(names.join(", ")), function(confirmed) {
                                        if (confirmed && options.deleteResourcesUrl) {
                                            deleteJSON(options.deleteResourcesUrl, ids, function(data) {
                                            	if(data.success) {
                                        			 $('#' + divName + 'Placeholder').bootstrapTable('remove', {
                                                         field: 'id',
                                                         values: ids
                                                     });
                                            		
                                                    $('#' + divName + 'Placeholder').bootstrapTable('refresh');
                                            		checkBadges(false);
                                                    showSuccess(data.message);
                                            	} else {
                                            		showError(data.message);
                                            	}
                                            }, function(xmlRequest) {
                                            	if (xmlRequest.status == 404) {
                                            		$.each(ids, function(idx, id) {
                                            			deleteJSON(options.resourceUrl + "/" + id, null, function(data) {
                                                            if (data.success) {
                                                                $('#' + divName + 'Placeholder').bootstrapTable('remove', {
                                                                    field: 'id',
                                                                    values: [id]
                                                                });
                                                                $('#' + divName + 'Placeholder').bootstrapTable('refresh');
                                                                checkBadges(false);
                                                                showSuccess(data.message);
                                                            } else {
                                                                showError(data.message);
                                                            }
                                                        });
                                            		});
                                            	}
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    }

					$('.' + divName).closest('.bootstrap-table').find('.fixed-table-toolbar').last().append('<div id="searchRendered' + divName + '"></div>');
		    	}
		    	
		    	checkReady.headerReady = true;
		    	checkReady.check();
		    },
		    onLoadSuccess: function() {
		    	
		    	if(options.expandFirst) {
		    		$('#' + divName + 'Placeholder').bootstrapTable('expandRow', 0);
		    	}
		    	
		    	if (options.logo) {
		    		
		    		log("Rendering logo");
		    		$('#' + divName + 'Grid').empty();
		    		$('#' + divName + 'Placeholder').parent().append('<div id="' + divName + 'Grid" class="fixed-table-container" style="padding-bottom: 0px; display: none;"></div>');
		    		
		    		var gridResourceList = $('#' + divName + 'Placeholder').bootstrapTable('getData');
		    		if(!gridResourceList.length){
		    			$('#' + divName + 'Grid').append('<div class="no-records-found">' + getResource('text.noMatchingRecords') + '</div>');
		    		}else{
		    		    var roleTestResource = gridResourceList[0];
		    		    if(options.bulkAssignment && typeof roleTestResource.roles != 'undefined') {
		    		        $('#' + divName + 'BulkTableAction').show();
		    		    }

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
									renderedActions += '<ul id="' + resource.id + 'ActionDropdown" class="dropdown-menu dropdown-menu-right" role="menu">';
									$.each(options.additionalActions, function(x, act) {
										if (act.enabled) {
											renderedActions += '<li><a class="row-' + act.resourceKey + '" href="#"><span>' + getResource(act.resourceKey + ".label") + '</span>&nbsp;&nbsp;<i class="fa ' + act.iconClass + '"></i></a></li>';
						
											$(document).off('click', '#' + resource.id + 'ActionDropdown .row-' + act.resourceKey);
											$(document).on('click', '#' + resource.id + 'ActionDropdown .row-' + act.resourceKey, function(e) {
												e.preventDefault();
												act.action(resource, function(resource) {
													$('#' + divName + 'Placeholder').bootstrapTable('refresh');
													checkBadges(false);
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
													checkBadges(false);
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
								renderedActions += '<a class="btn btn-info row-edit btn-action" href="#"><i class="fa ' + (options.canUpdate && canUpdate && !resource.readOnly ? 'fa-edit' : 'fa-search') + '"></i></a>';
								$(document).off('click', '#' + resource.id + 'GridOptions .row-edit');
								$(document).on('click', '#' + resource.id + 'GridOptions .row-edit', function() {
									if(options.showEdit) {
										options.showEdit(resource);
									}
									if(options.canUpdate && canUpdate && !resource.readOnly) {
										options.view.editResource(resource);
									} else {
										options.view.viewResource(resource);
									}
								});
								$(document).off('click', '#' + resource.id + 'GridDiv img');
								$(document).on('click', '#' + resource.id + 'GridDiv img', function() {
									if(options.showEdit) {
										options.showEdit(resource);
									}
									if(options.canUpdate && canUpdate && !resource.readOnly) {
										options.view.editResource(resource);
									} else {
										options.view.viewResource(resource);
									}
								});
								
								if(options.canCopy) {
									renderedActions += '<a class="btn btn-info row-copy btn-action" href="#"><i class="fa fa-copy"></i></a>';
									$(document).off('click', '#' + resource.id + 'GridOptions .row-copy');
									$(document).on('click', '#' + resource.id + 'GridOptions .row-copy', function() {
										if(options.showCopy) {
											options.showCopy(resource);
										}
										options.view.copyResource(resource);
									});
								}
								
								$(document).off('click', '#' + resource.id + 'GridDiv img');
								$(document).on('click', '#' + resource.id + 'GridDiv img', function() {
									if(options.showEdit) {
										options.showEdit(resource);
									}
									if(options.canUpdate && canUpdate) {
										options.view.editResource(resource);
									} else {
										options.view.viewResource(resource);
									}
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
														checkBadges(false);
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
		    	

				
				/* Now in DOM can add hack to remove dropdown menu from the parent when it is opened to avoid scroll bounds problems */
				
				$(document).on('click', '#' + divName + 'Placeholder [data-toggle="dropdown"]', function () {
				    // if the button is inside a modal

				    if ($('body').hasClass('modal-open')) {
				        throw new Error("This solution is not working inside a responsive table inside a modal, you need to find out a way to calculate the modal Z-index and add it to the element")
				        return true;
				    }
				    $('.dropdown-menu[data-parent]').hide();

				    $buttonGroup = $(this).parent();
				    if (!$buttonGroup.attr('data-attachedUl')) {
				        var ts = +new Date;
				        $ul = $(this).siblings('ul');
				        $ul.attr('data-parent', ts);
				        $buttonGroup.attr('data-attachedUl', ts);
				        $(window).resize(function () {
				            $ul.css('display', 'none').data('top');
				        });
				    } else {
				        $ul = $('[data-parent=' + $buttonGroup.attr('data-attachedUl') + ']');
				    }
				    if (!$buttonGroup.hasClass('open')) {
				        $ul.css('display', 'none');
				        return;
				    }
				    dropDownFixPosition($(this).parent(), $ul);
				    function dropDownFixPosition(button, dropdown) {
				        var dropDownTop = button.offset().top + button.outerHeight();
				        dropdown.attr('id', $ul.attr('id'));
				        dropdown.css('top', dropDownTop + "px");
				        dropdown.css('left', button.offset().left - ( dropdown.width() / 2 ) + "px");
				        dropdown.css('position', "absolute");
				        dropdown.css('display', 'block');
				        if($('#content').length)
				        	dropdown.appendTo($('#content'));
				        else
				        	dropdown.appendTo('body');
				    }
				});
		    	if(options.loaded)
		    		options.loaded($('#' + divName + 'Placeholder').bootstrapTable('getData'));

		    	checkReady.dataReady = true;
		    	checkReady.check();
		    }
		});

		
		if(options.additionalButtons) {
			
			$.each(options.additionalButtons, function() {
				if(this.showButton && !this.showButton()) {
					return;
				}
				$('#' + divName + 'Actions').append(
					'<button id="' + this.resourceKey + '" class="btn ' + this.buttonClass + '"><i class="fa ' + this.icon + '"></i>&nbsp;' + getResource(this.resourceKey + '.label') + '</button>');
				var button = this;
				$('#' + this.resourceKey).click(function() {
					if(button.action) {
						button.action(function() {
							$('#' + divName + 'Placeholder').bootstrapTable('refresh');
							checkBadges(false);
						});
					}
				});
			});
		}
		
		var views = [];
		views.push({ id: 'table', div: '#' + divName + 'Placeholder', icon: 'fa-list'});
		if(options.logo) {
			views.push({ id: 'icon', div: '#' + divName + 'Grid', icon: 'fa-picture-o'});
		}

		if(options.additionalViews) {
			
			$.each(options.additionalViews, function(idx, view) {
				
				var viewDiv = divName + view.name;
				$('#' + divName + 'Placeholder').parent().append('<div id="' + viewDiv + '" class="fixed-table-container" style="padding-bottom: 0px;"></div>');
				$(view.div).detach().appendTo('#' + viewDiv);
				
				views.push({ id: view.id, div: '#' + viewDiv, icon: view.icon, onShow: view.onShow, onHide: view.onHide});
	
			});
		}
		
		var currentView;
		$.each(views, function(idx, obj) {
			if(obj.id === options.defaultView) {
				currentView = obj;
			}
			$(obj.div).hide();
			if(obj.onHide) {
				obj.onHide();
			}
		});
		
		if(!currentView) {
			currentView = views[0];
		}
	
		var i = 0;
		while(currentView.id !== views[0].id && i < views.length) {
			var v = views.pop();
			views.unshift(v);
			i++
		}

		$(views[0].div).show();
		if(views[0].onShow) {
			views[0].onShow();
		}
		
		
		$('#' + divName).find('.fixed-table-toolbar').find('.columns.columns-right.btn-group.pull-right').append('<button id="' 
				+ divName + 'ToggleGrid" class="btn btn-default" type="button" name="grid" title="' 
				+ getResource('text.toggleViewMode') + '"><i class="glyphicon fa ' + currentView.icon + '"></button>');
		
		
    	$('#' + divName + 'ToggleGrid').click(function(){
    		var prev = views[0];
    		var v = views.pop();
    		views.unshift(v);
    		$(this).find('i').removeClass(prev.icon);
    		$(this).find('i').addClass(views[0].icon);
    		$(prev.div).hide();
    		$(views[0].div).show();
    		if(views[0].onShow) {
    			views[0].onShow();
    		}
    	});

		if (options.complete) {
			options.complete();
		}
		
    	var resourceId = getAnchorByName('resource');
		if(resourceId) {
			getJSON(options.resourceUrl + '/' + resourceId, null, function(data) {
				callback.showEdit(data);
			});
		} 

	});
		
	$(this).data('callback', callback);
	return callback;
};

$.fn.resourcePage = function() {
	return $(this).data('callback');
}

$.fn.samePageResourceView = function(params, params2) {
	var dialog = $(this);
	var dialogOptions = $(this).data('options');
	
	var addActions = function(save, copy) {
	
		if(dialog.find('.panel-footer').length > 0) {
			dialog.find('.panel-footer').remove();
		}
		var html = '<div class="panel-footer">';
		html+= '<button id="' + dialog.attr('id') + 'Cancel" + class="btn btn-danger"><i class="fa fa-ban"></i>' + getResource('text.cancel') + '</button>';
		if(save) {
			html += '<button id="' + dialog.attr('id') + 'Save" + class="btn btn-primary"><i class="fa fa-save"></i>' + getResource('text.save') + '</button>';
		}
		html += '</div>';
		if(dialog.find('.property-body').length > 0) {
			dialog.find('.property-body').first().after(html);
		} else {
			dialog.find('.panel-body').first().after(html);
		}
		
		if(save) {
			$('#' + dialog.attr('id') + 'Save').click(function() {
				var resource = dialogOptions.createResource();
				if(copy) {
					resource.id = null;
				}
				saveResource(resource, $('#' + dialog.attr('id') + 'Save'), dialogOptions, params, function(resource) {
					
					var func = function() {
						if(dialogOptions.stayOnPageAfterSave) {
							if(dialogOptions.onSave)
								dialogOptions.onSave(resource);
						}
						else {
							dialog.samePageResourceView('close');
							if (dialogOptions.hasResourceTable) {
								$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('refresh');
							}
						}
						if(dialogOptions.resourceSaved) {
							dialogOptions.resourceSaved(resource);
						}
					};
					if(dialogOptions.refreshI18nResources) {
						loadResources(func);
					} else {
						func();
					}
					 
				});
			});
		}
		$('#' + dialog.attr('id') + 'Cancel').click(function() {
			dialog.samePageResourceView('close');
		});
	
	}
	
	var showView = function(view) {

		$('#mainContent').hide();
		view.show();
	}
	
	if(params === 'open') {
		
		$('#mainContainer').append('<div id="pageContent"></div>');
		$('#pageContent').load(params2);
		showView($('#pageContent'));
		
	} else if (params === 'create') {
		dialogOptions.clearDialog(true);
		
		if(dialogOptions.propertyOptions) {
			 var propertyOptions = $.extend({},
					dialogOptions.propertyOptions,
					{ url: dialogOptions.propertyOptions.templateUrl,
				      title: getResource(dialogOptions.resourceKey + '.create.title').formatAll(dialogOptions.propertyOptions.resourceArgsCallback ? dialogOptions.propertyOptions.resourceArgsCallback(params2) : dialogOptions.propertyOptions.resourceArgs),
				      icon: dialogOptions.icon,
				      parameters: dialogOptions.propertyOptions.parameters,
				      displayMode: 'create',
					  complete: function() {
						  showView(dialog);
						  if(dialogOptions.showViewButtons)
							  addActions(true);
						  if(dialogOptions.propertyOptions.complete) {
							  dialogOptions.propertyOptions.complete();
						  }
						  
					  },
					  onPropertyChange: function(resourceKey, widget) {
						  if(dialogOptions.propertyOptions.onPropertyChange) {
							  dialogOptions.propertyOptions.onPropertyChange(resourceKey, widget, 
									  $(propertyOptions.propertySelector).propertyOptions());
						  }
					  }
			});
			if(propertyOptions.additionalTabs) {
				$.each(propertyOptions.additionalTabs, function(idx, obj) {
					$('body').append($('#' + obj.id).detach());
				});
			}
			$(propertyOptions.propertySelector).empty();
			$(propertyOptions.propertySelector).propertyPage(propertyOptions);
		} else {
			showView(dialog);
			if(dialogOptions.showViewButtons)
				addActions(true);
		}
		
		return;
		
	} else if(params === 'edit') {
		
		dialogOptions.clearDialog(false);
		var selfShow = dialogOptions.displayResource(params2, false, function() {
			if(dialogOptions.showViewButtons)
				addActions(true);
			showView(dialog);
		});
		
		if(dialogOptions.propertyOptions) {
			var propertyOptions = $.extend({},
					dialogOptions.propertyOptions,
					{ url: dialogOptions.propertyOptions.propertiesUrl + params2.id,
					  title: getResource(dialogOptions.resourceKey + '.update.title').formatAll(dialogOptions.propertyOptions.resourceArgsCallback ? dialogOptions.propertyOptions.resourceArgsCallback(params2) : dialogOptions.propertyOptions.resourceArgs),
					  icon: dialogOptions.icon,
					  displayMode: 'update',
					  resource: params2,
				  	  complete: function() {
						  showView(dialog);
						  if(dialogOptions.showViewButtons)
							  addActions(true);
						  $('#mainContainer').stopSpin();
						  if(dialogOptions.propertyOptions.complete) {
							  dialogOptions.propertyOptions.complete(params2);
						  }
					  },
					  onPropertyChange: function(resourceKey, widget) {
						  if(dialogOptions.propertyOptions.onPropertyChange) {
							  dialogOptions.propertyOptions.onPropertyChange(resourceKey, widget);
						  }
					  }
			});
			if(dialogOptions.propertyOptions.additionalTabs) {
				$.each(dialogOptions.propertyOptions.additionalTabs, function(idx, obj) {
					$('body').append($('#' + obj.id).detach());
				});
			}
			$(dialogOptions.propertyOptions.propertySelector).empty();
			$(dialogOptions.propertyOptions.propertySelector).propertyPage(propertyOptions);
		} else {
			showView(dialog);
			if(dialogOptions.showViewButtons)
				addActions(true);
			$('#mainContainer').stopSpin();
		}
		
		return;
		
	} else if(params === 'read') {
		
		dialogOptions.clearDialog(false);
		dialogOptions.displayResource(params2, true);
		if(dialogOptions.propertyOptions) {
			var propertyOptions = $.extend({},
					dialogOptions.propertyOptions,
					{ url: dialogOptions.propertyOptions.propertiesUrl + params2.id,
				      title: getResource(dialogOptions.resourceKey + '.view.title'),
				      icon: dialogOptions.icon,
				      canUpdate: false,
				      displayMode: 'view',
					  resource: params2,
					  complete: function() {
						  showView(dialog);
						  if(dialogOptions.propertyOptions.complete) {
							  dialogOptions.propertyOptions.complete(params2);
						  }
						  if(dialogOptions.showViewButtons)
							  addActions(false);
						  
					  }	
			});
			if(dialogOptions.propertyOptions.additionalTabs) {
				$.each(dialogOptions.propertyOptions.additionalTabs, function(idx, obj) {
					$('body').append($('#' + obj.id).detach());
				});
			}
			$(dialogOptions.propertyOptions.propertySelector).empty();
			$(dialogOptions.propertyOptions.propertySelector).propertyPage(propertyOptions);
		} else {
			showView(dialog);
			if(dialogOptions.showViewButtons)
				addActions(false);
		}
		
		return;
		
	} else if(params === 'copy') {
		
		if(dialogOptions.remoteCopy) {
			getJSON(dialogOptions.copyUrl + "/" + params2.id, null, function(data) {

				if (data.success) {
					log("Resource copied");
					$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('refresh');
					checkBadges(false);
					showSuccess(data.message);
				} else {
					log(data.message);
					showError(data.message);
				}
			});
		} else {
			dialogOptions.clearDialog(false);
			var copiedResource = $.extend(true, {}, params2);
			copiedResource.name = copiedResource.name + " (" + getResource('text.copy') + ")";
			dialogOptions.displayResource(copiedResource, false, true);
			if(dialogOptions.propertyOptions) {
				var propertyOptions = $.extend({},
						dialogOptions.propertyOptions,
						{ url: dialogOptions.propertyOptions.propertiesUrl + copiedResource.id,
					      title: getResource(dialogOptions.resourceKey + '.create.title'),
					      icon: dialogOptions.icon,
					      displayMode: 'copy',
						  resource: params2,
						  complete: function() {
							  showView(dialog)
							  if(dialogOptions.propertyOptions.complete) {
								  dialogOptions.propertyOptions.complete(copiedResource);
							  }
								if(dialogOptions.showViewButtons)
								  addActions(true, true);
						  }	
				});
				if(dialogOptions.propertyOptions.additionalTabs) {
					$.each(dialogOptions.propertyOptions.additionalTabs, function(idx, obj) {
						$('body').append($('#' + obj.id).detach());
					});
				}
				$(dialogOptions.propertyOptions.propertySelector).empty();
				$(dialogOptions.propertyOptions.propertySelector).propertyPage(propertyOptions);
			} else {
				showView(dialog);
				if(dialogOptions.showViewButtons)
					addActions(true, true);
			}
		}
		
		return;
	} else if(params === 'close') {
		if(dialogOptions) {
			dialog.hide();
			if(dialogOptions.onClose) {
				dialogOptions.onClose();
			}
			if(dialogOptions.onDialogClose) {
				dialogOptions.onDialogClose();
			}
			
			dialogOptions.parent.show();
		}
		
		$('.showOnComplete').show();
		$('#mainContent').show();
		window.scrollTo(0,0);
		return;
	} else if(params === 'refreshView') {
		var propertyOptions = $.extend({},
				dialogOptions.propertyOptions,{
		      		parameters: dialogOptions.propertyOptions.parameters,
				    icon: dialogOptions.icon, 
					complete: function() {
						showView(dialog);
						if(dialogOptions.showViewButtons)
							addActions(true);
						if(dialogOptions.propertyOptions.complete) {
							dialogOptions.propertyOptions.complete(params2);
						}
					}});
		
		
		if(params2 == null) {
			propertyOptions.url = dialogOptions.propertyOptions.templateUrl;
			propertyOptions.title = getResource(dialogOptions.resourceKey + '.create.title').formatAll(dialogOptions.propertyOptions.resourceArgsCallback ? dialogOptions.propertyOptions.resourceArgsCallback(params2) : dialogOptions.propertyOptions.resourceArgs);
			propertyOptions.displayMode = 'create';
			propertyOptions.onPropertyChange = function(resourceKey, widget) {
				  if(dialogOptions.propertyOptions.onPropertyChange) {
					  dialogOptions.propertyOptions.onPropertyChange(resourceKey, widget, 
							  $(propertyOptions.propertySelector).propertyOptions());
				  }
			  };
		}
		else {
			propertyOptions.resource = params2;
			propertyOptions.title = getResource(dialogOptions.resourceKey + '.view.title');
			propertyOptions.url = dialogOptions.propertyOptions.propertiesUrl + params2.id;
		}
		
		//$(dialogOptions.propertyOptions.propertySelector).empty();
		$(dialogOptions.propertyOptions.propertySelector).propertyPage(propertyOptions);
		return;
	}
	
	var parent = $(this).parent();
	dialog.hide();
	$('#mainContent').after(dialog.detach());
	
	var options = $.extend({
		hasResourceTable : true,
		parent: parent,
		onDialogClose: false,
	}, params);

	if(options.onDialogClose) {
		dialog.on('hidden.bs.modal', function () {
			options.onDialogClose();
		});
	}
	
	dialog.data('options', options);
	
	return {
		openPage: function(page) {
			dialog.samePageResourceView('open', page);
		},
		createResource: function(callback) {
			dialog.samePageResourceView('create', callback);
		},
		editResource: function(resource, options) {
			if(dialog.data('options')) {
    			$('#mainContainer').startSpin();
    			dialog.samePageResourceView('edit', resource, options);
			}
			else
				console.log('Attempt to edit resource when it is not ready.');
		},
		refreshView: function(resource) {
			dialog.samePageResourceView('refreshView', resource);
		},
		viewResource: function(resource) {
			$('#mainContainer').startSpin();
			dialog.samePageResourceView('read', resource);
		},
		copyResource: function(resource) {
			dialog.samePageResourceView('copy', resource);
		},
		closeResource: function() {
			dialog.samePageResourceView('close');
		}
	};
};


$.fn.bulkAssignmentDialog = function(options) {
    var dialog = $(this);
    var parent = $(this).parent();

    options = $.extend({tabResourceLabel : 'bulk.assignment.resource.label',
                        tabRoleLabel : 'bulk.assignment.role.label',
                        tabModeLabel : 'bulk.assignment.mode.label',
                        modeInputLabel : 'bulk.assignment.input.mode.label',
                        modeInputInfo : 'bulk.assignment.input.mode.info',
                        tabTitle : 'bulk.assignment.tab.title'}, options);

    var id = $(this).attr('id');
    var resource = options.resource;

    if(typeof $(this).data('options') == 'undefined') {
        $(this).data('options', $.extend({init : true}, options));
        var dataOptions = $(this).data('options');

        $(this).empty();
        var modalForm = '<div class="modal" id="' + id + 'Form" tabindex="-1" role="dialog" dialog-for="' + id + '">' +
                '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<button type="button" class="close" data-dismiss="modal"' +
                                    'aria-hidden="true">&times;</button>' +
                            '<h4 class="modal-title">' + getResource(dataOptions.tabTitle)  + '</h4>' +
                        '</div>' +
                        '<div class="modal-body">' +
                            '<div id="' + id + 'TabContent">' +
                                '<div id="' + id + 'Tabs"></div>' +
                                '<div id="' + id + 'TabResources"><div class="col-xs-12" id="' + id + 'ResourceComponent"></div></div>' +
                                '<div id="' + id + 'TabRoles"><div class="col-xs-12" id="' + id + 'RoleComponent"></div></div>' +
                                '<div id="' + id + 'TabMode" class="col-xs-12"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="modal-footer"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        $(this).html(modalForm);

        $(this).find('.modal-footer').empty();
        $(this).find('.modal-footer').append(
                    '<button type="button" id="' + id + 'Action" class="btn btn-primary"><i class="fa fa-save"></i>' + getResource("text.update") + '</button>');
        $('#' + id + "Action").off('click');

        $('#' + id + "Action").on('click', function() {
            var bulkAssignment = new Object();
            bulkAssignment.roleIds = $('#' + id + 'RoleComponent').multipleSelectValues();
            bulkAssignment.resourceIds = $('#' + id + 'ResourceComponent').multipleSelectValues();
            var mode = $('#' + id + 'ModeComponentInput').data('widget').getValue();
            bulkAssignment.mode =  mode == '' ? "0" : mode;

            if(valid(bulkAssignment)) {
                postJSON(resource + '/bulk', bulkAssignment, function(data) {
                    if(data.success) {
                        showSuccess(data.message);
                    } else {
                        showError(data.message);
                    }
                    if(typeof options.modalCallback != "undefined") {
                        options.modalCallback(data);
                    }
                    $('#' + id + 'Form').modal('hide');
                });
            }
        });

        $('#' + id + 'Tabs').tabPage({
            title : '',
            icon : 'fa-cog',
            tabs : [ {
                id : id + "TabResources",
                name : getResource(dataOptions.tabResourceLabel)
            }, {
                id : id + "TabRoles",
                name : getResource(dataOptions.tabRoleLabel)
            }, {
                 id : id + "TabMode",
                 name : getResource(dataOptions.tabModeLabel)
             }],
            complete : function() {
                loadComplete();
            }
        });

        var modeComponent = '<div id="' + id + 'ModeComponent" class="propertyItem form-group">' +
                            '<label id="' + id  + 'ModeComponentInputLabel" for="' + id + 'ModeComponentInput" class="col-md-3 control-label optionalField">' + getResource(dataOptions.modeInputLabel) + '</label>' +
                            '<div class="propertyValue col-md-9">' +
                            '<div id="' + id +'ModeComponentInput"></div><div class="clear">'+
                            '<span class="help-block">' + getResource(dataOptions.modeInputInfo) + '</span></div></div></div>';
        $('#' + id + 'TabMode').empty().append(modeComponent);

    }

    var valid = function(bulkAssignment) {
        if(bulkAssignment.roleIds.length == 0) {
            showError(getResource('bulk.assignment.error.no.role'));
            return false;
        }
        if(bulkAssignment.resourceIds.length == 0) {
            showError(getResource('bulk.assignment.error.no.resource'));
            return false;
        }
        return true;
    }

    var show = function() {
        $.when(
            getJSON(resource + '/list', null, function(data) {
                $('#' + id + 'ResourceComponent').multipleSelect({
                    values : data.resources
                });
            }),
            getJSON('roles/list', null, function(data) {
               $('#' + id + 'RoleComponent').multipleSelect({
                    values : data.resources
                });
            }),
            getJSON('enum/displayable/com.hypersocket.bulk.BulkAssignmentMode/', null, function(data) {
               $('#' + id + 'ModeComponentInput').empty();
               $('#' + id + 'ModeComponentInput').selectButton({options: data.resources,
                    valueAttr : 'id',
                    nameAttr : 'display'}
               );
            })
        ).then(function(){
            $('#' + id + 'Form').modal('show');
            $('#' + id + ' a:first').tab('show')
        });
    }

    return {
        show : show
    }

}
$.fn.bootstrapResourceDialog = function(params, params2) {

	var dialog = $(this);
	var parent = $(this).parent();
	var options = $.extend({ 
		dialogWidth : 700, 
		dialogHeight : 'auto', 
		hasResourceTable : true,
		onDialogClose: false
	}, params);
	var dialogOptions = $(this).data('options');

	if (params === 'create') {

		log("Creating resource dialog");

		var selfShow = dialogOptions.clearDialog(true);
		removeMessage();

		if(dialogOptions.propertyOptions)
			$(this).find('.modal-title').text(
					getResource(dialogOptions.resourceKey + '.create.title').formatAll(dialogOptions.propertyOptions.resourceArgsCallback ? dialogOptions.propertyOptions.resourceArgsCallback(params2) : dialogOptions.propertyOptions.resourceArgs));
		else
			$(this).find('.modal-title').text(getResource(dialogOptions.resourceKey + '.create.title'));

		$(this).find('.modal-footer').empty();
		$(this).find('.modal-footer').append(
					'<button type="button" id="' + $(this).attr('id') + 'Action" class="btn btn-primary"><i class="fa fa-save"></i>' + getResource("text.create") + '</button>');
		$('#' + $(this).attr('id') + "Action").off('click');

		$('#' + $(this).attr('id') + "Action").on('click', function() {	
			var buttonElement = $(this);
			var func = function() {
				saveResource(dialogOptions.createResource(), buttonElement, dialogOptions, 'create', function(savedResource) {
					
					var func = function() {
						dialog.bootstrapResourceDialog('close');
						if (dialogOptions.hasResourceTable) {
							$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('refresh');
						}
						if(dialogOptions.resourceSaved) {
							dialogOptions.resourceSaved(savedResource);
						}
					};
					
					if(dialogOptions.refreshI18nResources) {
						loadResources(func);
					} else {
						func();
					}
				});
			};
			if(dialogOptions.confirmSave) {
				dialogOptions.confirmSave(func);
			} else {
				func();
			}
		});
		
		if(!selfShow) {
			dialog.modal('show');
		}
		return;

	} else if (params === 'edit' || params === 'read' || params === 'copy') {
		var readOnly = params==='read';
		dialogOptions.clearDialog(false);
		removeMessage();
		var selfShow = false;
		if(params === 'copy') {
			if(dialogOptions.remoteCopy) {
				var copiedResource = $.extend(true, {}, params2);
				postJSON(dialogOptions.copyUrl + '/' + params2.id, null, function(data) {
	
					if (data.success) {
						log("Resource copied");
						$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('refresh');
						checkBadges(false);
						showSuccess(data.message);
					} else {
						log(data.message);
						showError(data.message);
					}
				});
			} else {
				var copiedResource = $.extend(true, {}, params2);
				copiedResource.name = copiedResource.name + ' (' + getResource('text.copy') + ')';
				selfShow = dialogOptions.displayResource(copiedResource, readOnly, true);
			}
		} else {
			selfShow = dialogOptions.displayResource(params2, readOnly, false);
		}
		if(readOnly) {
			$(this).find('.modal-title').text(
					getResource(dialogOptions.resourceKey + '.view.title'));
		} else {
			$(this).find('.modal-title').text(
					getResource(dialogOptions.resourceKey + '.update.title'));
		}

		if(dialogOptions.propertyOptions) {
			if(readOnly)
				$(this).find('.modal-title').text(
						getResource(dialogOptions.resourceKey + '.view.title').formatAll(dialogOptions.propertyOptions.resourceArgsCallback ? dialogOptions.propertyOptions.resourceArgsCallback(params2) : dialogOptions.propertyOptions.resourceArgs));
			else
				$(this).find('.modal-title').text(
						getResource(dialogOptions.resourceKey + '.update.title').formatAll(dialogOptions.propertyOptions.resourceArgsCallback ? dialogOptions.propertyOptions.resourceArgsCallback(params2) : dialogOptions.propertyOptions.resourceArgs));
		
		} else {
			if(readOnly)
				$(this).find('.modal-title').text(getResource(dialogOptions.resourceKey + '.view.title'));
			else 
				$(this).find('.modal-title').text(getResource(dialogOptions.resourceKey + '.update.title'));

		}

		$(this).find('.modal-footer').empty();
		if(!readOnly) {
			
			if(!dialogOptions.disableUpdateButton) {
				$(this).find('.modal-footer').append(
						'<button type="button" id="' + $(this).attr('id') + 'Action" class="btn btn-primary"><i class="fa fa-save"></i>' 
						+ getResource("text.update") + '</button>');
			}
			
			if(dialogOptions.buildUpdateButtons) {
				dialogOptions.buildUpdateButtons(params2, function(button, onclick) {
					dialog.find('.modal-footer').append(
							'<button type="button" id="' + button.id + 'Action" class="updateButton btn ' 
							+ button.cssClass + '"><i class="fa ' 
							+ button.icon + '"></i>' 
							+ getResource(button.resourceKey) + '</button>');
					$('#' + button.id + 'Action').click(function() {
						onclick(button, $('#' + button.id + 'Action'));
					});
				});
			}
			
			$('#' + $(this).attr('id') + "Action").off('click');
			$('#' + $(this).attr('id') + "Action").on('click', function() {

				var resource = dialogOptions.createResource();
				if(params === 'copy') {
					resource.id = null;
					saveResource(resource, $(this), dialogOptions, params, function() {
						
						var func = function() {
							dialog.bootstrapResourceDialog('close');
							if (dialogOptions.hasResourceTable) {
								$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('refresh');
							}
							if(dialogOptions.resourceSaved) {
								dialogOptions.resourceSaved(resource);
							}
						};
						
						if(dialogOptions.refreshI18nResources) {
							loadResources(func);
						} else {
							func();
						}

					});
				} else {
					var buttonElement = $(this);
					var func = function() {
						saveResource(resource, buttonElement, dialogOptions, params, function() {
							
							var func = function() {
								dialog.bootstrapResourceDialog('close');
								if (dialogOptions.hasResourceTable) {
									$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('updateByUniqueId',	{ id: resource.id, row: resource });
									$('#' + dialogOptions.divName + 'Placeholder').bootstrapTable('refresh');
								}
								if (dialogOptions.resourceUpdated) {
									dialogOptions.resourceUpdated(resource);
								}
								if(dialogOptions.resourceSaved) {
									dialogOptions.resourceSaved(resource);
								}
								if(params2.resourceUpdated) {
									params2.resourceUpdated(resource);
								}
							};
							
							if(dialogOptions.refreshI18nResources) {
								loadResources(func);
							} else {
								func();
							}
							
							
						});
					};
					if(dialogOptions.confirmSave) {
						dialogOptions.confirmSave(func);
					} else {
						func();
					}
				}

			});
		}
		
		if(!selfShow) {
			dialog.modal('show');
		}
		return;

	} else if (params === 'close') {
		dialog.modal('hide');
		return;
	} else if (params === 'error') {
		if(params2 == 'reset') {
			removeMessage();
		} else {
			showError(params2);
		}
		return;
	} else {
		if (!options.resourceKey) {
			alert("Bad usage, resourceKey not set");
		} else {
			$(this).data('options', options);
		}
		
		if(options.onDialogClose) {
			dialog.on('hidden.bs.modal', function () {
				options.onDialogClose();
			});
		}
	}
	
	return {
		createResource: function(callback) {
			dialog.bootstrapResourceDialog('create', callback);
		},
		editResource: function(resource) {
			dialog.bootstrapResourceDialog('edit', resource);
		},
		viewResource: function(resource) {
			dialog.bootstrapResourceDialog('read', resource);
		},
		copyResource: function(resource) {
			dialog.bootstrapResourceDialog('copy', resource);
		},
		closeResource: function() {
			dialog.bootstrapResourceDialog('close');
		}
	};
};

$.fn.extendedResourcePanel = function(params){
    var options = $.extend({tabIcon: 'fa-cog'}, params);

    var id = $(this).attr('id');
    if(id == null || typeof id == 'undefined' || id.trim().length == 0) {
        id = options.resource.id.toString();
    }
    var tabContentHolderId = id + 'Tabs';
    var tabsId = 'tabs' + id.charAt(0).toUpperCase() + id.substring(1);
    $(this).empty();
    $(this).append('<div id=' + tabContentHolderId + '></div>');
    var $tabContentHolder = $('#' + tabContentHolderId);
    $tabContentHolder.append('<div id=' + tabsId + '></div>');

    getJSON('menus/extendedResourceInfo/' + options.resourceKey, null, function(data) {
        if(data.success) {
            var tabList = data.resources;
            if(tabList == null || typeof tabList == 'undefined' || tabList.length == 0) {
                $tabContentHolder.empty().html('<div class="well well-sm text-center">' + getResource('tabs.not.found') + '</div>');
                return;
            }
            tabList.sort(function(obj1, obj2){ return obj1.weight - obj2.weight});
            var tabArray = [];
            $.each(tabList,function(index, value){
                var tabId = id + value.resourceKey.charAt(0).toUpperCase() + value.resourceKey.substring(1);
                tabArray.push({id : tabId, name: getResource(value.resourceKey + '.label')});
                $tabContentHolder.append('<div id=' + tabId + '></div>');
                $('#' + tabId).load(uiPath + '/content/' + value.url + '.html', null, function(){
                    var elements = $('#' + tabId).find('[data-id]');
                    $.each(elements, function(i, element) {
                        $(element).attr('id', $(element).attr('data-id') + '_' + options.resource.id);
                    });
                    elements = $('#' + tabId).find('[dialog-for]');
                    $.each(elements, function(i, element) {
                        $(element).attr('dialog-for', $(element).attr('dialog-for') + '_' + options.resource.id);
                    });
                    if($('#' + tabId).children('.extendedTabContent').length > 0) {
                        $('#' + tabId).children('.extendedTabContent').data('initPage')(options.resource, options.data, value.readOnly);
                    }
                });
            });

            $tabContentHolder.tabPage({
                title : getResource(options.resourceKey + '.label'),
                icon : options.tabIcon,
                tabs : tabArray,
                complete : function() {
                    loadComplete();
                }
            });
        }
    });
};
