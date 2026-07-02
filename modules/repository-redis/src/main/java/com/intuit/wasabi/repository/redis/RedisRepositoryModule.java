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
import com.intuit.wasabi.experimentobjects.ExperimentValidator;
import com.intuit.wasabi.redis.RedisClientModule;
import com.intuit.wasabi.repository.AssignmentsRepository;
import com.intuit.wasabi.repository.AuditLogRepository;
import com.intuit.wasabi.repository.AuthorizationRepository;
import com.intuit.wasabi.repository.CassandraRepository;
import com.intuit.wasabi.repository.ExperimentRepository;
import com.intuit.wasabi.repository.FeedbackRepository;
import com.intuit.wasabi.repository.MutexRepository;
import com.intuit.wasabi.repository.PagesRepository;
import com.intuit.wasabi.repository.PrioritiesRepository;
import com.intuit.wasabi.repository.redis.impl.RedisAssignmentsRepository;
import com.intuit.wasabi.repository.redis.impl.RedisAuditLogRepository;
import com.intuit.wasabi.repository.redis.impl.RedisAuthorizationRepository;
import com.intuit.wasabi.repository.redis.impl.RedisExperimentRepository;
import com.intuit.wasabi.repository.redis.impl.RedisFeedbackRepository;
import com.intuit.wasabi.repository.redis.impl.RedisMutexRepository;
import com.intuit.wasabi.repository.redis.impl.RedisPagesRepository;
import com.intuit.wasabi.repository.redis.impl.RedisPrioritiesRepository;
import org.slf4j.Logger;

import javax.inject.Singleton;
import java.util.Properties;

import static com.google.inject.name.Names.named;
import static com.intuit.autumn.utils.PropertyFactory.create;
import static com.intuit.autumn.utils.PropertyFactory.getProperty;
import static java.lang.Integer.parseInt;
import static org.slf4j.LoggerFactory.getLogger;

public class RedisRepositoryModule extends AbstractModule {

    private static final String PROPERTY_NAME = "/repository.properties";
    private static final Logger LOGGER = getLogger(RedisRepositoryModule.class);

    @Override
    protected void configure() {
        Properties properties = create(PROPERTY_NAME, RedisRepositoryModule.class);

        bind(String.class).annotatedWith(named("assign.user.to.export"))
                .toInstance(getProperty("assign.user.to.export", properties, "false"));
        bind(String.class).annotatedWith(named("assign.bucket.count"))
                .toInstance(getProperty("assign.bucket.count", properties, "false"));
        bind(Integer.class).annotatedWith(named("export.pool.size"))
                .toInstance(parseInt(getProperty("export.pool.size", properties, "5")));
        bind(String.class).annotatedWith(named("default.time.format"))
                .toInstance(getProperty("default.time.format", properties, "yyyy-MM-dd HH:mm:ss"));
        bind(String.class).annotatedWith(named("database.migration.resource.path"))
                .toInstance(getProperty("database.migration.resource.path", properties));

        install(new RedisClientModule());

        bind(RedisSerde.class).in(Singleton.class);
        bind(ExperimentValidator.class).in(Singleton.class);
        bind(RedisBootstrap.class).asEagerSingleton();

        bind(AssignmentsRepository.class).to(RedisAssignmentsRepository.class).in(Singleton.class);
        bind(AuditLogRepository.class).to(RedisAuditLogRepository.class).in(Singleton.class);
        bind(AuthorizationRepository.class).to(RedisAuthorizationRepository.class).in(Singleton.class);
        bind(FeedbackRepository.class).to(RedisFeedbackRepository.class).in(Singleton.class);
        bind(MutexRepository.class).to(RedisMutexRepository.class).in(Singleton.class);
        bind(PagesRepository.class).to(RedisPagesRepository.class).in(Singleton.class);
        bind(PrioritiesRepository.class).to(RedisPrioritiesRepository.class).in(Singleton.class);
        bind(ExperimentRepository.class).annotatedWith(CassandraRepository.class)
                .to(RedisExperimentRepository.class).in(Singleton.class);

        LOGGER.info("Configured Redis repository bindings");
    }
}
