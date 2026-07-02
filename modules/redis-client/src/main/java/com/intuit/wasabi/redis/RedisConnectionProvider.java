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
package com.intuit.wasabi.redis;

import com.codahale.metrics.health.HealthCheckRegistry;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import redis.clients.jedis.Connection;
import redis.clients.jedis.JedisPooled;

import javax.inject.Inject;
import javax.inject.Singleton;
import java.util.Properties;

import static com.intuit.autumn.utils.PropertyFactory.create;
import static com.intuit.autumn.utils.PropertyFactory.getProperty;
import static com.intuit.wasabi.redis.RedisClientModule.REDIS_INSTANCE_NAME;

@Singleton
public class RedisConnectionProvider {

    public static final String PROPERTY_NAME = "/redis.properties";

    private final JedisPooled jedis;

    @Inject
    public RedisConnectionProvider(HealthCheckRegistry healthCheckRegistry) {
        Properties properties = create(PROPERTY_NAME, RedisConnectionProvider.class);
        String host = getProperty("redis.host", properties);
        int port = Integer.parseInt(getProperty("redis.port", properties));
        String password = getProperty("redis.password", properties);

        GenericObjectPoolConfig<Connection> poolConfig = new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(32);
        poolConfig.setMaxIdle(16);

        if (password != null && !password.trim().isEmpty()) {
            this.jedis = new JedisPooled(poolConfig, host, port, 2000, password);
        } else {
            this.jedis = new JedisPooled(poolConfig, host, port);
        }

        healthCheckRegistry.register(REDIS_INSTANCE_NAME, new RedisHealthCheck(jedis));
    }

    public JedisPooled getJedis() {
        return jedis;
    }
}
