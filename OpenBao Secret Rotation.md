# OpenBao Secret Rotation

This directory contains scripts and configuration files for automating secret rotation in OpenBao.

## Overview

Secret rotation is a critical security practice that involves regularly changing credentials, certificates, and encryption keys to minimize the risk of compromise. This implementation provides a comprehensive solution for automating the rotation of various types of secrets in OpenBao, including:

- Database credentials
- PKI certificates
- KV secrets
- Transit encryption keys

## Components

### Scripts

- `rotate_secrets.sh`: Main script that handles the rotation of secrets based on configuration
- `generate_api_key.sh`: Script for generating secure API keys
- `generate_jwt_secret.sh`: Script for generating JWT secrets
- `generate_strong_password.sh`: Script for generating strong passwords with mixed character types

### Configuration

- `rotation_config.json`: Main configuration file that defines which secrets to rotate
- `secret_rotation_cron`: Cron job configuration for scheduling secret rotation

## Installation

1. Create the necessary directories:

```bash
sudo mkdir -p /etc/openbao/scripts
sudo mkdir -p /var/log/openbao
```

2. Copy the scripts to the appropriate location:

```bash
sudo cp rotate_secrets.sh /etc/openbao/scripts/
sudo cp generate_api_key.sh /etc/openbao/scripts/
sudo cp generate_jwt_secret.sh /etc/openbao/scripts/
sudo cp generate_strong_password.sh /etc/openbao/scripts/
sudo chmod +x /etc/openbao/scripts/*.sh
```

3. Copy the configuration file:

```bash
sudo cp rotation_config.json /etc/openbao/
```

4. Install the cron job:

```bash
sudo cp secret_rotation_cron /etc/cron.d/openbao-secret-rotation
```

5. Set the OpenBao token as an environment variable or in a secure file:

```bash
echo 'OPENBAO_TOKEN=your-token-here' | sudo tee /etc/openbao/token
sudo chmod 600 /etc/openbao/token
```

## Configuration

### Rotation Config

The `rotation_config.json` file defines which secrets to rotate. It has the following structure:

```json
{
  "database_credentials": [
    {
      "name": "example_db",
      "mount_path": "example/database",
      "role_name": "writer"
    }
  ],
  "pki_certificates": [
    {
      "name": "example_cert",
      "mount_path": "pki_int",
      "role_name": "example-role",
      "common_name": "example.service.internal",
      "ttl": "720h"
    }
  ],
  "kv_secrets": [
    {
      "name": "example_api_key",
      "mount_path": "example/kv",
      "path": "api/keys",
      "generator_script": "/etc/openbao/scripts/generate_api_key.sh"
    }
  ],
  "transit_keys": [
    {
      "name": "example_encryption_key",
      "mount_path": "example/transit"
    }
  ]
}
```

### Cron Schedule

The default cron schedule is:

- Database credentials: Daily at 1:00 AM
- PKI certificates: Monthly on the 1st at 2:00 AM
- Transit keys: Quarterly on the 1st of Jan, Apr, Jul, Oct at 3:00 AM

You can adjust the schedule in the `secret_rotation_cron` file.

## Usage

### Manual Rotation

To manually rotate secrets:

```bash
sudo OPENBAO_TOKEN=$(cat /etc/openbao/token | grep OPENBAO_TOKEN | cut -d= -f2) /etc/openbao/scripts/rotate_secrets.sh
```

### Specific Secret Types

To rotate only specific types of secrets, create separate configuration files and specify them:

```bash
sudo OPENBAO_TOKEN=$(cat /etc/openbao/token | grep OPENBAO_TOKEN | cut -d= -f2) ROTATION_CONFIG=/etc/openbao/pki_rotation_config.json /etc/openbao/scripts/rotate_secrets.sh
```

## Notifications

The rotation script supports notifications via email and Slack. To configure:

1. For email notifications, ensure the `mail` command is available and configured.
2. For Slack notifications, set the `SLACK_WEBHOOK` environment variable:

```bash
echo 'SLACK_WEBHOOK=https://hooks.slack.com/services/your/webhook/url' | sudo tee -a /etc/openbao/token
```

## Logging

All rotation activities are logged to `/var/log/openbao/secret_rotation.log` by default. Each rotation run includes:

- Timestamp
- Secret being rotated
- Success or failure status
- Error messages if applicable

## Security Considerations

- The OpenBao token used for rotation should have the minimum required permissions
- The token and configuration files should be protected with appropriate file permissions
- Consider using a dedicated service account for secret rotation
- Regularly audit the rotation logs to ensure proper functioning

## Troubleshooting

If secret rotation fails:

1. Check the rotation logs: `sudo cat /var/log/openbao/secret_rotation.log`
2. Verify the OpenBao token has the necessary permissions
3. Ensure the generator scripts are executable
4. Check that the paths in the configuration file are correct

## Extending

To add support for additional secret types:

1. Add a new function to `rotate_secrets.sh` for the new secret type
2. Update the `process_rotation_config` function to handle the new secret type
3. Add the new secret type to your `rotation_config.json`
