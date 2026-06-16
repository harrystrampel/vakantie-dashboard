# AUDIT — wekelijkse strateeg-audit (elke maandagochtend)

Dit is de methodologie die elke maandag draait. De audit produceert een log in
`audits/JJJJ-Www.md` én schrijft de belangrijkste beslissingen terug naar
`STRATEGY.md` (Changelog + relevante secties) en de `content/`-briefs van die week.

> Principe: **data eerst, mening tweede.** We veranderen alleen iets als de cijfers
> of een duidelijke trend het rechtvaardigen. Eén verandering tegelijk waar mogelijk,
> zodat we weten wat werkte.

## Inputs die de audit verzamelt

1. **Eigen prestaties (afgelopen 7 dagen)** — per video: views, 3s-view %,
   gem. kijktijd, retentie %, saves, shares, comments, profielbezoeken, nieuwe volgers.
   (Via TikTok Business/Display API of handmatige export — zie `SETUP.md`.)
2. **Trends rondom de niche** — actuele TikTok-trends, trending audio, en
   onderwerpen in de AI-niche (via web-research op de audit-dag).
3. **Concurrentie** — 3–5 vergelijkbare AI-accounts: wat ging viral, welke hooks/formats.
4. **Funnel** — waitlist-/bio-link-aanmeldingen deze week.

## De 7 analysestappen

1. **Wat presteerde best & slechtst?** Top 3 en bottom 3 video's. Zoek het patroon
   (pillar, hook-type, lengte, audio, onderwerp, posttijd).
2. **Hook-analyse.** Welke hooks haalden hoog 3s-view %? Update de hook-bibliotheek in `STRATEGY.md`.
3. **Retentie-analyse.** Waar haken kijkers af (begin/midden/eind)? Pas format-regels aan.
4. **Pillar-balans.** Welke pillar levert reach vs. volgers vs. saves? Herverdeel het % indien nodig.
5. **Trend-match.** Welke 2–3 actuele trends/audio passen authentiek bij het merk? Plan ze in deze week.
6. **Concurrentie-gaps.** Wat doet de concurrentie dat wij missen? Wat kunnen we beter/anders?
7. **Funnel-check.** Beweegt de waitlist? Zo niet: sterker CTA-experiment inplannen.

## Output van de audit

1. **`audits/JJJJ-Www.md`** ingevuld volgens `audits/TEMPLATE.md` (cijfers + bevindingen + besluiten).
2. **Updates aan `STRATEGY.md`**: pillar-%, hook-bibliotheek, format-regels, experiment-backlog + Changelog-regel.
3. **Updates aan `content/week-NN.md`**: de 7 briefs van komende week, geënt op de learnings.
4. **Max. 1–3 concrete experimenten** voor de week, met een meetbare verwachting.

## Zelf-verbetering ("blijven leren")

- Elke audit voegt minimaal 1 nieuwe winnende hook of format-inzicht toe aan `STRATEGY.md`.
- Mislukte experimenten worden níet stilletjes verwijderd — ze blijven in de
  audit-log staan met de reden, zodat we niet in cirkels lopen.
- Elke 4 weken: een "meta-audit" die de trend over de maand bekijkt (groeit de
  curve, welke pillar wint structureel, is de funnel aan het werken?).

## Hoe de audit getriggerd wordt

`.github/workflows/weekly-audit.yml` draait elke maandagochtend en opent
(afhankelijk van je keuze) een issue/PR met de audit, of werkt de bestanden
direct bij. Zie `SETUP.md`.
