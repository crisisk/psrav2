#!/usr/bin/env python3

import argparse
import logging
import sys
import os

# Add backend to path
sys.path.append('/home/vncuser/psra-ltsd-enterprise-v2/backend')

from app.core.secrets_manager import SecretsManager

logging.basicConfig(filename='/var/log/secrets_rotation.log', level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    parser = argparse.ArgumentParser(description='Secrets Rotation Script')
    parser.add_argument('--config', default='/home/vncuser/psra-ltsd-enterprise-v2/backend/config/secrets_config.json',
                        help='Path to config file')
    parser.add_argument('--emergency', action='store_true', help='Trigger emergency rotation')
    parser.add_argument('--path', help='Path of secret to rotate (for emergency)')
    args = parser.parse_args()

    manager = SecretsManager(args.config)

    if args.emergency:
        if not args.path:
            print("Error: --path required for emergency rotation")
            sys.exit(1)
        try:
            manager.emergency_rotate(args.path)
            print(f"Emergency rotation completed for {args.path}")
        except Exception as e:
            print(f"Emergency rotation failed: {e}")
            sys.exit(1)
    else:
        # Automated rotation
        manager.rotate_all_due()
        print("Automated rotation check completed")

if __name__ == '__main__':
    main()