import { heirs as defaultHeirs, Heirs } from './heir'
import { calculateFard } from './fard'
import { calculateTasib } from './tasib'
import { calculateSpecialCases } from './specialCases'

const calculate = (heirs: Partial<Heirs>) => {
  if(heirs.husband && heirs.wife) {
    throw Error('heirs cannot contain both husband and wife')
  }

  const allHeirs: Heirs = { ...defaultHeirs, ...heirs }
  const fardResult = calculateFard(allHeirs)
  const resultAfterTasib = calculateTasib(allHeirs, fardResult)
  const results = calculateSpecialCases(resultAfterTasib)
  return results
}

export { defaultHeirs } 
export { calculate }