import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId: string;
  method?: string;
  path?: string;
  cfRay?: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, callback: () => T) {
  return requestContextStorage.run(context, callback);
}

export function getRequestContext() {
  return requestContextStorage.getStore() ?? null;
}

export function createRequestContext(request: Request): RequestContext {
  const url = new URL(request.url);
  return {
    requestId: request.headers.get("x-request-id") || crypto.randomUUID(),
    method: request.method,
    path: url.pathname,
    cfRay: request.headers.get("cf-ray") || undefined,
  };
}
