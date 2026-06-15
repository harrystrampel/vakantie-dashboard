# Content-kalender & pillar-rotatie

1 video per dag. Vaste weekrotatie zodat het merk afwisselend reach én loyaliteit
opbouwt. De maandag-audit kan deze rotatie bijstellen.

## Vaste weekrotatie

| Dag | Pillar | Type |
|---|---|---|
| Maandag | P2 — Build-in-public | "Week [N] of building my AI product" + audit-learnings verwerkt |
| Dinsdag | P1 — AI tool/workflow | Snelle, hoge-reach value |
| Woensdag | P3 — Wow-demo | Before/after of mind-blowing demo |
| Donderdag | P1 — AI tool/workflow | Tweede value-video van de week |
| Vrijdag | P4 — Hot take | Mening/debat → comments |
| Zaterdag | P3 — Wow-demo | Shareable weekend-content |
| Zondag | P1 — AI tool/workflow | Value + zachte CTA naar waitlist |

Dit geeft per week ≈ P1 40% / P2 15% / P3 30% / P4 15% — daarna fine-tunet de
audit op basis van wat echt volgers/saves oplevert.

## Workflow per video (door de pijplijn)

1. Pak de brief van vandaag uit `content/week-NN.md`.
2. Genereer visuals + voiceover volgens `BRAND.md` (consistente persona/reference).
3. Stel de video samen (9:16, ondertiteling, hook in frame 0).
4. Genereer caption + hashtags.
5. (Optioneel) draai de virality-predictor; bij lage score → hook herzien.
6. Post via `scripts/post_to_tiktok.py` op de ingestelde tijd.

## Hashtag-strategie

- 3–5 tags: 1 breed (`#ai`), 2 niche (`#aitools`, `#buildinpublic`), 1–2 trend-tags (audit vult aan).
- Geen tag-spam; relevantie > volume.
