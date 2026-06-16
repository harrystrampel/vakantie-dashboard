# ROUTINES — van losse productie naar zelflopend systeem

> Doel: VECTOR draait als routine, niet als losse handmatige video's. Drie lagen, met
> bewuste menselijke checkpoints voor kwaliteit.

## De drie lagen
| Laag | Wat | Frequentie | Mechanisme | Mens? |
|---|---|---|---|---|
| **1. Content-batch** | Virlo-trends ophalen → carousels genereren → virality-check → winnaars in `content/queue.json` | wekelijks | geplande Claude-sessie | jij keurt de batch |
| **2. Posten** | Leest queue → post via TikTok-API | dagelijks | GitHub Actions cron (`scripts/post_to_tiktok.py`) | nee |
| **3. Audit** | Echte cijfers ophalen → `STRATEGY.md` + recept bijwerken | wekelijks (ma) | geplande Claude-sessie | jij keurt aanpassingen |

## Wat nu al headless kan (geen approval nodig)
- Carousel-/beeldgeneratie + virality-checker → **carousels kunnen volledig op de automaat**.
- Posten via TikTok-API (zodra `SETUP.md` af is).

## Wat (nog) handmatig/lokaal blijft
- **Premium video's** via Marketing Studio (vereist tool-approval → lokale Claude Code op Mac).
- **Kwaliteitsgoedkeuring** van de wekelijkse batch (bewust ingebouwd, geen slechte content live).

## Makkelijkste pad naar LIVE (volgorde)
1. **Carousels** als ruggengraat (kan headless, hoogste bereik, laagste risico).
2. **TikTok Content Posting API** koppelen (`SETUP.md`). Loopt de review traag? Tijdelijk een
   scheduler (Buffer/Metricool) waar je alleen inlogt.
3. **Routine aanzetten:** geplande sessie voor de wekelijkse batch + audit, cron voor dagelijks posten.
4. **Video erbij** zodra de lokale Marketing-Studio-flow staat.

## Aanzet-mechanismen
- Geplande sessies/triggers in Claude Code (wekelijkse batch + audit).
- GitHub Actions cron (dagelijks posten) — workflows staan klaar in `.github/workflows/`.
- `send_later`/loop voor terugkerende check-ins.
