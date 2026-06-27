// FontScaleControl.jsx
// أزرار تكبير/تصغير حجم التطبيق العام — تصميم أنيق بإطار رفيع، بترتيب [-] [النسبة] [+].

export function FontScaleControl({ fontScale }) {
  const { scale, increase, decrease, reset, canIncrease, canDecrease, isDefault } = fontScale;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
        border: '1px solid var(--border)', borderRadius: 7, padding: 2, background: 'var(--surface2)',
      }}
    >
      <button
        onClick={decrease}
        disabled={!canDecrease}
        title="Decrease size"
        style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: 5, cursor: canDecrease ? 'pointer' : 'not-allowed', color: canDecrease ? 'var(--text2)' : 'var(--border2)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', transition: 'background .12s' }}
        onMouseEnter={(e) => { if (canDecrease) e.currentTarget.style.background = 'var(--surface3)'; }}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        −
      </button>

      <button
        onClick={reset}
        title="Reset to default size"
        disabled={isDefault}
        style={{ minWidth: 38, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: 5, cursor: isDefault ? 'default' : 'pointer', color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--mono)', transition: 'background .12s' }}
        onMouseEnter={(e) => { if (!isDefault) e.currentTarget.style.background = 'var(--surface3)'; }}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        {Math.round(scale * 100)}%
      </button>

      <button
        onClick={increase}
        disabled={!canIncrease}
        title="Increase size"
        style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: 5, cursor: canIncrease ? 'pointer' : 'not-allowed', color: canIncrease ? 'var(--text2)' : 'var(--border2)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', transition: 'background .12s' }}
        onMouseEnter={(e) => { if (canIncrease) e.currentTarget.style.background = 'var(--surface3)'; }}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        +
      </button>
    </div>
  );
}
