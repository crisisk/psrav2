#!/bin/bash

# Setup script for code quality tools
# This script installs and configures all necessary code quality tools for the project

set -e

echo "Setting up code quality tools..."

# Create directories
mkdir -p ~/.config/git

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install --save-dev \
  eslint@8.38.0 \
  eslint-config-prettier@8.8.0 \
  eslint-plugin-import@2.27.5 \
  eslint-plugin-jsx-a11y@6.7.1 \
  eslint-plugin-prettier@4.2.1 \
  eslint-plugin-react@7.32.2 \
  eslint-plugin-react-hooks@4.6.0 \
  @typescript-eslint/eslint-plugin@5.59.0 \
  @typescript-eslint/parser@5.59.0 \
  prettier@2.8.7 \
  typescript@5.0.4

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade \
  black==23.3.0 \
  isort==5.12.0 \
  flake8==6.0.0 \
  flake8-docstrings==1.7.0 \
  flake8-quotes==3.3.2 \
  flake8-bugbear==23.3.23 \
  mypy==1.2.0 \
  pytest==7.3.1 \
  pytest-cov==4.1.0 \
  pre-commit==3.3.1

# Install PHP dependencies
echo "Installing PHP dependencies..."
composer require --dev \
  squizlabs/php_codesniffer:^3.7 \
  wp-coding-standards/wpcs:^2.3 \
  phpcompatibility/php-compatibility:^9.3 \
  dealerdirect/phpcodesniffer-composer-installer:^0.7

# Configure PHP CodeSniffer
echo "Configuring PHP CodeSniffer..."
vendor/bin/phpcs --config-set installed_paths vendor/wp-coding-standards/wpcs,vendor/phpcompatibility/php-compatibility

# Copy configuration files
echo "Copying configuration files..."

# ESLint and Prettier
cp phase1/code_quality/config/.eslintrc.js .
cp phase1/code_quality/config/.prettierrc .

# Python tools
cp phase1/code_quality/config/pyproject.toml .

# PHP CodeSniffer
cp phase1/code_quality/config/phpcs.xml .

# Pre-commit
cp phase1/code_quality/config/.pre-commit-config.yaml .

# Install pre-commit hooks
echo "Installing pre-commit hooks..."
pre-commit install
pre-commit install --hook-type commit-msg

# Create git hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-push hook
echo "Creating pre-push hook..."
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Run tests before pushing
echo "Running tests before push..."

# Run JavaScript/TypeScript tests
if [ -f "package.json" ]; then
  echo "Running JavaScript/TypeScript tests..."
  npm test
fi

# Run Python tests
if [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then
  echo "Running Python tests..."
  pytest
fi

# Run PHP tests
if [ -f "phpunit.xml" ]; then
  echo "Running PHP tests..."
  vendor/bin/phpunit
fi

# If any command failed, prevent the push
if [ $? -ne 0 ]; then
  echo "Tests failed. Push aborted."
  exit 1
fi

echo "All tests passed. Proceeding with push."
exit 0
EOF

chmod +x .git/hooks/pre-push

echo "Code quality tools setup complete!"
echo "Run 'pre-commit run --all-files' to check all files with pre-commit hooks."
