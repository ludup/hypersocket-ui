/*******************************************************************************
 * Copyright (c) 2013 LogonBox Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.menus;

import java.util.Collection;
import java.util.List;

import com.hypersocket.auth.AuthenticatedService;

public interface MenuService extends AuthenticatedService {

	final static String RESOURCE_BUNDLE = "MenuService";
	
	static final String MENU_NAV = "navigation";
	
	static final String MENU_PAGES = "pages";
	
	static final String MENU_DASHBOARD = "dashboard";
	
	static final String MENU_USERDASH = "userdash";
	
	static final String MENU_DASHBOARD_SETTINGS = "dashboardSettings";
	
	static final String MENU_OVERVIEW = "overview";
	
	static final String MENU_PERSONAL = "personal";

	static final String MENU_MY_RESOURCES = "myResources";
	
	static final String MENU_MY_PROFILE = "profile";
	
	static final String MENU_MY_CREDENTIALS = "myCredentials";
	
	static final String MENU_USERS_DIRECTORY = "accessControl";
	
	static final String MENU_SECURITY_PERMISSIONS = "securityMenu";
	
	static final String MENU_SYSTEM = "system";
	
	static final String MENU_SYSTEM_CONFIGURATION = "server";
	
	static final String MENU_CONFIGURATION = "configuration";
	
	static final String MENU_NETWORKING = "networkingMenu";
	
	static final String MENU_RESOURCES = "resources";

	static final String MENU_BUSINESS_RULES = "businessRules";
	
	static final String MENU_REPORTING = "reporting";
	
	static final String ACTIONS_CERTIFICATES = "certificateActions";
	
	static final String ACTIONS_USERS = "userActions";
	
	static final String ACTIONS_GROUPS = "groupActions";

	static final String ACTIONS_REALMS = "realmActions";
	
	static final String TOOLBAR_USERS = "usersToolbar";
	
	static final String TOOLBAR_GROUPS = "groupsToolbar";

	static final String MENU_TOOLS = "tools";
	
	static final String MENU_DIAGNOSTICS = "diagnostics";
	
	static final String MENU_JOBS_STATUS = "jobs";

	static final String MENU_REALM_CONFIGURATION = "realmSettings";

	static final String MENU_CERTIFICATES = "certificates";

	static final String MENU_SCHEDULERS = "schedulers";

	static final String MENU_REALMS = "realms";

	static final String MENU_PARENT_REALM = "parentRealm";

	static final String MENU_MY_DETAILS = "details";

	static final String MENU_EXTENSIONS = "extensions";

	static final String MENU_EXTENSIONS_OPTIONS = "extensionOptions";

	static final String MENU_EXTENSIONS_STORE = "extensionStore";

	static final String MENU_LICENSES = "licenses";
	
	static final String MENU_DASHBOARD_HELPZONE = "helpzone"; 
	
	
	List<Menu> getMenus();

	List<Menu> getMenus(String parent);

	boolean registerMenu(MenuRegistration module);

	boolean registerMenu(MenuRegistration module, String parentModule);

	void registerTableAction(String table, AbstractTableAction action);

	List<AbstractTableAction> getTableActions(String table);

	void registerFilter(MenuFilter filter);

	Menu getMenu(String resourceKey);

	Collection<Badge> getCurrentBadges();

	void registerBadgeProvider(BadgeProvider provider);

	void registerExtendedInformationTab(String tab, TabRegistration tabRegistration);

	List<Tab> getExtendedInformationTab(String tab);

}
