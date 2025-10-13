#!/bin/bash

# Strong Password Generator Script
# Generates a secure password with mixed character types

# Configuration
PASSWORD_LENGTH=32
MIN_DIGITS=4
MIN_SPECIAL=4
MIN_UPPERCASE=4
MIN_LOWERCASE=4

# Generate a random string with specific character types
random_string_with_requirements() {
  local length=$1
  local min_digits=$2
  local min_special=$3
  local min_uppercase=$4
  local min_lowercase=$5
  
  # Generate required characters
  local digits=$(cat /dev/urandom | tr -dc '0-9' | fold -w "$min_digits" | head -n 1)
  local special=$(cat /dev/urandom | tr -dc '!@#$%^&*()-_=+[]{}|;:,.<>?' | fold -w "$min_special" | head -n 1)
  local uppercase=$(cat /dev/urandom | tr -dc 'A-Z' | fold -w "$min_uppercase" | head -n 1)
  local lowercase=$(cat /dev/urandom | tr -dc 'a-z' | fold -w "$min_lowercase" | head -n 1)
  
  # Calculate remaining length
  local remaining_length=$((length - min_digits - min_special - min_uppercase - min_lowercase))
  
  # Generate remaining characters
  local remaining=""
  if [ "$remaining_length" -gt 0 ]; then
    remaining=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9!@#$%^&*()-_=+[]{}|;:,.<>?' | fold -w "$remaining_length" | head -n 1)
  fi
  
  # Combine all parts
  local combined="${digits}${special}${uppercase}${lowercase}${remaining}"
  
  # Shuffle the combined string
  echo "$combined" | fold -w1 | shuf | tr -d '\n'
}

# Generate the strong password
generate_strong_password() {
  random_string_with_requirements "$PASSWORD_LENGTH" "$MIN_DIGITS" "$MIN_SPECIAL" "$MIN_UPPERCASE" "$MIN_LOWERCASE"
}

# Output the generated strong password
generate_strong_password
