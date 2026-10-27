#!/bin/sh
set -eu

image=${1:-application-builder:smoke}
port=${PROCESS_FILE_TEST_PORT:-18080}
temporary_directory=$(mktemp -d)
process_directory="$temporary_directory/processes"
app_directory="$process_directory/demo-app"
container_id=

cleanup() {
    status=$?
    trap - EXIT INT TERM
    if [ -n "$container_id" ]; then
        if [ "$status" -ne 0 ]; then
            docker logs "$container_id" 2>/dev/null || true
        fi
        docker rm -f "$container_id" >/dev/null 2>&1 || true
    fi
    rm -rf "$temporary_directory"
    exit "$status"
}
trap cleanup EXIT INT TERM

mkdir -p "$app_directory"
printf '%s' '<manifest/>' > "$app_directory/manifest.xml"
container_id=$(docker run -d --rm \
    -p "127.0.0.1:${port}:80" \
    -e PROCESS_FILES_ENABLED=true \
    -v "$process_directory:/data/processes" \
    "$image")

base_url="http://127.0.0.1:${port}"
ready=false
for _ in $(seq 1 40); do
    if curl -fsS "$base_url/" >/dev/null; then
        ready=true
        break
    fi
    sleep 1
done
if [ "$ready" != true ]; then
    echo 'Container did not become ready.' >&2
    exit 1
fi

curl -fsS "$base_url/processes/" | python3 -c \
    'import json,sys; assert any(x["name"] == "demo-app" and x["type"] == "directory" for x in json.load(sys.stdin))'

process_url="$base_url/processes/demo-app/flow.xml"
curl -fsS -X PUT -H 'Content-Type: application/xml' --data-binary '<net/>' "$process_url" >/dev/null
test "$(curl -fsS "$process_url")" = '<net/>'
test "$(stat -c '%u:%g' "$app_directory/flow.xml")" = "$(id -u):$(id -g)"
curl -fsS "$base_url/processes/demo-app/" | python3 -c \
    'import json,sys; assert any(x["name"] == "flow.xml" and x["type"] == "file" for x in json.load(sys.stdin))'

manifest_status=$(curl -sS -o /dev/null -w '%{http_code}' "$base_url/processes/demo-app/manifest.xml")
test "$manifest_status" = 404

echo 'Container process-file smoke test passed.'
