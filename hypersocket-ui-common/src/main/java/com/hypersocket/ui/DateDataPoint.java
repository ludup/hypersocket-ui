package com.hypersocket.ui;

import java.util.Date;

public class DateDataPoint {

	Date x;
	long y;
	
	public DateDataPoint() {
	}
	
	public DateDataPoint(Date x, long y) {
		this.x = x;
		this.y = y;
	}

	public Date getX() {
		return x;
	}

	public void setX(Date x) {
		this.x = x;
	}

	public long getY() {
		return y;
	}

	public void setY(long y) {
		this.y = y;
	}

	
}
