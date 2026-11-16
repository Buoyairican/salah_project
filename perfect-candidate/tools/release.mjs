// Build the show and put it in ../presentation: index.html (everything inside) + media/. Works on Windows too.
import { execSync } from 'node:child_process'
import { cpSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
execSync('pnpm --filter @show/app build', { cwd: root, stdio: 'inherit' })
rmSync(`${root}presentation`, { recursive: true, force: true })
cpSync(`${root}app/dist`, `${root}presentation`, { recursive: true })
console.log('\nThe show is in presentation/ — open presentation/index.html in Chrome.')
