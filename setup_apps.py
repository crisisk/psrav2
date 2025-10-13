#!/usr/bin/env python3
import json
import os
import subprocess

def setup_existing_apps():
    # Read inventory from /tmp/inventory.json
    try:
        with open('/tmp/inventory.json') as f:
            inventory = json.load(f)
    except FileNotFoundError:
        print("Error: Inventory file not found at /tmp/inventory.json")
        return

    for app in inventory.get('applications', []):
        app_name = app['name']
        app_location = app['location']
        print(f"Setting up Traefik for {app_name} at {app_location}...")

        # Create a placeholder Traefik dynamic configuration file
        traefik_config = f"""
http:
  routers:
    {app_name}-router:
      rule: "Host(`{app_name}.claude.sevensa.nl`)"
      service: "{app_name}-service"
      entryPoints:
        - "websecure"
      tls:
        certResolver: letsencrypt
  services:
    {app_name}-service:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:80" # Assuming the app is exposed on port 80 or will be configured to be
"""
        config_path = f"/etc/traefik/dynamic/{app_name}.yml"
        with open(config_path, 'w') as f:
            f.write(traefik_config)
        print(f"Traefik config written to {config_path}")

if __name__ == '__main__':
    setup_existing_apps()

