'use babel'

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom'
import path from 'path'
import pluralize from 'pluralize'
import * as helpers from 'atom-linter'
import { get } from 'request-promise'

const DEFAULT_ARGS = [
  '--cache', 'false',
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
]
const DOCUMENTATION_LIFETIME = 86400 * 1000 // 1 day TODO: Configurable?

const docsRuleCache = new Map()
let docsLastRetrieved

const takeWhile = (source, predicate) => {
  const result = []
  const length = source.length
  let i = 0

  while (i < length && predicate(source[i], i)) {
    result.push(source[i])
    i += 1
  }

  return result
}

const parseFromStd = (stdout, stderr) => {
  let parsed
  try {
    parsed = JSON.parse(stdout)
  } catch (error) {
    // continue regardless of error
  }
  if (typeof parsed !== 'object') { throw new Error(stderr || stdout) }
  return parsed
}

const getProjectDirectory = filePath =>
                              atom.project.relativizePath(filePath)[0] || path.dirname(filePath)


// Retrieves style guide documentation with cached responses
const getMarkDown = async (url) => {
  const anchor = url.split('#')[1]

  if (new Date().getTime() - docsLastRetrieved < DOCUMENTATION_LIFETIME) {
    // If documentation is stale, clear cache
    docsRuleCache.clear()
  }

  if (docsRuleCache.has(anchor)) { return docsRuleCache.get(anchor) }

  let rawRulesMarkdown
  try {
    rawRulesMarkdown = await get('https://raw.githubusercontent.com/bbatsov/ruby-style-guide/master/README.md')
  } catch (x) {
    return '***\nError retrieving documentation'
  }

  const byLine = rawRulesMarkdown.split('\n')
  // eslint-disable-next-line no-confusing-arrow
  const ruleAnchors = byLine.reduce((acc, line, idx) =>
                                      line.match(/\* <a name=/g) ? acc.concat([[idx, line]]) : acc,
                                      [])

  ruleAnchors.forEach(([startingIndex, startingLine]) => {
    const ruleName = startingLine.split('"')[1]
    const beginSearch = byLine.slice(startingIndex + 1)

    // gobble all the documentation until you reach the next rule
    const documentationForRule = takeWhile(beginSearch, x => !x.match(/\* <a name=|##/))
    const markdownOutput = '***\n'.concat(documentationForRule.join('\n'))

    docsRuleCache.set(ruleName, markdownOutput)
  })

  docsLastRetrieved = new Date().getTime()
  return docsRuleCache.get(anchor)
}

const forwardRubocopToLinter =
  ({ message: rawMessage, location, severity, cop_name: copName }, file, editor) => {
    const [excerpt, url] = rawMessage.split(/ \((.*)\)/, 2)
    let position
    if (location) {
      const { line, column, length } = location
      position = [[line - 1, column - 1], [line - 1, (column + length) - 1]]
    } else {
      position = helpers.generateRange(editor, 0)
    }

    const severityMapping = {
      refactor: 'info',
      convention: 'info',
      warning: 'warning',
      error: 'error',
      fatal: 'error',
    }

    const linterMessage = {
      url,
      excerpt: `${excerpt} (${copName})`,
      severity: severityMapping[severity],
      description: url ? () => getMarkDown(url) : null,
      location: {
        file,
        position,
      },
    }
    return linterMessage
  }

export default {
  activate() {
    require('atom-package-deps').install('linter-rubocop', true)

    this.subscriptions = new CompositeDisposable()

    // Register fix command
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'linter-rubocop:fix-file': async () => {
          const textEditor = atom.workspace.getActiveTextEditor()

          if (!atom.workspace.isTextEditor(textEditor) || textEditor.isModified()) {
            // Abort for invalid or unsaved text editors
            return atom.notifications.addError('Linter-Rubocop: Please save before fixing')
          }

          const filePath = textEditor.getPath()
          const command = this.command
                              .split(/\s+/)
                              .filter(i => i)
                              .concat(DEFAULT_ARGS, '--auto-correct', filePath)
          const cwd = getProjectDirectory(filePath)
          const { stdout, stderr } = await helpers.exec(command[0], command.slice(1), { cwd, stream: 'both' })
          const { summary: { offense_count: offenseCount } } = parseFromStd(stdout, stderr)
          return offenseCount === 0 ?
            atom.notifications.addInfo('Linter-Rubocop: No fixes were made') :
            atom.notifications.addSuccess(`Linter-Rubocop: Fixed ${pluralize('offenses', offenseCount, true)}`)
        },
      }),
    )

    // Config observers
    this.subscriptions.add(
      atom.config.observe('linter-rubocop.command', (value) => {
        this.command = value
      }),
    )
    this.subscriptions.add(
      atom.config.observe('linter-rubocop.disableWhenNoConfigFile', (value) => {
        this.disableWhenNoConfigFile = value
      }),
    )
    this.subscriptions.add(
      atom.config.observe('linter-rubocop.linterTimeout', (value) => {
        this.linterTimeout = value
      }),
    )
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  provideLinter() {
    return {
      name: 'RuboCop',
      grammarScopes: [
        'source.ruby',
        'source.ruby.rails',
        'source.ruby.rspec',
        'source.ruby.chef',
      ],
      scope: 'file',
      lintsOnChange: true,
      lint: async (editor) => {
        const filePath = editor.getPath()

        if (this.disableWhenNoConfigFile === true) {
          const config = await helpers.findAsync(filePath, '.rubocop.yml')
          if (config === null) {
            return []
          }
        }

        const command = this.command
                            .split(/\s+/)
                            .filter(i => i)
                            .concat(DEFAULT_ARGS, '--stdin', filePath)
        const stdin = editor.getText()
        const cwd = getProjectDirectory(filePath)
        const exexOptions = {
          cwd,
          stdin,
          stream: 'both',
          timeout: this.linterTimeout,
          uniqueKey: `linter-rubocop::${filePath}`,
        }
        const output = await helpers.exec(command[0], command.slice(1), exexOptions)
        // Process was canceled by newer process
        if (output === null) { return null }

        const { files } = parseFromStd(output.stdout, output.stderr)
        const offenses = files && files[0] && files[0].offenses
        return (offenses || []).map(offense => forwardRubocopToLinter(offense, filePath, editor))
      },
    }
  },
}
