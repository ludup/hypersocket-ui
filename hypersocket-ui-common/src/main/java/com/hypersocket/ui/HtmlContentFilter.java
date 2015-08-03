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
	
	List<ITokenResolver> additionalResolvers = new ArrayList<ITokenResolver>();
	
	String brandCompany = "Hypersocket Limited";
	String companyUrl = "https://www.hypersocket.com/";
	String brandIcon = "/images/favicon.ico";
	String brandImage = "/images/hypersocket.png";
	String supportContact = "support@hypersocket.com";
	String supportName = "Hypersocket Software";
	String supportUrl = "https://helpdesk.hypersocket.com";
	String license = null;
	
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
		resolver.addToken("brandLicense", license);
		resolver.addToken("companyUrl", companyUrl);
		resolver.addToken("supportContact", supportContact);
		resolver.addToken("supportName", supportName);
		resolver.addToken("supportUrl", supportUrl);
		
		if(license!=null) {
			resolver.addToken("license", license);
		}
		
		List<ITokenResolver> resolvers = new ArrayList<ITokenResolver>(additionalResolvers);
		resolvers.add(resolver);
		
		TokenReplacementReader r = new TokenReplacementReader(new BufferedReader(new InputStreamReader(resourceStream)), resolvers);
		return new ReaderInputStream(r, Charset.forName("UTF-8"));
	}

	@Override
	public boolean filtersPath(String path) {
		return path.endsWith(".html") || path.endsWith(".htm");
	}
	
	public void addResolver(ITokenResolver resolver) {
		additionalResolvers.add(resolver);
	}

	public void setCompany(String brandCompany) {
		this.brandCompany = brandCompany;
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
}
