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

import com.google.inject.AbstractModule;
import com.google.inject.name.Names;

import static com.google.inject.Scopes.SINGLETON;

public class RedisClientModule extends AbstractModule {

    public static final String REDIS_INSTANCE_NAME = "RedisWasabiCluster";

    @Override
    protected void configure() {
        bind(RedisConnectionProvider.class).in(SINGLETON);
        bind(String.class).annotatedWith(Names.named("RedisInstanceName"))
                .toInstance(REDIS_INSTANCE_NAME);
    }
}
