# TEOS Superintelligence — Team Onboarding

## Before You Write a Single Line of Code

| Step | Requirement | Hard Deadline |
|------|-------------|---------------|
| 1 | Provision `@elmahrosa.org` email | Day 0 |
| 2 | Complete all 4 Anthropic Academy learning paths | Day 7 |
| 3 | Sign LOI (on file with Ayman Seif) | Day 0 |
| 4 | Set Git commit email to `@elmahrosa.org` | Day 0 |
| 5 | 2FA enabled on GitHub | Day 0 |

## Repository Access

Repo: `github.com/Elmahrosa/teos-superintelligence`
Branch model: `main` (production) · `develop` (integration) · `feature/xxx` (work branches)

Never push directly to `main`. All merges via PR with ≥1 senior review.

## Local Setup

```bash
git clone https://github.com/Elmahrosa/teos-superintelligence.git
cd teos-superintelligence
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Get secrets from Ayman
uvicorn src.api.main:app --reload
```

## Architecture Overview

See `README.md` and `docs/ARCHITECTURE.md`.

## Commit Convention

```
feat(agents): add ResearchAgent with citation support
fix(sentinel): handle timeout edge case
test(memory): add Redis failure test
docs(api): update endpoint reference
```

## Secrets Policy

- Zero secrets in code or Git history
- All secrets via Railway environment variables or GitHub Secrets
- Rotate immediately if exposed

## Contact

Founder & CEO: Ayman Seif · ayman@elmahrosa.org
