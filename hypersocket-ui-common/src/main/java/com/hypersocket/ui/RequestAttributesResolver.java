package com.hypersocket.ui;

import java.util.Map;
import java.util.Objects;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;

import com.hypersocket.utils.ITokenResolver;

public class RequestAttributesResolver implements ITokenResolver {

	HttpServletRequest request;
	
	public RequestAttributesResolver(HttpServletRequest request) {
		this.request = request;
	}
	
	@Override
	public String resolveToken(String tokenName) {
		if(tokenName.startsWith("request.")) {
			if(tokenName.startsWith("request.session.")) {
				String token = StringUtils.substring(tokenName, 16);
				Object val = request.getSession().getAttribute(token);
				if(Objects.nonNull(val)) {
					return val.toString();
				}
			} else {
				String token = StringUtils.substring(tokenName, 8);
				Object val = request.getAttribute(token);
				if(Objects.nonNull(val)) {
					return val.toString();
				}
			}
		}
		return null;
	}

	@Override
	public Map<String, Object> getData() {
		throw new IllegalStateException();
	}

}
