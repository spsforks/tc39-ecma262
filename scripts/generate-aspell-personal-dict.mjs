import { promisify } from 'node:util';
import { exec } from 'node:child_process';
const execP = promisify(exec);
import { writeFile } from 'node:fs/promises';

const BASE_REF = process.argv[2];
const ASPELL_OPTS = [
  '--add-html-check=alt,title,caption,variants',
  '--ignore-case',
  '--master=en_GB-ize',
  '--mode=html',
  '--run-together',
  '--run-together-limit=99',
  '--run-together-min=2',
  'list',
].join(' ');

function makeDict(words) {
  return `personal_ws-1.1 en ${words.length}\n${words.join('\n')}`;
}

console.log(`base ref: ${BASE_REF}\n`);

let { stdout } = await execP(`git show "${BASE_REF}":spec.html | aspell ${ASPELL_OPTS} | sort -fu`);

let existingWords = stdout.trim().split('\n');

let existingComponents = Array.from(new Set(existingWords.flatMap(word =>
  [ ...word.matchAll(/(?:^[a-z]|[A-Z])[a-z]{2,}/g).map(([w]) => w.toLowerCase()) ]
)));

({stdout} = await execP(`echo ${existingComponents.map(w => JSON.stringify(w)).join(' ')} | aspell ${ASPELL_OPTS} | sort -fu`));

let existingComponentsReduced = stdout.trim().split('\n');

await writeFile('aspell.txt', makeDict(existingComponentsReduced));

({stdout} = await execP(`echo ${existingWords.map(w => JSON.stringify(w)).join(' ')} | aspell --personal=./aspell.txt ${ASPELL_OPTS}`));

let novel = [...existingComponentsReduced, ...stdout.trim().split('\n')].filter(w => w.length > 2);
novel.sort();
console.log(`novel words: ${novel.join(', ')}`);
await writeFile('aspell.txt', makeDict(novel));
