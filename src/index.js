'use babel'

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom'
import getRuleMarkDown from './rule-helpers'
import hasValidScope from './scope-util'

const DEFAULT_ARGS = [
  '--force-exclusion',
  '--format', 'json',
  '--display-style-guide',
]

let helpers
let path
let pluralize
let semver

const loadDeps = () => {
  if (!helpers) {
    helpers = require('atom-linter')
  }
  if (!path) {
    path = require('path')
  }
  if (!pluralize) {
    pluralize = require('pluralize')
  }
  if (!semver) {
    semver = require('semver')
  }
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

const getBaseCommand = command => command
  .split(/\s+/)
  .filter(i => i)
  .concat(DEFAULT_ARGS)

const getBaseExecutionOpts = filePath => ({
  cwd: atom.project.relativizePath(filePath)[0] || path.dirname(filePath),
  stream: 'both',
  timeout: 10000,
  uniqueKey: `linter-rubocop::${filePath}`,
})

const executeRubocop = async (execOptions, command) => {
  let output
  try {
    output = await helpers.exec(command[0], command.slice(1), execOptions)
  } catch (e) {
    if (e.message !== 'Process execution timed out') throw e
    atom.notifications.addInfo(
      'Linter-Rubocop: Linter timed out',
      {
        description: 'Make sure you are not running Rubocop with a slow-starting interpreter like JRuby. '
                     + 'If you are still seeing timeouts, consider running your linter `on save` and not `on change`, '
                     + 'or reference https://github.com/AtomLinter/linter-rubocop/issues/202 .',
      },
    )
    return null
  }
  return output
}

const forwardRubocopToLinter = (version, {
  message: rawMessage, location, severity, cop_name: copName,
}, file, editor) => {
  const hasCopName = semver.satisfies(version, '>=0.52.0 <0.68.0')
  const [excerpt, url] = rawMessage.split(/ \((.*)\)/, 2)
  let position
  if (location) {
    const { line, column, length } = location
    position = [[line - 1, column - 1], [line - 1, (length + column) - 1]]
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
    excerpt: hasCopName ? excerpt : `${copName}: ${excerpt}`,
    severity: severityMapping[severity],
    location: {
      file,
      position,
    },
  }

  getRuleMarkDown(url).then((markdown) => {
    if (markdown) {
      linterMessage.description = markdown
    }
  })

  return linterMessage
}

export default {
  activate() {
    this.scopes = [
      'source.ruby',
      'source.ruby.gemfile',
      'source.ruby.rails',
      'source.ruby.rspec',
      'source.ruby.chef',
    ]

    this.idleCallbacks = new Set()
    let depsCallbackID

    const installLinterRubocopDeps = () => {
      this.idleCallbacks.delete(depsCallbackID)
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter-rubocop', true)
      }
      loadDeps()
    }

    depsCallbackID = window.requestIdleCallback(installLinterRubocopDeps)
    this.idleCallbacks.add(depsCallbackID)

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(
      // Register autocorrect command
      atom.commands.add('atom-text-editor', {
        'linter-rubocop:fix-file': async () => {
          const editor = atom.workspace.getActiveTextEditor()
          if (hasValidScope(editor, this.scopes)) {
            await this.fixFile(editor)
          }
        },
      }),
      atom.contextMenu.add({
        'atom-text-editor:not(.mini), .overlayer': [{
          label: 'Fix file with Rubocop',
          command: 'linter-rubocop:fix-file',
          shouldDisplay: (evt) => {
            const activeEditor = atom.workspace.getActiveTextEditor()
            if (!activeEditor) {
              return false
            }
            // Black magic!
            // Compares the private component property of the active TextEditor
            //   against the components of the elements
            const evtIsActiveEditor = evt.path.some(elem => (
              // Atom v1.19.0+
              elem.component && activeEditor.component
                && elem.component === activeEditor.component))
            // Only show if it was the active editor and it is a valid scope
            return evtIsActiveEditor && hasValidScope(activeEditor, this.scopes)
          },
        }],
      }),
      atom.config.observe('linter-rubocop.command', (value) => {
        this.command = value
      }),
      atom.config.observe('linter-rubocop.disableWhenNoConfigFile', (value) => {
        this.disableWhenNoConfigFile = value
      }),
      atom.config.observe('linter-rubocop.runExtraRailsCops', (value) => {
        this.runExtraRailsCops = value
      }),
    )
  },

  deactivate() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID))
    this.idleCallbacks.clear()
    this.subscriptions.dispose()
  },

  async fixFile(textEditor) {
    if (!textEditor || !atom.workspace.isTextEditor(textEditor)) {
      return
    }

    if (textEditor.isModified()) {
      atom.notifications.addError('Linter-Rubocop: Please save before fix file')
    }

    const text = textEditor.getText()
    if (text.length === 0) {
      return
    }

    const filePath = textEditor.getPath()

    const command = getBaseCommand(this.command)
    command.push('--auto-correct')
    command.push(filePath)

    const output = await executeRubocop(getBaseExecutionOpts(filePath), command)
    const {
      files,
      summary: { offense_count: offenseCount },
    } = parseFromStd(output.stdout, output.stderr)

    const offenses = files && files[0] && files[0].offenses

    if (offenseCount === 0) {
      atom.notifications.addInfo('Linter-Rubocop: No fixes were made')
    } else {
      const corrections = Object.values(offenses)
        .reduce((off, { corrected }) => off + corrected, 0)
      const message = `Linter-Rubocop: Fixed ${pluralize('offenses', corrections, true)} of ${offenseCount}`
      if (corrections < offenseCount) {
        atom.notifications.addInfo(message)
      } else {
        atom.notifications.addSuccess(message)
      }
    }
  },

  provideLinter() {
    return {
      name: 'RuboCop',
      grammarScopes: this.scopes,
      scope: 'file',
      lintsOnChange: true,
      lint: async (editor) => {
        const filePath = editor.getPath()
        if (!filePath) { return null }

        loadDeps()

        if (this.disableWhenNoConfigFile === true) {
          const config = await helpers.findAsync(filePath, '.rubocop.yml')
          if (config === null) {
            return []
          }
        }

        const execOptions = getBaseExecutionOpts(filePath)
        const command = getBaseCommand(this.command)

        if (editor.isModified()) {
          execOptions.stdin = editor.getText()
          command.push('--stdin', filePath)
        } else {
          execOptions.ignoreExitCode = true
          command.push(filePath)
        }

        const output = await executeRubocop(execOptions, command)

        // Process was canceled by newer process
        if (output === null) { return null }

        const {
          metadata: { rubocop_version: rubocopVersion }, files,
        } = parseFromStd(output.stdout, output.stderr)

        if (rubocopVersion == null || rubocopVersion === '') {
          throw new Error('Unable to get rubocop version from linting output results.')
        }

        const offenses = files && files[0] && files[0].offenses

        return (offenses || []).map(
          offense => forwardRubocopToLinter(rubocopVersion, offense, filePath, editor),
        )
      },
    }
  },
}
