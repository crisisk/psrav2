#!/bin/bash

# JWT Secret Generator Script
# Generates a secure JWT secret

# Configuration
SECRET_LENGTH=64

# Generate a random string
random_string() {
  local length=$1
  cat /dev/urandom | tr -dc 'a-zA-Z0-9!@#$%^&*()-_=+[]{}|;:,.<>?' | fold -w "$length" | head -n 1
}

# Generate the JWT secret
generate_jwt_secret() {
  random_string "$SECRET_LENGTH"
}

# Output the generated JWT secret
generate_jwt_secret
