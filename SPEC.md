# AI Incident Registry Specification

Version 1.0
Released under CC0 1.0 Universal (public domain).

## What This Is

AI Incident Registry is an open standard for documenting incidents where AI generated code caused production failures, security breaches, or compliance violations.

Each incident receives a unique identifier in the format AICI-YYYY-NNNN and a public entry in the registry.

## Identifier Format

AICI-YYYY-NNNN

- AICI: AI Code Incident
- YYYY: four digit year
- NNNN: zero padded sequential number

Example: AICI-2026-0001

## Scope

AICI covers incidents where:

- Code generated or suggested by an AI coding tool was deployed or merged.
- The code caused a measurable negative outcome (outage, breach, violation, rollback, data loss, or significant remediation effort).
- The incident is documented with enough detail to help others detect or prevent similar patterns.

Out of scope:

- Vulnerabilities discovered in released products without AI authorship context (use CVE).
- Harms from AI model outputs used directly by end users (use AI Incident Database).
- Attacks on AI systems (use MITRE ATLAS).

## What This Is Not

AICI is not a blame registry. It does not rank AI tools by failure count. It does not shame victim organizations. It is a learning resource for the industry.

## Report Schema

The standardized YAML format for an AICI report:

```yaml
# AI Incident Report
# Released under CC BY 4.0

schema: https://oss.korext.com/incidents/schema
version: "1.0"

identifier: AICI-2026-0047

status: published
# draft | submitted | under_review | published | redacted | withdrawn

title: "SQL injection in AI generated query builder using string concatenation"

summary: |
  An AI coding tool generated a user search function that concatenated user input into a SQL WHERE clause without parameterization. The vulnerable code passed code review and was deployed to production. Exploitation occurred within 72 hours.

severity: high
# informational | low | medium | high | critical

discovered_date: 2026-02-03
reported_date: 2026-02-12
published_date: 2026-02-20

ai_tool:
  name: GitHub Copilot
  version: "1.145"

affected_pattern:
  language: JavaScript
  framework: Node.js
  libraries: [mysql, express]
  cwe_references: [CWE-89]
  pattern_type: sql-injection

prompt_context:
  intent: "build user search function"
  context_provided: minimal
  # minimal | moderate | extensive

incorrect_pattern: |
  const query = `SELECT * FROM users
    WHERE name = '${name}'`;
  connection.query(query, callback);

correct_pattern: |
  const query = 'SELECT * FROM users
    WHERE name = ?';
  connection.query(query, [name], callback);

impact:
  confirmed_exploitations: 12
  estimated_impact_usd: 4000000
  affected_organizations: 8
  public_disclosure: yes
  # yes | no | partial

detection:
  korext_packs:
    - web-security
    - sql-injection-v1
  korext_rule_ids:
    - sqli-string-concat-001
  semgrep_rules: []
  snyk_rules: []
  codeql_queries: []

remediation:
  short_term: "Parameterize all SQL queries in user facing endpoints"
  long_term: "Adopt an ORM or query builder that enforces parameterization"

references:
  - type: writeup
    url: https://example.com/postmortem
  - type: cve
    id: CVE-2026-12345
  - type: advisory
    url: https://...

reporter:
  name: null
  organization: null
  contact: null
  verified: true

maintainer_notes:
  review_date: 2026-02-18
  reviewed_by: registry-team
  confidence: high
  # low | medium | high
```

## Contribution Workflow

1. **DRAFTING**: Reporter uses CLI (`npx @korext/incident-report draft`) or web form to compose.
2. **SUBMISSION**: Reporter submits via CLI or web. Anonymous submission accepted.
3. **INITIAL VALIDATION**: Schema validation automatic. Duplicate check against existing entries. PII scrubbing check.
4. **MAINTAINER REVIEW**: Registry maintainers review for accuracy, responsible disclosure timeline, appropriate redaction, and detection rule mapping.
5. **AFFECTED PARTY NOTIFICATION**: If AI tool vendor is named, they are notified with 14 day comment period before publication.
6. **PUBLICATION**: Entry published with assigned AICI identifier. RSS feed updated. Notifications sent to subscribers.
7. **ONGOING MAINTENANCE**: Corrections via PR to the registry repository. Redactions preserved for research integrity.

## Detection Rule Linking

A core differentiator: every incident links to detection rules that would have caught it. The registry web UI renders these links so organizations reading about the incident can implement the rules in their CI pipelines to prevent the same failure.
