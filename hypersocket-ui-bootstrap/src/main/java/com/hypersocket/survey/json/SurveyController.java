/*******************************************************************************
 * Copyright (c) 2013 LogonBox Limited.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0
 * which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/gpl.html
 ******************************************************************************/
package com.hypersocket.survey.json;

import java.io.FileNotFoundException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.hypersocket.auth.json.AuthenticatedController;
import com.hypersocket.auth.json.AuthenticationRequired;
import com.hypersocket.json.ResourceStatus;
import com.hypersocket.survey.Survey;
import com.hypersocket.survey.SurveyService;

@Controller
public class SurveyController extends AuthenticatedController {
	public static final String USER_AGENT = "Mozilla/5.0";

	static Logger log = LoggerFactory.getLogger(SurveyController.class);

	@Autowired
	private SurveyService surveyService;

	@AuthenticationRequired
	@RequestMapping(value = "survey/submit", method = { RequestMethod.POST }, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	public ResourceStatus<Void> surveySubmit(HttpServletRequest orequest, HttpServletResponse oresponse)
			throws Exception {

		return callAsRequestAuthenticatedContext(orequest, () -> {
			try {
				surveyService.submitSurvey(orequest.getParameter("resourceKey"), orequest.getParameterMap());
				return new ResourceStatus<>();
			} catch (Exception e) {
				log.error("Failed to submit survey. ", e);
				return new ResourceStatus<>(false, e.getMessage());
			}
		});
	}

	@AuthenticationRequired
	@RequestMapping(value = "survey/ready", method = { RequestMethod.GET }, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	public ResourceStatus<Survey> ready(HttpServletRequest orequest, HttpServletResponse oresponse) throws Exception {
		return callAsRequestAuthenticatedContext(orequest, () -> {
			try {
				Survey r = surveyService.getNextReady();
				if (r == null)
					throw new FileNotFoundException("No ready survey.");
				return new ResourceStatus<>(r);
			} catch (Exception e) {
				return new ResourceStatus<>(false, e.getMessage());
			}
		});

	}

	@AuthenticationRequired
	@RequestMapping(value = "survey/reject/{resourceKey}", method = { RequestMethod.GET }, produces = {
			"application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	public ResourceStatus<Survey> reject(HttpServletRequest orequest, HttpServletResponse oresponse,
			@PathVariable String resourceKey) throws Exception {
		return callAsRequestAuthenticatedContext(orequest, () -> {
			try {
				Survey r = surveyService.reject(resourceKey);
				if (r == null)
					throw new FileNotFoundException("No survey.");
				return new ResourceStatus<>(r);
			} catch (Exception e) {
				return new ResourceStatus<>(false, e.getMessage());
			}
		});
	}

}
