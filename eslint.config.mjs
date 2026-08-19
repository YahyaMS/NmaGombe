import coreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  { ignores: ['functions/lib/**'] },
  ...coreWebVitals,
  ...nextTypescript,
]

export default eslintConfig
