export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
}

export interface AuditLogPagination {
  data: AuditLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
  };
}
