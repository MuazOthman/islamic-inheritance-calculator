import Fraction from 'fraction.js'
import { sum, zip, flow } from 'lodash'
import { Heir } from './heir'
import {
  Result,
  findFromResult,
  sumResults,
  updateResults,
  ResultWithExplanation,
  Step,
  SpecialCaseStep
} from './result'
import { sixth, quarter, third, half, nothing } from './quota'
import { distribute } from './utils'


export function calculateSpecialCases(
  results: ResultWithExplanation
): ResultWithExplanation {
  return flow([umariyyahCase, mushtarakaCase, awlCase, raddCase])(results)
}

function awlCase(result: ResultWithExplanation): ResultWithExplanation {
  const whole = new Fraction(1)
  const sum = sumResults(result.shares)
  const remaining = whole.sub(sum)
  if (remaining.compare(0) < 0) {
    const adjustedShares = result.shares.map(r => ({
      ...r,
      share: r.share.div(sum)
    }))
    return {
      shares: adjustedShares,
      steps: [...result.steps, { stepType: 'special_case', specialCase: 'awl', sharesAfterAdjustment: adjustedShares }]
    } as ResultWithExplanation
  }

  return result
}

function raddCase(result: ResultWithExplanation):ResultWithExplanation {
  const whole = new Fraction(1)
  const remaining = whole.sub(sumResults(result.shares))

  if (remaining.compare(0) > 0) {
    const ratios = toRatio(
      result.shares.map(r => {
        if ((r.name === 'wife' || r.name === 'husband') && result.shares.length > 1) {
          return new Fraction(0)
        }
        return r.share
      })
    )

    const adjustedShares = zip(result.shares, ratios).map(([r, ratio]) => {
      if (!r || !ratio) {
        throw Error('result and ratios should be equal in length')
      }

      return { ...r, share: r.share.add(remaining.mul(ratio)) }
    })
    return {
      shares: adjustedShares,
      steps: [...result.steps, { stepType: 'special_case', specialCase: 'radd', sharesAfterAdjustment: adjustedShares }]
    } as ResultWithExplanation
  }

  return result
}

function mushtarakaCase(result:ResultWithExplanation): ResultWithExplanation {
  const fullBrother = findFromResult(result.shares, 'full_brother')
  const maternalSibling = findFromResult(result.shares, 'maternal_sibling')

  if (fullBrother && maternalSibling) {
    if (fullBrother.share.compare(nothing) === 0) {
      const adjustedShares = updateResults(
        result.shares,
        distribute([fullBrother, maternalSibling], maternalSibling.share)
      )
      return {
        shares: adjustedShares,
        steps: [...result.steps, { stepType: 'special_case', specialCase: 'mushtaraka', sharesAfterAdjustment: adjustedShares }]
      } as ResultWithExplanation
    }
  }

  return result
}

function umariyyahCase(result: ResultWithExplanation): ResultWithExplanation {
  const father = findFromResult(result.shares, 'father')
  const mother = findFromResult(result.shares, 'mother')
  const wife = findFromResult(result.shares, 'wife')
  const husband = findFromResult(result.shares, 'husband')

  const isUmariyyah = result.shares.every(r => {
    const umariyyahParticipants: Heir[] = ['father', 'mother', 'husband', 'wife']
    return umariyyahParticipants.includes(r.name)
  })

  if (!isUmariyyah) return result

  const type = 'special_case'
  let newResults: Result[] | undefined = undefined
  if (father && mother && wife) {
    newResults = [
      { ...wife, share: quarter },
      { ...father, type, share: half },
      { ...mother, type, share: quarter }
    ]
  } else if (father && mother && husband) {
    newResults = [
      { ...husband, share: half },
      { ...father, type, share: third },
      { ...mother, type, share: sixth }
    ]
  }

  if(!newResults) return result

  return {
    shares: newResults,
    steps: [...result.steps, { stepType: 'special_case', sharesAfterAdjustment: newResults,  specialCase: 'umariyyah'} as SpecialCaseStep]
  } as ResultWithExplanation
}

const toRatio = (fractions: Fraction[]) => {
  const oldBase = fractions.reduce(
    (accumulator, current) => accumulator.gcd(current),
    new Fraction(1)
  ).d
  const ratios = fractions.map(f => (oldBase / f.d) * f.n)
  const newBase = sum(ratios)
  return ratios.map(r => new Fraction(r, newBase))
}