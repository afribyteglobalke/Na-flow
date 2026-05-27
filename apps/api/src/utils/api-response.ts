import type { ApiErrorShape, ApiSuccessShape } from "@na-flow/shared-types";

interface ReplyLike {
  status: (statusCode: number) => ReplyLike;
  send: (payload: unknown) => ReplyLike;
}

export function ok<T>(reply: ReplyLike, data: T): ReplyLike {
  const payload: ApiSuccessShape<T> = { success: true, data };
  return reply.send(payload);
}

export function fail(
  reply: ReplyLike,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): ReplyLike {
  const payload: ApiErrorShape = {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details })
    }
  };

  return reply.status(statusCode).send(payload);
}
