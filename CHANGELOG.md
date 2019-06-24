## [2.4.2](https://github.com/AtomLinter/linter-rubocop/compare/v2.4.1...v2.4.2) (2019-06-24)


### Bug Fixes

* **deps:** update dependency semver to v6.1.2 ([60957d2](https://github.com/AtomLinter/linter-rubocop/commit/60957d2))

## [2.4.1](https://github.com/AtomLinter/linter-rubocop/compare/v2.4.0...v2.4.1) (2019-06-17)


### Bug Fixes

* fixed missing trailing comma, comma-dangle ([116c35a](https://github.com/AtomLinter/linter-rubocop/commit/116c35a))
* removed configuration to run Rubocop with extra Rails cops ([9086d2c](https://github.com/AtomLinter/linter-rubocop/commit/9086d2c))

# [2.4.0](https://github.com/AtomLinter/linter-rubocop/compare/v2.3.4...v2.4.0) (2019-06-06)


### Bug Fixes

* 'Naming/FileName' rule on test tmp file ([07c3453](https://github.com/AtomLinter/linter-rubocop/commit/07c3453))


### Features

* fix file refactor, added fix file option to contextual menu ([2b5c5db](https://github.com/AtomLinter/linter-rubocop/commit/2b5c5db))

## [2.3.4](https://github.com/AtomLinter/linter-rubocop/compare/v2.3.3...v2.3.4) (2019-06-06)


### Bug Fixes

* rule cache ([5de081e](https://github.com/AtomLinter/linter-rubocop/commit/5de081e))

## [2.3.3](https://github.com/AtomLinter/linter-rubocop/compare/v2.3.2...v2.3.3) (2019-05-28)


### Bug Fixes

* **deps:** update dependency semver to v6.1.1 ([0fa563d](https://github.com/AtomLinter/linter-rubocop/commit/0fa563d))

## [2.3.2](https://github.com/AtomLinter/linter-rubocop/compare/v2.3.1...v2.3.2) (2019-05-28)


### Bug Fixes

* **deps:** update dependency pluralize to v8 ([8095f32](https://github.com/AtomLinter/linter-rubocop/commit/8095f32))

## [2.3.1](https://github.com/AtomLinter/linter-rubocop/compare/v2.3.0...v2.3.1) (2019-05-25)


### Bug Fixes

* fixed ruby file for 2.4, added unsupported lambda style ([c72bba0](https://github.com/AtomLinter/linter-rubocop/commit/c72bba0))

# [2.3.0](https://github.com/AtomLinter/linter-rubocop/compare/v2.2.7...v2.3.0) (2019-05-01)


### Features

* implements [#306](https://github.com/AtomLinter/linter-rubocop/issues/306) ([c7fc64f](https://github.com/AtomLinter/linter-rubocop/commit/c7fc64f))

## [2.2.7](https://github.com/AtomLinter/linter-rubocop/compare/v2.2.6...v2.2.7) (2019-04-30)


### Bug Fixes

* updated minimum Atom version to 1.30 ([5f16450](https://github.com/AtomLinter/linter-rubocop/commit/5f16450)), closes [#314](https://github.com/AtomLinter/linter-rubocop/issues/314)

## [2.2.6](https://github.com/AtomLinter/linter-rubocop/compare/v2.2.5...v2.2.6) (2019-04-30)


### Bug Fixes

* rubocop v0.68.0 doesn't include the cop name in the message anymore ([c71ec58](https://github.com/AtomLinter/linter-rubocop/commit/c71ec58))

## [2.2.5](https://github.com/AtomLinter/linter-rubocop/compare/v2.2.4...v2.2.5) (2019-04-24)


### Bug Fixes

* **deps:** update dependency atom-package-deps to v5.1.0 ([6a6b00d](https://github.com/AtomLinter/linter-rubocop/commit/6a6b00d))
* **deps:** update dependency semver to v6 ([20cb5f2](https://github.com/AtomLinter/linter-rubocop/commit/20cb5f2))

# Changelog

## [v2.2.4](https://github.com/AtomLinter/linter-rubocop/compare/v2.2.3...v2.2.4)

###### Performance improvements:
* Lazy load dependencies on activation and use scopes instead of language names (#294)

###### Bug Fixes:
* Dependency updates

## [v2.2.3](https://github.com/AtomLinter/linter-rubocop/compare/v2.2.2...v2.2.3)

###### Bug Fixes:
* Fix determination of RuboCop version for `rbenv`/`bundler` (#262)

## [v2.2.2](https://github.com/AtomLinter/linter-rubocop/compare/v2.2.1...v2.2.2)

###### Bug Fixes:
* Fix for RuboCop versions below v0.52.0 (#258)

## [v2.2.1](https://github.com/AtomLinter/linter-rubocop/compare/v2.2.0...v2.2.1)

###### Changes:
* Update message style to match RuboCop v0.52.0+

###### Bug Fixes:
* Ensure the file has a path before attempting to lint it (#252)

## [v2.2.0](https://github.com/AtomLinter/linter-rubocop/compare/v2.1.1...v2.2.0)

###### Changes:
* Remove linter timeout config, replace with a helpful warning in the case of timeouts
* Improve documentation
* Enable linting on Gemfile

## [v2.1.1](https://github.com/AtomLinter/linter-rubocop/compare/v2.1.0...v2.1.1)

###### Bug Fixes:
* Unique process spawning -- key process id's by linter name + filepath

## [v2.1.0](https://github.com/AtomLinter/linter-rubocop/compare/v2.0.0...v2.1.0)

###### Changes:
* Upgrade to `atom-linter@10.0.0`.
* Unique process spawning -- newer linter process spawns will kill older processes

## [v2.0.0](https://github.com/AtomLinter/linter-rubocop/compare/v1.1.1...v2.0.0)

###### Changes:
* Upgrade to work with Linter 2 API
* Pull detailed documentation from bbatsov's style guide
* Linter timeout configurable (defaults to 10 seconds)

## [v1.1.1](https://github.com/AtomLinter/linter-rubocop/compare/v1.1.0...v1.1.1)

###### Bug Fixes:
* Run atom lint from project root instead of file current being edited -- makes sure .ruby-version is respected

## [v1.1.0](https://github.com/AtomLinter/linter-rubocop/compare/v1.0.0...v1.1.0)

*   Use [atom-package-deps](https://www.npmjs.com/package/atom-package-deps) to ensure that Atom Linter is installed

## [v1.0.0](https://github.com/AtomLinter/linter-rubocop/compare/v0.5.3...v1.0.0)

*   Re-write in ES2017 (No more ☕ script yey!)
*   Added Rubocop autocorrect functionality (`Linter Rubocop: Fix File`)

    Demo:
    https://gfycat.com/GrouchyCloudyAlleycat
###### Breaking changes:
* Does not support old Linter Rubocop configs `executablePath` and `additionalArguments`
* Minimum Atom engine of `1.4.0`

## [v0.5.3](https://github.com/AtomLinter/linter-rubocop/compare/v0.5.2...v0.5.3)

*   Fixed activation on Chef code

## [v0.5.2](https://github.com/AtomLinter/linter-rubocop/compare/v0.5.1...v0.5.2)

*   Add Ruby-on-Rails and Chef to the activation grammar list

## [v0.5.1](https://github.com/AtomLinter/linter-rubocop/compare/v0.5.0...v0.5.1)

*   Only load the package when a Ruby file is opened

## [0.5.0](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.7...v0.5.0)

*   Note the minimum `rubocop` version of v0.37.0
*   Add specs and enable CI builds
*   Add links in messages to the rule documentation

## [0.4.7](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.6...v0.4.7)

### Maintenance

*   Upgrade to `atom-linter@4.3.0`.

## [0.4.6](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.5...v0.4.6)

### Maintenance

*   Upgrade to `atom-linter@4.2.0` which adds $PATH support.

## [0.4.5](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.4...v0.4.5)

### Maintenance

*   Upgrade to `atom-linter@4`.

## [0.4.4](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.3...v0.4.4)

### Bug Fixes

*   Fix `undefined` showing up in `command` option.

## [0.4.3](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.2...v0.4.3)

### Changes

*   Improve command description.

## [0.4.2](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.1...v0.4.2)

### Changes

*   There is now a single `command` option. Example commands are `rubocop`,
    `bundle exec rubocop`, `rubocop --config /my/config`, etc. The necessary
    arguments `linter-rubocop` needs will be automatically appended to whatever base
    command you specify. Existing `executablePath` and `additionalArguments`
    config options will automatically be merged into the `command` option on the
    first run.

### Bug Fixes

*   The linter will now run in the directory of the file being linted. This
    should make `bundle exec rubocop` function correctly again.

## [0.4.1](https://github.com/AtomLinter/linter-rubocop/compare/v0.4.0...v0.4.1)

### Bug Fixes

*   The linter will now ignore `stderr` output from `rubocop` if it is still able to
    parse `stdout`.

## [0.4.0](https://github.com/AtomLinter/linter-rubocop/compare/v0.2.2...v0.4.0)

### New Features

*   Use STDIN for linting
    [#72](https://github.com/AtomLinter/linter-rubocop/pull/72/files). This
    version requires `rubocop >= 0.34.0`.

## [0.2.2](https://github.com/AtomLinter/linter-rubocop/compare/v0.2.1...v0.2.2)

### Bugs fixed

*   Expose `rubocopExecutablePath` in settings-view [#23](https://github.com/AtomLinter/linter-rubocop/issues/23)

## [0.2.1](https://github.com/AtomLinter/linter-rubocop/compare/v0.2.0...v0.2.1)

### New Features

*   Support `rspec` syntax [#12](https://github.com/AtomLinter/linter-rubocop/pull/12)

## [0.2.0](https://github.com/AtomLinter/linter-rubocop/compare/c0e9273533150513f828959cbcd70062e3bf555f...v0.2.1)

### New Features

*   Run linter under `source.ruby.rails`, with `-R` flag [#5](https://github.com/AtomLinter/linter-rubocop/issues/5)
