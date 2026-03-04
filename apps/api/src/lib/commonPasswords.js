/**
 * Common passwords blocklist
 * These are the most commonly used passwords and should be blocked
 * Based on lists from security research
 */

export const COMMON_PASSWORDS = [
  // Top commonly used passwords
  '123456', '123456789', '12345678', '1234567890', '12345',
  'password', 'password1', 'password123', 'passw0rd', 'Password1',
  'Password123', 'Password!', 'admin', 'admin123', 'administrator',
  'qwerty', 'qwerty123', 'qwertyuiop', 'abc123', 'abcd1234',
  'letmein', 'welcome', 'welcome1', 'welcome123', 'monkey',
  'dragon', 'master', 'login', 'princess', 'solo',
  'iloveyou', 'sunshine', 'shadow', 'ashley', 'football',
  'baseball', 'michael', 'superman', 'batman', 'trustno1',
  
  // Keyboard patterns
  '1q2w3e4r', 'zaq12wsx', '1qaz2wsx', 'qazwsx', 'asdfgh',
  'zxcvbn', 'asdf1234', '1234qwer', 'qwer1234',
  
  // Common phrases
  'changeme', 'letmein123', 'test123', 'test1234', 'testing',
  'guest', 'guest123', 'root', 'toor', 'pass', 'pass123',
  'default', 'temp', 'temp123', 'password!', 'hello123',
  
  // Year-based
  'summer2024', 'winter2024', 'spring2024', 'fall2024',
  'summer2025', 'winter2025', 'spring2025', 'fall2025',
  'summer2026', 'winter2026', 'spring2026', 'fall2026',
  
  // Common names with numbers
  'john123', 'mike123', 'david123', 'user123', 'user1234',
  
  // Application specific
  'testtrack', 'TestTrack', 'testtrack123', 'TestTrack123',
];

/**
 * Check if a password is in the common passwords list
 * @param {string} password - Password to check
 * @returns {boolean} - True if password is common/blocked
 */
export function isCommonPassword(password) {
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.some(common => 
    lowerPassword === common.toLowerCase(),
  );
}

/**
 * Check if password contains user identifiable information
 * @param {string} password - Password to check
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @returns {object} - { isValid: boolean, reason: string }
 */
export function checkPasswordUserInfo(password, email = '', name = '') {
  const lowerPassword = password.toLowerCase();
  
  // Check email
  if (email) {
    const emailName = email.split('@')[0].toLowerCase();
    if (emailName.length >= 3 && lowerPassword.includes(emailName)) {
      return { isValid: false, reason: 'Password cannot contain your email' };
    }
  }
  
  // Check name
  if (name) {
    const nameParts = name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length >= 3 && lowerPassword.includes(part)) {
        return { isValid: false, reason: 'Password cannot contain your name' };
      }
    }
  }
  
  return { isValid: true, reason: '' };
}

export default COMMON_PASSWORDS;
