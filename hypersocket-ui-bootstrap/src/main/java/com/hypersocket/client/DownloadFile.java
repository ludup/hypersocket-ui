package com.hypersocket.client;

import java.net.URL;

public class DownloadFile {

	String icon;
	String description;
	URL url;
	
	public DownloadFile(URL url, String icon, String description) {
		this.icon = icon;
		this.description = description;
		this.url = url;
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
	
	
}
