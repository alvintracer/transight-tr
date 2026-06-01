/**
 * TranSight TR — E2E 테스트 스크립트
 * 
 * 전체 8단계 핸드셰이크 + 모든 API 엔드포인트 검증
 * 
 * 사용법:
 *   node scripts/e2e-test.mjs
 *   node scripts/e2e-test.mjs --base-url https://your-project.supabase.co/functions/v1
 */

const BASE_URL = process.argv.includes('--base-url')
  ? process.argv[process.argv.indexOf('--base-url') + 1]
  : 'https://qyyqsuzqstkhnrmyqskn.supabase.co/functions/v1';

const ANON_KEY = process.env.SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5eXFzdXpxc3RraG5ybXlxc2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODAwNDcsImV4cCI6MjA4MzI1NjA0N30.k-fm8CaeqdkJLwxcEQo8XeCjpLZd34K-l2m-7fovxic';

const headers = {
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

let passed = 0;
let failed = 0;
const errors = [];

// ============================================================
// Test Helpers
// ============================================================

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    errors.push({ name, error: err.message });
    console.log(`  ❌ ${name} — ${err.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

function uid() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// Test Suites
// ============================================================

async function testHealth() {
  console.log('\n🏥 Health Check');
  await test('GET /health returns status up', async () => {
    const { data } = await api('GET', '/health');
    assert(data.status === 'up', `Expected "up", got "${data.status}"`);
    assert(data.service === 'TranSight Hub', `Wrong service name`);
  });
}

async function testVaspRegistry() {
  console.log('\n📋 VASP Registry');
  const testVaspId = uid();

  await test('GET /vasp-registry returns VASP list', async () => {
    const { data } = await api('GET', '/vasp-registry');
    assert(data.vasps && data.vasps.length > 0, 'No VASPs found');
    assert(typeof data.total === 'number', 'Missing total count');
  });

  await test('GET /vasp-registry?alliance=code filters', async () => {
    const { data } = await api('GET', '/vasp-registry?alliance=code');
    assert(data.vasps.every(v => v.allianceName === 'code'), 'Filter not working');
  });

  await test('POST /vasp-registry registers new VASP', async () => {
    const { status, data } = await api('POST', '/vasp-registry', {
      vasp_entity_id: testVaspId,
      vasp_name: 'E2E Test VASP',
      vasp_legal_name: 'E2E Test Inc.',
      country_of_registration: 'KR',
      alliance_name: 'transight',
      endpoint_url: 'https://test.example.com',
      public_key: 'dGVzdC1wdWJsaWMta2V5LWUyZQ==',
    });
    assert(status === 201, `Expected 201, got ${status}: ${JSON.stringify(data)}`);
    assert(data.vasp.vasp_entity_id === testVaspId, 'Wrong vasp ID');
  });

  await test('GET /vasp-registry?id= returns single VASP', async () => {
    const { data } = await api('GET', `/vasp-registry?id=${testVaspId}`);
    assert(data.vasp_entity_id === testVaspId, 'Wrong vasp');
  });

  await test('POST /vasp-registry/address-verify works', async () => {
    const { data } = await api('POST', '/vasp-registry/address-verify', {
      address: '0xTest123',
      currency: 'ETH',
      beneficiaryVaspEntityId: testVaspId,
    });
    assert(data.verified === true, `Address not verified: ${JSON.stringify(data)}`);
  });

  await test('DELETE /vasp-registry?id= removes VASP', async () => {
    const { status } = await api('DELETE', `/vasp-registry?id=${testVaspId}`);
    assert(status === 200, `Expected 200, got ${status}`);
  });
}

async function testTransferAuth() {
  console.log('\n💸 Transfer Authorization');
  const txId = uid();

  await test('POST /transfer-auth creates outgoing transfer', async () => {
    const { status, data } = await api('POST', '/transfer-auth', {
      transferId: txId,
      currency: 'BTC',
      amount: '0.5',
      payload: 'dGVzdA==',
      beneficiaryVaspEntityId: 'transight-hub',
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(data.result === 'verified', `Expected verified, got ${data.result}`);
    assert(data.kyt && data.kyt.decision === 'PASS', 'KYT not PASS');
    assert(data.adapter && data.adapter.protocol, 'Missing adapter info');
  });

  await test('GET /transfer-auth?id= returns transfer', async () => {
    const { data } = await api('GET', `/transfer-auth?id=${txId}`);
    assert(data.transferId === txId, 'Wrong transfer');
    assert(data.status === 'verified', `Wrong status: ${data.status}`);
  });

  await test('POST /transfer-auth duplicate returns 409', async () => {
    const { status } = await api('POST', '/transfer-auth', {
      transferId: txId,
      currency: 'BTC',
      amount: '0.5',
      payload: 'dGVzdA==',
    });
    assert(status === 409, `Expected 409, got ${status}`);
  });

  await test('POST /transfer-auth/result reports TXID', async () => {
    const { data } = await api('POST', '/transfer-auth/result', {
      transferId: txId,
      txid: '0xabc123def456',
    });
    assert(data.result === 'success', `Expected success, got ${data.result}`);
    assert(data.status === 'confirmed', `Expected confirmed, got ${data.status}`);
  });

  // Cancel test
  const cancelId = uid();
  await test('POST /transfer-auth + finish cancels', async () => {
    await api('POST', '/transfer-auth', {
      transferId: cancelId,
      currency: 'ETH',
      amount: '1',
      payload: 'dGVzdA==',
    });
    const { data } = await api('POST', '/transfer-auth/finish', {
      transferId: cancelId,
      reasonType: 'E2E_TEST',
      reasonMsg: 'Cancelled by E2E test',
    });
    assert(data.status === 'canceled', `Expected canceled, got ${data.status}`);
  });

  await test('POST /transfer-auth validates required fields', async () => {
    const { status, data } = await api('POST', '/transfer-auth', {});
    assert(status === 400, `Expected 400, got ${status}`);
    assert(data.error === 'INVALID_REQUEST', 'Wrong error code');
  });
}

async function testIncomingAndResponse() {
  console.log('\n📥 Incoming Transfer + Response API');
  const inTxId = uid();

  await test('POST /transfer-auth/incoming creates incoming transfer', async () => {
    const { status, data } = await api('POST', '/transfer-auth/incoming', {
      transferId: inTxId,
      currency: 'ETH',
      amount: '3.0',
      payload: 'dGVzdA==',
      originatorVaspEntityId: 'test-exchange-a',
      beneficiaryVaspEntityId: 'transight-hub',
    });
    assert(status === 201, `Expected 201, got ${status}`);
    assert(data.result === 'verified', 'Expected verified');
  });

  await test('GET /transfer-response/pending lists incoming transfers', async () => {
    const { data } = await api('GET', '/transfer-response/pending');
    assert(data.transfers && Array.isArray(data.transfers), 'No transfers array');
    assert(typeof data.total === 'number', 'Missing total');
  });

  await test('GET /transfer-response?id= returns detail', async () => {
    const { data } = await api('GET', `/transfer-response?id=${inTxId}`);
    assert(data.transferId === inTxId, 'Wrong transfer');
  });

  await test('POST /transfer-response/confirm confirms transfer', async () => {
    const { data } = await api('POST', '/transfer-response/confirm', {
      transferId: inTxId,
      beneficiaryPayload: 'encrypted-response-data',
    });
    assert(data.result === 'confirmed', `Expected confirmed, got ${data.result}`);
  });

  // Deny test
  const denyTxId = uid();
  await test('POST /transfer-response/deny denies transfer', async () => {
    await api('POST', '/transfer-auth/incoming', {
      transferId: denyTxId,
      currency: 'BTC',
      amount: '0.1',
      payload: 'dGVzdA==',
      originatorVaspEntityId: 'test-exchange-b',
    });
    const { data } = await api('POST', '/transfer-response/deny', {
      transferId: denyTxId,
      reasonType: 'NOT_FOUND_ADDRESS',
      reasonMsg: 'E2E test deny',
    });
    assert(data.result === 'denied', `Expected denied, got ${data.result}`);
  });

  // Webhook test
  await test('POST /transfer-response/webhook handles generic callback', async () => {
    const { data } = await api('POST', '/transfer-response/webhook', {
      transferId: inTxId,
      status: 'confirmed',
      source: 'e2e-test',
    });
    assert(data.received === true, 'Webhook not received');
    assert(data.processed === true, 'Webhook not processed');
  });
}

async function testProtocolAdapterRouting() {
  console.log('\n🔀 Protocol Adapter Routing');

  await test('CODE adapter routes to code protocol', async () => {
    const txId = uid();
    const { data } = await api('POST', '/transfer-auth', {
      transferId: txId,
      currency: 'BTC',
      amount: '0.01',
      payload: 'dGVzdA==',
      beneficiaryVaspEntityId: 'test-exchange-b', // alliance: code
    });
    assert(data.adapter.protocol === 'code', `Expected code, got ${data.adapter.protocol}`);
  });

  await test('TranSight adapter routes to transight protocol', async () => {
    const txId = uid();
    const { data } = await api('POST', '/transfer-auth', {
      transferId: txId,
      currency: 'ETH',
      amount: '1',
      payload: 'dGVzdA==',
      beneficiaryVaspEntityId: 'transight-hub', // alliance: transight
    });
    assert(data.adapter.protocol === 'transight', `Expected transight, got ${data.adapter.protocol}`);
  });
}

async function testEdgeCases() {
  console.log('\n🛡️ Edge Cases & Security');

  await test('Invalid method returns 405', async () => {
    const { status } = await api('PUT', '/transfer-auth');
    assert(status === 405, `Expected 405, got ${status}`);
  });

  await test('Missing transferId returns 400', async () => {
    const { status } = await api('POST', '/transfer-auth/result', { txid: 'abc' });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test('Non-existent transfer returns 404', async () => {
    const { status } = await api('GET', '/transfer-auth?id=nonexistent-xxx');
    assert(status === 404, `Expected 404, got ${status}`);
  });

  await test('Cancel on terminal state returns 400', async () => {
    // Create + confirm first
    const txId = uid();
    await api('POST', '/transfer-auth', {
      transferId: txId, currency: 'BTC', amount: '0.01', payload: 'dGVzdA==',
    });
    await api('POST', '/transfer-auth/finish', { transferId: txId });
    // Try cancel again
    const { status } = await api('POST', '/transfer-auth/finish', { transferId: txId });
    assert(status === 400, `Expected 400, got ${status}`);
  });
}

// ============================================================
// Run All
// ============================================================

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  TranSight TR — E2E Test Suite');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════');

  await testHealth();
  await testVaspRegistry();
  await testTransferAuth();
  await testIncomingAndResponse();
  await testProtocolAdapterRouting();
  await testEdgeCases();

  console.log('\n═══════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (errors.length > 0) {
    console.log('\n  Failed tests:');
    errors.forEach(e => console.log(`    ❌ ${e.name}: ${e.error}`));
  }
  console.log('═══════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
