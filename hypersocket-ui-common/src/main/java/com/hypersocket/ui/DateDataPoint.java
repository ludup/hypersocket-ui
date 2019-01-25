package com.hypersocket.ui;

import java.io.Serializable;
import java.util.Date;

public class DateDataPoint implements Serializable {

	private static final long serialVersionUID = 7516920190945705147L;

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
