// ─── Era & Set Taxonomy (EN + JA) ────────────────────────────────────────────
const ERA_DATA = [
  {
    id: 'scarlet-violet', en: 'Scarlet & Violet', ja: 'スカーレット＆バイオレット',
    sets: [
      { id: 'sv1',    en: 'Scarlet & Violet Base Set',  ja: 'スカーレットex / バイオレットex' },
      { id: 'sv2',    en: 'Paldea Evolved',             ja: 'クレイバースト'                  },
      { id: 'sv3',    en: 'Obsidian Flames',            ja: 'レイジングサーフ'                },
      { id: 'sv3pt5', en: 'Pokémon 151',                ja: 'ポケモンカード151'               },
      { id: 'sv4',    en: 'Paradox Rift',               ja: 'エイシャントロアー / フューチャーフラッシュ' },
      { id: 'sv4pt5', en: 'Paldean Fates',              ja: 'シャイニートレジャーex'          },
      { id: 'sv5',    en: 'Temporal Forces',            ja: 'ワイルドフォース / サイバージャッジ' },
      { id: 'sv6',    en: 'Twilight Masquerade',        ja: 'マスクオブチェンジ'              },
      { id: 'sv7',    en: 'Stellar Crown',              ja: 'ステラミラクル'                  },
      { id: 'sv8',    en: 'Surging Sparks',             ja: '超電ブレイカー'                  },
      { id: 'sv8pt5', en: 'Prismatic Evolutions',       ja: 'テラスタルフェスex'              },
      { id: 'sv9',    en: 'Destined Rivals',            ja: 'バトルパートナーズ'              },
      { id: 'sv10',   en: 'Journey Together',           ja: 'ジャーニートゥゲザー'            },
    ]
  },
  {
    id: 'sword-shield', en: 'Sword & Shield', ja: 'ソード＆シールド',
    sets: [
      { id: 'swsh1',    en: 'Sword & Shield Base', ja: 'スターターセットV'                    },
      { id: 'swsh2',    en: 'Rebel Clash',          ja: 'ムゲンゾーン'                        },
      { id: 'swsh3',    en: 'Darkness Ablaze',      ja: 'ムゲンゾーン'                        },
      { id: 'swsh35',   en: "Champion's Path",      ja: 'チャンピオンズパス'                  },
      { id: 'swsh4',    en: 'Vivid Voltage',        ja: '超電ブレイカー'                      },
      { id: 'swsh5',    en: 'Battle Styles',        ja: 'バトルスタイル'                      },
      { id: 'swsh6',    en: 'Chilling Reign',       ja: 'ジュージュースティール'              },
      { id: 'swsh7',    en: 'Evolving Skies',       ja: 'イーブイヒーローズ'                  },
      { id: 'swsh75',   en: 'Celebrations',         ja: '25周年記念'                          },
      { id: 'swsh8',    en: 'Fusion Strike',        ja: 'フュージョンアーツ'                  },
      { id: 'swsh9',    en: 'Brilliant Stars',      ja: 'スターバース'                        },
      { id: 'swsh10',   en: 'Astral Radiance',      ja: 'タイムゲイザー / スペースジャグラー' },
      { id: 'swsh11',   en: 'Pokémon GO',           ja: 'ポケモンGO'                          },
      { id: 'swsh12',   en: 'Lost Origin',          ja: 'ロストアビス'                        },
      { id: 'swsh12pt5',en: 'Silver Tempest',       ja: 'バトルリージョン'                    },
      { id: 'swsh125',  en: 'Crown Zenith',         ja: 'VSTARユニバース'                     },
    ]
  },
  {
    id: 'sun-moon', en: 'Sun & Moon', ja: 'サン＆ムーン',
    sets: [
      { id: 'sm1',   en: 'Sun & Moon Base',  ja: 'コレクションサン / コレクションムーン' },
      { id: 'sm2',   en: 'Guardians Rising', ja: 'アローラの月光'                       },
      { id: 'sm3',   en: 'Burning Shadows',  ja: 'ひかる伝説'                           },
      { id: 'sm35',  en: 'Shining Legends',  ja: 'シャイニングレジェンド'               },
      { id: 'sm4',   en: 'Crimson Invasion', ja: 'ウルトラサン / ウルトラムーン'        },
      { id: 'sm5',   en: 'Ultra Prism',      ja: 'ウルトラフォース'                     },
      { id: 'sm6',   en: 'Forbidden Light',  ja: '禁断の光'                             },
      { id: 'sm7',   en: 'Celestial Storm',  ja: 'ドラゴンストーム'                     },
      { id: 'sm75',  en: 'Dragon Majesty',   ja: 'ドラゴンマジェスティ'                },
      { id: 'sm8',   en: 'Lost Thunder',     ja: 'ロストサンダー'                       },
      { id: 'sm9',   en: 'Team Up',          ja: 'タッグボルト'                         },
      { id: 'sm10',  en: 'Unbroken Bonds',   ja: 'ダブルブレイズ'                       },
      { id: 'sm11',  en: 'Unified Minds',    ja: 'オルタージェネシス'                   },
      { id: 'sm115', en: 'Hidden Fates',     ja: 'ヒドゥンフェイツ'                     },
      { id: 'sm12',  en: 'Cosmic Eclipse',   ja: '夢を超えた戦い'                       },
    ]
  },
  {
    id: 'xy', en: 'XY', ja: 'XY',
    sets: [
      { id: 'xy1',  en: 'XY Base',         ja: 'コレクションX / コレクションY'      },
      { id: 'xy2',  en: 'Flashfire',       ja: 'ライジングフィスト'                  },
      { id: 'xy3',  en: 'Furious Fists',   ja: 'レイジングナックル'                  },
      { id: 'xy4',  en: 'Phantom Forces',  ja: 'ファントムゲート'                    },
      { id: 'xy5',  en: 'Primal Clash',    ja: 'グラードンex / カイオーガex'         },
      { id: 'xy6',  en: 'Roaring Skies',   ja: 'ダークオーダー'                      },
      { id: 'xy7',  en: 'Ancient Origins', ja: 'ガイアボルケーノ / タイダルストーム' },
      { id: 'xy8',  en: 'BREAKthrough',    ja: 'ブルーショック / レッドフラッシュ'   },
      { id: 'xy9',  en: 'BREAKpoint',      ja: 'ニンフィアEX'                        },
      { id: 'xy10', en: 'Generations',     ja: null                                  },
      { id: 'xy11', en: 'Fates Collide',   ja: 'レックウザEX'                        },
      { id: 'xy12', en: 'Steam Siege',     ja: 'ドラゴンストーム'                    },
      { id: 'xy13', en: 'Evolutions',      ja: 'BREAK進化BOX'                        },
    ]
  },
  {
    id: 'black-white', en: 'Black & White', ja: 'ブラック＆ホワイト',
    sets: [
      { id: 'bw1',  en: 'Black & White Base', ja: 'ブラックコレクション / ホワイトコレクション' },
      { id: 'bw2',  en: 'Emerging Powers',    ja: 'レッドコレクション'                         },
      { id: 'bw3',  en: 'Noble Victories',    ja: 'ヘイルブリザード'                           },
      { id: 'bw4',  en: 'Next Destinies',     ja: 'コールドフレア / フリーズボルト'            },
      { id: 'bw5',  en: 'Dark Explorers',     ja: 'ダークラッシュ'                             },
      { id: 'bw6',  en: 'Dragons Exalted',    ja: 'ドラゴンブレード / ドラゴンブラスト'        },
      { id: 'bw7',  en: 'Boundaries Crossed', ja: 'フロストレイ / サンダーナックル'            },
      { id: 'bw8',  en: 'Plasma Storm',       ja: 'プラズマゲイル'                             },
      { id: 'bw9',  en: 'Plasma Freeze',      ja: 'ライデンナックル'                           },
      { id: 'bw10', en: 'Plasma Blast',       ja: 'メガロキャノン'                             },
      { id: 'bw11', en: 'Legendary Treasures',ja: 'EXバトルブースト'                           },
    ]
  },
  {
    id: 'heartgold-soulsilver', en: 'HeartGold & SoulSilver', ja: 'ハートゴールド＆ソウルシルバー',
    sets: [
      { id: 'hgss1', en: 'HeartGold & SoulSilver Base', ja: 'ハートゴールドコレクション / ソウルシルバーコレクション' },
      { id: 'hgss2', en: 'Unleashed',                   ja: 'ハートゴールドコレクション'  },
      { id: 'hgss3', en: 'Undaunted',                   ja: 'ソウルシルバーコレクション'  },
      { id: 'hgss4', en: 'Triumphant',                  ja: 'ポケモンカードゲームHGSS'    },
      { id: 'col1',  en: 'Call of Legends',             ja: null                          },
    ]
  },
  {
    id: 'diamond-pearl', en: 'Diamond & Pearl', ja: 'ダイヤモンド＆パール',
    sets: [
      { id: 'dp1', en: 'Diamond & Pearl Base', ja: 'ダイヤモンドコレクション / パールコレクション' },
      { id: 'dp2', en: 'Mysterious Treasures', ja: 'モンスターコレクション'                        },
      { id: 'dp3', en: 'Secret Wonders',       ja: 'ひかる闇'                                     },
      { id: 'dp4', en: 'Great Encounters',     ja: 'ときめきのプリズム'                            },
      { id: 'dp5', en: 'Majestic Dawn',        ja: '夜明けのダッシュ'                              },
      { id: 'dp6', en: 'Legends Awakened',     ja: 'ポケモンカードゲームDP'                        },
      { id: 'dp7', en: 'Stormfront',           ja: 'ギガスバースト'                                },
      { id: 'pl1', en: 'Platinum Base',        ja: 'ポケモンカードゲームPt'                        },
      { id: 'pl2', en: 'Rising Rivals',        ja: 'ギガスバースト'                                },
      { id: 'pl3', en: 'Supreme Victors',      ja: 'アルセウス'                                    },
      { id: 'pl4', en: 'Arceus',               ja: 'ポケモンカードゲームPt アルセウス'             },
    ]
  },
  {
    id: 'ex-series', en: 'EX Series', ja: 'e-カード / ADV',
    sets: [
      { id: 'ex1',  en: 'Ruby & Sapphire',     ja: 'ADV 拡張パック'   },
      { id: 'ex2',  en: 'Sandstorm',           ja: 'ADV 拡張パック 2' },
      { id: 'ex3',  en: 'Dragon',              ja: 'ADV 拡張パック 3' },
      { id: 'ex4',  en: 'Team Magma vs Aqua',  ja: 'ADV 拡張パック 4' },
      { id: 'ex5',  en: 'Hidden Legends',      ja: 'ADV 拡張パック 5' },
      { id: 'ex6',  en: 'FireRed & LeafGreen', ja: 'PCG 拡張パック'   },
      { id: 'ex7',  en: 'Team Rocket Returns', ja: 'PCG 拡張パック 2' },
      { id: 'ex8',  en: 'Deoxys',              ja: 'PCG 拡張パック 3' },
      { id: 'ex9',  en: 'Emerald',             ja: 'PCG 拡張パック 4' },
      { id: 'ex10', en: 'Unseen Forces',       ja: 'PCG 拡張パック 5' },
      { id: 'ex11', en: 'Delta Species',       ja: 'PCG 拡張パック 6' },
      { id: 'ex12', en: 'Legend Maker',        ja: 'PCG 拡張パック 7' },
      { id: 'ex13', en: 'Holon Phantoms',      ja: 'PCG 拡張パック 8' },
      { id: 'ex14', en: 'Crystal Guardians',   ja: 'PCG 拡張パック 9' },
      { id: 'ex15', en: 'Dragon Frontiers',    ja: 'PCG 拡張パック 10'},
      { id: 'ex16', en: 'Power Keepers',       ja: 'PCG 拡張パック 11'},
    ]
  },
  {
    id: 'neo', en: 'Neo / e-Card', ja: 'ネオ・eシリーズ',
    sets: [
      { id: 'neo1',   en: 'Neo Genesis',    ja: 'ネオジェネシス'      },
      { id: 'neo2',   en: 'Neo Discovery',  ja: 'ネオディスカバリー'  },
      { id: 'neo3',   en: 'Neo Revelation', ja: 'ネオ・レベレーション'},
      { id: 'neo4',   en: 'Neo Destiny',    ja: 'ネオ・デスティニー'  },
      { id: 'ecard1', en: 'Expedition',     ja: 'e-カード第1弾'       },
      { id: 'ecard2', en: 'Aquapolis',      ja: 'e-カード第2弾'       },
      { id: 'ecard3', en: 'Skyridge',       ja: 'e-カード第3弾'       },
    ]
  },
  {
    id: 'original', en: 'Original (Wizards)', ja: 'オリジナル (旧裏)',
    sets: [
      { id: 'base1',  en: 'Base Set',             ja: '拡張パック'      },
      { id: 'jungle', en: 'Jungle',               ja: 'ジャングル'      },
      { id: 'fossil', en: 'Fossil',               ja: '化石の秘密'      },
      { id: 'base2',  en: 'Base Set 2',           ja: null              },
      { id: 'rocket', en: 'Team Rocket',          ja: 'ロケット団'      },
      { id: 'gym1',   en: 'Gym Heroes',           ja: 'ジムリーダーの城'},
      { id: 'gym2',   en: 'Gym Challenge',        ja: 'ジムバッジ'      },
      { id: 'lc',     en: 'Legendary Collection', ja: null              },
    ]
  },
];
window.ERA_DATA = ERA_DATA;

// ─── Bidirectional EN ↔ JA Translation Map ───────────────────────────────────
// Used to expand search queries across languages.
// Key: lowercase search term → Value: equivalent term(s) in the other language.
const TRANSLATION_MAP = {
  // Pokémon names
  'charizard':   'リザードン',   'リザードン':   'charizard',
  'pikachu':     'ピカチュウ',   'ピカチュウ':   'pikachu',
  'mewtwo':      'ミュウツー',   'ミュウツー':   'mewtwo',
  'mew':         'ミュウ',       'ミュウ':       'mew',
  'blastoise':   'カメックス',   'カメックス':   'blastoise',
  'venusaur':    'フシギバナ',   'フシギバナ':   'venusaur',
  'bulbasaur':   'フシギダネ',   'フシギダネ':   'bulbasaur',
  'squirtle':    'ゼニガメ',     'ゼニガメ':     'squirtle',
  'charmander':  'ヒトカゲ',     'ヒトカゲ':     'charmander',
  'raichu':      'ライチュウ',   'ライチュウ':   'raichu',
  'eevee':       'イーブイ',     'イーブイ':     'eevee',
  'umbreon':     'ブラッキー',   'ブラッキー':   'umbreon',
  'espeon':      'エーフィ',     'エーフィ':     'espeon',
  'sylveon':     'ニンフィア',   'ニンフィア':   'sylveon',
  'vaporeon':    'シャワーズ',   'シャワーズ':   'vaporeon',
  'jolteon':     'サンダース',   'サンダース':   'jolteon',
  'flareon':     'ブースター',   'ブースター':   'flareon',
  'leafeon':     'リーフィア',   'リーフィア':   'leafeon',
  'glaceon':     'グレイシア',   'グレイシア':   'glaceon',
  'gengar':      'ゲンガー',     'ゲンガー':     'gengar',
  'lugia':       'ルギア',       'ルギア':       'lugia',
  'ho-oh':       'ホウオウ',     'ホウオウ':     'ho-oh',
  'rayquaza':    'レックウザ',   'レックウザ':   'rayquaza',
  'celebi':      'セレビィ',     'セレビィ':     'celebi',
  'gyarados':    'ギャラドス',   'ギャラドス':   'gyarados',
  'snorlax':     'カビゴン',     'カビゴン':     'snorlax',
  'dragonite':   'カイリュー',   'カイリュー':   'dragonite',
  'lapras':      'ラプラス',     'ラプラス':     'lapras',
  'garchomp':    'ガブリアス',   'ガブリアス':   'garchomp',
  'lucario':     'ルカリオ',     'ルカリオ':     'lucario',
  'zacian':      'ザシアン',     'ザシアン':     'zacian',
  'zamazenta':   'ザマゼンタ',   'ザマゼンタ':   'zamazenta',
  'miraidon':    'ミライドン',   'ミライドン':   'miraidon',
  'koraidon':    'コライドン',   'コライドン':   'koraidon',
  // Set / product names
  'eevee heroes':       'イーブイヒーローズ',      'イーブイヒーローズ':      'eevee heroes evolving skies',
  'shiny treasure':     'シャイニートレジャー',     'シャイニートレジャー':     'shiny treasure paldean fates',
  'lost abyss':         'ロストアビス',             'ロストアビス':             'lost abyss lost origin',
  'star birth':         'スターバース',             'スターバース':             'star birth brilliant stars',
  'vstar universe':     'VSTARユニバース',          'VSTARユニバース':          'vstar universe crown zenith',
  'fusion arts':        'フュージョンアーツ',        'フュージョンアーツ':        'fusion arts fusion strike',
  'time gazer':         'タイムゲイザー',            'タイムゲイザー':            'time gazer astral radiance',
  'double blaze':       'ダブルブレイズ',            'ダブルブレイズ':            'double blaze unbroken bonds',
  'alter genesis':      'オルタージェネシス',        'オルタージェネシス':        'alter genesis unified minds',
  'tag bolt':           'タッグボルト',              'タッグボルト':              'tag bolt team up',
  'raging surf':        'レイジングサーフ',          'レイジングサーフ':          'raging surf obsidian flames',
  'clay burst':         'クレイバースト',            'クレイバースト':            'clay burst paldea evolved',
  'stellar miracle':    'ステラミラクル',            'ステラミラクル':            'stellar miracle stellar crown',
  'ancient roar':       'エイシャントロアー',        'エイシャントロアー':        'ancient roar paradox rift',
  'future flash':       'フューチャーフラッシュ',    'フューチャーフラッシュ':    'future flash paradox rift',
  'mask of change':     'マスクオブチェンジ',        'マスクオブチェンジ':        'mask of change twilight masquerade',
  'battle partners':    'バトルパートナーズ',        'バトルパートナーズ':        'battle partners destined rivals',
  'terastal fest':      'テラスタルフェスex',        'テラスタルフェスex':        'terastal fest prismatic evolutions',
  '151':                'ポケモンカード151',          'ポケモンカード151':          '151 pokemon 151',
  'lost thunder':       'ロストサンダー',            'ロストサンダー':            'lost thunder',
  // Card terms
  'promo':    'プロモ',   'プロモ':   'promo',
  'graded':   'グレード', 'グレード': 'graded',
  'sealed':   'シールド', 'シールド': 'sealed',
  'booster':  'パック',   'パック':   'booster pack',
  'japanese': '日本語',   '日本語':   'japanese',
  'english':  '英語',     '英語':     'english',
};
window.TRANSLATION_MAP = TRANSLATION_MAP;

// Expand a query string with cross-language translations
const expandQuery = (q) => {
  if (!q || !q.trim()) return [];
  const lower = q.toLowerCase().trim();
  const terms = new Set([lower]);
  Object.entries(TRANSLATION_MAP).forEach(([key, val]) => {
    if (lower.includes(key.toLowerCase())) {
      const vals = Array.isArray(val) ? val : [val];
      vals.forEach(v => terms.add(v.toLowerCase()));
    }
  });
  return Array.from(terms);
};
window.expandQuery = expandQuery;

// ─── SearchFilter Component ───────────────────────────────────────────────────
const MktSearchFilter = ({
  lang, onLangChange,
  search, onSearch,
  cardType, onCardType,
  catF, onCatF,
  sort, onSort,
  onReset,
}) => {
  const hasActive = lang !== 'all' || search || cardType !== 'all' || catF !== 'All';

  const sLabel = (text) => React.createElement('span', {
    style: { fontSize: 10, fontWeight: 700, color: 'var(--color-gray-500)',
      textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block' }
  }, text);

  const hr = React.createElement('div', {
    style: { height: 1, background: 'var(--color-gray-200)', margin: '0' }
  });

  const pill = (active) => ({
    padding: '4px 10px', borderRadius: 'var(--border-radius-pill)', fontSize: 11,
    fontWeight: 600, cursor: 'pointer', lineHeight: 1.5,
    border: `1px solid ${active ? 'var(--color-black)' : 'var(--color-gray-300)'}`,
    background: active ? 'var(--color-black)' : 'transparent',
    color: active ? 'var(--color-white)' : 'var(--color-gray-700)',
    transition: 'all 100ms ease', whiteSpace: 'nowrap',
  });

  const selStyle = {
    width: '100%', padding: '7px 10px', fontSize: 12,
    border: '1px solid var(--color-gray-300)', borderRadius: 'var(--border-radius)',
    background: '#fff', color: 'var(--color-gray-900)', outline: 'none',
    cursor: 'pointer', fontFamily: 'var(--font-sans)',
  };

  return React.createElement('aside', null,
    React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column', gap: 14, padding: 14,
        background: 'var(--color-off-white)', border: '1px solid var(--color-gray-200)',
        borderRadius: 'var(--border-radius-lg)' }
    },

      // ── Language toggle ──────────────────────────────────────────────
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 7 } },
        sLabel('Language'),
        React.createElement('div', {
          style: { display: 'flex', background: 'var(--color-gray-200)', borderRadius: 8, padding: 2, gap: 2 }
        },
          [{ id: 'all', label: 'All' }, { id: 'en', label: 'EN' }, { id: 'ja', label: 'JP' }]
            .map(({ id, label }) => React.createElement('button', {
              key: id, onClick: () => onLangChange(id),
              style: {
                flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: lang === id ? '#fff' : 'transparent',
                color: lang === id ? 'var(--color-black)' : 'var(--color-gray-500)',
                boxShadow: lang === id ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 120ms ease',
              }
            }, label))
        )
      ),

      hr,

      // ── Search ───────────────────────────────────────────────────────
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
        sLabel('Search'),
        React.createElement('div', { style: { position: 'relative', display: 'flex' } },
          React.createElement('input', {
            type: 'text',
            placeholder: lang === 'ja' ? '日本語・英語で検索...' : 'Search in EN or JP...',
            value: search,
            onChange: e => onSearch(e.target.value),
            style: { ...selStyle, flex: 1, padding: '7px 28px 7px 10px' }
          }),
          search
            ? React.createElement('button', {
                onClick: () => onSearch(''),
                style: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: 0 }
              }, '×')
            : React.createElement('span', {
                style: { position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                  color: '#9ca3af', fontSize: 12, pointerEvents: 'none' }
              }, '⌕')
        ),
        React.createElement('p', {
          style: { fontSize: 10, color: '#9ca3af', margin: 0, lineHeight: 1.5 }
        }, '✦ Cross-language — type Charizard to find リザードン')
      ),

      hr,

      // ── Card Type ────────────────────────────────────────────────────
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
        sLabel('Card Type'),
        React.createElement('div', { style: { display: 'flex', gap: 4 } },
          [{ id: 'all', label: 'All' }, { id: 'card', label: 'Cards' }, { id: 'promo', label: 'Promos' }]
            .map(({ id, label }) => React.createElement('button', {
              key: id, onClick: () => onCardType(id), style: pill(cardType === id)
            }, label))
        )
      ),

      hr,

      // ── Category ─────────────────────────────────────────────────────
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
        sLabel('Category'),
        React.createElement('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' } },
          ['All', 'Singles', 'Graded', 'Sealed'].map(f => React.createElement('button', {
            key: f, onClick: () => onCatF(f), style: pill(catF === f)
          }, f))
        )
      ),

      // ── Sort ─────────────────────────────────────────────────────────
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
        sLabel('Sort by'),
        React.createElement('select', {
          value: sort, onChange: e => onSort(e.target.value), style: selStyle,
        },
          ['Newest', 'Oldest', 'Price: Low–High', 'Price: High–Low'].map(s =>
            React.createElement('option', { key: s, value: s }, s))
        )
      ),

      // ── Reset ────────────────────────────────────────────────────────
      hasActive && React.createElement('button', {
        onClick: onReset,
        style: { padding: '7px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          border: '1px solid var(--color-gray-200)', borderRadius: 'var(--border-radius)',
          background: 'transparent', color: 'var(--color-gray-500)', textAlign: 'center',
          transition: 'border-color 100ms, color 100ms' }
      }, '↺  Reset all filters')
    )
  );
};
window.MktSearchFilter = MktSearchFilter;
