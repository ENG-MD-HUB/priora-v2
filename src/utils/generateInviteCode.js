// generateInviteCode.js
// مولّد كود الدعوة لورك سبيس — نسخة مُعاد كتابتها بوضوح من الدالة `Ot` بالكود الأصلي.
// الشكل: XXXX-XXXX (4 حروف/أرقام، شرطة، 4 حروف/أرقام).
//
// ملاحظة مهمة محفوظة من الأصل: الحروف المستخدمة تستثني عمداً 0, 1, I, O — لتفادي
// اللخبطة البصرية بينها (مثلاً 0 و O يصعب تمييزهم بخط كتابة اليد أو شاشات صغيرة).

const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomSegment() {
  return Array.from({ length: 4 }, () => SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]).join('');
}

export function generateInviteCode() {
  return `${randomSegment()}-${randomSegment()}`;
}
