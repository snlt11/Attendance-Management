import { Head, router, usePage } from '@inertiajs/react';
import { Calendar, Clock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { Attendance, BreadcrumbItem, PaginatedData } from '@/types';

export default function Attendances() {
    const { classId, studentId, className, studentName, attendances, totalSessions, attendedSessions, attendancePercentage, startDate, endDate } =
        usePage().props as {
            classId: string;
            studentId: string;
            className: string;
            studentName: string;
            attendances: PaginatedData<Attendance>;
            totalSessions: number;
            attendedSessions: number;
            attendancePercentage: number;
            startDate: string;
            endDate: string;
        };

    const handlePageChange = (page: number) => {
        router.get(
            route('classes.students.attendances', {
                class: classId,
                student: studentId,
                page,
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['attendances'],
            },
        );
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present':
                return 'text-green-600 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800';
            case 'absent':
                return 'text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800';
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-400 dark:bg-gray-900/30 dark:border-gray-800';
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Classes',
            href: route('classes.index'),
        },
        {
            title: 'Attendance',
            href: route('classes.students.attendances', { class: classId, student: studentId }),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Attendance" />

            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{studentName}'s Attendance</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Class: {className} • Date Range: {startDate} to {endDate}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalSessions}</div>
                            <p className="text-xs text-muted-foreground">All class sessions in date range</p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Attended Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{attendedSessions}</div>
                            <p className="text-xs text-muted-foreground">Sessions marked as present</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-2xl font-bold ${attendancePercentage >= 80 ? 'text-green-600' : attendancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}
                            >
                                {attendancePercentage}%
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        attendancePercentage >= 80 ? 'bg-green-600' : attendancePercentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                                    }`}
                                    style={{ width: `${attendancePercentage}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Records */}
                <Card>
                    <CardHeader>
                        <CardTitle>Attendance Records</CardTitle>
                        <CardDescription>Detailed attendance history for all sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Date</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Schedule</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Check-in Time</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                                    {attendances.data.length > 0 ? (
                                        attendances.data.map((attendance) => (
                                            <tr
                                                key={attendance.id}
                                                className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    {new Date(attendance.class_session.session_date).toLocaleDateString(undefined, {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                                                    {attendance.class_session.start_time} - {attendance.class_session.end_time}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                                                    {attendance.checked_in_at
                                                        ? new Date(attendance.checked_in_at).toLocaleTimeString(undefined, {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })
                                                        : '-'
                                                    }
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getStatusColor(attendance.status)}`}>
                                                        {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No attendance records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                            {/* Pagination */}
                            {attendances.last_page > 1 && (
                                <div className="mt-4 flex flex-col items-center justify-between space-y-3 sm:flex-row sm:space-y-0">
                                    <div className="flex space-x-2">
                                        {attendances.current_page > 1 && (
                                            <button
                                                onClick={() => handlePageChange(attendances.current_page - 1)}
                                                className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                            >
                                                Previous
                                            </button>
                                        )}
                                        <div className="flex space-x-1">
                                            {Array.from({ length: attendances.last_page }, (_, i) => i + 1).map((page) => {
                                                if (
                                                    page === 1 ||
                                                    page === attendances.last_page ||
                                                    (page >= attendances.current_page - 1 && page <= attendances.current_page + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageChange(page)}
                                                            className={`rounded px-3 py-2 text-sm font-medium ${
                                                                page === attendances.current_page
                                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                } else if (page === 2 || page === attendances.last_page - 1) {
                                                    return (
                                                        <span key={page} className="flex items-center px-2 text-sm text-gray-500 dark:text-gray-400">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                        {attendances.current_page < attendances.last_page && (
                                            <button
                                                onClick={() => handlePageChange(attendances.current_page + 1)}
                                                className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                            >
                                                Next
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {attendances.total} {attendances.total === 1 ? 'record' : 'records'} total
                                    </div>
                                </div>
                            )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
