'use babel';

import * as path from 'path';
import { truncateSync, writeFileSync, readFileSync } from 'fs';

// eslint-disable-next-line import/no-extraneous-dependencies
import tmp from 'tmp';

const lint = require('../src/index.js').provideLinter().lint;

const badPath = path.join(__dirname, 'fixtures', 'bad.rb');
const emptyPath = path.join(__dirname, 'fixtures', 'empty.rb');
const goodPath = path.join(__dirname, 'fixtures', 'good.rb');
const invalidWithUrlPath = path.join(__dirname, 'fixtures', 'invalid_with_url.rb');
const invalidWithoutUrlPath = path.join(__dirname, 'fixtures', 'invalid_without_url.rb');

describe('The RuboCop provider for Linter', () => {
  beforeEach(() => {
    atom.workspace.destroyActivePaneItem();

    // Info about this beforeEach() implementation:
    // https://github.com/AtomLinter/Meta/issues/15
    const activationPromise =
      atom.packages.activatePackage('linter-rubocop');

    waitsForPromise(() =>
      atom.packages.activatePackage('language-ruby').then(() =>
        atom.workspace.open(goodPath),
    ));

    atom.packages.triggerDeferredActivationHooks();
    waitsForPromise(() => activationPromise);
  });

  it('should be in the packages list', () =>
    expect(atom.packages.isPackageLoaded('linter-rubocop')).toEqual(true),
  );

  it('should be an active package', () =>
    expect(atom.packages.isPackageActive('linter-rubocop')).toEqual(true),
  );

  describe('shows errors in a file with errors', () => {
    let editor = null;

    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(badPath).then((openEditor) => { editor = openEditor; }),
      );
    });

    it('verifies the first message', () => {
      const msgText = 'unterminated string meets end of file\n(Using Ruby 2.2 parser; ' +
        'configure using `TargetRubyVersion` parameter, under `AllCops`) (Syntax)';

      waitsForPromise(() =>
        lint(editor).then((messages) => {
          expect(messages[0].type).toEqual('Error');
          expect(messages[0].html).toBe(msgText);
          expect(messages[0].text).not.toBeDefined();
          expect(messages[0].filePath).toEqual(badPath);
          expect(messages[0].range).toEqual([[0, 6], [0, 7]]);
        }),
      );
    });
  });

  describe('shows errors with a clickable link in a file with warnings', () => {
    let editor = null;

    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(invalidWithUrlPath).then((openEditor) => { editor = openEditor; }),
      );
    });

    it('verifies the first message', () => {
      const msgText = 'Prefer single-quoted strings when you don&#39;t need ' +
        'string interpolation or special symbols. ' +
        '(<a href="https://github.com/bbatsov/ruby-style-guide#consistent-string-literals">Style/StringLiterals</a>)';

      waitsForPromise(() =>
        lint(editor).then((messages) => {
          expect(messages[0].type).toEqual('Warning');
          expect(messages[0].html).toBe(msgText);
          expect(messages[0].text).not.toBeDefined();
          expect(messages[0].filePath).toEqual(invalidWithUrlPath);
          expect(messages[0].range).toEqual([[0, 6], [0, 20]]);
        }),
      );
    });
  });

  describe('shows errors without a clickable link in a file with warnings', () => {
    let editor = null;

    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(invalidWithoutUrlPath).then((openEditor) => { editor = openEditor; }),
      );
    });

    it('verifies the first message', () => {
      const msgText = 'Extra empty line detected at class body end. ' +
        '(Style/EmptyLinesAroundClassBody)';

      waitsForPromise(() =>
        lint(editor).then((messages) => {
          expect(messages[0].type).toEqual('Warning');
          expect(messages[0].html).toBe(msgText);
          expect(messages[0].text).not.toBeDefined();
          expect(messages[0].filePath).toEqual(invalidWithoutUrlPath);
          expect(messages[0].range).toEqual([[4, 0], [4, 1]]);
        }),
      );
    });
  });

  it('finds nothing wrong with an empty file', () => {
    waitsForPromise(() =>
      atom.workspace.open(emptyPath).then(editor =>
        lint(editor).then(messages =>
          expect(messages.length).toEqual(0),
        ),
      ),
    );
  });

  it('finds nothing wrong with a valid file', () => {
    waitsForPromise(() =>
      atom.workspace.open(goodPath).then(editor =>
        lint(editor).then(messages =>
          expect(messages.length).toEqual(0),
        ),
      ),
    );
  });

  describe('allows the user to autocorrect the current file', () => {
    let doneCorrecting;
    const tmpobj = tmp.fileSync({ postfix: '.rb' });
    const checkNotificaton = (notification) => {
      const message = notification.getMessage();
      if (message === 'Linter-Rubocop: No fixes were made') {
        expect(notification.getType()).toEqual('info');
      } else {
        expect(message).toMatch(/Linter-Rubocop: Fixed \d offenses/);
        expect(notification.getType()).toEqual('success');
      }
      doneCorrecting = true;
    };

    beforeEach(() => {
      truncateSync(tmpobj.name);
      doneCorrecting = false;
    });

    it('corrects the bad file', () => {
      writeFileSync(tmpobj.name, readFileSync(invalidWithUrlPath));
      waitsForPromise(() =>
        atom.workspace.open(tmpobj.name).then((editor) => {
          atom.notifications.onDidAddNotification(checkNotificaton);
          atom.commands.dispatch(atom.views.getView(editor), 'linter-rubocop:fix-file');
        }),
      );
      waitsFor(
        () => doneCorrecting,
        'Notification type should be checked',
      );
    });

    it("doesn't modify a good file", () => {
      waitsForPromise(() =>
        atom.workspace.open(goodPath).then((editor) => {
          atom.notifications.onDidAddNotification(checkNotificaton);
          atom.commands.dispatch(atom.views.getView(editor), 'linter-rubocop:fix-file');
        }),
      );
      waitsFor(
        () => doneCorrecting,
        'Notification type should be checked',
      );
    });
  });
});
