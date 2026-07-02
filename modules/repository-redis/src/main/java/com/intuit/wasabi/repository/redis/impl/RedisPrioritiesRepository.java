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
import com.intuit.wasabi.experimentobjects.Application;
import com.intuit.wasabi.experimentobjects.Experiment;
import com.intuit.wasabi.experimentobjects.PrioritizedExperiment;
import com.intuit.wasabi.experimentobjects.PrioritizedExperimentList;
import com.intuit.wasabi.redis.RedisConnectionProvider;
import com.intuit.wasabi.repository.CassandraRepository;
import com.intuit.wasabi.repository.ExperimentRepository;
import com.intuit.wasabi.repository.PrioritiesRepository;
import com.intuit.wasabi.repository.RepositoryException;
import com.intuit.wasabi.repository.redis.RedisKeys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.JedisPooled;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static java.util.Objects.nonNull;

public class RedisPrioritiesRepository implements PrioritiesRepository {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisPrioritiesRepository.class);

    private final JedisPooled jedis;
    private final ExperimentRepository experimentRepository;

    @Inject
    public RedisPrioritiesRepository(RedisConnectionProvider connectionProvider,
                                     @CassandraRepository ExperimentRepository experimentRepository) {
        this.jedis = connectionProvider.getJedis();
        this.experimentRepository = experimentRepository;
    }

    @Override
    public PrioritizedExperimentList getPriorities(Application.Name applicationName) {
        LOGGER.debug("Getting priorities for {}", applicationName);
        PrioritizedExperimentList prioritizedExperimentList = new PrioritizedExperimentList();
        try {
            List<Experiment.ID> priorityList = getPriorityList(applicationName);
            int priorityValue = 1;
            for (Experiment.ID experimentId : priorityList) {
                Experiment experiment = experimentRepository.getExperiment(experimentId);
                if (nonNull(experiment)) {
                    prioritizedExperimentList.addPrioritizedExperiment(
                            PrioritizedExperiment.from(experiment, priorityValue).build());
                    priorityValue += 1;
                }
            }
        } catch (Exception e) {
            LOGGER.error("Exception while getting priority list for {}", applicationName, e);
            throw new RepositoryException(
                    "Unable to retrieve the priority list for application: \"" + applicationName.toString() + "\"" + e);
        }
        return prioritizedExperimentList;
    }

    @Override
    public Map<Application.Name, PrioritizedExperimentList> getPriorities(Collection<Application.Name> applicationNames) {
        Map<Application.Name, PrioritizedExperimentList> appPrioritiesMap = new HashMap<>();
        for (Application.Name appName : applicationNames) {
            appPrioritiesMap.put(appName, getPriorities(appName));
        }
        return appPrioritiesMap;
    }

    @Override
    public int getPriorityListLength(Application.Name applicationName) {
        return getPriorityList(applicationName).size();
    }

    @Override
    public void createPriorities(Application.Name applicationName, List<Experiment.ID> priorityIds) {
        LOGGER.debug("Creating priority list for {} and ids {}", applicationName, priorityIds);
        String priorityKey = RedisKeys.priorityKey(applicationName.toString());
        try {
            jedis.del(priorityKey);
            if (!priorityIds.isEmpty()) {
                for (Experiment.ID experimentId : priorityIds) {
                    jedis.rpush(priorityKey, experimentId.getRawID().toString());
                }
            }
        } catch (Exception e) {
            LOGGER.error("Exception while updating priority list for {} and ids {}", applicationName, priorityIds, e);
            throw new RepositoryException(
                    "Unable to modify the priority list for application: \"" + applicationName.toString() + "\"" + e);
        }
    }

    @Override
    public List<Experiment.ID> getPriorityList(Application.Name applicationName) {
        LOGGER.debug("Getting priority list for {}", applicationName);
        List<Experiment.ID> experimentIds = new ArrayList<>();
        try {
            List<String> priorities = jedis.lrange(RedisKeys.priorityKey(applicationName.toString()), 0, -1);
            if (priorities == null || priorities.isEmpty()) {
                return Collections.emptyList();
            }
            for (String uuid : priorities) {
                experimentIds.add(Experiment.ID.valueOf(UUID.fromString(uuid)));
            }
        } catch (Exception e) {
            LOGGER.error("Exception while getting priority list for {}", applicationName, e);
            throw new RepositoryException(
                    "Unable to retrieve the priority list for application: \"" + applicationName.toString() + "\"" + e);
        }
        return experimentIds;
    }
}
