"""Nenápadné tipy na další weby provozovatele (pro články). Sdílí je publish_queue.py."""
import html

PROMOS = {
    'putovani': ('↗', 'Hra je. A kam spolu vyrazíte?', 'Putování světem pomůže vybrat další společný výlet nebo dovolenou.',
                 'https://putovanisvetem.cz/kam-vyrazit/', 'Vybrat cestu', 'click_putovani_svetem'),
    'syte': ('✿', 'K večeru patří i dobré jídlo', 'Sytě a lehce má recepty na jídla, která zasytí a nezatíží.',
             'https://www.sytealehce.cz/', 'Prohlédnout recepty', 'click_syte_a_lehce'),
    'flambro': ('▲', 'Venku to chce gril', 'Grilování a flambování ve dvou i pro partu: tipy najdete na Flambro.',
                'https://www.flambro.cz/', 'Mrknout na Flambro', 'click_flambro'),
    'kartarka': ('✦', 'Co vám řeknou karty?', 'Virtuální kartářka vytáhne karty a odpoví česky. Je to zábava a inspirace, ne rozhodnutí za vás.',
                 'https://virtualnikartarka.cz/', 'Vytáhnout karty', 'click_virtualni_kartarka'),
    'tomys': ('◆', 'Profil je vaše vizitka', 'Weby, marketing a online identitu pro lidi i firmy dělá tomys.cz.',
              'https://www.tomys.cz/', 'Podívat se na tomys.cz', 'click_tomys'),
}
CLASS = {'syte': ' is-food', 'kartarka': ' is-tarot'}

def promo_html(key, campaign):
    mark, title, text, url, btn, track = PROMOS[key]
    href = f'{url}?utm_source=crushmeter&amp;utm_medium=referral&amp;utm_campaign={html.escape(campaign)}'
    return (f'<aside class="promo{CLASS.get(key, "")}" aria-label="Tip na návštěvu"><span class="promo-mark" aria-hidden="true">{mark}</span>'
            f'<div><small>Tip na návštěvu</small><strong>{title}</strong><p>{text}</p>'
            f'<a href="{href}" target="_blank" rel="noopener" data-track="{track}" data-track-placement="article">{btn}</a></div></aside>')
