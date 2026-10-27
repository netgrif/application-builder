#!/bin/sh
set -eu

envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

if [ "${PROCESS_FILES_ENABLED:-false}" = "true" ]; then
    if [ ! -d /data/processes ]; then
        echo "PROCESS_FILES_ENABLED=true requires /data/processes to be mounted." >&2
        exit 1
    fi
    cp /etc/nginx/process-files-enabled.conf /etc/nginx/process-files.conf
    if [ -n "${PUID:-}" ]; then
            process_uid=$PUID
            process_gid=${PGID:-$PUID}
        else
            process_owner=$(stat -c '%u:%g' /data/processes)
            process_uid=${process_owner%:*}
            process_gid=${process_owner#*:}
        fi
        case "$process_uid$process_gid" in
            ''|*[!0-9]*) echo "PUID and PGID must be numeric." >&2; exit 1 ;;
        esac
        if [ "$process_uid" = "0" ]; then
            host_root_uid=$(awk '$1 == 0 {print $2; exit}' /proc/self/uid_map)
            if [ -z "$host_root_uid" ] || [ "$host_root_uid" = "0" ]; then
                if [ -n "${PUID:-}" ]; then
                    echo "Refusing to run process storage as host root (PUID=0)." >&2
                    exit 1
                fi
                echo "WARNING: /data/processes looks root-owned; running as 101:101. Set PUID and PGID to choose another user." >&2
                process_uid=101
                process_gid=101
            fi
        fi
        if ! su-exec "$process_uid:$process_gid" test -w /data/processes; then
            echo "User $process_uid:$process_gid cannot write to /data/processes. Set PUID and PGID to the owner of the mounted folder." >&2
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
