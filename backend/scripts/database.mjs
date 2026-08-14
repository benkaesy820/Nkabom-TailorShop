import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

const EXPECTED_DATABASE = 'nkabom_dev'
const ALLOWED_HOST_SUFFIX = '.neon.tech'
const supportedCommands = ['migrate', 'seed', 'status', 'reset']

function getDirectDatabaseUrl() {
  const value = process.env.DIRECT_DATABASE_URL
  if (!value) {
    throw new Error('DIRECT_DATABASE_URL is required')
  }

  const url = new URL(value)
  const database = decodeURIComponent(url.pathname.slice(1))

  if (database !== EXPECTED_DATABASE) {
    throw new Error(`Refusing database operation: expected ${EXPECTED_DATABASE}, received ${database}`)
  }

  if (!url.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
    throw new Error(`Refusing database operation: ${url.hostname} is not an approved Neon host`)
  }

  return url
}

function runAce(args, directUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['ace.js', ...args], {
      env: {
        ...process.env,
        DATABASE_URL: directUrl.toString(),
      },
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Database command stopped by signal ${signal}`))
        return
      }

      if (code !== 0) {
        reject(new Error(`Database command exited with code ${code}`))
        return
      }

      resolve()
    })
  })
}

async function confirmReset(database) {
  if (process.argv.includes('--force')) {
    return
  }

  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Reset requires an interactive terminal or the explicit --force flag')
  }

  const prompt = createInterface({ input: stdin, output: stdout })
  const answer = await prompt.question(`Type ${database} to permanently reset the development database: `)
  prompt.close()

  if (answer !== database) {
    throw new Error('Database reset cancelled')
  }
}

async function main() {
  const command = process.argv[2]
  if (!supportedCommands.includes(command)) {
    throw new Error(`Expected one of: ${supportedCommands.join(', ')}`)
  }

  const directUrl = getDirectDatabaseUrl()
  const database = decodeURIComponent(directUrl.pathname.slice(1))
  console.log(`Database: ${database}`)
  console.log(`Host: ${directUrl.hostname}`)

  switch (command) {
    case 'migrate':
      await runAce(['migration:run'], directUrl)
      break
    case 'seed':
      await runAce(['db:seed'], directUrl)
      break
    case 'status':
      await runAce(['migration:status'], directUrl)
      break
    case 'reset':
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Database reset is allowed only when NODE_ENV=development')
      }
      await confirmReset(database)
      await runAce(['migration:fresh'], directUrl)
      break
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
