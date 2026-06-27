// WindowsFolderIcon.jsx
// أيقونة مجلد بشكل كلاسيكي (يشبه أيقونات Windows Explorer) — ميزة جديدة بطلب صريح.
// تتكون من طبقتين: الجزء الخلفي (الغطاء العلوي) بلون أغمق قليلاً من اللون الأساسي،
// والجزء الأمامي (الجسم الرئيسي) باللون الأساسي نفسه — هذا التدرج البسيط بين طبقتين
// هو ما يعطي الشكل "ثلاثي الأبعاد" المعروف بأيقونات المجلدات التقليدية.

function darken(hex, amount) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const factor = 1 - amount;
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n * factor))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function WindowsFolderIcon({ color = '#3b82f6', size = 40 }) {
  const backColor = darken(color, 0.18);

  return (
    <svg width={size} height={size} viewBox="0 0 48 40" xmlns="http://www.w3.org/2000/svg">
      {/* الغطاء الخلفي — يبرز فوق الجسم بشكل طفيف من الأعلى، يعطي العمق */}
      <path d="M2 6c0-1.1.9-2 2-2h12l3 4h23c1.1 0 2 .9 2 2v3H2V6z" fill={backColor} />
      {/* الجسم الأمامي للمجلد */}
      <path d="M2 11h44v23a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V11z" fill={color} />
    </svg>
  );
}
