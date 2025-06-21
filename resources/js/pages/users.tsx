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
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

interface APIResponse<T> {
    success: boolean;
    users?: T[];
    user?: T;
    message?: string;
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    address: string;
    date_of_birth: string;
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
        <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1">
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
                                pageNum === currentPage ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'
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
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
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

            const data = (await response.json()) as APIResponse<UserItem>;
            if (!data.success) throw new Error(data.message || 'API error');

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
        } catch (error) {
            console.error('Failed to save user:', error);
            toast.error('Failed to save user. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            const response = await fetch(`/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });

            const data = (await response.json()) as APIResponse<null>;
            if (!data.success) throw new Error(data.message || 'API error');

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
        } catch (error) {
            console.error('Failed to delete user:', error);
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
        } catch (error) {
            console.error('Failed to edit user:', error);
            toast.error('Failed to edit user. Please try again.');
        }
    };

    const handleCreateNew = () => {
        try {
            setIsEditing(false);
            setEditingUser(null);
            resetForm();
            setIsDialogOpen(true);
        } catch (error) {
            console.error('Failed to create new user:', error);
            toast.error('Failed to open create dialog. Please try again.');
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
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header with Search and Filters */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input type="search" placeholder="Search users..." onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
                        </div>
                        <div className="flex gap-2">
                            <Select value={roleFilter} onValueChange={handleRoleFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Role" />
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
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
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

                    {/* <Button variant="default" onClick={handleCreateNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New User
                    </Button> */}

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default">
                                <Plus className="mr-2 h-4 w-4" />
                                Add New User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
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
                                                {roles.map((role) => (
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

                {/* Stats Cards */}
                <div className="mb-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-20 w-20 rounded-full bg-blue-50 opacity-50"></div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                    <Shield className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-20 w-20 rounded-full bg-green-50 opacity-50"></div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Teachers</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.teachers}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                    <GraduationCap className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-20 w-20 rounded-full bg-purple-50 opacity-50"></div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Students</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.students}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                                    <BookOpen className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-20 w-20 rounded-full bg-orange-50 opacity-50"></div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedUsers.length === 0 ? (
                        <div className="col-span-full py-12 text-center">
                            <Briefcase className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <p className="text-gray-500">No users found matching your criteria</p>
                        </div>
                    ) : (
                        paginatedUsers.map((user) => (
                            <Card key={user.id}>
                                <div className="p-4">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex flex-1 items-center">
                                            <div className="flex-shrink-0">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                                    <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                                                        {getInitials(user.name)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{user.name}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge className={getRoleColor(user.role)}>
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </Badge>
                                            <Badge className={getStatusColor(user.status)}>
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </Badge>
                                        </div>

                                        {user.phone && <p className="text-sm text-gray-500 dark:text-gray-400">📞 {user.phone}</p>}

                                        {user.address && <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">📍 {user.address}</p>}

                                        {user.date_of_birth && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">🎂 {formatDate(user.date_of_birth)}</p>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>

                                        {user.id !== auth.user.id && (
                                            <AlertDialog open={deleteDialogOpen && userToDelete?.id === user.id}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(user)}>
                                                        <Trash2 className="h-4 w-4" />
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
                            </Card>
                        ))
                    )}
                </div>

                {totalPages > 1 && <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
            </div>
            <Toaster position="top-right" richColors closeButton />
        </AppLayout>
    );
}
