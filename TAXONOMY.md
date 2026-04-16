# AI Incident Registry Taxonomy

This document defines the controlled vocabularies used within the AI Incident Registry. This taxonomy has been created originally to categorize AI authored code failures.

## Severity Levels

*   **informational**: Documented for research and tracking, no immediate action required.
*   **low**: Minor failure or issue, easily remedied.
*   **medium**: Moderate impact, requires structured remediation.
*   **high**: Significant impact, urgent remediation required to prevent or stop active damage.
*   **critical**: Severe impact, immediate emergency remediation required.

## Pattern Types

*   **injection**: SQL, command, LDAP, XPath, or other injection vulnerabilities written by AI.
*   **authentication**: Bypass flaws, hardcoded credentials, weak authentication flows.
*   **authorization**: Missing checks, Broken Access Control, privilege escalation.
*   **cryptography**: Weak crypto choices, bad random number generation, insecure transport setup.
*   **data-exposure**: Logging secrets, sensitive data leakage, PII exposure in error endpoints.
*   **resource**: Memory leaks, algorithmic payloads causing Denial of Service (DoS), connection string mismanagement.
*   **logic**: Off-by-one errors, race conditions, incorrect business logic.
*   **hallucination**: Nonexistent API endpoints, fake documentation references, hallucinated libraries and functions.
*   **performance**: Algorithmic complexity resulting in massive system lag.
*   **compliance**: Regulatory violation (e.g., exposing unconsented tracking variables).
*   **dependency**: Deprecated or known vulnerable dependency introduced by an AI suggestion.

## Status Lifecycle

*   **draft**: Being composed, not yet submitted to the registry.
*   **submitted**: Sent to the registry queue, awaiting triage.
*   **under_review**: Registry maintainers currently investigating.
*   **published**: Live in the registry and accessible universally.
*   **redacted**: Published but subsequently corrected with substantial redactions.
*   **withdrawn**: Retracted completely by the reporter or the registry maintainers.
