export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PageInput {
  page: number;
  limit: number;
}

export function paginationResult(page: PageInput, total: number): Pagination {
  return {
    page: page.page,
    limit: page.limit,
    total,
    totalPages: Math.ceil(total / page.limit),
  };
}
