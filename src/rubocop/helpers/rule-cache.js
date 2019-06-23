'use babel'

const RULE_INDEX_REGEX = /===.*\[\[(.*)\]\]/g
const DOCUMENTATION_LIFETIME = 86400 * 1000
const docsRuleCache = new Map()

function takeWhile(source, predicate) {
  const result = []
  const { length } = source
  let i = 0

  while (i < length && predicate(source[i], i)) {
    result.push(source[i])
    i += 1
  }

  return result
}

// Retrieves style guide documentation with cached responses
export default async function getRuleMarkDown(url) {
  if (url == null) {
    return null
  }
  const ruleMatch = /https:\/\/github.com\/.*\/ruby-style-guide#(.*)/g.exec(url)
  if (ruleMatch == null) {
    return null
  }

  const rule = ruleMatch[1]
  if (docsRuleCache.has(rule)) {
    const cachedRule = docsRuleCache.get(rule)

    if (new Date().getTime() >= cachedRule.expires) {
      // If documentation is stale, clear cache
      docsRuleCache.delete(rule)
    } else {
      return cachedRule.markdown
    }
  }

  let rawRulesMarkdown
  const response = await fetch('https://raw.githubusercontent.com/bbatsov/ruby-style-guide/master/README.adoc')
  if (response.ok) {
    rawRulesMarkdown = await response.text()
  } else {
    return `***\nError retrieving documentation: ${response.statusText}`
  }

  const byLine = rawRulesMarkdown.split('\n')
  const ruleIndexes = byLine.reduce(
    (acc, line, idx) => (line.match(RULE_INDEX_REGEX) ? acc.concat([[idx, line]]) : acc),
    [],
  )

  ruleIndexes.forEach(([startingIndex, startingLine]) => {
    const ruleName = RULE_INDEX_REGEX.exec(startingLine)[1]

    if (ruleName == null) { return }

    const beginSearch = byLine.slice(startingIndex + 1)

    // gobble all the documentation until you reach the next rule
    const documentationForRule = takeWhile(beginSearch, x => !x.match(RULE_INDEX_REGEX))
    const markdownOutput = '\n'.concat(documentationForRule.join('\n'))

    docsRuleCache.set(ruleName, {
      markdown: markdownOutput,
      expires: new Date().getTime() + DOCUMENTATION_LIFETIME,
    })
  })

  if (docsRuleCache.has(rule)) {
    return docsRuleCache.get(rule).markdown
  }
  return null
}
