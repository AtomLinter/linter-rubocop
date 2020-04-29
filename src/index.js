'use babel'

import { CompositeDisposable } from 'atom'
import Rubocop from './rubocop/Rubocop'
import hasValidScope from './helpers/hasValidScope'
import deserializeProjectFile from './helpers/deserializeProjectFile'
import currentDirectory from './helpers/currentDirectory'

const PROJECT_CONFIG_FILE = '.lrproject.json'

export default {
  activate() {
    this.scopes = [
      'source.ruby',
      'source.ruby.gemfile',
      'source.ruby.rails',
      'source.ruby.rspec',
      'source.ruby.chef',
    ]

    let depsCallbackID
    this.idleCallbacks = new Set()

    const installLinterRubocopDeps = () => {
      this.idleCallbacks.delete(depsCallbackID)
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter-rubocop', true)
      }
    }

    depsCallbackID = window.requestIdleCallback(installLinterRubocopDeps)

    this.idleCallbacks.add(depsCallbackID)
    this.subscriptions = new CompositeDisposable()

    // Register autocorrect command
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
      atom.workspace.observeTextEditors((editor) => {
        editor.onDidSave(async () => {
          if (hasValidScope(editor, this.scopes)
            && atom.config.get('linter-rubocop.fixOnSave')
          ) {
            await this.fixFile(editor, { onSave: true })
          }
        })
      }),
      atom.contextMenu.add({
        'atom-text-editor:not(.mini), .overlayer': [{
          label: 'Fix file with Rubocop',
          command: 'linter-rubocop:fix-file',
          shouldDisplay: ({ path }) => {
            const activeEditor = atom.workspace.getActiveTextEditor()
            if (!activeEditor) {
              return false
            }
            // Black magic!
            // Compares the private component property of the active TextEditor
            // against the components of the elements
            // Atom v1.19.0+
            const evtIsActiveEditor = path.some(({ component }) => component
              && activeEditor.component
              && component === activeEditor.component)
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
      atom.config.observe('linter-rubocop.detectProjectSettings', (value) => {
        this.detectProjectSettings = value
      }),

      atom.config.onDidChange(({ newValue, oldValue }) => {
        const newConfig = newValue['linter-rubocop']
        const oldConfig = oldValue['linter-rubocop']
        if (Object.entries(newConfig).toString() === Object.entries(oldConfig).toString()) {
          return
        }
        this.rubocop.setConfig({
          command: newConfig.command,
          disableWhenNoConfigFile: newConfig.disableWhenNoConfigFile,
        })
      }),
    )

    this.setProjectSettings = async (filePath) => {
      if (this.detectProjectSettings === true) {
        const config = await deserializeProjectFile(filePath, PROJECT_CONFIG_FILE)
        if (config && config.command) {
          this.rubocop.setConfig({
            command: this.command,
            disableWhenNoConfigFile: this.disableWhenNoConfigFile,
          })
        }
      }
    }

    this.rubocop = new Rubocop({
      command: this.command,
      disableWhenNoConfigFile: this.disableWhenNoConfigFile,
    })
  },

  deactivate() {
    this.idleCallbacks.forEach((callbackID) => window.cancelIdleCallback(callbackID))
    this.idleCallbacks.clear()
    this.subscriptions.dispose()
  },

  async fixFile(editor, { onSave } = {}) {
    if (!editor || !atom.workspace.isTextEditor(editor)) {
      return
    }
    if (editor.isModified()) {
      atom.notifications.addError('Linter-Rubocop: Please save before fix file')
    }
    const text = editor.getText()
    if (text.length === 0) {
      return
    }

    const filePath = editor.getPath()
    this.setProjectSettings(filePath)
    this.rubocop.autocorrect(currentDirectory(filePath), filePath, onSave)
  },

  provideLinter() {
    return {
      name: 'RuboCop',
      grammarScopes: this.scopes,
      scope: 'file',
      lintsOnChange: true,
      lint: async (editor) => {
        const filePath = editor.getPath()
        if (!filePath) {
          return null
        }

        this.setProjectSettings(filePath)

        return this.rubocop.analyze(editor.getText(), currentDirectory(filePath), filePath)
      },
    }
  },
}
