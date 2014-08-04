/*******************************************************************************
 * Copyright (c) 2013 Hypersocket Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.menus;

import java.util.ArrayList;
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

import com.hypersocket.auth.AuthenticatedServiceImpl;
import com.hypersocket.certs.CertificatePermission;
import com.hypersocket.config.ConfigurationPermission;
import com.hypersocket.i18n.I18NService;
import com.hypersocket.permissions.AccessDeniedException;
import com.hypersocket.permissions.PermissionStrategy;
import com.hypersocket.permissions.PermissionType;
import com.hypersocket.realm.GroupPermission;
import com.hypersocket.realm.ProfilePermission;
import com.hypersocket.realm.RealmPermission;
import com.hypersocket.realm.RolePermission;
import com.hypersocket.realm.UserPermission;

@Service
public class MenuServiceImpl extends AuthenticatedServiceImpl implements
		MenuService {

	static Logger log = LoggerFactory.getLogger(MenuServiceImpl.class);

	Map<String, MenuRegistration> rootMenus = new HashMap<String, MenuRegistration>();

	Map<String, List<MenuRegistration>> pendingMenus = new HashMap<String, List<MenuRegistration>>();

	Map<String, List<AbstractTableAction>> registeredActions = new HashMap<String, List<AbstractTableAction>>();

	@Autowired
	I18NService i18nService;

	@PostConstruct
	private void postConstruct() {

		i18nService.registerBundle(MenuService.RESOURCE_BUNDLE);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_PERSONAL, "", null, 0, null, null, null, null));

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_MY_PROFILE, "fa-tags", null, 200, null, null,
				null, null), MenuService.MENU_PERSONAL);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "details",
				"fa-tags", "details", 200, ProfilePermission.READ, null,
				ProfilePermission.UPDATE, null), MenuService.MENU_MY_PROFILE);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_MY_RESOURCES, "fa-share-alt", null, 300, null,
				null, null, null), MenuService.MENU_PERSONAL);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_SYSTEM, "", null, 100, null, null, null, null));

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "configuration",
				"fa-cog", null, 100, null, null, null, null),
				MenuService.MENU_SYSTEM);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "settings",
				"fa-cog", "settings", 0, ConfigurationPermission.READ, null,
				ConfigurationPermission.UPDATE, null),
				MenuService.MENU_CONFIGURATION);
		
		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "realmSettings",
				"fa-database", "realmSettings", 0, ConfigurationPermission.READ, null,
				ConfigurationPermission.UPDATE, null),
				MenuService.MENU_CONFIGURATION);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "certificates",
				"fa-certificate", "certificates", 1000,
				CertificatePermission.CERTIFICATE_ADMINISTRATION,
				CertificatePermission.CERTIFICATE_ADMINISTRATION,
				CertificatePermission.CERTIFICATE_ADMINISTRATION,
				CertificatePermission.CERTIFICATE_ADMINISTRATION),
				MenuService.MENU_CONFIGURATION);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "accessControl",
				"fa-unlock-alt", null, 200, null, null, null, null),
				MenuService.MENU_SYSTEM);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "users", "fa-user",
				"users", 1000, UserPermission.READ, UserPermission.CREATE,
				UserPermission.UPDATE, UserPermission.DELETE),
				MenuService.MENU_ACCESS_CONTROL);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "groups",
				"fa-users", "groups", 2000, GroupPermission.READ,
				GroupPermission.CREATE, GroupPermission.UPDATE,
				GroupPermission.DELETE), MenuService.MENU_ACCESS_CONTROL);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "roles",
				"fa-user-md", "roles", 3000, RolePermission.READ,
				RolePermission.CREATE, RolePermission.UPDATE,
				RolePermission.DELETE), MenuService.MENU_ACCESS_CONTROL);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "realms",
				"fa-database", "realms", 4000, RealmPermission.READ,
				RealmPermission.CREATE, RealmPermission.UPDATE,
				RealmPermission.DELETE), MenuService.MENU_ACCESS_CONTROL);

		registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
				MenuService.MENU_RESOURCES, "", null, 300, null, null, null,
				null));

		registerExtendableTable(MenuService.ACTIONS_USERS);

		registerTableAction(MenuService.ACTIONS_USERS, new AbstractTableAction(
				"setPassword", "fa-key", "password", UserPermission.UPDATE, 0));
	}

	@Override
	public boolean registerMenu(MenuRegistration module) {
		return registerMenu(module, null);
	}

	@Override
	public boolean registerMenu(MenuRegistration module, String parentModule) {

		if (pendingMenus.containsKey(module.getResourceKey())) {
			for (MenuRegistration m : pendingMenus.get(module.getResourceKey())) {
				module.addMenu(m);
			}
			pendingMenus.remove(module.getResourceKey());
		}
		if (parentModule != null) {
			if (rootMenus.containsKey(parentModule)) {
				MenuRegistration parent = rootMenus.get(parentModule);
				parent.addMenu(module);
				return true;
			} else {
				for (MenuRegistration m : rootMenus.values()) {
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
	public void registerExtendableTable(String extendableTable) {
		if (registeredActions.containsKey(extendableTable)) {
			throw new IllegalStateException(extendableTable
					+ " is already registered");
		}
		registeredActions.put(extendableTable,
				new ArrayList<AbstractTableAction>());
	}

	@Override
	public void registerTableAction(String table, AbstractTableAction action) {
		if (!registeredActions.containsKey(table)) {
			throw new IllegalStateException(table
					+ " is not a registered table");
		}
		registeredActions.get(table).add(action);
	}

	@Override
	public List<AbstractTableAction> getTableActions(String table) {
		if (!registeredActions.containsKey(table)) {
			throw new IllegalStateException(table
					+ " is not a registered table");
		}
		List<AbstractTableAction> results = new ArrayList<AbstractTableAction>();

		for (AbstractTableAction action : registeredActions.get(table)) {
			if (action.getPermission() != null) {
				if (!hasPermission(action.getPermission())) {
					continue;
				}
			}
			results.add(action);
		}

		Collections.sort(results, new Comparator<AbstractTableAction>() {
			@Override
			public int compare(AbstractTableAction o1, AbstractTableAction o2) {
				return new Integer(o1.getWeight()).compareTo(o2.getWeight());
			}
		});

		return results;
	}

	@Override
	public List<Menu> getMenus() {

		List<Menu> userMenus = new ArrayList<Menu>();

		for (MenuRegistration m : rootMenus.values()) {
			try {
				if (m.hasEnablerService()) {
					if (!m.getEnablerService().enableMenu(m.getResourceName(),
							getCurrentPrincipal())) {
						if (log.isDebugEnabled()) {
							log.debug(getCurrentPrincipal().getRealm() + "/"
									+ getCurrentPrincipal().getName()
									+ " does not have access to "
									+ m.getResourceKey()
									+ " menu due to enabler service denial");
						}
						continue;
					}
				} else if (m.getReadPermission() != null) {
					assertPermission(m.getReadPermission());
				}

				Menu rootMenu = new Menu(m,
						hasPermission(m.getCreatePermission()),
						hasPermission(m.getUpdatePermission()),
						hasPermission(m.getDeletePermission()), m.getIcon());
				for (MenuRegistration child : m.getMenus()) {
					if (child.hasEnablerService()) {
						if (!child.getEnablerService().enableMenu(
								child.getResourceName(), getCurrentPrincipal())) {
							// User does not have access to this menu
							if (log.isDebugEnabled()) {
								log.debug(getCurrentPrincipal().getRealm()
										+ "/" + getCurrentPrincipal().getName()
										+ " does not have access to "
										+ child.getResourceKey()
										+ " menu due to enabler service denial");
							}
							continue;
						}
					} else if (child.getReadPermission() != null) {
						try {
							assertPermission(child.getReadPermission());
						} catch (Exception e) {
							// User does not have access to this menu
							if (log.isDebugEnabled()) {
								log.debug(getCurrentPrincipal().getRealm()
										+ "/" + getCurrentPrincipal().getName()
										+ " does not have access to "
										+ child.getResourceKey()
										+ " menu with permission "
										+ child.getReadPermission());
							}
							continue;
						}
					}

					Menu childMenu = new Menu(child,
							hasPermission(child.getCreatePermission()),
							hasPermission(child.getUpdatePermission()),
							hasPermission(child.getDeletePermission()),
							child.getIcon());

					for (MenuRegistration leaf : child.getMenus()) {

						if (leaf.hasEnablerService()) {
							if (!leaf.getEnablerService().enableMenu(
									leaf.getResourceName(),
									getCurrentPrincipal())) {
								// User does not have access to this menu
								if (log.isDebugEnabled()) {
									log.debug(getCurrentPrincipal().getRealm()
											+ "/"
											+ getCurrentPrincipal().getName()
											+ " does not have access to "
											+ leaf.getResourceKey()
											+ " menu due to enabler service denial");
								}
								continue;
							}
						} else if (leaf.getReadPermission() != null) {
							try {
								assertPermission(leaf.getReadPermission());

							} catch (Exception e) {
								// User does not have access to this menu
								if (log.isDebugEnabled()) {
									log.debug(getCurrentPrincipal().getRealm()
											+ "/"
											+ getCurrentPrincipal().getName()
											+ " does not have access to "
											+ leaf.getResourceKey()
											+ " menu with permission "
											+ leaf.getReadPermission());
								}
								continue;
							}
						}
						childMenu.getMenus().add(
								new Menu(leaf, hasPermission(leaf
										.getCreatePermission()),
										hasPermission(leaf
												.getUpdatePermission()),
										hasPermission(leaf
												.getDeletePermission()), leaf
												.getIcon()));
					}

					if (childMenu.getResourceName() == null
							&& childMenu.getMenus().size() == 0) {
						if (log.isDebugEnabled()) {
							log.debug("Child menu "
									+ childMenu.getResourceKey()
									+ " will not be displayed because there are no leafs and no url has been set");
						}
						continue;
					}
					rootMenu.getMenus().add(childMenu);
				}

				if (rootMenu.getResourceName() == null) {
					if (rootMenu.getMenus().size() == 0) {
						if (log.isDebugEnabled()) {
							log.debug("Root menu "
									+ rootMenu.getResourceKey()
									+ " will not be displayed because there are no children and no url has been set");
						}
						continue;
					}
				}
				userMenus.add(rootMenu);
			} catch (AccessDeniedException e) {
				// User does not have access to this menu
				if (log.isDebugEnabled()) {
					log.debug(getCurrentPrincipal().getRealm() + "/"
							+ getCurrentPrincipal().getName()
							+ " does not have access to " + m.getResourceKey()
							+ " menu with permission " + m.getReadPermission());
				}
			}
		}

		Collections.sort(userMenus, new Comparator<Menu>() {
			@Override
			public int compare(Menu o1, Menu o2) {
				return (o1.getWeight() > o2.getWeight() ? 1
						: (o1.getWeight() == o2.getWeight() ? 0 : -1));
			}
		});

		for (Menu m : userMenus) {
			Collections.sort(m.getMenus(), new Comparator<Menu>() {
				@Override
				public int compare(Menu o1, Menu o2) {
					return (o1.getWeight() > o2.getWeight() ? 1 : (o1
							.getWeight() == o2.getWeight() ? 0 : -1));
				}
			});

			for (Menu m2 : m.getMenus()) {
				Collections.sort(m2.getMenus(), new Comparator<Menu>() {
					@Override
					public int compare(Menu o1, Menu o2) {
						return (o1.getWeight() > o2.getWeight() ? 1 : (o1
								.getWeight() == o2.getWeight() ? 0 : -1));
					}
				});
			}
		}
		return userMenus;
	}

	protected boolean hasPermission(PermissionType permission) {
		try {
			if (permission == null) {
				return false;
			}

			verifyPermission(getCurrentPrincipal(),
					PermissionStrategy.REQUIRE_ALL_PERMISSIONS, permission);
			return true;
		} catch (AccessDeniedException ex) {
			return false;
		}
	}

}
