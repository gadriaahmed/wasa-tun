CREATE TABLE event_impression (
  user_id VARCHAR(48) NOT NULL,
  experiment_id BYTEA NOT NULL,
  bucket_label VARCHAR(64) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  CONSTRAINT event_impression_bucket_fk FOREIGN KEY (experiment_id, bucket_label) REFERENCES bucket (experiment_id, label)
);

CREATE INDEX event_impression_user_id_idx ON event_impression (user_id);
CREATE INDEX event_impression_experiment_id_idx ON event_impression (experiment_id);
CREATE INDEX event_impression_bucket_label_idx ON event_impression (bucket_label);
CREATE INDEX event_impression_timestamp_idx ON event_impression (timestamp);
