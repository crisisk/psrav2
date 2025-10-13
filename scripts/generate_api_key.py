#!/usr/bin/env python3
"""
API Key Generator CLI Tool

Generates secure API keys for Partner API access.
Saves keys to a secure JSON file with metadata.

Usage:
    python scripts/generate_api_key.py --partner "Acme Corp"
    python scripts/generate_api_key.py --partner "Acme Corp" --expires-days 180
    python scripts/generate_api_key.py --partner "Acme Corp" --output keys.json
"""

import argparse
import json
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any

# Add parent directory to path to import backend modules
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from backend.services.api_key_service import APIKeyService
except ImportError as e:
    print(f"Error importing backend modules: {e}")
    print("Make sure you're running this from the project root directory.")
    sys.exit(1)


class APIKeyGenerator:
    """Command-line API key generator"""

    def __init__(self, output_file: str = "api_keys_secure.json"):
        self.output_file = output_file
        self.service = APIKeyService()

    def generate_key(
        self,
        partner_name: str,
        expires_days: int = 365,
        rate_limit: int = 100,
        environment: str = "production",
        description: str = None,
    ) -> Dict[str, Any]:
        """Generate a new API key with metadata"""

        print(f"\n{'='*70}")
        print(f"Generating API Key for: {partner_name}")
        print(f"{'='*70}\n")

        # Generate the API key and hash
        api_key, key_hash = self.service.generate_api_key()

        # Create metadata
        now = datetime.utcnow()
        expires_at = now + timedelta(days=expires_days)
        key_id = f"key_{now.strftime('%Y%m%d%H%M%S')}_{api_key[:8]}"

        key_data = {
            "key_id": key_id,
            "api_key": api_key,  # WARNING: Plaintext key - store securely!
            "key_prefix": api_key[:8],
            "key_hash": key_hash,
            "partner_name": partner_name,
            "created_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "expires_days": expires_days,
            "rate_limit": rate_limit,
            "environment": environment,
            "description": description or f"API key for {partner_name}",
            "is_active": True,
            "scopes": ["read", "write"],
        }

        print(f"✓ API Key Generated Successfully!")
        print(f"\n{'─'*70}")
        print(f"Key Details:")
        print(f"{'─'*70}")
        print(f"  Partner:     {partner_name}")
        print(f"  Key ID:      {key_id}")
        print(f"  Prefix:      {api_key[:8]}...")
        print(f"  Environment: {environment}")
        print(f"  Created:     {now.strftime('%Y-%m-%d %H:%M:%S')} UTC")
        print(f"  Expires:     {expires_at.strftime('%Y-%m-%d %H:%M:%S')} UTC ({expires_days} days)")
        print(f"  Rate Limit:  {rate_limit} req/min")
        print(f"{'─'*70}")
        print(f"\n⚠️  IMPORTANT: Save this API key securely - it will only be shown once!")
        print(f"\n  API Key: {api_key}")
        print(f"\n{'─'*70}\n")

        return key_data

    def save_to_file(self, key_data: Dict[str, Any]) -> None:
        """Save API key to JSON file"""

        # Ensure output directory exists
        output_path = Path(self.output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Load existing keys if file exists
        existing_keys = []
        if output_path.exists():
            try:
                with open(output_path, 'r') as f:
                    data = json.load(f)
                    existing_keys = data.get('keys', [])
            except Exception as e:
                print(f"Warning: Could not read existing keys file: {e}")

        # Add new key
        existing_keys.append(key_data)

        # Save to file
        output_data = {
            "generated_at": datetime.utcnow().isoformat(),
            "total_keys": len(existing_keys),
            "keys": existing_keys,
        }

        try:
            with open(output_path, 'w') as f:
                json.dump(output_data, f, indent=2)

            # Set restrictive permissions on the file (owner read/write only)
            os.chmod(output_path, 0o600)

            print(f"✓ API key saved to: {output_path.absolute()}")
            print(f"  Total keys in file: {len(existing_keys)}")
            print(f"  File permissions: 600 (owner read/write only)\n")

        except Exception as e:
            print(f"✗ Error saving to file: {e}")
            sys.exit(1)

    def list_keys(self) -> None:
        """List all keys in the output file"""

        output_path = Path(self.output_file)

        if not output_path.exists():
            print(f"No keys file found at: {output_path}")
            return

        try:
            with open(output_path, 'r') as f:
                data = json.load(f)
                keys = data.get('keys', [])

            if not keys:
                print("No API keys found.")
                return

            print(f"\n{'='*70}")
            print(f"API Keys Summary ({len(keys)} total)")
            print(f"{'='*70}\n")

            for i, key in enumerate(keys, 1):
                print(f"{i}. {key['partner_name']}")
                print(f"   ID:          {key['key_id']}")
                print(f"   Prefix:      {key['key_prefix']}...")
                print(f"   Created:     {key['created_at']}")
                print(f"   Expires:     {key['expires_at']}")
                print(f"   Environment: {key.get('environment', 'production')}")
                print(f"   Active:      {key.get('is_active', True)}")
                print()

        except Exception as e:
            print(f"Error reading keys file: {e}")
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate API keys for Partner API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Generate key for a partner:
    python scripts/generate_api_key.py --partner "Acme Corp"

  Generate key with custom expiration:
    python scripts/generate_api_key.py --partner "Acme Corp" --expires-days 180

  Generate staging key:
    python scripts/generate_api_key.py --partner "Test Partner" --environment staging

  List all generated keys:
    python scripts/generate_api_key.py --list

Security:
  - API keys are 64-character hexadecimal strings (256-bit entropy)
  - Keys are stored with SHA-256 hashes for validation
  - Output file has restrictive permissions (600)
  - NEVER commit the output file to version control!
        """
    )

    parser.add_argument(
        "--partner",
        type=str,
        help="Partner organization name"
    )

    parser.add_argument(
        "--expires-days",
        type=int,
        default=365,
        help="Number of days until key expires (default: 365)"
    )

    parser.add_argument(
        "--rate-limit",
        type=int,
        default=100,
        help="Rate limit in requests per minute (default: 100)"
    )

    parser.add_argument(
        "--environment",
        type=str,
        choices=["production", "staging", "development"],
        default="production",
        help="Environment for the API key (default: production)"
    )

    parser.add_argument(
        "--description",
        type=str,
        help="Optional description for the API key"
    )

    parser.add_argument(
        "--output",
        type=str,
        default="api_keys_secure.json",
        help="Output file path (default: api_keys_secure.json)"
    )

    parser.add_argument(
        "--list",
        action="store_true",
        help="List all generated API keys"
    )

    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Don't save the key to file (just display it)"
    )

    args = parser.parse_args()

    generator = APIKeyGenerator(output_file=args.output)

    # List keys if requested
    if args.list:
        generator.list_keys()
        sys.exit(0)

    # Require partner name for generation
    if not args.partner:
        parser.print_help()
        print("\n✗ Error: --partner is required (or use --list to view existing keys)")
        sys.exit(1)

    # Validate inputs
    if args.expires_days < 1 or args.expires_days > 1825:
        print("✗ Error: expires-days must be between 1 and 1825 (5 years)")
        sys.exit(1)

    if args.rate_limit < 1 or args.rate_limit > 1000:
        print("✗ Error: rate-limit must be between 1 and 1000")
        sys.exit(1)

    # Generate the key
    key_data = generator.generate_key(
        partner_name=args.partner,
        expires_days=args.expires_days,
        rate_limit=args.rate_limit,
        environment=args.environment,
        description=args.description,
    )

    # Save to file unless --no-save is specified
    if not args.no_save:
        generator.save_to_file(key_data)

    print("⚠️  Security Reminders:")
    print("  1. Store the API key in a secure password manager")
    print("  2. Never commit api_keys_secure.json to version control")
    print("  3. Add api_keys_secure.json to .gitignore")
    print("  4. Share keys securely (encrypted email, password manager, etc.)")
    print("  5. Rotate keys regularly (recommended: every 90-180 days)\n")


if __name__ == "__main__":
    main()
