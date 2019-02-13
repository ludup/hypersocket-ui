// Main content div
var contentDiv = '#content';
var currentMenu = null;
var currentRealm = null;
var currentRole = null;
var countries = null;
var restartAutoLogoff = false;
var menuList = null;
var allMenus = new Array();
var systemAdmin;

doAjax({
    url: uiPath + 'json/countries.json',
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

$.fn.countries = function(obj) {
	
	var id = $(this).attr('id');
	
	doAjax({
	    url: uiPath + 'json/countries.json',
	    dataType: "text",
	    success: function(data) {
	    	var list = $.parseJSON(data);
	    	
	    	var widgetOptions = $.extend(obj, {
	    		values : list,
	    		nameAttr: 'name',
	    		valueAttr: 'code'
	    	});
	    
	    	$('#' + id).autoComplete(widgetOptions);
	    }
	});
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

window.onhashchange = function() {  
	if($('#pageContent').length > 0) {
		$('#pageContent').remove();
		$('#mainContainer').removeClass('col-md-12');
		$('#mainContainer').addClass('col-md-10');
		$('#mainContainer').removeClass('col-sm-12');
		$('#mainContainer').addClass('col-sm-11');
		$('#main-menu').show();
		$('#mainContent').show();
	}
	
	var name = getAnchorByName('menu');
	log('Loading menu ' + name);
    loadMenu(allMenus[name]);
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

/**
 * Clear the main content div
 */
function clearContent() {
	log("Clearing content");
	$('#informationBar').empty();
	$(contentDiv).empty();
};


function startLogon(opts) {
	
	if(!opts) {
		opts = $(document).data('logonOptions');
	}
	
	opts = $.extend({
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
			if(data.homePage && data.homePage!=='') {
				log('Opening user home page ' + data.homePage);
				window.open(data.homePage, "_self", false);
			} else {
				if($(document).data('lastPrincipal')) {
					
					if($(document).data('session').currentPrincipal.id !== $(document).data('lastPrincipal').id) {
						log('Session principal does not match the last principal used by this document');
						
						window.location.reload();
						return;
					}
				}
				home(data);
			}
			$('#userInf').empty();
			
			if(currentRole) {
				$('#userInf').append(getResource('text.loggedIn').format(
						data.session.currentPrincipal.name, data.session.currentRealm.name, currentRole.name));
			} else if(data.session.impersonatedPrincipal) { 
				$('#userInf').append(getResource('text.loggedInImpersonating').format(
						data.session.inheritedPrincipal.name, data.session.currentRealm.name, data.session.currentPrincipal.name));
			} else {
				$('#userInf').append(getResource('text.loggedInNoRole').format(
						data.session.currentPrincipal.name, data.session.currentRealm.name));
			}
		},
		formContent: $(contentDiv)
	}, opts);
	
	$(document).data('logonOptions', opts);
	logon(null, opts);
}

function logoff() {

	log("Logging off");

	getJSON(basePath + '/api/logoff', null, function(data) {	
		if(data.success) {
			if($(document).data('session')) {
				$(document).data('lastPrincipal', $(document).data('session').currentPrincipal);
			}
			$(document).data('session', null);
			window.location = data.resource;
		}
	}, function() {
		window.location = '/';
	});

}

function checkBadges(schedule) {
	
	backgroundJSON('menus/badges', null, function(data) {
		$('.menuBadge').remove();
		if(data.success) {
			$.each(data.resources, function(idx, obj) {
				if(obj.badge!=null) {
					$('#' + obj.resourceKey).find('span').after('<span class="menuBadge badge' + (obj.cssClass ? ' ' + obj.cssClass : '') + '">' + obj.badge + '</span>');
				}
			});
		}
		if(schedule) {
			setTimeout(function() { checkBadges(true) }, 10000);
		}
	});
};

function home(data) {

	log("Entering home");

	// Menu
	$('#navMenu').empty();
	$('#nav').show();
	$('#informationBar').empty();
	$('#main-menu').remove();

	$(contentDiv).empty();
	$(contentDiv).append('<div id="main-menu" class="sidebar col-md-2 col-sm-1"><div id="menu" class="sidebar-collapse"></div></div>');

	removeMessage();
	
	currentRealm = data.session.currentRealm;
	currentRole = data.currentRole;
	currentMenu = null;
	homeMenu = null;
	var message = data.bannerMsg;
	var showLocales = data.showLocales;
	getJSON('menus', null, function(data) {

			log("Received menus");
			menuList = data;
			
			$('#menu').empty();

			$.each(
				data.menus,
				function() {
					
					allMenus[this.resourceKey] = this;
					
					$('#menu')
							.append(
								'<div id="menu_' + this.id + '" class="nav-sidebar title" ' + (this.hidden ? 'style="display:none"' : '') + '><span>' + getResource(this.resourceKey + '.label') + '</span></div>');

					var root = this;
					var navigation = this.resourceKey === 'navigation';
					var page = this.resourceKey === 'pages';
					
					if (this.menus.length > 0) {
						var menu = '#sub_' + this.id;
						$("#menu").append(
							'<ul id="sub_' + this.id + '" class="nav nav-sidebar"/>');
						
						$.each(this.menus, function() {
							
							allMenus[this.resourceKey] = this;
							
							this.page = page;
							if(page) {
								this.hidden = true;
							}
							this.parent = root;
							this.sidebar = page && true;
							var parent = this;
							var firstChild = null;
							$.each(this.menus, function() {
								if(!firstChild && !this.hidden) {
									firstChild = this;
								}
								this.parent = parent;
								this.section = true;
								allMenus[this.resourceKey] = this;
								if(currentMenu==null && this.home) {
									currentMenu = this;
									homeMenu = this;
								}	
								
							});
							
							$(menu).append('<li' + (this.hidden ? ' style="display:none"' : '') + '><a id="' 
									+ this.id + '" href="#menu=' + (firstChild ? firstChild.resourceKey : this.resourceKey) 
									+ '" class="sideMenu"><i class="fa ' 
									+ this.icon + '"></i><span class="hidden-sm text">' 
									+ getResource(this.resourceKey + '.label') + '</span></span></a></li>');
							$('#' + this.id).data('menu', this);
							$('#' + this.id).click(function(e) {
								e.preventDefault();
								$(".sideMenu").removeClass("active");
								$(this).addClass("active");
							});

							if(currentMenu==null && this.home) {
								currentMenu = this;
								homeMenu = this;
							}	

						});
					} 
					
			});
			
			if(currentMenu==null) {
				for(var e in allMenus) {
					if(allMenus[e].menus && allMenus[e].menus.length > 0) {
						continue;
					}
					currentMenu = allMenus[e];
					break;
				}
			}
			
			checkBadges(true);
			
			$('#navMenu')
					.append(
						'<li class="navicon"><a id="main-menu-toggle" class="hidden-sm hidden-md hidden-lg" href="#"><i class="fa fa-bars"></i></a></li>');

			var session = $(document).data('session');
			if(session.impersonating) {
				$('#navMenu').append(
					'<li class="navicon"><a id="impersonateMenu" data-toggle="tooltip" title="' + getResource('text.revertImpersonation') + '" data-placement="bottom" href="#"><i class="fa fa-male"></i></a></li>');
				$('#impersonateMenu').click(function(e) {
					e.preventDefault();
					getJSON('session/revert', null, function(data) {
						if(data.success) {
							
							log('Loading original principals view of users');
							window.location = '${uiPath}#menu=users';
						} else {
							showError(data.message);
						}
					});
				});
			}
			
			$('#currentRole').remove();

			if(currentRole) {
				getJSON('roles/personal', null, function(roles) {
					loadRoles(roles.resources);
				});
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

			$('#main-menu-toggle').click(function(e) {
				e.preventDefault();
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
					if(!$('#main-menu').is(':visible')) {
						$('#main-menu').show();
					} else {
						$('#main-menu').hide();
					}

				}
			});

			if(allMenus['navigation']) {

				$.each(allMenus['navigation'].menus, function(idx, obj) {
					
					if(obj.resourceKey === 'realms') {
						loadRealms(data.realms, data.session ? data.session : $(document).data('session'));
						return;
					}
					
					$('#navMenu').append('<li class="navicon" id="' + this.id 
							+ '"><a data-toggle="tooltip" title="' + getResource(this.resourceKey + '.label') 
							+ '" data-placement="bottom" href="#menu=' + (this.menus.length > 0 ? this.menus[0].resourceKey : this.resourceKey) + '"><i class="fa ' + this.icon + '"></i></a></li>');
					
					$('#' + this.id).data('menu', this);
					$('#' + this.id).click(function(e) {
						$(".active").removeClass("active");
						$(this).find('i').addClass("active");
					});
				});
			}
			
			systemAdmin = data.systemAdmin;
			
			if(data.systemAdmin) {
				$('#bottomMenu').append('<li class="navicon" id="powerMenu" class="dropdown"><a data-toggle="tooltip" title="' + getResource('text.powerOptions') + '" data-placement="top" href="#"><i class="fa fa-power-off"></i></a></li>');
				
				$('#powerMenu').click(function(e) {
					showShutdownDialog();
				});
			}
			
			if (showLocales) {
				$('#navMenu')
						.append(
						'<li class="navicon" id="langMenu" data-toggle="tooltip" title="' + getResource('text.selectLanguages') + '" data-placement="bottom" class="dropdown"><a class="dropdown-toggle" data-toggle="dropdown" href="#"><i class="fa fa-globe"></i></a></li>')
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

					getJSON('session/switchLanguage/' + $(this).attr('data-value'), null, function() {
						document.location.reload();
					});
				});
			}

			// Load current page
			$(contentDiv).append(
				'<div id="mainContainer" class="col-md-10 col-sm-11 main"><div id="informationBar" class="showOnComplete"/><div id="mainContent"/></div>');

			
			// Setup header actions
			$('#navMenu')
					.append(
						'<li class="navicon"><a id="actionLogoff" data-toggle="tooltip" title="' + getResource('text.signOut') + '" data-placement="bottom" href="#"><i class="fa fa-sign-out"></i></a></li>');

			$('#actionLogoff').click(function(e) {
				e.preventDefault();
				logoff();
			});

			
			var loadThisMenu = getAnchorByName("menu");
			if(loadThisMenu !== '') {
				currentMenu = allMenus[loadThisMenu];;
			}
			
			if(!currentMenu) {
				currentMenu = homeMenu;
			}

			$('#' + currentMenu.id).addClass('active');

			if(window.location.hash && window.location.hash.indexOf('menu=' + currentMenu.resourceKey) > -1) {
				/**
				 * We are loading a URL that already has the #menu=<resourceKey> we are after so simply load menu
				 */
				loadMenu(currentMenu);
			} else {
				/**
				 * Anchor is different so change it and let the default handler load the menu
				 */
				window.location.hash = 'menu=' + currentMenu.resourceKey;
			}
			
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
			
		});

		var checkTimeout = function() {
			
			log("Checking session timeout");
			
			getJSON('session/peek', null, function(data) {
				if(data.success) {
					setTimeout(checkTimeout, 30000);
				}
			}, function() {
				return false;
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
					'<button class="btn btn-small btn-primary" id="buttonShutdown" style="margin-bottom: 15px">' +
						'<i class="fa fa-power-off" style="font-size: 40px"></i>' +
					'</button>' +
					'</br>' +
					'<span>' + getResource("shutdown.label") + '</span>' +
				'</div>' +
				'<div class="col-xs-6" style="text-align: center">' +
					'<button class="btn btn-small btn-primary" id="buttonRestart" style="margin-bottom: 15px">' +
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

	$('#buttonShutdown').click(function(e) {
		e.preventDefault();
		shutdown('shutdown');
	});
	$('#buttonRestart').click(function(e) {
		e.preventDefault();
		shutdown('restart');
	});

	if(option) {
		shutdown(option, logoff);
	}
}

function shutdown(option, autoLogoff){
	getJSON('server/' + option + '/5', null, function(data) {
		
		if(data.success) {
			doShutdown(option, autoLogoff);
		} else {
			showError(data.error);
		}
	});
}

function doShutdown(option, autoLogoff, url) {
	
		$('#shutdownServer').find('.modal-body').empty();
		$('#shutdownServer').find('.modal-body').append(
				'<p style="width: 100%; text-align: center;">' + getResource("power.wait.shutdown") + '</p>' +
				'<i class="fa fa-spinner fa-spin" style="font-size: 40px; width: 100%; text-align: center"></i>');
		
		hasShutdown = true;
		var serverRunning = true;
		var hasStopped = false;
		var restarted = false;
			
		var timer = setTimeout(function() {
			doAjax({
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
								if(url) {
									window.location = url;
								} else {
									location.reload();
								}
							}, 2000);
						}					
					}
				}, 2000);
			}
		}, 1000);

}

function loadRealms(realms, session) {
	
	var func = function(realm) {
		getJSON('session/switchRealm/' + realm, null,
			function(data) {
				if (!data.success) {
					showError(data.errorMsg);
				} else { 
					document.location.hash = 'menu=' + getAnchorByName('menu');
					document.location.reload();
				}
			});
	};
	
	if(session.impersonating || (!realms && session.principalRealm.id === currentRealm.id)) {
		$('#currentRealm').remove();
		return;
	}

	if(!$('#currentRealm').length) {
		$('#main-menu-toggle').parent().after('<li id="currentRealm" class="navicon" data-toggle="tooltip" title="' 
				+ getResource('text.userRealms') 
				+ '" data-placement="bottom"class="dropdown"></li>');
	}
	
	$('#currentRealm').empty();
	$('#currentRealm').append('<a class="dropdown" data-toggle="dropdown" href="#"><i class="fa fa-database"></i></a>');
	$('#currentRealm').append('<ul id="realm" class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1"></ul>');
	
	if(session.principalRealm.id != currentRealm.id) {
			$('#realm').append(
				'<li role="presentation"><a class="realmSelect" href="#" role="menuitem" tabindex="-1" data-value="' + session.principalRealm.id + '">' + getResource("switchRealm.back").format(session.principalRealm.name) + '</a></li>');
	}

	if(realms) {
		$('#realm').append(
				'<li role="presentation"><a id="manageRealms" href="#menu=realms" role="menuitem" tabindex="-1">' + getResource('text.manageRealms') + '</a></li>');
	
		$('#manageRealms').click(function(e) {
			$('.active').removeClass('active');
			$('#currentRealm i').addClass('active');
		});
	}
	
	$('.realmSelect').on(
		'click', function(evt) {
			evt.preventDefault();
			func($(this).attr('data-value'));
		}
	);

}

function loadRoles(roles) {

	$('#currentRole').remove();
	
	var deletedCurrentRole = true;
	$.each(roles, function() {
		if (currentRole.id === this.id) {
			deletedCurrentRole = false;
		}
	});

	if (deletedCurrentRole) {
		currentRole = roles[0];
	}
	
	var func = function(role) {
		getJSON('session/switchRole/' + role, null,
			function(data) {
				if (!data.success) {
					showError(data.errorMsg);
				} else {
					
					document.location.reload();
				}
			});
	};
	
	if(roles.length > 1) {
		$('#main-menu-toggle').parent().after('<li id="currentRole" class="navicon" class="dropdown"><a class="dropdown" data-toggle="dropdown" href="#"><i class="fa fa-user-md"></i></a></li>');

		$('#currentRole').append('<ul id="roles" class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu2"></ul>');
		$.each(roles, function() {
			$('#roles').append(
				'<li role="presentation"><a class="roleSelect" href="#" role="menuitem" tabindex="-1" data-value="' + this.id + '">' + this.name + '</a></li>');
		});
	
		$('.roleSelect').on(
			'click', function(evt) {
				evt.preventDefault();
				func($(this).attr('data-value'));
			}
		);
	}
	
	if (deletedCurrentRole) {
		func(currentRole.id);
	}
}

function reloadRealms() {
	getJSON(basePath + "/api/realms/list", null, function(data) {
		loadRealms(data.resources, $(document).data('session'));
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
	$('#mainContainer').stopSpin();
    $('[data-toggle="tooltip"]').tooltip(); 
}

function loadWait() {

	if($('#mainContent').data('pageChange')) {
		try {
			$('#mainContent').data('pageChange')();
		}
		catch(e) {
			console.log('ERROR: Page change handler failed.' + e);
		}
		$('#mainContent').data('pageChange', null);
	}
	
	setTimeout(function() {
		if ($('#mainContent').data('loadComplete')) {
			log("Page has loaded");
			fadeMessage();
		} else {
			loadWait();
		}
	}, 100);
}

function loadMenu(menu) {

	if(!menu) {
		return;
	}
	log("Loading menu " + menu.resourceKey);
	
	if (currentMenu) {
		$('.active').removeClass('active');
	}

	var isPageMenu = menu.parent && menu.parent.resourceKey === 'pages';
	
	var subPage = null;
	if(!menu.page) {
		if(menu.section) {
			subPage = menu.resourceKey;
			menu = menu.parent;
		} 
		else if(menu.menus.length > 0) {
//			$.each(menu.menus, function(idx, obj) {
//				if(!obj.hidden) {
//					subPage = obj.resourceKey;
//					return true;
//				}
//				return false;
//			});
			subPage = menu.menus[0].resourceKey;
		}
	}
	
	currentMenu = menu;

	
	if(currentMenu.id === 'realms') {
		$('#currentRealm i').addClass('active');
	} else if(currentMenu.hidden) {
		$('#' + currentMenu.id + " i").addClass('active');
	} else {
		$('#' + currentMenu.id).addClass('active');
	}
	
	$('#mainContainer').startSpin();
	$('#informationBar').empty();
	$('#mainContent').empty();
	
	$('div[role="dialog"]').remove();
	$('#mainContent').data('loadComplete', false);

	if(!menu.page && menu.menus.length > 0) {

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
						'<div class="col-xs-2 hidden-xs hidden-sm subMenuLarge">'
					+	'	<a class="large-button subMenu" href="#menu=' + this.resourceKey + '" data-value="' + this.resourceKey + '" id="buttonLarge_' + this.resourceKey + '">'
					+	'		<i class="fa ' + this.icon + '"></i><p class="hidden-sm hidden-xs">' + getResource(this.resourceKey + '.title') + '</p>'
					+	'	</a>'
					+	'</div>'
					+	'<div class="col-xs-2 visible-xs visible-sm" style="padding-bottom: 10px">'
					+	'	<a class="small-button subMenuSmall" href="#menu=' + this.resourceKey + '" data-value="' + this.resourceKey + '" id="buttonSmall_' + this.resourceKey + '">'
					+	'		<i class="fa ' + this.icon + '"></i>'
					+	'	</a>'
					+ 	'</div>');
			}
		});
	
		for(var i=0;i<menu.menus.length;i++) {
			$('#subMenuIconPanel').append('<div class="col-xs-2"></div>');
			$(document).data(menu.menus[i].resourceKey, menu.menus[i]);
		}
		

		loadSubPage(allMenus[subPage], $('#buttonLarge_' + subPage));
		
		if ($(window).width() < 959) {
			$('#main-menu').addClass('hidden-xs');
		}
		
	} else {
	
		loadWait();
		
		if(menu.parent && menu.parent.resourceKey === 'pages') {
			
			if(!$('#pageContent').length) {
				$('#mainContainer').append('<div id="pageContent"></div>');
			}
			$('#pageContent').load(uiPath + '/content/' + menu.resourceName + '.html');

			$('#mainContainer').removeClass('col-md-10');
			$('#mainContainer').addClass('col-md-12');
			$('#mainContainer').removeClass('col-sm-11');
			$('#mainContainer').addClass('col-sm-12');
			$('#main-menu').hide();
			$('#mainContent').hide();

			$('#pageContent').show(); 
		} else {
			$('#pageContent').remove();
			$('#main-menu').show();
			$('#mainContent').load(uiPath + '/content/' + menu.resourceName + '.html');
			$('#mainContent').show();
		}
	}
}

function loadSubPage(menu, element) {
	$('#subMenuIconPanel').find('.large-button-active').removeClass('large-button-active');
	$('#subMenuIconPanel').find('.small-button-active').removeClass('small-button-active');
	if(element.data() && element.data().value) {
		element.parent().parent().find('.large-button[id="buttonLarge_' + element.data().value + '"]').addClass('large-button-active');
		element.parent().parent().find('.small-button[id="buttonSmall_' + element.data().value + '"]').addClass('small-button-active');
	}
	$('#subMenuPageContent').startSpin();
	loadWait();
	currentMenu = menu;
	$('#menuContent').load(uiPath + '/content/' + menu.resourceName + '.html', function() {
		if ($(window).width() < 959) {
			$('#main-menu').addClass('hidden-xs');
		}
	});
}

