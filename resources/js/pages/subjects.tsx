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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { debounce } from 'lodash';
import { Book, ChevronLeft, ChevronRight, Edit, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface Subject {
    id: string;
    name: string;
    code?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

interface APIResponse<T> {
    success: boolean;
    subjects?: T[];
    subject?: T;
    message?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Subjects',
        href: '/subjects',
    },
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

export default function Subjects({ subjects: initialSubjects }: { subjects: Subject[] }) {
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filter subjects based on search term
    const filteredSubjects = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return searchTerm
            ? subjects.filter(
                  (subject) =>
                      subject.name.toLowerCase().includes(term) ||
                      subject.code?.toLowerCase().includes(term) ||
                      subject.description?.toLowerCase().includes(term),
              )
            : subjects;
    }, [subjects, searchTerm]);

    // Paginate filtered subjects
    const paginatedSubjects = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredSubjects.slice(startIndex, endIndex);
    }, [filteredSubjects, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

    const handleSearch = debounce((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, 300);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Subject name is required';
        }

        // Check for duplicate name (excluding current subject when editing)
        const existingSubject = subjects.find(
            (subject) => subject.name.toLowerCase() === formData.name.toLowerCase() && (!isEditing || subject.id !== editingSubject?.id),
        );
        if (existingSubject) {
            newErrors.name = 'Subject name already exists';
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
            if (isEditing && editingSubject) {
                response = await fetch(`/subjects/${editingSubject.id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(formData),
                });
            } else {
                response = await fetch('/subjects', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(formData),
                });
            }

            const data = (await response.json()) as APIResponse<Subject>;
            if (!data.success) throw new Error(data.message || 'API error');

            if (isEditing && editingSubject && data.subject) {
                setSubjects((prev) => prev.map((subject) => (subject.id === editingSubject.id ? data.subject! : subject)));
                toast.success('Subject updated successfully!');
            } else if (data.subject) {
                setSubjects((prev) => [data.subject!, ...prev]);
                toast.success('Subject created successfully!');
            }

            setIsEditing(false);
            setEditingSubject(null);
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Failed to save subject:', error);
            toast.error('Failed to save subject. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!subjectToDelete) return;

        try {
            const response = await fetch(`/subjects/${subjectToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });

            const data = (await response.json()) as APIResponse<null>;

            if (!response.ok) {
                // Handle different error statuses
                if (response.status === 422) {
                    // Validation error - subject has related data
                    toast.error(data.message || 'Cannot delete subject due to related data.');
                } else {
                    // Other server errors
                    toast.error(data.message || 'Failed to delete subject. Please try again.');
                }
                closeDeleteDialog();
                return;
            }

            if (!data.success) {
                toast.error(data.message || 'Failed to delete subject.');
                closeDeleteDialog();
                return;
            }

            setSubjects((prev) => prev.filter((subject) => subject.id !== subjectToDelete.id));
            toast.success('Subject deleted successfully.');

            // Adjust current page if necessary
            const newFilteredCount = filteredSubjects.length - 1;
            const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            }

            setDeleteDialogOpen(false);
            setSubjectToDelete(null);
        } catch (error) {
            console.error('Failed to delete subject:', error);
            toast.error('Network error. Please check your connection and try again.');
            closeDeleteDialog();
        }
    };

    const openDeleteDialog = (subject: Subject) => {
        setSubjectToDelete(subject);
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSubjectToDelete(null);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
        });
        setErrors({});
    };

    const handleEdit = (subject: Subject) => {
        try {
            setIsEditing(true);
            setEditingSubject(subject);
            setFormData({
                name: subject.name,
                code: subject.code || '',
                description: subject.description || '',
            });
            setIsDialogOpen(true);
        } catch (error) {
            console.error('Failed to edit subject:', error);
            toast.error('Failed to edit subject. Please try again.');
        }
    };

    const handleCreateNew = () => {
        try {
            setIsEditing(false);
            setEditingSubject(null);
            resetForm();
            setIsDialogOpen(true);
        } catch (error) {
            console.error('Failed to create new subject:', error);
            toast.error('Failed to open create dialog. Please try again.');
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const formatDate = (dateString?: string) => {
        return dateString ? new Date(dateString).toLocaleDateString() : '';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subjects" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Subjects</h1>
                        <p className="text-muted-foreground">Manage your academic subjects and course offerings</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateNew}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? 'Edit Subject' : 'Create New Subject'}</DialogTitle>
                                <DialogDescription>
                                    {isEditing
                                        ? 'Edit the subject details below. All fields marked with * are required.'
                                        : 'Fill in the subject details below. All fields marked with * are required.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Subject Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Mathematics"
                                    />
                                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code">Subject Code</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                                        placeholder="e.g., MATH101"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        placeholder="Enter subject description..."
                                        rows={3}
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
                                            'Update Subject'
                                        ) : (
                                            'Create Subject'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="search" placeholder="Search subjects..." onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm dark:border-blue-800 dark:from-blue-950 dark:to-blue-900">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Subjects</p>
                                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{subjects.length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                                <Book className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-sm dark:border-green-800 dark:from-green-950 dark:to-green-900">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Subjects</p>
                                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{filteredSubjects.length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
                                <Book className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-sm dark:border-purple-800 dark:from-purple-950 dark:to-purple-900">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Available</p>
                                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{paginatedSubjects.length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
                                <Book className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subjects Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedSubjects.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
                                <Book className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No subjects found</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No subjects match your current search criteria.</p>
                        </div>
                    ) : (
                        paginatedSubjects.map((subject) => (
                            <div
                                key={subject.id}
                                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-gray-900/50"
                            >
                                {/* Subject Header */}
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                            <Book className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{subject.name}</h3>
                                            {subject.code && <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{subject.code}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Subject Description */}
                                {subject.description && (
                                    <div className="mb-4">
                                        <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{subject.description}</p>
                                    </div>
                                )}

                                {/* Subject Details */}
                                <div className="space-y-2">
                                    {subject.created_at && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">📅</div>
                                            <span className="truncate">Created {formatDate(subject.created_at)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(subject)}
                                        className="flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>

                                    <AlertDialog open={deleteDialogOpen && subjectToDelete?.id === subject.id}>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDeleteDialog(subject)}
                                                className="flex items-center gap-1 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete <b>{subjectToDelete?.name}</b>?
                                                    <br />
                                                    <br />
                                                    <span className="text-amber-600 dark:text-amber-400">
                                                        ⚠️ Note: If this subject is being used by any classes, the deletion will fail and you'll need
                                                        to remove or reassign those classes first.
                                                    </span>
                                                    <br />
                                                    <br />
                                                    This action cannot be undone.
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
