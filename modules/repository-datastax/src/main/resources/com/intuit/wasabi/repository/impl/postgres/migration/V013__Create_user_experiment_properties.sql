CREATE TABLE IF NOT EXISTS user_experiment_properties (
  user_id VARCHAR(48) NOT NULL,
  experiment_id BYTEA NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, experiment_id)
);
