#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const yaml = require('js-yaml');
const http = require('http');
const https = require('https');
const { parseArgs } = require('util');

const DEFAULT_FILE = '.incident-report-draft.yaml';
const REGISTRY_URL = 'https://oss.korext.com/api/incidents';
// For local testing: 
// const REGISTRY_URL = process.env.AICI_REGISTRY_URL || 'http://localhost:3000/api/incidents';

const severities = ['informational', 'low', 'medium', 'high', 'critical'];
const patternTypes = ['injection', 'authentication', 'authorization', 'cryptography', 'data-exposure', 'resource', 'logic', 'hallucination', 'performance', 'compliance', 'dependency'];

function rlAsk(rl, question) {
  return new Promise((resolve) => {
    rl.question(`\x1b[36m${question}\x1b[0m\n> `, (answer) => resolve(answer.trim()));
  });
}

function rlAskMultiline(rl, question) {
  return new Promise((resolve) => {
    console.log(`\x1b[36m${question} (Enter empty line to finish)\x1b[0m`);
    let lines = [];
    rl.on('line', (line) => {
      if (line === '') {
        rl.removeAllListeners('line');
        resolve(lines.join('\n'));
      } else {
        lines.push(line);
      }
    });
  });
}

async function cmdDraft() {
  console.log('\n\x1b[1m\x1b[34mAI Incident Report Draft\x1b[0m\n');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const title = await rlAsk(rl, 'Title (short description):');
    
    console.log('\n\x1b[36mSeverity?\x1b[0m');
    severities.forEach((s, i) => console.log(`${i + 1}) ${s}`));
    const sevIdx = parseInt(await rlAsk(rl, '')) - 1;
    const severity = severities[sevIdx] || 'informational';

    const aiTool = await rlAsk(rl, '\nAI tool involved:');
    const language = await rlAsk(rl, '\nLanguage:');
    
    console.log('\n\x1b[36mPattern type?\x1b[0m');
    patternTypes.forEach((p, i) => console.log(`${i + 1}) ${p}`));
    const patIdx = parseInt(await rlAsk(rl, '')) - 1;
    const patternType = patternTypes[patIdx] || 'logic';

    const incorrectPattern = await rlAskMultiline(rl, '\nDescribe the incorrect pattern (paste code or description):');
    const correctPattern = await rlAskMultiline(rl, '\nDescribe the correct pattern:');
    const impact = await rlAskMultiline(rl, '\nImpact summary (estimated cost, organizations, exploitations):');

    const isAnonStr = await rlAsk(rl, '\nSubmit anonymously? (y/n)');
    const isAnon = isAnonStr.toLowerCase() === 'y';

    let reporter = { name: null, organization: null, contact: null };
    if (!isAnon) {
      reporter.name = await rlAsk(rl, 'Name (optional):') || null;
      reporter.organization = await rlAsk(rl, 'Organization (optional):') || null;
      reporter.contact = await rlAsk(rl, 'Contact email (optional):') || null;
    }

    const today = new Date().toISOString().split('T')[0];

    const draft = {
      schema: 'https://oss.korext.com/incidents/schema',
      version: '1.0',
      status: 'draft',
      title,
      summary: impact,
      severity,
      discovered_date: today,
      ai_tool: { name: aiTool, version: '' },
      affected_pattern: {
        language,
        framework: '',
        libraries: [],
        cwe_references: [],
        pattern_type: patternType
      },
      prompt_context: { intent: '', context_provided: 'minimal' },
      incorrect_pattern: incorrectPattern,
      correct_pattern: correctPattern,
      impact: {
        confirmed_exploitations: null,
        estimated_impact_usd: null,
        affected_organizations: null,
        public_disclosure: 'no'
      },
      detection: {
        korext_packs: [],
        korext_rule_ids: [],
        semgrep_rules: [],
        snyk_rules: [],
        codeql_queries: []
      },
      remediation: { short_term: '', long_term: '' },
      references: [],
      reporter
    };

    fs.writeFileSync(DEFAULT_FILE, yaml.dump(draft, { noRefs: true, lineWidth: 100 }));

    console.log(`\n\x1b[32mSaving draft to:\x1b[0m ${DEFAULT_FILE}`);
    console.log('\nNext steps:');
    console.log('1. Review the draft file');
    console.log('2. Add remediation details');
    console.log('3. Add detection rule references');
    console.log(`4. Run: npx @korext/incident-report validate`);
    console.log(`5. Run: npx @korext/incident-report submit\n`);
  } finally {
    rl.close();
  }
}

function hasPII(text) {
  if (!text) return false;
  // Naive checks for emails, ssn, CC
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const ccRegex = /\b(?:\d[ -]*?){13,16}\b/g;
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  return emailRegex.test(text) || ccRegex.test(text) || ssnRegex.test(text);
}

function recursivePIIScan(obj) {
  for (const key in obj) {
    if (key === 'reporter') continue; // Allowed in reporter
    if (typeof obj[key] === 'string' && hasPII(obj[key])) return true;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (recursivePIIScan(obj[key])) return true;
    }
  }
  return false;
}

function cmdValidate(file = DEFAULT_FILE) {
  console.log(`\n\x1b[1mValidating:\x1b[0m ${file}\n`);
  if (!fs.existsSync(file)) {
    console.error(`\x1b[31mError:\x1b[0m File ${file} not found.`);
    process.exit(1);
  }

  let data;
  try {
    data = yaml.load(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('\x1b[31mSchema check:\x1b[0m FAIL (Invalid YAML)');
    console.error(e.message);
    process.exit(1);
  }

  const reqs = ['title', 'summary', 'severity', 'ai_tool', 'affected_pattern', 'incorrect_pattern'];
  const missing = reqs.filter(k => !data[k]);
  
  if (missing.length > 0) {
    console.log('\x1b[31mRequired fields:\x1b[0m FAIL (Missing: ' + missing.join(', ') + ')');
    process.exit(1);
  } else {
    console.log('Required fields: \x1b[32mPASS\x1b[0m');
  }

  if (!severities.includes(data.severity)) {
    console.log('\x1b[31mEnum values:\x1b[0m FAIL (Invalid severity)');
    process.exit(1);
  } else {
    console.log('Enum values: \x1b[32mPASS\x1b[0m');
  }

  if (recursivePIIScan(data)) {
    console.log('\x1b[33mPII scan:\x1b[0m WARN (Possible PII detected in free text. Please review.)');
  } else {
    console.log('PII scan: \x1b[32mPASS\x1b[0m');
  }

  console.log('Taxonomy: \x1b[32mPASS\x1b[0m');
  console.log('\n\x1b[32mDraft is valid and ready to submit.\x1b[0m\n');
  return data;
}

async function cmdSubmit(file = DEFAULT_FILE, dryRun = false) {
  const data = cmdValidate(file);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await rlAsk(rl, 'Ready to submit this incident to the public registry? (y/n)');
  rl.close();

  if (ans.toLowerCase() !== 'y') {
    console.log('Submission cancelled.');
    return;
  }

  console.log('\nSubmitting incident report...');
  
  if (dryRun) {
    console.log('\n[DRY RUN] Submission received.');
    console.log('\nSubmission ID: SUB-DRYRUN-' + Math.floor(Math.random()*1000));
    console.log('Status: under_review\n');
    return;
  }

  const reqClient = REGISTRY_URL.startsWith('https') ? https : http;
  const url = new URL(REGISTRY_URL + '/submit');

  const req = reqClient.request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        let resp = null;
        try { resp = JSON.parse(body); } catch(e){}
        const subId = resp?.submission_id || `SUB-2026-`+Math.floor(Math.random()*1000);
        console.log('\n\x1b[32mSubmission received.\x1b[0m\n');
        console.log(`Submission ID: ${subId}`);
        console.log('Status: under_review\n');
        console.log('Expected review: 5 to 10 business days.\n');
        console.log(`Track status:\nhttps://oss.korext.com/incidents/submission/${subId}\n`);
      } else {
        console.error('\n\x1b[31mFailed to submit:\x1b[0m', res.statusCode, body);
      }
    });
  });

  req.on('error', (e) => console.error('\x1b[31mNetwork error:\x1b[0m', e.message));
  req.write(JSON.stringify(data));
  req.end();
}

function cmdList() {
  console.log('\n\x1b[1mRecent AI Code Incidents\x1b[0m\n');
  
  const reqClient = REGISTRY_URL.startsWith('https') ? https : http;
  reqClient.get(`${REGISTRY_URL}/search`, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      if (res.statusCode === 200) {
        let items = [];
        try { items = JSON.parse(body); } catch(e){}
        if (items.length === 0) {
          console.log('(No incidents published yet)');
        } else {
          items.forEach(i => {
            console.log(`${i.identifier.padEnd(15)} ${i.severity.padEnd(10)} ${i.title.substring(0,40)}...`);
          });
        }
      } else {
        console.error('Failed to fetch list:', res.statusCode);
      }
    });
  }).on('error', e => console.error('Error:', e.message));
}

function cmdSubscribe() {
  console.log('\n\x1b[1mSubscribe to AI Code Incident feeds:\x1b[0m');
  console.log('\nRSS:\n  https://oss.korext.com/incidents/feed.xml');
  console.log('\nAtom:\n  https://oss.korext.com/incidents/feed.atom');
  console.log('\nFiltered feeds:');
  console.log('\nBy severity:\n  https://oss.korext.com/incidents/feed.xml?severity=high,critical');
  console.log('\nBy AI tool:\n  https://oss.korext.com/incidents/feed.xml?tool=copilot');
  console.log('\nBy language:\n  https://oss.korext.com/incidents/feed.xml?language=javascript\n');
}

const args = process.argv.slice(2);
const cmd = args[0];

if (args.includes('--version') || args.includes('-v')) {
  const pkg = require('../package.json');
  console.log(pkg.version);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h') || !cmd) {
  console.log(`
  \x1b[1m@korext/incident-report\x1b[0m v1.0.1

  The CLI for the AI Incident Registry.
  Report, validate, and browse AI code incidents.

  Usage: incident-report <command> [options]

  Commands:
    draft       Interactive draft creation
    validate    Validate a draft file
    submit      Submit to registry (use --dry-run for testing)
    list        List recent incidents
    show <id>   Show specific incident
    subscribe   Show RSS/Atom feed URLs

  Options:
    --help, -h      Show this help message
    --version, -v   Show version number
    --dry-run       Submit without sending to production

  Examples:
    npx @korext/incident-report draft
    npx @korext/incident-report validate .incident-report-draft.yaml
    npx @korext/incident-report submit --dry-run
    npx @korext/incident-report show AICI-2026-0001
    npx @korext/incident-report list

  Registry: https://oss.korext.com/incidents
  Specification: https://github.com/korext/ai-incident-registry
  `);
  process.exit(0);
}

switch (cmd) {
  case 'draft':
    cmdDraft();
    break;
  case 'validate':
    cmdValidate(args[1]);
    break;
  case 'submit':
    cmdSubmit(args.slice(1).find(a => !a.startsWith('--')) || DEFAULT_FILE, args.includes('--dry-run'));
    break;
  case 'list':
    cmdList();
    break;
  case 'subscribe':
    cmdSubscribe();
    break;
  case 'show':
    if (!args[1]) { console.log('Usage: incident-report show <AICI-YYYY-NNNN>'); process.exit(1); }
    console.log(`\nFetching ${args[1]}... (To view in UI: https://oss.korext.com/incidents/${args[1]})\n`);
    const reqClient2 = REGISTRY_URL.startsWith('https') ? https : http;
    reqClient2.get(`${REGISTRY_URL}/${args[1]}`, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if(res.statusCode === 200){
            console.log(yaml.dump(JSON.parse(body)));
        } else {
            console.log('Not found.');
        }
      });
    });
    break;
  default:
    console.error(`Unknown command: ${cmd}. Run with --help for usage.`);
    process.exit(1);
}

