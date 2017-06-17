package com.hypersocket.menus;

public class Tab {

    String resourceKey;
    String url;
    boolean readOnly;
    int weight;
    
    public Tab() {
    }

    public Tab(String resourceKey, String url, boolean readOnly, int weight) {
        this.resourceKey = resourceKey;
        this.url = url;
        this.readOnly = readOnly;
        this.weight = weight;
    }

    public String getResourceKey() {
        return resourceKey;
    }

    public void setResourceKey(String resourceKey) {
        this.resourceKey = resourceKey;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean isReadOnly() {
        return readOnly;
    }
    
    public void setReadOnly(boolean readOnly) {
    	this.readOnly = readOnly;
    }

	public int getWeight() {
		return weight;
	}

	public void setWeight(int weight) {
		this.weight = weight;
	}
    
    
}
