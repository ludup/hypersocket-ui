package com.hypersocket.ui.jquery;

import javax.servlet.http.HttpServletRequest;

public interface FilterExtender {

	MapTokenResolver getAdditionalResolvers(HttpServletRequest request);

	
}
