#!/usr/bin/env sh

echo "java -jar -Dcassandra.migration.keyspace.name=${CASSANDRA_KEYSPACE:-wasabi_experiments} \
    -Dcassandra.migration.cluster.port=${CASSANDRA_PORT:-9042} \
    -Dcassandra.migration.cluster.username=${CQLSH_USERNAME} \
    -Dcassandra.migration.cluster.password=${CQLSH_PASSWORD} \
    -Dcassandra.migration.scripts.locations=filesystem:${MIGRATION_SCRIPT:-/wasabi/mutation}\
    -Dcassandra.migration.cluster.contactpoints=${CQLSH_HOST:-localhost} \
    ${CASSANDRA_MIGRATION:-/wasabi/cassandra-migration.jar} migrate"

echo "Waiting for Cassandra CQL port at ${CQLSH_HOST:-localhost}:${CASSANDRA_PORT:-9042}..."
while ! nc -w 1 -z ${CQLSH_HOST:-localhost} ${CASSANDRA_PORT:-9042}; do sleep 1; done

# TCP open != CQL ready (common on Colima / slow starts).
sleep 15

attempt=1
max_attempts=10
while [ "${attempt}" -le "${max_attempts}" ]; do
  echo "Running Cassandra migration (attempt ${attempt}/${max_attempts})..."
  java -jar -Dcassandra.migration.keyspace.name=${CASSANDRA_KEYSPACE:-wasabi_experiments} \
      -Dcassandra.migration.cluster.port=${CASSANDRA_PORT:-9042} \
      -Dcassandra.migration.cluster.username=${CQLSH_USERNAME} \
      -Dcassandra.migration.cluster.password=${CQLSH_PASSWORD} \
      -Dcassandra.migration.scripts.locations=filesystem:${MIGRATION_SCRIPT:-/wasabi/mutation} \
      -Dcassandra.migration.cluster.contactpoints=${CQLSH_HOST:-localhost} \
      ${CASSANDRA_MIGRATION:-/wasabi/cassandra-migration.jar} migrate
  if [ $? -eq 0 ]; then
    echo "Cassandra migration completed."
    exit 0
  fi
  echo "Migration attempt ${attempt} failed; retrying in 10s..."
  sleep 10
  attempt=$((attempt + 1))
done

echo "failed to execute the migration script. Please contact administrator."
exit 1
