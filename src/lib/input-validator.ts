
// Input validation utilities

// Validate email addresses
export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize text input to prevent XSS
export function sanitizeInput(input: string): string {
  // Basic sanitization - replace HTML tags
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate video prompt input
export function validateVideoPrompt(input: string): { isValid: boolean; message?: string } {
  if (!input || input.trim().length === 0) {
    return { isValid: false, message: 'Prompt cannot be empty' };
  }
  
  if (input.length < 10) {
    return { isValid: false, message: 'Prompt is too short (minimum 10 characters)' };
  }
  
  if (input.length > 500) {
    return { isValid: false, message: 'Prompt is too long (maximum 500 characters)' };
  }
  
  // Check for harmful patterns (basic check)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onclick/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, message: 'Input contains disallowed patterns' };
    }
  }
  
  return { isValid: true };
}

// Validate URL input
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validate input length with customizable constraints
export function validateLength(
  input: string,
  { min = 0, max = Infinity, fieldName = 'Input' }: 
  { min?: number; max?: number; fieldName?: string }
): { isValid: boolean; message?: string } {
  if (input.length < min) {
    return { 
      isValid: false, 
      message: `${fieldName} must be at least ${min} characters` 
    };
  }
  
  if (input.length > max) {
    return { 
      isValid: false, 
      message: `${fieldName} cannot exceed ${max} characters` 
    };
  }
  
  return { isValid: true };
}

// Create a debounce function for input validation
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
