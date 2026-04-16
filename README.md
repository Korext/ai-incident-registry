# AI Incident Registry

The public registry and open standard for cataloging AI code failures.

[![License: Code](https://img.shields.io/badge/code-Apache%202.0-blue)](LICENSE)
[![License: Spec](https://img.shields.io/badge/spec-CC0%201.0-green)](LICENSE-SPEC)
[![License: Data](https://img.shields.io/badge/data-CC%20BY%204.0-orange)](LICENSE-DATA)
[![npm](https://img.shields.io/npm/v/@korext/incident-report)](https://www.npmjs.com/package/@korext/incident-report)

When AI generated code causes a production failure, security breach, or compliance violation, the lessons are usually buried in private postmortems. The same patterns repeat across thousands of organizations because nobody shares what went wrong.

AI Incident Registry changes that. It is the CVE equivalent for AI authored code failures.

## Browse the Registry

[oss.korext.com/incidents](https://oss.korext.com/incidents)

## Report an Incident

```bash
npx @korext/incident-report draft
```

Anonymous submissions welcome.

## Identifier Format

AICI-YYYY-NNNN

Example: AICI-2026-0047

## What Belongs Here

AICI covers incidents where AI generated code caused a measurable negative outcome. Examples:

- SQL injection that shipped after AI suggestion
- Hallucinated API that passed review and failed in production
- Missing authentication in AI generated admin endpoint
- Off-by-one error in AI generated loop logic
- Deprecated dependency introduced by AI suggestion

## What Does Not Belong Here

- General software vulnerabilities not tied to AI authorship (use CVE)
- Harms caused by AI models to end users (use AI Incident Database)
- Attacks on AI systems (use MITRE ATLAS)

## Why This Exists

Regulatory pressure is mounting. The EU AI Act, SOX auditors, and insurance questionnaires are all asking about AI generated code. Without public incident data, risk assessment is guesswork.

Engineering teams need to know which AI code patterns have caused real incidents. This registry provides that knowledge.

## Ethical Commitments

1. No victim blaming. Reports describe patterns, not shame organizations.
2. Anonymization by default. Reporter identity is optional.
3. Responsible disclosure. Active vulnerabilities follow 90 day disclosure.
4. No AI tool shaming. We document what happened, not which tool is "bad."
5. Verification before publication. Every report is reviewed.
6. Right to redact. Corrections preserved for research integrity.

See [ETHICS.md](ETHICS.md).

## Detection Rule Mapping

Every incident links to detection rules that would have caught it. This is the operational difference from traditional vulnerability databases. CVE tells you what broke. AICI tells you what would have prevented it.

## Feeds

Subscribe to the RSS or Atom feed:

- RSS: https://oss.korext.com/incidents/feed.xml
- Atom: https://oss.korext.com/incidents/feed.atom

Filter by severity, tool, or language via query parameters.

## API

Full API documentation at [oss.korext.com/incidents/api](https://oss.korext.com/incidents/api).

Endpoints:

- `GET /api/incidents/[id]` - Retrieve incident
- `GET /api/incidents/search` - Full text search
- `GET /api/incidents/export` - Bulk data export (CC BY 4.0)
- `POST /api/incidents/submit` - Submit incident
- `POST /api/incidents/notifications/subscribe` - Subscribe to alerts

## Specification

See [SPEC.md](SPEC.md). Released under [CC0 1.0](LICENSE-SPEC).

## Data License

All published incident data is released under [CC BY 4.0](LICENSE-DATA). Attribution to the registry and reporter is required.

## Prior Art

See [PRIOR_ART.md](PRIOR_ART.md). AI Incident Registry complements CVE, OSV, AVID, AI Incident Database, and MITRE ATLAS.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

To propose a new pattern type, submit a PR to SPEC.md.

To become a registry reviewer, contact [maintainers@korext.com](mailto:maintainers@korext.com).

## Built by

[Korext](https://korext.com) builds AI code governance tools. AI Incident Registry is an open community resource maintained by the Korext team.
