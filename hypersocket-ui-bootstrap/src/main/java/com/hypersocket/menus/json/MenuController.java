/*******************************************************************************
 * Copyright (c) 2013 LogonBox Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.menus.json;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.hypersocket.auth.json.AuthenticatedController;
import com.hypersocket.auth.json.AuthenticationRequired;
import com.hypersocket.auth.json.AuthenticationRequiredButDontTouchSession;
import com.hypersocket.auth.json.UnauthorizedException;
import com.hypersocket.json.ResourceList;
import com.hypersocket.json.ResourceStatus;
import com.hypersocket.menus.AbstractTableAction;
import com.hypersocket.menus.Badge;
import com.hypersocket.menus.Menu;
import com.hypersocket.menus.MenuService;
import com.hypersocket.menus.Tab;
import com.hypersocket.permissions.AccessDeniedException;
import com.hypersocket.permissions.PermissionService;
import com.hypersocket.permissions.PermissionStrategy;
import com.hypersocket.permissions.SystemPermission;
import com.hypersocket.realm.RealmPermission;
import com.hypersocket.realm.RealmService;
import com.hypersocket.session.json.SessionTimeoutException;

@Controller
public class MenuController extends AuthenticatedController {

	static Logger log = LoggerFactory.getLogger(MenuController.class);
	
	@Autowired
	private MenuService menuService;

	@Autowired
	private PermissionService permissionService;

	@Autowired
	private RealmService realmService;

	@AuthenticationRequired
	@RequestMapping(value = "menus", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	public MenuList getModules(HttpServletRequest request,
			HttpServletResponse response) throws AccessDeniedException,
			UnauthorizedException, SessionTimeoutException {

		setupAuthenticatedContext(sessionUtils.getSession(request),
				sessionUtils.getLocale(request));
		try {
			return getModuleList(request, null);
		} finally {
			clearAuthenticatedContext();
		}
	}

	@AuthenticationRequired
	@RequestMapping(value = "menu/{resourceKey}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	public MenuList getScopedModules(HttpServletRequest request,
			HttpServletResponse response, @PathVariable String resourceKey) throws AccessDeniedException,
			UnauthorizedException, SessionTimeoutException {

		setupAuthenticatedContext(sessionUtils.getSession(request),
				sessionUtils.getLocale(request));
		try {
			return getModuleList(request, resourceKey);
		} finally {
			clearAuthenticatedContext();
		}
	}
	
	@AuthenticationRequired
	@RequestMapping(value = "menus/{resourceKey}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	public ResourceStatus<Menu> getModules(HttpServletRequest request,
			HttpServletResponse response, @PathVariable String resourceKey) throws AccessDeniedException,
			UnauthorizedException, SessionTimeoutException {

		setupAuthenticatedContext(sessionUtils.getSession(request),
				sessionUtils.getLocale(request));
		try {
			return new ResourceStatus<Menu>(menuService.getMenu(resourceKey));
		} finally {
			clearAuthenticatedContext();
		}
	}

	private MenuList getModuleList(HttpServletRequest request, String resourceKey)
			throws UnauthorizedException, AccessDeniedException,
			SessionTimeoutException {

		setupAuthenticatedContext(sessionUtils.getSession(request),
				sessionUtils.getLocale(request));
		try {

			MenuList list = new MenuList(menuService.getMenus(resourceKey));
			
			if (permissionService.hasSystemPermission(sessionUtils
					.getPrincipal(request))) {
				list.setSystemAdmin(true);
			}
			
			if (permissionService.hasAdministrativePermission(sessionUtils
					.getPrincipal(request))) {
				list.setRealmAdmin(true);
			}

			try {
				permissionService.verifyPermission(
						sessionUtils.getPrincipal(request),
						PermissionStrategy.EXCLUDE_IMPLIED, 
						RealmPermission.READ, 
						SystemPermission.SWITCH_REALM);
				list.setRealms(realmService.getPublicRealmsByParent(getCurrentRealm()));
				list.getRealms().add(getCurrentRealm());
			} catch (AccessDeniedException e) {
			}

			return list;
		} catch(Throwable e) { 
			log.error("Menu error", e);
			throw e;
		} finally {
			clearAuthenticatedContext();
		}
	}

	@AuthenticationRequired
	@RequestMapping(value = "menus/tableActions/{table}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	public ResourceList<AbstractTableAction> getTableActions(
			HttpServletRequest request, HttpServletResponse respone,
			@PathVariable String table) throws UnauthorizedException,
			SessionTimeoutException {

		setupAuthenticatedContext(sessionUtils.getSession(request),
				sessionUtils.getLocale(request));

		try {
			return new ResourceList<AbstractTableAction>(
					menuService.getTableActions(table));
		} finally {
			clearAuthenticatedContext();
		}
	}
	
	@AuthenticationRequiredButDontTouchSession
	@RequestMapping(value = "menus/badges", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	public ResourceList<Badge> getBadges(
			HttpServletRequest request, HttpServletResponse respone) throws UnauthorizedException,
			SessionTimeoutException {

		setupAuthenticatedContext(sessionUtils.getSession(request),
				sessionUtils.getLocale(request));

		try {
			return new ResourceList<Badge>(
					menuService.getCurrentBadges());
		} finally {
			clearAuthenticatedContext();
		}
	}

	@AuthenticationRequired
	@RequestMapping(value = "menus/extendedResourceInfo/{tab}", method = RequestMethod.GET,
			produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	public ResourceList<Tab> getTabRegistration(
			HttpServletRequest request, HttpServletResponse respone,
			@PathVariable String tab) throws UnauthorizedException,
			SessionTimeoutException {

		setupAuthenticatedContext(sessionUtils.getSession(request),
				sessionUtils.getLocale(request));

		try {
			return new ResourceList<Tab>(
					menuService.getExtendedInformationTab(tab));
		} finally {
			clearAuthenticatedContext();
		}
	}
}
