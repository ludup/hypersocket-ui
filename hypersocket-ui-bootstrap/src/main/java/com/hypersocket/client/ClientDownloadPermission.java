package com.hypersocket.client;

import com.hypersocket.permissions.PermissionType;

public enum ClientDownloadPermission implements PermissionType {

	DOWNLOAD("client.download");

	private final String val;
	private PermissionType[] implies;

	private ClientDownloadPermission(final String val, PermissionType... implies) {
		this.val = val;
		this.implies = implies;
	}

	@Override
	public PermissionType[] impliesPermissions() {
		return implies;
	}

	public String toString() {
		return val;
	}

	@Override
	public String getResourceKey() {
		return val;
	}

	@Override
	public boolean isSystem() {
		return false;
	}

	@Override
	public boolean isHidden() {
		return false;
	}
}
