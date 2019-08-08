package com.hypersocket.ui;

import java.util.HashMap;
import java.util.Map;

import com.hypersocket.utils.ITokenResolver;

public class MapTokenResolver implements ITokenResolver {

	  protected Map<String, Object> tokenMap = new HashMap<String, Object>();

	  public MapTokenResolver() {
	  }
	  
	  public void addToken(String name, String value) {
		  this.tokenMap.put(name, value);
	  }

	  public String resolveToken(String tokenName) {
	    Object obj = this.tokenMap.get(tokenName);
	    if(obj!=null) {
	    	return obj.toString();
	    }
	    return null;
	  }
	  
	  public void addAll(MapTokenResolver resolver) {
		  this.tokenMap.putAll(resolver.tokenMap);
	  }
	  
	  public Map<String,Object> getData() {
		  return tokenMap;
	  }

	  public boolean hasToken(String key) {
		  return tokenMap.containsKey(key);
	  }

}