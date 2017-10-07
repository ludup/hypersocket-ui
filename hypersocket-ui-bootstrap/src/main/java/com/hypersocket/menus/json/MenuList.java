/*******************************************************************************
 * Copyright (c) 2013 LogonBox Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.menus.json;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import com.hypersocket.menus.Menu;
import com.hypersocket.realm.Realm;

@XmlRootElement(name="menus")
public class MenuList {

	List<Menu> menus = new ArrayList<Menu>();
	boolean isSystemAdmin = false;
	List<Realm> realms;
	
	public MenuList() {
		
	}
	
	public MenuList(List<Menu> modules) {
		 this.menus = modules;
	}
	
	public void addMenu(Menu module) {
		menus.add(module);
	}
	
	@XmlElement(name="menu")
	public List<Menu> getMenus() {
		Collections.sort(menus, new Comparator<Menu>() {

			@Override
			public int compare(Menu o1, Menu o2) {
				return o1.getWeight().compareTo(o2.getWeight());
			}
		});
		return menus;
	}
	
	public boolean isSystemAdmin() {
		return isSystemAdmin;
	}
	
	public void setSystemAdmin(boolean isSystemAdmin) {
		this.isSystemAdmin = isSystemAdmin;
	}
	
	public void setRealms(List<Realm> realms) {
		this.realms = realms;
	}
	
	public List<Realm> getRealms() {
		return realms;
	}
}
