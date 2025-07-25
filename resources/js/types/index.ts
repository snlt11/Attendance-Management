export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface ClassSession {
    id: string;
    class_id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    status: string;
    qr_token?: string;
    expires_at?: string;
}

export interface Attendance {
    id: string;
    user_id: string;
    class_session_id: string;
    checked_in_at: string | null;
    status: string;
    class_session: ClassSession;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
