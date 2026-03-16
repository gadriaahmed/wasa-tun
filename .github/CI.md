# CI (GitHub Actions)

This project uses **GitHub Actions** for CI only (build and test). There is no deployment step.

## Workflow

- **Triggers:** Push and pull requests to `feature/*`, `develop`, and `master`.
- **Build:** Maven install (tests skipped), then `mvn clean test jacoco:report`.
- **Java:** Eclipse Temurin JDK 8.

## Running locally with Docker

1. **Build the app** (once; creates `modules/main/target/<application.name>/`):

   ```bash
   ./bin/build.sh -b true -p development
   ```

2. **Ensure `.env` exists** with the app directory name (see `.env.example`):

   ```bash
   cp .env.example .env
   # If your version/profile differ, set WASABI_APP_ID to the directory name under modules/main/target/
   ```

3. **Start stack:**

   ```bash
   docker compose up -d
   ```

   This starts Cassandra, MySQL, runs keyspace creation and schema migration, then Wasabi. UI: http://localhost:8080 (login: admin/admin). API: http://localhost:8080/api/v1/ping

4. **Stop:**

   ```bash
   docker compose down
   ```
