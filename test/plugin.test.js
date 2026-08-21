import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const source = await readFile(new URL('../plugin.js', import.meta.url), 'utf8')

test('keeps the Hermes plugin contract', async () => {
  assert.match(source, /export default/)
  assert.doesNotMatch(source, /from '(?!@hermes\/plugin-sdk|react)([^']+)'/)
})

test('normalizes persisted events and layouts', () => {
  assert.match(source, /function normalizeBucket\(/)
  assert.match(source, /function normalizeLayout\(/)
  assert.match(source, /pruneStorage\(\)/)
})
