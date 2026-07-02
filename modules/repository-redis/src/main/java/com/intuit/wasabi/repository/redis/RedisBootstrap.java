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
package com.intuit.wasabi.repository.redis;

import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.intuit.wasabi.authorizationobjects.Role;
import com.intuit.wasabi.redis.RedisConnectionProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.JedisPooled;

/**
 * Seeds default superadmin user from V026 migration on first startup.
 */
@Singleton
public class RedisBootstrap {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisBootstrap.class);

    static final String ALL_APPLICATIONS = "*";
    static final String DEFAULT_SUPERADMIN = "admin";

    @Inject
    public RedisBootstrap(RedisConnectionProvider connectionProvider) {
        seedSuperAdmin(connectionProvider.getJedis());
    }

    void seedSuperAdmin(JedisPooled jedis) {
        if (jedis.sismember(RedisKeys.AUTH_SUPERADMINS, DEFAULT_SUPERADMIN)) {
            LOGGER.debug("Default superadmin '{}' already seeded", DEFAULT_SUPERADMIN);
            return;
        }

        String superAdminRole = Role.SUPERADMIN.toString().toLowerCase();
        jedis.set(RedisKeys.userRoleKey(DEFAULT_SUPERADMIN, ALL_APPLICATIONS), superAdminRole);
        jedis.set(RedisKeys.appRoleKey(ALL_APPLICATIONS, DEFAULT_SUPERADMIN), superAdminRole);
        jedis.sadd(RedisKeys.AUTH_SUPERADMINS, DEFAULT_SUPERADMIN);

        LOGGER.info("Seeded default superadmin user '{}'", DEFAULT_SUPERADMIN);
    }
}
