import { NextResponse } from 'next/server';
import { getEscalations } from '@/lib/db';

function sanitizeSensitiveText(text: string): string {
  if (!text) return '';
  let sanitized = text;
  // Redact OTP, PIN, CVV, passwords
  sanitized = sanitized.replace(/\b(otp|one[- ]time[- ]password|verification code)\s*(?:is|code|number)?\s*[:=]*\s*\d{4,8}\b/gi, '[REDACTED_OTP]');
  sanitized = sanitized.replace(/\b(pin|atm pin|upi pin)\s*(?:is|code|number)?\s*[:=]*\s*\d{4,6}\b/gi, '[REDACTED_PIN]');
  sanitized = sanitized.replace(/\b(cvv2?|cvc)\s*(?:is|code|number)?\s*[:=]*\s*\d{3,4}\b/gi, '[REDACTED_CVV]');
  sanitized = sanitized.replace(/\b(password|passcode|pwd)\s*(?:is|code)?\s*[:=]*\s*\S+/gi, '[REDACTED_PASSWORD]');
  // Redact 13-19 digit card numbers
  sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_CARD]');
  // Redact 9-18 digit account numbers
  sanitized = sanitized.replace(/\b\d{9,18}\b/g, '[REDACTED_ACCOUNT]');
  return sanitized;
}

export async function GET() {
  try {
    const rawEscalations = getEscalations(50);
    
    // Ensure sensitive information is NEVER displayed/leaked
    const escalations = rawEscalations.map((item) => ({
      ...item,
      short_summary: sanitizeSensitiveText(item.short_summary),
      issue_type: sanitizeSensitiveText(item.issue_type),
      status: item.status || 'open',
    }));

    return NextResponse.json({
      success: true,
      escalations,
    });
  } catch (error: any) {
    console.error('Error fetching human escalations from database:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch escalations' },
      { status: 500 }
    );
  }
}
