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
import com.intuit.wasabi.authenticationobjects.UserInfo;
import com.intuit.wasabi.feedbackobjects.UserFeedback;
import com.intuit.wasabi.repository.FeedbackRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;

/**
 * Redis feedback repository stub. Feedback data is not stored in Redis for this migration phase.
 */
public class RedisFeedbackRepository implements FeedbackRepository {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisFeedbackRepository.class);

    @Inject
    public RedisFeedbackRepository() {
    }

    @Override
    public void createUserFeedback(UserFeedback userFeedback) {
        LOGGER.debug("createUserFeedback no-op for Redis backend: {}", userFeedback);
    }

    @Override
    public List<UserFeedback> getUserFeedback(UserInfo.Username username) {
        return Collections.emptyList();
    }

    @Override
    public List<UserFeedback> getAllUserFeedback() {
        return Collections.emptyList();
    }
}
