# HANDOFF — verdergaan in Claude Code op de Mac

> Doel van dit document: een nieuwe Claude Code-sessie (desktop/CLI op de Mac) kan hiermee
> **naadloos verder** met de VECTOR TikTok-engine, mét de tools die in de web-sessie geblokkeerd waren.

## Waar we staan (16 juni 2026)
- Volledige engine staat in `tiktok/`: `VISION.md`, `STRATEGY.md`, `RESEARCH.md`, `COSTS.md`,
  `BRAND.md`, `AUDIT.md`, `SETUP.md`, `pipeline/`, `content/`.
- **Merk:** VECTOR — standalone AI×e-commerce contentmerk, faceless, Engels. Handle `@vectorhq`.
- **Recept is herijkt op deep research** (`RESEARCH.md`). Kernpunten: carousel-first,
  hook-tekst op frame 0, korte loops + captions + emerging trending sound, menselijke voiceover,
  3–5 kwaliteitsposts/week op één niche, AI-content labelen.
- **Kwaliteitspoort:** niets posten onder completion 60–70%+ / hook-retentie ≥70% + menselijke ok.

## Wat in de web-sessie NIET werkte (en op desktop wél moet werken)
Deze tools faalden met "MCP tool call requires approval" omdat de web-omgeving de goedkeurings-popup
niet kon tonen. Op desktop kan de gebruiker ze goedkeuren:
- `media_upload_widget` / `media_import_url` — **referenties uploaden/importeren**
- `video_analysis_create` — **referentie-TikToks scene-voor-scene analyseren**
- `show_marketing_studio` + `marketing_studio_video` — **de echte product-ad-engine (1080p, UGC-hooks)**
- Meta Ads Library tools — **concurrentie-/creative-research**

## Eerste stappen in de nieuwe sessie (in volgorde)
1. **Referenties analyseren.** Gebruiker levert 5 TikToks (de stijlen die hij mooi vindt). Upload ze
   via `media_upload_widget` → `video_analysis_create` → ontleed hook, tempo, tekstplaatsing, stijl.
   Leg het winnende stijl-recept vast in `BRAND.md`.
2. **Eerste echte productie = carousels** (Photo-Mode listicle, 5–10 slides, hook op slide 1,
   save-CTA), in de geanalyseerde stijl. Goedkoopst (8 cr) + hoogste bereik + laagste AI-slop-risico.
3. **Video pas daarna**, via Marketing Studio (niet rauwe seedance-b-roll — die plafonneerde op
   hook-score 38–42). Menselijke voiceover + echte waarde.
4. **Alles door de virality-checker** vóór tonen/posten; score eronder, eerlijk.
5. **TikTok API** koppelen (`SETUP.md`) voor automatisch posten.

## Wat NIET meer doen (geleerd deze sessie)
- Geen repetitieve AI-product-b-roll (draaiend flesje) — wordt afgeknepen + scoort laag.
- Geen kale tekstkaarten in carousels — elk beeld draagt.
- Niet tonen/posten zonder virality-check + score.
- Geen volume najagen boven kwaliteit (2 bangers > 7 vulling).

## Kickoff-prompt voor de nieuwe sessie
> "Lees `tiktok/HANDOFF.md`, `VISION.md`, `STRATEGY.md` en `RESEARCH.md`. We gaan verder met de
> VECTOR TikTok-engine. Ik ga je nu mijn 5 referentie-TikToks geven om de stijl te ontleden.
> Daarna bouwen we de eerste carousel in dat recept en checken 'm met de virality-predictor."

## Branch
Al het werk staat op branch `claude/tiktok-automation-strategy-eo1pxs` (repo `harrystrampel/vakantie-dashboard`).
