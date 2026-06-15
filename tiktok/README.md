# AI Brand Engine — TikTok Autopilot

Een zelf-verbeterend systeem dat dagelijks faceless AI-content post op TikTok,
een consistent visueel merk opbouwt, en wekelijks een strateeg-audit draait die
de strategie automatisch bijwerkt. Einddoel: een groot, wereldwijd Engelstalig
merk dat later een **AI-SaaS** lanceert naar een warme audience.

> ⚠️ **Eerlijk over de grenzen.** Dit systeem maximaliseert je kansen — het
> garandeert geen viraliteit of follower-aantallen (niemand kan dat eerlijk).
> Echte "autopilot" vereist eenmalig dat _jij_ een TikTok developer-app koppelt
> (zie `SETUP.md`); ik kan geen account aanmaken of wachtwoorden bewaren.

## Hoe het werkt (overzicht)

```
                    ┌───────────────────────────────────────────┐
                    │  STRATEGY.md  ◄── elke maandag bijgewerkt   │
                    │  (positionering, pillars, hooks, learnings) │
                    └───────────────┬───────────────────────────┘
                                    │ stuurt
                                    ▼
   ┌──────────────┐   dagelijks   ┌──────────────────┐   17:00   ┌──────────┐
   │ content-      │ ────────────► │ generate (AI img/ │ ───────► │ TikTok    │
   │ calendar.md   │   pijplijn    │ video/voice)      │  API post │ account   │
   └──────────────┘               └──────────────────┘           └────┬─────┘
                                                                       │ metrics
                    ┌───────────────────────────────────────────┐     │
                    │  Maandag-audit  ◄──────────────────────────┘     │
                    │  analyseert prestaties + trends, schrijft   ◄─────┘
                    │  learnings terug naar STRATEGY.md           │
                    └─────────────────────────────────────────────┘
```

## Bestanden

| Bestand | Wat |
|---|---|
| `STRATEGY.md` | De levende strategie. Wordt elke maandag door de audit bijgewerkt. |
| `BRAND.md` | Visuele identiteit + consistente AI-persona (prompt-recepten). |
| `AUDIT.md` | De methodologie van de wekelijkse strateeg-audit. |
| `content-calendar.md` | Posting-cadans en rotatie van content-pillars. |
| `config.yml` | Centrale instellingen (posttijd, niche, pillars, handles). |
| `SETUP.md` | Eenmalige setup die **jij** moet doen (TikTok dev-app + secrets). |
| `content/` | Per-week contentbriefs (hook, script, visuals, caption, hashtags). |
| `audits/` | Audit-template + wekelijkse audit-logs (de "leer"-geschiedenis). |
| `scripts/post_to_tiktok.py` | Posten via de officiële TikTok Content Posting API. |
| `.github/workflows/` | Cron-jobs: dagelijkse post + wekelijkse audit. |

## Snelstart

1. Lees `SETUP.md` en koppel je TikTok developer-app (eenmalig).
2. Vul `config.yml` en de GitHub secrets in.
3. De workflows draaien daarna automatisch. De eerste week content staat al klaar
   in `content/week-01.md`.

## Status

- [ ] TikTok developer-app aangemaakt + goedgekeurd (jij)
- [ ] GitHub secrets ingevuld (jij)
- [x] Strategie, merk, audit-systeem en pijplijn opgezet (Claude)
- [x] Eerste week content gebrieft (Claude)
