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

import com.google.inject.AbstractModule;
import com.intuit.wasabi.repository.cassandra.CassandraRepositoryModule;
import org.slf4j.Logger;

import static org.slf4j.LoggerFactory.getLogger;

/**
 * Selects Cassandra or Redis repository bindings based on the {@code wasabi.repository.backend} system property.
 */
public class RepositoryStorageModule extends AbstractModule {

    public static final String BACKEND_PROPERTY = "wasabi.repository.backend";
    public static final String BACKEND_REDIS = "redis";
    public static final String BACKEND_CASSANDRA = "cassandra";

    private static final Logger LOGGER = getLogger(RepositoryStorageModule.class);

    @Override
    protected void configure() {
        String backend = System.getProperty(BACKEND_PROPERTY, BACKEND_REDIS);
        if (BACKEND_CASSANDRA.equalsIgnoreCase(backend)) {
            LOGGER.info("Installing Cassandra repository module (backend={})", backend);
            install(new CassandraRepositoryModule());
        } else {
            LOGGER.info("Installing Redis repository module (backend={})", backend);
            install(new RedisRepositoryModule());
        }
    }
}
