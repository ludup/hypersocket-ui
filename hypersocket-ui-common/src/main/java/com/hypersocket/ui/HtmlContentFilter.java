package com.hypersocket.ui;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.hypersocket.HypersocketVersion;
import com.hypersocket.server.HypersocketServer;
import com.hypersocket.server.handlers.impl.ContentFilter;
import com.hypersocket.servlet.request.Request;
import com.hypersocket.utils.ITokenResolver;
import com.hypersocket.utils.TokenReplacementReader;

@Component
public class HtmlContentFilter implements ContentFilter {

	static Logger log = LoggerFactory.getLogger(HtmlContentFilter.class);
	
	@Autowired
	private HypersocketServer server;

	private List<ITokenResolver> additionalResolvers = new ArrayList<ITokenResolver>();
	private List<FilterExtender> extenders = new ArrayList<FilterExtender>();
	
	private String brandCompany = "LogonBox Limited";
	private String companyUrl = "https://www.logonbox.com/";
	private String brandIcon = "/images/favicon.ico";
	private String brandImage = "/images/logonbox.png";
	private String supportContact = "support@logonbox.com";
	private String supportName = "LogonBox Limited";
	private String supportUrl = "https://www.logonbox.com";
	private String license = null;

	public HtmlContentFilter() throws IOException {
	}

	public void addExtender(FilterExtender extender) {
		extenders.add(extender);
	}
	
	@Override
	public InputStream getFilterStream(InputStream resourceStream, HttpServletRequest request) {

		MapTokenResolver resolver = new MapTokenResolver();
		resolver.addToken("baseUrl", Request.generateBaseUrl(request));
		resolver.addToken("appPath", server.getApplicationPath());
		resolver.addToken("basePath", server.getBasePath());
		resolver.addToken("uiPath", server.getUiPath());
		resolver.addToken("apiPath", server.getApiPath());
		resolver.addToken("appName", server.getApplicationName());
		resolver.addToken("brandImage", brandImage);
		resolver.addToken("brandIcon", brandIcon);
		resolver.addToken("brandCompany", brandCompany);
		resolver.addToken("brandLicense", license);
		resolver.addToken("year", String.valueOf(Calendar.getInstance().get(Calendar.YEAR)));
		resolver.addToken("companyUrl", companyUrl);
		resolver.addToken("supportContact", supportContact);
		resolver.addToken("supportName", supportName);
		resolver.addToken("supportUrl", supportUrl);
		resolver.addToken("stylesheets", "<! -- Removed stylesheets replacement variable -->");
		resolver.addToken("scripts", "<!-- Removed scripts replacement variable -->");
		resolver.addToken("additionalStylesheets", "<!-- Removed additional stylesheets replacement variable -->");
		
		resolver.addToken("version", HypersocketVersion.getVersion());
		
		if (license != null) {
			resolver.addToken("license", license);
		}
		
		for(FilterExtender extender : extenders) {
			MapTokenResolver rez = extender.getAdditionalResolvers(request);
			if(rez != null)
				resolver.addAll(rez);
		}

		List<ITokenResolver> resolvers = new ArrayList<ITokenResolver>(additionalResolvers);
		resolvers.add(resolver);

		TokenReplacementReader r = new TokenReplacementReader(
				new BufferedReader(new InputStreamReader(resourceStream)),
					resolvers);
		return new ReaderInputStream(new TokenReplacementReader(r,
				resolvers), Charset.forName("UTF-8"));
	}

	@Override
	public boolean filtersPath(String path) {
		return path.endsWith(".html") 
				|| path.endsWith(".htm") 
				|| path.endsWith(".js") 
				|| path.endsWith(".css");
	}

	public void addResolver(ITokenResolver resolver) {
		additionalResolvers.add(resolver);
	}

	public void setCompany(String brandCompany) {
		this.brandCompany = brandCompany;
	}
	
	public String getCompany() {
		return brandCompany;
	}

	public void setCompanyUrl(String companyUrl) {
		this.companyUrl = companyUrl;
	}

	public void setIcon(String brandIcon) {
		this.brandIcon = brandIcon;
	}

	public void setImage(String brandImage) {
		this.brandImage = brandImage;
	}

	public void setSupportContact(String supportContact) {
		this.supportContact = supportContact;
	}

	public void setSupportName(String supportName) {
		this.supportName = supportName;
	}

	public void setSupportUrl(String supportUrl) {
		this.supportUrl = supportUrl;
	}

	public void setLicense(String license) {
		this.license = license;
	}

	@Override
	public Integer getWeight() {
		return Integer.MAX_VALUE;
	}

	public void removeExtender(FilterExtender extender) {
		extenders.remove(extender);
	}
}
