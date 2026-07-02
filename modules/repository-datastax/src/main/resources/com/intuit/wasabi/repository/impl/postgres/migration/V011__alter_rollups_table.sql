ALTER TABLE experiment_rollup ADD COLUMN context VARCHAR(200) NOT NULL DEFAULT 'PROD';
ALTER TABLE experiment_rollup DROP CONSTRAINT entry;
ALTER TABLE experiment_rollup ADD CONSTRAINT entry UNIQUE (experiment_id, day, cumulative, bucket_label, action, context);
