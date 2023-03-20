/*******************************************************************************
 * Copyright (c) 2013 LogonBox Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.ui;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.StringTokenizer;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hypersocket.i18n.I18NService;
import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.impl.ClasspathContentHandler;
import com.hypersocket.server.handlers.impl.ContentFilter;
import com.hypersocket.server.handlers.impl.ContentHandler;
import com.hypersocket.server.handlers.impl.ContentHandlerImpl;
import com.hypersocket.server.handlers.impl.ContentHandlerImpl.CSPFilter;
import com.hypersocket.server.handlers.impl.FileContentHandler;
import com.hypersocket.server.handlers.impl.RedirectException;
import com.hypersocket.utils.FileUtils;

@Service
public class UserInterfaceContentHandler implements ContentHandler {

	static Logger log = LoggerFactory.getLogger(UserInterfaceContentHandler.class);

	@Autowired
	protected HypersocketServer server;
	
	@Autowired
	private HtmlContentFilter htmlContentFilter;
	
	@Autowired
	private IncludeContentFilter includeContentFilter;
	
	@Autowired
	private IndexPageFilter indexHeaderFilter;
	
	@Autowired
	private I18NService i18nService; 
	
	private ContentHandlerImpl actualHandler;

	public UserInterfaceContentHandler() {
	}

	@PostConstruct
	public void postConstruct() {

		if (Boolean.getBoolean("hypersocket.development")) {

			if (log.isInfoEnabled()) {
				log.info("Installing UI handler [development mode]");
			}
			
			loadFileHandler();
			
			if(actualHandler == null) {
				log.warn("Running as developer mode, but didn't find any webapp sources from the discovered CLASSPATH. Attempting to fall-back to loading webapp from a Jar");
			}
		} 

		if (log.isInfoEnabled()) {
			log.info("Installing UI handler [runtime mode]");
		}

		loadClasspathHandler();
		if(actualHandler == null) {
			throw new RuntimeException("Could not find any webapps.");
		}

		i18nService.registerBundle("ui");
		
		actualHandler.setServer(server);	

		actualHandler.addAlias("", "redirect:/");
		actualHandler.addAlias("/", "/index.html");
		actualHandler.addAlias("/home", "/index.html");

		actualHandler.addFilter(indexHeaderFilter);
		actualHandler.addFilter(htmlContentFilter);
		actualHandler.addFilter(includeContentFilter);
		
		server.addCompressablePath(server.getUiPath());
		server.registerHttpHandler(actualHandler);
		
		actualHandler.addDynamicPage("content/password.html");
		actualHandler.addDynamicPage("content/roleAttributes.html");
		actualHandler.addDynamicPage("content/roleAttributeTabs.html");
		actualHandler.addDynamicPage("content/suspendUser.html");
		actualHandler.addDynamicPage("content/userAttributes.html");
		actualHandler.addDynamicPage("content/userAttributeTabs.html");
		actualHandler.addDynamicPage("content/users.html");
	}
	

	private void loadClasspathHandler() {
		actualHandler = new ClasspathContentHandler("/webapp", 1000) {
			public String getBasePath() {
				return FileUtils.checkStartsWithNoSlash(server.getUserInterfacePath());
			}
		};
	}

	private void loadFileHandler() {
		
		StringTokenizer t = new StringTokenizer(System.getProperty("java.class.path"), File.pathSeparator);
		
		FileContentHandler handler = null;
		
		while(t.hasMoreTokens()) {
			String path = FileUtils.checkEndsWithNoSlash(t.nextToken());
			if(path.endsWith(File.separator + "target" + File.separator + "classes")) {
				
				path = path.substring(0, path.length()- 15);
				
				File webappFolder = new File(path, "src" + File.separator
						+ "main" + File.separator + "resources"
						+ File.separator + "webapp");
				if(log.isDebugEnabled()) {
					log.debug("Checking workspace folder " + webappFolder.getPath());
				}
				if (webappFolder.exists()) {
					if(log.isDebugEnabled()) {
						log.debug("Adding JQuery UI content folder " + webappFolder.getPath());
					}
					if(handler==null) {
						handler = new FileContentHandler("webapp", 1000,
								webappFolder) {
							public String getBasePath() {
								return FileUtils.checkStartsWithNoSlash(server.getUserInterfacePath());
							}
							@Override
							public boolean getDisableCache() {
								return false;
							}
						};
					} else {
						handler.addBaseDir(webappFolder);
					}
				}
			}
		}

		actualHandler = handler;
		
	}

	@Override
	public String getResourceName() {
		return actualHandler.getResourceName();
	}

	@Override
	public boolean hasAlias(String alias) {
		return actualHandler.hasAlias(alias);
	}
	
	@Override
	public InputStream getResourceStream(String path)
			throws FileNotFoundException {
		return actualHandler.getResourceStream(path);
	}

	@Override
	public long getResourceLength(String path) throws FileNotFoundException {
		return actualHandler.getResourceLength(path);
	}

	@Override
	public long getLastModified(String path) throws FileNotFoundException {
		return actualHandler.getLastModified(path);
	}

	@Override
	public int getResourceStatus(String path) throws RedirectException {
		return actualHandler.getResourceStatus(path);
	}

	@Override
	public boolean handlesRequest(HttpServletRequest request) {
		return actualHandler.handlesRequest(request);
	}

	@Override
	public void handleHttpRequest(HttpServletRequest request,
			HttpServletResponse response) throws IOException {
		actualHandler.handleHttpRequest(request, response);
	}

	@Override
	public void addAlias(String alias, String path) {
		actualHandler.addAlias(alias, path);
	}

	@Override
	public void addFilter(ContentFilter filter) {
		actualHandler.addFilter(filter);
	}

	@Override
	public void removeAlias(String alias) {
		actualHandler.removeAlias(alias);
	}

	@Override
	public void addDynamicPage(String path) {
		actualHandler.addDynamicPage(path);
	}

	@Override
	public void addCSPFilter(CSPFilter filter) {
		actualHandler.addCSPFilter(filter);
	}

}
