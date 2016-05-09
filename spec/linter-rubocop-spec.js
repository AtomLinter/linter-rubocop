'use babel';

import * as path from 'path';

const lint = require(path.join('..', 'lib', 'index')).provideLinter().lint;

const badPath = path.join(__dirname, 'fixtures', 'bad.rb');
const emptyPath = path.join(__dirname, 'fixtures', 'empty.rb');
const goodPath = path.join(__dirname, 'fixtures', 'good.rb');
const invalidPath = path.join(__dirname, 'fixtures', 'invalid.rb');

describe('The RuboCop provider for Linter', () => {
  beforeEach(() => {
    atom.workspace.destroyActivePaneItem();
    waitsForPromise(() => {
      atom.packages.activatePackage('linter-rubocop');
      return atom.packages.activatePackage('language-ruby').then(() =>
        atom.workspace.open(goodPath)
      );
    });
  });

  it('should be in the packages list', () =>
    expect(atom.packages.isPackageLoaded('linter-rubocop')).toEqual(true)
  );

  it('should be an active package', () =>
    expect(atom.packages.isPackageActive('linter-rubocop')).toEqual(true)
  );

  describe('shows errors in a file with errors', () => {
    let editor = null;

    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(badPath).then(openEditor => { editor = openEditor; })
      );
    });

    it('verifies the first message', () => {
      const msgText = 'unterminated string meets end of file\n(Using Ruby 2.2 parser; ' +
        'configure using `TargetRubyVersion` parameter, under `AllCops`) (Syntax)';

      waitsForPromise(() =>
        lint(editor).then(messages => {
          expect(messages[0].type).toBeDefined();
          expect(messages[0].type).toEqual('Error');
          expect(messages[0].html).not.toBeDefined();
          expect(messages[0].text).toBeDefined();
          expect(messages[0].text).toEqual(msgText);
          expect(messages[0].filePath).toBeDefined();
          expect(messages[0].filePath).toEqual(badPath);
          expect(messages[0].range).toBeDefined();
          expect(messages[0].range.length).toEqual(2);
          expect(messages[0].range).toEqual([[0, 6], [0, 7]]);
        })
      );
    });
  });

  describe('shows errors in a file with warnings', () => {
    let editor = null;

    beforeEach(() => {
      waitsForPromise(() =>
        atom.workspace.open(invalidPath).then(openEditor => { editor = openEditor; })
      );
    });

    it('verifies the first message', () => {
      const msgText = 'Prefer single-quoted strings when you don\'t need string ' +
        'interpolation or special symbols. (Style/StringLiterals)';

      waitsForPromise(() =>
        lint(editor).then(messages => {
          expect(messages[0].type).toBeDefined();
          expect(messages[0].type).toEqual('Warning');
          expect(messages[0].html).not.toBeDefined();
          expect(messages[0].text).toBeDefined();
          expect(messages[0].text).toEqual(msgText);
          expect(messages[0].filePath).toBeDefined();
          expect(messages[0].filePath).toEqual(invalidPath);
          expect(messages[0].range).toBeDefined();
          expect(messages[0].range.length).toEqual(2);
          expect(messages[0].range).toEqual([[0, 6], [0, 20]]);
        })
      );
    });
  });

  it('finds nothing wrong with an empty file', () => {
    waitsForPromise(() =>
      atom.workspace.open(emptyPath).then(editor =>
        lint(editor).then(messages =>
          expect(messages.length).toEqual(0)
        )
      )
    );
  });

  it('finds nothing wrong with a valid file', () => {
    waitsForPromise(() =>
      atom.workspace.open(goodPath).then(editor =>
        lint(editor).then(messages =>
          expect(messages.length).toEqual(0)
        )
      )
    );
  });
});
