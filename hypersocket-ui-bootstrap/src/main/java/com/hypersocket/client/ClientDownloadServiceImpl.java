package com.hypersocket.client;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Enumeration;
import java.util.List;

import javax.annotation.PostConstruct;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hypersocket.HypersocketVersion;
import com.hypersocket.auth.AbstractAuthenticatedServiceImpl;
import com.hypersocket.i18n.I18NService;
import com.hypersocket.menus.MenuRegistration;
import com.hypersocket.menus.MenuService;
import com.hypersocket.permissions.PermissionCategory;
import com.hypersocket.permissions.PermissionService;
import com.hypersocket.permissions.Role;
import com.hypersocket.realm.Realm;
import com.hypersocket.realm.RealmAdapter;
import com.hypersocket.realm.RealmService;
import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.impl.FileContentHandler;
import com.hypersocket.upgrade.UpgradeService;

@Service
public class ClientDownloadServiceImpl extends AbstractAuthenticatedServiceImpl implements ClientDownloadService {

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

	@Autowired
	UpgradeService upgradeService; 
	
	@Autowired
	RealmService realmService;
	
	List<DownloadFile> userDownloads = new ArrayList<DownloadFile>();
	List<DownloadFile> adminDownloads = new ArrayList<DownloadFile>();
	
	@PostConstruct
	private void postConstruct() {

		i18nService.registerBundle(RESOURCE_BUNDLE);

		PermissionCategory cat = permissionService.registerPermissionCategory(
				RESOURCE_BUNDLE, "category.download");
		
		permissionService.registerPermission(ClientDownloadPermission.DOWNLOAD,
				cat);
		
		try {
			if(Boolean.getBoolean("hypersocket.customDownloads")) {
				loadUserDownloads(new FileInputStream(new File(downloadsDir,"downloads.properties")));
			}
		} catch(IOException ex) {
		}
		
		try {
			Enumeration<URL> urls = getClass().getClassLoader().getResources("downloads.properties");
			if(urls!=null) {
				while(urls.hasMoreElements()) {	
					URL url = urls.nextElement();
					loadUserDownloads(url.openStream());
				}
			}
		} catch(IOException ex) { 
			log.error("There are no downloads.proeprties in the classpath", ex);
		}
		
		try {
			Enumeration<URL> urls = getClass().getClassLoader().getResources("adminDownloads.properties");
			if(urls!=null) {
				while(urls.hasMoreElements()) {	
					URL url = urls.nextElement();
					loadAdminDownloads(url.openStream());
				}
			}
		} catch(IOException ex) { 
			log.error("There are no adminDownloads.proeprties in the classpath", ex);
		}

		if (userDownloads.size() > 0 || adminDownloads.size() > 0) {
			FileContentHandler contentHandler = new FileContentHandler(
					"clients", 9999, downloadsDir) {
				public String getBasePath() {
					return "clients";
				}
				@Override
				public boolean getDisableCache() {
					return true;
				}
			};

			server.registerHttpHandler(contentHandler);

			menuService.registerMenu(new MenuRegistration(RESOURCE_BUNDLE,
					"clientDownloads", "fa-download", "clientDownloads", 999,
					null, null, null, null) {
				@Override
				public boolean canRead() {
					if(permissionService.hasAdministrativePermission(getCurrentPrincipal())) {
						return !userDownloads.isEmpty() || !adminDownloads.isEmpty();
					} else {
						if(permissionService.hasPermission(getCurrentPrincipal(), 
								ClientDownloadPermission.DOWNLOAD))
						return !userDownloads.isEmpty();
					}
					return false;
				}
			}, MenuService.MENU_NAV);

		}
		
		realmService.registerRealmListener(new RealmAdapter() {

			@Override
			public void onCreateRealm(Realm realm) {
				
				try {
					Role everyone = permissionService.getRole(PermissionService.ROLE_EVERYONE, realm);
					permissionService.grantPermission(everyone, permissionService.getPermission(ClientDownloadPermission.DOWNLOAD.getResourceKey()));
					realmService.setRealmProperty(realm, "realm.processedClientPermission", "true");
				} catch (Throwable e) {
					log.error("Failed to assign client download permission to Everyone role in realm " + realm.getName(), e);
				}
			}

			@Override
			public boolean hasCreatedDefaultResources(Realm realm) {
				return realmService.getRealmPropertyBoolean(realm, "realm.processedClientPermission");
			}
			
		});
		
		/* 
		 * Because we do not want the client to be held up downloading dynamic extensions, start downloading
		 * 
		 */
	}

	private void loadUserDownloads(InputStream in) {
		loadDownloads(in, userDownloads);
	}
	
	private void loadAdminDownloads(InputStream in) {
		loadDownloads(in, adminDownloads);
	}
		
	private void loadDownloads(InputStream in, List<DownloadFile> downloads) {
		BufferedReader reader = null;
		
		try {
			reader = new BufferedReader(new StringReader(IOUtils.toString(in)));
			String line;
			while((line = reader.readLine())!=null) {
	
				if(line.startsWith("#")) {
					continue;
				}
				int idx = line.indexOf('=');
				if(idx==-1) {
					log.error("Invalid properties line " + line);
					continue;
				}
				String url = line.substring(0,idx);
				String desc = line.substring(idx+1);
				url = url.replace("${version}", HypersocketVersion.getVersion());
				
	
				String icon = "fa-file-o";
				if ((idx = desc.indexOf(';')) > -1) {
					icon = desc.substring(0, idx);
					desc = desc.substring(idx + 1);
				}
	
				downloads.add(new DownloadFile(new URL(url), icon, desc));
			}
		} catch (IOException e) {
			log.error("Failed to load download list", e);
		} finally {
			IOUtils.closeQuietly(in);
		}
	}
	
	@Override
	public Collection<DownloadFile> getDownloads() {
		if(permissionService.hasAdministrativePermission(getCurrentPrincipal())) {
			List<DownloadFile> downloads = new ArrayList<DownloadFile>();
			downloads.addAll(adminDownloads);
			downloads.addAll(userDownloads);
			return downloads;
		} else {
			return userDownloads;
		}
	}
}
