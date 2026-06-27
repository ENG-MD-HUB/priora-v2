// folderColors.js
// حساب لون المجلد المناسب لكل وضع (داكن/نهاري) من لون أساسي واحد محفوظ — ميزة جديدة
// بطلب صريح (غير موجودة بالكود الأصلي).
//
// الفكرة: نحفظ لون واحد فقط بكل مجلد (folder.color)، ونحسب نسخة معدّلة منه حسب
// الوضع الحالي وقت العرض فقط (بدون تخزين نسختين) — هذا أنظف من تخزين لونين منفصلين،
// ولا يكسر أي بيانات موجودة (المجلدات القديمة بلون واحد تستمر تعمل بدون أي ترحيل).
//
// المنطق: بالوضع الداكن، اللون يُعرض فاتح بشكل طبيعي (كما هو مخزّن، بفرض إنه أصلاً
// لون "حيوي" واضح). بالوضع النهاري (خلفية فاتحة)، نفس اللون يُعتم (يُغمَّق) قليلاً
// عشان يحافظ على تباين كافٍ وقراءة واضحة فوق خلفية بيضاء/فاتحة.

/**
 * يحوّل لون HEX لمكوّناته RGB.
 */
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * يرجع لون المجلد المناسب للوضع الحالي. بالداكن: اللون الأساسي كما هو. بالنهاري:
 * نسخة أغمق بنسبة ثابتة (20%) — تحافظ على نفس "هوية" اللون (نفس درجة الألوان الأساسية)
 * بس بسطوع أقل يناسب خلفية فاتحة.
 *
 * @param {string} baseColor - اللون الأساسي المحفوظ بالمجلد (مثلاً '#3b82f6')
 * @param {'dark'|'light'} theme - الوضع الحالي
 */
export function getAdaptiveFolderColor(baseColor, theme) {
  if (theme !== 'light') return baseColor;

  const { r, g, b } = hexToRgb(baseColor);
  const darkenFactor = 0.8; // تعتيم بنسبة 20%
  return rgbToHex(r * darkenFactor, g * darkenFactor, b * darkenFactor);
}
