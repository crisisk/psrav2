# Celery Security: Running as Non-Root User

## Why Running as Root is Dangerous

Running Celery (or any service) as the root user poses significant security risks:

- **Privilege Escalation**: If the Celery process is compromised (e.g., via a vulnerability in dependencies or code), an attacker gains full system access, allowing them to install malware, modify system files, or pivot to other services.
- **Container Breakouts**: In Docker, root access can lead to container escapes, where an attacker accesses the host system.
- **Accidental Damage**: Root processes can inadvertently modify or delete critical system files.
- **Compliance Violations**: Many security standards (e.g., CIS Benchmarks, NIST) require services to run with minimal privileges.
- **Attack Surface**: Root has access to all resources, increasing the impact of exploits like buffer overflows or injection attacks.

By running as a non-root user (e.g., `celery`), we limit damage to the application's scope, adhering to the principle of least privilege.

## Migration Steps

Follow these steps to migrate Celery to run as a non-root user. Perform in a staging environment first.

### 1. Update Dockerfile (Dockerized Deployments)
- Modify `/home/vncuser/psra-ltsd-enterprise-v2/backend/Dockerfile.celery` as shown above.
- Rebuild the image: `docker build -t celery-app ./backend`.
- Test locally: `docker run --user 1001:1001 celery-app`.

### 2. Update Docker Compose
- Modify the `celery` service in `/home/vncuser/psra-ltsd-enterprise-v2/docker-compose.yml` as shown.
- Ensure volumes (e.g., `celery_logs`) are owned by the celery user: `docker run --rm -v celery_logs:/data alpine chown 1001:1001 /data`.
- Restart: `docker-compose down && docker-compose up -d celery`.

### 3. Update Systemd Service (Host Deployments)
- Create or modify `/etc/systemd/system/celery.service` as shown.
- Create the celery user: `sudo useradd -r -s /bin/false celery`.
- Set permissions: `sudo chown -R celery:celery /home/vncuser/psra-ltsd-enterprise-v2/backend`.
- Reload and restart: `sudo systemctl daemon-reload && sudo systemctl restart celery`.

### 4. General Steps
- Audit code for root assumptions (e.g., file writes to `/etc` or `/root`).
- Update any scripts or configs that rely on root access.
- Monitor logs for permission errors post-migration.

## Verification Steps

After migration, verify the setup:

1. **Check User**: Run `ps aux | grep celery` (or `docker exec celery ps aux`). Confirm the process runs as UID 1001 (celery), not 0 (root).
2. **Test Functionality**: Submit a Celery task and ensure it processes without errors.
3. **Permissions Audit**: Run `ls -la /path/to/app` and confirm ownership is `celery:celery`. Check for world-writable files.
4. **Security Scan**: Use tools like `docker scan` or `trivy` to check for vulnerabilities. Ensure no privileged containers.
5. **Logs**: Monitor Celery logs for permission denials. If issues arise, adjust `ReadWritePaths` in Systemd or volume mounts.
6. **Container Security**: In Docker, run `docker inspect celery | grep -A 10 "SecurityOpt"` to confirm dropped capabilities.
7. **Penetration Test**: Simulate an exploit (e.g., via a vulnerable dependency) and verify the process can't escalate privileges.

If verification fails, revert to root temporarily, debug, and reapply changes.
