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

export function resolvePagination(params: PaginationParams = {}) {
  const page = Math.max(1, parseInt(String(params.page ?? 1), 10) || 1);
  const limit = Math.max(1, parseInt(String(params.limit ?? 10), 10) || 10);

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
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
