'use babel'

import tmp from 'tmp'
import * as path from 'path'
import {
  // eslint-disable-next-line no-unused-vars
  it, fit, wait, beforeEach, afterEach,
} from 'jasmine-fix'
import { copyFileSync } from 'fs'

const { lint } = require('../src/index.js').provideLinter()

const badPath = path.join(__dirname, 'fixtures', 'lintableFiles', 'bad.rb')
const emptyPath = path.join(__dirname, 'fixtures', 'lintableFiles', 'empty.rb')
const goodPath = path.join(__dirname, 'fixtures', 'lintableFiles', 'good.rb')
const invalidWithUrlPath = path.join(__dirname, 'fixtures', 'lintableFiles', 'invalid_with_url.rb')
const abcSizePath = path.join(__dirname, 'fixtures', 'lintableFiles', 'abc_size.rb')
const ruby24Path = path.join(__dirname, 'fixtures', 'lintableFiles', 'ruby_2_4.rb')
const ruby24PathYml23 = path.join(__dirname, 'fixtures', 'yml2_3', 'ruby_2_4.rb')

async function getNotification(expected) {
  return new Promise((resolve) => {
    let notificationSub
    const newNotification = (notification) => {
      if (!notification.getMessage().startsWith(expected)) {
        // As the specs execute asynchronously, it's possible a notification
        // from a different spec was grabbed, if the message doesn't match what
        // is expected simply return and keep waiting for the next message.
        return
      }
      // Dispose of the notification subscription
      notificationSub.dispose()
      resolve(notification)
    }
    // Subscribe to Atom's notifications
    notificationSub = atom.notifications.onDidAddNotification(newNotification)
  })
}

describe('The RuboCop provider for Linter', () => {
  beforeEach(async () => {
    // Reset/set project path to fixtures
    atom.project.setPaths([path.join(__dirname, 'fixtures')])

    atom.workspace.destroyActivePaneItem()

    // Info about this beforeEach() implementation:
    // https://github.com/AtomLinter/Meta/issues/15
    const activationPromise = atom.packages.activatePackage('linter-rubocop')

    await atom.packages.activatePackage('language-ruby')
    await atom.workspace.open(goodPath)

    atom.packages.triggerDeferredActivationHooks()
    await activationPromise
  })

  it('should be in the packages list', () => {
    expect(atom.packages.isPackageLoaded('linter-rubocop')).toBe(true)
  })

  it('should be an active package', () => {
    expect(atom.packages.isPackageActive('linter-rubocop')).toBe(true)
  })

  describe('shows errors in a file with errors', () => {
    let editor = null

    beforeEach(async () => {
      editor = await atom.workspace.open(badPath)
    })

    it('verifies the first message', async () => {
      const msgText = 'Lint/Syntax: unterminated string meets end of file\n'
        + '(Using Ruby 2.3 parser; configure using `TargetRubyVersion` parameter, under `AllCops`)'

      const messages = await lint(editor)
      const description = await messages[0].description()

      expect(messages[0].severity).toBe('error')
      expect(messages[0].excerpt).toBe(msgText)
      expect(description).toBe('')
      expect(messages[0].location.file).toBe(badPath)
      expect(messages[0].location.position).toEqual([[1, 6], [1, 7]])
    })
  })

  describe('shows errors with a clickable link in a file with warnings', () => {
    let editor = null

    beforeEach(async () => {
      editor = await atom.workspace.open(invalidWithUrlPath)
    })

    it('verifies the first message', async () => {
      const urlRegex = /https:\/\/.*#consistent-string-literals/g
      const msgText = 'Style/StringLiterals: Prefer single-quoted strings '
        + "when you don't need string interpolation or special symbols."

      const messages = await lint(editor)

      expect(messages[0].severity).toBe('info')
      expect(messages[0].excerpt).toBe(msgText)
      expect(messages[0].url).toMatch(urlRegex)
      expect(messages[0].location.file).toBe(invalidWithUrlPath)
      expect(messages[0].location.position).toEqual([[2, 6], [2, 20]])
      expect(messages[0].description).not.toBe(null)
    })
  })

  describe('shows errors without a clickable link in a file with warnings', () => {
    let editor = null

    beforeEach(async () => {
      editor = await atom.workspace.open(abcSizePath)
    })

    it('verifies the first message', async () => {
      const urlRegex = /(http:\/\/c2.com\/cgi\/wiki\?AbcMetric)/g
      const msgText = 'Metrics/AbcSize: Assignment Branch Condition size for defaults is too high. [18.25/15]'

      const messages = await lint(editor)
      const description = await messages[0].description()

      // We skip the position test because Rubocop versions before 0.52.0 returns
      // a different length for the offense
      expect(messages[0].severity).toBe('info')
      expect(messages[0].excerpt).toBe(msgText)
      expect(messages[0].url).toMatch(urlRegex)
      expect(messages[0].location.file).toBe(abcSizePath)
      expect(description).toBe('')
    })
  })

  it('finds nothing wrong with an empty file', async () => {
    const editor = await atom.workspace.open(emptyPath)
    const messages = await lint(editor)
    expect(messages.length).toBe(0)
  })

  it('finds nothing wrong with a valid file', async () => {
    const editor = await atom.workspace.open(goodPath)
    const messages = await lint(editor)
    expect(messages.length).toBe(0)
  })

  describe('respects .ruby-version when .rubocop.yml has not defined ruby version', () => {
    it('finds violations when .rubocop.yml sets syntax to Ruby 2.3', async () => {
      atom.project.setPaths([path.join(__dirname, 'fixtures', 'yml2_3')])
      const editor = await atom.workspace.open(ruby24PathYml23)
      const messages = await lint(editor)
      expect(messages.length).toBe(1)
    })

    it('finds nothing wrong with a file when .rubocop.yml does not override the Ruby version', async () => {
      const editor = await atom.workspace.open(ruby24Path)
      const messages = await lint(editor)
      expect(messages.length).toBe(0)
    })
  })

  describe('allows the user to autocorrect the current file', () => {
    const tmpFile = `${tmp.dirSync().name}/invalid_with_url.rb`

    it('corrects the bad file', async () => {
      copyFileSync(invalidWithUrlPath, tmpFile)
      const editor = await atom.workspace.open(tmpFile)
      atom.commands.dispatch(atom.views.getView(editor), 'linter-rubocop:fix-file')
      const expectedMessage = 'Linter-Rubocop: Fixed'
      const notification = await getNotification(expectedMessage)
      expect(notification.getMessage()).toMatch(/Linter-Rubocop: Fixed \d+ offenses?/)
      expect(notification.getType()).toBe('success')
    })

    it("doesn't modify a good file", async () => {
      const editor = await atom.workspace.open(goodPath)
      atom.commands.dispatch(atom.views.getView(editor), 'linter-rubocop:fix-file')
      const expectedMessage = 'Linter-Rubocop: No fixes were made'
      const notification = await getNotification(expectedMessage)
      expect(notification.getMessage()).toBe(expectedMessage)
      expect(notification.getType()).toBe('info')
    })
  })
})
