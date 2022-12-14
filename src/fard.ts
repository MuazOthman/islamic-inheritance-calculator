import fhs from './fardHeirs'
import { Heirs } from './heir'
import {
  Result,
  findFromResult,
  updateResults,
  ResultWithExplanation,
} from './result'
import { exists, count, distribute, isZero } from './utils'
import { sixth } from './quota'


export function calculateFard(heirs: Heirs): ResultWithExplanation {
  const fardHiers = fhs.filter(fh => exists(heirs, fh.name))

  const results = fardHiers
    .map(fh => {
      const result: Result = {
        name: fh.name,
        count: count(heirs, fh.name),
        type: 'fard',
        share: fh.share(heirs)
      }
      return result
    })
    .filter(r => !isZero(r.share))

  const resultWithExplanation: ResultWithExplanation = {
    shares: results,
    steps: results.filter(r=>r.share.compare(0)>0).map(r => ({ addedShare: {...r}, stepType: 'add_share' }))
  }

  return shareSixthBetweenGrandmothers(resultWithExplanation)
}

function shareSixthBetweenGrandmothers(resultWithExplanation: ResultWithExplanation): ResultWithExplanation {
  const mGrandMother = findFromResult(resultWithExplanation.shares, 'maternal_grand_mother')
  const pGrandMother = findFromResult(resultWithExplanation.shares, 'paternal_grand_mother')
  if(mGrandMother && pGrandMother) {
    const redistributed = updateResults(
      resultWithExplanation.shares,
      distribute([mGrandMother, pGrandMother], sixth)
    )
    return {
      shares: redistributed,
      steps: [...resultWithExplanation.steps, { stepType: 'redistribute', sharesAfterRedistribution: [...redistributed] }]
    }
  }

  return resultWithExplanation
}