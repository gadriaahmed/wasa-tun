/*******************************************************************************
 * Copyright 2016 Intuit
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
package com.intuit.wasabi.experimentobjects;

import org.junit.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

/**
 * Test for the {@link PrioritizedExperimentList}
 * <p>
 * Created by asuckro on 8/20/15.
 */
public class PrioritizedExperimentListTest {

    @Test
    public void testConstructor() {
        PrioritizedExperimentList prioList = new PrioritizedExperimentList(42);
        assertTrue(prioList.getPrioritizedExperiments().isEmpty());

        for (int i = 0; i < 42; i++) {
            prioList.addPrioritizedExperiment(new PrioritizedExperiment());
        }
        assertEquals(42, prioList.getPrioritizedExperiments().size());

        List<PrioritizedExperiment> emptyList = new ArrayList<>();
        prioList.setPrioritizedExperiments(emptyList);
        assertTrue(prioList.getPrioritizedExperiments().isEmpty());
    }

}
