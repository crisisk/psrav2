export function checkPasswordStrength(password: string): PasswordStrengthResponse {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
    feedback.push('✓ Minimum 8 characters');
  } else {
    feedback.push('✗ At least 8 characters required');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
    feedback.push('✓ Contains uppercase letters');
  } else {
    feedback.push('✗ Add uppercase letters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
    feedback.push('✓ Contains lowercase letters');
  } else {
    feedback.push('✗ Add lowercase letters');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
    feedback.push('✓ Contains numbers');
  } else {
    feedback.push('✗ Add numbers');
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
    feedback.push('✓ Contains special characters');
  } else {
    feedback.push('✗ Add special characters');
  }

  return {
    score: Math.min(score, 4), // Cap score at 4 for UI display
    feedback,
    isValid: score >= 3 && password.length >= 8
  };
}

type PasswordStrengthResponse = ReturnType<typeof checkPasswordStrength>;
