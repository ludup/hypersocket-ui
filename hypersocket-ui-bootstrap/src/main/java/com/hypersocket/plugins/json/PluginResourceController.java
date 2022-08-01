package com.hypersocket.plugins.json;

import java.util.List;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.hypersocket.auth.json.AuthenticationRequired;
import com.hypersocket.auth.json.ResourceController;
import com.hypersocket.auth.json.UnauthorizedException;
import com.hypersocket.context.AuthenticatedContext;
import com.hypersocket.i18n.I18N;
import com.hypersocket.json.ResourceList;
import com.hypersocket.json.ResourceStatus;
import com.hypersocket.menus.AbstractTableAction;
import com.hypersocket.menus.MenuRegistration;
import com.hypersocket.menus.MenuService;
import com.hypersocket.permissions.AccessDeniedException;
import com.hypersocket.plugins.PluginResource;
import com.hypersocket.plugins.PluginResourceColumns;
import com.hypersocket.plugins.PluginResourcePermission;
import com.hypersocket.plugins.PluginResourceService;
import com.hypersocket.plugins.PluginResourceServiceImpl;
import com.hypersocket.properties.PropertyCategory;
import com.hypersocket.realm.UserPermission;
import com.hypersocket.session.json.SessionTimeoutException;
import com.hypersocket.tables.BootstrapTableResult;
import com.hypersocket.tables.Column;
import com.hypersocket.tables.ColumnSort;
import com.hypersocket.tables.json.BootstrapTablePageProcessor;


@Controller
public class PluginResourceController extends ResourceController {

	private static final String ACTIONS_PLUGINS = "pluginActions";
	@Autowired
	private PluginResourceService resourceService;
	@Autowired
	private MenuService menuService;
	
	@PostConstruct
	private void setup() {
		menuService.registerMenu(new MenuRegistration(PluginResourceServiceImpl.RESOURCE_BUNDLE,
				"plugins", "fa-plug", "plugins", 100,
				PluginResourcePermission.READ,
				PluginResourcePermission.CREATE,
				PluginResourcePermission.UPDATE,
				PluginResourcePermission.DELETE), MenuService.MENU_RESOURCES);
		
		menuService.registerTableAction(ACTIONS_PLUGINS,
				new AbstractTableAction("stopPlugin", "fa-power-off",
						"stopPlugin", UserPermission.UPDATE, 0, "canStop",
						"canStop"));
		
		menuService.registerTableAction(ACTIONS_PLUGINS,
				new AbstractTableAction("startPlugin", "fa-check",
						"startPlugin", UserPermission.UPDATE, 0, "canStart",
						"canStart"));
	}

	@AuthenticationRequired
	@RequestMapping(value = "plugins/list", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceList<PluginResource> getResources(HttpServletRequest request,
			HttpServletResponse response) throws Exception {

		return new ResourceList<>(
				resourceService.getResources(sessionUtils
						.getCurrentRealm(request)));
	}
	
	@AuthenticationRequired
	@RequestMapping(value = "plugins/table", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public BootstrapTableResult<?> tableResources(
			final HttpServletRequest request, HttpServletResponse response)
			throws Exception {

			return processDataTablesRequest(request,
				new BootstrapTablePageProcessor() {

					@Override
					public Column getColumn(String col) {
						return PluginResourceColumns.valueOf(col.toUpperCase());
					}

					@Override
					public List<?> getPage(String searchColumn, String searchPattern, int start,
							int length, ColumnSort[] sorting)
							throws UnauthorizedException,
							AccessDeniedException {
						return resourceService.searchResources(
								sessionUtils.getCurrentRealm(request),
								searchColumn, searchPattern, start, length, sorting);
					}

					@Override
					public Long getTotalCount(String searchColumn, String searchPattern)
							throws UnauthorizedException,
							AccessDeniedException {
						return resourceService.getResourceCount(
								sessionUtils.getCurrentRealm(request),
								searchColumn, searchPattern);
					}
				});
	}

	@AuthenticationRequired
	@RequestMapping(value = "plugins/template", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceList<PropertyCategory> getResourceTemplate(
			HttpServletRequest request) throws AccessDeniedException,
			UnauthorizedException, SessionTimeoutException {
		return new ResourceList<>(resourceService.getPropertyTemplate());
	}
	
	@AuthenticationRequired
	@RequestMapping(value = "plugins/properties/{id}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceList<PropertyCategory> getActionTemplate(
			HttpServletRequest request, @PathVariable String id)
			throws Exception {
		return new ResourceList<>(resourceService.getPropertyTemplate(resourceService.getResourceById(id)));
	}
	
	@AuthenticationRequired
	@RequestMapping(value = "plugins/stop/{id}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceStatus<PluginResource> stop(
			HttpServletRequest request, @PathVariable String id)
			throws Exception {
		return new ResourceStatus<>(resourceService.stop(resourceService.getResourceById(id)));
	}
	
	@AuthenticationRequired
	@RequestMapping(value = "plugins/start/{id}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceStatus<PluginResource> start(
			HttpServletRequest request, @PathVariable String id)
			throws Exception {
		return new ResourceStatus<>(resourceService.start(resourceService.getResourceById(id)));
	}

	@AuthenticationRequired
	@RequestMapping(value = "plugins/plugin/{id}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public PluginResource getResource(HttpServletRequest request,
			HttpServletResponse response, @PathVariable("id") String id)
			throws Exception {
		return resourceService.getResourceById(id);
	}

//	@AuthenticationRequired
//	@RequestMapping(value = "plugins/plugin", method = RequestMethod.POST, produces = { "application/json" })
//	@ResponseBody
//	@ResponseStatus(value = HttpStatus.OK)
//	@AuthenticatedContext
//	public ResourceStatus<PluginResource> createOrUpdateResource(
//			HttpServletRequest request, HttpServletResponse response,
//			@RequestBody ResourceUpdate resource)
//			throws AccessDeniedException, UnauthorizedException,
//			SessionTimeoutException {
//
//		try {
//
//			PluginResource newResource;
//
//			var realm = sessionUtils.getCurrentRealm(request);
//			var properties = Stream.of(resource.getProperties()).collect(
//					Collectors.toMap(i -> i.getId(), i -> i.getValue()));
//			
//			if (resource.getId() != null) {
//				newResource = resourceService.updateResource(
//						resourceService.getResourceById(resource.getId()),
//						resource.getName(), properties);
//			} else {
//				newResource = resourceService.createResource(
//						resource.getName(),
//						realm,
//						properties);
//			}
//			return new ResourceStatus<>(newResource,
//					I18N.getResource(sessionUtils.getLocale(request),
//							PluginResourceServiceImpl.RESOURCE_BUNDLE,
//							resource.getId() != null ? "resource.updated.info"
//									: "resource.created.info", resource
//									.getName()));
//
//		} catch (ResourceException e) {
//			return new ResourceStatus<>(false,
//					e.getMessage());
//		}
//	}

	@SuppressWarnings("unchecked")
	@AuthenticationRequired
	@RequestMapping(value = "plugins/plugin/{id}", method = RequestMethod.DELETE, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceStatus<PluginResource> deleteResource(
			HttpServletRequest request, HttpServletResponse response,
			@PathVariable("id") String id) throws Exception {

		var resource = resourceService.getResourceById(id);

		if (resource == null) {
			return new ResourceStatus<PluginResource>(false,
					I18N.getResource(sessionUtils.getLocale(request),
							PluginResourceServiceImpl.RESOURCE_BUNDLE,
							"error.invalidResourceId", id));
		}

		var preDeletedName = resource.getId();
		resourceService.deleteResource(resource);

		return new ResourceStatus<>(true, I18N.getResource(
				sessionUtils.getLocale(request),
				PluginResourceServiceImpl.RESOURCE_BUNDLE,
				"resource.deleted.info", preDeletedName));

	}
}
