CREATE TABLE experiment (
  id BYTEA NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  creation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modification_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  description VARCHAR(256) NOT NULL DEFAULT '',
  sampling_percent DOUBLE PRECISION NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  state VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  label VARCHAR(64) NOT NULL,
  app_name VARCHAR(64) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT experiment_unique UNIQUE (app_name, label, version)
);

CREATE INDEX experiment_start_time_idx ON experiment (start_time);
CREATE INDEX experiment_end_time_idx ON experiment (end_time);
CREATE INDEX experiment_state_idx ON experiment (state);

CREATE OR REPLACE FUNCTION set_experiment_modification_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modification_time = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_experiment_modification_time
  BEFORE UPDATE ON experiment
  FOR EACH ROW
  EXECUTE PROCEDURE set_experiment_modification_time();
