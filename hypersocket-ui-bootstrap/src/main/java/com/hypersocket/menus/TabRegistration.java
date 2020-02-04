package com.hypersocket.menus;

import com.hypersocket.permissions.PermissionType;

public class TabRegistration {

    private String resourceKey;
    private String url;
    private PermissionType permission;
    private int weight;

    public TabRegistration() {
    }

    public TabRegistration(String resourceKey, String url, PermissionType permission, int weight) {
        this.resourceKey = resourceKey;
        this.url = url;
        this.permission = permission;
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

    public PermissionType getPermission() {
        return permission;
    }

    public void setPermission(PermissionType permission) {
        this.permission = permission;
    }

    public int getWeight() {
        return weight;
    }

    public void setWeight(int weight) {
        this.weight = weight;
    }

    public boolean canRead() {
        return true;
    }
}
