package com.hypersocket.ui;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Component;

import com.hypersocket.server.handlers.impl.ContentFilter;

@Component
public class IndexPageFilter implements ContentFilter {

	List<String> stylesheets = new ArrayList<String>();
	List<String> scripts = new ArrayList<String>();
	List<MapTokenResolver> additionalResolvers = new ArrayList<MapTokenResolver>();
	List<FilterExtender> extenders = new ArrayList<FilterExtender>();
	Set<String> filterPages = new HashSet<String>();
	
	@PostConstruct
	private void postConstruct() {
		filterPages.add("index.html");
	}
	
	@Override
	public InputStream getFilterStream(InputStream resourceStream, HttpServletRequest request) {
		MapTokenResolver resolver = new MapTokenResolver();
		resolver.addToken("stylesheets", generateStylesheets());
		resolver.addToken("scripts", generateScripts());
		
		for(MapTokenResolver t : additionalResolvers) {
			resolver.addAll(t);
		}
		
		for(FilterExtender extender : extenders) {
			resolver.addAll(extender.getAdditionalResolvers(request));
		}
		
		TokenReplacementReader r = new TokenReplacementReader(new BufferedReader(new InputStreamReader(resourceStream)), resolver);
		return new ReaderInputStream(r, Charset.forName("UTF-8"));
	}

	private String generateScripts() {
		StringBuffer buf = new StringBuffer();
		buf.append("<!-- Plugin scripts -->\r\n");
		for(String s : scripts) {
			buf.append("<script type=\"text/javascript\" src=\"");
			buf.append(s);
			buf.append("\"></script>\r\n");
		}
		return buf.toString();
	}

	private String generateStylesheets() {
		StringBuffer buf = new StringBuffer();
		buf.append("<!-- Plugin stylesheets -->\r\n");
		for(String s : stylesheets) {
			buf.append("<link rel=\"stylesheet\" type=\"text/css\" href=\"");
			buf.append(s);
			buf.append("\" media=\"screen\"/>\r\n");
		}
		return buf.toString();
	}

	@Override
	public boolean filtersPath(String path) {
		return filterPages.contains(path);
	}

	public void addStyleSheet(String stylesheet) {
		stylesheets.add(stylesheet);
	}
	
	public void addScript(String script) {
		scripts.add(script);
	}
	
	public void addResolver(MapTokenResolver resolver) {
		additionalResolvers.add(resolver);
	}
	
	public void addExtender(FilterExtender extender) {
		extenders.add(extender);
	}
	
	public void addPage(String page) {
		filterPages.add(page);
	}

	public void removeExtender(FilterExtender extender) {
		extenders.remove(extender);
	}
}
