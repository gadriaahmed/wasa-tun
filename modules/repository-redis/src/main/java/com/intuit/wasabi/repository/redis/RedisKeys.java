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

import com.intuit.wasabi.experimentobjects.Experiment;

import java.util.UUID;

/**
 * Redis key prefix constants and key builders for Wasabi repository data.
 */
public final class RedisKeys {

    public static final String AUTH_USER_ROLE_PREFIX = "auth:user_role:";
    public static final String AUTH_APP_ROLE_PREFIX = "auth:app_role:";
    public static final String AUTH_SUPERADMINS = "auth:superadmins";
    public static final String AUTH_APPLICATIONS = "auth:applications";
    public static final String AUTH_USER_INFO_PREFIX = "auth:user_info:";

    public static final String ASSIGN_PREFIX = "assign:";

    public static final String EXP_ID_PREFIX = "exp:id:";
    public static final String EXP_ALL = "exp:all";
    public static final String EXP_APP_PREFIX = "exp:app:";
    public static final String EXP_LABEL_PREFIX = "exp:label:";

    public static final String BUCKET_PREFIX = "bucket:";

    public static final String PRIORITY_PREFIX = "priority:";

    public static final String EXCLUSION_PREFIX = "exclusion:";

    private RedisKeys() {
    }

    public static String userRoleKey(String userId, String appName) {
        return AUTH_USER_ROLE_PREFIX + userId + ":" + appName;
    }

    public static String userRolePattern(String userId) {
        return AUTH_USER_ROLE_PREFIX + userId + ":*";
    }

    public static String appRoleKey(String appName, String userId) {
        return AUTH_APP_ROLE_PREFIX + appName + ":" + userId;
    }

    public static String appRolePattern(String appName) {
        return AUTH_APP_ROLE_PREFIX + appName + ":*";
    }

    public static String userInfoKey(String userId) {
        return AUTH_USER_INFO_PREFIX + userId;
    }

    public static String assignmentKey(String userId, String context, String appName, String experimentId) {
        return ASSIGN_PREFIX + userId + ":" + context + ":" + appName + ":" + experimentId;
    }

    public static String assignmentPattern(String userId, String context, String appName) {
        return ASSIGN_PREFIX + userId + ":" + context + ":" + appName + ":*";
    }

    public static String experimentKey(Experiment.ID experimentId) {
        return experimentKey(experimentId.getRawID());
    }

    public static String experimentKey(UUID experimentId) {
        return EXP_ID_PREFIX + experimentId.toString();
    }

    public static String experimentAppKey(String appName) {
        return EXP_APP_PREFIX + appName;
    }

    public static String experimentLabelKey(String appName, String label) {
        return EXP_LABEL_PREFIX + appName + ":" + label;
    }

    public static String bucketKey(UUID experimentId, String label) {
        return BUCKET_PREFIX + experimentId.toString() + ":" + label;
    }

    public static String bucketPattern(UUID experimentId) {
        return BUCKET_PREFIX + experimentId.toString() + ":*";
    }

    public static String priorityKey(String appName) {
        return PRIORITY_PREFIX + appName;
    }

    public static String exclusionKey(UUID experimentId) {
        return EXCLUSION_PREFIX + experimentId.toString();
    }
}
