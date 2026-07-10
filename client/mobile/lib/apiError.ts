/**
 * Server errors raised as DRF APIExceptions arrive as axios errors whose
 * `response.data` is the exception detail dict, e.g.
 * `{ code: "notebook_quota_exceeded", message, active_count, limit }`.
 * Same shape web reads in DashboardPage.
 */
export function getApiErrorCode(error: unknown): string | undefined {
  const data = (error as { response?: { data?: { code?: unknown } } })?.response?.data;
  return typeof data?.code === 'string' ? data.code : undefined;
}

export const NOTEBOOK_QUOTA_EXCEEDED = 'notebook_quota_exceeded';
export const DAILY_QUIZ_QUOTA_EXCEEDED = 'daily_quiz_quota_exceeded';
export const PRESENTATION_QUOTA_EXCEEDED = 'presentation_quota_exceeded';
export const PAID_ONLY_FEATURE = 'paid_only_feature';
