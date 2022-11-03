package com.hypersocket.menus;

import com.hypersocket.permissions.PermissionType;

public class TabAction extends BaseAction {
	
	public TabAction(String resourceKey, String iconClass,
			String url, PermissionType permission, int weight, 
			String enableFunction, String displayFunction) {
		super(resourceKey, iconClass, url, permission, weight, enableFunction, displayFunction);
	}
	
	public TabAction(String resourceKey, String iconClass,
			String url, int weight, 
			String enableFunction, String displayFunction, PermissionType... permissions) {
		super(resourceKey, iconClass, url, weight, enableFunction, displayFunction, permissions);
	}

}
