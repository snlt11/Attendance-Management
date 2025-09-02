'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { debounce } from 'lodash';
import { BookOpen, Briefcase, ChevronLeft, ChevronRight, Edit, GraduationCap, Loader2, Plus, Search, Shield, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface UserItem {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'teacher' | 'student';
    status: 'active' | 'inactive' | 'suspended';
    avatar?: string;
    address?: string;
    date_of_birth?: string;
    created_at?: string;
    updated_at?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
];

const roles = [
    { value: 'teacher', label: 'Teacher', icon: GraduationCap },
    { value: 'student', label: 'Student', icon: Briefcase },
];

// Enhanced Pagination Component
const PaginationComponent = ({
    currentPage,
    totalPages,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                if (totalPages > 5) {
                    pages.push('...');
                    pages.push(totalPages);
                }
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                if (totalPages > 5) {
                    pages.push('...');
                }
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
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
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span>
                    Showing page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                </span>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                </Button>

                {pageNumbers.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
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
                                pageNum === currentPage ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            {pageNum}
                        </Button>
                    );
                })}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2"
                >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default function UserManagement({
    users: initialUsers,
    auth,
}: {
    users: UserItem[];
    auth: {
        user: UserItem;
    };
}) {
    const [users, setUsers] = useState<UserItem[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isEditing, setIsEditing] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        status: 'active',
        address: '',
        date_of_birth: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filter users based on search term, role, and status
    const filteredUsers = useMemo(() => {
        let filtered = users;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term));
        }

        if (roleFilter !== 'all') {
            filtered = filtered.filter((user) => user.role === roleFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter((user) => user.status === statusFilter);
        }

        return filtered;
    }, [users, searchTerm, roleFilter, statusFilter]);

    // Paginate filtered users
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredUsers.slice(startIndex, endIndex);
    }, [filteredUsers, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const handleSearch = debounce((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, 300);

    const handleRoleFilter = (role: string) => {
        setRoleFilter(role);
        setCurrentPage(1);
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.role) newErrors.role = 'Role is required';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Check for duplicate email (excluding current user when editing)
        const existingUser = users.find(
            (user) => user.email.toLowerCase() === formData.email.toLowerCase() && (!isEditing || user.id !== editingUser?.id),
        );
        if (existingUser) {
            newErrors.email = 'Email address already exists';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            if (!validateForm()) return;

            setProcessing(true);

            const headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            };

            let response;
            if (isEditing && editingUser) {
                response = await fetch(`/users/${editingUser.id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(formData),
                });
            } else {
                response = await fetch('/users', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(formData),
                });
            }

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                    toast.error('Validation failed.');
                } else {
                    toast.error(data.message || 'API error');
                }
                return;
            }

            if (isEditing && editingUser && data.user) {
                setUsers((prev) => prev.map((user) => (user.id === editingUser.id ? data.user! : user)));
                toast.success('User updated successfully!');
            } else if (data.user) {
                setUsers((prev) => [data.user!, ...prev]);
                toast.success('User created successfully!');
            }

            setIsEditing(false);
            setEditingUser(null);
            setIsDialogOpen(false);
            resetForm();
        } catch {
            toast.error('Failed to save user. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            const headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            };
            const response = await fetch(`/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers,
            });

            const data = await response.json();
            if (!response.ok) {
                toast.error(data.message || 'API error');
                return;
            }

            setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
            toast.success('User deleted successfully.');

            // Adjust current page if necessary
            const newFilteredCount = filteredUsers.length - 1;
            const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }

            setDeleteDialogOpen(false);
            setUserToDelete(null);
        } catch {
            toast.error('Failed to delete user. Please try again.');
        }
    };

    const openDeleteDialog = (user: UserItem) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: '',
            status: 'active',
            address: '',
            date_of_birth: '',
        });
        setErrors({});
    };

    const handleEdit = (user: UserItem) => {
        try {
            setIsEditing(true);
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                status: user.status,
                address: user.address || '',
                date_of_birth: user.date_of_birth || '',
            });
            setIsDialogOpen(true);
        } catch {
            console.error('Failed to edit user');
            toast.error('Failed to edit user. Please try again.');
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Statistics
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter((u) => u.status === 'active').length;
        const teachers = users.filter((u) => u.role === 'teacher').length;
        const students = users.filter((u) => u.role === 'student').length;

        return { total, active, teachers, students };
    }, [users]);

    // UI Helper functions
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'teacher':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'student':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'inactive':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            case 'suspended':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString?: string) => {
        return dateString ? new Date(dateString).toLocaleDateString() : '';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header with Search and Filters */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Users</h1>
                        <p className="text-muted-foreground">Manage your platform users and their roles</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Add New User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
                                <DialogDescription>
                                    {isEditing
                                        ? 'Update the user details below. Fields marked with * are required.'
                                        : 'Fill in the details to add a new user. Fields marked with * are required.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                            placeholder="Full name"
                                        />
                                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                            placeholder="Email address"
                                        />
                                        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                                            placeholder="Phone number"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={formData.role} onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.filter(r=>r.label !== 'Student').map((role) => (
                                                    <SelectItem key={role.value} value={role.value}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                                        <Input
                                            id="date_of_birth"
                                            type="date"
                                            value={formData.date_of_birth}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                                        placeholder="Full address"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 border-t pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                {isEditing ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : isEditing ? (
                                            'Update User'
                                        ) : (
                                            'Create User'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search and Filters Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input type="search" placeholder="Search users..." onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
                        </div>
                        <div className="flex gap-2">
                            <Select value={roleFilter} onValueChange={handleRoleFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {roles.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm dark:border-blue-800 dark:from-blue-950 dark:to-blue-900">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-sm dark:border-green-800 dark:from-green-950 dark:to-green-900">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Users</p>
                                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-sm dark:border-purple-800 dark:from-purple-950 dark:to-purple-900">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Teachers</p>
                                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.teachers}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
                                <GraduationCap className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-sm dark:border-orange-800 dark:from-orange-950 dark:to-orange-900">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Students</p>
                                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.students}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedUsers.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                                <Users className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No users found</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No users match your current search criteria.</p>
                        </div>
                    ) : (
                        paginatedUsers.map((user) => (
                            <div
                                key={user.id}
                                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-gray-900/50"
                            >
                                {/* Status indicator */}
                                <div
                                    className={`absolute top-4 right-4 h-3 w-3 rounded-full ${
                                        user.status === 'active' ? 'bg-green-500' : user.status === 'inactive' ? 'bg-gray-400' : 'bg-red-500'
                                    }`}
                                />

                                {/* User Avatar and Info */}
                                <div className="mb-4 flex items-start space-x-4">
                                    <div
                                        className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${
                                            user.role === 'teacher'
                                                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                : 'bg-gradient-to-br from-green-500 to-green-600'
                                        }`}
                                    >
                                        {getInitials(user.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Badge className={`${getRoleColor(user.role)} text-xs`}>
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </Badge>
                                            <Badge variant="outline" className={`${getStatusColor(user.status)} text-xs`}>
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* User Details */}
                                <div className="space-y-3">
                                    {user.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">📞</div>
                                            <span className="truncate">{user.phone}</span>
                                        </div>
                                    )}

                                    {user.address && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
                                                📍
                                            </div>
                                            <span className="line-clamp-2">{user.address}</span>
                                        </div>
                                    )}

                                    {user.date_of_birth && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">🎂</div>
                                            <span className="truncate">{formatDate(user.date_of_birth)}</span>
                                        </div>
                                    )}

                                    {user.created_at && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">📅</div>
                                            <span className="truncate">Joined {formatDate(user.created_at)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(user)}
                                        className="flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>

                                    {user.id !== auth.user.id && (
                                        <AlertDialog open={deleteDialogOpen && userToDelete?.id === user.id}>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(user)}
                                                    className="flex items-center gap-1 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete <b>{userToDelete?.name}</b>? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8">
                        <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    </div>
                )}
            </div>
            <Toaster position="top-right" richColors closeButton />
        </AppLayout>
    );
}
