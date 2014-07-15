package com.hypersocket.ui;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.impl.ContentFilter;

@Component
public class HtmlContentFilter implements ContentFilter {

	@Autowired
	HypersocketServer server;
	
	List<MapTokenResolver> additionalResolvers = new ArrayList<MapTokenResolver>();
	
	String brandCompany = "Hypersocket Limited";
	String brandIcon = "/images/favicon.ico";
	String brandImage = "/images/hypersocket.png";
	
	public HtmlContentFilter() {
	}
	
	@Override
	public InputStream getFilterStream(InputStream resourceStream, HttpServletRequest request) {
		
		MapTokenResolver resolver = new MapTokenResolver();
		resolver.addToken("appPath", server.getApplicationPath());
		resolver.addToken("uiPath", server.getUiPath());
		resolver.addToken("apiPath", server.getApiPath());
		resolver.addToken("appName", server.getApplicationName());
		resolver.addToken("brandImage", brandImage);
		resolver.addToken("brandIcon", brandIcon);
		resolver.addToken("brandCompany", brandCompany);
		
		for(MapTokenResolver t : additionalResolvers) {
			resolver.addAll(t);
		}
		
		TokenReplacementReader r = new TokenReplacementReader(new BufferedReader(new InputStreamReader(resourceStream)), resolver);
		return new ReaderInputStream(r, Charset.forName("UTF-8"));
	}

	@Override
	public boolean filtersPath(String path) {
		return path.endsWith(".html") || path.endsWith(".htm");
	}
	
	public void addResolver(MapTokenResolver resolver) {
		additionalResolvers.add(resolver);
	}

	public void setCompany(String brandCompany) {
		this.brandCompany = brandCompany;
	}
	
	public void setIcon(String brandIcon) {
		this.brandIcon = brandIcon;
	}
	
	public void setImage(String brandImage) {
		this.brandImage = brandImage;
	}
}
