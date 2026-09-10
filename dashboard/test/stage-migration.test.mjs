import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { migrateLegacyStages } from '../src/lib/pipeline-store.ts';

function migrate(row) {
  const book = { companies: [structuredClone(row)] };
  migrateLegacyStages(book);
  const once = structuredClone(book);
  assert.equal(migrateLegacyStages(book), false, 'second pass must be a no-op');
  assert.deepEqual(book, once);
  return book.companies[0].stage;
}

test('legacy statuses and canonical stages', () => {
  for (const [status, expected] of Object.entries({
    'pending-review': 'quality-check', 'pending-supervisor-review': 'quality-check',
    pending: 'quality-check', 'supervisor-approved': 'approval',
    'zach-approved': 'approval', sent: 'outreach', bounced: 'follow-up',
    rework: 'pitch', rejected: 'pitch',
  })) assert.equal(migrate({ stage: 'pitch', pitchDraft: { status } }), expected);
  assert.equal(migrate({stage: 'contacted'}), 'outreach');
  assert.equal(migrate({stage: 'response'}), 'follow-up');
});

test('legacy build repair precedes demo gate and is idempotent', () => {
  for (const id of ['mmk-pressure-washing', 'sky-branch-llc', 'fresh-start-pressure-washing']) {
    assert.equal(migrate({id, stage: 'build-launch', pitchDraft: {status: 'sent'}, demo: {status: 'pending', url: 'https://demo.invalid'}}), 'approval');
  }
  assert.equal(migrate({id: 'omega-auto', stage: 'build-launch'}), 'prospect');
});

test('pending demo fallback and implicit pending match queue semantics', () => {
  for (const url of ['', '   ', undefined]) {
    assert.equal(migrate({stage: 'outreach', demo: {url, status: 'pending'}, demoUrl: 'https://demo.invalid'}), 'approval');
  }
  assert.equal(migrate({stage: 'outreach', demoUrl: 'https://demo.invalid'}), 'approval');
  assert.equal(migrate({stage: 'outreach', demo: {status: 'pending', url: ''}}), 'outreach');
  assert.equal(migrate({stage: 'outreach', demo: {status: 'approved', url: 'https://demo.invalid'}}), 'outreach');
});

test('unproven sends are not outreach; bounces are not untouched prospects', () => {
  for (const stage of ['pitch', 'outreach', 'follow-up']) {
    assert.equal(migrate({stage, pitchDraft: {status: 'unproven-send'}}), 'pitch');
    assert.equal(migrate({stage, pitchDraft: {status: 'unproven-send', body: 'Draft'}}), 'quality-check');
    assert.equal(migrate({stage, pitchDraft: {status: 'unproven-send'}, demoUrl: 'https://demo.invalid'}), 'approval');
  }
  assert.equal(migrate({stage: 'prospect', pitchDraft: {status: 'bounced'}}), 'follow-up');
});

test('paying clients and later genuine wins are preserved', () => {
  for (const id of ['cc-headlight', 'mom-and-mop', 'redwood', 'new-paying-client']) {
    for (const stage of ['sale', 'build-launch']) {
      assert.equal(migrate({id, stage, pitchDraft: {status: 'sent'}, demo: {status: 'pending', url: 'https://demo.invalid'}}), stage);
    }
  }
  const book = {legacyBuildStageMigrationVersion: 1, companies: [{id: 'mmk-pressure-washing', stage: 'build-launch', pitchDraft: {status: 'sent'}}]};
  assert.equal(migrateLegacyStages(book), false);
  assert.equal(book.companies[0].stage, 'build-launch');
});

test('all 265 local rows are a fixed point and only the three confirmed clients are won', () => {
  const book = JSON.parse(fs.readFileSync(new URL('../data/pipeline.json', import.meta.url), 'utf8'));
  assert.equal(book.companies.length, 265);
  assert.equal(new Set(book.companies.map(c => c.id)).size, 265);
  const snapshot = structuredClone(book);
  assert.equal(migrateLegacyStages(book), false);
  assert.deepEqual(book, snapshot);
  const allowed = new Set(['prospect', 'audit', 'pitch', 'quality-check', 'approval', 'outreach', 'follow-up', 'sale', 'build-launch']);
  for (const c of book.companies) {
    assert.ok(allowed.has(c.stage), c.name);
    if (['outreach', 'follow-up'].includes(c.stage)) {
      assert.notEqual(c.pitchDraft?.status, 'unproven-send', c.name);
      const url = c.demo?.url?.trim() || c.demoUrl?.trim();
      assert.ok(!url || (c.demo?.status ?? 'pending') !== 'pending', c.name);
    }
  }
  assert.deepEqual(book.companies.filter(c => ['sale', 'build-launch'].includes(c.stage)).map(c => c.name).sort(), ['CC Headlight Restoration', 'Mom & A Mop', 'Redwood Landscaping']);
});
