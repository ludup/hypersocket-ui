package com.hypersocket.menus;

import java.util.Collection;

import com.hypersocket.realm.Principal;

public interface BadgeProvider {

	Collection<Badge> getBadges(Principal currentPrincipal);

}
