package com.hypersocket.client;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Properties;

import javax.annotation.PostConstruct;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hypersocket.i18n.I18NService;
import com.hypersocket.menus.MenuRegistration;
import com.hypersocket.menus.MenuService;
import com.hypersocket.permissions.PermissionCategory;
import com.hypersocket.permissions.PermissionService;
import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.impl.FileContentHandler;

@Service
public class ClientDownloadServiceImpl implements ClientDownloadService {

	static final String RESOURCE_BUNDLE = "ClientDownloadService";

	static Logger log = LoggerFactory
			.getLogger(ClientDownloadServiceImpl.class);

	File downloadsDir = new File(
			System.getProperty("hypersocket.conf", "conf"), "clients");

	@Autowired
	HypersocketServer server;

	@Autowired
	MenuService menuService;

	@Autowired
	PermissionService permissionService;

	@Autowired
	I18NService i18nService;

	List<DownloadFile> downloads = new ArrayList<DownloadFile>();

	@PostConstruct
	private void postConstruct() {

		i18nService.registerBundle(RESOURCE_BUNDLE);

		PermissionCategory cat = permissionService.registerPermissionCategory(
				RESOURCE_BUNDLE, "category.download");
		
		permissionService.registerPermission(ClientDownloadPermission.DOWNLOAD,
				cat);
		Properties props = new Properties();
		FileInputStream in = null;

		try {
			in = new FileInputStream(new File(downloadsDir,
					"downloads.properties"));
			props.load(in);

			for (Object key : props.keySet()) {

				File downloadFile = new File(downloadsDir, (String) key);
				if (!downloadFile.exists()) {
					log.error(downloadFile.getName() + " does not exist");
					continue;
				}

				String desc = props.getProperty((String) key);
				String icon = "fa-file-o";
				int idx;
				if ((idx = desc.indexOf(';')) > -1) {
					icon = desc.substring(0, idx);
					desc = desc.substring(idx + 1);
				}

				downloads.add(new DownloadFile(downloadFile, icon, desc));
			}

		} catch (IOException e) {
			log.error("Failed to load download list", e);
		} finally {
			IOUtils.closeQuietly(in);
		}

		if (downloads.size() > 0) {
			FileContentHandler contentHandler = new FileContentHandler(
					"clients", 9999, downloadsDir);
			contentHandler.setBasePath("clients");
			server.registerHttpHandler(contentHandler);

			menuService.registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
					"clientDownloads", "fa-download", "clientDownloads", 999,
					ClientDownloadPermission.DOWNLOAD, null,
					ClientDownloadPermission.DOWNLOAD, null),
					MenuService.MENU_MY_RESOURCES);

		}
	}

	@Override
	public Collection<DownloadFile> getDownloads() {
		return downloads;
	}
}
