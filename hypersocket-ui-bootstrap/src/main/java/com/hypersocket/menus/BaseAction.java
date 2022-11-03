package com.hypersocket.menus;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hypersocket.permissions.AccessDeniedException;
import com.hypersocket.permissions.PermissionType;

public abstract class BaseAction {

	protected String resourceKey;
	protected String iconClass;
	protected String url;
	protected PermissionType[] permissions;
	protected int weight;
	protected String enableFunction;
	protected String displayFunction;
	
	public BaseAction() {
	}

	public BaseAction(String resourceKey, String iconClass,
			String url, PermissionType permission, int weight, 
			String enableFunction, String displayFunction) {
		this.resourceKey = resourceKey;
		this.iconClass = iconClass;
		this.url = url;
		this.permissions = new PermissionType[] {permission};
		this.weight = weight;
		this.enableFunction = enableFunction;
		this.displayFunction = displayFunction;
	}
	
	public BaseAction(String resourceKey, String iconClass,
			String url, int weight, 
			String enableFunction, String displayFunction, PermissionType... permissions) {
		this.resourceKey = resourceKey;
		this.iconClass = iconClass;
		this.url = url;
		this.permissions = permissions;
		this.weight = weight;
		this.enableFunction = enableFunction;
		this.displayFunction = displayFunction;
	}

	public String getEnableFunction() {
		return enableFunction;
	}
	
	public boolean canRead() throws AccessDeniedException {
		return true;
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

	public String getIcon() {
		return getIconClass();
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

	public PermissionType[] getPermissions() {
		return permissions;
	}

	public void setPermissions(PermissionType[] permissions) {
		this.permissions = permissions;
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
