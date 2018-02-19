package com.hypersocket.menus;

import java.util.Map;

import com.hypersocket.permissions.PermissionType;

public class HiddenMenuRegistration extends MenuRegistration {

	public HiddenMenuRegistration() {
	}

	public HiddenMenuRegistration(String bundle, String resourceKey, String icon, String url, Integer weight,
			PermissionType readPermision, PermissionType createPermission, PermissionType updatePermission,
			PermissionType deletePermission) {
		super(bundle, resourceKey, icon, url, weight, readPermision, createPermission, updatePermission,
				deletePermission);
		this.hidden = true;
	}

	public HiddenMenuRegistration(String bundle, String resourceKey, String icon, String url, Integer weight,
			PermissionType readPermision, PermissionType createPermission, PermissionType updatePermission,
			PermissionType deletePermission, Map<String, PermissionType> additionalPermissions) {
		super(bundle, resourceKey, icon, url, weight, readPermision, createPermission, updatePermission,
				deletePermission, additionalPermissions);
		this.hidden = true;
	}

	public HiddenMenuRegistration(String bundle, String resourceKey, String icon, String url, Integer weight) {
		super(bundle, resourceKey, icon, url, weight);
		this.hidden = true;
	}

}
