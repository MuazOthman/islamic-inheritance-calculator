import Fraction from 'fraction.js'
import { Heir } from './heir'

export type AddShareStep = {
  addedShare: Result,
  stepType: 'add_share'
}

export type RedistributeStep = {
  stepType: 'redistribute'
  sharesAfterRedistribution: Result[]
}

export type SpecialCaseStep = {
  stepType: 'special_case'
  specialCase: 'umariyyah'|'mushtaraka'|'awl'|'radd'
  sharesAfterAdjustment: Result[]
}

export type Step = AddShareStep | RedistributeStep | SpecialCaseStep

export type Result = { name: Heir, count: number, type: 'tasib'|'fard'|'special_case', share: Fraction }

export type ResultWithExplanation = { shares: Result[], steps: Step[] }

export const isFard = (result: Result) => result.type === 'fard' 
export const isTasib = (result: Result) => result.type === 'tasib' 

export const findFromResult = (
  results: Result[],
  heir: Heir,
  type?: 'tasib'|'fard'|'special_case'
) => {
  if(type) return results.find(r => r.name === heir && r.type === type)
  return results.find(r => r.name === heir)
}

export const findAllFromResult = (
  results: Result[],
  heir: Heir,
) => {
  return results.filter(r => r.name === heir)
}

export const updateResults = (
  results: Result[],
  updateResults: Result[]
) => {
  return results.map(r => {
    const updated = findFromResult(updateResults, r.name, r.type)
    return updated || r
  })
}

export function printResults(results: Result[]) {
  const fractionToString = (r: Result) => ({
    ...r,
    share: r.share.toFraction()
  })

  console.log(results.map(fractionToString))
}

export function printResultsWithExplanation(result: ResultWithExplanation){
  console.log('Shares')
  printResults(result.shares)
  console.log('Steps')
  result.steps.forEach(s => {
    if(s.stepType === 'add_share') {
      console.log('Add share')
      printResults([s.addedShare])
    } else if(s.stepType === 'redistribute') {
      console.log('Redistribute')
      printResults(s.sharesAfterRedistribution)
    } else if(s.stepType === 'special_case') {
      console.log('Special case')
      printResults(s.sharesAfterAdjustment)
    }
  })
};

export const sumResults = (results: Result[]) => {
  let sum = new Fraction(0)
  results.forEach(r => sum = sum.add(r.share))
  return sum
}