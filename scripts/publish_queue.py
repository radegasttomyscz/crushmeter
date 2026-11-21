# -*- coding: utf-8 -*-
"""Publikace článků z fronty (větev `fronta`, složka fronta/).

Soubor: fronta/RRRR-MM-DD-slug.txt. Jakmile datum v názvu nastane (Europe/Prague),
skript vytvoří /slug.html, přidá článek do magazínu, sitemapy a llms.txt
a přesune soubor do fronta/vydane/.

Použití:  python3 scripts/publish_queue.py <cesta ke složce fronta> [--date RRRR-MM-DD] [--dry]
Formát souboru popisuje fronta/README.md ve větvi fronta.
"""
import re, sys, os, html, json, shutil, datetime
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES = {
 'know': ('is-know', 'Hra zdarma', 'Jak dobře se znáte?', 'Ty odpovíš, druhý si tipne. Osm otázek, jeden telefon, bez registrace.', '/jak-dobre-se-znate.html', 'jak-dobre-se-znate', 'Zahrát si'),
 'quiz': ('is-quiz', 'Hra zdarma', 'Kdo ví víc', 'Kvízový souboj pro dva. Jeden čte otázku a hlídá čas, druhý odpovídá. Dvacet kategorií, tři obtížnosti.', '/kdo-vi-vic.html', 'kdo-vi-vic', 'Zahrát si'),
 'guess': ('is-guess', 'Hra zdarma', 'Předveď a hádej', 'Popis, pantomima nebo kresba. Časovač hlídá telefon, vy se soustředíte na toho druhého.', '/predved-a-hadej.html', 'predved-a-hadej', 'Zahrát si'),
 'adult': ('is-adult', 'Hra 18+', 'Odvážně 18+', 'Otázky, přiznání a výzvy pro dva. Deset karet si zahrajete hned a zdarma, v plné verzi jsou i erotické karty pro páry.', '/odvazne-18-ukazka.html', 'odvazne-18', 'Vyzkoušet ukázku'),
}
TYPE_BY_LABEL = {'Otázky pro dva': 'otazky', 'Otázky pro kamarády': 'otazky', 'Hry pro páry': 'hry', 'Hry pro dva': 'hry', 'Hry na cesty': 'hry', 'Hry na výlety': 'hry', 'Hry na oslavy': 'oslavy', 'Kvíz pro dva': 'kvizy', 'Kvízy a hádanky': 'kvizy', 'Večer ve dvou': 'rande'}
GAME_NAME = {'know': 'Jak dobře se znáte?', 'quiz': 'Kdo ví víc', 'guess': 'Předveď a hádej', 'adult': 'Odvážně 18+'}
MONTHS = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince']

from promos import PROMOS, promo_html

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'\[(.+?)\]\((/[^)]+)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'\[(.+?)\]\((https://[^)]+)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', t)
    return t

def parse(src, slug):
    a = dict(slug=slug, body=[], faq=[], rel=[])
    mode = None; buf = []
    def flush():
        nonlocal mode, buf
        if mode in ('ul', 'ol'):
            a['body'].append(f'<{mode}>' + ''.join(f'<li>{inline(x)}</li>' for x in buf) + f'</{mode}>')
        if mode == 'ans':
            a['body'].append('<details class="answers"><summary>Ukázat odpovědi</summary><ol>' + ''.join(f'<li>{inline(x)}</li>' for x in buf) + '</ol></details>')
        mode = None; buf = []
    for ln in src.split('\n'):
        s = ln.strip()
        if not s or s.startswith('//'): flush(); continue
        m = re.match(r'([TDHLGCKFP]): (.*)', s)
        if m and m.group(1) not in a:
            a[m.group(1)] = m.group(2); continue
        if s.startswith('R: '):
            u, t = s[3:].split(' | ', 1); a['rel'].append((u.strip(), t.strip())); continue
        if s.startswith('? '):
            flush(); q, ans = s[2:].split(' | ', 1); a['faq'].append((q, ans)); continue
        if s.startswith('## '): flush(); a['body'].append(f'<h2>{inline(s[3:])}</h2>'); continue
        if s.startswith('### '): flush(); a['body'].append(f'<h3>{inline(s[4:])}</h3>'); continue
        if s.startswith('= '):
            if mode != 'ans': flush(); mode = 'ans'
            buf.append(s[2:]); continue
        if s.startswith('- '):
            if mode != 'ul': flush(); mode = 'ul'
            buf.append(s[2:]); continue
        m = re.match(r'\d+\. (.*)', s)
        if m:
            if mode != 'ol': flush(); mode = 'ol'
            buf.append(m.group(1)); continue
        flush(); a['body'].append(f'<p>{inline(s)}</p>')
    flush()
    for k in 'TDHLGC':
        if k not in a: raise SystemExit(f'{slug}: chybí řádek {k}:')
    if a['G'] not in GAMES: raise SystemExit(f'{slug}: neznámá hra {a["G"]}')
    if len(a['D']) > 160: raise SystemExit(f'{slug}: popis je delší než 160 znaků')
    if 'P' in a and a['P'] not in PROMOS: raise SystemExit(f'{slug}: neznámý tip {a["P"]}')
    return a

def game_box(k):
    c, small, name, text, url, gid, btn = GAMES[k]
    tr = 'data-track="adult_preview_click"' if k == 'adult' else f'data-track="article_game_click" data-track-game="{gid}"'
    return (f'<aside class="cta-game {c}" aria-label="{small}"><small>{small}</small><strong>{name}</strong><p>{text}</p>'
            f'<a class="cta-link" href="{url}" {tr} data-track-placement="article">{btn}</a></aside>')

def build(a, day):
    tpl = open(os.path.join(ROOT, 'otazky-pro-pary.html'), encoding='utf8').read()
    url = f"https://crushmeter.cz/{a['slug']}.html"
    t = html.escape(a['T'] + ' | CrushMeter.cz'); d = html.escape(a['D'])
    s = re.sub(r'<title>.*?</title>', lambda m: f'<title>{t}</title>', tpl, count=1)
    for pat, val in ((r'(<meta name="description" content=")[^"]*', d), (r'(<meta property="og:description" content=")[^"]*', d),
                     (r'(<meta name="twitter:description" content=")[^"]*', d), (r'(<meta property="og:title" content=")[^"]*', t),
                     (r'(<meta name="twitter:title" content=")[^"]*', t), (r'(<link rel="canonical" href=")[^"]*', url),
                     (r'(<meta property="og:url" content=")[^"]*', url)):
        s = re.sub(pat, lambda m: m.group(1) + val, s, count=1)
    iso = day.isoformat()
    graph = [{"@type": "WebSite", "@id": "https://crushmeter.cz/#website", "name": "CrushMeter.cz", "url": "https://crushmeter.cz/", "inLanguage": "cs"},
             {"@type": "Article", "headline": a['H'], "description": a['D'], "inLanguage": "cs", "mainEntityOfPage": url, "datePublished": iso, "dateModified": iso,
              "image": "https://crushmeter.cz/og-image.png", "author": {"@type": "Organization", "name": "CrushMeter.cz", "url": "https://crushmeter.cz/"},
              "publisher": {"@type": "Organization", "name": "CrushMeter.cz", "logo": {"@type": "ImageObject", "url": "https://crushmeter.cz/apple-touch-icon.png"}}},
             {"@type": "BreadcrumbList", "itemListElement": [
                 {"@type": "ListItem", "position": 1, "name": "CrushMeter", "item": "https://crushmeter.cz/"},
                 {"@type": "ListItem", "position": 2, "name": "Magazín", "item": "https://crushmeter.cz/blog.html"},
                 {"@type": "ListItem", "position": 3, "name": a['H'], "item": url}]}]
    if a['faq']:
        graph.append({"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer",
                      "text": re.sub(r'\[(.+?)\]\([^)]+\)', r'\1', x).replace('**', '')}} for q, x in a['faq']]})
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)
    s = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: '<script type="application/ld+json">' + ld + '</script>', s, count=1, flags=re.S)
    body = ''.join(a['body'])
    if a['faq']:
        body += '<h2>Časté otázky</h2><div class="faq-list article-faq">' + ''.join(f'<details><summary>{inline(q)}</summary><p>{inline(x)}</p></details>' for q, x in a['faq']) + '</div>'
    body += f'<p class="article-updated">Vydáno {day.day}. {MONTHS[day.month - 1]} {day.year}</p>'
    lab = html.escape(a['L'])
    crumbs = ('<nav class="breadcrumbs" aria-label="Drobečková navigace"><a href="/">CrushMeter</a><span aria-hidden="true">/</span>'
              f'<a href="/blog.html">Magazín</a><span aria-hidden="true">/</span><span>{lab}</span></nav>')
    rel = ''
    if a['rel']:
        rel = '<section class="article-box glass internal-links"><strong>Související</strong><ul>' + ''.join(f'<li><a href="{u}">{html.escape(x)}</a></li>' for u, x in a['rel']) + '</ul></section>'
    art = (f'<article class="article">{crumbs}<span class="eyebrow">{lab}</span><h1 class="font-serif">{html.escape(a["H"], quote=False)}</h1>'
           + body + game_box(a['G']) + (promo_html(a['P'], 'clanek_' + a['slug']) if 'P' in a else '') + rel + '</article>')
    i = s.index('<article class="article">'); j = s.index('</article>') + len('</article>')
    return s[:i] + art + s[j:]

def register(a, day):
    p = os.path.join(ROOT, 'blog.html'); s = open(p, encoding='utf8').read()
    href = f'/{a["slug"]}.html'
    if href not in s:
        typ = a.get('F') or TYPE_BY_LABEL.get(a['L'], 'hry')
        card = (f'<a class="mag-card is-{a["G"]}" data-type="{typ}" href="{href}"><h3>{html.escape(a.get("K") or a["H"].split(":")[0])}</h3><p>{html.escape(a["C"])}</p>'
                f'<span class="mag-game">Ke hře {GAME_NAME[a["G"]]}</span></a>')
        s = s.replace('<div class="mag-grid">', '<div class="mag-grid">' + card, 1)
        open(p, 'w', encoding='utf8').write(s)
    p = os.path.join(ROOT, 'sitemap.xml'); s = open(p, encoding='utf8').read()
    loc = f'https://crushmeter.cz{href}'
    if loc not in s:
        s = s.replace('</urlset>', f'  <url><loc>{loc}</loc><lastmod>{day.isoformat()}</lastmod></url>\n</urlset>')
        s = re.sub(r'(<loc>https://crushmeter\.cz/blog\.html</loc>)(?:<lastmod>[^<]*</lastmod>)?', lambda m: m.group(1) + f'<lastmod>{day.isoformat()}</lastmod>', s)
        open(p, 'w', encoding='utf8').write(s)
    p = os.path.join(ROOT, 'llms.txt')
    if os.path.exists(p):
        s = open(p, encoding='utf8').read()
        if loc not in s:
            anchor = '- [Otázky pro páry](https://crushmeter.cz/otazky-pro-pary.html)\n'
            line = f'- [{a.get("K") or a["H"].split(":")[0]}]({loc})\n'
            s = s.replace(anchor, anchor + line, 1) if anchor in s else s + line
            open(p, 'w', encoding='utf8').write(s)
    p = os.path.join(ROOT, 'sw.js'); s = open(p, encoding='utf8').read()
    s = re.sub(r"crushmeter-free-v(\d+)-\d+", lambda m: f"crushmeter-free-v{int(m.group(1)) + 1}-{day.strftime('%Y%m%d')}", s, count=1)
    open(p, 'w', encoding='utf8').write(s)

def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    qdir = args[0] if args else os.path.join(ROOT, '_queue', 'fronta')
    day = datetime.datetime.now(ZoneInfo('Europe/Prague')).date()
    if '--date' in sys.argv: day = datetime.date.fromisoformat(sys.argv[sys.argv.index('--date') + 1])
    dry = '--dry' in sys.argv
    done = []; errors = []
    for f in sorted(os.listdir(qdir)):
        m = re.match(r'(\d{4}-\d{2}-\d{2})-([a-z0-9-]+)\.txt$', f)
        if not m: continue
        when = datetime.date.fromisoformat(m.group(1)); slug = m.group(2)
        if when > day: print('čeká', f); continue
        try:
            a = parse(open(os.path.join(qdir, f), encoding='utf8').read(), slug)
            out = build(a, when)
        except (SystemExit, Exception) as e:
            errors.append(f'{f}: {e}'); print('CHYBA', f, e); continue
        if dry:
            print('náhled', slug); open(f'/tmp/{slug}.html', 'w', encoding='utf8').write(out); continue
        if os.path.exists(os.path.join(ROOT, slug + '.html')): raise SystemExit(f'{slug}.html už existuje')
        open(os.path.join(ROOT, slug + '.html'), 'w', encoding='utf8').write(out)
        register(a, when)
        os.makedirs(os.path.join(qdir, 'vydane'), exist_ok=True)
        shutil.move(os.path.join(qdir, f), os.path.join(qdir, 'vydane', f))
        done.append(slug); print('vydáno', slug)
    if 'GITHUB_OUTPUT' in os.environ:
        open(os.environ['GITHUB_OUTPUT'], 'a').write(f"published={' '.join(done)}\n")
    if errors:
        raise SystemExit('Nevydáno kvůli chybě: ' + '; '.join(errors))

if __name__ == '__main__':
    main()
