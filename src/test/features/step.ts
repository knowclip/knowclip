import { TestSetup } from '../setUpDriver'

type TestStep = {
  description: string
  runTest: (setup: TestSetup) => Promise<any>
}

export const step = (
  description: string,
  runTest: (setup: TestSetup) => Promise<any>
): TestStep => ({ description, runTest })

export const runAll = (testSteps: TestStep[], getSetup: () => TestSetup) => {
  testSteps.forEach(({ description, runTest }) =>
    test(description, () => runTest(getSetup()))
  )
}
