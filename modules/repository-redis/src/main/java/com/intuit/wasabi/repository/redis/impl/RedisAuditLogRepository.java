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
import com.intuit.wasabi.auditlogobjects.AuditLogEntry;
import com.intuit.wasabi.experimentobjects.Application;
import com.intuit.wasabi.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;

/**
 * Redis audit log repository stub. Audit log data is not stored in Redis for this migration phase.
 */
public class RedisAuditLogRepository implements AuditLogRepository {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisAuditLogRepository.class);

    @Inject
    public RedisAuditLogRepository() {
    }

    @Override
    public List<AuditLogEntry> getCompleteAuditLogEntryList() {
        return Collections.emptyList();
    }

    @Override
    public List<AuditLogEntry> getCompleteAuditLogEntryList(int limit) {
        return Collections.emptyList();
    }

    @Override
    public List<AuditLogEntry> getAuditLogEntryList(Application.Name applicationName) {
        return Collections.emptyList();
    }

    @Override
    public List<AuditLogEntry> getAuditLogEntryList(Application.Name applicationName, int limit) {
        return Collections.emptyList();
    }

    @Override
    public List<AuditLogEntry> getGlobalAuditLogEntryList() {
        return Collections.emptyList();
    }

    @Override
    public List<AuditLogEntry> getGlobalAuditLogEntryList(int limit) {
        return Collections.emptyList();
    }

    @Override
    public boolean storeEntry(AuditLogEntry entry) {
        LOGGER.debug("storeEntry no-op for Redis backend: {}", entry);
        return true;
    }
}
