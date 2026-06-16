# SETUP — eenmalig (alleen jij kunt dit doen)

Het systeem staat klaar, maar de "autopilot" heeft twee dingen van jou nodig die
ik niet voor je kan doen: een **TikTok developer-app** en het invullen van
**secrets**. Reken op ~30–45 minuten. Volg dit stap voor stap.

---

## Stap 1 — TikTok developer-app aanmaken

1. Ga naar **developers.tiktok.com** en log in met het TikTok-account dat het
   merk wordt (maak dat account eerst aan in de TikTok-app).
2. Maak een nieuwe app. Vraag toegang aan tot de **Content Posting API** met de
   scope **`video.publish`** (en `video.upload`).
3. Bij **Direct Post** moet je app eerst een **review/audit** door van TikTok.
   Tot die tijd kun je alleen naar je eigen inbox posten (handmatige laatste tik).
   Vraag de audit gelijk aan — dat is de stap naar échte autopilot.
4. Noteer je **Client key** en **Client secret**.

> Belangrijk en eerlijk: TikTok staat geen volledig autonome bots toe buiten deze
> officiële API om. Met de goedgekeurde Content Posting API is dagelijks
> auto-posten wél toegestaan. Voor de audit-periode kan het systeem de video
> klaarzetten en heb jij nog één tik nodig.

## Stap 2 — Eén keer OAuth-toestemming geven (refresh token ophalen)

De API heeft een `refresh_token` nodig (lang houdbaar). Die haal je één keer op
via de OAuth consent-flow:

1. Open in je browser de authorize-URL (vul je client key + redirect in):
   ```
   https://www.tiktok.com/v2/auth/authorize/?client_key=CLIENT_KEY&scope=video.publish,video.upload&response_type=code&redirect_uri=REDIRECT_URI&state=x
   ```
2. Keur goed → je wordt teruggestuurd met een `code` in de URL.
3. Wissel die `code` in voor tokens (eenmalig, bv. met curl):
   ```bash
   curl -X POST https://open.tiktokapis.com/v2/oauth/token/ \
     -d client_key=CLIENT_KEY -d client_secret=CLIENT_SECRET \
     -d grant_type=authorization_code -d code=DE_CODE \
     -d redirect_uri=REDIRECT_URI
   ```
4. Bewaar de `refresh_token` uit het antwoord.

_(Wil je dit niet zelf doen? Dan kunnen we kiezen voor een scheduler zoals
Metricool/Buffer waar je alleen inlogt — laat het weten.)_

## Stap 3 — GitHub secrets invullen

In de repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Waarde |
|---|---|
| `TIKTOK_CLIENT_KEY` | uit stap 1 |
| `TIKTOK_CLIENT_SECRET` | uit stap 1 |
| `TIKTOK_REFRESH_TOKEN` | uit stap 2 |
| `ANTHROPIC_API_KEY` | voor de wekelijkse audit (console.anthropic.com) |

## Stap 4 — config invullen

Open `tiktok/config.yml` en zet je echte merknaam, handle en (later) `waitlist_url`.

## Stap 5 — aanzetten

Zodra de secrets staan, draaien de workflows vanzelf:
- **Dagelijks** posten op de ingestelde tijd (`.github/workflows/tiktok-daily-post.yml`).
- **Elke maandag** de audit (`.github/workflows/tiktok-weekly-audit.yml`).

Je kunt ze ook handmatig testen via **Actions → Run workflow**.

---

## Wat ik (Claude) doe zodra dit staat

- Dagelijks de content genereren (consistente persona, voiceover, ondertiteling)
  en posten.
- Elke maandag de audit draaien, `STRATEGY.md` bijwerken en de week-briefs
  verversen op basis van de echte cijfers.
- Mijn eigen hook-bibliotheek en format-regels blijven uitbreiden.

## Wat ik níet kan (eerlijk)

- Een TikTok-account aanmaken of je wachtwoord bewaren.
- Viraliteit of een specifiek aantal volgers garanderen.
- 24/7 zelf "aan" staan — de cron-workflows triggeren mij; daarom doen we het via GitHub Actions.
