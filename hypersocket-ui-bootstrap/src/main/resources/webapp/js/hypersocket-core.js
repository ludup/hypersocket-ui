// Main content div
var contentDiv = '#content';
var currentMenu = null;
var currentRealm = null;
var countries = null;
var restartAutoLogoff = false;
var allMenus = new Array();

$.ajax({
    url: basePath + '/ui/json/countries.json',
    dataType: "text",
    success: function(data) {
    	countries = $.parseJSON(data);
    }
});

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
		var session = $(document).data('session');
		if(session && !polling) {
			startLogon();
			showError(getResource("error.sessionTimeout"), false);
		}
	} 
}, cache : false });


$.fn.ajaxResourcePageInsert = function(resource) {
	$(this).data('dataTable').fnAddData(resource);
};

$.fn.ajaxResourcePage = function(params) {

	var divName = $(this).attr('id');

	log("Creating ajax resource page for div " + divName);

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
			+ options.title + '</span></h2></div><div id="'
			+ divName + 'Panel" class="panel-body">'
	}
	
	html +=	'<table class="table' 
		+ (options.selected ? '' : ' table-striped') + '" id="'
		+ divName + 'Table' + '"><thead><tr id="' 
		+ divName + 'TableHeader"></tr></thead></table>';
	
	if(!options.disableDecoration) {
		html +=	'</div>';
	}
	

	html += '<div id="' + divName + 'Actions" class="tabActions panel-footer"></div>';
	

	if(!options.disableDecoration) {
		html += '</div>';
	}
	
	$(this).append(html);

	$('div[dialog-for="' + divName + '"]').resourceDialog(options);

	var columns = new Array();
	var columnsDefs = new Array();

	$.each(options.fields,
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
			canUpdate = options.checkUpdate(idCol.aData);
		}

		renderedActions += '<a class="btn btn-info row-edit" href="#"><i class="fa ' + (options.canUpdate && canUpdate ? 'fa-edit' : 'fa-search') + '"></i></a>';

		$(document).off('click', '#' + divName + 'Actions' + id + ' .row-edit');

		$(document).on(
			'click',
			'#' + divName + 'Actions' + id + ' .row-edit',
			function() {
				var curRow = $('#' + divName + 'Table').dataTable().fnGetPosition(
					$(this).closest("tr").get(0));
				var resource = $('#' + divName + 'Table').dataTable().fnGetData(
					curRow);
				if (options.showUpdate) {
					options.showUpdate();
				}
				$('div[dialog-for="' + divName + '"]').resourceDialog(options.canUpdate && canUpdate ? 'edit' : 'read',
					{ row : curRow, resource : resource });
		});

		if (options.canDelete) {
			
			var canDelete = !idCol.aData.system;
			if(options.checkDelete) {
				canDelete = !idCol.aData.system && options.checkDelete(idCol.aData);
			}
			
			if(canDelete) {
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
											options.resourceDeleted(resource, data.message);
										}
										$('#' + divName + 'Table').dataTable().fnDeleteRow(row);
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

		return '<div id="' + divName + 'Actions' + id + '" class="tableActions" name="' + divName + 'Actions">' + renderedActions + '</div>';
	};

	$('#' + divName + 'TableHeader').append(
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
	
	$(this).data('dataTable', oTable);
	
	if(options.selected) {
	    var tableTools = new $.fn.dataTable.TableTools( oTable, {
	        sRowSelect: "os",
	        fnRowSelected: function ( nodes ) {
	        	var full = oTable.fnGetData(nodes[0]);
	        	options.selected(full);
	        }
	    });
	}
	
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
	}

	if (options.complete) {
		options.complete();
	}

};

$.fn.ajaxResourcePage2 = function(params) {

	var divName = $(this).attr('id');

	log("Creating ajax resource page 2 for div " + divName);

	var options = $
			.extend(
				{ divName : divName, canCreate : false, canUpdate : false, canDelete : false, icon : 'fa-cog' },
				params);

	$(this).data('options', options);

	var html = '<div class="panel panel-default"><div class="panel-heading"><h2><i class="fa '
		+ options.icon + '"></i><span class="break">' 
		+ options.title + '</span></h2></div><div id="'
		+ divName + 'Panel" class="panel-body"><table class="table' 
		+ (options.selected ? '' : ' table-striped') + '" id="'
		+ divName + 'Table' + '"><thead><tr id="' 
		+ divName + 'TableHeader"></tr></thead></table></div>';

	if(options.canCreate) {
		html += '<div id="' + divName + 'Actions" class="tabActions panel-footer"/>';
	}
	
	html += '</div>';
	$(this).append(html);

	$('div[page-for="' + divName + '"]').hide();
	$('div[page-for="' + divName + '"]').append('<div class="panel-footer">'
			+ '<button class="btn btn-primary" id="saveResource"><i class="fa fa-save"></i>&nbsp'
			+ '<span>' + getResource("text.save") + '</span></button>'
			+ '<button class="btn btn-danger" id="cancelResource"><i class="fa fa-times"></i>&nbsp'
			+ '<span>' + getResource("text.cancel") + '</span></button>'
			+ '</div>');
	
	$('#cancelResource').click(function() {
		
		options.clearDialog();
		$('div[page-for="' + divName + '"]').hide();
		$('#'+divName).show();
	});
	
	$('#saveResource').click(function() {
		if (options.validate) {
			if (!options.validate()) {
				log("Resource validation failed");
				return;
			}
		}
		var resource = options.createResource();

		log("Created resource object for posting");

		postJSON(options.resourceUrl, resource, function(data) {
			if (data.success) {
				log("Resource object created");
				
				if (options.hasResourceTable) {
					if($('#'+divName).data('editing')) {
						$('#' + dialogOptions.divName + 'Table').dataTable().fnUpdate(data.resource, $('#'+divName).data('row'));
					} else {
						$('#' + options.divName + 'Table').dataTable().fnAddData(data.resource);
					}
				}
				if (options.resourceCreated) {
					options.resourceCreated(data.resource);
				}
				
				$('div[page-for="' + divName + '"]').hide();
				$('#'+divName).show();
				
				showSuccess(data.message);
			} else {
				log("Resource object creation failed " + data.message);
				showError(data.message);
			}
		});
	});
	
	var columns = new Array();
	var columnsDefs = new Array();

	$.each(
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

//		if (options.canUpdate) {
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

					$('#'+divName).data('editing', true);
					$('#'+divName).data('row', curRow);
					$('#'+divName).data('creating', false);
					
					options.displayResource(resource);
					
					$('#'+divName).hide();
					$('div[page-for="' + divName + '"]').show();
				});
//		}

		if (options.canDelete) {
			renderedActions += '<a class="btn btn-danger row-delete" href="#"><i class="fa fa-trash-o"></i></a>';

			$(document).off('click', '#' + divName + 'Actions' + id + ' .row-delete');

			$(document).on(
				'click',
				'#' + divName + 'Actions' + id + ' .row-delete',
				function() {

					log("Entering resource delete for id " + id);

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
									showSuccess(data.message);
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
	
	if (options.canCreate) {

		$('#' + divName + 'Actions')
				.append(
					'<button id="' + divName + 'Add" class="btn btn-primary"><i class="fa fa-plus-circle"></i>' + getResource('text.add') + '</button>');
		$('#' + divName + 'Add').click(function() {
			if (options.showCreate) {
				options.showCreate();
			}
			$('#'+divName).data('editing', false);
			$('#'+divName).data('creating', true);
			$('#'+divName).hide();
			$('div[page-for="' + divName + '"]').show();
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

	dialog.on('hidden.bs.modal', function () {
		 removeMessage();
	});
	
	dialog.on('hide.bs.modal.prevent', function (e) {
		 if(options.closeHandler) {
			 if(!options.closeHandler()) {
				 e.preventDefault();
			 }
		 } 
	});
	
	if (params === 'create') {

		log("Creating resource dialog");

		dialog.modal({
			  backdrop: 'static',
			  keyboard: false
			});
		
		dialogOptions.clearDialog(true);
		dialog.resourceDialog('error', 'reset');

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
						dialog.resourceDialog('close');
						if (dialogOptions.hasResourceTable) {
							$('#' + dialogOptions.divName + 'Table').dataTable().fnAddData(
								data.resource);
						}
						if (dialogOptions.resourceCreated) {
							dialogOptions.resourceCreated(data.resource);
						}
						showSuccess(data.message);
					} else {
						log("Resource object creation failed " + data.message);
						dialog.resourceDialog('error', data.message);
					}
				}, null, function() { stopSpin(icon, 'fa-save');});
			});
	
		removeMessage();
		dialog.modal('show');

	} else if (params === 'edit' || params === 'read') {
		var readOnly = params==='read';
		
		dialog.modal({
			  backdrop: 'static',
			  keyboard: false
			});
		
		dialogOptions.clearDialog(false);
		dialog.resourceDialog('error', 'reset');
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
						dialog.resourceDialog('close');
						if (dialogOptions.hasResourceTable) {
							$('#' + dialogOptions.divName + 'Table').dataTable().fnUpdate(
								data.resource, params2.row);
						}
						if (dialogOptions.resourceUpdated) {
							dialogOptions.resourceUpdated(data.resource);
						}
						showSuccess(data.message);
					} else {
						dialog.resourceDialog('error', data.message);
					}
				}, null, function() { stopSpin(icon, 'fa-save');});

			});
		}
		
		removeMessage();
		dialog.modal('show');

	} else if (params === 'close') {
		removeMessage();
		dialog.modal('hide');
	} else if (params === 'error') {

		removeMessage();
		if (params2 != 'reset') {
			showError(getResourceNoDefault(params2) == undefined ? params2 : getResource(params2));
		}
	} else {
		if (!options.resourceKey) {
			alert("Bad usage, resourceKey not set");
		} else {
			$(this).data('options', options);
		}
	}
};

function startSpin(element, iconClass) {
	element.removeClass(iconClass);
	element.addClass('fa-spin');
	element.addClass('fa-spinner');
}

function stopSpin(element, iconClass) {
	element.removeClass('fa-spin');
	element.removeClass('fa-spinner');
	element.addClass(iconClass);
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


function startLogon() {
	logon(null, {
		showBusy: showBusy,
		hideBusy: hideBusy,
		logonStarted: function() {
			$('div[role="dialog"]').remove();
			$('#actionLogoff').remove();
			$('#nav').hide();
			$('#navMenu').empty();
		},
		processResponse: function(data) {
			$('#userInf').empty();
			$('#userInf').append(getResource("text.notLoggedIn"));
			
			$('#version').text(getResource("label.version") + " " + data.version);
			
			clearContent();
			$('#currentRealm').remove();
			$('#lang').remove();
			$('#navMenu').empty();
			$('div.modal-backdrop.in').remove();
		},
		processForm: function(data) {
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

				$('#lang').change(function() {

					log("Switching language to " + this.value);

					getJSON('switchLanguage/' + this.value, null, function() {
						document.location.reload();
					});
				});
			}
		},
		logonCompleted: function(data) {
			$('#userInf').empty();
			$('#userInf').append(getResource('text.loggedIn').format(
					data.session.currentPrincipal.name, data.session.currentRealm.name));
			
			
			if(data.homePage != '') {
				window.open(data.homePage, "_self", false);
			} else {
				home(data);
			}
			
		},
		formContent: $(contentDiv)
	});
}

function logoff() {

	log("Logging off");

	$(document).data('session', null);
	
	showBusy();

	$.get(basePath + '/api/logoff', null, function() {
		startLogon();
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

	removeMessage();
	
	currentRealm = data.session.currentRealm;
	currentMenu = null;
	var message = data.bannerMsg;
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
					
					allMenus[this.resourceKey] = this;
					
					$('#menu')
							.append(
								'<div id="menu_' + this.id + '" class="nav-sidebar title" ' + (this.hidden ? 'style="display:none"' : '') + '><span>' + getResource(this.resourceKey + '.label') + '</span></div>');

					if (this.menus.length > 0) {
						var menu = '#sub_' + this.id;
						$("#menu").append(
							'<ul id="sub_' + this.id + '" class="nav nav-sidebar"/>');
						$.each(this.menus, function() {
							
							allMenus[this.resourceKey] = this;
							
							$(menu).append('<li><a id="' + this.id + '" href="#" class="sideMenu"><i class="fa ' 
									+ this.icon + '"></i><span class="hidden-sm text">' 
									+ getResource(this.resourceKey + '.label') + '</span></span></a></li>');
							$('#' + this.id).data('menu', this);
							$('#' + this.id).click(function() {
								$(".sideMenu").removeClass("active");
								$(this).addClass("active");
								loadMenu($('#' + $(this).attr('id')).data('menu'));
							});

							var parent = this;
							$.each(this.menus, function() {
								this.parent = parent;
								allMenus[this.resourceKey] = this;
							});

							if(currentMenu==null) {
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

			var session = $(document).data('session');
			if(session.impersonating) {
				$('#navMenu').append(
					'<li class="navicon"><a id="impersonateMenu" href="#"><i class="fa fa-male"></i></a></li>');
				$('#impersonateMenu').click(function(e) {
					e.preventDefault();
					getJSON('session/revert', null, function(data) {
						if(data.success) {
							window.location.reload();
						} else {
							showError(data.message);
						}
					});
				});
			}
			
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

			if(data.systemAdmin) {
				$('#navMenu').append('<li class="navicon" id="powerMenu" class="dropdown"><a class="dropdown" data-toggle="dropdown" href="#"><i class="fa fa-power-off"></i></a></li>');
				
				$('#powerMenu').click(function(e) {
					showShutdownDialog();
				});
			}
			
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
				/** 
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
				**/
				$('.langSelect').click(function(e) {

					e.preventDefault();
					
					log("Switching language to " + $(this).attr('data-value'));

					getJSON('session/switchLanguage/' + $(this).attr('data-value'), null, function() {
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

			if(window.location.hash.startsWith('#menu=')) {
				var loadThisMenu = allMenus[window.location.hash.substring(6)];
				if(loadThisMenu!=null) {
					currentMenu = loadThisMenu;
				}
			}
			
			
//			$('#' + currentMenu.id).trigger('click');
			loadMenu(currentMenu);

			
			
			if(message != null && message.length > 0) {
				if(message.startsWith('info=')) {
					showInformation(message.substring(5));
				} else if(message.startsWith('success=')) {
					showSuccess(message.substring(8));
				} else if(message.startsWith('warning=')) {
					showWarning(message.substring(8));
				} else if(message.startsWith('error=')) {
					showError(message.substring(6));
				} 
			}
			hideBusy();
		});

		var checkTimeout = function() {
			
			log("Checking session timeout");
			
			getJSON('session/peek', null, function(data) {
				setTimeout(checkTimeout, 30000);
			}, function() {
				return !hasShutdown;
			});
		};
		
		setTimeout(checkTimeout, 30000);

}

function showShutdownDialog(option, logoff) {
	
	var shutdownModal = '<div class="modal" id="shutdownServer" tabindex="-1" role="dialog">' +
	'<div class="modal-dialog modal-sm">' +
		'<div class="modal-content">' +
			'<div class="modal-header">' +
				'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
				'<h4 class="modal-title" id="myModalLabel">' + getResource('power.shutdownServer') + '</h4>' +
			'</div>' +
			'<div class="modal-body row">' +
				'<div class="col-xs-6" style="text-align: center">' +
					'<button class="btn btn-small btn-primary" id="buttonShutdown" style="margin-bottom: 15px" data-dismiss="modal">' +
						'<i class="fa fa-power-off" style="font-size: 40px"></i>' +
					'</button>' +
					'</br>' +
					'<span>' + getResource("shutdown.label") + '</span>' +
				'</div>' +
				'<div class="col-xs-6" style="text-align: center">' +
					'<button class="btn btn-small btn-primary" id="buttonRestart" style="margin-bottom: 15px" data-dismiss="modal">' +
						'<i class="fa fa-repeat" style="font-size: 40px"></i>' +
					'</button>' +
					'</br>' +
					'<span>' + getResource("restart.label") + '</span>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</div>' +
'</div>';
	$(shutdownModal).modal('show');

	$('#buttonShutdown').click(function(){
		shutdown('shutdown');
	});
	$('#buttonRestart').click(function(){
		shutdown('restart');
	});

	if(option) {
		shutdown(option, logoff);
	}
}

function shutdown(option, autoLogoff){
	
	$('#shutdownServer').find('.modal-body').empty();
	$('#shutdownServer').find('.modal-body').append(
			'<p style="width: 100%; text-align: center;">' + getResource("power.wait.shutdown") + '</p>' +
			'<i class="fa fa-spinner fa-spin" style="font-size: 40px; width: 100%; text-align: center"></i>')
	
	getJSON('server/' + option + '/5', function(data) {
	
		if(data.success) {
			
			hasShutdown = true;
			var serverRunning = true;
			var hasStopped = false;
			var restarted = false;
				
			var timer = setTimeout(function() {
				$.ajax({
					url: basePath + '/api/server/ping',
					dataType: 'json',
					success: function(data){
						if(!serverRunning){
							hasShutdown = false;
							restarted = true;
						}
					},
					error: function(data) {
						serverRunning = false;
						if(!hasStopped) {
							hasStopped = true;
							$('#shutdownServer').find('p').text(getResource("power.finished.shutdown"));
							setTimeout(function(){
								if(option == 'restart'){
									$('#shutdownServer').find('p').text(getResource("power.wait.restart"));
								}
							}, 2000);
						}
					}
				});
				if(serverRunning || (!serverRunning && !restarted && option == 'restart')){
					timer = setTimeout(arguments.callee, 1000);
				}else{
					$('#shutdownServer').find('p').text(getResource('power.finished.' + option));
					$('#shutdownServer').find('i').removeClass('fa-spin fa-spinner').addClass('fa-check');
					
					setTimeout(function() {
						if(autoLogoff || (option == 'restart' && restartAutoLogoff)) {
							log('Logging off user');
							$('#shutdownServer').modal('hide');
							logoff();
						} else {
							if(option == 'restart'){
								setTimeout(function(){
									location.reload();
								}, 2000);
							}					
						}
					}, 2000);
				}
			}, 1000);
			
		} else {
			showError(data.error);
		}
	});
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
		getJSON('session/switchRealm/' + realm, null,
			function(data) {
				if (!data.success) {
					showError(data.errorMsg);
				} else { 
					document.location.reload();
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
	$.getJSON(basePath + "/api/realms/list", null, function(data) {
		loadRealms(data.resources);
		// This should not be needed but some areas reload the page and so the state does not get updated
		// http://stackoverflow.com/questions/11519660/twitter-bootstrap-modal-backdrop-doesnt-disappear
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove();
	});
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
			fadeMessage();
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

	var subPage = null;
	if(menu.parent) {
		subPage = menu.resourceKey;
		menu = menu.parent;
	}
	
	currentMenu = menu;
	
	$('#mainContent').hide();
	$('#informationBar').empty();
	$('#mainContent').empty();
	
	$('div[role="dialog"]').remove();
	$('#mainContent').data('loadComplete', false);

	if(menu.menus.length > 0) {

		allMenus[this.resourceKey] = this;
		
		$('#mainContent').append('<div class="col-xs-12" id="subMenuContent">'
				+ '<div class="row">'
					+ '<div class="panel panel-default">'
						+ '<div id="subMenuIconPanel" class="panel-body"></div>'
					+ '</div>'
				+ '</div>'
			+ '</div>'
			+ '<div id="subMenuPageContent">'
				+ '<div class="row">'
					+ '<div class="col-xs-12" id="menuContent"></div>'
				+ '</div>'
			+ '</div>');
						
		$.each(menu.menus, function() {
			
			allMenus[this.resourceKey] = this;
			if(!this.hidden) {
				$('#subMenuIconPanel').append(
					'<div class="col-xs-2">'
					+	'<a class="hidden-xs large-button subMenu" data-value="' + this.resourceName + '" id="button_' + this.resourceKey + '">'
					+		'<i class="fa ' + this.icon + '"></i><p class="hidden-sm hidden-xs">' + getResource(this.resourceKey + '.title') + '</p>'
					+	'</a>'
					+	'<a class="visible-xs small-button subMenu" data-value="' + this.resourceName + '" id="button_' + this.resourceKey + '">'
					+		'<i class="fa ' + this.icon + '"></i>'
					+	'</a>'
				+ '</div>');
			}

		});
	
		for(var i=0;i<menu.menus.length;i++) {
			$('#subMenuIconPanel').append('<div class="col-xs-2"></div>');
			$(document).data(menu.menus[i].resourceName, menu.menus[i]);
		}
		
		$('.subMenu').click(function(e) {
			e.preventDefault();
			currentMenu = $(document).data($(this).attr('data-value'));
			loadSubPage(currentMenu, $(this));
		});
		
		if(subPage==null) {
			$('.subMenu').first().trigger('click');
		} else {
			$('#button_' + subPage).trigger('click');
		}
		
	} else {
	
		loadWait();
		$('#mainContent').load('content/' + menu.resourceName + '.html', function() {
			window.location.hash = "menu=" + menu.resourceKey;
		});
	}
}

function loadSubPage(menu, element) {
	$('#subMenuIconPanel').find('.large-button-active').removeClass('large-button-active');
	$('#subMenuIconPanel').find('.small-button-active').removeClass('small-button-active');
	element.parent().find('.large-button').addClass('large-button-active');
	element.parent().find('.small-button').addClass('small-button-active');
	loadWait();
	$('#menuContent').load('content/' + menu.resourceName + '.html', function() {
		window.location.hash = "menu=" + menu.resourceKey;
	});
}

