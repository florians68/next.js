import { createNext } from 'e2e-utils'
import { NextInstance } from 'test/lib/next-modes/base'
import { renderViaHTTP } from 'next-test-utils'

describe('middleware environment variables in node server reflect the usage inference', () => {
  let next: NextInstance

  beforeAll(() => {
    process.env.CAN_BE_INFERRED = 'can-be-inferred'
    process.env.X_CUSTOM_HEADER = 'x-custom-header'
    process.env.IGNORED_ENV_VAR = 'ignored-env-var'
  })

  beforeAll(async () => {
    next = await createNext({
      files: {
        'pages/index.js': `
          export default function () { return <div>Hello, world!</div> }
        `,
        'middleware.js': `
          export default function middleware() {
            return new Response(JSON.stringify({
              canBeInferred: process.env.CAN_BE_INFERRED,
              rest: process.env
            }), {
              headers: {
                'Content-Type': 'application/json',
                'X-Custom-Header': process.env.X_CUSTOM_HEADER,
              }
            })
          }
        `,
      },
      dependencies: {},
    })
  })
  afterAll(() => next.destroy())

  it('limits process.env to only contain env vars that are inferred from usage', async () => {
    const html = await renderViaHTTP(next.url, '/test')
    let parsed: any
    expect(() => {
      parsed = JSON.parse(html)
    }).not.toThrow()
    expect(parsed).toEqual({
      canBeInferred: 'can-be-inferred',
      rest: {
        CAN_BE_INFERRED: 'can-be-inferred',
        X_CUSTOM_HEADER: 'x-custom-header',
        NEXT_RUNTIME: 'edge',
      },
    })
  })
})
