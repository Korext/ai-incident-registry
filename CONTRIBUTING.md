# Contributing to the AI Incident Registry

We welcome contributions to the AI Incident Registry from security researchers, engineers, and AI practitioners.

## How to Contribute

There are three ways to contribute to this project:

### 1. Report an Incident
The most impactful way to contribute is to share a failure pattern you encountered. 
- Use the CLI tool: `npx @korext/incident-report draft`
- Or use the web form at `https://oss.korext.com/incidents/submit`

Anonymous submissions are accepted and encouraged if you cannot expose your organization's name.

### 2. Improve the Specification
We continuously refine our taxonomy and schema.
To propose a new pattern type or modify the YAML format:
- Open a Pull Request modifying `SPEC.md` or `TAXONOMY.md`.
- Include reasoning and at least one real-world example incident that necessitates the classification.
- Any merge requires review by the Maintainer Committee.

### 3. Improve the Tooling
Contributions to the CLI (`@korext/incident-report`), the GitHub Action, or the Next.js UI are welcome.
- Code contributions are licensed under Apache 2.0.
- Ensure your changes do not introduce new dependencies without discussion. The CLI uses only `js-yaml` and `marked` by design.

## Maintainer Roles
If you are an independent security researcher and wish to join the Maintainer Committee to review incoming incident reports, please email `maintainers@korext.com`.

## Code of Conduct
All contributors must adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).
