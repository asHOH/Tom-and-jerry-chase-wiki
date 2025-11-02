import * as crypto from 'crypto';

export interface PasswordStrength {
  strength: 0 | 1 | 2 | 3 | 4;
  reason: string;
}

const MIN_LENGTH = 6;
const RECOMMENDED_LENGTH = 12;
const STRONG_LENGTH = 16;

export async function checkPasswordStrength(password: string): Promise<PasswordStrength> {
  if (!password || password.length === 0) {
    return {
      strength: 0,
      reason: '密码不能为空',
    };
  }

  if (password.length < MIN_LENGTH) {
    return {
      strength: 1,
      reason: `密码过短，至少需要 ${MIN_LENGTH} 个字符`,
    };
  }

  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const varietyScore = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars].filter(
    Boolean
  ).length;

  const commonPatterns = [
    /^123+/,
    /^abc+/i,
    /password/i,
    /qwerty/i,
    /(.)\1{2,}/,
    /^[a-z]+$/i,
    /^\d+$/,
  ];

  const hasCommonPattern = commonPatterns.some((pattern) => pattern.test(password));

  if (hasCommonPattern) {
    return {
      strength: 1,
      reason: '密码包含常见模式，请使用更复杂的组合',
    };
  }

  const isPwned = await checkHaveIBeenPwned(password);
  if (isPwned) {
    return {
      strength: 1,
      reason: '此密码已在数据泄露中出现，请更换密码',
    };
  }

  if (varietyScore < 2) {
    return {
      strength: 1,
      reason: '密码需要包含至少两种字符类型（大写、小写、数字、特殊字符）',
    };
  }

  if (password.length >= MIN_LENGTH && password.length < RECOMMENDED_LENGTH) {
    if (varietyScore === 2) {
      return {
        strength: 2,
        reason: '密码强度一般，建议增加长度或使用更多字符类型',
      };
    }
    if (varietyScore === 3) {
      return {
        strength: 3,
        reason: '密码强度良好，建议增加长度至 12 个字符以上',
      };
    }
  }

  if (password.length >= RECOMMENDED_LENGTH && password.length < STRONG_LENGTH) {
    if (varietyScore === 2) {
      return {
        strength: 2,
        reason: '密码强度一般，建议使用更多字符类型',
      };
    }
    if (varietyScore === 3) {
      return {
        strength: 3,
        reason: '密码强度良好',
      };
    }
    if (varietyScore === 4) {
      return {
        strength: 4,
        reason: '密码强度很强',
      };
    }
  }

  if (password.length >= STRONG_LENGTH) {
    if (varietyScore >= 3) {
      return {
        strength: 4,
        reason: '密码强度很强',
      };
    }
    if (varietyScore === 2) {
      return {
        strength: 3,
        reason: '密码强度良好，建议使用更多字符类型',
      };
    }
  }

  return {
    strength: 4,
    reason: '密码强度很强',
  };
}

async function checkHaveIBeenPwned(password: string): Promise<boolean> {
  try {
    const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true',
      },
    });

    if (!response.ok) {
      console.warn('Have I Been Pwned API request failed, skipping check');
      return false;
    }

    const data = await response.text();
    const hashes = data.split('\n');

    return hashes.some((line) => {
      const [hashSuffix] = line.split(':');
      return hashSuffix === suffix;
    });
  } catch (error) {
    console.warn('Error checking Have I Been Pwned API:', error);
    return false;
  }
}
