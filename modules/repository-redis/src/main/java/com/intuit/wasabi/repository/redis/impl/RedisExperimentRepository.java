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

import com.datastax.driver.core.Statement;
import com.google.common.base.Preconditions;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Table;
import com.google.inject.Inject;
import com.intuit.wasabi.exceptions.ExperimentNotFoundException;
import com.intuit.wasabi.experimentobjects.Application;
import com.intuit.wasabi.experimentobjects.Bucket;
import com.intuit.wasabi.experimentobjects.Bucket.BucketAuditInfo;
import com.intuit.wasabi.experimentobjects.BucketList;
import com.intuit.wasabi.experimentobjects.Experiment;
import com.intuit.wasabi.experimentobjects.Experiment.ExperimentAuditInfo;
import com.intuit.wasabi.experimentobjects.Experiment.ID;
import com.intuit.wasabi.experimentobjects.Experiment.State;
import com.intuit.wasabi.experimentobjects.ExperimentList;
import com.intuit.wasabi.experimentobjects.ExperimentValidator;
import com.intuit.wasabi.experimentobjects.NewExperiment;
import com.intuit.wasabi.redis.RedisConnectionProvider;
import com.intuit.wasabi.repository.ExperimentRepository;
import com.intuit.wasabi.repository.RepositoryException;
import com.intuit.wasabi.repository.redis.RedisKeys;
import com.intuit.wasabi.repository.redis.RedisSerde;
import org.slf4j.Logger;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.params.ScanParams;
import redis.clients.jedis.resps.ScanResult;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.slf4j.LoggerFactory.getLogger;

/**
 * Redis experiment repository.
 */
public class RedisExperimentRepository implements ExperimentRepository {

    private static final Logger LOGGER = getLogger(RedisExperimentRepository.class);

    private final JedisPooled jedis;
    private final RedisSerde serde;
    private final ExperimentValidator validator;

    @Inject
    public RedisExperimentRepository(RedisConnectionProvider connectionProvider,
                                     RedisSerde serde,
                                     ExperimentValidator validator) {
        this.jedis = connectionProvider.getJedis();
        this.serde = serde;
        this.validator = validator;
    }

    @Override
    public Experiment getExperiment(Experiment.ID experimentID) {
        LOGGER.debug("Getting experiment {}", experimentID);
        return internalGetExperiment(experimentID);
    }

    protected Experiment internalGetExperiment(Experiment.ID experimentID) {
        Preconditions.checkNotNull(experimentID, "Parameter \"experimentID\" cannot be null");
        try {
            String json = jedis.get(RedisKeys.experimentKey(experimentID));
            if (json == null) {
                return null;
            }
            Experiment experiment = serde.deserializeExperiment(json);
            if (experiment.getState() == State.DELETED) {
                return null;
            }
            return experiment;
        } catch (Exception e) {
            LOGGER.error("Exception while getting experiment {}", experimentID);
            throw new RepositoryException("Could not retrieve experiment with ID \"" + experimentID + "\"", e);
        }
    }

    @Override
    public Map<Application.Name, List<Experiment>> getExperimentsForApps(Collection<Application.Name> appNames) {
        Map<Application.Name, List<Experiment>> experimentMap = new HashMap<>();
        try {
            for (Application.Name appName : appNames) {
                experimentMap.put(appName, getExperiments(appName));
            }
        } catch (Exception e) {
            LOGGER.error("Error while getExperimentsForApps {}", appNames, e);
            throw new RepositoryException("Error while getExperimentsForApps", e);
        }
        return experimentMap;
    }

    @Override
    public Experiment getExperiment(Application.Name appName, Experiment.Label experimentLabel) {
        LOGGER.debug("Getting App {} with label {}", appName, experimentLabel);
        return internalGetExperiment(appName, experimentLabel);
    }

    protected Experiment internalGetExperiment(Application.Name appName, Experiment.Label experimentLabel) {
        Preconditions.checkNotNull(appName, "Parameter \"appName\" cannot be null");
        Preconditions.checkNotNull(experimentLabel, "Parameter \"experimentLabel\" cannot be null");
        try {
            String experimentId = jedis.get(RedisKeys.experimentLabelKey(appName.toString(), experimentLabel.toString()));
            if (experimentId == null) {
                return null;
            }
            return internalGetExperiment(Experiment.ID.valueOf(UUID.fromString(experimentId)));
        } catch (Exception e) {
            LOGGER.error("Error while getting experiment by app {} with label {}", appName, experimentLabel, e);
            throw new RepositoryException("Could not retrieve experiment \"" + appName + "\".\"" + experimentLabel + "\"", e);
        }
    }

    @Override
    public Experiment.ID createExperiment(NewExperiment newExperiment) {
        LOGGER.debug("Create experiment started... Experiment={}", newExperiment);

        final Date NOW = new Date();
        final State DRAFT = State.DRAFT;

        try {
            Experiment experiment = Experiment.withID(newExperiment.getId())
                    .withDescription(newExperiment.getDescription() != null ? newExperiment.getDescription() : "")
                    .withRule(newExperiment.getRule() != null ? newExperiment.getRule() : "")
                    .withSamplingPercent(newExperiment.getSamplingPercent())
                    .withStartTime(newExperiment.getStartTime())
                    .withEndTime(newExperiment.getEndTime())
                    .withState(DRAFT)
                    .withCreationTime(NOW)
                    .withModificationTime(NOW)
                    .build();
            experiment.setLabel(newExperiment.getLabel());
            experiment.setApplicationName(newExperiment.getApplicationName());
            experiment.setHypothesisIsCorrect(newExperiment.getHypothesisIsCorrect() != null ? newExperiment.getHypothesisIsCorrect() : "");
            experiment.setResults(newExperiment.getResults() != null ? newExperiment.getResults() : "");
            experiment.setIsPersonalizationEnabled(newExperiment.getIsPersonalizationEnabled());
            experiment.setModelName(newExperiment.getModelName());
            experiment.setModelVersion(newExperiment.getModelVersion());
            experiment.setIsRapidExperiment(newExperiment.getIsRapidExperiment());
            experiment.setUserCap(newExperiment.getUserCap());
            experiment.setCreatorID(newExperiment.getCreatorID() != null ? newExperiment.getCreatorID() : "");
            experiment.setTags(newExperiment.getTags());
            experiment.setSourceURL(newExperiment.getSourceURL());
            experiment.setExperimentType(newExperiment.getExperimentType());

            String appName = newExperiment.getApplicationName().toString();
            String expId = newExperiment.getId().getRawID().toString();

            jedis.set(RedisKeys.experimentKey(newExperiment.getId()), serde.serializeExperiment(experiment));
            jedis.sadd(RedisKeys.EXP_ALL, expId);
            jedis.sadd(RedisKeys.experimentAppKey(appName), expId);
            jedis.set(RedisKeys.experimentLabelKey(appName, newExperiment.getLabel().toString()), expId);
            jedis.sadd(RedisKeys.AUTH_APPLICATIONS, appName);
            jedis.rpush(RedisKeys.priorityKey(appName), expId);
        } catch (Exception e) {
            LOGGER.error("Error while creating experiment {}", newExperiment, e);
            throw new RepositoryException("Exception while creating experiment " + newExperiment + " message " + e, e);
        }

        LOGGER.debug("Create experiment finished...");
        return newExperiment.getId();
    }

    @Override
    public void createIndicesForNewExperiment(NewExperiment newExperiment) {
        LOGGER.debug("createIndicesForNewExperiment no-op for Redis backend: {}", newExperiment);
    }

    @Override
    public Experiment updateExperiment(Experiment experiment) {
        LOGGER.debug("Updating experiment {}", experiment);
        validator.validateExperiment(experiment);
        try {
            final Date NOW = new Date();
            experiment.setModificationTime(NOW);
            storeExperiment(experiment);
            updateExperimentLabelIndex(experiment);
        } catch (Exception e) {
            LOGGER.error("Error while experiment updating experiment {}", experiment, e);
            throw new RepositoryException("Could not update experiment with ID \"" + experiment.getID() + "\"", e);
        }
        return experiment;
    }

    @Override
    public Experiment updateExperimentState(Experiment experiment, State state) {
        LOGGER.debug("Updating experiment {} state {}", experiment, state);
        validator.validateExperiment(experiment);
        try {
            final Date NOW = new Date();
            experiment = Experiment.from(experiment).withState(state).withModificationTime(NOW).build();
            storeExperiment(experiment);
            updateExperimentLabelIndex(experiment);
        } catch (Exception e) {
            LOGGER.error("Error while updating experiment {} state {}", experiment, state, e);
            throw new RepositoryException("Could not update experiment with ID \""
                    + experiment.getID() + "\"" + " to state " + state.toString(), e);
        }
        return experiment;
    }

    @Override
    public List<Experiment.ID> getExperiments() {
        LOGGER.debug("Getting experiment ids which are live");
        try {
            Set<String> ids = jedis.smembers(RedisKeys.EXP_ALL);
            if (ids == null || ids.isEmpty()) {
                return Collections.emptyList();
            }
            List<Experiment.ID> experimentIds = new ArrayList<>();
            for (String id : ids) {
                Experiment experiment = internalGetExperiment(Experiment.ID.valueOf(UUID.fromString(id)));
                if (experiment != null) {
                    experimentIds.add(experiment.getID());
                }
            }
            return experimentIds;
        } catch (Exception e) {
            LOGGER.error("Error while getting experiment ids which are live", e);
            throw new RepositoryException("Could not retrieve experiments", e);
        }
    }

    @Override
    public List<Experiment> getExperiments(Application.Name appName) {
        LOGGER.debug("Getting experiments for application {}", appName);
        try {
            Set<String> ids = jedis.smembers(RedisKeys.experimentAppKey(appName.toString()));
            if (ids == null || ids.isEmpty()) {
                return Collections.emptyList();
            }
            List<Experiment> experiments = new ArrayList<>();
            for (String id : ids) {
                Experiment experiment = internalGetExperiment(Experiment.ID.valueOf(UUID.fromString(id)));
                if (experiment != null
                        && experiment.getState() != State.TERMINATED
                        && experiment.getState() != State.DELETED) {
                    experiments.add(experiment);
                }
            }
            return experiments;
        } catch (Exception e) {
            LOGGER.error("Error while getting experiments for app {}", appName, e);
            throw new RepositoryException("Could not retrieve experiments for app " + appName, e);
        }
    }

    @Override
    public void deleteExperiment(NewExperiment newExperiment) {
        LOGGER.debug("Deleting experiment {}", newExperiment);
        try {
            removeExperimentIndices(newExperiment.getID(), newExperiment.getApplicationName(), newExperiment.getLabel());
            jedis.del(RedisKeys.experimentKey(newExperiment.getID()));
        } catch (Exception e) {
            LOGGER.debug("Error while deleting experiment {}", newExperiment, e);
            throw new RepositoryException("Could not delete experiment "
                    + "with id \"" + newExperiment.getId() + "\"", e);
        }
    }

    @Override
    public ExperimentList getExperiments(Collection<Experiment.ID> experimentIDs) {
        LOGGER.debug("Getting experiments {}", experimentIDs);
        ExperimentList result = new ExperimentList();
        try {
            if (!experimentIDs.isEmpty()) {
                Map<Experiment.ID, Experiment> experimentMap = getExperimentsMap(experimentIDs);
                result.setExperiments(new ArrayList<>(experimentMap.values()));
            }
        } catch (Exception e) {
            LOGGER.error("Error while getting experiments {}", experimentIDs, e);
            throw new RepositoryException("Could not retrieve the experiments for the collection of experimentIDs", e);
        }
        return result;
    }

    @Override
    public Map<Experiment.ID, Experiment> getExperimentsMap(Collection<Experiment.ID> experimentIds) {
        Map<Experiment.ID, Experiment> experimentMap = new HashMap<>();
        try {
            for (Experiment.ID expId : experimentIds) {
                Experiment experiment = internalGetExperiment(expId);
                if (experiment != null) {
                    experimentMap.put(expId, experiment);
                }
            }
        } catch (Exception e) {
            LOGGER.error("Error while preparing experimentMap for {}", experimentIds, e);
            throw new RepositoryException("Error while preparing experimentMap", e);
        }
        return experimentMap;
    }

    @Override
    public Table<Experiment.ID, Experiment.Label, Experiment> getExperimentList(Application.Name appName) {
        try {
            Table<Experiment.ID, Experiment.Label, Experiment> result = HashBasedTable.create();
            for (Experiment experiment : getExperiments(appName)) {
                result.put(experiment.getID(), experiment.getLabel(), experiment);
            }
            return result;
        } catch (Exception e) {
            throw new RepositoryException("Could not retrieve experiment list " + appName.toString() + "because: " + e, e);
        }
    }

    @Override
    public List<Application.Name> getApplicationsList() {
        try {
            Set<String> appNames = jedis.smembers(RedisKeys.AUTH_APPLICATIONS);
            if (appNames == null || appNames.isEmpty()) {
                return Collections.emptyList();
            }
            return appNames.stream()
                    .map(Application.Name::valueOf)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RepositoryException("Could not retrieve the application names because : " + e, e);
        }
    }

    @Override
    public Bucket getBucket(Experiment.ID experimentID, Bucket.Label bucketLabel) {
        Preconditions.checkNotNull(experimentID, "Parameter \"experimentID\" cannot be null");
        Preconditions.checkNotNull(bucketLabel, "Parameter \"bucketLabel\" cannot be null");
        try {
            String json = jedis.get(RedisKeys.bucketKey(experimentID.getRawID(), bucketLabel.toString()));
            return serde.deserializeBucket(json);
        } catch (Exception e) {
            throw new RepositoryException("Could not retrieve bucket \""
                    + bucketLabel + "\" in experiment \"" + experimentID + "\" because " + e, e);
        }
    }

    @Override
    public void createBucket(Bucket newBucket) {
        LOGGER.debug("Creating bucket {}", newBucket);
        Preconditions.checkNotNull(newBucket, "Parameter \"newBucket\" cannot be null");
        final Bucket.State STATE = Bucket.State.OPEN;
        try {
            Bucket bucket = Bucket.from(newBucket).withState(STATE).build();
            jedis.set(RedisKeys.bucketKey(newBucket.getExperimentID().getRawID(), newBucket.getLabel().toString()),
                    serde.serializeBucket(bucket));
        } catch (Exception e) {
            LOGGER.error("Error creating bucket {}", newBucket, e);
            throw new RepositoryException("Could not create bucket \"" + newBucket + "\" because " + e, e);
        }
    }

    @Override
    public Bucket updateBucket(Bucket bucket) {
        if (bucket.isControl()) {
            try {
                BucketList buckets = getBucketList(bucket.getExperimentID());
                for (Bucket currentBucket : buckets.getBuckets()) {
                    if (currentBucket.isControl()) {
                        Bucket updated = Bucket.from(currentBucket).withControl(false).build();
                        storeBucket(updated);
                    }
                }
            } catch (Exception e) {
                throw new RepositoryException("Could not update buckets", e);
            }
        }
        try {
            storeBucket(bucket);
        } catch (Exception e) {
            throw new RepositoryException("Could not update bucket \"" + bucket.getExperimentID() + "\".\"" + bucket.getLabel() + "\"", e);
        }
        return bucket;
    }

    @Override
    public Bucket updateBucketAllocationPercentage(Bucket bucket, Double desiredAllocationPercentage) {
        try {
            Bucket updated = Bucket.from(bucket).withAllocationPercent(desiredAllocationPercentage).build();
            storeBucket(updated);
            return getBucket(bucket.getExperimentID(), bucket.getLabel());
        } catch (Exception e) {
            throw new RepositoryException("Could not update bucket allocation percentage \""
                    + bucket.getExperimentID() + "\".\"" + bucket.getLabel() + "\"", e);
        }
    }

    @Override
    public Bucket updateBucketState(Bucket bucket, Bucket.State desiredState) {
        LOGGER.debug("Updating bucket {} state {}", bucket, desiredState);
        try {
            Bucket updated = Bucket.from(bucket).withState(desiredState).build();
            storeBucket(updated);
            return getBucket(bucket.getExperimentID(), bucket.getLabel());
        } catch (Exception e) {
            LOGGER.error("Error while updating bucket {} state {}", bucket, desiredState, e);
            throw new RepositoryException("Exception while updating bucket state "
                    + bucket + " state " + desiredState, e);
        }
    }

    @Override
    public BucketList updateBucketBatch(Experiment.ID experimentID, BucketList bucketList) {
        LOGGER.debug("bucket update {} for experiment id {}", bucketList, experimentID);
        try {
            for (Bucket bucket : bucketList.getBuckets()) {
                Bucket existing = getBucket(experimentID, bucket.getLabel());
                if (existing == null) {
                    existing = Bucket.newInstance(experimentID, bucket.getLabel()).build();
                }
                Bucket.Builder builder = Bucket.from(existing);
                if (bucket.getState() != null) {
                    builder.withState(bucket.getState());
                }
                if (bucket.getAllocationPercent() != null) {
                    builder.withAllocationPercent(bucket.getAllocationPercent());
                }
                if (bucket.getDescription() != null) {
                    builder.withDescription(bucket.getDescription());
                }
                if (bucket.isControl() != null) {
                    builder.withControl(bucket.isControl());
                }
                if (bucket.getPayload() != null) {
                    builder.withPayload(bucket.getPayload());
                }
                storeBucket(builder.build());
            }
        } catch (Exception e) {
            throw new RepositoryException("Could not update bucket for experiment \"" + experimentID + "\"", e);
        }
        return getBuckets(experimentID, false);
    }

    @Override
    public void deleteBucket(Experiment.ID experimentID, Bucket.Label bucketLabel) {
        Preconditions.checkNotNull(experimentID, "Parameter \"experimentID\" cannot be null");
        Preconditions.checkNotNull(bucketLabel, "Parameter \"bucketLabel\" cannot be null");
        try {
            jedis.del(RedisKeys.bucketKey(experimentID.getRawID(), bucketLabel.toString()));
        } catch (Exception e) {
            throw new RepositoryException("Could not delete bucket \"" + bucketLabel + "\" from experiment with ID \""
                    + experimentID + "\"", e);
        }
    }

    @Override
    public void logBucketChanges(Experiment.ID experimentID, Bucket.Label bucketLabel,
                                 List<BucketAuditInfo> changeList) {
        LOGGER.debug("logBucketChanges no-op for Redis backend: {} {} {}", experimentID, bucketLabel, changeList);
    }

    @Override
    public void logExperimentChanges(Experiment.ID experimentID, List<ExperimentAuditInfo> changeList) {
        LOGGER.debug("logExperimentChanges no-op for Redis backend: {} {}", experimentID, changeList);
    }

    @Override
    public Map<Experiment.ID, BucketList> getBucketList(Collection<Experiment.ID> experimentIds) {
        LOGGER.debug("Getting buckets list by experimentIDs {}", experimentIds);
        Map<Experiment.ID, BucketList> bucketMap = new HashMap<>();
        try {
            for (Experiment.ID expId : experimentIds) {
                bucketMap.put(expId, getBucketList(expId));
            }
        } catch (Exception e) {
            LOGGER.error("getBucketList for {} failed", experimentIds, e);
            throw new RepositoryException("Could not fetch buckets for the list of experiments", e);
        }
        return bucketMap;
    }

    @Override
    public BucketList getBucketList(Experiment.ID experimentID) {
        return getBuckets(experimentID, false);
    }

    @Override
    public BucketList getBuckets(Experiment.ID experimentID, boolean checkExperiment) {
        LOGGER.debug("Getting buckets for {}", experimentID);
        Preconditions.checkNotNull(experimentID, "Parameter \"experimentID\" cannot be null");
        try {
            if (checkExperiment) {
                Experiment experiment = getExperiment(experimentID);
                if (experiment == null) {
                    throw new ExperimentNotFoundException(experimentID);
                }
            }

            BucketList bucketList = new BucketList();
            List<Bucket> buckets = new ArrayList<>();
            for (String key : scanKeys(RedisKeys.bucketPattern(experimentID.getRawID()))) {
                String json = jedis.get(key);
                Bucket bucket = serde.deserializeBucket(json);
                if (bucket != null) {
                    buckets.add(bucket);
                }
            }
            bucketList.setBuckets(buckets);
            return bucketList;
        } catch (ExperimentNotFoundException e) {
            throw e;
        } catch (Exception e) {
            LOGGER.error("Error while getting buckets for {}", experimentID, e);
            throw new RepositoryException("Unable to get buckets for " + experimentID, e);
        }
    }

    @Override
    public void updateStateIndex(Experiment experiment) {
        LOGGER.debug("updateStateIndex no-op for Redis backend: {}", experiment);
    }

    @Override
    public Statement createApplication(Application.Name applicationName) {
        LOGGER.debug("createApplication returns null for Redis backend: {}", applicationName);
        jedis.sadd(RedisKeys.AUTH_APPLICATIONS, applicationName.toString());
        return null;
    }

    @Override
    public Map<Application.Name, Set<String>> getTagListForApplications(Collection<Application.Name> applicationNames) {
        LOGGER.debug("Retrieving Experiment Tags for applications {}", applicationNames);
        try {
            Map<Application.Name, Set<String>> result = new HashMap<>();
            for (Application.Name appName : applicationNames) {
                Set<String> allTags = new TreeSet<>();
                for (Experiment experiment : getExperiments(appName)) {
                    if (experiment.getTags() != null) {
                        allTags.addAll(experiment.getTags());
                    }
                }
                if (!allTags.isEmpty()) {
                    result.put(appName, allTags);
                }
            }
            return result;
        } catch (Exception e) {
            LOGGER.error("Error while retrieving ExperimentTags for {}", applicationNames, e);
            throw new RepositoryException("Unable to get ExperimentTags for applications: \""
                    + applicationNames.toString() + "\"" + e);
        }
    }

    private void storeExperiment(Experiment experiment) {
        jedis.set(RedisKeys.experimentKey(experiment.getID()), serde.serializeExperiment(experiment));
    }

    private void storeBucket(Bucket bucket) {
        jedis.set(RedisKeys.bucketKey(bucket.getExperimentID().getRawID(), bucket.getLabel().toString()),
                serde.serializeBucket(bucket));
    }

    private void updateExperimentLabelIndex(Experiment experiment) {
        if (experiment.getState() == State.TERMINATED || experiment.getState() == State.DELETED) {
            jedis.del(RedisKeys.experimentLabelKey(
                    experiment.getApplicationName().toString(), experiment.getLabel().toString()));
            jedis.srem(RedisKeys.EXP_ALL, experiment.getID().getRawID().toString());
            return;
        }
        jedis.set(
                RedisKeys.experimentLabelKey(experiment.getApplicationName().toString(), experiment.getLabel().toString()),
                experiment.getID().getRawID().toString()
        );
        jedis.sadd(RedisKeys.EXP_ALL, experiment.getID().getRawID().toString());
    }

    private void removeExperimentIndices(ID experimentId, Application.Name appName, Experiment.Label label) {
        jedis.srem(RedisKeys.EXP_ALL, experimentId.getRawID().toString());
        jedis.srem(RedisKeys.experimentAppKey(appName.toString()), experimentId.getRawID().toString());
        jedis.del(RedisKeys.experimentLabelKey(appName.toString(), label.toString()));
        removeFromPriorityList(appName, experimentId);
    }

    private void removeFromPriorityList(Application.Name appName, ID experimentId) {
        String priorityKey = RedisKeys.priorityKey(appName.toString());
        List<String> priorities = jedis.lrange(priorityKey, 0, -1);
        if (priorities == null || priorities.isEmpty()) {
            return;
        }
        jedis.del(priorityKey);
        for (String id : priorities) {
            if (!id.equals(experimentId.getRawID().toString())) {
                jedis.rpush(priorityKey, id);
            }
        }
    }

    private List<String> scanKeys(String pattern) {
        List<String> keys = new ArrayList<>();
        String cursor = ScanParams.SCAN_POINTER_START;
        ScanParams scanParams = new ScanParams().match(pattern).count(100);
        do {
            ScanResult<String> scanResult = jedis.scan(cursor, scanParams);
            keys.addAll(scanResult.getResult());
            cursor = scanResult.getCursor();
        } while (!ScanParams.SCAN_POINTER_START.equals(cursor));
        return keys;
    }
}
