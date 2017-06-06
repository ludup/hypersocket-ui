package com.hypersocket.menus;

public interface MenuFilter {

	boolean isVisible(MenuRegistration m);

	Integer getWeight();
}
