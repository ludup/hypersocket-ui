package com.hypersocket.ui.jquery;

import java.util.HashMap;
import java.util.Map;

public class MapTokenResolver implements ITokenResolver {

	  protected Map<String, String> tokenMap = new HashMap<String, String>();

	  public MapTokenResolver() {
	  }
	  
	  public void addToken(String name, String value) {
		  this.tokenMap.put(name, value);
	  }

	  public String resolveToken(String tokenName) {
	    return this.tokenMap.get(tokenName);
	  }
	  
	  public void addAll(MapTokenResolver resolver) {
		  this.tokenMap.putAll(resolver.tokenMap);
	  }

}