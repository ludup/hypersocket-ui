package com.hypersocket.menus;

import com.hypersocket.permissions.PermissionType;

public abstract class URLButtonAction extends BaseAction {

	protected String iconClass;
	protected String url;
	
	public URLButtonAction() {
	}

	public URLButtonAction(String resourceKey, String iconClass,
			String url, PermissionType permission, int weight, 
			String enableFunction, String displayFunction) {
		super(resourceKey, permission, weight, enableFunction, displayFunction);
		this.iconClass = iconClass;
		this.url = url;
	}
	
	public URLButtonAction(String resourceKey, String iconClass,
			String url, int weight, 
			String enableFunction, String displayFunction, PermissionType... permissions) {
		super(resourceKey, weight, enableFunction, displayFunction, permissions);
		this.iconClass = iconClass;
		this.url = url;
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

}
