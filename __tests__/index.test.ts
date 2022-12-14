import { calculate } from '../src/index'
import { Result, findFromResult, printResults, findAllFromResult, AddShareStep, printResultsWithExplanation, SpecialCaseStep } from '../src/result'
import { Heir, heirs as defaultHeirs} from '../src/heir';
import Fraction from 'fraction.js';

function checkResult(
  results: Result[],
  heir: Heir | { name: Heir, type?: 'fard'|'tasib'|'special_case' },
  share: Fraction
) {
  const result = (() => {
    if(typeof heir === 'string') { return findFromResult(results, heir) }

    if(heir.type) return findFromResult(results, heir.name, heir.type)
    return findFromResult(results, heir.name)
  })()

  if(!result) {
    throw Error(`${(typeof heir === 'string') ? heir: heir.name} couldn't be found in result`)
  }
  expect(result.share).toEqual(share)
}

function ensureCompleteResult(results: Result[],heirs: Heir[]){
  const allPossibleHeirs = Object.keys(defaultHeirs) as Heir[]
  let sum = new Fraction(0)
  for(const heir of allPossibleHeirs) {
    const result = findAllFromResult(results, heir)
    if(result && heirs.some(h => h === heir)) {
      let localSum = new Fraction(0)
      result.forEach(r=> localSum = localSum.add(r.share))
      expect(localSum).not.toEqual(f(0))
      sum = sum.add(localSum)
    } else if(result) {
      result.forEach(r => expect(r.share).toEqual(f(0)))
    } else if(heirs.some(h => h === heir)) {
      throw Error(`result for ${heir} is missing`)
    }
  }
  expect(sum).toEqual(f(1))
}

const f = (num: number, den: number = 1) => new Fraction(num, den)

describe('Some edge cases', () => {
  test('single spouse', () => {
    calculate({ wife: 1 })
    calculate({ husband: 1 })
  })
})

// following test cases were taken from http://inheritance.ilmsummit.org/projects/inheritance/testcasespage.aspx
describe('ilmsummit test cases', () => {

  test('1 wife, 1 son', () => {
    const result = calculate({ wife: 1, son: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(7,8))
    ensureCompleteResult(result.shares, ['wife', 'son'])

    expect(result.steps.length).toEqual(2)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share'])
  })

  test('husband, mother, 1 maternal_brother, 1 full_uncle', () => {
    const result = calculate({
      husband: 1,
      mother: 1,
      maternal_sibling: 1,
      full_paternal_uncle: 1
    })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'mother', f(1,3))
    checkResult(result.shares, 'maternal_sibling', f(1,6))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'maternal_sibling'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share','add_share','add_share'])
  })

  test('1 daughter, 2 full_sisters', () => {
    const result = calculate({ daughter: 1, full_sister: 2 })
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'full_sister', f(1,2))
    ensureCompleteResult(result.shares, ['daughter','full_sister'])

    expect(result.steps.length).toEqual(2)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share'])
  })

  test('2 daughters, 1 paternal_sister', () => {
    const result = calculate({ daughter: 2, paternal_sister: 1 })
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'paternal_sister', f(1,3))
    ensureCompleteResult(result.shares, ['daughter','paternal_sister'])

    expect(result.steps.length).toEqual(2)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share'])
  })

  test('1 daughter, 1 paternal_grand_daughter, 2 full_sister', () => {
    const result = calculate({
      daughter: 1,
      paternal_grand_daughter: 1,
      full_sister: 2
    })
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'paternal_grand_daughter', f(1,6))
    checkResult(result.shares, 'full_sister', f(1,3))
    ensureCompleteResult(result.shares, ['daughter','paternal_grand_daughter','full_sister'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share'])
  })

  test('father, 1 full_brother', () => {
    const result = calculate({ father: 1, full_brother: 1 })
    checkResult(result.shares, 'father', f(1))
    ensureCompleteResult(result.shares, ['father'])

    expect(result.steps.length).toEqual(1)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share'])
  })

  test('1 wife, 1 son, mother', () => {
    const result = calculate({ wife: 1, son: 1, mother: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(17,24))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'son', 'mother'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share'])
  })

  test('husband, 2 full_sister', () => {
    const result = calculate({ husband: 1, full_sister: 2 })
    checkResult(result.shares, 'husband', f(3,7))
    checkResult(result.shares, 'full_sister', f(4,7))
    ensureCompleteResult(result.shares, ['husband', 'full_sister'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share','special_case'])
  })

  test('husband, father, mother', () => {
    const result = calculate({ husband: 1, father: 1, mother: 1 })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'father', f(1,3))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['husband', 'father', 'mother'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'special_case'])
    expect((result.steps[3] as SpecialCaseStep).specialCase).toEqual('umariyyah')
  })

  test('1 wife, father, mother', () => {
    const result = calculate({ wife: 1, father: 1, mother: 1 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'father', f(1,2))
    checkResult(result.shares, 'mother', f(1,4))
    ensureCompleteResult(result.shares, ['wife','father','mother'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share','add_share', 'special_case'])
    expect((result.steps[3] as SpecialCaseStep).specialCase).toEqual('umariyyah')
  })

  test('husband, mother, 2 full_brother, 2 maternal_sibling', () => {
    const result = calculate({
      husband: 1,
      mother: 1,
      full_brother: 2,
      maternal_sibling: 2
    })

    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_brother', f(1,6))
    checkResult(result.shares, 'maternal_sibling', f(1,6))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'full_brother', 'maternal_sibling'])

    expect(result.steps.length).toEqual(5)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'add_share', 'special_case'])
    expect((result.steps[4] as SpecialCaseStep).specialCase).toEqual('mushtaraka')
  })

  test('2 daughter', () => {
    const result = calculate({ daughter: 2 })
    checkResult(result.shares, 'daughter', f(1,1))
    ensureCompleteResult(result.shares, ['daughter'])

    expect(result.steps.length).toEqual(2)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'special_case'])
    expect((result.steps[1] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('mother, 1 full_sister', () => {
    const result = calculate({ mother: 1, full_sister: 1 })
    checkResult(result.shares, 'mother', f(2,5))
    checkResult(result.shares, 'full_sister', f(3,5))
    ensureCompleteResult(result.shares, ['mother', 'full_sister'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'special_case'])
    expect((result.steps[2] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('1 paternal_grand_mother, 1 full_sister, 1 maternal_sibling', () => {
    const result = calculate({
      paternal_grand_mother: 1,
      full_sister: 1,
      maternal_sibling: 1
    })

    checkResult(result.shares, 'paternal_grand_mother', f(1,5))
    checkResult(result.shares, 'full_sister', f(3,5))
    checkResult(result.shares, 'maternal_sibling', f(1,5))
    ensureCompleteResult(result.shares, ['paternal_grand_mother', 'full_sister', 'maternal_sibling'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'special_case'])
    expect((result.steps[3] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('1 daughter, 2 grand_daughter', () => {
    const result = calculate({
      daughter: 1,
      paternal_grand_daughter: 2
    })

    checkResult(result.shares, 'paternal_grand_daughter', f(1,4))
    checkResult(result.shares, 'daughter', f(3,4))
    ensureCompleteResult(result.shares, ['paternal_grand_daughter', 'daughter'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'special_case'])
    expect((result.steps[2] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('mother, 3 maternal_sibling', () => {
    const result = calculate({
      mother: 1,
      maternal_sibling: 3
    })

    checkResult(result.shares, 'mother', f(1,3))
    checkResult(result.shares, 'maternal_sibling', f(2,3))
    ensureCompleteResult(result.shares, ['mother', 'maternal_sibling'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'special_case'])
    expect((result.steps[2] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('1 wife, 2 full_sister', () => {
    const result = calculate({ wife: 1, full_sister: 2 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'full_sister', f(3,4))
    ensureCompleteResult(result.shares, ['wife', 'full_sister'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'special_case'])
    expect((result.steps[2] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('1 wife, 1 daughter, mother', () => {
    const result = calculate({ wife: 1, daughter: 1, mother: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(21,32))
    checkResult(result.shares, 'mother', f(7,32))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'mother'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'special_case'])
    expect((result.steps[3] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('1 wife, mother, 1 maternal_sibling', () => {
    const result = calculate({ wife: 1, mother: 1, maternal_sibling: 1 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'mother', f(1,2))
    checkResult(result.shares, 'maternal_sibling', f(1/4))
    ensureCompleteResult(result.shares, ['wife', 'mother', 'maternal_sibling'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'special_case'])
    expect((result.steps[3] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('2 wife, 1 paternal_grand_mother, 1 maternal_grand_mother, 2 maternal_sibling', () => {
    const result = calculate({
      wife: 2,
      paternal_grand_mother: 1,
      maternal_grand_mother: 1,
      maternal_sibling: 2
    })

    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'paternal_grand_mother', f(1,8))
    checkResult(result.shares, 'maternal_grand_mother', f(1,8))
    checkResult(result.shares, 'maternal_sibling', f(1,2))
    ensureCompleteResult(result.shares, ['wife', 'paternal_grand_mother', 'maternal_grand_mother', 'maternal_sibling'])

    expect(result.steps.length).toEqual(6)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'add_share', 'redistribute', 'special_case'])
    expect((result.steps[5] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('1 wife, 1 daughter, mother, 1 full_brother', () => {
    const result = calculate({ wife: 1, daughter: 1, mother: 1, full_brother: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_brother', f(5,24))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'mother', 'full_brother'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'add_share'])
  })

  test('1 son, mother, 1 paternal_grand_mother, 1 full_uncle', () => {
    const result = calculate({
      son: 1,
      mother: 1,
      paternal_grand_mother: 1,
      full_paternal_uncle: 1
    })

    checkResult(result.shares, 'son', f(5,6))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['son', 'mother'])

    expect(result.steps.length).toEqual(2)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share'])
  })

  test('1 wife, mother, 1 full_uncle', () => {
    const result = calculate({ wife: 1, mother: 1, full_paternal_uncle: 1 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'mother', f(1,3))
    checkResult(result.shares, 'full_paternal_uncle', f(5,12))
    ensureCompleteResult(result.shares, ['wife','mother','full_paternal_uncle'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share'])
  })

  test('1 wife, 1 son, mother, 1 full_uncle', () => {
    const result = calculate({ wife: 1, son: 1, mother: 1, full_paternal_uncle: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(17,24))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'son', 'mother'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share'])
  })

  test('1 wife, 1 daughter, mother, 1 full_uncle', () => {
    const result = calculate({
      wife: 1,
      daughter: 1,
      mother: 1,
      full_paternal_uncle: 1
    })

    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_paternal_uncle', f(5,24))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'mother', 'full_paternal_uncle'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'add_share'])
  })

  test('1 wife, 2 son, mother, full_uncle', () => {
    const result = calculate({ wife: 1, son: 2, mother: 1, full_paternal_uncle: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(17,24))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'son', 'mother'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share'])
  })

  test('1 wife, 1 son, 1 daughter, 1 mother, 1 full_uncle', () => {
    const result = calculate({
      wife: 1,
      son: 1,
      daughter: 1,
      mother: 1,
      full_paternal_uncle: 1
    })

    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(17,36))
    checkResult(result.shares, 'daughter', f(17,72))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'son', 'daughter', 'mother'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'add_share'])
  })

  test('1 wife, 2 daughter, mother, full_uncle', () => {
    const result = calculate({
      wife: 1,
      daughter: 2,
      mother: 1,
      full_paternal_uncle: 1
    })

    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_paternal_uncle', f(1,24))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'mother', 'full_paternal_uncle'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'add_share'])
  })

  test('empty input', () => {
    const result = calculate({})
    expect(result.shares.length).toEqual(0)
  })

  test('husband, 1 son', () => {
    const result = calculate({ husband: 1, son: 1 })
    checkResult(result.shares, 'husband', f(1,4))
    checkResult(result.shares, 'son', f(3,4))
    ensureCompleteResult(result.shares, ['husband', 'son'])

    expect(result.steps.length).toEqual(2)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share'])
  })

  test('husband, 1 son, 1 daughter', () => {
    const result = calculate({ husband: 1, son: 1, daughter: 1 })
    checkResult(result.shares, 'husband', f(1,4))
    checkResult(result.shares, 'son', f(1,2))
    checkResult(result.shares, 'daughter', f(1,4))
    ensureCompleteResult(result.shares, ['husband', 'son', 'daughter'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share'])
  })

  test('husband, 1 full_brother, 1 full_sister', () => {
    const result = calculate({ husband: 1, full_brother: 1, full_sister: 1 })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'full_brother', f(1,3))
    checkResult(result.shares, 'full_sister', f(1,6))
    ensureCompleteResult(result.shares, ['husband','full_brother','full_sister'])

    expect(result.steps.length).toEqual(3)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share'])
  })

  test('2 daughter, father, mother', () => {
    const result = calculate({ daughter: 2, father: 1, mother: 1 })
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'father', f(1,6))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['daughter', 'father', 'mother'])

    expect(result.steps.length).toEqual(4)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'add_share', 'add_share', 'add_share'])
  })

  test('2 daughter, 2 maternal_sibling', () => {
    const result = calculate({ daughter: 2, maternal_sibling: 2})
    checkResult(result.shares, 'daughter', f(1))
    ensureCompleteResult(result.shares, ['daughter'])

    expect(result.steps.length).toEqual(2)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share', 'special_case'])
    expect((result.steps[1] as SpecialCaseStep).specialCase).toEqual('radd')
  })

  test('3 son', () => {
    const result = calculate({ son: 3 })
    checkResult(result.shares, 'son', f(1))
    ensureCompleteResult(result.shares, ['son'])

    expect(result.steps.length).toEqual(1)
    expect(result.steps.map(s => s.stepType)).toEqual(['add_share'])
  })

  test('1 son, 2 daughter', () => {
    const result = calculate({ son: 1, daughter: 2 })
    checkResult(result.shares, 'son', f(1,2))
    checkResult(result.shares, 'daughter', f(1,2))
    ensureCompleteResult(result.shares, ['son', 'daughter'])
  })

  test('2 full_brother, 1 full_sister', () => {
    const result = calculate({ full_brother: 2, full_sister: 1 })
    checkResult(result.shares, 'full_brother', f(4,5))
    checkResult(result.shares, 'full_sister', f(1,5))
    ensureCompleteResult(result.shares, ['full_brother', 'full_sister'])
  })

  test('father, mother, 2 full_sister', () => {
    const result = calculate({ father: 1, mother: 1, full_sister: 2 })
    checkResult(result.shares, 'father', f(5,6))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['father', 'mother'])
  })

  test('husband, 1 full_sister', () => {
    const result = calculate({ husband: 1, full_sister: 1 })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'full_sister', f(1,2))
    ensureCompleteResult(result.shares, ['husband', 'full_sister'])
  })

  test('husband, 1 daughter, father', () => {
    const result = calculate({ husband: 1, daughter: 1, father: 1 })
    checkResult(result.shares, 'husband', f(1,4))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, { name: 'father', type: 'fard' }, f(1,6))
    checkResult(result.shares, { name: 'father', type: 'tasib' }, f(1,12))
    ensureCompleteResult(result.shares, ['husband', 'daughter', 'father'])
  })

  test('husband, 1 grand_daughter, 1 full_cousin', () => {
    const result = calculate({
      husband: 1,
      paternal_grand_daughter: 1,
      full_cousin: 1
    })
    checkResult(result.shares, 'husband', f(1,4))
    checkResult(result.shares, 'paternal_grand_daughter', f(1,2))
    checkResult(result.shares, 'full_cousin', f(1,4))
    ensureCompleteResult(result.shares,['husband','paternal_grand_daughter','full_cousin'])
  })

  test('mother, 2 full_brother', () => {
    const result = calculate({ mother: 1, full_brother: 2 })
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_brother', f(5,6))
    ensureCompleteResult(result.shares, ['mother', 'full_brother'])
  })

  test('mother, 1 paternal_brother, 1 maternal_sibling', () => {
    const result = calculate({
      mother: 1,
      paternal_brother: 1,
      maternal_sibling: 1
    })
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'paternal_brother', f(2,3))
    checkResult(result.shares, 'maternal_sibling', f(1,6))
    ensureCompleteResult(result.shares, ['mother','paternal_brother','maternal_sibling'])
  })

  test('2 wife, mother, 1 full_nephew', () => {
    const result = calculate({ wife: 2, mother: 1, full_nephew: 1 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'mother', f(1,3))
    checkResult(result.shares, 'full_nephew', f(5,12))
    ensureCompleteResult(result.shares, ['wife', 'mother', 'full_nephew'])
  })

  test('1 wife, 2 daughter, 1 paternal_cousin', () => {
    const result = calculate({ wife: 1, daughter: 2, paternal_cousin: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'paternal_cousin', f(5,24))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'paternal_cousin'])
  })

  test('1 daughter, 1 grandson', () => {
    const result = calculate({ daughter: 1, paternal_grand_son: 1 })
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'paternal_grand_son', f(1,2))
    ensureCompleteResult(result.shares, ['daughter','paternal_grand_son'])
  })

  test('1 daughter, 1 paternal_cousin', () => {
    const result = calculate({ daughter: 1, paternal_cousin: 1 })
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'paternal_cousin', f(1,2))
    ensureCompleteResult(result.shares, ['daughter','paternal_cousin'])
  })

  test('1 husband, 1 paternal_grand_mother, 1 maternal_brother, 1 full_uncle', () => {
    const result = calculate({
      husband: 1,
      paternal_grand_mother: 1,
      maternal_sibling: 1,
      full_paternal_uncle: 1
    })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'paternal_grand_mother', f(1,6))
    checkResult(result.shares, 'maternal_sibling', f(1,6))
    checkResult(result.shares, 'full_paternal_uncle', f(1,6))
    ensureCompleteResult(result.shares, ['husband','paternal_grand_mother','maternal_sibling','full_paternal_uncle'])
  })

  test('1 wife, father', () => {
    const result = calculate({ wife: 1, father: 1 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'father', f(3,4))
    ensureCompleteResult(result.shares, ['wife', 'father'])
  })

  test('1 wife, 1 son, father', () => {
    const result = calculate({ wife: 1, son: 1, father: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(17,24))
    checkResult(result.shares, 'father', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'son', 'father'])
  })

  test('1 wife, 1 daughter, 1 full_brother', () => {
    const result = calculate({ wife: 1, daughter: 1, full_brother: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'full_brother', f(3,8))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'full_brother'])
  })

  test('mother, 1 full_brother, 1 maternal_brother', () => {
    const result = calculate({ mother: 1, full_brother: 1, maternal_sibling: 1 })
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_brother', f(2,3))
    checkResult(result.shares, 'maternal_sibling', f(1,6))
    ensureCompleteResult(result.shares, ['mother', 'full_brother', 'maternal_sibling'])
  })

  test('1 daughter, 1 mother, 1 paternal_brother', () => {
    const result = calculate({ daughter: 1, mother: 1, paternal_brother: 1 })
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'paternal_brother', f(1,3))
    ensureCompleteResult(result.shares, ['daughter', 'mother', 'paternal_brother'])
  })

  test('1 wife, 1 daughter, 1 father', () => {
    const result = calculate({ wife: 1, daughter: 1, father: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, { name: 'father', type: 'fard' }, f(1,6))
    checkResult(result.shares, { name: 'father', type: 'tasib' }, f(5,24))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'father'])
  })

  test('husband, mother, 1 full_brother', () => {
    const result = calculate({ husband: 1, mother: 1, full_brother: 1 })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'mother', f(1,3))
    checkResult(result.shares, 'full_brother', f(1,6))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'full_brother'])
  })

  test('1 wife, 1 son, father, mother', () => {
    const result = calculate({ wife: 1, son: 1, father: 1, mother: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(13,24))
    checkResult(result.shares, 'father', f(1,6))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'son', 'father', 'mother'])
  })

  test('1 wife, 1 daughter, father, mother, 1 full_brother', () => {
    const result = calculate({ wife: 1, daughter: 1, father: 1, mother: 1, full_brother: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, { name: 'father', type: 'fard' }, f(1,6))
    checkResult(result.shares, { name: 'father', type: 'tasib' }, f(1,24))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'father', 'mother'])
  })

  test('1 wife, 1 daughter, 1 grand_daughter, 1 mother, 1 full_brother', () => {
    const result = calculate({
      wife: 1,
      daughter: 1,
      paternal_grand_daughter: 1,
      mother: 1,
      full_brother: 1
    })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'paternal_grand_daughter', f(1,6))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_brother', f(1,24))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'paternal_grand_daughter', 'mother', 'full_brother'])
  })

  test('1 wife, 3 daughter, 1 paternal_grand_mother, 1 full_brother', () => {
    const result = calculate({
      wife: 1,
      daughter: 3,
      paternal_grand_mother: 1,
      full_brother: 1
    })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'paternal_grand_mother', f(1,6))
    checkResult(result.shares, 'full_brother', f(1,24))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'paternal_grand_mother', 'full_brother'])
  })

  test('1 wife, 3 Daughter, 1 full_brother', () => {
    const result = calculate({ wife: 1, daughter: 3, full_brother: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'full_brother', f(5,24))
    ensureCompleteResult(result.shares, ['wife','daughter','full_brother'])
  })

  test('3 daughter, 1 paternal_uncle', () => {
    const result = calculate({ daughter: 3, full_paternal_uncle: 1 })
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'full_paternal_uncle', f(1,3))
    ensureCompleteResult(result.shares, ['daughter', 'full_paternal_uncle'])
  })

  test('2 wife, 3 full_sister, 3 paternal_brother', () => {
    const result = calculate({ wife: 2, full_sister: 3, paternal_brother: 3 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'full_sister', f(2,3))
    checkResult(result.shares, 'paternal_brother', f(1,12))
    ensureCompleteResult(result.shares, ['wife','full_sister','paternal_brother'])
  })

  test('2 wife, 3 paternal_grand_mother, 3 maternal_brother, 2 full_uncle', () => {
    const result = calculate({
      wife: 2,
      paternal_grand_mother: 3,
      maternal_sibling: 3,
      full_paternal_uncle: 2
    })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'paternal_grand_mother', f(1,6))
    checkResult(result.shares, 'maternal_sibling', f(1,3))
    checkResult(result.shares, 'full_paternal_uncle', f(1,4))
    ensureCompleteResult(result.shares, ['wife','paternal_grand_mother','maternal_sibling','full_paternal_uncle'])
  })

  test('1 son, 1 daughter', () => {
    const result = calculate({ son: 1, daughter: 1 })
    checkResult(result.shares, 'son', f(2,3))
    checkResult(result.shares, 'daughter', f(1,3))
    ensureCompleteResult(result.shares, ['son', 'daughter'])
  })

  test('1 full_brother, 1 full_sister', () => {
    const result = calculate({ full_brother: 1, full_sister: 1 })
    checkResult(result.shares, 'full_brother', f(2,3))
    checkResult(result.shares, 'full_sister', f(1,3))
    ensureCompleteResult(result.shares, ['full_brother', 'full_sister'])
  })

  test('1 son, 2 daughter, 1 father', () => {
    const result = calculate({ son: 1, daughter: 2, father: 1 })
    checkResult(result.shares, 'son', f(5,12))
    checkResult(result.shares, 'daughter', f(5,12))
    checkResult(result.shares, 'father', f(1,6))
    ensureCompleteResult(result.shares, ['son', 'daughter', 'father'])
  })

  test('1 wife, 1 paternal_brother, 1 paternal_sister', () => {
    const result = calculate({ wife: 1, paternal_brother: 1, paternal_sister: 1 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'paternal_brother', f(1,2))
    checkResult(result.shares, 'paternal_sister', f(1,4))
    ensureCompleteResult(result.shares, ['wife','paternal_brother','paternal_sister'])
  })

  test('mother, 1 full_brother, 2 full_sister', () => {
    const result = calculate({ mother: 1, full_brother: 1, full_sister: 2 })
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_brother', f(5,12))
    checkResult(result.shares, 'full_sister', f(5,12))
    ensureCompleteResult(result.shares, ['mother','full_brother','full_sister'])
  })

  test('2 daughter, 1 grand_son, 1 grand_daughter', () => {
    const result = calculate({ daughter: 2, paternal_grand_son: 1, paternal_grand_daughter: 1 })
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'paternal_grand_son', f(2,9))
    checkResult(result.shares, 'paternal_grand_daughter', f(1,9))
    ensureCompleteResult(result.shares, ['daughter', 'paternal_grand_son', 'paternal_grand_daughter'])
  })

  test('husband, 1 grand_son, 2 grand_daughter', () => {
    const result = calculate({ husband: 1, paternal_grand_son: 1, paternal_grand_daughter: 2 })
    checkResult(result.shares, 'husband', f(1,4))
    checkResult(result.shares, 'paternal_grand_son', f(3,8))
    checkResult(result.shares, 'paternal_grand_daughter', f(3,8))
    ensureCompleteResult(result.shares, ['husband', 'paternal_grand_son', 'paternal_grand_daughter'])
  })

  test('1 full_uncle', () => {
    const result = calculate({ full_paternal_uncle: 1 })
    checkResult(result.shares, 'full_paternal_uncle', f(1,1))
    ensureCompleteResult(result.shares, ['full_paternal_uncle'])
  })

  test('1 paternal_cousin', () => {
    const result = calculate({ paternal_cousin: 1 })
    checkResult(result.shares, 'paternal_cousin', f(1,1))
    ensureCompleteResult(result.shares, ['paternal_cousin'])
  })

  test('3 son, 1 daughter', () => {
    const result = calculate({ son: 3, daughter: 1 })
    checkResult(result.shares, 'son', f(6,7))
    checkResult(result.shares, 'daughter', f(1,7))
    ensureCompleteResult(result.shares, ['son','daughter'])
  })

  test('1 wife, 3 son, 1 daughter', () => {
    const result = calculate({ wife: 1, son: 3, daughter: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(3,4))
    checkResult(result.shares, 'daughter', f(1,8))
    ensureCompleteResult(result.shares, ['wife','son','daughter'])
  })

  test('1 wife, 1 son, 1 daughter', () => {
    const result = calculate({ wife: 1, son: 1, daughter: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(7,12))
    checkResult(result.shares, 'daughter', f(7,24))
    ensureCompleteResult(result.shares, ['wife','son','daughter'])
  })

  test('1 husband, 1 son, 1 daughter', () => {
    const result = calculate({ husband: 1, son: 1, daughter: 1 })
    checkResult(result.shares, 'husband', f(1,4))
    checkResult(result.shares, 'son', f(1,2))
    checkResult(result.shares, 'daughter', f(1,4))
    ensureCompleteResult(result.shares, ['husband','son','daughter'])
  })

  test('husband, 1 paternal_brother, 1 paternal_sister', () => {
    const result = calculate({ husband: 1, paternal_brother: 1, paternal_sister: 1 })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'paternal_brother', f(1,3))
    checkResult(result.shares, 'paternal_sister', f(1,6))
    ensureCompleteResult(result.shares, ['husband','paternal_brother','paternal_sister'])
  })

  test('1 son, 2 daughter, mother', () => {
    const result = calculate({ son: 1, daughter: 2, mother: 1 })
    checkResult(result.shares, 'son', f(5,12))
    checkResult(result.shares, 'daughter', f(5,12))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['son', 'daughter', 'mother'])
  })

  test('1 wife, 1 son, 2 daughter, mother', () => {
    const result = calculate({ wife: 1, son: 1, daughter: 2, mother: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(17,48))
    checkResult(result.shares, 'daughter', f(17,48))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'son', 'daughter', 'mother'])
  })

  test('2 daughter, 3 grand_son, 2 grand_daughter', () => {
    const result = calculate({
      daughter: 2,
      paternal_grand_son: 3,
      paternal_grand_daughter: 2
    })
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'paternal_grand_son', f(1,4))
    checkResult(result.shares, 'paternal_grand_daughter', f(1,12))
    ensureCompleteResult(result.shares, ['daughter', 'paternal_grand_son', 'paternal_grand_daughter'])
  })

  test('husband, 1 full_sister, 1 paternal_brother, 1 paternal_sister', () => {
    const result = calculate({
      husband: 1,
      full_sister: 1,
      paternal_brother: 1,
      paternal_sister: 1
    })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'full_sister', f(1,2))
    ensureCompleteResult(result.shares, ['husband', 'full_sister'])
  })

  test('2 wife, 1 son, 1 daughter, mother', () => {
    const result = calculate({ wife: 2, son: 1, daughter: 1, mother: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(17,36))
    checkResult(result.shares, 'daughter', f(17,72))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'son', 'daughter', 'mother'])
  })

  test('1 wife, 1 grand_son, 1 grand_daughter, 1 father, mother', () => {
    const result = calculate({
      wife: 1,
      paternal_grand_son: 1,
      paternal_grand_daughter: 1,
      father: 1,
      mother: 1
    })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'paternal_grand_son', f(13,36))
    checkResult(result.shares, 'paternal_grand_daughter', f(13,72))
    checkResult(result.shares, 'father', f(1,6))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'paternal_grand_son', 'paternal_grand_daughter', 'father', 'mother'])
  })

  test('1 husband, 1 daughter, 1 mother, 1 full_sister', () => {
    const result = calculate({
      husband: 1,
      daughter: 1,
      mother: 1,
      full_sister: 1
    })
    checkResult(result.shares, 'husband', f(1,4))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_sister', f(1,12))
    ensureCompleteResult(result.shares, ['husband', 'daughter', 'mother', 'full_sister'])
  })

  test('1 wife, 2 daughter, 1 full_sister', () => {
    const result = calculate({ wife: 1, daughter: 2, full_sister: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'full_sister', f(5,24))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'full_sister'])
  })

  test('2 grand_daughter, 3 full_sister', () => {
    const result = calculate({ paternal_grand_daughter: 2, full_sister: 3 })
    checkResult(result.shares, 'paternal_grand_daughter', f(2,3))
    checkResult(result.shares, 'full_sister', f(1,3))
    ensureCompleteResult(result.shares, ['paternal_grand_daughter', 'full_sister'])
  })

  test('1 daughter, 1 grand_daughter, 2 full_sister', () => {
    const result = calculate({ daughter: 1, paternal_grand_daughter: 1, full_sister: 2 })
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'paternal_grand_daughter', f(1,6))
    checkResult(result.shares, 'full_sister', f(1,3))
    ensureCompleteResult(result.shares, ['daughter', 'paternal_grand_daughter', 'full_sister'])
  })

  test('3 daughter, 3 full_sister', () => {
    const result = calculate({ daughter: 3, full_sister: 3 })
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'full_sister', f(1,3))
    ensureCompleteResult(result.shares, ['daughter', 'full_sister'])
  })

  test('1 daughter, 1 grand_daughter, mother, 2 paternal_sister', () => {
    const result = calculate({
      daughter: 1,
      paternal_grand_daughter: 1,
      mother: 1,
      paternal_sister: 2
    })
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'paternal_grand_daughter', f(1,6))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'paternal_sister', f(1,6))
    ensureCompleteResult(result.shares, ['daughter','paternal_grand_daughter','mother','paternal_sister'])
  })

  test('2 wife, 3 full_brother, 1 full_sister', () => {
    const result = calculate({ wife: 2, full_brother: 3, full_sister: 1 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'full_brother', f(9,14))
    checkResult(result.shares, 'full_sister', f(3,28))
    ensureCompleteResult(result.shares, ['wife', 'full_brother', 'full_sister'])
  })

  test('1 wife, 1 daughter, 1 full_brother, 1 full_uncle', () => {
    const result = calculate({ wife: 1, daughter: 1, full_brother: 1, full_paternal_uncle: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'full_brother', f(3,8))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'full_brother'])
  })

  test('mother, 1 paternal_grand_mother, 1 full_brother, 1 paternal_brother', () => {
    const result = calculate({
      mother: 1,
      paternal_grand_mother: 1,
      full_brother: 1,
      paternal_brother: 1
    })
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_brother', f(5,6))
    ensureCompleteResult(result.shares, ['mother', 'full_brother'])
  })

  test('1 wife, 2 full_brother, 1 full_sister, 1 full_uncle', () => {
    const result = calculate({
      wife: 1,
      full_brother: 2,
      full_sister: 1,
      full_paternal_uncle: 1
    })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'full_brother', f(3,5))
    checkResult(result.shares, 'full_sister', f(3,20))
    ensureCompleteResult(result.shares, ['wife','full_brother','full_sister'])
  })

  test('2 wife, 1 daughter, 1 father, 1 grand_father, 1 full_brother', () => {
    const result = calculate({
      wife: 2,
      daughter: 1,
      father: 1,
      paternal_grand_father: 1,
      full_brother: 1
    })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, { name: 'father', type: 'fard' }, f(1,6))
    checkResult(result.shares, { name: 'father', type: 'tasib' }, f(5,24))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'father'])
  })

  test('husband, mother, 1 full_brother, 1 full_sister, 1 full_uncle', () => {
    const result = calculate({
      husband: 1,
      mother: 1,
      full_brother: 1,
      full_sister: 1,
      full_paternal_uncle: 1
    })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'full_brother', f(2,9))
    checkResult(result.shares, 'full_sister', f(1,9))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'full_brother', 'full_sister'])
  })

  test('1 son, father, mother, 1 full_brother', () => {
    const result = calculate({ son: 1, father: 1, mother: 1, full_brother: 1 })
    checkResult(result.shares, 'son', f(2,3))
    checkResult(result.shares, 'father', f(1,6))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['son', 'father', 'mother'])
  })

  test('1 wife, 1 son, 1 father, 1 paternal_nephew', () => {
    const result = calculate({ wife: 1, son: 1, father: 1, paternal_nephew: 1 })
    checkResult(result.shares, 'wife', f(1,8))
    checkResult(result.shares, 'son', f(17,24))
    checkResult(result.shares, 'father', f(1,6))
    ensureCompleteResult(result.shares, ['wife','son','father'])
  })

  test('husband, 1 full_sister, 1 paternal_sister', () => {
    const result = calculate({ husband: 1, full_sister: 1, paternal_sister: 1 })
    checkResult(result.shares, 'husband', f(3,7))
    checkResult(result.shares, 'full_sister', f(3,7))
    checkResult(result.shares, 'paternal_sister', f(1,7))
    ensureCompleteResult(result.shares, ['husband', 'full_sister', 'paternal_sister'])
  })

  test('1 full_brother, 1 paternal_brother, 1 paternal_sister', () => {
    const result = calculate({ full_brother: 1, paternal_brother: 1, paternal_sister: 1 })
    checkResult(result.shares, 'full_brother', f(1,1))
    ensureCompleteResult(result.shares, ['full_brother'])
  })

  test('1 daughter, 2 full_sister, 1 paternal_brother', () => {
    const result = calculate({ daughter: 1, full_sister: 2, paternal_brother: 1 })
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'full_sister', f(1,2))
    ensureCompleteResult(result.shares, ['daughter','full_sister'])
  })

  test('2 daughter, 3 full_sister, 1 full_nephew', () => {
    const result = calculate({ daughter: 2, full_sister: 3, full_nephew: 1 })
    checkResult(result.shares, 'daughter', f(2,3))
    checkResult(result.shares, 'full_sister', f(1,3))
    ensureCompleteResult(result.shares,['daughter','full_sister'])
  })

  test('1 daughter, 1 grand_daughter, mother, 2 paternal_sister, 1 full_uncle', () => {
    const result = calculate({
      daughter: 1,
      paternal_grand_daughter: 1,
      mother: 1,
      paternal_sister: 2,
      full_paternal_uncle: 1
    })
    checkResult(result.shares, 'daughter', f(1,2))
    checkResult(result.shares, 'paternal_grand_daughter', f(1,6))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'paternal_sister', f(1,6))
    ensureCompleteResult(result.shares, ['daughter','paternal_grand_daughter','mother','paternal_sister'])
  })

  test('husband, 2 son, 1 daughter, 1 father, mother, 1 grand_father, 1 full_brother', () => {
    const result = calculate({
      husband: 1,
      son: 2,
      daughter: 1,
      father: 1,
      mother: 1,
      paternal_grand_father: 1,
      full_brother: 1
    })
    checkResult(result.shares, 'husband', f(1,4))
    checkResult(result.shares, 'son', f(1,3))
    checkResult(result.shares, 'daughter', f(1,12))
    checkResult(result.shares, 'father', f(1,6))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['husband', 'son', 'daughter', 'father', 'mother'])
  })

  test('husband, 1 paternal_grand_mother, 1 full_sister', () => {
    const result = calculate({ husband: 1, paternal_grand_mother: 1, full_sister: 1 })
    checkResult(result.shares, 'husband', f(3,7))
    checkResult(result.shares, 'paternal_grand_mother', f(1,7))
    checkResult(result.shares, 'full_sister', f(3,7))
    ensureCompleteResult(result.shares, ['husband', 'paternal_grand_mother', 'full_sister'])
  })

  test('husband, mother, 1 full_sister', () => {
    const result = calculate({ husband: 1, mother: 1, full_sister: 1 })
    checkResult(result.shares, 'husband', f(3,8))
    checkResult(result.shares, 'mother', f(1,4))
    checkResult(result.shares, 'full_sister', f(3,8))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'full_sister'])
  })

  test('husband, 2 paternal_sister, 2 maternal_brother', () => {
    const result = calculate({ husband: 1, paternal_sister: 2, maternal_sibling: 2 })
    checkResult(result.shares, 'husband', f(1,3))
    checkResult(result.shares, 'paternal_sister', f(4,9))
    checkResult(result.shares, 'maternal_sibling', f(2,9))
    ensureCompleteResult(result.shares, ['husband', 'paternal_sister', 'maternal_sibling'])
  })

  test('husband, mother, 1 full_sister, 1 paternal_sister, 1 maternal_sister', () => {
    const result = calculate({
      husband: 1,
      mother: 1,
      full_sister: 1,
      paternal_sister: 1,
      maternal_sibling: 1
    })
    checkResult(result.shares, 'husband', f(1,3))
    checkResult(result.shares, 'mother', f(1,9))
    checkResult(result.shares, 'full_sister', f(1,3))
    checkResult(result.shares, 'paternal_sister', f(1,9))
    checkResult(result.shares, 'maternal_sibling', f(1,9))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'full_sister', 'paternal_sister', 'maternal_sibling'])
  })

  test('husband, mother, 1 full_sister, 1 paternal_sister, 2 maternal_sister', () => {
    const result = calculate({
      husband: 1,
      mother: 1,
      full_sister: 1,
      paternal_sister: 1,
      maternal_sibling: 2
    })
    checkResult(result.shares, 'husband', f(3,10))
    checkResult(result.shares, 'mother', f(1,10))
    checkResult(result.shares, 'full_sister', f(3,10))
    checkResult(result.shares, 'paternal_sister', f(1,10))
    checkResult(result.shares, 'maternal_sibling', f(1,5))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'full_sister', 'paternal_sister', 'maternal_sibling'])
  })

  test('husband, 2 daughter, mother', () => {
    const result = calculate({ husband: 1, daughter: 2, mother: 1 })
    checkResult(result.shares, 'husband', f(3,13))
    checkResult(result.shares, 'daughter', f(8,13))
    checkResult(result.shares, 'mother', f(2,13))
    ensureCompleteResult(result.shares, ['husband', 'daughter', 'mother'])
  })

  test('1 wife, mother, 2 paternal_sister', () => {
    const result = calculate({ wife: 1, mother: 1, paternal_sister: 2 })
    checkResult(result.shares, 'wife', f(3,13))
    checkResult(result.shares, 'mother', f(2,13))
    checkResult(result.shares, 'paternal_sister', f(8,13))
    ensureCompleteResult(result.shares, ['wife', 'mother', 'paternal_sister'])
  })

  test('1 wife, 2 full_sister, 2 maternal_brother', () => {
    const result = calculate({ wife: 1, full_sister: 2, maternal_sibling: 2 })
    checkResult(result.shares, 'wife', f(1,5))
    checkResult(result.shares, 'full_sister', f(8,15))
    checkResult(result.shares, 'maternal_sibling', f(4,15))
    ensureCompleteResult(result.shares, ['wife', 'full_sister', 'maternal_sibling'])
  })

  test('husband, 2 daughter, father, mother', () => {
    const result = calculate({ husband: 1, daughter: 2, father: 1, mother: 1 })
    checkResult(result.shares, 'husband', f(1,5))
    checkResult(result.shares, 'daughter', f(8,15))
    checkResult(result.shares, 'father', f(2,15))
    checkResult(result.shares, 'mother', f(2,15))
    ensureCompleteResult(result.shares, ['husband', 'daughter', 'father', 'mother'])
  })

  test('1 wife, mother, 2 paternal_sister, 2 maternal_brother', () => {
    const result = calculate({ wife: 1, mother: 1, paternal_sister: 2, maternal_sibling: 2 })
    checkResult(result.shares, 'wife', f(3,17))
    checkResult(result.shares, 'mother', f(2,17))
    checkResult(result.shares, 'paternal_sister', f(8,17))
    checkResult(result.shares, 'maternal_sibling', f(4,17))
    ensureCompleteResult(result.shares, ['wife', 'mother', 'paternal_sister', 'maternal_sibling'])
  })

  test('1 wife, 2 daughter, father, mother', () => {
    const result = calculate({ wife: 1, daughter: 2, father: 1, mother: 1 })
    checkResult(result.shares, 'wife', f(1,9))
    checkResult(result.shares, 'daughter', f(16,27))
    checkResult(result.shares, 'father', f(4,27))
    checkResult(result.shares, 'mother', f(4,27))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'father', 'mother'])
  })

  test('3 daughter', () => {
    const result = calculate({ daughter: 3 })
    checkResult(result.shares, 'daughter', f(1,1))
    ensureCompleteResult(result.shares, ['daughter'])
  })

  test('husband, mother', () => {
    const result = calculate({ husband: 1, mother: 1 })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'mother', f(1,2))
    ensureCompleteResult(result.shares, ['husband', 'mother'])
  })

  test('wife, 1 paternal_grand_mother, 2 maternal_sister', () => {
    const result = calculate({ wife: 1, paternal_grand_mother: 1, maternal_sibling: 2 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'paternal_grand_mother', f(1,4))
    checkResult(result.shares, 'maternal_sibling', f(1,2))
    ensureCompleteResult(result.shares, ['wife', 'paternal_grand_mother', 'maternal_sibling'])
  })

  test('1 wife, father, mother, 1 full_uncle', () => {
    const result = calculate({ wife: 1, father: 1, mother: 1, full_paternal_uncle: 1 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'father', f(1,2))
    checkResult(result.shares, 'mother', f(1,4))
    ensureCompleteResult(result.shares, ['wife', 'father', 'mother'])
  })

  test('husband, 1 paternal_grand_mother, 1 maternal_brother, 1 paternal_cousin', () => {
    const result = calculate({
      husband: 1,
      paternal_grand_mother: 1,
      maternal_sibling: 1,
      paternal_cousin: 1
    })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'paternal_grand_mother', f(1,6))
    checkResult(result.shares, 'maternal_sibling', f(1,6))
    checkResult(result.shares, 'paternal_cousin', f(1,6))
    ensureCompleteResult(result.shares, ['husband', 'paternal_grand_mother', 'maternal_sibling', 'paternal_cousin'])
  })

  xtest('1 wife, father, mother, 2 maternal_brother', () => {
    const result = calculate({ wife: 1, father: 1, mother: 1, maternal_sibling: 2 })
    checkResult(result.shares, 'wife', f(1,4))
    checkResult(result.shares, 'father', f(7,12))
    checkResult(result.shares, 'mother', f(1,6))
    ensureCompleteResult(result.shares, ['wife', 'father', 'mother'])
  })

  test('husband, mother, 1 grand_father', () => {
    const result = calculate({ husband: 1, mother: 1, paternal_grand_father: 1 })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'mother', f(1,3))
    checkResult(result.shares, 'paternal_grand_father', f(1,6))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'paternal_grand_father'])
  })

  test('husband, mother, 2 paternal_brother, 2 maternal_brother', () => {
    const result = calculate({ husband: 1, mother: 1, paternal_brother: 2, maternal_sibling: 2 })
    checkResult(result.shares, 'husband', f(1,2))
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'maternal_sibling', f(1,3))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'maternal_sibling'])
  })

  xtest('1 grand_father, 3 full_brother', () => {
    const result = calculate({ paternal_grand_father: 1, full_brother: 3 })
    checkResult(result.shares, 'paternal_grand_father', f(1,3))
    checkResult(result.shares, 'full_brother', f(2,3))
    ensureCompleteResult(result.shares, ['paternal_grand_father', 'full_brother'])
  })

  test('1 wife, 2 daughter, mother, 1 grand_father, 1 paternal_brother', () => {
    const result = calculate({
      wife: 1,
      daughter: 2,
      mother: 1,
      paternal_grand_father: 1,
      paternal_brother: 1
    })
    checkResult(result.shares, 'wife', f(1,9))
    checkResult(result.shares, 'daughter', f(16,27))
    checkResult(result.shares, 'mother', f(4,27))
    checkResult(result.shares, 'paternal_grand_father', f(4,27))
    ensureCompleteResult(result.shares, ['wife', 'daughter', 'mother', 'paternal_grand_father'])
  })

  xtest('mother, 1 grand_father, 1 full_sister, 1 paternal_brother, 1 paternal_sister', () => {
    const result = calculate({
      mother: 1,
      paternal_grand_father: 1,
      full_sister: 1,
      paternal_brother: 1,
      paternal_sister: 1
    })
    checkResult(result.shares, 'mother', f(1,6))
    checkResult(result.shares, 'paternal_grand_father', f(5,18))
    checkResult(result.shares, 'full_sister', f(1,2))
    checkResult(result.shares, 'paternal_brother', f(1,27))
    checkResult(result.shares, 'paternal_sister', f(1,54))
    ensureCompleteResult(result.shares, ['mother', 'paternal_grand_father', 'full_sister', 'paternal_brother', 'paternal_sister'])
  })

  test('husband, 1 daughter, 1 grand_daughter, 1 grand_father, 1 full_brother', () => {
    const result = calculate({
      husband: 1,
      daughter: 1,
      paternal_grand_daughter: 1,
      paternal_grand_father: 1,
      full_brother: 1
    })
    checkResult(result.shares, 'husband', f(3,13))
    checkResult(result.shares, 'daughter', f(6,13))
    checkResult(result.shares, 'paternal_grand_daughter', f(2,13))
    checkResult(result.shares, 'paternal_grand_father', f(2,13))
    ensureCompleteResult(result.shares, ['husband', 'daughter', 'paternal_grand_daughter', 'paternal_grand_father'])
  })

  xtest('husband, mother, 1 grand_father, 1 full_sister', () => {
    const result = calculate({ husband: 1, mother: 1, paternal_grand_father: 1, full_sister: 1 })
    checkResult(result.shares, 'husband', f(1,3))
    checkResult(result.shares, 'mother', f(2,9))
    checkResult(result.shares, 'paternal_grand_father', f(8,27))
    checkResult(result.shares, 'full_sister', f(4,27))
    ensureCompleteResult(result.shares, ['husband', 'mother', 'paternal_grand_father', 'full_sister'])
  })
})