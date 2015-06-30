/*******************************************************************************
 * Copyright (c) 2013 Hypersocket Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.menus;

import java.util.List;

import com.hypersocket.auth.AuthenticatedService;

public interface MenuService extends AuthenticatedService {

	final static String RESOURCE_BUNDLE = "MenuService";
	
	static final String MENU_DASHBOARD = "dashboard";
	
	static final String MENU_PERSONAL = "personal";

	static final String MENU_MY_RESOURCES = "myResources";
	static final String MENU_MY_PROFILE = "profile";
	
	static final String MENU_ACCESS_CONTROL = "accessControl";
	
	static final String MENU_SYSTEM = "system";
	
	static final String MENU_SYSTEM_CONFIGURATION = "server";
	
	static final String MENU_CONFIGURATION = "configuration";
	
	static final String MENU_RESOURCES = "resources";

	static final String MENU_BUSINESS_RULES = "businessRules";
	
	static final String MENU_REPORTING = "reporting";
	
	static final String ACTIONS_CERTIFICATES = "certificateActions";
	
	static final String ACTIONS_USERS = "userActions";

	static final String ACTIONS_REALMS = "realmActions";

	static final String MENU_TOOLS = "tools";
	
	static final String MENU_DIAGNOSTICS = "diagnostics";
	
	static final String MENU_JOBS_STATUS = "jobs"; 
	
	List<Menu> getMenus();

	boolean registerMenu(MenuRegistration module);

	boolean registerMenu(MenuRegistration module, String parentModule);

	void registerExtendableTable(String extendableTable);

	void registerTableAction(String table, AbstractTableAction action);

	List<AbstractTableAction> getTableActions(String table);

	void registerFilter(MenuFilter filter);
}
