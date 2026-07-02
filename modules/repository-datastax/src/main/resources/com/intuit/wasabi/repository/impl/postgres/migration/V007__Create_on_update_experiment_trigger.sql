CREATE OR REPLACE FUNCTION on_update_experiment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state = 'DELETED' AND OLD.state != 'DELETED' AND OLD.version = 0 THEN
    NEW.version := (
      SELECT COALESCE(MAX(version), 0) + 1
      FROM experiment
      WHERE app_name = NEW.app_name AND label = NEW.label
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_update_experiment
  BEFORE UPDATE ON experiment
  FOR EACH ROW
  EXECUTE PROCEDURE on_update_experiment();
