package com.hypersocket.ui;

import java.io.IOException;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.hypersocket.config.SystemConfigurationService;
import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.HttpRequestHandler;
import com.hypersocket.server.handlers.HttpResponseProcessor;

@Component
public class RobotsTxtHandler extends HttpRequestHandler {

	@Autowired
	private HypersocketServer server; 
	
	@Autowired
	private SystemConfigurationService configurationService;
	
	public RobotsTxtHandler() {
		super("robots.txt", Integer.MAX_VALUE-1);
	}
	
	@PostConstruct
	public void postConstruct() {
		server.registerHttpHandler(this);
	}

	@Override
	public boolean handlesRequest(HttpServletRequest request) {
		return request.getRequestURI().equals("/robots.txt");
	}

	@Override
	public void handleHttpRequest(HttpServletRequest request,
			HttpServletResponse response,
			HttpResponseProcessor responseProcessor) throws IOException {
		
		response.setContentType("text/plain; charset=UTF-8");
		
		byte[] b = configurationService.getValue("server.robotsTxt").getBytes("UTF-8");
		response.setContentLength(b.length);
		response.getOutputStream().write(b);
		
		responseProcessor.sendResponse(request, response);
	}

	@Override
	public boolean getDisableCache() {
		return false;
	}
}
