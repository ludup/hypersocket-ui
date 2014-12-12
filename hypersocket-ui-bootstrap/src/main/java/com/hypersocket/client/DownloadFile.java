package com.hypersocket.client;

import java.io.File;

public class DownloadFile {

	String icon;
	String description;
	String filename;
	
	public DownloadFile(File downloadFile, String icon, String description) {
		this.icon = icon;
		this.description = description;
		this.filename = downloadFile.getName();
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
	public String getFilename() {
		return filename;
	}
	public void setFilename(String filename) {
		this.filename = filename;
	}
	
	
}
