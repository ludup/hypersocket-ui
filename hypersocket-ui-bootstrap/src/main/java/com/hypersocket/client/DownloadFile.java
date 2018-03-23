package com.hypersocket.client;

import java.net.URL;

public class DownloadFile {

	String subsystem;
	String icon;
	String description;
	URL url;
	
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
	
	
}
