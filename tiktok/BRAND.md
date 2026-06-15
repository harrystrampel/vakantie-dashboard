# BRAND — visuele identiteit & consistente AI-persona

Doel: **elke video herkenbaar als hetzelfde merk**, ook zonder dat jij in beeld
bent. Consistentie is hier de moat. Dit document is de "style bible" die de
content-pijplijn elke dag gebruikt om beelden/video's te genereren.

> Tools die ik hiervoor gebruik (al beschikbaar in deze omgeving):
> AI-beeldgeneratie, AI-videogeneratie, AI-voiceover, en een character/reference-
> systeem voor consistente personages. Zie `pipeline/` voor het proces.

## 1. Merknaam & handle

- Werktitel: **NOVA** _(wijzig in `config.yml`)_
- Handle-voorstellen: `@buildwithnova`, `@nova.builds`, `@nova.ai.studio`
- Tagline: _"Building an AI company in public."_

## 2. De persona (consistent karakter)

Eén vaste AI-gegenereerde persona als gezicht van het merk. Dit geeft
herkenning zonder dat jij hoeft te filmen.

**Vaste karakter-omschrijving (gebruik letterlijk in elke image/video-prompt):**

> "A 30-year-old founder with short dark hair, light stubble, wearing a plain
> charcoal crew-neck sweater, calm confident expression, minimal modern studio
> with soft neutral lighting and a subtle teal accent light in the background."

> ⚠️ Pin dit vast. Genereer één keer een **reference image** van de persona en
> hergebruik die als reference in alle volgende generaties (consistente
> gezichten via het character/reference-systeem). Wijzig de omschrijving daarna
> nooit zonder de reference opnieuw te zetten.

_(Voorkeur voor een niet-menselijke mascotte i.p.v. een persoon? Vervang de
omschrijving — alles eronder blijft gelijk.)_

## 3. Visuele stijl (vast)

| Element | Spec |
|---|---|
| Kleurpalet | Charcoal `#16181C`, off-white `#F4F4F0`, teal accent `#1FB6A6` |
| Verlichting | Soft, neutraal, één teal accentlicht |
| Sfeer | Strak, modern, "expensive minimal", geen rommel |
| Aspect ratio | 1080×1920 (9:16) |
| Tekststijl | Sans-serif bold, wit met subtiele schaduw, hoog in beeld |
| Logo/watermark | Klein, rechtsonder, lage opacity |

## 4. Vaste templatestructuur per video

1. **Frame 0–1s:** hooktekst groot in beeld + persona zichtbaar.
2. **1–3s:** belofte / probleem.
3. **3–[einde-3s]:** payload (de tool/insight/demo), 1 idee.
4. **Laatste 3s:** micro-CTA + handle-tag.

## 5. Audio

- AI-voiceover: één vaste stem (kalm, helder, lichte energie). Pin de
  stem-instelling en hergebruik 'm elke video voor herkenning.
- Trending audio onder de voiceover waar passend (vooral P1/P3).

## 6. Prompt-recept (kopieerbaar voor beeldgeneratie)

```
[KARAKTER-OMSCHRIJVING uit §2], <scene/action voor deze video>,
9:16 vertical, soft neutral lighting with teal accent, modern minimal studio,
cinematic, photorealistic, brand colors charcoal and off-white.
Reference: <persona reference image id>.
```

## 7. Consistentie-checklist (pijplijn dwingt dit af)

- [ ] Zelfde persona-reference gebruikt?
- [ ] Kleurpalet correct?
- [ ] 9:16, ondertiteling aan?
- [ ] Hook leesbaar in frame 0?
- [ ] Handle-tag in laatste frame?
