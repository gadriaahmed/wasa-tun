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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.intuit.wasabi.experimentobjects.Bucket;
import com.intuit.wasabi.experimentobjects.Experiment;
import com.intuit.wasabi.repository.RepositoryException;

import java.io.IOException;

/**
 * Jackson serialize/deserialize helpers for {@link Experiment} and {@link Bucket}.
 */
@Singleton
public class RedisSerde {

    private final ObjectMapper objectMapper;

    @Inject
    public RedisSerde() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public String serializeExperiment(Experiment experiment) {
        try {
            return objectMapper.writeValueAsString(experiment);
        } catch (IOException e) {
            throw new RepositoryException("Could not serialize experiment " + experiment.getID(), e);
        }
    }

    public Experiment deserializeExperiment(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, Experiment.class);
        } catch (IOException e) {
            throw new RepositoryException("Could not deserialize experiment", e);
        }
    }

    public String serializeBucket(Bucket bucket) {
        try {
            return objectMapper.writeValueAsString(bucket);
        } catch (IOException e) {
            throw new RepositoryException("Could not serialize bucket " + bucket.getLabel(), e);
        }
    }

    public Bucket deserializeBucket(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, Bucket.class);
        } catch (IOException e) {
            throw new RepositoryException("Could not deserialize bucket", e);
        }
    }
}
