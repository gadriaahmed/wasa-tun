/*******************************************************************************
 * Copyright 2016 Intuit
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
package com.intuit.wasabi.repository.redis.impl;

import com.google.inject.Inject;
import com.intuit.wasabi.authenticationobjects.UserInfo;
import com.intuit.wasabi.authorizationobjects.Role;
import com.intuit.wasabi.authorizationobjects.UserPermissions;
import com.intuit.wasabi.authorizationobjects.UserPermissionsList;
import com.intuit.wasabi.authorizationobjects.UserRole;
import com.intuit.wasabi.authorizationobjects.UserRoleList;
import com.intuit.wasabi.exceptions.AuthenticationException;
import com.intuit.wasabi.experimentobjects.Application;
import com.intuit.wasabi.redis.RedisConnectionProvider;
import com.intuit.wasabi.repository.AuthorizationRepository;
import com.intuit.wasabi.repository.RepositoryException;
import com.intuit.wasabi.repository.redis.RedisKeys;
import com.intuit.wasabi.userdirectory.UserDirectory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.params.ScanParams;
import redis.clients.jedis.resps.ScanResult;

import javax.annotation.Nonnull;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static java.util.Objects.nonNull;

public class RedisAuthorizationRepository implements AuthorizationRepository {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisAuthorizationRepository.class);
    public static final String ALL_APPLICATIONS = "*";
    static final String SUPERADMIN = "superadmin";
    static final Application.Name WILDCARD = Application.Name.valueOf("wildcard");

    private static final String USER_INFO_EMAIL = "email";
    private static final String USER_INFO_FIRST_NAME = "firstName";
    private static final String USER_INFO_LAST_NAME = "lastName";

    private final JedisPooled jedis;
    private final UserDirectory userDirectory;

    @Inject
    public RedisAuthorizationRepository(RedisConnectionProvider connectionProvider,
                                        UserDirectory userDirectory) {
        this.jedis = connectionProvider.getJedis();
        this.userDirectory = userDirectory;
    }

    UserInfo retrieveOrDefaultUser(UserInfo.Username userID) {
        UserInfo userInfo = lookupUser(userID);
        setUserInfo(userInfo);
        return userInfo;
    }

    UserInfo lookupUser(UserInfo.Username userID) {
        UserInfo userInfo;
        try {
            LOGGER.debug("Workforce-getApplicationUsers: looking up user {}", userID.toString());
            userInfo = userDirectory.lookupUser(userID);
        } catch (AuthenticationException e) {
            LOGGER.warn(String.format("Workforce-getApplicationUsers: problem looking up user %s", userID.toString()), e);
            userInfo = UserInfo.newInstance(userID)
                    .withEmail("")
                    .withFirstName("")
                    .withLastName("")
                    .build();
        }
        return userInfo;
    }

    @Override
    public UserPermissionsList getUserPermissionsList(UserInfo.Username userID) {
        UserPermissionsList userPermissionsList = new UserPermissionsList();
        Optional<UserPermissions> superAdminUserPermissions = getSuperAdminUserPermissions(userID, WILDCARD);
        if (superAdminUserPermissions.isPresent()) {
            List<String> allAppNames = getAllApplicationNameFromApplicationList();
            allAppNames.stream()
                    .map(t ->
                            UserPermissions.newInstance(
                                    Application.Name.valueOf(t),
                                    superAdminUserPermissions.get().getPermissions()
                            ).build())
                    .forEach(userPermissionsList::addPermissions);
        } else {
            List<UserRoleEntry> resultList = getUserRoleList(userID, Optional.<Application.Name>empty());
            resultList.stream()
                    .filter(t -> t.role != null)
                    .map(t ->
                            UserPermissions.newInstance(
                                    Application.Name.valueOf(t.appName),
                                    Role.valueOf(t.role).getRolePermissions()).build()
                    )
                    .forEach(userPermissionsList::addPermissions);
        }
        return userPermissionsList;
    }

    @Override
    public UserRoleList getApplicationUsers(Application.Name applicationName) {
        UserRoleList userRoleList = new UserRoleList();
        List<AppRoleEntry> appRoleList = getAppRoleList(applicationName);
        appRoleList.stream()
                .map(t -> convertAppRoleToUserRole(applicationName, t))
                .forEach(userRoleList::addRole);
        return userRoleList;
    }

    UserRole convertAppRoleToUserRole(Application.Name applicationName, AppRoleEntry appRole) {
        Role role = Role.toRole(appRole.role);
        UserInfo.Username userID = UserInfo.Username.valueOf(appRole.userId);
        UserInfo userInfo = getUserInfo(userID);
        if (userInfo == null) {
            userInfo = lookupUser(userID);
        }
        return UserRole.newInstance(applicationName, role)
                .withUserID(userID)
                .withUserEmail(userInfo.getEmail())
                .withFirstName(userInfo.getFirstName())
                .withLastName(userInfo.getLastName())
                .build();
    }

    List<AppRoleEntry> getAppRoleList(Application.Name applicationName) {
        List<AppRoleEntry> resultList = new ArrayList<>();
        try {
            String prefix = RedisKeys.AUTH_APP_ROLE_PREFIX + applicationName.toString() + ":";
            for (String key : scanKeys(RedisKeys.appRolePattern(applicationName.toString()))) {
                String userId = key.substring(prefix.length());
                String role = jedis.get(key);
                resultList.add(new AppRoleEntry(userId, role));
            }
        } catch (Exception e) {
            throw new RepositoryException("Could not retrieve info for app \"" + applicationName + "\"", e);
        }
        return resultList;
    }

    @Override
    public UserPermissions getUserPermissions(@Nonnull UserInfo.Username username,
                                              @Nonnull Application.Name applicationName) {
        Optional<UserPermissions> userPermissions = getSuperAdminUserPermissions(username, applicationName);
        return userPermissions.orElseGet(() -> getAppSpecificPermission(username, applicationName));
    }

    Optional<UserPermissions> getSuperAdminUserPermissions(@Nonnull UserInfo.Username username,
                                                           @Nonnull Application.Name applicationName) {
        List<UserRoleEntry> resultList = getUserRolesWithWildcardAppName(username, applicationName);

        return resultList.stream()
                .filter(t -> SUPERADMIN.equalsIgnoreCase(t.role))
                .map(m ->
                        UserPermissions.newInstance(applicationName,
                                Role.SUPERADMIN.getRolePermissions())
                                .build()
                )
                .findAny();
    }

    UserPermissions getAppSpecificPermission(UserInfo.Username username, Application.Name applicationName) {
        List<UserRoleEntry> result = getUserRoleList(username, Optional.of(applicationName));
        if (result.size() != 0) {
            assert result.size() <= 1 : "More than a single row returned";
            UserRoleEntry role = result.get(0);
            assert role.role != null : "Role cannot be null";
            return UserPermissions.newInstance(applicationName, Role.toRole(role.role).getRolePermissions())
                    .build();
        }
        return null;
    }

    @Override
    public void deleteUserRole(UserInfo.Username userID, Application.Name applicationName) {
        try {
            jedis.del(
                    RedisKeys.userRoleKey(userID.getUsername(), applicationName.toString()),
                    RedisKeys.appRoleKey(applicationName.toString(), userID.getUsername())
            );
        } catch (Exception e) {
            throw new RepositoryException("Could not delete user role for user \"" + userID + "\"", e);
        }
    }

    @Override
    public void setUserRole(UserRole userRole) {
        try {
            String userId = userRole.getUserID().toString();
            String appName = userRole.getApplicationName().toString();
            String role = userRole.getRole().toString();
            jedis.set(RedisKeys.userRoleKey(userId, appName), role);
            jedis.set(RedisKeys.appRoleKey(appName, userId), role);
        } catch (Exception e) {
            throw new RepositoryException("Could not set user role \"" + userRole + "\"", e);
        }
    }

    @Override
    public UserRoleList getUserRoleList(UserInfo.Username userID) {
        List<UserRoleEntry> possibleSuperAdmin = getUserRolesWithWildcardAppName(userID, WILDCARD);
        UserInfo userInfo = retrieveOrDefaultUser(userID);
        List<UserRoleEntry> superAdmins = new ArrayList<>();
        for (UserRoleEntry entry : possibleSuperAdmin) {
            if (SUPERADMIN.equalsIgnoreCase(entry.role)) {
                superAdmins.add(entry);
            }
        }
        UserRoleList userRoleList = new UserRoleList();
        if (superAdmins.size() > 0) {
            List<String> allAppNamesList = getAllApplicationNameFromApplicationList();
            superAdmins.stream()
                    .map(t ->
                            allAppNamesList.stream()
                                    .map(appName ->
                                            UserRole.newInstance(Application.Name.valueOf(appName), Role.SUPERADMIN)
                                                    .withUserID(userID)
                                                    .withUserEmail(userInfo.getEmail())
                                                    .withFirstName(userInfo.getFirstName())
                                                    .withLastName(userInfo.getLastName())
                                                    .build()
                                    ).collect(java.util.stream.Collectors.toList())
                    )
                    .flatMap(java.util.Collection::stream)
                    .forEach(userRoleList::addRole);
            return userRoleList;
        }

        List<UserRoleEntry> resultList = getUserRoleList(userID, Optional.<Application.Name>empty());
        resultList.stream()
                .map(
                        r -> UserRole.newInstance(
                                Application.Name.valueOf(r.appName),
                                Role.toRole(r.role)
                        )
                                .withFirstName(userInfo.getFirstName())
                                .withLastName(userInfo.getLastName())
                                .withUserEmail(userInfo.getEmail())
                                .withUserID(userID)
                                .build()
                ).forEach(userRoleList::addRole);

        return userRoleList;
    }

    List<String> getAllApplicationNameFromApplicationList() {
        Set<String> appNames = jedis.smembers(RedisKeys.AUTH_APPLICATIONS);
        if (appNames == null || appNames.isEmpty()) {
            return Collections.emptyList();
        }
        return new ArrayList<>(appNames);
    }

    @Override
    public UserInfo getUserInfo(UserInfo.Username userID) {
        List<UserInfo> resultList = getUserInfoList(userID);

        if (resultList.size() > 1) {
            throw new AuthenticationException("error, more than one user with the userID " + userID.toString());
        }

        return resultList.size() == 0 ? null :
                UserInfo.newInstance(userID)
                        .withEmail(resultList.get(0).getEmail())
                        .withFirstName(resultList.get(0).getFirstName())
                        .withLastName(resultList.get(0).getLastName())
                        .build();
    }

    List<UserInfo> getUserInfoList(UserInfo.Username userID) {
        List<UserInfo> resultList = Collections.emptyList();
        try {
            Map<String, String> fields = jedis.hgetAll(RedisKeys.userInfoKey(userID.getUsername()));
            if (fields != null && !fields.isEmpty()) {
                UserInfo userInfo = UserInfo.newInstance(userID)
                        .withEmail(fields.get(USER_INFO_EMAIL))
                        .withFirstName(fields.get(USER_INFO_FIRST_NAME))
                        .withLastName(fields.get(USER_INFO_LAST_NAME))
                        .build();
                resultList = Collections.singletonList(userInfo);
            }
        } catch (Exception e) {
            throw new RepositoryException("Could not retrieve info for user \"" + userID + "\"", e);
        }
        return resultList;
    }

    @Override
    public void setUserInfo(UserInfo userInfo) {
        try {
            Map<String, String> fields = new HashMap<>();
            fields.put(USER_INFO_EMAIL, userInfo.getEmail());
            fields.put(USER_INFO_FIRST_NAME, userInfo.getFirstName());
            fields.put(USER_INFO_LAST_NAME, userInfo.getLastName());
            jedis.hset(RedisKeys.userInfoKey(userInfo.getUsername().getUsername()), fields);
        } catch (Exception e) {
            throw new RepositoryException("Could not set info for user \"" + userInfo.getUsername() + "\"", e);
        }
    }

    @Override
    public UserPermissions checkSuperAdminPermissions(UserInfo.Username userID, Application.Name applicationName) {
        List<UserRoleEntry> resultList = getUserRolesWithWildcardAppName(userID, applicationName);
        Optional<UserRoleEntry> adminRole = resultList.stream()
                .filter(t -> SUPERADMIN.equalsIgnoreCase(t.role))
                .findAny();

        if (!adminRole.isPresent()) {
            return null;
        }
        return UserPermissions.newInstance(applicationName, Role.SUPERADMIN.getRolePermissions())
                .build();
    }

    List<UserRoleEntry> getUserRoleList(UserInfo.Username userID,
                                        Optional<Application.Name> applicationName) {
        List<UserRoleEntry> resultList = new ArrayList<>();
        try {
            if (applicationName.isPresent()) {
                String role = jedis.get(RedisKeys.userRoleKey(
                        userID.getUsername(), applicationName.get().toString()));
                if (role != null) {
                    resultList.add(new UserRoleEntry(applicationName.get().toString(), role));
                }
            } else {
                String prefix = RedisKeys.AUTH_USER_ROLE_PREFIX + userID.getUsername() + ":";
                for (String key : scanKeys(RedisKeys.userRolePattern(userID.getUsername()))) {
                    String appName = key.substring(prefix.length());
                    if (!ALL_APPLICATIONS.equals(appName)) {
                        resultList.add(new UserRoleEntry(appName, jedis.get(key)));
                    }
                }
            }
        } catch (Exception e) {
            throw new RepositoryException("Could not retrieve info for user \"" + userID + "\"", e);
        }
        return resultList;
    }

    List<UserRoleEntry> getUserRolesWithWildcardAppName(UserInfo.Username userID,
                                                        Application.Name applicationName) {
        List<UserRoleEntry> resultList = Collections.emptyList();
        try {
            String role = jedis.get(RedisKeys.userRoleKey(userID.getUsername(), ALL_APPLICATIONS));
            if (role != null) {
                resultList = Collections.singletonList(new UserRoleEntry(ALL_APPLICATIONS, role));
            }
        } catch (Exception e) {
            throw new RepositoryException("Could not retrieve permissions for user \"" + userID + "\" and application "
                    + "\"" + applicationName + "\"", e);
        }
        return resultList;
    }

    @Override
    public void assignUserToSuperAdminRole(UserInfo candidateUser) {
        LOGGER.debug("Adding user {} as superadmin", candidateUser);

        String superAdminRole = Role.SUPERADMIN.toString().toLowerCase();
        String userID = candidateUser.getUsername().toString();

        jedis.set(RedisKeys.userRoleKey(userID, ALL_APPLICATIONS), superAdminRole);
        jedis.set(RedisKeys.appRoleKey(ALL_APPLICATIONS, userID), superAdminRole);
        jedis.sadd(RedisKeys.AUTH_SUPERADMINS, userID);
    }

    @Override
    public void removeUserFromSuperAdminRole(UserInfo candidateUser) {
        LOGGER.debug("Removing user {} from user admin role", candidateUser);

        String userID = candidateUser.getUsername().toString();
        jedis.del(
                RedisKeys.userRoleKey(userID, ALL_APPLICATIONS),
                RedisKeys.appRoleKey(ALL_APPLICATIONS, userID)
        );
        jedis.srem(RedisKeys.AUTH_SUPERADMINS, userID);
    }

    @Override
    public List<UserRole> getSuperAdminRoleList() {
        LOGGER.debug("Getting super admin role list");

        Set<String> superAdminUserIds = jedis.smembers(RedisKeys.AUTH_SUPERADMINS);
        if (superAdminUserIds == null || superAdminUserIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<UserRole> superAdmins = new ArrayList<>();
        for (String userId : superAdminUserIds) {
            UserRoleEntry userRole = new UserRoleEntry(ALL_APPLICATIONS,
                    jedis.get(RedisKeys.userRoleKey(userId, ALL_APPLICATIONS)));
            superAdmins.add(getRoleWithUserInfo(userRole, userId));
        }

        LOGGER.debug("Returning {} roles", superAdmins);
        return superAdmins;
    }

    private UserRole getRoleWithUserInfo(UserRoleEntry userRole, String userId) {
        LOGGER.debug("Getting user info for user role={}", userRole);

        Application.Name appName = userRole.appName.equals(ALL_APPLICATIONS) ? WILDCARD :
                Application.Name.valueOf(userRole.appName);

        UserInfo userInfo = getUserInfo(UserInfo.Username.valueOf(userId));

        UserRole roleWithUserInfo;

        if (nonNull(userInfo)) {
            roleWithUserInfo = UserRole.newInstance(
                    appName,
                    Role.toRole(userRole.role)).
                    withUserID(UserInfo.Username.valueOf(userId)).
                    withFirstName(userInfo.getFirstName()).
                    withLastName(userInfo.getLastName()).
                    withUserEmail(userInfo.getEmail()).build();
        } else {
            roleWithUserInfo = UserRole.newInstance(appName, Role.toRole(userRole.role))
                    .withUserID(UserInfo.Username.valueOf(userId)).build();
        }

        LOGGER.debug("Role with user info for user role={} is {}", userRole, roleWithUserInfo);
        return roleWithUserInfo;
    }

    private List<String> scanKeys(String pattern) {
        List<String> keys = new ArrayList<>();
        String cursor = ScanParams.SCAN_POINTER_START;
        ScanParams scanParams = new ScanParams().match(pattern).count(100);
        do {
            ScanResult<String> scanResult = jedis.scan(cursor, scanParams);
            keys.addAll(scanResult.getResult());
            cursor = scanResult.getCursor();
        } while (!ScanParams.SCAN_POINTER_START.equals(cursor));
        return keys;
    }

    static final class UserRoleEntry {
        final String appName;
        final String role;

        UserRoleEntry(String appName, String role) {
            this.appName = appName;
            this.role = role;
        }
    }

    static final class AppRoleEntry {
        final String userId;
        final String role;

        AppRoleEntry(String userId, String role) {
            this.userId = userId;
            this.role = role;
        }
    }
}
