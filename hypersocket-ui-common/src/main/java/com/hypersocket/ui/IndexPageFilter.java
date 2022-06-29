package com.hypersocket.ui;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.impl.ContentFilter;
import com.hypersocket.server.handlers.impl.RedirectException;
import com.hypersocket.utils.ITokenResolver;
import com.hypersocket.utils.TokenReplacementReader;

@Component
public class IndexPageFilter implements ContentFilter {

	private List<String> stylesheets = new ArrayList<String>();
	private List<String> scripts = new ArrayList<String>();
	private List<ITokenResolver> additionalResolvers = new ArrayList<ITokenResolver>();
	private List<FilterExtender> extenders = new ArrayList<FilterExtender>();
	private Set<String> filterPages = new HashSet<String>();
	private String redirectPage =  null;
	
	@Autowired
	private HypersocketServer server;
	
	@PostConstruct
	private void postConstruct() {
		filterPages.add("index.html");
	}
	
	@Override
	public InputStream getFilterStream(InputStream resourceStream, HttpServletRequest request) throws RedirectException {
		return getFilterStream(resourceStream, request, new ITokenResolver[0]);
	}
	@Override
	public InputStream getFilterStream(InputStream resourceStream, HttpServletRequest request, ITokenResolver... additionalResolvers2) throws RedirectException {
		
		String uri = request.getRequestURI();

		if(request.getAttribute(HypersocketServer.BROWSER_URI) == null && redirectPage!=null && !server.isAliasFor(redirectPage, uri)) {
			String redirectUri = redirectPage.replace("${apiPath}", server.getApiPath());
			redirectUri = redirectPage.replace("${uiPath}", server.getUiPath());
			redirectUri = redirectPage.replace("${basePath}", server.getBasePath());
			
			if(redirectUri!=null && !redirectUri.startsWith("/")) {
				redirectUri = server.getUiPath() + "/" + redirectUri;
			}
			if(redirectUri!=null && !uri.equals(redirectUri)) {
				throw new RedirectException(redirectUri);
			}
		}
		
		MapTokenResolver resolver = new MapTokenResolver();
		resolver.addToken("stylesheets", generateStylesheets());
		resolver.addToken("scripts", generateScripts());
		
		boolean hasMeta = false;

		// Use new list so we don't get concurrent modification in branding when theme is switched off
		for(FilterExtender extender : new ArrayList<>(extenders)) {
			MapTokenResolver res = extender.getAdditionalResolvers(request);
			if(res != null) {
				resolver.addAll(res);
				if(res.hasToken("meta")) {
					hasMeta = true;
				}
			}
		}
		
		if(!hasMeta)
			resolver.addToken("meta", "<!-- No Meta -->");
		
		
		List<ITokenResolver> resolvers = new ArrayList<ITokenResolver>(additionalResolvers);
		resolvers.add(resolver);
		resolvers.addAll(Arrays.asList(additionalResolvers2));
		
		TokenReplacementReader r = new TokenReplacementReader(new BufferedReader(new InputStreamReader(resourceStream)), resolvers);
		return new ReaderInputStream(r, Charset.forName("UTF-8"));
	}
	
	public void setRedirectPage(String redirectPage) {
		this.redirectPage = redirectPage;
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
	
	public void addResolver(ITokenResolver resolver) {
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

	@Override
	public Integer getWeight() {
		return 0;
	}

	public void removePage(String page) {
		filterPages.remove(page);
	}

	@Override
	public List<ITokenResolver> getResolvers(HttpServletRequest request) {
		return additionalResolvers;
	}
}
