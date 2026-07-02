CREATE TABLE experiment_rollup (
  experiment_id BYTEA NOT NULL,
  day DATE NOT NULL,
  cumulative BOOLEAN NOT NULL,
  bucket_label VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL DEFAULT '',
  impression_count INTEGER DEFAULT NULL,
  impression_user_count INTEGER DEFAULT NULL,
  action_count INTEGER DEFAULT NULL,
  action_user_count INTEGER DEFAULT NULL,
  CONSTRAINT entry UNIQUE (experiment_id, day, cumulative, bucket_label, action),
  CONSTRAINT experiment_rollup_bucket_fk FOREIGN KEY (experiment_id, bucket_label) REFERENCES bucket (experiment_id, label)
);
