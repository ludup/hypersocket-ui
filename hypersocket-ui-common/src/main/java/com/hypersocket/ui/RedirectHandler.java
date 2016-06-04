/*******************************************************************************
 * Copyright (c) 2013 Hypersocket Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.ui;

import java.io.IOException;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpHeaders;
import org.apache.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.HttpRequestHandler;
import com.hypersocket.server.handlers.HttpResponseProcessor;

@Component
public class RedirectHandler extends HttpRequestHandler {
	
	@Autowired
	HypersocketServer server; 
	
	public RedirectHandler() {
		super("redirect", Integer.MAX_VALUE);
	}
	
	@PostConstruct
	public void postConstruct() {
		server.registerHttpHandler(this);
	}
	
	@Override
	public boolean handlesRequest(String request) {
		return request.equals("")
				|| request.equals("/")
				|| request.equals(server.getBasePath())
				|| request.equals(server.getBasePath() + "/");
	}

	@Override
	public void handleHttpRequest(HttpServletRequest request,
			HttpServletResponse response,
			HttpResponseProcessor responseProcessor) throws IOException {

		response.setHeader(HttpHeaders.LOCATION, server.resolvePath(server.getUserInterfacePath()));
		response.sendError(HttpStatus.SC_MOVED_TEMPORARILY);
		responseProcessor.sendResponse(request, response, false);

	}

}
