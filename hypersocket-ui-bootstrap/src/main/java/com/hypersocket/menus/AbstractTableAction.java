package com.hypersocket.menus;

import com.hypersocket.permissions.PermissionType;

public class AbstractTableAction {

	String resourceKey;
	String iconClass;
	String url;
	PermissionType permission;
	int weight;
	
	public AbstractTableAction() {
	}

	public AbstractTableAction(String resourceKey, String iconClass, String url, PermissionType permission, int weight) {
		this.resourceKey = resourceKey;
		this.iconClass = iconClass;
		this.url = url;
		this.permission = permission;
		this.weight = weight;
	}

	public String getResourceKey() {
		return resourceKey;
	}

	public void setResourceKey(String resourceKey) {
		this.resourceKey = resourceKey;
	}

	public String getIconClass() {
		return iconClass;
	}

	public void setIconClass(String iconClass) {
		this.iconClass = iconClass;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public PermissionType getPermission() {
		return permission;
	}

	public void setPermission(PermissionType permission) {
		this.permission = permission;
	}

	public int getWeight() {
		return weight;
	}

	public void setWeight(int weight) {
		this.weight = weight;
	}
	
	
}
