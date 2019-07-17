import {
  Middleware,
  Dispatch,
  AnyAction
} from 'redux'

// CALL_API is a global, unique constant for passing actions to API middleware
export const CALL_API = Symbol('CALL_API')

// ApiAction is an action that api middleware will operate on. ApiAction
// intentionally does _not_ extend Action. when api middleware encounters an
// ApiAction, it will immideately fire a API_[endpoint]_REQUEST action and
// either API_[ENDPOINT]_SUCCESS or API_[ENDPOINT]_FAILURE on request completion
export interface ApiAction {
  // All ApiAction details are specified under the CALL_API symbol key
  [CALL_API]: {
    // endpoint is a string endpoint
    // the UPPERCASE's endpoint will be used to define emitted action types
    // eg. endpoint: 'list' will emit:
    // API_LIST_REQUEST
    // API_LIST_SUCCESS / API_LIST_FAILURE
    endpoint: string
    // method is the HTTP method used
    method: 'GET' | 'PUT' | 'POST' | 'DELETE'
    // params is a list of parameters used to construct the API request
    params?: ApiQueryParams
    // map is a function
    // map defaults to the identity function
    map?: (data: object|[]) => any
  }
}

// identityFunc is a function that returns the argument it's passed
const identityFunc = <T>(a: T): T => a

// ApiQueryParams is an interface for all possible query parameters passed to
// the API
export interface ApiQueryParams {
  peername?: string
  name?: string
  peerID?: string
  path?: string

  page?: number
  pageSize?: number
}

// APIResponseEnvelope is interface all API responses conform to
interface APIResponseEnvelope {
  meta: object
  data: object|any[]
  pagination?: object
}

// getJSON fetches json data from a url
async function getJSON<T> (url: string): Promise<T> {
  const res = await fetch(url)
  if (res.status !== 200) {
    throw new Error(`Received non-200 status code: ${res.status}`)
  }

  const json = await res.json()
  return json as T
}

// getAPIJSON constructs an API url & fetches a JSON response
async function getAPIJSON<T> (endpoint: string): Promise<T> {
  return getJSON(`http://localhost:2503/${endpoint}`)
}

// apiMiddleware manages requests to the qri JSON API
export const apiMiddleware: Middleware = () => (next: Dispatch<AnyAction>) => async (action: any): Promise<any> => {
  if (action[CALL_API]) {
    let { endpoint = '', map = identityFunc } = action[CALL_API]
    const name = endpoint.toUpperCase()
    let data: APIResponseEnvelope

    next({ type: `API_${name}_REQUEST` })

    try {
      data = await getAPIJSON(endpoint)
    } catch (err) {
      return next({
        type: `API_${name}_ERROR`,
        payload: { err }
      })
    }

    return next({
      type: `API_${name}_SUCCESS`,
      payload: {
        data: map(data.data)
        // pagination:
      }
    })
  }

  return next(action)
}
