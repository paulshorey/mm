import mantine from 'eslint-config-mantine'
import { nextJsConfig } from '@repo/config/eslint/next-js'

/** @type {import("eslint").Linter.Config} */
export default {
  ...mantine,
  ...nextJsConfig,
}
