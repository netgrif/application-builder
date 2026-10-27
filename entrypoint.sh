#!/bin/sh
set -eu

envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

if [ "${PROCESS_FILES_ENABLED:-false}" = "true" ]; then
    if [ ! -d /data/process ]; then
        echo "PROCESS_FILES_ENABLED=true requires /data/process to be mounted." >&2
        exit 1
    fi
    cp /etc/nginx/process-files-enabled.conf /etc/nginx/process-files.conf
    process_owner=$(stat -c '%u:%g' /data/process)
    process_uid=${process_owner%:*}
    process_gid=${process_owner#*:}
    if [ "$process_uid" = "0" ]; then
        host_root_uid=$(awk '$1 == 0 {print $2; exit}' /proc/self/uid_map)
        if [ -z "$host_root_uid" ] || [ "$host_root_uid" = "0" ]; then
            echo "Refusing to run process storage as host root; use a non-root-owned mount." >&2
            exit 1
        fi
    fi
    if ! su-exec "$process_uid:$process_gid" test -w /data/process; then
        echo "The owner of /data/process cannot write to the mounted directory." >&2
        exit 1
    fi
else
    : > /etc/nginx/process-files.conf
    process_uid=101
    process_gid=101
fi

chmod 644 /etc/nginx/process-files.conf
nginx -t
exec su-exec "$process_uid:$process_gid" nginx -g 'daemon off;'
