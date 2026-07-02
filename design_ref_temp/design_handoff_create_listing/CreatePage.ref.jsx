// ── Country list (name + flag emoji) ─────────────────────────────────────────
const COUNTRIES = [
  { name: 'Afghanistan', flag: '🇦🇫' }, { name: 'Albania', flag: '🇦🇱' },
  { name: 'Algeria', flag: '🇩🇿' }, { name: 'Andorra', flag: '🇦🇩' },
  { name: 'Angola', flag: '🇦🇴' }, { name: 'Antigua & Barbuda', flag: '🇦🇬' },
  { name: 'Argentina', flag: '🇦🇷' }, { name: 'Armenia', flag: '🇦🇲' },
  { name: 'Australia', flag: '🇦🇺' }, { name: 'Austria', flag: '🇦🇹' },
  { name: 'Azerbaijan', flag: '🇦🇿' }, { name: 'Bahamas', flag: '🇧🇸' },
  { name: 'Bahrain', flag: '🇧🇭' }, { name: 'Bangladesh', flag: '🇧🇩' },
  { name: 'Barbados', flag: '🇧🇧' }, { name: 'Belarus', flag: '🇧🇾' },
  { name: 'Belgium', flag: '🇧🇪' }, { name: 'Belize', flag: '🇧🇿' },
  { name: 'Benin', flag: '🇧🇯' }, { name: 'Bhutan', flag: '🇧🇹' },
  { name: 'Bolivia', flag: '🇧🇴' }, { name: 'Bosnia & Herzegovina', flag: '🇧🇦' },
  { name: 'Botswana', flag: '🇧🇼' }, { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Brunei', flag: '🇧🇳' }, { name: 'Bulgaria', flag: '🇧🇬' },
  { name: 'Burkina Faso', flag: '🇧🇫' }, { name: 'Burundi', flag: '🇧🇮' },
  { name: 'Cambodia', flag: '🇰🇭' }, { name: 'Cameroon', flag: '🇨🇲' },
  { name: 'Canada', flag: '🇨🇦' }, { name: 'Cape Verde', flag: '🇨🇻' },
  { name: 'Central African Republic', flag: '🇨🇫' }, { name: 'Chad', flag: '🇹🇩' },
  { name: 'Chile', flag: '🇨🇱' }, { name: 'China', flag: '🇨🇳' },
  { name: 'Colombia', flag: '🇨🇴' }, { name: 'Comoros', flag: '🇰🇲' },
  { name: 'Congo', flag: '🇨🇬' }, { name: 'Costa Rica', flag: '🇨🇷' },
  { name: 'Croatia', flag: '🇭🇷' }, { name: 'Cuba', flag: '🇨🇺' },
  { name: 'Cyprus', flag: '🇨🇾' }, { name: 'Czech Republic', flag: '🇨🇿' },
  { name: 'Denmark', flag: '🇩🇰' }, { name: 'Djibouti', flag: '🇩🇯' },
  { name: 'Dominica', flag: '🇩🇲' }, { name: 'Dominican Republic', flag: '🇩🇴' },
  { name: 'Ecuador', flag: '🇪🇨' }, { name: 'Egypt', flag: '🇪🇬' },
  { name: 'El Salvador', flag: '🇸🇻' }, { name: 'Equatorial Guinea', flag: '🇬🇶' },
  { name: 'Eritrea', flag: '🇪🇷' }, { name: 'Estonia', flag: '🇪🇪' },
  { name: 'Eswatini', flag: '🇸🇿' }, { name: 'Ethiopia', flag: '🇪🇹' },
  { name: 'Fiji', flag: '🇫🇯' }, { name: 'Finland', flag: '🇫🇮' },
  { name: 'France', flag: '🇫🇷' }, { name: 'Gabon', flag: '🇬🇦' },
  { name: 'Gambia', flag: '🇬🇲' }, { name: 'Georgia', flag: '🇬🇪' },
  { name: 'Germany', flag: '🇩🇪' }, { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Greece', flag: '🇬🇷' }, { name: 'Grenada', flag: '🇬🇩' },
  { name: 'Guatemala', flag: '🇬🇹' }, { name: 'Guinea', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', flag: '🇬🇼' }, { name: 'Guyana', flag: '🇬🇾' },
  { name: 'Haiti', flag: '🇭🇹' }, { name: 'Honduras', flag: '🇭🇳' },
  { name: 'Hong Kong', flag: '🇭🇰' }, { name: 'Hungary', flag: '🇭🇺' },
  { name: 'Iceland', flag: '🇮🇸' }, { name: 'India', flag: '🇮🇳' },
  { name: 'Indonesia', flag: '🇮🇩' }, { name: 'Iran', flag: '🇮🇷' },
  { name: 'Iraq', flag: '🇮🇶' }, { name: 'Ireland', flag: '🇮🇪' },
  { name: 'Israel', flag: '🇮🇱' }, { name: 'Italy', flag: '🇮🇹' },
  { name: 'Jamaica', flag: '🇯🇲' }, { name: 'Japan', flag: '🇯🇵' },
  { name: 'Jordan', flag: '🇯🇴' }, { name: 'Kazakhstan', flag: '🇰🇿' },
  { name: 'Kenya', flag: '🇰🇪' }, { name: 'Kiribati', flag: '🇰🇮' },
  { name: 'Kuwait', flag: '🇰🇼' }, { name: 'Kyrgyzstan', flag: '🇰🇬' },
  { name: 'Laos', flag: '🇱🇦' }, { name: 'Latvia', flag: '🇱🇻' },
  { name: 'Lebanon', flag: '🇱🇧' }, { name: 'Lesotho', flag: '🇱🇸' },
  { name: 'Liberia', flag: '🇱🇷' }, { name: 'Libya', flag: '🇱🇾' },
  { name: 'Liechtenstein', flag: '🇱🇮' }, { name: 'Lithuania', flag: '🇱🇹' },
  { name: 'Luxembourg', flag: '🇱🇺' }, { name: 'Madagascar', flag: '🇲🇬' },
  { name: 'Malawi', flag: '🇲🇼' }, { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Maldives', flag: '🇲🇻' }, { name: 'Mali', flag: '🇲🇱' },
  { name: 'Malta', flag: '🇲🇹' }, { name: 'Marshall Islands', flag: '🇲🇭' },
  { name: 'Mauritania', flag: '🇲🇷' }, { name: 'Mauritius', flag: '🇲🇺' },
  { name: 'Mexico', flag: '🇲🇽' }, { name: 'Micronesia', flag: '🇫🇲' },
  { name: 'Moldova', flag: '🇲🇩' }, { name: 'Monaco', flag: '🇲🇨' },
  { name: 'Mongolia', flag: '🇲🇳' }, { name: 'Montenegro', flag: '🇲🇪' },
  { name: 'Morocco', flag: '🇲🇦' }, { name: 'Mozambique', flag: '🇲🇿' },
  { name: 'Myanmar', flag: '🇲🇲' }, { name: 'Namibia', flag: '🇳🇦' },
  { name: 'Nauru', flag: '🇳🇷' }, { name: 'Nepal', flag: '🇳🇵' },
  { name: 'Netherlands', flag: '🇳🇱' }, { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'Nicaragua', flag: '🇳🇮' }, { name: 'Niger', flag: '🇳🇪' },
  { name: 'Nigeria', flag: '🇳🇬' }, { name: 'North Korea', flag: '🇰🇵' },
  { name: 'North Macedonia', flag: '🇲🇰' }, { name: 'Norway', flag: '🇳🇴' },
  { name: 'Oman', flag: '🇴🇲' }, { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Palau', flag: '🇵🇼' }, { name: 'Panama', flag: '🇵🇦' },
  { name: 'Papua New Guinea', flag: '🇵🇬' }, { name: 'Paraguay', flag: '🇵🇾' },
  { name: 'Peru', flag: '🇵🇪' }, { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Poland', flag: '🇵🇱' }, { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Qatar', flag: '🇶🇦' }, { name: 'Romania', flag: '🇷🇴' },
  { name: 'Russia', flag: '🇷🇺' }, { name: 'Rwanda', flag: '🇷🇼' },
  { name: 'Saint Kitts & Nevis', flag: '🇰🇳' }, { name: 'Saint Lucia', flag: '🇱🇨' },
  { name: 'Saint Vincent', flag: '🇻🇨' }, { name: 'Samoa', flag: '🇼🇸' },
  { name: 'San Marino', flag: '🇸🇲' }, { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'Senegal', flag: '🇸🇳' }, { name: 'Serbia', flag: '🇷🇸' },
  { name: 'Seychelles', flag: '🇸🇨' }, { name: 'Sierra Leone', flag: '🇸🇱' },
  { name: 'Singapore', flag: '🇸🇬' }, { name: 'Slovakia', flag: '🇸🇰' },
  { name: 'Slovenia', flag: '🇸🇮' }, { name: 'Solomon Islands', flag: '🇸🇧' },
  { name: 'Somalia', flag: '🇸🇴' }, { name: 'South Africa', flag: '🇿🇦' },
  { name: 'South Korea', flag: '🇰🇷' }, { name: 'South Sudan', flag: '🇸🇸' },
  { name: 'Spain', flag: '🇪🇸' }, { name: 'Sri Lanka', flag: '🇱🇰' },
  { name: 'Sudan', flag: '🇸🇩' }, { name: 'Suriname', flag: '🇸🇷' },
  { name: 'Sweden', flag: '🇸🇪' }, { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Syria', flag: '🇸🇾' }, { name: 'Taiwan', flag: '🇹🇼' },
  { name: 'Tajikistan', flag: '🇹🇯' }, { name: 'Tanzania', flag: '🇹🇿' },
  { name: 'Thailand', flag: '🇹🇭' }, { name: 'Timor-Leste', flag: '🇹🇱' },
  { name: 'Togo', flag: '🇹🇬' }, { name: 'Tonga', flag: '🇹🇴' },
  { name: 'Trinidad & Tobago', flag: '🇹🇹' }, { name: 'Tunisia', flag: '🇹🇳' },
  { name: 'Turkey', flag: '🇹🇷' }, { name: 'Turkmenistan', flag: '🇹🇲' },
  { name: 'Tuvalu', flag: '🇹🇻' }, { name: 'Uganda', flag: '🇺🇬' },
  { name: 'Ukraine', flag: '🇺🇦' }, { name: 'United Arab Emirates', flag: '🇦🇪' },
  { name: 'United Kingdom', flag: '🇬🇧' }, { name: 'United States', flag: '🇺🇸' },
  { name: 'Uruguay', flag: '🇺🇾' }, { name: 'Uzbekistan', flag: '🇺🇿' },
  { name: 'Vanuatu', flag: '🇻🇺' }, { name: 'Vatican City', flag: '🇻🇦' },
  { name: 'Venezuela', flag: '🇻🇪' }, { name: 'Vietnam', flag: '🇻🇳' },
  { name: 'Yemen', flag: '🇾🇪' }, { name: 'Zambia', flag: '🇿🇲' },
  { name: 'Zimbabwe', flag: '🇿🇼' },
];

// ── SVG illustration functions (called with active: bool) ─────────────────────

const iconSingles = (active) => {
  const c = active ? '#92400e' : '#9ca3af';
  return React.createElement('svg', {
    width: 20, height: 28, viewBox: '0 0 20 28',
    fill: 'none', stroke: c, strokeWidth: '1.5',
    strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    // Card outer outline
    React.createElement('rect', { x: '1.5', y: '1.5', width: '17', height: '25', rx: '2.5' }),
    // Inner container — top half only
    React.createElement('rect', { x: '3.5', y: '3.5', width: '13', height: '11', rx: '1.5', strokeWidth: '1.25' })
  );
};

const iconGraded = (active) => {
  const c         = active ? '#92400e' : '#9ca3af';
  const labelRed  = active ? '#b45309' : '#d1d5db';
  // Slab h=37, card bottom=26.5+1=27.5, so slab top=-9.5
  // Label same width as card (x=1.5, w=17)

  return React.createElement('svg', {
    width: 20, height: 28, viewBox: '0 0 20 28',
    overflow: 'visible',
    fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    // ── Slab outer case (h=39, slightly wider — room to breathe) ────
    React.createElement('rect', { x: '-2', y: '-9.5', width: '24', height: '39', rx: '1.5',
      stroke: c, strokeWidth: '1.75' }),

    // ── Label (same width as card: x=1.5, w=17) ──────────────────────
    // Red/amber outer frame
    React.createElement('rect', { x: '1.5', y: '-8.5', width: '17', height: '8', rx: '1',
      fill: labelRed, stroke: 'none' }),
    // White inner (label text area)
    React.createElement('rect', { x: '2.75', y: '-7.5', width: '14.5', height: '5.5', rx: '0.5',
      fill: '#ffffff', stroke: 'none' }),

    // ── PSA badge tab — removed ──────────────────────────────────────

    // ── Card — matching Singles (outer + inner top-half box) ─────────
    React.createElement('rect', { x: '1.5', y: '1.5', width: '17', height: '25', rx: '2.5',
      stroke: c, strokeWidth: '1.5' }),
    React.createElement('rect', { x: '3.5', y: '3.5', width: '13', height: '11', rx: '1.5',
      stroke: c, strokeWidth: '1.25' })
  );
};

const iconSealed = (active) => {
  const c = active ? '#92400e' : '#9ca3af';
  const fill = active ? '#92400e' : '#d1d5db';
  return React.createElement('svg', {
    width: 28, height: 22, viewBox: '0 0 28 22',
    fill: 'none', stroke: c, strokeWidth: '1.5',
    strokeLinecap: 'round', strokeLinejoin: 'round',
  },
    // Front face of box
    React.createElement('rect', { x: '1.5', y: '5.5', width: '18', height: '15', rx: '1.5' }),
    // Top face (lid)
    React.createElement('path', { d: 'M1.5 5.5 L5.5 1.5 L25 1.5 L25 6.5 L19.5 6.5 L19.5 5.5 Z' }),
    // Right side face
    React.createElement('path', { d: 'M19.5 5.5 L25 1.5 L25 16.5 L19.5 20.5 Z' }),
    // Front lid flap line
    React.createElement('line', { x1: '1.5', y1: '10', x2: '19.5', y2: '10', strokeWidth: '1' }),
    // Front Pokéball
    React.createElement('circle', { cx: '10.5', cy: '15', r: '2.8', strokeWidth: '1.25' }),
    React.createElement('line', { x1: '7.7', y1: '15', x2: '13.3', y2: '15', strokeWidth: '1' }),
    React.createElement('circle', { cx: '10.5', cy: '15', r: '1', fill: c, stroke: 'none' })
  );
};

// ── CreatePrefCard ─────────────────────────────────────────────────────────────
// visual: string (symbol) OR function (active) => ReactElement

const CreatePrefCard = ({ label, visual, active, onClick }) =>
  React.createElement('button', {
    type: 'button', onClick,
    style: {
      width: 72, height: 92, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 7,
      borderRadius: 8, cursor: 'pointer', padding: '0 6px',
      border: `2px solid ${active ? 'var(--color-yellow-dark)' : 'var(--color-gray-200)'}`,
      background: active ? 'var(--color-yellow-light)' : 'var(--color-gray-100)',
      transition: 'all 150ms ease', flexShrink: 0,
    }
  },
    typeof visual === 'string'
      ? React.createElement('span', {
          style: { fontSize: 20, lineHeight: 1, color: active ? '#92400e' : '#9ca3af' }
        }, visual)
      : visual(active),
    React.createElement('span', {
      style: { fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.3,
        color: active ? '#92400e' : '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.05em' }
    }, label)
  );

// ── CreateThumbContainer ───────────────────────────────────────────────────────

const CreateThumbContainer = ({ images, onRemove, emptyMsg }) =>
  React.createElement('div', {
    style: {
      flex: 1,
      border: `1.5px ${images.length ? 'solid var(--color-gray-200)' : 'dashed var(--color-gray-300)'}`,
      borderRadius: 8, background: '#fff',
      display: 'flex', flexWrap: 'wrap', gap: 6,
      alignContent: 'flex-start',
      alignItems: images.length ? 'flex-start' : 'center',
      justifyContent: images.length ? 'flex-start' : 'center',
      padding: images.length ? 8 : 12,
      minHeight: 100,
    }
  },
    images.length
      ? images.map((card, i) =>
          React.createElement('div', {
            key: `${card.localId || ''}${i}`,
            style: { position: 'relative', width: 72, flexShrink: 0 }
          },
            React.createElement('img', {
              src: card.img, alt: card.name || '',
              style: { width: '100%', borderRadius: 5, display: 'block', border: '1px solid var(--color-gray-200)' },
              onError: e => { e.target.style.display = 'none'; }
            }),
            React.createElement('button', {
              type: 'button', onClick: () => onRemove(i),
              style: { position: 'absolute', top: -4, right: -4, width: 17, height: 17,
                borderRadius: 9, background: '#dc2626', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: 0 }
            }, '×')
          )
        )
      : React.createElement('span', {
          style: { fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }
        }, emptyMsg)
  );

// ── MktCreate ─────────────────────────────────────────────────────────────────

const MktCreate = ({ setPage }) => {
  const [country,     setCountry]     = React.useState(null);
  const [countryQuery, setCountryQuery] = React.useState('');
  const [countryOpen,  setCountryOpen]  = React.useState(false);
  const [havesText, setHavesText] = React.useState('');
  const [wantsText, setWantsText] = React.useState('');
  const [haveImages, setHaveImages] = React.useState([]);
  const [havesCash,  setHavesCash]  = React.useState(false);
  const [wantImages, setWantImages] = React.useState([]);
  const [wPrefs, setWPrefs] = React.useState({
    cash: false, singles: false, graded: false, sealed: false,
  });
  const [description, setDescription] = React.useState('');
  const [submitted,   setSubmitted]   = React.useState(false);

  const toggleW = (k) => setWPrefs(p => ({ ...p, [k]: !p[k] }));

  // Responsive
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const TITLE_LIMIT = 40;
  const DESC_LIMIT  = 300;

  const inputStyle = {
    padding: '8px 12px', border: '1px solid var(--color-gray-300)',
    borderRadius: 'var(--border-radius)', fontSize: 14, fontFamily: 'var(--font-sans)',
    color: 'var(--color-gray-900)', outline: 'none', boxSizing: 'border-box',
  };
  const cardStyle = {
    background: '#fff', borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--color-gray-200)', overflow: 'hidden',
  };
  const badgeStyle = {
    padding: '8px 12px', background: 'var(--color-gray-100)',
    borderRight: '1px solid var(--color-gray-300)', fontSize: 13,
    fontWeight: 700, color: 'var(--color-gray-700)', whiteSpace: 'nowrap', flexShrink: 0,
  };

  const SectionHead = ({ n, title, note, flag }) =>
    React.createElement('div', {
      style: { padding: '13px 20px', borderBottom: '1px solid var(--color-gray-200)',
        display: 'flex', alignItems: 'center', gap: 10 }
    },
      React.createElement('span', {
        style: { minWidth: 24, height: 20, borderRadius: 3, background: 'var(--color-black)',
          color: '#fff', fontSize: 10, fontWeight: 800, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          letterSpacing: '0.05em', padding: '0 6px', fontFamily: 'var(--font-mono, monospace)' }
      }, n),
      React.createElement('span', { style: { fontSize: 14, fontWeight: 700, color: 'var(--color-gray-900)', flex: 1 } }, title),
      flag && React.createElement('span', { style: { fontSize: 22, lineHeight: 1 } }, flag),
      note && React.createElement('span', { style: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' } }, note)
    );

  const CharCount = ({ val, max }) =>
    React.createElement('div', {
      style: { textAlign: 'right', fontSize: 11, marginTop: 3,
        color: val >= max ? '#dc2626' : '#9ca3af' }
    }, `${val}/${max}`);

  if (submitted) {
    return React.createElement('div', {
      style: { minHeight: '100vh', background: 'var(--color-off-white)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }
    },
      React.createElement('div', { style: { textAlign: 'center', padding: 40 } },
        React.createElement('div', { style: { fontSize: 48, marginBottom: 16 } }, '✓'),
        React.createElement('h2', { style: { fontWeight: 700, marginBottom: 8 } }, 'Listing created!'),
        React.createElement('p', { style: { color: 'var(--color-gray-500)', marginBottom: 24 } },
          'Your listing is now live on the marketplace.'),
        React.createElement('button', { onClick: () => setPage('browse'),
          style: { padding: '10px 24px', background: 'var(--color-yellow)', color: '#1a1a1a',
            fontWeight: 700, border: 'none', borderRadius: 'var(--border-radius)', cursor: 'pointer', fontSize: 14 }
        }, 'Back to Marketplace')
      )
    );
  }

  return React.createElement('div', {
    style: { background: 'var(--color-off-white)', minHeight: '100vh', padding: '32px 24px' }
  },
    React.createElement('div', { style: { maxWidth: 720, margin: '0 auto' } },

      React.createElement('a', {
        href: '#', onClick: e => { e.preventDefault(); setPage('browse'); },
        style: { display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-gray-700)',
          fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }
      },
        React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
          stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
          React.createElement('path', { d: 'M19 12H5M12 19l-7-7 7-7' })
        ),
        'Back to Marketplace'
      ),
      React.createElement('h1', { style: { fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0 0 4px' } },
        'Post a listing'),
      React.createElement('p', { style: { fontSize: 14, color: 'var(--color-gray-500)', margin: '0 0 20px' } },
        'Post a trade listing for Pokémon TCG items'),

      React.createElement('form', {
        onSubmit: e => { e.preventDefault(); setSubmitted(true); },
        style: { display: 'flex', flexDirection: 'column', gap: 12 }
      },

        // ── SECTION 1: COUNTRY ─────────────────────────────────────────────────
        React.createElement('div', { style: cardStyle },
          React.createElement(SectionHead, { n: '1', title: 'Country', flag: country ? country.flag : null }),
          React.createElement('div', { style: { padding: 20 } },
            // Search input
            React.createElement('div', { style: { position: 'relative', marginBottom: 8 } },
              React.createElement('input', {
                type: 'text',
                placeholder: 'Search country...',
                value: countryQuery,
                onFocus: () => setCountryOpen(true),
                onChange: e => { setCountryQuery(e.target.value); setCountryOpen(true); setCountry(null); },
                style: { ...inputStyle, width: '100%', paddingLeft: country ? 36 : 12, boxSizing: 'border-box' },
              }),
              country && !countryOpen && React.createElement('span', {
                style: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 18, lineHeight: 1, pointerEvents: 'none' }
              }, country.flag)
            ),
            // Dropdown list
            countryOpen && React.createElement('div', {
              style: { border: '1px solid var(--color-gray-200)', borderRadius: 'var(--border-radius)',
                maxHeight: 114, overflowY: 'auto', background: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
            },
              (() => {
                const q = countryQuery.toLowerCase().trim();
                const results = q
                  ? COUNTRIES.filter(c => c.name.toLowerCase().includes(q))
                  : COUNTRIES;
                return results.length === 0
                  ? React.createElement('div', {
                      style: { padding: '12px 16px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }
                    }, 'No countries found')
                  : results.map((c, i) => React.createElement('button', {
                      key: c.name, type: 'button',
                      onClick: () => {
                        setCountry(c);
                        setCountryQuery(c.name);
                        setCountryOpen(false);
                      },
                      style: {
                        width: '100%', padding: '9px 14px', border: 'none',
                        background: country && country.name === c.name ? 'var(--color-yellow-light)' : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        fontSize: 13, fontWeight: country && country.name === c.name ? 700 : 400,
                        color: 'var(--color-gray-900)', textAlign: 'left',
                        borderBottom: i < results.length - 1 ? '1px solid var(--color-gray-100)' : 'none',
                      }
                    },
                      React.createElement('span', { style: { fontSize: 20, lineHeight: 1, flexShrink: 0 } }, c.flag),
                      c.name
                    ))
                ;
              })()
            ),
            !country && !countryOpen && React.createElement('p', {
              style: { fontSize: 11, color: '#9ca3af', margin: '6px 0 0', textAlign: 'right' }
            }, 'Required')
          )
        ),

        // ── SECTION 2: TITLE ───────────────────────────────────────────────────
        React.createElement('div', { style: cardStyle },
          React.createElement(SectionHead, { n: '2', title: 'Title' }),
          React.createElement('div', { style: { padding: 20 } },
            // Live preview (monospace one-liner on desktop, two lines on mobile)
            React.createElement('div', {
              style: { padding: '8px 12px', background: 'var(--color-gray-100)',
                border: '1px solid var(--color-gray-200)', borderRadius: 'var(--border-radius)',
                fontSize: 13, color: 'var(--color-gray-700)', fontFamily: 'monospace',
                marginBottom: 12,
                ...(isMobile
                  ? { display: 'flex', flexDirection: 'column', gap: 4, wordBreak: 'break-all' }
                  : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })
              }
            },
              isMobile
                ? [
                    React.createElement('span', { key: 'h' }, `[H] ${havesText || '...'}`),
                    React.createElement('span', { key: 'w' }, `[W] ${wantsText || '...'}`)
                  ]
                : `[H] ${havesText || '...'} [W] ${wantsText || '...'}`
            ),

            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              // [H]
              React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', border: '1px solid var(--color-gray-300)', borderRadius: 'var(--border-radius)', overflow: 'hidden' } },
                  React.createElement('span', { style: badgeStyle }, '[H]'),
                  React.createElement('input', { type: 'text', value: havesText, maxLength: TITLE_LIMIT,
                    onChange: e => setHavesText(e.target.value),
                    placeholder: 'What you have — e.g. Charizard ex PSA 10',
                    style: { ...inputStyle, border: 'none', borderRadius: 0, flex: 1, width: 'auto' } })
                ),
                React.createElement(CharCount, { val: havesText.length, max: TITLE_LIMIT })
              ),
              // [W]
              React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', border: '1px solid var(--color-gray-300)', borderRadius: 'var(--border-radius)', overflow: 'hidden' } },
                  React.createElement('span', { style: badgeStyle }, '[W]'),
                  React.createElement('input', { type: 'text', value: wantsText, maxLength: TITLE_LIMIT,
                    onChange: e => setWantsText(e.target.value),
                    placeholder: 'What you want — e.g. Cash or Mewtwo GX',
                    style: { ...inputStyle, border: 'none', borderRadius: 0, flex: 1, width: 'auto' } })
                ),
                React.createElement(CharCount, { val: wantsText.length, max: TITLE_LIMIT })
              )
            )
          )
        ),

        // ── SECTION 3: HAVES ───────────────────────────────────────────────────
        React.createElement('div', { style: cardStyle },
          React.createElement(SectionHead, { n: '3', title: 'Haves', note: "What you're offering" }),
          React.createElement('div', { style: { padding: 20 } },
            isMobile
              // Mobile: thumbnail full-width → offers row → card filter
              ? React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 } },
                  React.createElement(CreateThumbContainer, {
                    images: haveImages,
                    onRemove: i => setHaveImages(imgs => imgs.filter((_, j) => j !== i)),
                    emptyMsg: 'Browse cards below to add images',
                  }),
                  React.createElement('div', { style: { display: 'flex', gap: 6 } },
                    React.createElement(CreatePrefCard, { label: 'Cash', visual: '$', active: havesCash, onClick: () => setHavesCash(!havesCash) })
                  )
                )
              // Desktop: thumbnail + cash side by side
              : React.createElement('div', { style: { display: 'flex', gap: 10, marginBottom: 14, alignItems: 'stretch' } },
                  React.createElement(CreateThumbContainer, {
                    images: haveImages,
                    onRemove: i => setHaveImages(imgs => imgs.filter((_, j) => j !== i)),
                    emptyMsg: 'Browse cards below to add images',
                  }),
                  React.createElement(CreatePrefCard, { label: 'Cash', visual: '$', active: havesCash, onClick: () => setHavesCash(!havesCash) })
                ),
            window.CardPicker
              ? React.createElement(window.CardPicker, { onSelectCard: card => setHaveImages(imgs => [...imgs, card]) })
              : null
          )
        ),

        // ── SECTION 4: WANTS ───────────────────────────────────────────────────
        React.createElement('div', { style: cardStyle },
          React.createElement(SectionHead, { n: '4', title: 'Wants', note: "What you're looking for" }),
          React.createElement('div', { style: { padding: 20 } },
            isMobile
              // Mobile: thumbnail full-width → 5 pref cards row → card filter
              ? React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 } },
                  React.createElement(CreateThumbContainer, {
                    images: wantImages,
                    onRemove: i => setWantImages(imgs => imgs.filter((_, j) => j !== i)),
                    emptyMsg: 'Browse cards below to add images',
                  }),
                                React.createElement('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                    React.createElement(CreatePrefCard, { label: 'Cash',    visual: '$',         active: wPrefs.cash,    onClick: () => toggleW('cash') }),
                    React.createElement(CreatePrefCard, { label: 'Singles', visual: iconSingles,  active: wPrefs.singles, onClick: () => toggleW('singles') }),
                    React.createElement(CreatePrefCard, { label: 'Graded',  visual: iconGraded,   active: wPrefs.graded,  onClick: () => toggleW('graded') }),
                    React.createElement(CreatePrefCard, { label: 'Sealed',  visual: iconSealed,   active: wPrefs.sealed,  onClick: () => toggleW('sealed') })
                  )
                )
              // Desktop: thumbnail + 5 pref cards side by side
              : React.createElement('div', { style: { display: 'flex', gap: 10, marginBottom: 14, alignItems: 'stretch' } },
                  React.createElement(CreateThumbContainer, {
                    images: wantImages,
                    onRemove: i => setWantImages(imgs => imgs.filter((_, j) => j !== i)),
                    emptyMsg: 'Browse cards below to add images',
                  }),
                                React.createElement('div', { style: { display: 'flex', flexDirection: 'row', gap: 6, flexShrink: 0 } },
                    React.createElement(CreatePrefCard, { label: 'Cash',    visual: '$',         active: wPrefs.cash,    onClick: () => toggleW('cash') }),
                    React.createElement(CreatePrefCard, { label: 'Singles', visual: iconSingles,  active: wPrefs.singles, onClick: () => toggleW('singles') }),
                    React.createElement(CreatePrefCard, { label: 'Graded',  visual: iconGraded,   active: wPrefs.graded,  onClick: () => toggleW('graded') }),
                    React.createElement(CreatePrefCard, { label: 'Sealed',  visual: iconSealed,   active: wPrefs.sealed,  onClick: () => toggleW('sealed') })
                  )
                ),
            window.CardPicker
              ? React.createElement(window.CardPicker, { onSelectCard: card => setWantImages(imgs => [...imgs, card]) })
              : null
          )
        ),

        // ── SECTION 5: DESCRIPTION ─────────────────────────────────────────────
        React.createElement('div', { style: cardStyle },
          React.createElement(SectionHead, { n: '5', title: 'Description', note: 'optional' }),
          React.createElement('div', { style: { padding: 20 } },
            React.createElement('textarea', {
              value: description,
              onChange: e => setDescription(e.target.value),
              placeholder: 'Condition details, card language, shipping info...',
              rows: 4, maxLength: DESC_LIMIT,
              style: { ...inputStyle, width: '100%', resize: 'none', lineHeight: 1.6, display: 'block' }
            }),
            React.createElement('div', {
              style: { textAlign: 'right', fontSize: 11, marginTop: 4,
                color: description.length >= DESC_LIMIT ? '#dc2626' : '#9ca3af' }
            }, `${description.length}/${DESC_LIMIT}`)
          )
        ),

        // ── Submit ────────────────────────────────────────────────────────────
        React.createElement('button', {
          type: 'submit',
          style: { padding: '13px 24px', background: 'var(--color-yellow)', color: '#1a1a1a',
            fontWeight: 700, fontSize: 'var(--font-size-base)', border: 'none',
            borderRadius: 'var(--border-radius)', cursor: 'pointer', width: '100%', marginTop: 4 }
        }, 'Create Listing')
      )
    )
  );
};
window.MktCreate = MktCreate;
