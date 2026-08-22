#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { BonanzaTtrClient } from './client.js';
import type { BonanzaTtrConfigFile } from './types.js';

interface ParsedArgs {
  command?: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

const VERSION = '0.1.0';

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg.startsWith('--')) {
      const raw = arg.slice(2);
      const [key, inlineValue] = raw.split('=', 2);
      if (inlineValue !== undefined) {
        flags[key] = inlineValue;
      } else {
        const next = rest[index + 1];
        if (next && !next.startsWith('--')) {
          flags[key] = next;
          index += 1;
        } else {
          flags[key] = true;
        }
      }
    } else {
      positional.push(arg);
    }
  }
  return { command, positional, flags };
}

function stringFlag(flags: Record<string, string | boolean>, key: string, fallback?: string): string | undefined {
  const value = flags[key];
  return typeof value === 'string' ? value : fallback;
}

function boolFlag(flags: Record<string, string | boolean>, key: string): boolean {
  return flags[key] === true || flags[key] === 'true';
}

async function writeFileOnce(filePath: string, content: string, force: boolean): Promise<void> {
  if (existsSync(filePath) && !force) {
    throw new Error(`${filePath} already exists. Re-run with --force to overwrite.`);
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

function configTemplate(options: {
  baseUrl: string;
  vaspEntityId: string;
  allianceName: string;
  apiKeyEnv: string;
  signingPrivateKeyEnv: string;
  signingPublicKeyEnv: string;
}): string {
  return `${JSON.stringify(options, null, 2)}\n`;
}

function envTemplate(apiKeyEnv: string, signingPrivateKeyEnv: string, signingPublicKeyEnv: string): string {
  return [
    `${apiKeyEnv}=replace-with-issued-api-key`,
    `${signingPrivateKeyEnv}=replace-with-base64-ed25519-private-key`,
    `${signingPublicKeyEnv}=replace-with-base64-ed25519-public-key`,
    '',
  ].join('\n');
}

function exampleTemplate(configFileName: string): string {
  return `import { readFile } from 'node:fs/promises';
import { BonanzaTtrClient, encryptPayload } from '@bonanza/ttr-sdk';

const config = JSON.parse(await readFile(new URL('./${configFileName}', import.meta.url), 'utf8'));

const client = new BonanzaTtrClient({
  baseUrl: config.baseUrl,
  apiKey: process.env[config.apiKeyEnv],
  vaspEntityId: config.vaspEntityId,
  allianceName: config.allianceName,
  signingPrivateKey: process.env[config.signingPrivateKeyEnv],
  signingPublicKey: process.env[config.signingPublicKeyEnv],
});

const beneficiary = await client.getPublicKey('beneficiary-vasp-id');
const beneficiaryPublicKey = beneficiary.keys[0]?.pubkey;

if (!beneficiaryPublicKey || !process.env[config.signingPrivateKeyEnv]) {
  throw new Error('Missing beneficiary public key or local signing private key');
}

const payload = await encryptPayload(
  { ivms101: { /* build IVMS101 here */ } },
  process.env[config.signingPrivateKeyEnv],
  beneficiaryPublicKey
);

const result = await client.createTransfer({
  transferId: crypto.randomUUID(),
  currency: 'BTC',
  amount: '0.01',
  address: 'bc1q...',
  originatorVaspEntityId: config.vaspEntityId,
  beneficiaryVaspEntityId: 'beneficiary-vasp-id',
  payload,
});

console.log(result);
`;
}

async function init(flags: Record<string, string | boolean>): Promise<void> {
  const targetDir = path.resolve(stringFlag(flags, 'dir', process.cwd())!);
  const baseUrl = stringFlag(flags, 'base-url', 'https://api.transight.io/v1')!;
  const vaspEntityId = stringFlag(flags, 'vasp-id', 'your-vasp-id')!;
  const allianceName = stringFlag(flags, 'alliance', 'bonanza')!;
  const apiKeyEnv = stringFlag(flags, 'api-key-env', 'BONANZA_TTR_API_KEY')!;
  const signingPrivateKeyEnv = stringFlag(flags, 'private-key-env', 'BONANZA_TTR_PRIVATE_KEY')!;
  const signingPublicKeyEnv = stringFlag(flags, 'public-key-env', 'BONANZA_TTR_PUBLIC_KEY')!;
  const force = boolFlag(flags, 'force');
  await writeFileOnce(
    path.join(targetDir, 'bonanza-ttr.config.json'),
    configTemplate({
      baseUrl,
      vaspEntityId,
      allianceName,
      apiKeyEnv,
      signingPrivateKeyEnv,
      signingPublicKeyEnv,
    }),
    force
  );
  await writeFileOnce(
    path.join(targetDir, '.env.bonanza-ttr.example'),
    envTemplate(apiKeyEnv, signingPrivateKeyEnv, signingPublicKeyEnv),
    force
  );
  await writeFileOnce(
    path.join(targetDir, 'bonanza-ttr.example.ts'),
    exampleTemplate('bonanza-ttr.config.json'),
    force
  );
  console.log(`Bonanza TTR files created in ${targetDir}`);
  console.log('Next: fill .env.bonanza-ttr.example values and wire bonanza-ttr.example.ts into your transfer pipeline.');
}

async function readConfig(filePath: string): Promise<BonanzaTtrConfigFile> {
  const config = JSON.parse(await readFile(filePath, 'utf8')) as BonanzaTtrConfigFile;
  if (!config.baseUrl || !config.vaspEntityId) {
    throw new Error(`${filePath} must include baseUrl and vaspEntityId`);
  }
  return config;
}

async function clientFromFlags(flags: Record<string, string | boolean>): Promise<BonanzaTtrClient> {
  const configPath = path.resolve(stringFlag(flags, 'config', 'bonanza-ttr.config.json')!);
  const config = await readConfig(configPath);
  return new BonanzaTtrClient({
    baseUrl: stringFlag(flags, 'base-url', config.baseUrl)!,
    apiKey: process.env[config.apiKeyEnv ?? 'BONANZA_TTR_API_KEY'],
    allianceName: config.allianceName ?? 'bonanza',
    vaspEntityId: config.vaspEntityId,
    signingPrivateKey: process.env[config.signingPrivateKeyEnv ?? 'BONANZA_TTR_PRIVATE_KEY'],
    signingPublicKey: process.env[config.signingPublicKeyEnv ?? 'BONANZA_TTR_PUBLIC_KEY'],
  });
}

async function health(flags: Record<string, string | boolean>): Promise<void> {
  const client = await clientFromFlags(flags);
  console.log(JSON.stringify(await client.health(), null, 2));
}

async function pubkey(positional: string[], flags: Record<string, string | boolean>): Promise<void> {
  const vaspEntityId = positional[0];
  if (!vaspEntityId) {
    throw new Error('Usage: bonanza-ttr pubkey <vaspEntityId> [--config bonanza-ttr.config.json]');
  }
  const client = await clientFromFlags(flags);
  console.log(JSON.stringify(await client.getPublicKey(vaspEntityId), null, 2));
}

function help(): void {
  console.log(`Bonanza TTR SDK CLI ${VERSION}

Usage:
  bonanza-ttr init [--dir .] [--vasp-id my-vasp] [--base-url https://api.transight.io/v1] [--force]
  bonanza-ttr health [--config bonanza-ttr.config.json]
  bonanza-ttr pubkey <vaspEntityId> [--config bonanza-ttr.config.json]
  bonanza-ttr --help
  bonanza-ttr --version
`);
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.command || parsed.command === '--help' || parsed.command === 'help') {
    help();
    return;
  }
  if (parsed.command === '--version' || parsed.command === 'version') {
    console.log(VERSION);
    return;
  }
  if (parsed.command === 'init') {
    await init(parsed.flags);
    return;
  }
  if (parsed.command === 'health') {
    await health(parsed.flags);
    return;
  }
  if (parsed.command === 'pubkey') {
    await pubkey(parsed.positional, parsed.flags);
    return;
  }
  throw new Error(`Unknown command: ${parsed.command}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`bonanza-ttr: ${message}`);
  process.exitCode = 1;
});
