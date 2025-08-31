import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

// Using the variable font which includes all weights (300-700)
const quicksand = localFont({
  src: '../../public/fonts/Quicksand-VariableFont_wght.ttf',
  display: 'swap',
  variable: '--font-quicksand',
})

// Fallback to Inter from Google Fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function FontDemoPage() {
  return (
    <div
      style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}
      className={`${quicksand.variable} ${inter.variable} ${quicksand.className}`}
    >
      <h1 className={quicksand.className}>Quicksand Font Demo</h1>
      <p>
        This page demonstrates the different weights of the Quicksand font
        family.
      </p>

      <div style={{ marginTop: '2rem' }}>
        <h2 className={quicksand.className}>Font Weights</h2>

        <div style={{ marginBottom: '1rem' }}>
          <p className="font-light" style={{ fontSize: '1.5rem' }}>
            Light (300) - The quick brown fox jumps over the lazy dog
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p className="font-regular" style={{ fontSize: '1.5rem' }}>
            Regular (400) - The quick brown fox jumps over the lazy dog
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p className="font-medium" style={{ fontSize: '1.5rem' }}>
            Medium (500) - The quick brown fox jumps over the lazy dog
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p className="font-semibold" style={{ fontSize: '1.5rem' }}>
            SemiBold (600) - The quick brown fox jumps over the lazy dog
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p className="font-bold" style={{ fontSize: '1.5rem' }}>
            Bold (700) - The quick brown fox jumps over the lazy dog
          </p>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 className={quicksand.className}>Usage Examples</h2>

        <h1 className={quicksand.className}>H1 Heading (Bold 700)</h1>
        <h2 className={quicksand.className}>H2 Heading (Bold 700)</h2>
        <h3 className={quicksand.className}>H3 Heading (Bold 700)</h3>
        <h4 className={quicksand.className}>H4 Heading (SemiBold 600)</h4>
        <h5 className={quicksand.className}>H5 Heading (SemiBold 600)</h5>
        <h6 className={quicksand.className}>H6 Heading (SemiBold 600)</h6>

        <p>Regular paragraph text uses weight 400 by default.</p>
        <p className="text-muted">Muted text uses Light weight (300).</p>
      </div>

      <div
        style={{
          marginTop: '3rem',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <h3 className={quicksand.className}>How to Use</h3>
        <p>
          The Quicksand font is automatically applied to the entire app through
          the layout.
        </p>
        <ul>
          <li>
            Use <code>className="font-light"</code> for weight 300
          </li>
          <li>
            Use <code>className="font-regular"</code> for weight 400
          </li>
          <li>
            Use <code>className="font-medium"</code> for weight 500
          </li>
          <li>
            Use <code>className="font-semibold"</code> for weight 600
          </li>
          <li>
            Use <code>className="font-bold"</code> for weight 700
          </li>
        </ul>
        <p>
          Or use inline styles:{' '}
          <code>style=&#123;&#123; fontWeight: 500 &#125;&#125;</code>
        </p>
      </div>
    </div>
  )
}
