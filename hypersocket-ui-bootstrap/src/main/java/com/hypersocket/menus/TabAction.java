package com.hypersocket.menus;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.hypersocket.permissions.PermissionType;

@JsonInclude(value = Include.NON_NULL)
public class TabAction extends BaseAction {
	
	public static final String COMMON_PROPERTY_RESOURCE_KEY = "resourceKey"; 
	public static final String COMMON_PROPERTY_PARENT_CONTAINER = "parentContainer"; 
	public static final String COMMON_PROPERTY_TYPE = "actionType";
	
	public static final String COMMON_PROPERTY_TYPE_AUTHENTICATOR = "authenticator";
	
	private final Map<String, String> properties;
	
	public TabAction(String resourceKey, String iconClass,
			String url, PermissionType permission, int weight, 
			String enableFunction, String displayFunction) {
		super(resourceKey, iconClass, url, permission, weight, enableFunction, displayFunction);
		this.properties = Collections.emptyMap();
	}
	
	public TabAction(String resourceKey, String iconClass,
			String url, PermissionType permission, int weight, 
			String enableFunction, String displayFunction, Map<String, String> properties) {
		super(resourceKey, iconClass, url, permission, weight, enableFunction, displayFunction);
		this.properties = mapValuesIfRequired(properties == null ? Collections.emptyMap() : properties);
	}
	
	public TabAction(String resourceKey, String iconClass,
			String url, int weight, 
			String enableFunction, String displayFunction, PermissionType... permissions) {
		super(resourceKey, iconClass, url, weight, enableFunction, displayFunction, permissions);
		this.properties = Collections.emptyMap();
	}
	
	public TabAction(String resourceKey, String iconClass,
			String url, int weight, 
			String enableFunction, String displayFunction, Map<String, String> properties, PermissionType... permissions) {
		super(resourceKey, iconClass, url, weight, enableFunction, displayFunction, permissions);
		this.properties = mapValuesIfRequired(properties == null ? Collections.emptyMap() : properties);
		mapValuesIfRequired(this.properties);
	}

	public Map<String, String> getProperties() {
		return properties;
	}
	
	private Map<String, String> mapValuesIfRequired(Map<String, String> properties) {
		
		var map = new HashMap<>(properties);
		
		if (map.containsKey(COMMON_PROPERTY_RESOURCE_KEY)) {
			map.put(COMMON_PROPERTY_PARENT_CONTAINER, String.format("parent_container_tab_action_%s", map.get(COMMON_PROPERTY_RESOURCE_KEY)));
		}
		
		return Map.copyOf(map);
	}

}
