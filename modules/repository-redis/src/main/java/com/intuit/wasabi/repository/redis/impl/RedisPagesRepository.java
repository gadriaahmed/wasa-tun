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
import com.intuit.wasabi.experimentobjects.ExperimentPageList;
import com.intuit.wasabi.experimentobjects.Page;
import com.intuit.wasabi.experimentobjects.PageExperiment;
import com.intuit.wasabi.repository.PagesRepository;
import com.intuit.wasabi.repository.RepositoryException;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Redis pages repository stub. Page data is not stored in Redis for this migration phase.
 */
public class RedisPagesRepository implements PagesRepository {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedisPagesRepository.class);

    @Inject
    public RedisPagesRepository() {
    }

    @Override
    public void postPages(Application.Name applicationName, Experiment.ID experimentID,
                          ExperimentPageList experimentPageList) throws RepositoryException {
        LOGGER.debug("postPages no-op for Redis backend: {} {}", applicationName, experimentID);
    }

    @Override
    public void deletePage(Application.Name applicationName, Experiment.ID experimentID, Page.Name pageName) {
        LOGGER.debug("deletePage no-op for Redis backend: {} {} {}", applicationName, experimentID, pageName);
    }

    @Override
    public List<Page> getPageList(Application.Name applicationName) {
        return Collections.emptyList();
    }

    @Override
    public Map<Page.Name, List<PageExperiment>> getPageExperimentList(Application.Name applicationName) {
        return Collections.emptyMap();
    }

    @Override
    public ExperimentPageList getExperimentPages(Experiment.ID experimentID) {
        ExperimentPageList experimentPageList = new ExperimentPageList();
        experimentPageList.setPages(Collections.emptyList());
        return experimentPageList;
    }

    @Override
    public List<PageExperiment> getExperiments(Application.Name applicationName, Page.Name pageName) {
        return Collections.emptyList();
    }

    @Override
    public void erasePageData(Application.Name applicationName, Experiment.ID experimentID) {
        LOGGER.debug("erasePageData no-op for Redis backend: {} {}", applicationName, experimentID);
    }

    @Override
    public List<PageExperiment> getExperimentsWithoutLabels(Application.Name applicationName, Page.Name pageName) {
        return Collections.emptyList();
    }

    @Override
    public Map<Pair<Application.Name, Page.Name>, List<PageExperiment>> getExperimentsWithoutLabels(
            Collection<Pair<Application.Name, Page.Name>> appAndPagePairs) {
        return Collections.emptyMap();
    }
}
