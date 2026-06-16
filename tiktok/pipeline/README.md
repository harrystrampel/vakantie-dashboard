# PIPELINE — dagelijkse productie (bewezen recept)

Dit is het concrete, geteste recept om elke dag on-brand content te maken en in de
posting-queue te zetten. Modellen en instellingen hieronder zijn **getest op
2026-06-15** en werkten. Credits: zie `../COSTS.md`.

## Vaste assets

- **Persona-reference (consistent gezicht):** image job `de450b37-a44b-41d1-9a78-634bdb7083ff`
  (soul_2, 9:16). Hergebruik dit als referentie in élke video voor consistentie.
- Merk/handle/kleuren: zie `../BRAND.md`.

## Bewezen modellen

| Doel | Model | Settings | Credits |
|---|---|---|---|
| Persona / portret | `soul_2` | 9:16, 2k | ~0,12 |
| Hero-video (persona in beweging) | `seedance_2_0` | 9:16, 10s, ref = persona image | ~45 |
| Carousel-slides + tekst | `nano_banana_pro` | 9:16, 1k | ~0,12/slide |
| Productfoto before→after | `nano_banana_pro` | 9:16, ref = before-image | ~0,12 |
| Voiceover | `inworld_text_to_speech` | vaste stem | klein |

## Stap-voor-stap per dag

### Video-dag (ma/wo/zo)
1. Pak de brief uit `content/week-NN.md`.
2. `generate_video` met `seedance_2_0`, prompt = scene + persona, `medias:[{role:"image", value: PERSONA_REF}]`, 9:16, 10s.
3. (Strategisch) `virality_predictor` → check hook/retentie; bij zwak: pas hook/pacing aan en regenereer 1×.
4. **Edit-stap:** brand teksthook in frame 0 + burned-in captions toevoegen (Canva-MCP of editor).
5. Host de finale `.mp4` op een publieke URL → zet entry in `content/queue.json`.

### Slideshow-dag (di/do/vr/za)
1. Pak de brief uit `content/week-NN.md`.
2. `generate_image` met `nano_banana_pro` per slide (hook op slide 1, value op 2–4, CTA op slot).
3. Voor before/after: genereer BEFORE, gebruik die als `medias` reference voor AFTER (zelfde product).
4. Upload de slides als carousel (handmatig of via TikTok-API photo-post).

## Consistentie-checklist (elke post)
- [ ] Persona-reference gebruikt (video) / merkkleuren + handle (slides)?
- [ ] Hook leesbaar in frame 0 / op slide 1?
- [ ] 9:16, ondertiteling/teksthook aan?
- [ ] Handle-tag in laatste frame/slide?
- [ ] Caption + 3–5 hashtags klaar?

## Voorbeeld-output (proof, 2026-06-15)
- Persona: `de450b37…`
- Hero-video (10s, multi-shot): `f8beb66f-953d-4e4b-99f8-111793785de4`
- Carousel "Stop paying for product photography": slides `c82fb152…` (hook),
  `018790e2…` (before), `84b8796c…` (after), `4595b06e…` (CTA).
