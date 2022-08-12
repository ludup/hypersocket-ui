package com.hypersocket.plugins.json;

import java.util.List;

import javax.annotation.PostConstruct;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.multipart.MultipartFile;

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
import com.hypersocket.realm.Realm;
import com.hypersocket.realm.UserPermission;
import com.hypersocket.resource.ResourceException;
import com.hypersocket.session.json.SessionTimeoutException;
import com.hypersocket.tables.BootstrapTableResult;
import com.hypersocket.tables.Column;
import com.hypersocket.tables.ColumnSort;
import com.hypersocket.tables.json.BootstrapTablePageProcessor;


@Controller
@Deprecated
public class PluginResourceController extends ResourceController {
	private final static Logger LOG = LoggerFactory.getLogger(PluginResourceController.class);

	private static final String ACTIONS_PLUGINS = "pluginActions";
	@Autowired
	private PluginResourceService resourceService;
	@Autowired
	private MenuService menuService;
	
	@PostConstruct
	private void setup() {
		menuService.registerMenu(new MenuRegistration(PluginResourceServiceImpl.RESOURCE_BUNDLE,
				"plugins", "fa-plug", "plugins", Integer.MAX_VALUE,
				PluginResourcePermission.READ,
				PluginResourcePermission.CREATE,
				PluginResourcePermission.UPDATE,
				PluginResourcePermission.DELETE), "extensions");
		
		menuService.registerTableAction(ACTIONS_PLUGINS,
				new AbstractTableAction("stopPlugin", "fa-power-off",
						"stopPlugin", UserPermission.UPDATE, 0, "canStop",
						"canStop"));
		
		menuService.registerTableAction(ACTIONS_PLUGINS,
				new AbstractTableAction("startPlugin", "fa-check",
						"startPlugin", UserPermission.UPDATE, 0, "canStart",
						"canStart"));
		
		menuService.registerTableAction(ACTIONS_PLUGINS,
				new AbstractTableAction("disablePlugin", "fa-stop",
						"disablePlugin", UserPermission.UPDATE, 0, "canStop",
						"canDisable"));
		
		menuService.registerTableAction(ACTIONS_PLUGINS,
				new AbstractTableAction("enablePlugin", "fa-play",
						"enablePlugin", UserPermission.UPDATE, 0, "canEnable",
						"canEnable"));
		
		menuService.registerTableAction(ACTIONS_PLUGINS,
				new AbstractTableAction("uninstallPlugin", "fa-trash",
						"uninstallPlugin", UserPermission.DELETE, 0, "canUninstall",
						"canUninstall"));
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
	@RequestMapping(value = "plugins/enable/{id}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceStatus<PluginResource> enable(
			HttpServletRequest request, @PathVariable String id)
			throws Exception {
		return new ResourceStatus<>(resourceService.enable(resourceService.getResourceById(id)));
	}
	
	@AuthenticationRequired
	@RequestMapping(value = "plugins/disable/{id}", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceStatus<PluginResource> disable(
			HttpServletRequest request, @PathVariable String id)
			throws Exception {
		return new ResourceStatus<>(resourceService.disable(resourceService.getResourceById(id)));
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

	@AuthenticationRequired
	@RequestMapping(value = "plugins/upload", method = RequestMethod.POST, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceStatus<PluginResource> upload(
			HttpServletRequest request, HttpServletResponse response,
			@RequestPart(value = "file") MultipartFile file,
			@RequestParam boolean start)
			throws AccessDeniedException, UnauthorizedException,
			SessionTimeoutException, ResourceException {

		try {

			PluginResource newResource;
			Realm realm = sessionUtils.getCurrentRealm(request);
			newResource = resourceService.upload(realm, file.getInputStream(), start);

			return new ResourceStatus<PluginResource>(newResource,
					I18N.getResource(sessionUtils.getLocale(request),
							PluginResourceService.RESOURCE_BUNDLE,
							start ?  "plugin.uploadedAndStarted.info" : "plugin.uploaded.info", newResource
									.getName()));

		} catch (Throwable e) {
			LOG.error("Unexpected error.", e);
			return new ResourceStatus<PluginResource>(false, I18N.getResource(
					sessionUtils.getLocale(request),
					PluginResourceService.RESOURCE_BUNDLE,
					start ? "plugin.uploadedAndStarted.error" : "plugin.uploaded.error", e.getMessage()));
		}
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

	@AuthenticationRequired
	@RequestMapping(value = "plugins/uninstall/{id}", method = RequestMethod.DELETE, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceStatus<PluginResource> uninstall(
			HttpServletRequest request, @PathVariable String id)
			throws Exception {
		try {
			var r = resourceService.getResourceById(id);
			resourceService.uninstall(r, true);
			return new ResourceStatus<PluginResource>(r,
					I18N.getResource(sessionUtils.getLocale(request),
							PluginResourceService.RESOURCE_BUNDLE,
							"plugin.uninstall.info", r
									.getName()));

		} catch (Throwable e) {
			LOG.error("Unexpected error.", e);
			return new ResourceStatus<PluginResource>(false, I18N.getResource(
					sessionUtils.getLocale(request),
					PluginResourceService.RESOURCE_BUNDLE,
					"plugin.uninstall.error", id, e.getMessage()));
		}
	}

	@AuthenticationRequired
	@RequestMapping(value = "plugins/softUninstall/{id}", method = RequestMethod.DELETE, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public ResourceStatus<PluginResource> softUninstall(
			HttpServletRequest request, @PathVariable String id)
			throws Exception {
		try {
			var r = resourceService.getResourceById(id);
			resourceService.uninstall(r, false);
			return new ResourceStatus<PluginResource>(r,
					I18N.getResource(sessionUtils.getLocale(request),
							PluginResourceService.RESOURCE_BUNDLE,
							"plugin.softUninstall.info", r.getName()));

		} catch (Throwable e) {
			LOG.error("Unexpected error.", e);
			return new ResourceStatus<PluginResource>(false, I18N.getResource(
					sessionUtils.getLocale(request),
					PluginResourceService.RESOURCE_BUNDLE,
					"plugin.softUninstall.error", id, e.getMessage()));
		}
	}
}
