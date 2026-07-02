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
import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.util.Modules;
import com.zaxxer.hikari.HikariConfig;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;

public class DatabaseModuleTest {

    @Test
    public void testProviderCP() {
        Injector injector = Guice.createInjector(Modules.override(new DatabaseModule()).with(new AbstractModule() {
            @Override
            protected void configure() {
                bind(TransactionFactory.class).toInstance(mock(TransactionFactory.class));
            }
        }));

        HikariConfig config = injector.getInstance(HikariConfig.class);

        assertEquals(HikariConfig.class, config.getClass());
        assert (config.getJdbcUrl().startsWith("jdbc:postgresql"));
        assertEquals("readwrite", config.getUsername());
        assertEquals("readwrite", config.getPassword());
        assertEquals(10, config.getMinimumIdle());
        assertEquals(30, config.getMaximumPoolSize());
    }

}
