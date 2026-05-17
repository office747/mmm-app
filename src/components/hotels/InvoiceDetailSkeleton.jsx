/**
 * InvoiceDetailSkeleton
 * Shown while invoice gigs are being fetched after expanding a row.
 */
export default function InvoiceDetailSkeleton() {
  return (
    <tr>
      <td colSpan={10} style={{ padding: 0, borderBottom: '2px solid var(--border)' }}>
        <div
          className="row-detail-inner"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)' }}
        >
          {/* left — gigs skeleton */}
          <div>
            <div style={{ ...skel, width: 120, height: 12, marginBottom: 'var(--sp-3)' }} />
            {[90, 75, 110].map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-2)', alignItems: 'center' }}>
                <div style={{ ...skel, width: 64, height: 10 }} />
                <div style={{ ...skel, width: w, height: 10, flex: 1 }} />
                <div style={{ ...skel, width: 48, height: 10 }} />
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--sp-2)', paddingTop: 'var(--sp-2)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-4)' }}>
              <div style={{ ...skel, width: 60, height: 10 }} />
              <div style={{ ...skel, width: 48, height: 10 }} />
            </div>
          </div>

          {/* right — metadata skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div style={{ ...skel, width: 64, height: 20, borderRadius: 999 }} />
            <div>
              <div style={{ ...skel, width: 96, height: 12, marginBottom: 'var(--sp-2)' }} />
              <div style={{ ...skel, width: '100%', height: 36, borderRadius: 'var(--radius)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[80, 110, 70].map((w, i) => (
                <div key={i} style={{ ...skel, width: w, height: 10 }} />
              ))}
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

const skel = {
  background: 'linear-gradient(90deg, var(--border) 25%, var(--bg-hover) 50%, var(--border) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: 4,
}
