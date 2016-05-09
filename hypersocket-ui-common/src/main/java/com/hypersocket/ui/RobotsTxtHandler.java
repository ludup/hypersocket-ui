package com.hypersocket.ui;

import java.io.IOException;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.HttpRequestHandler;
import com.hypersocket.server.handlers.HttpResponseProcessor;

@Component
public class RobotsTxtHandler extends HttpRequestHandler {

	@Autowired
	HypersocketServer server; 
	
	String robotsTxt = "User-agent: *\r\nDisallow: /\r\n";
	
	public RobotsTxtHandler() {
		super("robots.txt", Integer.MAX_VALUE-1);
	}
	
	@PostConstruct
	public void postConstruct() {
		server.registerHttpHandler(this);
	}
	
	public void setRobotsTxt(String robotsTxt) {
		this.robotsTxt = robotsTxt;
	}

	@Override
	public boolean handlesRequest(String path) {
		return path.equals("/robots.txt");
	}

	@Override
	public void handleHttpRequest(HttpServletRequest request,
			HttpServletResponse response,
			HttpResponseProcessor responseProcessor) throws IOException {
		
		response.setContentType("text/plain; charset=UTF-8");
		
		byte[] b = robotsTxt.getBytes("UTF-8");
		response.setContentLength(b.length);
		response.getOutputStream().write(b);
		
		responseProcessor.sendResponse(request, response, false);
	}

}
