package com.hypersocket.ui;

import javax.servlet.http.HttpServletRequest;

public interface FilterExtender {

	MapTokenResolver getAdditionalResolvers(HttpServletRequest request);

	
}
