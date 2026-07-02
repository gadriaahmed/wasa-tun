CREATE OR REPLACE FUNCTION on_delete_experiment()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM experiment_rollup WHERE experiment_id = OLD.id;
  DELETE FROM event_impression WHERE experiment_id = OLD.id;
  DELETE FROM event_action WHERE experiment_id = OLD.id;
  DELETE FROM bucket WHERE experiment_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_delete_experiment
  BEFORE DELETE ON experiment
  FOR EACH ROW
  EXECUTE PROCEDURE on_delete_experiment();
