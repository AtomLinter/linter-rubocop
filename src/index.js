'use babel'

import { CompositeDisposable } from 'atom'
import hasValidScope from './helpers/scope-validator'

let rubocop

const initializeRubocop = ({ command, disableWhenNoConfigFile, useBundler }) => {
  if (!rubocop) {
    const RubocopConfig = require('./rubocop/RubocopConfig')
    const Rubocop = require('./rubocop/Rubocop')
    rubocop = new Rubocop(new RubocopConfig({ command, disableWhenNoConfigFile, useBundler }))
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
      initializeRubocop({
        command: this.command,
        disableWhenNoConfigFile: this.disableWhenNoConfigFile,
        useBundler: this.useBundler,
      })
    }

    depsCallbackID = window.requestIdleCallback(installLinterRubocopDeps)
    this.idleCallbacks.add(depsCallbackID)

    this.subscriptions = new CompositeDisposable()

    // Register autocorrect command
    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'linter-rubocop:fix-file': async () => {
        const editor = atom.workspace.getActiveTextEditor()
        if (hasValidScope(editor, this.scopes)) {
          await this.fixFile(editor)
        }
      },
    }))

    this.subscriptions.add(atom.contextMenu.add({
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
          const evtIsActiveEditor = path.some(({ component }) => component && activeEditor.component
            && component === activeEditor.component)
          // Only show if it was the active editor and it is a valid scope
          return evtIsActiveEditor && hasValidScope(activeEditor, this.scopes)
        },
      }],
    }))

    this.subscriptions.add(atom.config.observe('linter-rubocop.command', (value) => {
      this.command = value
    }))

    this.subscriptions.add(atom.config.observe('linter-rubocop.disableWhenNoConfigFile', (value) => {
      this.disableWhenNoConfigFile = value
    }))

    this.subscriptions.add(atom.config.observe('linter-rubocop.useBundler', (value) => {
      this.useBundler = value
    }))
  },

  deactivate() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID))
    this.idleCallbacks.clear()
    this.subscriptions.dispose()
  },

  async fixFile(editor) {
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

    rubocop.autocorrect(editor.getPath())
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

        initializeRubocop({
          command: this.command,
          disableWhenNoConfigFile: this.disableWhenNoConfigFile,
          useBundler: this.useBundler,
        })

        const messages = await rubocop.analyze(editor.getText(), filePath)

        return messages
      },
    }
  },
}
