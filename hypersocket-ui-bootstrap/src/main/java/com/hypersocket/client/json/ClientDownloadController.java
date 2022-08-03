package com.hypersocket.client.json;

import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.hypersocket.auth.json.AuthenticationRequired;
import com.hypersocket.auth.json.UnauthorizedException;
import com.hypersocket.client.ClientDownloadService;
import com.hypersocket.client.DownloadFile;
import com.hypersocket.client.DownloadFileColumns;
import com.hypersocket.context.AuthenticatedContext;
import com.hypersocket.permissions.AccessDeniedException;
import com.hypersocket.session.json.SessionTimeoutException;
import com.hypersocket.tables.BootstrapTableResult;
import com.hypersocket.tables.Column;
import com.hypersocket.tables.ColumnSort;
import com.hypersocket.tables.json.BootstrapTableController;
import com.hypersocket.tables.json.BootstrapTablePageProcessor;

@Controller
public class ClientDownloadController extends BootstrapTableController<DownloadFile> {

	@Autowired
	private ClientDownloadService downloadService;

	@AuthenticationRequired
	@RequestMapping(value = "downloads/table", method = RequestMethod.GET, produces = { "application/json" })
	@ResponseBody
	@ResponseStatus(value = HttpStatus.OK)
	@AuthenticatedContext
	public BootstrapTableResult<?> tableResources(final HttpServletRequest request, HttpServletResponse response)
			throws AccessDeniedException, UnauthorizedException, SessionTimeoutException {
		return processDataTablesRequest(request, new BootstrapTablePageProcessor() {

			@Override
			public Column getColumn(String col) {
				return DownloadFileColumns.valueOf(col.toUpperCase());
			}

			@Override
			public List<?> getPage(String searchColumn, String searchPattern, int start, int length,
					ColumnSort[] sorting) throws UnauthorizedException, AccessDeniedException {
				return downloadService.searchResources(sessionUtils.getCurrentRealm(request), searchColumn,
						searchPattern, start, length, sorting);
			}

			@Override
			public Long getTotalCount(String searchColumn, String searchPattern)
					throws UnauthorizedException, AccessDeniedException {
				return downloadService.getResourceCount(sessionUtils.getCurrentRealm(request), searchColumn,
						searchPattern);
			}
		});
	}
}
