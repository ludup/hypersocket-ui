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
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hypersocket.auth.AbstractAuthenticatedServiceImpl;
import com.hypersocket.i18n.I18NService;
import com.hypersocket.json.version.HypersocketVersion;
import com.hypersocket.menus.MenuRegistration;
import com.hypersocket.menus.MenuService;
import com.hypersocket.permissions.AccessDeniedException;
import com.hypersocket.permissions.PermissionCategory;
import com.hypersocket.permissions.PermissionService;
import com.hypersocket.permissions.Role;
import com.hypersocket.realm.Realm;
import com.hypersocket.realm.RealmAdapter;
import com.hypersocket.realm.RealmService;
import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.impl.FileContentHandler;
import com.hypersocket.tables.ColumnSort;
import com.hypersocket.tables.Sort;
import com.hypersocket.utils.HypersocketUtils;

@Service
public class ClientDownloadServiceImpl extends AbstractAuthenticatedServiceImpl implements ClientDownloadService {

	static final String RESOURCE_BUNDLE = "ClientDownloadService";

	static Logger log = LoggerFactory.getLogger(ClientDownloadServiceImpl.class);

	private File downloadsDir = new File(HypersocketUtils.getConfigDir(), "clients");

	@Autowired
	private HypersocketServer server;

	@Autowired
	private MenuService menuService;

	@Autowired
	private PermissionService permissionService;

	@Autowired
	private I18NService i18nService;

	@Autowired
	private RealmService realmService;

	private List<DownloadFile> userDownloads = new ArrayList<DownloadFile>();
	private List<DownloadFile> adminDownloads = new ArrayList<DownloadFile>();

	@PostConstruct
	private void postConstruct() {

		i18nService.registerBundle(RESOURCE_BUNDLE);

		PermissionCategory cat = permissionService.registerPermissionCategory(RESOURCE_BUNDLE, "category.download");

		permissionService.registerPermission(ClientDownloadPermission.DOWNLOAD, cat);

		try {
			if (Boolean.getBoolean("hypersocket.customDownloads")) {
				loadUserDownloads(new FileInputStream(new File(downloadsDir, "downloads.properties")));
			}
		} catch (IOException ex) {
		}

		try {
			Enumeration<URL> urls = getClass().getClassLoader().getResources("downloads.properties");
			if (urls != null) {
				while (urls.hasMoreElements()) {
					URL url = urls.nextElement();
					loadUserDownloads(url.openStream());
				}
			}
		} catch (IOException ex) {
			log.error("There are no downloads.proeprties in the classpath", ex);
		}

		try {
			Enumeration<URL> urls = getClass().getClassLoader().getResources("adminDownloads.properties");
			if (urls != null) {
				while (urls.hasMoreElements()) {
					URL url = urls.nextElement();
					loadAdminDownloads(url.openStream());
				}
			}
		} catch (IOException ex) {
			log.error("There are no adminDownloads.proeprties in the classpath", ex);
		}

		if (userDownloads.size() > 0 || adminDownloads.size() > 0) {
			FileContentHandler contentHandler = new FileContentHandler("clients", 9999, downloadsDir) {
				public String getBasePath() {
					return "clients";
				}

				@Override
				public boolean getDisableCache() {
					return true;
				}
			};

			server.registerHttpHandler(contentHandler);

			menuService.registerMenu(new MenuRegistration(RESOURCE_BUNDLE, "clientDownloads", "fa-download",
					"clientDownloads", 999, null, null, null, null) {
				@Override
				public boolean canRead() {
					if (permissionService.hasAdministrativePermission(getCurrentPrincipal())) {
						return !userDownloads.isEmpty() || !adminDownloads.isEmpty();
					} else {
						if (permissionService.hasPermission(getCurrentPrincipal(), ClientDownloadPermission.DOWNLOAD))
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
					permissionService.grantPermission(everyone,
							permissionService.getPermission(ClientDownloadPermission.DOWNLOAD.getResourceKey()));
					realmService.setRealmProperty(realm, "realm.processedClientPermission", "true");
				} catch (Throwable e) {
					log.error(
							"Failed to assign client download permission to Everyone role in realm " + realm.getName(),
							e);
				}
			}

			@Override
			public boolean hasCreatedDefaultResources(Realm realm) {
				return realmService.getRealmPropertyBoolean(realm, "realm.processedClientPermission");
			}

		});

		/*
		 * Because we do not want the client to be held up downloading dynamic
		 * extensions, start downloading
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
			while ((line = reader.readLine()) != null) {

				if (line.startsWith("#")) {
					continue;
				}
				String[] items = line.split(";");

				if (items.length < 4) {
					continue;
				}
				String url = items[0];

				url = url.replace("${version}", HypersocketVersion.getVersion());

				String icon = items[1];
				String desc = items[2];
				String subsystem = items[3];

				downloads.add(new DownloadFile(new URL(url), icon, subsystem, desc));
			}
		} catch (IOException e) {
			log.error("Failed to load download list", e);
		} finally {
			IOUtils.closeQuietly(in);
		}
	}

	@Override
	public Collection<DownloadFile> getDownloads() {
		if (permissionService.hasAdministrativePermission(getCurrentPrincipal())) {
			List<DownloadFile> downloads = new ArrayList<DownloadFile>();
			downloads.addAll(adminDownloads);
			downloads.addAll(userDownloads);
			return downloads;
		} else {
			return userDownloads;
		}
	}

	@SuppressWarnings("unchecked")
	@Override
	public List<DownloadFile> searchResources(Realm currentRealm, String searchColumn, String searchPattern, int start,
			int length, ColumnSort[] sorting) throws AccessDeniedException {
		var l = getDownloads().stream().filter(r -> r.matches(searchPattern, searchColumn)).sorted((o1, o2) -> {
			for (ColumnSort s : checkForDefaultSorting(sorting)) {
				int i = 0;
				Comparable<?> v1 = o1.getDescription();
				Comparable<?> v2 = o2.getDescription();
				if (s.getColumn() == DownloadFileColumns.SUBSYSTEM) {
					v1 = o1.getSubsystem() == null ? null : o1.getSubsystem().toLowerCase();
					v2 = o2.getSubsystem() == null ? null : o2.getSubsystem().toLowerCase();
				} else if (s.getColumn() == DownloadFileColumns.DESCRIPTION) {
					v1 = o1.getDescription() == null ? null : o1.getDescription().toLowerCase();
					v2 = o2.getDescription() == null ? null : o2.getDescription().toLowerCase();
				} else if (s.getColumn() == DownloadFileColumns.ICON) {
					v1 = o1.getIcon();
					v2 = o2.getIcon();
				}else if (s.getColumn() == DownloadFileColumns.URL) {
					v1 = o1.getURL() == null ? null : o1.getURL().toExternalForm();
					v2 = o2.getURL() == null ? null : o2.getURL().toExternalForm();
				}
				if (v1 == null && v2 != null)
					i = -1;
				else if (v2 == null && v1 != null)
					i = 1;
				else if (v2 != null && v1 != null) {
					i = (((Comparable<Object>) v1).compareTo(v2));
				}
				if (i != 0) {
					return s.getSort() == Sort.ASC ? i * -1 : i;
				}
			}
			return 0;
		}).collect(Collectors.toList());
		return l.subList(Math.min(l.size(), start), Math.min(l.size(), start + length));
	}

	protected ColumnSort[] checkForDefaultSorting(ColumnSort[] sorting) {
		if(sorting.length == 0) {
			sorting = new ColumnSort[] { new ColumnSort(DownloadFileColumns.SUBSYSTEM, Sort.ASC), new ColumnSort(DownloadFileColumns.ICON, Sort.ASC) };
		}
		return sorting;
	}

	@Override
	public Long getResourceCount(Realm currentRealm, String searchColumn, String searchPattern)
			throws AccessDeniedException {
		return getDownloads().stream().filter(r -> r.matches(searchPattern, searchColumn)).count();
	}
}
