export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

export interface ResolvedPagination {
  page: number;
  limit: number | null;
  skip?: number;
  take?: number;
}

export function resolvePagination(params: PaginationParams = {}): ResolvedPagination {
  const hasLimit =
    params.limit !== undefined &&
    params.limit !== null &&
    String(params.limit).trim() !== '';

  if (!hasLimit) {
    return { page: 1, limit: null };
  }

  const page = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
  const limit = Math.max(1, parseInt(String(params.limit), 10) || 10);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number | null,
): PaginatedResult<T> {
  const resolvedLimit = limit ?? total;

  return {
    data,
    total,
    page,
    limit: resolvedLimit,
    totalPages: resolvedLimit === 0 ? 0 : Math.ceil(total / resolvedLimit),
  };
}
