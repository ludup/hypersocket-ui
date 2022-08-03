package com.hypersocket.client;

import java.net.URL;

import org.apache.commons.lang3.StringUtils;

public class DownloadFile {

	private String subsystem;
	private String icon;
	private String description;
	private URL url;

	public DownloadFile(URL url, String icon, String subsystem, String description) {
		this.icon = icon;
		this.description = description;
		this.url = url;
		this.subsystem = subsystem;
	}

	public DownloadFile() {
	}

	public String getIcon() {
		return icon;
	}

	public void setIcon(String icon) {
		this.icon = icon;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public URL getURL() {
		return url;
	}

	public String getSubsystem() {
		return subsystem;
	}

	public void setSubsystem(String subsystem) {
		this.subsystem = subsystem;
	}

	public boolean matches(String searchPattern, String searchColumn) {
		if ((StringUtils.isBlank(searchColumn) || searchColumn.equals(DownloadFileColumns.DESCRIPTION.getColumnName())
				&& matchesString(description, searchPattern)))
			return true;

		if ((StringUtils.isBlank(searchColumn) || searchColumn.equals(DownloadFileColumns.SUBSYSTEM.getColumnName())
				&& matchesString(subsystem, searchPattern)))
			return true;

		if ((StringUtils.isBlank(searchColumn) || searchColumn.equals(DownloadFileColumns.ICON.getColumnName())
				&& matchesString(icon, searchPattern)))
			return true;

		if ((StringUtils.isBlank(searchColumn) || searchColumn.equals(DownloadFileColumns.URL.getColumnName())
				&& matchesString(url == null ? null : url.toExternalForm(), searchPattern)))
			return true;
		return false;
	}

	private boolean matchesString(String text, String pattern) {
		return StringUtils.isNotBlank(text) && text.toLowerCase().contains(pattern.toLowerCase());
	}
}
