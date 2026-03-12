
import { BANNED_EXPRESSION_KEYWORDS } from '../constants/photogenicExpressions';

export const sanitizeExpressionText = (input: string): string => {
  let sanitized = input.toLowerCase();

  Object.entries(BANNED_EXPRESSION_KEYWORDS).forEach(([ban, replacement]) => {
    if (sanitized.includes(ban)) {
      sanitized = sanitized.replace(ban, replacement);
    }
  });

  return sanitized;
};
