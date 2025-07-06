'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BookOpen, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Search, TrendingUp, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface DashboardStats {
    totalStudents: number;
    totalClasses: number;
    totalLocations: number;
    todayAttendance: number;
    attendanceRate: number;
    activeClasses: number;
    studentGrowth: number;
}

interface RecentClass {
    id: string;
    subject: string;
    teacher: string;
    time: string;
    location: string;
    attendees: number;
    capacity: number;
    status: 'ongoing' | 'completed' | 'upcoming';
}

interface DashboardProps {
    stats: DashboardStats;
    recentClasses: RecentClass[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Enhanced Pagination Component with Page Numbers
const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show smart pagination
            if (currentPage <= 3) {
                // Show first 5 pages
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                if (totalPages > 5) {
                    pages.push('...');
                    pages.push(totalPages);
                }
            } else if (currentPage >= totalPages - 2) {
                // Show last 5 pages
                pages.push(1);
                if (totalPages > 5) {
                    pages.push('...');
                }
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // Show pages around current page
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1">
                {/* Previous Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                </Button>

                {/* Page Numbers */}
                {pageNumbers.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                ...
                            </span>
                        );
                    }

                    const pageNum = page as number;
                    return (
                        <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPageChange(pageNum)}
                            className={`min-w-[2.5rem] px-3 py-2 ${
                                pageNum === currentPage
                                    ? 'bg-primary text-primary-foreground dark:bg-indigo-600 dark:text-white'
                                    : 'hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {pageNum}
                        </Button>
                    );
                })}

                {/* Next Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default function Dashboard({ stats, recentClasses }: DashboardProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filter classes based on search and status
    const filteredClasses = useMemo(() => {
        let filtered = recentClasses;

        if (searchTerm) {
            filtered = filtered.filter(
                (classItem: RecentClass) =>
                    classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    classItem.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    classItem.location.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter((classItem: RecentClass) => classItem.status === statusFilter);
        }

        return filtered;
    }, [searchTerm, statusFilter, recentClasses]);

    // Paginate filtered classes
    const paginatedClasses = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredClasses.slice(startIndex, endIndex);
    }, [filteredClasses, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

    // Reset to first page when filters change
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ongoing':
                return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 dark:from-green-900/50 dark:to-green-800/50 dark:text-green-300 dark:border-green-600';
            case 'completed':
                return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 dark:from-gray-700/50 dark:to-gray-600/50 dark:text-gray-300 dark:border-gray-500';
            case 'upcoming':
                return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-300 dark:border-blue-600';
            default:
                return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 dark:from-gray-700/50 dark:to-gray-600/50 dark:text-gray-300 dark:border-gray-500';
        }
    };

    const getAttendanceColor = (attendees: number, capacity: number) => {
        const percentage = (attendees / capacity) * 100;
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6 dark:from-gray-900 dark:to-gray-800">
                {/* Header Section */}
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">Welcome to Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-300">Monitor your attendance management system at a glance</p>
                </div>

                {/* Stats Cards with Enhanced Design */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative transform overflow-hidden border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Total Students</CardTitle>
                            <div className="rounded-lg bg-white/20 p-2">
                                <Users className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-1 text-3xl font-bold">{stats.totalStudents.toLocaleString()}</div>
                            <p className="flex items-center text-xs opacity-90">
                                <TrendingUp className="mr-1 inline h-3 w-3" />
                                {stats.studentGrowth > 0 ? '+' : ''}
                                {stats.studentGrowth}% from last month
                            </p>
                        </CardContent>
                        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-white/10"></div>
                    </Card>

                    <Card className="relative transform overflow-hidden border-0 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Active Classes</CardTitle>
                            <div className="rounded-lg bg-white/20 p-2">
                                <BookOpen className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-1 text-3xl font-bold">{stats.activeClasses}</div>
                            <p className="text-xs opacity-90">{stats.totalClasses} total classes</p>
                        </CardContent>
                        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-white/10"></div>
                    </Card>

                    <Card className="relative transform overflow-hidden border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Locations</CardTitle>
                            <div className="rounded-lg bg-white/20 p-2">
                                <MapPin className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-1 text-3xl font-bold">{stats.totalLocations}</div>
                            <p className="text-xs opacity-90">Campus-wide coverage</p>
                        </CardContent>
                        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-white/10"></div>
                    </Card>

                    <Card className="relative transform overflow-hidden border-0 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transition-all duration-300 hover:scale-105">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Today's Attendance</CardTitle>
                            <div className="rounded-lg bg-white/20 p-2">
                                <Calendar className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-1 text-3xl font-bold">{stats.todayAttendance}</div>
                            <p className="text-xs opacity-90">{stats.attendanceRate}% attendance rate</p>
                        </CardContent>
                        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-white/10"></div>
                    </Card>
                </div>

                {/* Recent Classes Section with Enhanced Design */}
                <Card className="border-0 bg-gradient-to-br from-white/60 via-blue-50/30 to-indigo-50/40 shadow-xl backdrop-blur-lg dark:from-gray-800/60 dark:via-gray-700/30 dark:to-gray-800/40">
                    <CardHeader className="border-b border-white/20 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:border-gray-600/20 dark:via-gray-700/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                                    <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                    Recent Classes
                                </CardTitle>
                                <CardDescription className="mt-1 font-medium text-gray-700 dark:text-gray-300">
                                    Overview of today's class schedule and attendance
                                </CardDescription>
                            </div>
                        </div>

                        {/* Enhanced Filters */}
                        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
                                <Input
                                    type="search"
                                    placeholder="Search classes, teachers, or locations..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="rounded-lg border-gray-300 bg-white/80 pl-10 shadow-md backdrop-blur-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800/80 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusFilter('all')}
                                    className={
                                        statusFilter === 'all'
                                            ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                                            : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }
                                >
                                    All
                                </Button>
                                <Button
                                    variant={statusFilter === 'ongoing' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusFilter('ongoing')}
                                    className={
                                        statusFilter === 'ongoing'
                                            ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                                            : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }
                                >
                                    Ongoing
                                </Button>
                                <Button
                                    variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusFilter('upcoming')}
                                    className={
                                        statusFilter === 'upcoming'
                                            ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                                            : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }
                                >
                                    Upcoming
                                </Button>
                                <Button
                                    variant={statusFilter === 'completed' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStatusFilter('completed')}
                                    className={
                                        statusFilter === 'completed'
                                            ? 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600'
                                            : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }
                                >
                                    Completed
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="bg-transparent p-6">
                        <div className="space-y-4">
                            {paginatedClasses.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 shadow-lg dark:from-indigo-900/50 dark:to-blue-800/50">
                                        <BookOpen className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No classes found matching your criteria</p>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter settings</p>
                                </div>
                            ) : (
                                paginatedClasses.map((classItem: RecentClass) => (
                                    <div
                                        key={classItem.id}
                                        className="group relative flex items-center justify-between rounded-xl border border-white/60 bg-gradient-to-r from-white/90 via-white/85 to-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-indigo-200/80 hover:from-white/95 hover:via-white/90 hover:to-white/85 hover:shadow-lg dark:border-gray-600/60 dark:from-gray-800/90 dark:via-gray-800/85 dark:to-gray-800/80 dark:hover:border-indigo-400/80 dark:hover:from-gray-700/95 dark:hover:via-gray-700/90 dark:hover:to-gray-700/85"
                                    >
                                        <div className="flex-1">
                                            <div className="mb-3 flex items-center gap-3">
                                                <h3 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                                                    {classItem.subject}
                                                </h3>
                                                <Badge
                                                    className={`${getStatusColor(classItem.status)} rounded-full border-0 px-3 py-1 text-xs font-semibold`}
                                                >
                                                    {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 sm:grid-cols-3 dark:text-gray-300">
                                                <div className="flex items-center rounded-lg border border-indigo-200/60 bg-gradient-to-r from-indigo-50/90 to-blue-50/90 px-3 py-2 backdrop-blur-sm dark:border-indigo-400/60 dark:from-indigo-900/90 dark:to-blue-900/90">
                                                    <Users className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                    <span className="font-semibold">{classItem.teacher}</span>
                                                </div>
                                                <div className="flex items-center rounded-lg border bg-gradient-to-r px-3 py-2 backdrop-blur-sm dark:border-gray-600 dark:from-gray-700/90 dark:to-gray-700/90">
                                                    <Clock className="mr-2 h-4 w-4 dark:text-gray-400" />
                                                    <span className="font-semibold">{classItem.time}</span>
                                                </div>
                                                <div className="flex items-center rounded-lg border bg-gradient-to-r px-3 py-2 backdrop-blur-sm dark:border-gray-600 dark:from-gray-700/90 dark:to-gray-700/90">
                                                    <MapPin className="mr-2 h-4 w-4 dark:text-gray-400" />
                                                    <span className="font-semibold">{classItem.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ml-6 text-right">
                                            <div className="min-w-[120px] rounded-lg border border-indigo-200/60 bg-gradient-to-br from-indigo-100/85 via-blue-100/85 to-purple-100/85 p-4 shadow-md backdrop-blur-sm dark:border-indigo-400/60 dark:from-indigo-900/85 dark:via-blue-900/85 dark:to-purple-900/85">
                                                <div
                                                    className={`text-2xl font-bold ${getAttendanceColor(classItem.attendees, classItem.capacity)} drop-shadow-sm`}
                                                >
                                                    {classItem.attendees}/{classItem.capacity}
                                                </div>
                                                <div className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    {Math.round((classItem.attendees / classItem.capacity) * 100)}% attendance
                                                </div>
                                                <div className="mt-2 h-2 w-full rounded-full bg-gray-300/80 shadow-inner dark:bg-gray-600/80">
                                                    <div
                                                        className={`h-2 rounded-full shadow-sm transition-all duration-500 ${
                                                            (classItem.attendees / classItem.capacity) * 100 >= 80
                                                                ? 'bg-gradient-to-r from-green-400 to-green-600'
                                                                : (classItem.attendees / classItem.capacity) * 100 >= 60
                                                                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                                                  : 'bg-gradient-to-r from-red-400 to-red-600'
                                                        }`}
                                                        style={{
                                                            width: `${Math.min((classItem.attendees / classItem.capacity) * 100, 100)}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Enhanced Pagination with Page Numbers */}
                        {totalPages > 1 && (
                            <div className="mt-8 border-t border-white/30 pt-6 dark:border-gray-600/30">
                                <div className="rounded-lg border border-white/40 bg-gradient-to-r from-white/70 to-white/50 p-4 backdrop-blur-sm dark:border-gray-600/40 dark:from-gray-800/70 dark:to-gray-800/50">
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
