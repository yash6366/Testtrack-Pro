import { useMemo } from 'react';
import zxcvbn from 'zxcvbn';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';

// Common passwords that should be blocked
const COMMON_PASSWORDS = [
  '123456', '123456789', 'password', 'admin', 'admin123',
  '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', 'letmein', 'login', 'welcome', 'password1',
  'Password1', 'Password123', 'qwerty123', '1234567890',
  'iloveyou', 'sunshine', 'princess', 'football', 'baseball',
  'passw0rd', 'shadow', 'superman', 'michael', 'testtrack',
];

/**
 * Password strength indicator component using zxcvbn
 * @param {Object} props
 * @param {string} props.password - The password to evaluate
 * @param {string} [props.email] - User's email to check against
 * @param {string} [props.username] - Username to check against
 * @param {boolean} [props.showRequirements=true] - Whether to show requirements checklist
 * @param {function} [props.onStrengthChange] - Callback when strength changes (receives score 0-4 and isValid boolean)
 */
export default function PasswordStrengthIndicator({ 
  password = '', 
  email = '', 
  username = '',
  showRequirements = true,
  onStrengthChange,
}) {
  const { t } = useTranslation();

  const analysis = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        requirements: {
          minLength: false,
          hasLower: false,
          hasUpper: false,
          hasNumber: false,
          hasSpecial: false,
          notCommon: true,
          notContainsEmail: true,
          notContainsUsername: true,
        },
        isValid: false,
        feedback: [],
      };
    }

    // Run zxcvbn analysis
    const result = zxcvbn(password, [email, username].filter(Boolean));

    // Check individual requirements
    const requirements = {
      minLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'`~]/.test(password),
      notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
      notContainsEmail: !email || !password.toLowerCase().includes(email.split('@')[0].toLowerCase()),
      notContainsUsername: !username || !password.toLowerCase().includes(username.toLowerCase()),
    };

    // Calculate if all requirements are met
    const isValid = Object.values(requirements).every(Boolean);

    // Adjust score based on our requirements
    let adjustedScore = result.score;
    if (!isValid) {
      adjustedScore = Math.min(adjustedScore, 1); // Cap at weak if requirements not met
    }
    if (!requirements.notCommon) {
      adjustedScore = 0; // Very weak if common password
    }

    // Compile feedback
    const feedback = [];
    if (result.feedback.warning) {
      feedback.push(result.feedback.warning);
    }
    feedback.push(...(result.feedback.suggestions || []));

    return {
      score: adjustedScore,
      requirements,
      isValid,
      feedback,
      crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    };
  }, [password, email, username]);

  // Notify parent of strength changes
  useMemo(() => {
    if (onStrengthChange) {
      onStrengthChange(analysis.score, analysis.isValid);
    }
  }, [analysis.score, analysis.isValid, onStrengthChange]);

  const strengthLabels = [
    { label: t('password.veryWeak', 'Very Weak'), color: 'bg-red-500', textColor: 'text-red-500' },
    { label: t('password.weak', 'Weak'), color: 'bg-orange-500', textColor: 'text-orange-500' },
    { label: t('password.fair', 'Fair'), color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    { label: t('password.strong', 'Strong'), color: 'bg-green-500', textColor: 'text-green-500' },
    { label: t('password.veryStrong', 'Very Strong'), color: 'bg-emerald-600', textColor: 'text-emerald-600' },
  ];

  const currentStrength = strengthLabels[analysis.score];

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index <= analysis.score ? currentStrength.color : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-xs font-medium ${currentStrength.textColor}`}>
            {currentStrength.label}
          </span>
          {analysis.crackTime && (
            <span className="text-xs text-[var(--muted)]">
              {t('password.crackTime', 'Time to crack')}: {analysis.crackTime}
            </span>
          )}
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <RequirementItem 
            met={analysis.requirements.minLength} 
            label={t('password.minLength', 'At least 8 characters')} 
          />
          <RequirementItem 
            met={analysis.requirements.hasUpper} 
            label={t('password.hasUpper', 'Uppercase letter')} 
          />
          <RequirementItem 
            met={analysis.requirements.hasLower} 
            label={t('password.hasLower', 'Lowercase letter')} 
          />
          <RequirementItem 
            met={analysis.requirements.hasNumber} 
            label={t('password.hasNumber', 'Number')} 
          />
          <RequirementItem 
            met={analysis.requirements.hasSpecial} 
            label={t('password.hasSpecial', 'Special character')} 
          />
          <RequirementItem 
            met={analysis.requirements.notCommon} 
            label={t('password.notCommon', 'Not a common password')} 
          />
          {email && (
            <RequirementItem 
              met={analysis.requirements.notContainsEmail} 
              label={t('password.notContainsEmail', 'Does not contain email')} 
            />
          )}
          {username && (
            <RequirementItem 
              met={analysis.requirements.notContainsUsername} 
              label={t('password.notContainsUsername', 'Does not contain name')} 
            />
          )}
        </div>
      )}

      {/* Feedback from zxcvbn */}
      {analysis.feedback.length > 0 && (
        <div className="text-xs text-[var(--muted)] space-y-1">
          {analysis.feedback.map((tip, index) => (
            <p key={index} className="flex items-start gap-1">
              <span className="text-[var(--warning)]">💡</span>
              {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, label }) {
  return (
    <div className={`flex items-center gap-1.5 ${met ? 'text-[var(--success)]' : 'text-[var(--muted)]'}`}>
      {met ? (
        <Check className="h-3 w-3 flex-shrink-0" />
      ) : (
        <X className="h-3 w-3 flex-shrink-0" />
      )}
      <span>{label}</span>
    </div>
  );
}

/**
 * Hook to validate password strength
 * Returns { isValid, score, requirements }
 */
export function usePasswordStrength(password, email = '', username = '') {
  return useMemo(() => {
    if (!password) {
      return { isValid: false, score: 0, requirements: {} };
    }

    const result = zxcvbn(password, [email, username].filter(Boolean));
    
    const requirements = {
      minLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'`~]/.test(password),
      notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
      notContainsEmail: !email || !password.toLowerCase().includes(email.split('@')[0].toLowerCase()),
      notContainsUsername: !username || !password.toLowerCase().includes(username.toLowerCase()),
    };

    const isValid = Object.values(requirements).every(Boolean);
    
    return {
      isValid,
      score: result.score,
      requirements,
    };
  }, [password, email, username]);
}
