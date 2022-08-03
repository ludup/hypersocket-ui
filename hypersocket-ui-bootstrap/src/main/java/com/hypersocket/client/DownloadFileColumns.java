package com.hypersocket.client;

import com.hypersocket.tables.Column;

public enum DownloadFileColumns implements Column {

	SUBSYSTEM, DESCRIPTION, ICON, URL;

	public String getColumnName() {
		return this.name().toLowerCase();
	}
}