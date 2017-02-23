package com.hypersocket.principal;

import com.hypersocket.menus.MenuService;
import com.hypersocket.menus.TabRegistration;
import com.hypersocket.realm.UserPermission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

@Service
public class PrincipalExtendedService {

    @Autowired
    MenuService menuService;

    @PostConstruct
    private void postConstruct() {
        menuService.registerExtendedInformationTab("principalRoleMappingTab",
                new TabRegistration("principalRoleMapping", "tabs/principalRoleMapping", UserPermission.CREATE, 100));
    }
}
