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
import com.intuit.wasabi.experimentobjects.ExperimentList;
import com.intuit.wasabi.redis.RedisConnectionProvider;
import com.intuit.wasabi.repository.CassandraRepository;
import com.intuit.wasabi.repository.ExperimentRepository;
import com.intuit.wasabi.repository.MutexRepository;
import com.intuit.wasabi.repository.RepositoryException;
import com.intuit.wasabi.repository.redis.RedisKeys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.JedisPooled;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class RedisMutexRepository implements MutexRepository {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisMutexRepository.class);

    private final JedisPooled jedis;
    private final ExperimentRepository experimentRepository;

    @Inject
    public RedisMutexRepository(RedisConnectionProvider connectionProvider,
                                @CassandraRepository ExperimentRepository experimentRepository) {
        this.jedis = connectionProvider.getJedis();
        this.experimentRepository = experimentRepository;
    }

    @Override
    public List<Experiment.ID> getExclusionList(Experiment.ID experimentID) {
        LOGGER.debug("Getting exclusions for {}", experimentID);
        try {
            Set<String> exclusions = jedis.smembers(RedisKeys.exclusionKey(experimentID.getRawID()));
            if (exclusions == null || exclusions.isEmpty()) {
                return Collections.emptyList();
            }
            List<Experiment.ID> exclusionIds = new ArrayList<>();
            for (String pair : exclusions) {
                exclusionIds.add(Experiment.ID.valueOf(UUID.fromString(pair)));
            }
            return exclusionIds;
        } catch (Exception e) {
            LOGGER.error("Error while getting exclusions for {}", experimentID, e);
            throw new RepositoryException("Could not fetch exclusions for experiment \"" + experimentID + "\" ", e);
        }
    }

    @Override
    public void deleteExclusion(Experiment.ID base, Experiment.ID pair) throws RepositoryException {
        LOGGER.debug("Deleting exclusions for base {} pair {}", base, pair);
        try {
            jedis.srem(RedisKeys.exclusionKey(base.getRawID()), pair.getRawID().toString());
            jedis.srem(RedisKeys.exclusionKey(pair.getRawID()), base.getRawID().toString());
        } catch (Exception e) {
            LOGGER.error("Error while deleting exclusions for base {} pair {}", base, pair, e);
            throw new RepositoryException("Could not delete the exclusion \"" + base + "\", \"" + pair + "\"", e);
        }
    }

    @Override
    public void createExclusion(Experiment.ID baseID, Experiment.ID pairID) throws RepositoryException {
        LOGGER.debug("Create exclusions for {} {}", baseID, pairID);
        try {
            jedis.sadd(RedisKeys.exclusionKey(baseID.getRawID()), pairID.getRawID().toString());
            jedis.sadd(RedisKeys.exclusionKey(pairID.getRawID()), baseID.getRawID().toString());
        } catch (Exception e) {
            LOGGER.error("Error while create exclusions for {} {}", baseID, pairID, e);
            throw new RepositoryException("Could not insert the exclusion \"" + baseID + "\"", e);
        }
    }

    @Override
    public ExperimentList getExclusions(Experiment.ID base) {
        LOGGER.debug("Getting exclusion list for {}", base);
        try {
            List<Experiment.ID> exclusionIds = getExclusionList(base);
            List<Experiment> experiments = new ArrayList<>();
            for (Experiment.ID exclusionId : exclusionIds) {
                Experiment experiment = experimentRepository.getExperiment(exclusionId);
                if (experiment != null) {
                    experiments.add(experiment);
                }
            }
            ExperimentList experimentList = new ExperimentList();
            experimentList.setExperiments(experiments);
            return experimentList;
        } catch (Exception e) {
            LOGGER.error("Error while getting exclusion list for {}", base, e);
            throw new RepositoryException("Could not retrieve the exclusions for \"" + base + "\"", e);
        }
    }

    @Override
    public ExperimentList getNotExclusions(Experiment.ID base) {
        LOGGER.debug("Getting not exclusions list for {}", base);
        try {
            Set<String> exclusionPairIds = new HashSet<>();
            Set<String> exclusions = jedis.smembers(RedisKeys.exclusionKey(base.getRawID()));
            if (exclusions != null) {
                exclusionPairIds.addAll(exclusions);
            }

            Experiment baseExperiment = experimentRepository.getExperiment(base);
            if (baseExperiment == null) {
                ExperimentList result = new ExperimentList();
                result.setExperiments(Collections.emptyList());
                return result;
            }

            Application.Name appName = baseExperiment.getApplicationName();
            List<Experiment> notMutex = new ArrayList<>();
            for (Experiment exp : experimentRepository.getExperiments(appName)) {
                if (!exclusionPairIds.contains(exp.getID().getRawID().toString())
                        && !exp.getID().equals(base)) {
                    notMutex.add(exp);
                }
            }

            ExperimentList result = new ExperimentList();
            result.setExperiments(notMutex);
            return result;
        } catch (Exception e) {
            LOGGER.debug("Error while getting not exclusions list for {}", base, e);
            throw new RepositoryException("Could not retrieve the exclusions for \"" + base + "\"", e);
        }
    }

    @Override
    public Map<Experiment.ID, List<Experiment.ID>> getExclusivesList(Collection<Experiment.ID> experimentIds) {
        LOGGER.debug("Getting exclusions for {}", experimentIds);
        Map<Experiment.ID, List<Experiment.ID>> exclusionMap = new HashMap<>();
        for (Experiment.ID experimentId : experimentIds) {
            exclusionMap.put(experimentId, getExclusionList(experimentId));
        }
        return exclusionMap;
    }
}
