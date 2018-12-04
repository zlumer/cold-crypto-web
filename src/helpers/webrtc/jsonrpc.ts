import {
  parseHostMessage,
  isMethodCall,
  isError,
  IHostCommand,
} from './hostproto'

export type Id = string | number | null

export function notify(
  method: string,
  params: {} | unknown[],
  reduced: boolean = false
) {
  if (reduced) return `${method}||${JSON.stringify(params)}`

  return jrpcs({
    method,
    params,
  })
}
export function error(id: Id | undefined, error: any) {
  return jrpcs({
    id,
    error,
  })
}
export function result<T>(
  id: Id | undefined,
  result: T,
  reduced: boolean = false
) {
  if (reduced) return `|${id}|${JSON.stringify(result)}`

  return jrpcs({
    id,
    result,
  })
}
export function call(
  method: string,
  id: Id,
  params: unknown | unknown[],
  reduced: boolean = false
) {
  if (reduced) return `${method}|${id}|${JSON.stringify(params)}`

  return jrpcs({
    method,
    id,
    params,
  })
}
export function jrpc<
  T extends { id?: string | number | null; method?: string }
>(obj: T): T & { jsonrpc: '2.0' } {
  return Object.assign({}, obj, { jsonrpc: '2.0' } as { jsonrpc: '2.0' })
}
export function jrpcs<
  T extends { id?: string | number | null; method?: string }
>(obj: T) {
  return JSON.stringify(jrpc(obj))
}

export type RequestHandler = (
  json: { id: Id; method: string; params: any[] | any },
  callback: (err: any, result: any) => void
) => void

export type RequestHandlerTuple<
  TCmd extends IHostCommand<unknown[], unknown>,
  TRes
> = [TCmd, (err: any, result: TRes) => void]
type RequestHandlerTupleU = RequestHandlerTuple<
  IHostCommand<unknown[], unknown>,
  unknown
>

export class JsonRpc {
  public send: (msg: string) => void
  public onRequest: RequestHandler

  lastOutgoingMsgId: number = 1

  listeners: { [id: number]: (err: any, json: any) => void } = {}

  constructor(send: (msg: string) => void, onRequest: RequestHandler) {
    this.send = send
    this.onRequest = onRequest
  }

  private _callbacksQueue = [] as RequestHandler[]
  private _messageQueue = [] as RequestHandlerTupleU[]
  public switchToQueueMode() {
    this.onRequest = (json, cb) => {
      if (this._callbacksQueue.length) {
        let m = this._callbacksQueue.shift()!
        m(json, cb)
      } else {
        this._messageQueue.push([json, cb])
      }
    }
  }
  public async nextMessage(): Promise<RequestHandlerTupleU> {
    if (this._messageQueue.length)
      return Promise.resolve(this._messageQueue.shift()!)
    else
      return new Promise<RequestHandlerTupleU>((res, rej) =>
        this._callbacksQueue.push((..._) => res(_))
      )
  }
  public onMessage = (data: string) => {
    let json = parseHostMessage(data)
    if (!json) return console.error(`JsonRpc: error parsing data!\n${data}`)

    let id = json.id as number
    if (isMethodCall(json)) {
      this.onRequest(json, (error, result) =>
        this.send(
          JSON.stringify({
            id,
            jsonrpc: '2.0',
            ...(error ? { error } : { result }),
          })
        )
      )
    } else if (this.listeners[id]) {
      let m = this.listeners[id]
      delete this.listeners[id]
      if (isError(json)) m(json.error, undefined)
      else m(undefined, json.result)
    }
  }
  public async ping() {
    let response = await this.call('ping')
    if (response != 'pong') throw 'JSON-RPC: unknown ping error!'
  }
  public async callRaw(method: string, args: {}): Promise<any> {
    console.log(`JSON.RAW: ${method}(${JSON.stringify(args)})`)
    return new Promise((res, rej) => {
      let id = this.getNextMsgId()
      this.listeners[id] = (err, msg) => (err ? rej(err) : res(msg))
      console.log(`outgoing: ${call(method, id, args)}`)
      this.send(call(method, id, args))
    })
  }
  public async call(method: string, ...args: any[]): Promise<any> {
    return this.callRaw(method, args)
  }
  getNextMsgId() {
    return this.lastOutgoingMsgId++
  }
}
