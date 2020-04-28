'use babel'

import fs from 'fs'
import { findAsync } from 'atom-linter'
import path from 'path'

export default async function deserializeProjectFile(filePath, configFile) {
  if (await findAsync(filePath, configFile) !== null) {
    try {
      return JSON.parse(
        fs.readFileSync(
          path.join(
            atom.project.relativizePath(filePath)[0] || path.dirname(filePath),
            configFile,
          ),
        ),
      )
    } catch (error) {
      return null
    }
  }
  return null
}
