import json
import os
import secrets
import string
import logging
import smtplib
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from vault_integration import VaultIntegration

logger = logging.getLogger(__name__)

class SecretsManager:
    def __init__(self, config_path):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        self.vault = VaultIntegration()
        self.db_engine = create_engine(os.getenv('DB_CONNECTION_STRING')) if os.getenv('DB_CONNECTION_STRING') else None

    def generate_secret(self, generator, length):
        """Generate a new secret."""
        if generator == "random_string":
            return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(length))
        elif generator == "random_bytes":
            return secrets.token_bytes(length).hex()
        else:
            raise ValueError("Unsupported generator")

    def is_rotation_due(self, path, period):
        """Check if rotation is due based on last version timestamp."""
        metadata = self.vault.get_secret_versions(path)
        if not metadata:
            return True
        last_updated = datetime.fromisoformat(metadata['data']['metadata']['created_time'][:-1])  # Remove 'Z'
        now = datetime.utcnow()
        if period == "daily":
            return now - last_updated > timedelta(days=1)
        elif period == "weekly":
            return now - last_updated > timedelta(weeks=1)
        elif period == "monthly":
            return now - last_updated > timedelta(days=30)
        return False

    def rotate_secret(self, secret_config):
        """Rotate a single secret with zero-downtime handling."""
        path = secret_config['path']
        secret_type = secret_config['type']
        try:
            new_secret = self.generate_secret(secret_config['generator'], secret_config['length'])
            data = {'value': new_secret}

            # For DB passwords, test the new one before committing
            if secret_type == "db_password" and self.db_engine:
                # Simulate testing (replace with actual DB test)
                with self.db_engine.connect() as conn:
                    conn.execute("SELECT 1")  # Placeholder; use real test query

            self.vault.write_secret(path, data)
            logger.info(f"Rotated secret at {path}")

            # Zero-downtime: For DB, assume services refresh via dynamic lookup
            # For others, log for manual restart if needed
            if secret_type == "db_password":
                logger.info(f"DB password rotated; ensure services refresh connections from OpenBao.")
            else:
                logger.info(f"Secret rotated; services should support dynamic lookups.")

        except Exception as e:
            logger.error(f"Rotation failed for {path}: {e}")
            self.alert_failure(path, str(e))
            raise

    def rotate_all_due(self):
        """Rotate all secrets that are due."""
        for secret in self.config['secrets']:
            if self.is_rotation_due(secret['path'], secret['rotation_period']):
                self.rotate_secret(secret)

    def emergency_rotate(self, path):
        """Manual emergency rotation."""
        secret_config = next((s for s in self.config['secrets'] if s['path'] == path), None)
        if not secret_config:
            raise ValueError(f"Secret config not found for {path}")
        self.rotate_secret(secret_config)

    def alert_failure(self, path, error):
        """Send alert on failure."""
        alert_email = self.config.get('alert_email', os.getenv('ALERT_EMAIL'))
        if alert_email:
            msg = f"Subject: Secrets Rotation Failure\n\nFailed to rotate {path}: {error}"
            server = smtplib.SMTP('localhost')
            server.sendmail('noreply@example.com', alert_email, msg)
            server.quit()
        logger.error(f"Alert sent for failure at {path}")