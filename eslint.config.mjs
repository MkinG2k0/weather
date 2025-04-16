import {dirname} from 'path'
import {fileURLToPath} from 'url'
import {FlatCompat} from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
	baseDirectory: __dirname,
})
// "next/core-web-vitals", "next/typescript"
const eslintConfig = [
	...compat.extends(),
]

export default eslintConfig
