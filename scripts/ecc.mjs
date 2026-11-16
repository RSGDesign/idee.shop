// Project-local ECC lifecycle. No global settings, hook activation or MCP setup.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pin = JSON.parse(fs.readFileSync(path.join(root, '.ecc/source.json'), 'utf8'));
const source = path.join(root, '.ecc/upstream');
const action = process.argv[2] || 'doctor';
function restore() {
  const archive = path.join(root, pin.archive);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  if (hash !== pin.sha256) throw new Error('ECC archive checksum mismatch.');
  if (!fs.existsSync(path.join(source, 'package.json'))) {
    const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 10000000 }).split('\n');
    if (entries.some(p => p.startsWith('/') || p.split('/').includes('..'))) throw new Error('Unsafe archive path.');
    fs.mkdirSync(source, { recursive: true });
    execFileSync('tar', ['-xzf', archive, '-C', source]);
  }
  if (!fs.existsSync(path.join(source, 'node_modules/js-yaml'))) {
    execFileSync('npm', ['install', '--omit=dev', '--ignore-scripts', '--package-lock=false', '--no-audit', '--no-fund'], { cwd: source, stdio: 'inherit' });
  }
}
if (!['restore', 'plan', 'install', 'doctor'].includes(action)) throw new Error('Use restore, plan, install or doctor.');
if (action === 'restore') { restore(); console.log('Pinned ECC source restored locally.'); }
else {
  if (!fs.existsSync(path.join(source, 'node_modules/js-yaml'))) throw new Error('Run npm run ecc:restore first.');
  const require = createRequire(path.join(source, 'package.json'));
  const options = { projectRoot: root, sourceRoot: source, repoRoot: source, homeDir: path.join(root, '.ecc/local-home'), env: {} };
  if (action === 'doctor') {
    const { buildDoctorReport } = require('./scripts/lib/install-lifecycle.js');
    const report = buildDoctorReport({ ...options, targets: ['antigravity'] });
    console.log(JSON.stringify(report, null, 2));
    if (report.results.length === 0 || report.results.some(r => r.status !== 'ok')) process.exitCode = 1;
    // Also verify every canonical skill is available, including profile omissions.
    const missing = fs.readdirSync(path.join(source, 'skills')).filter(name => fs.existsSync(path.join(source, 'skills', name, 'SKILL.md')) && !fs.existsSync(path.join(root, '.agents/skills', name, 'SKILL.md')));
    if (missing.length) { console.error('Missing skills:', missing); process.exitCode = 1; }
  } else {
    const { createInstallPlanFromRequest } = require('./scripts/lib/install/runtime.js');
    const { previewInstallPlan, applyInstallPlan } = require('./scripts/lib/install-executor.js');
    const canonicalSkills = fs.readdirSync(path.join(source, 'skills')).filter(name => fs.existsSync(path.join(source, 'skills', name, 'SKILL.md')));
    const request = { mode: 'manifest', target: 'antigravity', profileId: 'full', moduleIds: [], includeComponentIds: canonicalSkills.map(name => `skill:${name}`), excludeComponentIds: [], hookConsent: 'declined' };
    // Relocate our managed state only after checking each installed byte digest.
    // This supports a Git clone/new project path without adopting unknown files.
    const statePath = path.join(root, '.agents/ecc-install-state.json');
    if (action === 'install' && fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      const expectedRoot = path.join(root, '.agents');
      if (state.target.root !== expectedRoot) {
        const oldRoot = state.target.root;
        if (path.basename(oldRoot) !== '.agents') throw new Error('Invalid previous install root.');
        for (const op of state.operations) {
          const rel = path.relative(oldRoot, op.destinationPath);
          if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Unsafe recorded path.');
          const current = path.join(expectedRoot, rel);
          if (fs.existsSync(current)) {
            const hash = crypto.createHash('sha256').update(fs.readFileSync(current)).digest('hex');
            if (!op.contentSha256 || hash !== op.contentSha256) throw new Error(`Modified managed file during relocation: ${rel}. Preserve it and review manually.`);
          }
        }
        const oldProject = path.dirname(oldRoot);
        const relocate = value => typeof value === 'string' ? (value === oldProject || value.startsWith(oldProject + path.sep) ? root + value.slice(oldProject.length) : value) : Array.isArray(value) ? value.map(relocate) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k,v])=>[k,relocate(v)])) : value;
        fs.writeFileSync(statePath, JSON.stringify(relocate(state), null, 2) + '\n');
      }
    }
    const plan = createInstallPlanFromRequest(request, options);
    // The extracted archive has no Git metadata; never record the parent app commit.
    plan.statePreview.source.repoCommit = pin.commit;
    for (const op of plan.operations) {
      if (op.kind !== 'copy-file' || !op.destinationPath.startsWith(path.join(root, '.agents') + path.sep)) throw new Error('Unexpected ECC operation outside project .agents.');
    }
    if (action === 'plan') {
      const preview = previewInstallPlan(plan);
      console.log(JSON.stringify({ profile: 'full', operations: preview.operations.length, skippedModules: preview.skippedModuleIds, warnings: preview.warnings }, null, 2));
    } else {
      const result = applyInstallPlan(plan);
      console.log(JSON.stringify({ applied: result.applied, operations: result.operations.length, warnings: result.warnings }, null, 2));
    }
  }
}
