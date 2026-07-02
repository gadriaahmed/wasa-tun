/*******************************************************************************
 * Copyright 2016 Intuit
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
package com.intuit.wasabi.database;

import com.google.inject.AbstractModule;
import com.google.inject.Provides;
import com.zaxxer.hikari.HikariConfig;
import org.slf4j.Logger;

import java.util.Properties;

import static com.intuit.autumn.utils.PropertyFactory.create;
import static com.intuit.autumn.utils.PropertyFactory.getProperty;
import static java.lang.Integer.parseInt;
import static org.slf4j.LoggerFactory.getLogger;

public class DatabaseModule extends AbstractModule {

    public static final String PROPERTY_NAME = "/database.properties";
    private static final Logger LOGGER = getLogger(DatabaseModule.class);

    @Override
    protected void configure() {
        LOGGER.debug("installing module: {}", DatabaseModule.class.getSimpleName());

        bind(TransactionFactory.class).to(DBITransactionFactory.class).asEagerSingleton();

        LOGGER.debug("installed module: {}", DatabaseModule.class.getSimpleName());
    }

    @Provides
    HikariConfig provideHikariConfig() {
        Properties properties = create(PROPERTY_NAME, DatabaseModule.class);

        String host = getProperty("database.url.host", properties);
        String port = getProperty("database.url.port", properties);
        String dbName = getProperty("database.url.dbname", properties);
        String dbArgs = getProperty("database.url.args", properties);

        int partitions = parseInt(getProperty("database.pool.partitions", properties));
        int minPerPartition = parseInt(getProperty("database.pool.connections.min", properties));
        int maxPerPartition = parseInt(getProperty("database.pool.connections.max", properties));

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://" + host + ":" + port + "/" + dbName + "?" + dbArgs);
        config.setUsername(getProperty("database.user", properties));
        config.setPassword(getProperty("database.password", properties));
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        config.setMinimumIdle(Math.max(1, partitions * minPerPartition));
        config.setMaximumPoolSize(Math.max(config.getMinimumIdle(), partitions * maxPerPartition));
        config.setPoolName("wasabi-mysql");

        return config;
    }
}
