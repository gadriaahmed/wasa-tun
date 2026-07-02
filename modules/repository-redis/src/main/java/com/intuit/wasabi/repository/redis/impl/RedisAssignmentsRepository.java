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

import com.codahale.metrics.annotation.Timed;
import com.google.inject.Inject;
import com.intuit.wasabi.analyticsobjects.Parameters;
import com.intuit.wasabi.analyticsobjects.counts.AssignmentCounts;
import com.intuit.wasabi.assignmentobjects.Assignment;
import com.intuit.wasabi.experimentobjects.Application;
import com.intuit.wasabi.experimentobjects.Bucket;
import com.intuit.wasabi.experimentobjects.BucketList;
import com.intuit.wasabi.experimentobjects.Context;
import com.intuit.wasabi.experimentobjects.Experiment;
import com.intuit.wasabi.experimentobjects.ExperimentBatch;
import com.intuit.wasabi.experimentobjects.PrioritizedExperiment;
import com.intuit.wasabi.experimentobjects.PrioritizedExperimentList;
import com.intuit.wasabi.assignmentobjects.User;
import com.intuit.wasabi.redis.RedisConnectionProvider;
import com.intuit.wasabi.repository.AssignmentsRepository;
import com.intuit.wasabi.repository.CassandraRepository;
import com.intuit.wasabi.repository.ExperimentRepository;
import com.intuit.wasabi.repository.MutexRepository;
import com.intuit.wasabi.repository.PrioritiesRepository;
import com.intuit.wasabi.repository.RepositoryException;
import com.intuit.wasabi.repository.redis.RedisKeys;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.params.ScanParams;
import redis.clients.jedis.resps.ScanResult;

import javax.ws.rs.core.StreamingOutput;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static java.util.Objects.isNull;
import static java.util.Objects.nonNull;

public class RedisAssignmentsRepository implements AssignmentsRepository {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisAssignmentsRepository.class);

    private final JedisPooled jedis;
    private final ExperimentRepository experimentRepository;
    private final PrioritiesRepository prioritiesRepository;
    private final MutexRepository mutexRepository;

    @Inject
    public RedisAssignmentsRepository(RedisConnectionProvider connectionProvider,
                                      @CassandraRepository ExperimentRepository experimentRepository,
                                      PrioritiesRepository prioritiesRepository,
                                      MutexRepository mutexRepository) {
        this.jedis = connectionProvider.getJedis();
        this.experimentRepository = experimentRepository;
        this.prioritiesRepository = prioritiesRepository;
        this.mutexRepository = mutexRepository;
    }

    @Override
    @Timed
    public void assignUsersInBatch(List<Pair<Experiment, Assignment>> assignments, Date date) {
        for (Pair<Experiment, Assignment> pair : assignments) {
            Assignment assignment = pair.getRight();
            String bucketLabel = assignment.getBucketLabel() != null ? assignment.getBucketLabel().toString() : "";
            jedis.set(RedisKeys.assignmentKey(
                    assignment.getUserID().toString(),
                    assignment.getContext().getContext(),
                    assignment.getApplicationName().toString(),
                    assignment.getExperimentID().getRawID().toString()
            ), bucketLabel);
        }
    }

    @Override
    @Timed
    public List<Pair<Experiment, String>> getAssignments(User.ID userID,
                                                         Application.Name appLabel,
                                                         Context context,
                                                         Map<Experiment.ID, Experiment> experimentMap) {
        List<Pair<Experiment, String>> result = new ArrayList<>();
        String prefix = RedisKeys.ASSIGN_PREFIX + userID.toString() + ":"
                + context.getContext() + ":" + appLabel.toString() + ":";
        for (String key : scanKeys(RedisKeys.assignmentPattern(userID.toString(), context.getContext(), appLabel.toString()))) {
            String experimentId = key.substring(prefix.length());
            Experiment exp = experimentMap.get(Experiment.ID.valueOf(UUID.fromString(experimentId)));
            if (nonNull(exp)) {
                String bucket = jedis.get(key);
                result.add(new ImmutablePair<>(exp, bucket == null || bucket.isEmpty() ? "null" : bucket));
            } else {
                LOGGER.debug("{} experiment id is not present in the experimentMap...", experimentId);
            }
        }
        return result;
    }

    @Override
    @Timed
    public Assignment getAssignment(User.ID userID, Application.Name appName, Experiment.ID experimentID, Context context) {
        String bucketLabel = jedis.get(RedisKeys.assignmentKey(
                userID.toString(), context.getContext(), appName.toString(), experimentID.getRawID().toString()));
        if (bucketLabel == null) {
            return null;
        }

        Assignment.Builder builder = Assignment.newInstance(experimentID)
                .withUserID(userID)
                .withContext(context)
                .withApplicationName(appName)
                .withStatus(Assignment.Status.EXISTING_ASSIGNMENT)
                .withCacheable(false);

        if (bucketLabel != null && !bucketLabel.trim().isEmpty()) {
            Bucket.Label label = Bucket.Label.valueOf(bucketLabel);
            boolean isBucketEmpty = false;
            Bucket bucket = experimentRepository.getBucket(experimentID, label);
            if (bucket != null && Bucket.State.EMPTY.equals(bucket.getState())) {
                label = null;
                isBucketEmpty = true;
            }
            builder.withBucketLabel(label).withBucketEmpty(isBucketEmpty);
        }

        return builder.build();
    }

    @Override
    public void deleteAssignment(Experiment experiment, User.ID userID, Context context,
                                 Application.Name appName, Assignment currentAssignment) {
        jedis.del(RedisKeys.assignmentKey(
                userID.toString(),
                context.getContext(),
                appName.toString(),
                experiment.getID().getRawID().toString()
        ));
    }

    @Override
    public void assignUserToExports(Assignment assignment, Date date) {
        LOGGER.debug("assignUserToExports no-op for Redis backend");
    }

    @Override
    public StreamingOutput getAssignmentStream(Experiment.ID experimentID, Context context,
                                               Parameters parameters, Boolean ignoreNullBucket) {
        return output -> {
        };
    }

    @Override
    public void pushAssignmentToStaging(String type, String exception, String data) {
        LOGGER.debug("pushAssignmentToStaging no-op for Redis backend");
    }

    @Override
    public void pushAssignmentsToStaging(String type, String exception, Collection<String> data) {
        LOGGER.debug("pushAssignmentsToStaging no-op for Redis backend");
    }

    @Override
    public void updateBucketAssignmentCount(Experiment experiment, Assignment assignment, boolean countUp) {
        LOGGER.debug("updateBucketAssignmentCount no-op for Redis backend");
    }

    @Override
    public AssignmentCounts getBucketAssignmentCount(Experiment experiment) {
        return new AssignmentCounts.Builder().build();
    }

    @Override
    public Map<Experiment.ID, AssignmentCounts> getBucketAssignmentCountsInParallel(List<Experiment.ID> experimentIds) {
        return Collections.emptyMap();
    }

    @Override
    @Timed
    public void populateAssignmentsMetadata(User.ID userID, Application.Name appName, Context context,
                                            ExperimentBatch experimentBatch,
                                            Optional<Map<Experiment.ID, Boolean>> allowAssignments,
                                            PrioritizedExperimentList prioritizedExperimentList,
                                            Map<Experiment.ID, Experiment> experimentMap,
                                            Map<Experiment.ID, BucketList> bucketMap,
                                            Map<Experiment.ID, List<Experiment.ID>> exclusionMap) {
        if (isNull(experimentBatch.getLabels()) && !allowAssignments.isPresent()) {
            LOGGER.error("Invalid input to RedisAssignmentsRepository.populateAssignmentsMetadata()");
            return;
        }

        for (Experiment experiment : experimentRepository.getExperiments(appName)) {
            experimentMap.put(experiment.getID(), experiment);
        }

        PrioritizedExperimentList priorities = prioritiesRepository.getPriorities(appName);
        for (PrioritizedExperiment prioritizedExperiment : priorities.getPrioritizedExperiments()) {
            prioritizedExperimentList.addPrioritizedExperiment(prioritizedExperiment);
        }

        Set<Experiment.ID> experimentIds = allowAssignments.isPresent()
                ? allowAssignments.get().keySet()
                : new HashSet<>();

        if (!allowAssignments.isPresent()) {
            for (Experiment exp : experimentMap.values()) {
                if (experimentBatch.getLabels().contains(exp.getLabel())) {
                    experimentIds.add(exp.getID());
                }
            }
        } else {
            Set<Experiment.Label> expLabels = new HashSet<>();
            for (Experiment.ID expId : experimentIds) {
                Experiment exp = experimentMap.get(expId);
                if (exp != null) {
                    expLabels.add(exp.getLabel());
                }
            }
            experimentBatch.setLabels(expLabels);
        }

        bucketMap.putAll(experimentRepository.getBucketList(experimentIds));
        exclusionMap.putAll(mutexRepository.getExclusivesList(experimentIds));
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
