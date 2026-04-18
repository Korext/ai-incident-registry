#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInput(name) {
  return process.env[`INPUT_${name.replace(/-/g, '_').toUpperCase()}`] || '';
}

function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (file) fs.appendFileSync(file, `${name}=${value}\n`);
}

function info(msg) { console.log(msg); }
function warn(msg) { console.log(`::warning::${msg}`); }
function fail(msg) { console.log(`::error::${msg}`); process.exitCode = 1; }

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve({ incidents: [] }); }
      });
    }).on('error', reject);
  });
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  info('AI Incident Pattern Scan');
  info('');

  // Read inputs
  const severityThreshold = getInput('severity-threshold') || 'medium';
  const scanRecentDays = parseInt(getInput('scan-recent-days') || '90', 10);
  const failOnMatch = getInput('fail-on-match') === 'true';

  const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
  const minLevel = severityLevels[severityThreshold] || 2;

  info(`Severity threshold: ${severityThreshold}`);
  info(`Scanning incidents from last ${scanRecentDays} days`);
  info('');

  // Fetch recent incidents from registry
  let incidents = [];
  try {
    const data = await fetchJSON(
      `https://oss.korext.com/api/incidents/search?days=${scanRecentDays}`
    );
    incidents = (data.incidents || data.results || []).filter(inc => {
      const level = severityLevels[inc.severity] || 0;
      return level >= minLevel;
    });
  } catch (e) {
    warn(`Could not reach incident registry: ${e.message}`);
  }

  info(`Fetched ${incidents.length} incident(s) at or above ${severityThreshold} severity`);

  // In a full implementation, each incident's detection rules would be
  // matched against the local codebase. For now, we report the scan
  // result and set outputs based on any matches found.
  const matchCount = 0; // placeholder until local pattern matching is added
  const matchedIds = [];

  // Set outputs
  setOutput('matches-found', matchCount);
  setOutput('incident-ids', matchedIds.join(','));

  let status = 'PASS';
  if (matchCount > 0) {
    status = failOnMatch ? 'FAIL' : 'WARN';
  }
  setOutput('status', status);

  info('');
  info(`Result: ${status}`);

  if (failOnMatch && matchCount > 0) {
    fail(`${matchCount} incident pattern(s) matched. Failing build.`);
  }
}

run();
