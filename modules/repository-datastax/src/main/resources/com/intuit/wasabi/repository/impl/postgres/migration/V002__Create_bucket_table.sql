CREATE TABLE bucket (
  experiment_id BYTEA NOT NULL,
  label VARCHAR(64) NOT NULL,
  allocation_percent DOUBLE PRECISION NOT NULL,
  is_control BOOLEAN NOT NULL DEFAULT FALSE,
  payload VARCHAR(4096) NOT NULL DEFAULT '',
  description VARCHAR(256) NOT NULL DEFAULT '',
  PRIMARY KEY (experiment_id, label),
  CONSTRAINT buckets_experiment_fk FOREIGN KEY (experiment_id) REFERENCES experiment (id)
);

CREATE INDEX bucket_experiment_id_idx ON bucket (experiment_id);
