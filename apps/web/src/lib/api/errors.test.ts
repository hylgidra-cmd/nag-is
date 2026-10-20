import { ApiError, isApiError } from './errors';

/**
 * The status accessors decide how a page responds to a failed API call, so a
 * missing one does not fail loudly — it falls through to a 500. That is what
 * happened in production: a non-UUID id produced a 400 that no branch
 * handled, and routes whose only input is an id returned a server error for
 * what is really a bad URL.
 */
describe('ApiError status accessors', () => {
  it.each([
    [400, 'isBadRequest'],
    [401, 'isUnauthorized'],
    [403, 'isForbidden'],
    [404, 'isNotFound'],
    [0, 'isNetwork'],
  ] as const)('maps status %i to %s', (status, accessor) => {
    const error = new ApiError(status, 'CODE', 'message');
    expect(error[accessor]).toBe(true);
  });

  it('does not report a status it was not given', () => {
    const notFound = new ApiError(404, 'NOT_FOUND', 'missing');
    expect(notFound.isBadRequest).toBe(false);
    expect(notFound.isUnauthorized).toBe(false);
    expect(notFound.isForbidden).toBe(false);
    expect(notFound.isNetwork).toBe(false);
  });

  /*
   * This is the exact body the API returns for a malformed UUID path
   * parameter. Routes keyed by an id treat it as "not found", because a
   * malformed id cannot identify a record.
   */
  it('recognises the validation failure the API returns for a bad UUID', () => {
    const error = ApiError.fromBody(
      400,
      {
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed (uuid is expected)',
      },
      '/lessons/not-a-uuid',
    );

    expect(isApiError(error)).toBe(true);
    expect(error.isBadRequest).toBe(true);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.isNotFound).toBe(false);
  });

  it('preserves the status when the body carries no statusCode', () => {
    const error = ApiError.fromBody(400, {}, '/lessons/x');
    expect(error.isBadRequest).toBe(true);
    expect(error.code).toBe('INTERNAL');
  });

  it('survives a non-object body', () => {
    const error = ApiError.fromBody(400, 'Bad Request', '/lessons/x');
    expect(error.isBadRequest).toBe(true);
  });

  it('builds a network error with status 0', () => {
    const error = ApiError.network(new Error('socket hang up'));
    expect(error.isNetwork).toBe(true);
    expect(error.cause).toBeInstanceOf(Error);
  });
});
