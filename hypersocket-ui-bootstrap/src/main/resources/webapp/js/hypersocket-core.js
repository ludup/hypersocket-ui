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

$.ajaxPrefilter(function( options, originalOptions, _jqXHR ) {
	/* This prevents caching of the following resources when they are loaded as the
	 * result of Ajax. Being as this also includes actual content, such as Javascript
	 * or CSS that we sometimes dynamically load, we need to turn off the cache defeat
	 * parameters that jquery adds, because we DONT want to defect the cache!
	 */
	  if ( options.dataType == 'script' || originalOptions.dataType == 'script' ||  
		   options.dataType == 'link' || originalOptions.dataType == 'link' ||
		   ( options.dataType == 'json' && options.url && options.url.indexOf('/api/enum') != -1) ||
		   ( options.dataType == 'json' && options.url && options.url.indexOf('/api/i18n') != -1) ) {
	      options.cache = true;
	
	  }
	  
	});

window.onhashchange = function() {  
	if($('#pageContent').length > 0) {
		$('#pageContent').remove();
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

function toggleMenu() {
	var on = $('#main-menu').is(':visible');
	if(on) {
		$('#main-menu').fadeOut(500);
	} else {
		$('#main-menu').fadeIn(500);
	}
};

function closeMenu() {
	if ($("#menuPin").hasClass("pin-active")) {
		return;
	}
	var on = $('#main-menu').is(':visible');
	if(on) {
		$('#main-menu').fadeOut(500);
	}
};

function setUpMenuMakePinned() {
	let pinContainer = $("#menuPin");
	let menu = $("#main-menu");
	let container = $("#container");
	let viewContainer = $("#mainContainer");
	let content = $("#content");
	let icon = $("#pin-menu-icon");
	let burger = $("#burger-toggle");
	let pinIconContainer = $("#menuPin span");
	
	pinContainer.addClass("pin-active");
	
	burger.css("display", "none");
	
	pinIconContainer.attr("title", "Click to unpin menu.");
	
	pinIconContainer.css("color", "rgba(0,0,0,1)");
	
	icon.addClass("fa-rotate-90");

	menu.removeClass("sidebar-static-width");
	
	menu.removeClass("col-sm-4");
	menu.removeClass("col-md-3");
	menu.removeClass("col-lg-2");

	menu.addClass("col-sm-4");
	menu.addClass("col-md-3");
	menu.addClass("col-lg-2");
	
	menu.css("display", "block");
	
	viewContainer.removeClass("col-md-12");
	viewContainer.removeClass("col-sm-12");

	viewContainer.removeClass("col-sm-8");
	viewContainer.removeClass("col-md-9");
	viewContainer.removeClass("col-lg-10");

	menu.css("position", "static");
	menu.css("height", "100%");

	menu.css("padding-right", "0px");
	menu.css("padding-left", "0px");

	content.css("margin-left", "0px");
	content.removeClass("row");
	
	content.removeClass("col-sm-8");
	content.removeClass("col-md-9");
	content.removeClass("col-lg-10");
	
	content.addClass("col-sm-8");
	content.addClass("col-md-9");
	content.addClass("col-lg-10");
	
	container.removeClass("row");
	container.addClass("row");
	
	saveMenuPinState(true);
	
}

function setUpMenuRemovePinned() {
	let pinContainer = $("#menuPin");
	let menu = $("#main-menu");
	let container = $("#container");
	let viewContainer = $("#mainContainer");
	let content = $("#content");
	let icon = $("#pin-menu-icon");
	let burger = $("#burger-toggle");
	let pinIconContainer = $("#menuPin span");
	
	pinContainer.removeClass("pin-active");
	
	burger.css("display", "inline");
	
	pinIconContainer.attr("title", "Click to pin menu.")
	pinIconContainer.css("color", "rgba(0,0,0,0.5)");
	
	icon.removeClass("fa-rotate-90");

	menu.removeClass("col-sm-4");
	menu.removeClass("col-md-3");
	menu.removeClass("col-lg-2");

	viewContainer.removeClass("col-sm-8");
	viewContainer.removeClass("col-md-9");
	viewContainer.removeClass("col-lg-10");

	viewContainer.addClass("col-md-12");
	viewContainer.addClass("col-sm-12");

	menu.css("position", "absolute");
	menu.css("height", "inherit");

	content.css("margin-left", "-15px");
	content.addClass("row");
	
	content.removeClass("col-sm-8");
	content.removeClass("col-md-9");
	content.removeClass("col-lg-10");
	
	container.removeClass("row");

	menu.css("padding-right", "0px");
	menu.css("padding-left", "0px");

	menu.css("margin-left", "0px");

	menu.addClass("sidebar-static-width");	
	
	saveMenuPinState(false);
	
}

function saveMenuPinState(state) {
	getState('menuStates', 'true', function(prefs) {
		var menuStates = {};
		if(prefs.resources.length > 0) {
		   menuStates = JSON.parse(prefs.resources[0].preferences);
		}
		
		menuStates.pin = state;
		
		saveMenuState($(this).parent().data('menu'), menuStates, true);
	});
}

function setUpMenuPin(menuStates) {
	// next cycle
	setTimeout(() => {
		
		if (menuStates.pin) {
			setUpMenuMakePinned();
		}
		
		if (!$("#menuPin").hasClass("pin-toggle-installed")) {
			
			$(this).addClass("pin-toggle-installed");
			
			$("#menuPin").click(function(e) {
				e.preventDefault();
				e.stopPropagation();

				if ($(this).hasClass("pin-active")) {
					setUpMenuRemovePinned();	
				} else {
					setUpMenuMakePinned();
				}
			});
		}
	}, 0);
}

function startLogon(opts, credentials) {
	
	if(!opts) {
		opts = $(document).data('logonOptions');
	}

	$(document).click(function () {
	    $('.dropdown-menu[data-parent]').hide();
	    $('.dropdown.open').removeClass('open');
	    $('.dropdown-menu.show').removeClass('show');
	});
	
	$('#burger-toggle').hide();
	
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
							'<li role="presentation" class="dropdown-item"><a role="menuitem" tabindex="-1" href="#">' + getResource("en") + '</li>');

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
	logon(credentials, opts);
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
			$.each(data.resources, function(_idx, obj) {
				if(obj.badge!=null) {
					$('#' + obj.resourceKey).find('span').after('<span class="menuBadge badge' + (obj.cssClass ? ' ' + obj.cssClass : '') + '">' + obj.badge + '</span>');
				}
			});
		}
		if(schedule) {
			setTimeout(function() { checkBadges(true) }, 100000);
		}
	});
};

function saveMenuState(id, prefs, state) {

	if(!prefs[id]) {
		prefs[id] = {};
	}
	prefs[id].expanded = state;
	saveState('menuStates', prefs, true);
};

function home(data) {

	log("Entering home");

	// Menu
	$('#navMenu').empty();
	$('#nav').show();
	$('#informationBar').empty();
	$('#main-menu').remove();

	$(contentDiv).empty();
	$('#container').prepend('<div id="main-menu" class="sidebar sidebar-static-width" style="display: none"><div id="menuPin" class="hidden-xs hidden-sm"><span title="Click to pin menu" style="float: right;margin-right: 15px;margin-top: 18px;cursor: pointer;color: rgba(0,0,0,0.5);"><i id="pin-menu-icon" class="fa fa-map-pin fa-lg"></i></span></div><div id="menu" class="sidebar-collapse"></div></div>');
	
	
	$('#mainContainer').addClass('sidebar-active');
	
	removeMessage();
	
	currentRealm = data.session.currentRealm;
	currentRole = data.currentRole;
	currentMenu = null;
	homeMenu = null;
	var message = data.bannerMsg;
	var showLocales = data.showLocales;
	getJSON('menus', null, function(data) {

		getState('menuStates', 'true', function(prefs) {
			
			log("Received menus");

			var menuStates = {};
			if(prefs.resources.length > 0) {
			   menuStates = JSON.parse(prefs.resources[0].preferences);
			}
			
			log("Received menu state");
			
			setUpMenuPin(menuStates);
			
			menuList = data;
			
			$('#menu').empty();

			$.each(
				data.menus,
				function() {
					
					allMenus[this.resourceKey] = this;
					
					var expanded = menuStates[this.id] && menuStates[this.id].expanded;
					
					$('#menu')
							.append(
								'<div id="menu_' + this.id + '" class="nav-sidebar title" ' + (this.hidden ? 'style="display:none"' : '') + ' data-menu="' + this.id + '"'
								       + '><div class="menuitem"><a data-toggle="collapse" aria-expanded="false" aria-controls="cont_sub_' + this.id + '" href="#cont_sub_' 
								       + this.id + '"><i class="imenu fad ' + (expanded ? 'fa-chevron-down' : 'fa-chevron-right' ) + '"></i>&nbsp;<span>' + getResource(this.resourceKey + '.label') + '</span></a></div></div>');

					var root = this;

					var page = this.resourceKey === 'pages';
					
					if (this.menus.length > 0) {
						var menu = '#sub_' + this.id;
						$("#menu_" + this.id).append('<div class="collapse' + (expanded ? ' show' : '') + '" id="cont_sub_' + this.id + '">' + 
							'<ul id="sub_' + this.id + '" class="nav nav-sidebar flex-column"/>');
						
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
							
							$(menu).append('<li' + (this.hidden ? ' style="display:none"' : '') + ' class="nav-item"><a id="' 
									+ this.id + '" href="#menu=' + (firstChild ? firstChild.resourceKey : this.resourceKey) 
									+ '" class="sideMenu sidebar-anchor"><i class="fad ' 
									+ this.icon + '"></i><span class="text sidebar-text">' 
									+ getResource(this.resourceKey + '.label') + '</span></span></a></li>');
							$('#' + this.id).data('menu', this);
							$('#' + this.id).click(function() {
								if ($("#menuPin").hasClass("pin-active")) {
									return;
								}
								$(".sideMenu").removeClass("active");
								$(this).addClass("active");
								$(this).parents(".collapse").addClass('show');
								closeMenu();
							});

							if(currentMenu==null && this.home) {
								currentMenu = this;
								homeMenu = this;
							}
							
							$(menu).append("</div>");

						});
					} 
					
			});
						
			$('.collapse').on('show.bs.collapse', function(){
				$(this).parent().find(".fa-chevron-right").removeClass("fa-chevron-right").addClass("fa-chevron-down");
				saveMenuState($(this).parent().data('menu'), menuStates, true);
			}).on('hide.bs.collapse', function(){
				$(this).parent().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-right");
				saveMenuState($(this).parent().data('menu'), menuStates, false);
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

			var session = $(document).data('session');
			if(session.impersonating) {
				$('#navMenu').append(
					'<li class="navicon"><a id="impersonateMenu" data-toggle="tooltip" title="' + getResource('text.revertImpersonation') + '" data-placement="bottom" href="#"><i class="fad fa-male"></i></a></li>');
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

			$('#burger-toggle').show();
			$('#burger-toggle').off('click');
			$('#burger-toggle').click(function(e) {
				e.preventDefault();
				e.stopPropagation();
				toggleMenu();
			});

			if(allMenus['navigation']) {

				$.each(allMenus['navigation'].menus, function(_idx, obj) {
					
					if(obj.resourceKey === 'realms') {
						loadRealms(data.realms, data.session ? data.session : $(document).data('session'));
						return;
					}
					
					$('#navMenu').append('<li class="navicon" id="' + this.id 
							+ '"><a '
							+ ' href="#menu=' + (this.menus.length > 0 ? this.menus[0].resourceKey : this.resourceKey) + '"><span data-toggle="tooltip" data-placement="bottom" title="' +  getResource(this.resourceKey + '.label') + '"><i class="fad ' + this.icon + '"></i></span></a></li>');
					
					$('#' + this.id).data('menu', this);
					$('#' + this.id).click(function(e) {
						e.stopPropagation();
						$(".active").removeClass("active");
						$(this).find('i').addClass("active");
					});
				});
			}
			
			systemAdmin = data.systemAdmin;
			
			if(data.systemAdmin) {
				
				$('#bottomMenu').empty();
				
				$('#bottomMenu').append('<li class="navicon" id="powerMenu" class="dropdown"><a data-toggle="tooltip" title="' + getResource('text.powerOptions') + '" data-placement="top" href="#"><i class="fad fa-power-off"></i></a></li>');
				
				$('#powerMenu').click(function() {
					showShutdownDialog();
				});
			}
			
			if (showLocales) {
				$('#navMenu')
						.append(
						'<li class="navicon" id="langMenu" class="dropdown"><a class="dropdown-toggle" data-toggle="dropdown" href="#"><span data-toggle="tooltip" data-placement="bottom" title="' +  getResource('text.selectLanguages') + '"><i class="fad fa-globe"></i></span></a></li>')
				$('#langMenu')
						.append(
							'<ul id="lang" class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1"></ul>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="en" href="#">' + getResource("en") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="da" href="#">' + getResource("da") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="nl" href="#">' + getResource("nl") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="fi" href="#">' + getResource("fi") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="fr" href="#">' + getResource("fr") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="de" href="#">' + getResource("de") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="it" href="#">' + getResource("it") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="no" href="#">' + getResource("no") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="pl" href="#">' + getResource("pl") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="ru" href="#">' + getResource("ru") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="sv" href="#">' + getResource("sv") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="es" href="#">' + getResource("es") + '</li>');
				$('#lang')
						.append(
							'<li role="presentation" class="dropdown-item"><a class="langSelect" role="menuitem" tabindex="-1" data-value="ja" href="#">' + getResource("ja") + '</li>');
			
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
				'<div id="mainContainer" class="col-md-12 col-sm-12 main sidebar-active"><div id="informationBar" class="showOnComplete"></div><div id="mainContent"></div></div>');

			
			// Setup header actions
			$('#navMenu')
					.append(
						'<li class="navicon"><a id="actionLogoff" data-toggle="tooltip" title="' + getResource('text.signOut') + '" data-placement="bottom" href="#"><i class="fad fa-sign-out"></i></a></li>');

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
			
			$('#content').click(function() {
				closeMenu();
			});
			
	       });
			
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
			'<div class="modal-header lb-modal-header-text-reverse">' +
				'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
				'<h4 class="modal-title" id="myModalLabel">' + getResource('power.shutdownServer') + '</h4>' +
			'</div>' +
			'<div class="modal-body row">' +
				'<div class="col-6" style="text-align: center">' +
					'<button class="btn btn-small btn-primary" id="buttonShutdown" style="margin-bottom: 15px">' +
						'<i class="fad fa-power-off" style="font-size: 40px"></i>' +
					'</button>' +
					'</br>' +
					'<span>' + getResource("shutdown.label") + '</span>' +
				'</div>' +
				'<div class="col-6" style="text-align: center">' +
					'<button class="btn btn-small btn-primary" id="buttonRestart" style="margin-bottom: 15px">' +
						'<i class="fad fa-repeat" style="font-size: 40px"></i>' +
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
				'<i class="fad fa-spinner fa-spin" style="font-size: 40px; width: 100%; text-align: center"></i>');
		
		hasShutdown = true;
		var serverRunning = true;
		var hasStopped = false;
		var restarted = false;
			
		setTimeout(function() {
			doAjax({
				url: basePath + '/api/server/ping',
				dataType: 'json',
				success: function(){
					if(!serverRunning){
						hasShutdown = false;
						restarted = true;
					}
				},
				error: function() {
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
				setTimeout(arguments.callee, 1000);
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
		$('#navMenu').prepend('<li id="currentRealm" class="navicon" class="dropdown"></li>');

	}
	
	$('#currentRealm').empty();
	$('#currentRealm').append('<a class="dropdown" data-toggle="dropdown" href="#"><span data-toggle="tooltip" title="' + getResource('text.userRealms')  + '" data-placement="bottom"><i class="fad fa-database"></i></span></a>');
	$('#currentRealm').append('<ul id="realm" class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1"></ul>');
	
	if ($("#currentRealm > a").length === 1) {
		$("#currentRealm > a").click(function() { $("#currentRealm").tooltip('hide'); });
	}
	
	if(session.principalRealm.id != currentRealm.id) {
			$('#realm').append(
				'<li role="presentation" class="dropdown-item"><a class="realmSelect" href="#" role="menuitem" tabindex="-1" data-value="' + session.principalRealm.id + '">' + getResource("switchRealm.back").format(session.principalRealm.name) + '</a></li>');
	}

	if(realms) {

		$('#realm').append(
				'<li role="presentation" class="dropdown-item"><a id="manageRealms" href="#menu=realms" role="menuitem" tabindex="-1">' + getResource('text.manageRealms') + '</a></li>');
		
		$('#realm').append('<li class="dropdown-divider"></li>');
		
		$.each(realms, function() {
			$('#realm').append(
				'<li role="presentation" class="dropdown-item"><a class="realmSelect" href="#" role="menuitem" tabindex="-1" data-value="' + this.id + '">' + this.name + '</a></li>');
		});
		$('#manageRealms').click(function() {
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
		$('#navMenu').prepend('<li id="currentRole" class="navicon" class="dropdown"><a class="dropdown" data-toggle="dropdown" href="#"><i class="fad fa-user-md"></i></a></li>');

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
		
		$('#mainContent').append('<div class="col-12" id="subMenuContent">'
				
					
						+ '<div id="subMenuIconPanel" style="margin-bottom: 20px;display: flex;justify-content: space-around;background-color:white;border: 1px solid #e1e6ef;padding: 15px 0px 0px 0px;"></div>'
					
				
			+ '</div>'
			+ '<div id="subMenuPageContent">'
				
					+ '<div class="col-12" id="menuContent"></div>'
				
			+ '</div>');
						
		$.each(menu.menus, function() {
			
			allMenus[this.resourceKey] = this;
			if(!this.hidden) {
				$('#subMenuIconPanel').append(
						'<div class="col-2 d-none d-lg-table-cell subMenuLarge">'
					+	'	<a class="large-button subMenu" href="#menu=' + this.resourceKey + '" data-parent="' + (menu.resourceKey ? menu.resourceKey : '') + '" data-value="' + this.resourceKey + '" id="buttonLarge_' + this.resourceKey + '">'
					+	'		<i class="fad fa-2x ' + this.icon + '"></i><p class="hidden-sm hidden-xs">' + getResource(this.resourceKey + '.title') + '</p>'
					+	'	</a>'
					+	'</div>'
					+	'<div class="col-2 d-md-table-cell d-lg-none d-xl-none" style="padding-bottom: 10px">'
					+	'	<a class="small-button subMenuSmall" href="#menu=' + this.resourceKey + '" data-value="' + this.resourceKey + '" id="buttonSmall_' + this.resourceKey + '">'
					+	'		<i class="fad fa-2x ' + this.icon + '"></i>'
					+	'	</a>'
					+ 	'</div>');
			}
		});
		
		for(var i=0;i<menu.menus.length;i++) {
			//$('#subMenuIconPanel').append('<div class="col-2"></div>');
			$(document).data(menu.menus[i].resourceKey, menu.menus[i]);
		}

		loadSubPage(allMenus[subPage], $('#buttonLarge_' + subPage));
	
		
	} else {
		loadWait();
		var pagePath = uiPath + '/content/' + menu.resourceName + '.html';
		if(menu.parent && menu.parent.resourceKey === 'pages') {
			
			if(!$('#pageContent').length) 
				$('#mainContainer').append('<div id="pageContent"></div>');

			$('#pageContent').load(pagePath, function(response, status, _xhr) {
				if(status == 'error') {
					$('#mainContainer').stopSpin();
					showError(response, false);
				}
			});
			$('#mainContent').hide();

			$('#pageContent').show(); 
		} else {
			$('#pageContent').remove();
			$('#mainContent').load(pagePath, function(response, status, _xhr) {
				if(status == 'error') {
					$('#mainContainer').stopSpin();
					showError(response, false);
				}
				
			});
			$('#mainContent').show();
		}
		
		closeMenu();
	}
}

function loadSubPage(menu, element) {
	$('#subMenuIconPanel').find('.large-button-active').removeClass('large-button-active');
	$('#subMenuIconPanel').find('.small-button-active').removeClass('small-button-active');
	if(element.data() && element.data().value) {
		element.parent().parent().find('.large-button[id="buttonLarge_' + element.data().value + '"]').addClass('large-button-active');
		element.parent().parent().find('.small-button[id="buttonSmall_' + element.data().value + '"]').addClass('small-button-active');
		var parent = element.parent().parent().find('.large-button[id="buttonLarge_' + element.data().value + '"]').data('parent');
		if(parent !== '')
			$('#' + parent).parents('.collapse').addClass('show');
	}
	$('#subMenuPageContent').startSpin();
	loadWait();
	currentMenu = menu;
	$('#menuContent').load(uiPath + '/content/' + menu.resourceName + '.html', function(response, status, _xhr) {
		closeMenu();
		$('#subMenuPageContent').stopSpin();
		if ( status == 'error' )
			showError(response, false);
	});
}

