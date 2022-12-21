package com.hypersocket.menus;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.hypersocket.permissions.PermissionType;

@JsonInclude(value = Include.NON_NULL)
public class GroupTableAction extends TableAction {
	
	private String groupName; 
	private List<TableAction> tableActions;
	
	public GroupTableAction(String resourceKey, String groupName, 
			TableAction tableAction, PermissionType permission, int weight, 
			String enableFunction, String displayFunction) {
		this(resourceKey, groupName, List.of(tableAction), permission, weight, enableFunction, displayFunction);
		
	}
	
	public GroupTableAction(String resourceKey, String groupName, 
			List<TableAction> tableActions, PermissionType permission, int weight, 
			String enableFunction, String displayFunction) {
		super(resourceKey, null, null, permission, weight, enableFunction, displayFunction);
		
		this.groupName = groupName;
		this.tableActions = tableActions;
	}
	
	public GroupTableAction(String resourceKey, String groupName, 
			TableAction tableAction, int weight, 
			String enableFunction, String displayFunction, PermissionType... permissions) {
		this(resourceKey, groupName, List.of(tableAction), weight, enableFunction, displayFunction, permissions);
	}
	
	public GroupTableAction(String resourceKey, String groupName, 
			List<TableAction> tableActions, int weight, 
			String enableFunction, String displayFunction, PermissionType... permissions) {
		super(resourceKey, null, null, weight, enableFunction, displayFunction, permissions);
		
		this.groupName = groupName;
		this.tableActions = tableActions;
	}
	
	public String getGroupName() {
		return groupName;
	}

	public void setGroupName(String groupName) {
		this.groupName = groupName;
	}

	public List<TableAction> getTableActions() {
		return tableActions;
	}

	public void setTableActions(List<TableAction> tableActions) {
		this.tableActions = tableActions;
	}
	
	public GroupTableAction copy() {
		return new GroupTableAction(resourceKey, groupName, tableActions == null ? Collections.emptyList() : new ArrayList<>(tableActions), 
				weight, enableFunction, displayFunction, permissions);
	}
	
	public GroupTableAction copyWithEmptyList() {
		return new GroupTableAction(resourceKey, groupName, new ArrayList<>(), 
				weight, enableFunction, displayFunction, permissions);
	}
	
}
