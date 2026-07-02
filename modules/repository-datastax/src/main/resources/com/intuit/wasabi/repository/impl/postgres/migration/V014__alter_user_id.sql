ALTER TABLE user_experiment_properties ALTER COLUMN user_id TYPE VARCHAR(200);
ALTER TABLE event_impression ALTER COLUMN user_id TYPE VARCHAR(200);
ALTER TABLE event_action ALTER COLUMN user_id TYPE VARCHAR(200);
