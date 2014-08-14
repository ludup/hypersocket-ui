package com.hypersocket.menus;

import org.codehaus.jackson.annotate.JsonIgnore;

import com.hypersocket.permissions.PermissionType;

public class AbstractTableAction {

	String resourceKey;
	String iconClass;
	String url;
	PermissionType permission;
	int weight;
	String enableFunction;
	String displayFunction;
	
	public AbstractTableAction() {
	}

	public AbstractTableAction(String resourceKey, String iconClass,
			String url, PermissionType permission, int weight, 
			String enableFunction, String displayFunction) {
		this.resourceKey = resourceKey;
		this.iconClass = iconClass;
		this.url = url;
		this.permission = permission;
		this.weight = weight;
		this.enableFunction = enableFunction;
		this.displayFunction = displayFunction;
	}

	public String getEnableFunction() {
		return enableFunction;
	}
	
	public void setEnableFunction(String enableFunction) {
		this.enableFunction = enableFunction;
	}
	
	public void setDisplayFunction(String displayFunction) {
		this.displayFunction = displayFunction;
	}
	
	public String getDisplayFunction() {
		return displayFunction;
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

	@JsonIgnore
	public boolean isEnabled() {
		return true;
	}
}
