/*******************************************************************************
 * Copyright (c) 2013 LogonBox Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.menus;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hypersocket.ApplicationContextServiceImpl;
import com.hypersocket.attributes.role.RoleAttributePermission;
import com.hypersocket.attributes.user.UserAttributePermission;
import com.hypersocket.auth.AbstractAuthenticatedServiceImpl;
import com.hypersocket.browser.BrowserLaunchableService;
import com.hypersocket.certificates.CertificateResourcePermission;
import com.hypersocket.config.ConfigurationService;
import com.hypersocket.dashboard.OverviewWidgetService;
import com.hypersocket.delegation.UserDelegationResourcePermission;
import com.hypersocket.dictionary.DictionaryResourcePermission;
import com.hypersocket.email.EmailNotificationService;
import com.hypersocket.html.HtmlTemplateResourcePermission;
import com.hypersocket.i18n.I18NService;
import com.hypersocket.interfaceState.UserInterfaceState;
import com.hypersocket.interfaceState.UserInterfaceStateService;
import com.hypersocket.message.MessageResourcePermission;
import com.hypersocket.message.MessageResourceService;
import com.hypersocket.password.policy.PasswordPolicyResourcePermission;
import com.hypersocket.permissions.AccessDeniedException;
import com.hypersocket.permissions.PermissionStrategy;
import com.hypersocket.permissions.PermissionType;
import com.hypersocket.permissions.SystemPermission;
import com.hypersocket.realm.GroupPermission;
import com.hypersocket.realm.PasswordPermission;
import com.hypersocket.realm.ProfilePermission;
import com.hypersocket.realm.RealmPermission;
import com.hypersocket.realm.RealmService;
import com.hypersocket.realm.RolePermission;
import com.hypersocket.realm.UserPermission;
import com.hypersocket.server.HypersocketServer;
import com.hypersocket.session.SessionPermission;
import com.hypersocket.ui.IndexPageFilter;

@Service
public class MenuServiceImpl extends AbstractAuthenticatedServiceImpl implements MenuService {

	static Logger log = LoggerFactory.getLogger(MenuServiceImpl.class);

	@Autowired
	private I18NService i18nService;

	@Autowired
	private RealmService realmService;

	@Autowired
	private BrowserLaunchableService browserService;

	@Autowired
	private HypersocketServer server;

	@Autowired
	private IndexPageFilter indexFilter;

	@Autowired
	private MessageResourceService messageService;


	@Autowired
	private ConfigurationService configurationService; 
	
	@Autowired
	private UserInterfaceStateService interfaceStateService; 
	
	@Autowired
	private OverviewWidgetService widgetService; 

	private Map<String, MenuRegistration> rootMenus = new HashMap<String, MenuRegistration>();
	private Map<String, List<MenuRegistration>> pendingMenus = new HashMap<String, List<MenuRegistration>>();
	private Map<String, List<AbstractTableAction>> registeredActions = new HashMap<String, List<AbstractTableAction>>();
	private List<BadgeProvider> badgeProviders = new ArrayList<BadgeProvider>();
	private Map<String, List<TabRegistration>> extendedInformationTabs = new HashMap<>();
	private List<MenuFilter> filters = new ArrayList<MenuFilter>();
	private Map<String,MenuRegistration> allMenus = new HashMap<String,MenuRegistration>();

	@PostConstruct
	private void postConstruct() {

		i18nService.registerBundle(MenuService.RESOURCE_BUNDLE);

		server.addAlias("${basePath}/recover", "redirect:${basePath}/recover/");
		server.addAlias("${basePath}/recover/", "${uiPath}/recover-index.html");

		indexFilter.addPage("recover-index.html");

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_NAV, "", null, 0, null, null, null, null));
		
		registerMenu(new HiddenMenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_PAGES, "", null, 0, null, null, null, null));

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MenuService.MENU_DASHBOARD, "fa-pie-chart", null, 0, null,
				null, null, null) {
			@Override
			public boolean canRead() {
				return permissionService.hasAdministrativePermission(getCurrentPrincipal());
			}
		}, MenuService.MENU_NAV);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MenuService.MENU_USERDASH, "fa-pie-chart", null, 0, null,
				null, null, null) {
			@Override
			public boolean canRead() {
				return !permissionService.hasAdministrativePermission(getCurrentPrincipal());
			}
		}, MenuService.MENU_NAV);
		

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MenuService.MENU_DASHBOARD_SETTINGS, "fa-gear",
				"dashboardSettings", 200, null, null, null, null) {
			@Override
			public boolean canRead() {
				return permissionService.hasAdministrativePermission(getCurrentPrincipal());
			}
		}, MenuService.MENU_DASHBOARD);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MENU_DASHBOARD_HELPZONE,
				"fa-question-circle", "helpzone", Integer.MIN_VALUE,
				SessionPermission.READ, null, null, null,
				null) {
					@Override
					public boolean canRead() {
						UserInterfaceState state = interfaceStateService.getStateByName("showHelpZone", getCurrentRealm());
						if(state==null) {
							return widgetService.hasActiveWidgets("helpzone");
						}
						return Boolean.valueOf(state.getPreferences()) && widgetService.hasActiveWidgets("helpzone");
					}
					@Override
					public boolean isHome() {
						return canRead();
					}
			
		}, MenuService.MENU_DASHBOARD);
		
		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_PERSONAL, "", null, 100, null, null, null, null) {
			@Override
			public boolean canRead() {
				return getCurrentPrincipal().getRealm().equals(getCurrentRealm());
			}
		});

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "sessionMenu",
				"fa-hourglass-start", null, 99999,
				null, null, null, null,
				null), MenuService.MENU_SYSTEM);
		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "sessions",
				"fa-hourglass-start", "sessions", 0,
				SessionPermission.READ, null, null, SessionPermission.DELETE,
				null), "sessionMenu");
		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "sessionSettings",
				"fa-gear", "sessionSettings", 100,
				null, null, null, null,
				null) {

					@Override
					public boolean canRead() {
						return permissionService.hasAdministrativePermission(getCurrentPrincipal());
					}
			
		}, "sessionMenu");

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "jobs",
				"fa-tasks", "jobs", 999988,
				SystemPermission.SYSTEM, null, null, SystemPermission.SYSTEM,
				null), MenuService.MENU_SYSTEM_CONFIGURATION);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_MY_PROFILE, "fa-tags", null, 0, null, null,
				null, null), MenuService.MENU_PERSONAL);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_MY_CREDENTIALS, "fa-id-card-o", null, 50, null, null,
				null, null), MenuService.MENU_PERSONAL);
		
		
//		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "userhelpzone",
//				"fa-question-circle", "userhelpzone", 100, ProfilePermission.READ, null,
//				ProfilePermission.UPDATE, null) {
//			@Override
//			public boolean isHome() {
//				return true; // If this is overridden it must be weighted lower than this
//			}
//			
//			@Override
//			public boolean canRead() {
//				try {
//					return realmService.getUserProfileTemplates(
//							getCurrentPrincipal()).size() > 0;
//				} catch (AccessDeniedException e) {
//					return false;
//				}
//			}
//		}, MenuService.MENU_MY_PROFILE);
		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "details",
				"fa-tags", "details", 200, ProfilePermission.READ, null,
				ProfilePermission.UPDATE, null) {
			@Override
			public boolean isHome() {
				return true; // If this is overridden it must be weighted lower than this
			}
			
			@Override
			public boolean canRead() {
				try {
					return realmService.getUserProfileTemplates(
							getCurrentPrincipal()).size() > 0;
				} catch (AccessDeniedException e) {
					return false;
				}
			}
		}, MenuService.MENU_MY_PROFILE);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_MY_RESOURCES, "fa-share-alt", null, 100, null,
				null, null, null) {
			@Override
			public boolean isHome() {
				return true; // If we have some resources make this home.
			}
			
			@Override
			public boolean canRead() {
				return !isHidden();
			}

			@Override
			public boolean isHidden() {
				if (getModules().size() == 0) {
					return true;
				}
				for (MenuRegistration m : getModules()) {
					if (!m.isHidden() && m.canRead()) {
						return false;
					}
				}
				return true;
			}
		}, MenuService.MENU_PERSONAL);

		registerMenu(new MenuRegistration( 
				RESOURCE_BUNDLE,
				MENU_NETWORKING, "fa-sitemap", null, 99999,
				null,
				null,
				null,
				null), MenuService.MENU_SYSTEM);
		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "browserLaunchable",
				"fa-globe", "browserLaunchable", 300, null, null, null, null) {
			@Override
			public boolean canRead() {
				return browserService.getPersonalResourceCount(
						getCurrentPrincipal(), "") > 0;
			}
		}, MenuService.MENU_MY_RESOURCES);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_SYSTEM, "", null, 200, null, null, null, null));

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_SYSTEM_CONFIGURATION, "fa-gears", null, 0,
				SystemPermission.SYSTEM_ADMINISTRATION, 
				SystemPermission.SYSTEM_ADMINISTRATION, 
				SystemPermission.SYSTEM_ADMINISTRATION, 
				SystemPermission.SYSTEM_ADMINISTRATION), MenuService.MENU_NAV);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "settings",
				"fa-gears", "settings", 2,
				SystemPermission.SYSTEM_ADMINISTRATION, 
				SystemPermission.SYSTEM_ADMINISTRATION,
				SystemPermission.SYSTEM_ADMINISTRATION, 
				SystemPermission.SYSTEM_ADMINISTRATION),
				MenuService.MENU_SYSTEM_CONFIGURATION);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "interfacesMenu",
						"fa-sitemap", "interfacesMenu", 100,
						SystemPermission.SYSTEM_ADMINISTRATION,
						SystemPermission.SYSTEM_ADMINISTRATION,
						SystemPermission.SYSTEM_ADMINISTRATION,
						SystemPermission.SYSTEM_ADMINISTRATION),
				MenuService.MENU_SYSTEM_CONFIGURATION);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MENU_DIAGNOSTICS,
						"fa-wrench", null, 100, null, null, null, null),
				MenuService.MENU_SYSTEM);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_CONFIGURATION, "fa-gears", null, 100, null,
				null, null, null), MenuService.MENU_SYSTEM);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
						"fileUploads", "fa-file",
						"fileUploads", 9999, SystemPermission.SYSTEM_ADMINISTRATION,
						SystemPermission.SYSTEM_ADMINISTRATION,
						SystemPermission.SYSTEM_ADMINISTRATION,
						SystemPermission.SYSTEM_ADMINISTRATION).setHidden(true),
				null);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
						MenuService.MENU_CERTIFICATES, "fa-certificate",
						"certificateResources", 99999,
						CertificateResourcePermission.READ,
						CertificateResourcePermission.CREATE,
						CertificateResourcePermission.UPDATE,
						CertificateResourcePermission.DELETE), MenuService.MENU_SYSTEM);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
					"dictionary", "fa-file-word-o", "", 900,
					DictionaryResourcePermission.READ,
					DictionaryResourcePermission.CREATE,
					DictionaryResourcePermission.UPDATE,
					DictionaryResourcePermission.DELETE), MenuService.MENU_BUSINESS_RULES);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
					"words", "fa-file-word-o", "words", 100,
					DictionaryResourcePermission.READ,
					DictionaryResourcePermission.CREATE,
					DictionaryResourcePermission.UPDATE,
					DictionaryResourcePermission.DELETE), "dictionary");

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
					"dictionarySettings", "fa-cogs", "dictionarySettings", 200,
					SystemPermission.SYSTEM_ADMINISTRATION,
					SystemPermission.SYSTEM_ADMINISTRATION,
					SystemPermission.SYSTEM_ADMINISTRATION,
					SystemPermission.SYSTEM_ADMINISTRATION), "dictionary");

		registerTableAction(MenuService.ACTIONS_CERTIFICATES,
				new AbstractTableAction("downloadCSR", "fa-certificate",
						"downloadCSR", CertificateResourcePermission.UPDATE, 0,
						null, null));

		registerTableAction(MenuService.ACTIONS_CERTIFICATES,
				new AbstractTableAction("certificateUpload", "fa-upload",
						"certificateUpload",
						CertificateResourcePermission.UPDATE, 100, null, null));

		registerTableAction(MenuService.ACTIONS_CERTIFICATES,
				new AbstractTableAction("pemUpload", "fa-upload", "pemUpload",
						CertificateResourcePermission.UPDATE, 200, null, null));

		registerTableAction(MenuService.ACTIONS_CERTIFICATES,
				new AbstractTableAction("pfxUpload", "fa-upload", "pfxUpload",
						CertificateResourcePermission.UPDATE, 300, null, null));

		registerTableAction(MenuService.ACTIONS_CERTIFICATES,
				new AbstractTableAction("downloadCertificate", "fa-download",
						"downloadCertificate",
						CertificateResourcePermission.READ, 400, null, null));

		registerTableAction(MenuService.ACTIONS_CERTIFICATES,
				new AbstractTableAction("pemExport", "fa-download",
						"pemExport", CertificateResourcePermission.READ, 500,
						null, null));

		registerTableAction(MenuService.ACTIONS_CERTIFICATES,
				new AbstractTableAction("pfxExport", "fa-download",
						"pfxExport", CertificateResourcePermission.READ, 600,
						null, null));

		registerMenu(
				new MenuRegistration(RESOURCE_BUNDLE, "profileAttributes",
						"fa-sticky-note-o", "userAttributeTabs", 4000,
						UserAttributePermission.READ,
						UserAttributePermission.CREATE,
						UserAttributePermission.UPDATE,
						UserAttributePermission.DELETE),
				MenuService.MENU_USERS_DIRECTORY);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MENU_USERS_DIRECTORY,
						"fa-users", null, 200, null, null, null, null),
				MenuService.MENU_SYSTEM);
		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MENU_SECURITY_PERMISSIONS,
				"fa-shield", null, 250, null, null, null, null),
		MenuService.MENU_SYSTEM);

		registerMenu(new RealmMenuRegistration(RESOURCE_BUNDLE, "users",
				"fa-user", "users", 1000, UserPermission.READ,
				UserPermission.CREATE, UserPermission.UPDATE,
				UserPermission.DELETE) {

			@Override
			public boolean canDelete() {
				return !realmService.isReadOnly(getCurrentRealm());
			}

			@Override
			public boolean canCreate() {
				return !realmService.isReadOnly(getCurrentRealm());
			}

			@Override
			public boolean canUpdate() {
				return true;
			}
		}, MenuService.MENU_USERS_DIRECTORY);

		registerMenu(new RealmMenuRegistration(RESOURCE_BUNDLE, "groups",
				"fa-users", "groups", 2000, GroupPermission.READ,
				GroupPermission.CREATE, GroupPermission.UPDATE,
				GroupPermission.DELETE) {

			@Override
			public boolean canUpdate() {
				return !realmService.isReadOnly(getCurrentRealm());
			}

			@Override
			public boolean canDelete() {
				return !realmService.isReadOnly(getCurrentRealm());
			}

			@Override
			public boolean canCreate() {
				return !realmService.isReadOnly(getCurrentRealm());
			}
		}, MenuService.MENU_USERS_DIRECTORY);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "roles",
				"fa-user-md", "roles", 3000, RolePermission.READ,
				RolePermission.CREATE, RolePermission.UPDATE,
				RolePermission.DELETE), MenuService.MENU_SECURITY_PERMISSIONS);

		registerMenu(
				new MenuRegistration(RESOURCE_BUNDLE, "userDelegations", "fa-user-circle-o", "userDelegations", 3001,
						UserDelegationResourcePermission.READ, UserDelegationResourcePermission.CREATE,
						UserDelegationResourcePermission.UPDATE, UserDelegationResourcePermission.DELETE),
				MenuService.MENU_SECURITY_PERMISSIONS);

		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "roleAttributes",
						"fa-briefcase", "roleAttributeTabs", 5000,
						RoleAttributePermission.READ,
						RoleAttributePermission.CREATE,
						RoleAttributePermission.UPDATE,
						RoleAttributePermission.DELETE) {
			public boolean canRead() {
				return super.canRead() && configurationService.getBooleanValue(getCurrentRealm(), "feature.roleSelection");
			}
		},
				MenuService.MENU_CONFIGURATION);


		registerMenu(
				new MenuRegistration(RESOURCE_BUNDLE, "passwordPolicys", "fa-ellipsis-h", "passwordPolicys", 9999,
						PasswordPolicyResourcePermission.READ, PasswordPolicyResourcePermission.CREATE,
						PasswordPolicyResourcePermission.UPDATE, PasswordPolicyResourcePermission.DELETE),
				MenuService.MENU_SECURITY_PERMISSIONS);
		
		registerExtendedInformationTab("principalTabs",
                new TabRegistration("principalPasswordPolicy", "principalPasswordPolicy", UserPermission.UPDATE, 0));
		registerExtendedInformationTab("secondaryTabs",
                new TabRegistration("principalPasswordPolicy", "principalPasswordPolicy", UserPermission.UPDATE, 0));
		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_RESOURCES, "", null, 300, null, null, null,
				null));

		registerTableAction(MenuService.ACTIONS_USERS, new AbstractTableAction(
				"setPassword", "fa-key", "password", 0,
				null, null, UserPermission.UPDATE, PasswordPermission.RESET) {
			public boolean isEnabled() {
				return !realmService.isReadOnly(getCurrentRealm());
			}
		});
		
		registerTableAction(MenuService.ACTIONS_USERS, new AbstractTableAction(
				"impersonateUser", "fa-male", "impersonateUser",
				UserPermission.IMPERSONATE, 0, null, "canImpersonateUser"));
		
		registerTableAction(MenuService.ACTIONS_USERS, new AbstractTableAction(
				"resetProfile", "fa-ban", "resetProfile",
				0, null, null, UserPermission.UPDATE, UserPermission.DELETE));

		registerTableAction(MenuService.ACTIONS_USERS, new AbstractTableAction(
				"suspendUser", "fa-ban", "suspendUser",
				UserPermission.LOCK, 0, null, "isSuspended"));

		registerTableAction(MenuService.ACTIONS_USERS, new AbstractTableAction(
				"resumeUser", "fa-check", "resumeUser",
				UserPermission.UNLOCK, 0, null, "isResumed"));

		registerTableAction(MenuService.ACTIONS_REALMS,
				new AbstractTableAction("defaultRealm", "fa-tag",
						"defaultRealm", SystemPermission.SYSTEM_ADMINISTRATION,
						0, "isDefault", null));
		
		registerTableAction(MenuService.ACTIONS_USERS,
				new AbstractTableAction("deleteAccount", "fa-trash",
						"deleteAccount", UserPermission.DELETE, 900, "canDelete",
						null));
		
		registerTableAction(MenuService.ACTIONS_GROUPS,
				new AbstractTableAction("deleteGroup", "fa-trash",
						"deleteGroup", GroupPermission.DELETE, 900, "canDelete",
						null));

		registerTableAction(MenuService.TOOLBAR_USERS,
				new AbstractTableAction("deleteAccounts", "fa-trash",
						"deleteAccounts", null, 0, null,
						"") {
							@Override
				public boolean isEnabled() {
					return permissionService.hasAdministrativePermission(getCurrentPrincipal())
							|| permissionService.hasPermission(getCurrentPrincipal(), RealmPermission.DELETE)
							|| permissionService.hasPermission(getCurrentPrincipal(), UserPermission.DELETE);
				}
			
		});

		registerTableAction(MenuService.TOOLBAR_GROUPS,
				new AbstractTableAction("deleteGroups", "fa-trash",
						"deleteGroups", null, 0, null,
						"") {
							@Override
				public boolean isEnabled() {
					return permissionService.hasAdministrativePermission(getCurrentPrincipal())
							|| permissionService.hasPermission(getCurrentPrincipal(), RealmPermission.DELETE)
							|| permissionService.hasPermission(getCurrentPrincipal(), UserPermission.DELETE);
				}
			
		});

//		registerTableAction(MenuService.ACTIONS_REALMS,
//				new AbstractTableAction("exportForMigrationRealmDialog", "fa-download",
//						"exportForMigrationRealmDialog", SystemPermission.SYSTEM_ADMINISTRATION,
//						0, null, null));

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MENU_BUSINESS_RULES,
				"", null, 8888, null, null, null, null, null));

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MENU_REPORTING, "",
				null, 9999, null, null, null, null, null));

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "messageMenu", "fa-envelope-o",
				null, 9999999, null, null, null,
				null) {
			@Override
			public boolean canRead() {
				return ApplicationContextServiceImpl.getInstance().getBean(EmailNotificationService.class).isEnabled();
			}
		}, MENU_BUSINESS_RULES);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				"messages", "fa-envelope-o", "messages", 0,
				MessageResourcePermission.READ,
				MessageResourcePermission.CREATE,
				MessageResourcePermission.UPDATE,
				MessageResourcePermission.DELETE) {

			@Override
			public boolean canRead() {
				try {
					return ApplicationContextServiceImpl.getInstance().getBean(EmailNotificationService.class).isEnabled()
							&& messageService.getResourceCount(getCurrentRealm(), "", "") > 0;
				} catch (AccessDeniedException e) {
					return false;
				}
			}

		}, "messageMenu");
		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				"htmlTemplates", "fa-code", "htmlTemplates", 9999,
				HtmlTemplateResourcePermission.READ,
				HtmlTemplateResourcePermission.CREATE,
				HtmlTemplateResourcePermission.UPDATE,
				HtmlTemplateResourcePermission.DELETE) {

			@Override
			public boolean canRead() {
				try {
					return ApplicationContextServiceImpl.getInstance().getBean(EmailNotificationService.class).isEnabled()
							&& messageService.getResourceCount(getCurrentRealm(), "", "") > 0;
				} catch (AccessDeniedException e) {
					return false;
				}
			}

		}, "messageMenu");

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "messageConfiguration", "fa-gears",
				"messageSettings", Integer.MAX_VALUE, MessageResourcePermission.READ, null, null,
				null) {

			@Override
			public boolean canRead() {
				try {
					return ApplicationContextServiceImpl.getInstance().getBean(EmailNotificationService.class).isEnabled()
							&& messageService.getResourceCount(getCurrentRealm(), "", "") > 0;
				} catch (AccessDeniedException e) {
					return false;
				}
			}

		}, "messageMenu");
		
		registerTableAction("messagesActions",
				new AbstractTableAction("sendTestMessage", "fa-paper-plane", "sendTestMessage", 100, null,
						null, MessageResourcePermission.CREATE, MessageResourcePermission.READ,
						MessageResourcePermission.DELETE));

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, MENU_TOOLS, "",
				null, 99999, null, null, null, null, null));

		registerMenu(new MenuRegistration(RealmService.RESOURCE_BUNDLE,
				"changePassword", "fa-lock", "changePassword", 1000,
				PasswordPermission.CHANGE, null, PasswordPermission.CHANGE,
				null) {
			public boolean canRead() {
				try {
					if (!realmService.canChangePassword(getCurrentPrincipal())) {
						return false;
					}
					assertPermission(PasswordPermission.CHANGE);
					return true;
				} catch (AccessDeniedException e) {
					return false;
				}
			}
		}, MenuService.MENU_MY_PROFILE);
	}

	@Override
	public void registerFilter(MenuFilter filter) {
		filters.add(filter);
		Collections.<MenuFilter>sort(filters, new Comparator<MenuFilter>() {

			@Override
			public int compare(MenuFilter o1, MenuFilter o2) {
				return o1.getWeight().compareTo(o2.getWeight());
			}
		});
	}

	@Override
	public void registerBadgeProvider(BadgeProvider provider) {
		badgeProviders.add(provider);
	}

	@Override
	public Collection<Badge> getCurrentBadges() {
		List<Badge> badges = new ArrayList<Badge>();
		for(BadgeProvider provider : badgeProviders) {
			badges.addAll(provider.getBadges(getCurrentPrincipal()));
		}
		return badges;
	}

	@Override
	public boolean registerMenu(MenuRegistration module) {
		return registerMenu(module, null);
	}

	@Override
	public synchronized boolean registerMenu(MenuRegistration module, String parentModule) {

		/**
		 * Top navigation menu is special case and processed differently so just hide any
		 * modules registered to it.
		 */
		if(MENU_NAV.equals(module.getResourceKey()) || MENU_NAV.equals(parentModule)) {
			module.setHidden(true);
		}

		if (pendingMenus.containsKey(module.getResourceKey())) {
			for (MenuRegistration m : pendingMenus.get(module.getResourceKey())) {
				module.addMenu(m);
			}
			pendingMenus.remove(module.getResourceKey());
		}

		allMenus.put(module.getResourceKey(), module);

		if (parentModule != null) {
			if (allMenus.containsKey(parentModule)) {
				MenuRegistration parent = allMenus.get(parentModule);
				parent.addMenu(module);

				return true;
			} else {
				for (MenuRegistration m : allMenus.values()) {
					for (MenuRegistration m2 : m.getMenus()) {
						if (m2.getResourceKey().equals(parentModule)) {
							m2.addMenu(module);
							return true;
						}
					}
				}

				if (!pendingMenus.containsKey(parentModule)) {
					pendingMenus.put(parentModule,
							new ArrayList<MenuRegistration>());
				}

				pendingMenus.get(parentModule).add(module);
			}

		} else {
			rootMenus.put(module.getId(), module);
			return true;
		}

		return false;
	}

	@Override
	public void registerTableAction(String table, AbstractTableAction action) {
		if (!registeredActions.containsKey(table)) {
			registeredActions.put(table, new ArrayList<AbstractTableAction>());
		}
		registeredActions.get(table).add(action);
	}

	@Override
	public List<AbstractTableAction> getTableActions(String table) {
		if (!registeredActions.containsKey(table)) {
			return new ArrayList<AbstractTableAction>();
		}

		List<AbstractTableAction> results = new ArrayList<AbstractTableAction>();
		
		for (AbstractTableAction action : registeredActions.get(table)) {

			boolean hasPermission = action.canRead();
			if (action.getPermissions() != null) {
				hasPermission = false;
				for(PermissionType t : action.getPermissions()) {
					hasPermission = hasPermission(t);
					if(hasPermission) {
						break;
					}
				}
			}

			if(hasPermission) {
				if (!action.isEnabled()) {
					continue;
				}
				results.add(action);
			}

		}

		Collections.sort(results, new Comparator<AbstractTableAction>() {
			@Override
			public int compare(AbstractTableAction o1, AbstractTableAction o2) {
				return new Integer(o1.getWeight()).compareTo(o2.getWeight());
			}
		});

		return results;
	}

	public Menu getMenu(String resourceKey) {

		MenuRegistration m = allMenus.get(resourceKey);

		Menu menu = new Menu(
				m,
				hasPermission(m.getCreatePermission()) && m.canCreate(),
				hasPermission(m.getUpdatePermission()) && m.canUpdate(),
				hasPermission(m.getDeletePermission()) && m.canDelete(),
				m.getIcon(), m.getData(), m.isHidden());
		
		return menu;

	}

	@Override
	public List<Menu> getMenus() {
		return getMenus(null);
	}

	@Override
	public List<Menu> getMenus(String resourceKey) {
		
		Collection<MenuRegistration> menus;
		if(resourceKey == null)
			menus = rootMenus.values();
		else
			menus = allMenus.get(resourceKey).getMenus();
		
		List<Menu> userMenus = new ArrayList<Menu>();

		for (MenuRegistration m : menus) {
			populateMenuList(m, userMenus);
		}
		
		return userMenus;
	}

	protected void sortMenu(Menu menu) {
		Collections.sort(menu.getMenus(), new Comparator<Menu>() {

			@Override
			public int compare(Menu o1, Menu o2) {
				Integer weight1 = o1.getWeight();
				Integer weight2 = o2.getWeight();
				return ( weight1 == null ? Integer.valueOf(0) : weight1 ).compareTo(weight2 == null ? Integer.valueOf(0) : weight2);
			}
		});
	}
	
	protected Menu populateMenuList(MenuRegistration m, List<Menu> menuList) {


		if (shouldFilter(m)) {
			if (log.isDebugEnabled()) {
				log.debug(m.getResourceKey() + " has been filtered out");
			}
			return null;
		} else if (!canReadMenu(m)) {
			if (log.isDebugEnabled()) {
				log.debug(getCurrentPrincipal().getRealm().getName()+ "/"
						+ getCurrentPrincipal().getName()
						+ " does not have access to "
						+ m.getResourceKey()
						+ " menu due to canRead returning false");
			}
			return null;

		} else if (m.getReadPermission() != null) {

			try {
				assertAnyPermission(PermissionStrategy.EXCLUDE_IMPLIED,
						m.getReadPermission());
			} catch (AccessDeniedException e) {
				if (log.isDebugEnabled()) {
					log.debug(getCurrentPrincipal().getRealm().getName() + "/"
							+ getCurrentPrincipal().getName()
							+ " does not have access to "
							+ m.getResourceKey()
							+ " menu due to permission " + m.getReadPermission().getResourceKey());
				}
				return null;
			}
		}
		
		Menu thisMenu = new Menu(
				m,
				hasPermission(m.getCreatePermission()) && m.canCreate(),
				hasPermission(m.getUpdatePermission()) && m.canUpdate(),
				hasPermission(m.getDeletePermission()) && m.canDelete(),
				m.getIcon(), m.getData(), m.isHidden());

		for (MenuRegistration child : allMenus.get(m.getResourceKey()).getMenus()) {
			populateMenuList(child, thisMenu.getMenus());
		}

		if (thisMenu.getResourceName() == null) {
			if (thisMenu.getMenus().size() == 0) {
				if (log.isDebugEnabled()) {
					log.debug("Menu "
							+ thisMenu.getResourceKey()
							+ " will not be displayed because there are no children and no url has been set");
				}
				return null;
			}
		}
		menuList.add(thisMenu);
		return thisMenu;
		
	}

	private boolean canReadMenu(MenuRegistration m) {
		return m.canRead();
	}
	
	protected boolean hasPermission(PermissionType permission) {
		try {
			if (permission == null) {
				return true;
			}

			verifyPermission(getCurrentPrincipal(),
					PermissionStrategy.EXCLUDE_IMPLIED, permission);
			return true;
		} catch (AccessDeniedException ex) {
			return false;
		}
	}

	protected boolean shouldFilter(MenuRegistration m) {
		for (MenuFilter filter : filters) {
			if (!filter.isVisible(m)) {
				return true;
			}
		}
		return false;
	}

	class RealmMenuRegistration extends MenuRegistration {

		public RealmMenuRegistration() {
			super();
		}

		public RealmMenuRegistration(String bundle, String resourceKey,
									 String icon, String url, Integer weight,
									 PermissionType readPermision, PermissionType createPermission,
									 PermissionType updatePermission, PermissionType deletePermission) {
			super(bundle, resourceKey, icon, url, weight, readPermision,
					createPermission, updatePermission, deletePermission);
		}

		@Override
		public boolean canUpdate() {
			return !realmService.isReadOnly(getCurrentRealm());
		}

		@Override
		public boolean canDelete() {
			return !realmService.isReadOnly(getCurrentRealm());
		}

		@Override
		public boolean canCreate() {
			return !realmService.isReadOnly(getCurrentRealm());
		}
	}

	@Override
	public void registerExtendedInformationTab(String tab, TabRegistration tabRegistration) {
		if (!extendedInformationTabs.containsKey(tab)) {
			extendedInformationTabs.put(tab, new ArrayList<TabRegistration>());
		}
		extendedInformationTabs.get(tab).add(tabRegistration);
	}

	@Override
	public List<Tab> getExtendedInformationTab (String tab) {
		List<Tab> processedTabRegistration = new ArrayList<>();
		List<TabRegistration> toProcessTabRegistration = extendedInformationTabs.get(tab);
		if(toProcessTabRegistration == null || toProcessTabRegistration.isEmpty()) {
			return processedTabRegistration;
		}
		for (TabRegistration tabRegistration : toProcessTabRegistration) {
			if(tabRegistration.canRead()) {
				try {
					assertPermission(tabRegistration.getPermission());
					processedTabRegistration.add(new Tab(tabRegistration.getResourceKey(), tabRegistration.getUrl(), false, tabRegistration.getWeight()));
				}catch (AccessDeniedException e) {
					log.debug("{}/{} does not have access to {} tab with permission {}",
							getCurrentPrincipal().getRealm().getName(),
							getCurrentPrincipal().getName(),
							tabRegistration.getResourceKey(),
							tabRegistration.getPermission()
					);
					processedTabRegistration.add(new Tab(tabRegistration.getResourceKey(), tabRegistration.getUrl(), true, tabRegistration.getWeight()));
				}
			}
		}
		return processedTabRegistration;
	}
}
