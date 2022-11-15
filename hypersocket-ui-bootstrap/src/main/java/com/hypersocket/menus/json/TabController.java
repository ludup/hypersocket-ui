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
import com.hypersocket.auth.json.UnauthorizedException;
import com.hypersocket.context.AuthenticatedContext;
import com.hypersocket.json.ResourceList;
import com.hypersocket.json.ResourceStatus;
import com.hypersocket.menus.MenuService;
import com.hypersocket.menus.TabAction;
import com.hypersocket.permissions.AccessDeniedException;
import com.hypersocket.profile.Profile;
import com.hypersocket.realm.Principal;
import com.hypersocket.realm.RealmService;
import com.hypersocket.resource.ResourceNotFoundException;
import com.hypersocket.session.json.SessionTimeoutException;

@Controller
public class TabController extends AuthenticatedController {

	static Logger log = LoggerFactory.getLogger(TabController.class);
	
	@Autowired
	private MenuService menuService;

	@Autowired
	private RealmService realmService;
	
	@AuthenticationRequired
	@RequestMapping(value = "tabs/tabActions/{tab}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceList<TabAction> getTabActions(
			HttpServletRequest request, HttpServletResponse respone,
			@PathVariable String tab) throws UnauthorizedException,
			SessionTimeoutException {

		return new ResourceList<TabAction>(
				menuService.getTabActions(tab));
	}

	@AuthenticationRequired
	@RequestMapping(value = "tabs/{tab}/userProfile/{id}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceStatus<Profile> getUserProfile(HttpServletRequest request, 
			HttpServletResponse response, @PathVariable String tab,
			@PathVariable Long id)
			throws AccessDeniedException, UnauthorizedException,
			ResourceNotFoundException, SessionTimeoutException {
		try {
			Principal principal = realmService.getPrincipalById(id);
			if(principal ==null)
				throw new IllegalStateException("Invalid principal");
			
			return new ResourceStatus<>(menuService.getProfileForUserWithIcons(tab,principal));
		} catch(Throwable t) { 
			return new ResourceStatus<>(false, t.getMessage());
		}
	}
}
