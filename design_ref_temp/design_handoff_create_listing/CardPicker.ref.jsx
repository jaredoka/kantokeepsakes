// CardPicker.jsx — Card search panel for Create Listing
// Fetches from TCGDex API. Used on [H] and [W] fields so users can attach card thumbnails.

const CardPicker = ({ onSelectCard, defaultLang }) => {
  const [lang,      setLang]      = React.useState(defaultLang || 'en');
  const [search,    setSearch]    = React.useState('');
  const [era,       setEra]       = React.useState('');
  const [filterSet, setFilterSet] = React.useState('');
  const [cardType,  setCardType]  = React.useState('all');
  const [cards,     setCards]     = React.useState([]);
  const [loading,   setLoading]   = React.useState(false);
  const [serieId,   setSerieId]   = React.useState('');
  const [fetchErr,  setFetchErr]  = React.useState(false);

  const currentEra = (window.ERA_DATA || []).find(e => e.id === era);
  const sets = currentEra ? currentEra.sets : [];
  const lbl = (item) => item && (lang === 'ja' && item.ja ? item.ja : item.en) || '';

  // Fetch from TCGDex when set or language changes
  React.useEffect(() => {
    if (!filterSet) { setCards([]); setSerieId(''); setFetchErr(false); return; }
    setLoading(true); setCards([]); setFetchErr(false);
    const apiLang = lang === 'ja' ? 'ja' : 'en';
    fetch(`https://api.tcgdex.net/v2/${apiLang}/sets/${filterSet}`)
      .then(r => { if (!r.ok) throw new Error('404'); return r.json(); })
      .then(data => {
        setSerieId((data.serie && data.serie.id) || '');
        setCards(data.cards || []);
        setLoading(false);
      })
      .catch(() => { setFetchErr(true); setLoading(false); });
  }, [filterSet, lang]);

  const imgUrl = (card) => {
    if (!serieId) return '';
    const l = lang === 'ja' ? 'ja' : 'en';
    return `https://assets.tcgdex.net/${l}/${serieId}/${filterSet}/${card.localId}/high.webp`;
  };

  const filtered = React.useMemo(() => {
    let list = [...cards];
    if (cardType === 'card')  list = list.filter(c => /^\d/.test(String(c.localId)));
    if (cardType === 'promo') list = list.filter(c => /^[A-Za-z]/.test(String(c.localId)));
    if (search.trim()) {
      const terms = window.expandQuery ? window.expandQuery(search) : [search.toLowerCase()];
      list = list.filter(c => terms.some(t => (c.name || '').toLowerCase().includes(t)));
    }
    return list;
  }, [cards, search, cardType]);

  const sel = {
    padding: '6px 8px', fontSize: 12, border: '1px solid var(--color-gray-300)',
    borderRadius: 'var(--border-radius)', background: '#fff', color: 'var(--color-gray-900)',
    outline: 'none', fontFamily: 'var(--font-sans)', cursor: 'pointer',
  };

  const pill = (active) => ({
    padding: '5px 10px', borderRadius: 'var(--border-radius-pill)', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: `1px solid ${active ? 'var(--color-black)' : 'var(--color-gray-300)'}`,
    background: active ? 'var(--color-black)' : 'transparent',
    color: active ? '#fff' : 'var(--color-gray-700)', whiteSpace: 'nowrap',
  });

  return React.createElement('div', {
    style: { border: '1px solid var(--color-yellow)', borderRadius: 'var(--border-radius-lg)',
      background: '#fffef7', overflow: 'hidden' }
  },
    // ── Filter bar ────────────────────────────────────────────────────
    React.createElement('div', {
      style: { padding: '10px 12px', background: '#fffdf0',
        borderBottom: '1px solid var(--color-yellow-light)',
        display: 'flex', flexDirection: 'column', gap: 8 }
    },
      // Row 1: lang + search
      React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
        // EN / JP toggle
        React.createElement('div', {
          style: { display: 'flex', background: 'var(--color-gray-100)', borderRadius: 6, padding: 2, gap: 2, flexShrink: 0 }
        },
          [{ id: 'en', label: 'EN' }, { id: 'ja', label: 'JP' }].map(({ id, label }) =>
            React.createElement('button', {
              key: id, type: 'button',
              onClick: () => { setLang(id); setFilterSet(''); setCards([]); },
              style: { padding: '4px 10px', borderRadius: 4, border: 'none', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', transition: 'all 100ms',
                background: lang === id ? '#fff' : 'transparent',
                color: lang === id ? 'var(--color-black)' : 'var(--color-gray-500)',
                boxShadow: lang === id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }
            }, label)
          )
        ),
        // Search
        React.createElement('input', {
          type: 'text', placeholder: 'Search card name...', value: search,
          onChange: e => setSearch(e.target.value),
          style: { ...sel, flex: 1 }
        })
      ),
      // Row 2: era, set, card type
      React.createElement('div', { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' } },
        React.createElement('select', {
          value: era,
          onChange: e => { setEra(e.target.value); setFilterSet(''); setCards([]); },
          style: { ...sel, flex: '1 1 110px', minWidth: 90 }
        },
          React.createElement('option', { value: '' }, 'All Eras'),
          (window.ERA_DATA || []).map(e => React.createElement('option', { key: e.id, value: e.id }, lbl(e)))
        ),
        React.createElement('select', {
          value: filterSet,
          onChange: e => setFilterSet(e.target.value),
          disabled: !era,
          style: { ...sel, flex: '1 1 140px', minWidth: 110, opacity: era ? 1 : 0.5, cursor: era ? 'pointer' : 'not-allowed' }
        },
          React.createElement('option', { value: '' }, era ? 'All Sets' : '— Pick era first —'),
          sets.map(s => React.createElement('option', { key: s.id, value: s.id }, lbl(s)))
        ),
        React.createElement('div', { style: { display: 'flex', gap: 4, flexShrink: 0 } },
          [{ id: 'all', label: 'All' }, { id: 'card', label: 'Cards' }, { id: 'promo', label: 'Promos' }].map(
            ({ id, label }) => React.createElement('button', {
              key: id, type: 'button', onClick: () => setCardType(id), style: pill(cardType === id)
            }, label)
          )
        )
      )
    ),

    // ── Card grid ─────────────────────────────────────────────────────
    React.createElement('div', {
      style: { padding: 10, maxHeight: 230, overflowY: 'auto',
        display: 'flex', gap: 4, flexWrap: 'wrap', alignContent: 'flex-start', minHeight: 80 }
    },
      !filterSet
        ? React.createElement('p', { style: { fontSize: 12, color: '#9ca3af', width: '100%', textAlign: 'center', padding: '24px 0', margin: 0 } },
            'Select an era and set to browse cards')
        : loading
          ? React.createElement('p', { style: { fontSize: 12, color: '#9ca3af', margin: 'auto', padding: '24px 0' } }, 'Loading...')
          : fetchErr
            ? React.createElement('p', { style: { fontSize: 12, color: '#9ca3af', width: '100%', textAlign: 'center', padding: '24px 0', margin: 0 } },
                'Card data unavailable for this set.')
            : filtered.length === 0
              ? React.createElement('p', { style: { fontSize: 12, color: '#9ca3af', margin: 'auto', padding: '24px 0' } }, 'No cards found')
              : filtered.map(card =>
                  React.createElement('div', {
                    key: card.id || card.localId,
                    title: card.name,
                    onClick: () => onSelectCard({ ...card, img: imgUrl(card), set: filterSet, lang }),
                    style: { width: 54, cursor: 'pointer', borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                      border: '2px solid transparent', transition: 'border-color 100ms, transform 100ms' },
                    onMouseOver: e => { e.currentTarget.style.borderColor = 'var(--color-yellow)'; e.currentTarget.style.transform = 'scale(1.08)'; },
                    onMouseOut:  e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }
                  },
                    React.createElement('img', {
                      src: imgUrl(card), alt: card.name || card.localId,
                      style: { width: '100%', display: 'block' },
                      onError: e => { e.target.parentElement.style.display = 'none'; }
                    })
                  )
                )
    )
  );
};
window.CardPicker = CardPicker;
