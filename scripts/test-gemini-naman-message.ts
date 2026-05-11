/**
 * Live Gemini check for the Naman hallway + door message.
 *
 * Env (any of): `.env.local`, `.env`, `.env.production` in project root,
 * or pass inline: `GEMINI_API_KEY=... GEMINI_MODEL=gemini-2.5-flash npm run test:gemini-live`
 *
 * Matches Vercel: GEMINI_MODEL=gemini-2.5-flash, GEMINI_API_KEY from AI Studio.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function parseEnvFileIntoEnv(filePath: string) {
  if (!existsSync(filePath)) return
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (key && val !== '') process.env[key] = val
  }
}

function loadEnvFiles() {
  const root = process.cwd()
  for (const name of ['.env', '.env.local', '.env.production']) {
    parseEnvFileIntoEnv(resolve(root, name))
  }
}

loadEnvFiles()

const MESSAGE_ASCII = `Hi team, Naman in Unit 25. Just wanted to report that the lightbulb in the 2nd-floor hallway is out, and it's pretty dark by the stairs. Also, the front heavy door isn't latching shut properly. Thanks!`

const MESSAGE_IOS = MESSAGE_ASCII.replace(/'/g, '\u2019')

async function main() {
  const {
    parseMaintenanceRequest,
    looksLikeDefiniteMaintenanceText,
    normalizeInboundMessageText,
  } = await import('../lib/gemini-parser')

  console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL || '(default gemini-2.5-flash in parser)')
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'set (' + process.env.GEMINI_API_KEY.length + ' chars)' : 'missing')

  console.log('\n--- Keyword safety net (ASCII message) ---')
  console.log('looksLike:', looksLikeDefiniteMaintenanceText(MESSAGE_ASCII))

  console.log('\n--- Keyword safety net (iOS curly apostrophes) ---')
  console.log('looksLike:', looksLikeDefiniteMaintenanceText(MESSAGE_IOS))
  console.log('normalized sample:', normalizeInboundMessageText(MESSAGE_IOS).slice(0, 120) + '…')

  if (!process.env.GEMINI_API_KEY) {
    console.error(
      '\nGEMINI_API_KEY missing. Add to .env.local (same as Vercel) or run:\n' +
        '  GEMINI_API_KEY=your_key npm run test:gemini-live'
    )
    process.exit(1)
  }

  console.log('\n--- Live parseMaintenanceRequest (iOS punctuation) ---')
  const result = await parseMaintenanceRequest(MESSAGE_IOS, 'email')
  console.log('success:', result.success)
  if (!result.success) {
    console.error('error:', result.error)
    if (result.error?.includes('400') || result.error?.includes('404')) {
      console.error(
        '\nHint: invalid GEMINI_API_KEY or model name. In Vercel, fix "Needs Attention" on the key (rotate in Google AI Studio) and redeploy.'
      )
    }
    process.exit(1)
  }
  const d = result.data!
  console.log('is_maintenance_related:', d.is_maintenance_related)
  console.log('message_type:', d.message_type)
  console.log('brief_description:', d.brief_description)
  console.log('work_order_category:', d.work_order_category)
  console.log('reasoning:', d.reasoning)

  if (!d.is_maintenance_related) {
    console.error('\nFAILED: model still classified as non-maintenance (coercion should have run)')
    process.exit(1)
  }

  console.log('\nOK: message is maintenance')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
