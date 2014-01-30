/*******************************************************************************
 * Copyright (c) 2013 Hypersocket Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.ui.jquery;

import java.io.File;
import java.io.FileFilter;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Service;

import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.events.HypersocketServerEvent;
import com.hypersocket.server.events.WebappCreatedEvent;
import com.hypersocket.server.handlers.HttpResponseProcessor;
import com.hypersocket.server.handlers.impl.ClasspathContentHandler;
import com.hypersocket.server.handlers.impl.ContentFilter;
import com.hypersocket.server.handlers.impl.ContentHandler;
import com.hypersocket.server.handlers.impl.ContentHandlerImpl;
import com.hypersocket.server.handlers.impl.FileContentHandler;
import com.hypersocket.util.FileUtils;

@Service
public class JQueryUIContentHandler implements ContentHandler, ApplicationListener<HypersocketServerEvent> {

	static Logger log = LoggerFactory.getLogger(JQueryUIContentHandler.class);

	@Autowired
	protected HypersocketServer server;
	
	@Autowired
	HtmlContentFilter htmlContentFilter;
	
	@Autowired
	IndexPageFilter indexHeaderFilter;
	
	ContentHandlerImpl actualHandler;

	public JQueryUIContentHandler() {
	}

	@PostConstruct
	public void postConstruct() {

		if (Boolean.getBoolean("hypersocket.development")) {

			if (log.isInfoEnabled()) {
				log.info("Installing JQuery UI handler [development mode]");
			}
			
			loadFileHandler();
		} else {

			if (log.isInfoEnabled()) {
				log.info("Installing JQuery UI handler [runtime mode]");
			}

			loadClasspathHandler();
		}

		actualHandler.setServer(server);		
	}
	

	private void loadClasspathHandler() {
		actualHandler = new ClasspathContentHandler("/webapp", 1000);
	}

	private void loadFileHandler() {
		
		FileContentHandler handler = new FileContentHandler("webapp", 1000,
				new File("../ui-jquery/src/main/resources/webapp"));

		File workspace = new File("..");

		for (File module : workspace.listFiles(new FileFilter() {

			@Override
			public boolean accept(File file) {
				return file.isDirectory() && !file.getName().equals("ui-jquery");
			}
		})) {
			File webappFolder = new File(module, "src" + File.separator
					+ "main" + File.separator + "resources"
					+ File.separator + "webapp");
			if(log.isInfoEnabled()) {
				log.info("Checking workspace folder " + webappFolder.getPath());
			}
			if (webappFolder.exists()) {
				if(log.isInfoEnabled()) {
					log.info("Adding JQuery UI content folder " + webappFolder.getPath());
				}
				handler.addBaseDir(webappFolder);
			}
		}

		actualHandler = handler;
		
	}

	@Override
	public String getResourceName() {
		return actualHandler.getResourceName();
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
	public int getResourceStatus(String path) {
		return actualHandler.getResourceStatus(path);
	}

	@Override
	public boolean handlesRequest(HttpServletRequest request) {
		return actualHandler.handlesRequest(request);
	}

	@Override
	public void handleHttpRequest(HttpServletRequest request,
			HttpServletResponse response,
			HttpResponseProcessor responseProcessor) throws IOException {
		actualHandler.handleHttpRequest(request, response, responseProcessor);
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
	public void onApplicationEvent(HypersocketServerEvent event) {
		
		if(event.getResourceKey().equals(WebappCreatedEvent.EVENT_RESOURCE_KEY)) {
			String basePath = FileUtils.checkStartsWithNoSlash(server.getUserInterfacePath());
			
			actualHandler.setBasePath(basePath);
			actualHandler.addAlias("", "redirect:/");
			actualHandler.addAlias("/", "/index.html");

			actualHandler.addFilter(indexHeaderFilter);
			
			// Make sure this is last so that tokens can be used in other filters
			actualHandler.addFilter(htmlContentFilter);
			
			server.addCompressablePath(server.resolvePath(basePath));
			server.registerHttpHandler(actualHandler);
		}
	}

}
