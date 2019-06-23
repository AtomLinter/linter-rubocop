'use babel'

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies
import { CompositeDisposable } from 'atom'
import RubocopConfig from './rubocop/RubocopConfig'
import RubocopRunner from './rubocop/RubocopRunner'
import OffenseFormatter from './rubocop/OffenseFormatter'
import ErrorFormatter from './ErrorFormatter'
import parseFromStd from './helpers/std-parser'
import hasValidScope from './helpers/validate-scopes'

let helpers
let path
let pluralize

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
      atom.config.observe('linter-rubocop.useBundler', (value) => {
        this.useBundler = value
      }),
    )

    this.rubocopConfig = new RubocopConfig({
      command: this.command,
      disableWhenNoConfigFile: this.disableWhenNoConfigFile,
      useBundler: this.useBundler,
    }, atom.workspace.getActiveTextEditor())
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

    const output = await new RubocopRunner(this.rubocopConfig).executeRubocop(filePath, ['--auto-correct', filePath])
    try {
      // Process was canceled by newer process or there is nothing to parse
      if (output === null) { return }

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
    } catch (e) {
      atom.notifications.addError('Rubocop: Unexpected error', { description: e.message })
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

        const args = []
        const options = {}

        if (editor.isModified()) {
          options.stdin = editor.getText()
          args.push('--stdin', filePath)
        } else {
          options.ignoreExitCode = true
          args.push(filePath)
        }

        const output = await new RubocopRunner(this.rubocopConfig)
          .executeRubocop(filePath, args, options)
        try {
          // Process was canceled by newer process or there is nothing to parse
          if (output === null) { return null }

          const {
            metadata: { rubocop_version: rubocopVersion }, files,
          } = parseFromStd(output.stdout, output.stderr)

          if (rubocopVersion == null || rubocopVersion === '') {
            throw new Error('Unable to get rubocop version from linting output results.')
          }

          const offenses = files && files[0] && files[0].offenses

          return (offenses || []).map(
            offense => new OffenseFormatter(editor).toLinter(rubocopVersion, offense, filePath),
          )
        } catch (e) {
          return new ErrorFormatter(editor).toLinter(e.message)
        }
      },
    }
  },
}
