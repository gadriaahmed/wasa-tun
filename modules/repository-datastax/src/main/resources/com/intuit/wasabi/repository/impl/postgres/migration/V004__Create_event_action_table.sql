CREATE TABLE event_action (
  user_id VARCHAR(48) NOT NULL,
  experiment_id BYTEA NOT NULL,
  bucket_label VARCHAR(64) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  action VARCHAR(64) NOT NULL,
  CONSTRAINT event_action_bucket_fk FOREIGN KEY (experiment_id, bucket_label) REFERENCES bucket (experiment_id, label)
);

CREATE INDEX event_action_user_id_idx ON event_action (user_id);
CREATE INDEX event_action_experiment_id_idx ON event_action (experiment_id);
CREATE INDEX event_action_bucket_label_idx ON event_action (bucket_label);
CREATE INDEX event_action_timestamp_idx ON event_action (timestamp);
CREATE INDEX event_action_action_idx ON event_action (action);
