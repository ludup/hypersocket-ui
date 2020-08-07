package com.hypersocket.ui;

import java.io.Serializable;

public class BarChartDataPoint implements Serializable {

	private static final long serialVersionUID = 7132700274312931530L;
	
	private String x;
	private Long y;
	
	public BarChartDataPoint(String x, Long y) {
	
		this.x = x;
		this.y = y;
	}

	public String getX() {
		return x;
	}

	public void setX(String x) {
		this.x = x;
	}

	public Long getY() {
		return y;
	}

	public void setY(Long y) {
		this.y = y;
	}
	
	

	
}
