package com.hypersocket.client;

import java.util.Collection;
import java.util.List;

import com.hypersocket.permissions.AccessDeniedException;
import com.hypersocket.realm.Realm;
import com.hypersocket.tables.ColumnSort;

public interface ClientDownloadService {

	Collection<DownloadFile> getDownloads();

	Long getResourceCount(Realm currentRealm, String searchColumn, String searchPattern) throws AccessDeniedException;

	List<DownloadFile> searchResources(Realm currentRealm, String searchColumn, String searchPattern, int start,
			int length, ColumnSort[] sorting) throws AccessDeniedException;

}
