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

export default function Subjects({ subjects: initialSubjects }: { subjects: Subject[] }) {
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
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
            if (!data.success) throw new Error(data.message || 'API error');

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
            toast.error('Failed to delete subject. Please try again.');
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
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Search and Create */}
                <div className="flex items-center justify-between">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <Input
                            type="search"
                            placeholder="Search subjects..."
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 dark:border-gray-700 dark:placeholder-gray-400"
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default" onClick={handleCreateNew}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl dark:border-gray-800 dark:bg-gray-900">
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
                                    <Label htmlFor="name" className="dark:text-gray-200">
                                        Subject Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Mathematics"
                                        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                    />
                                    {errors.name && <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code" className="dark:text-gray-200">
                                        Subject Code
                                    </Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                                        placeholder="e.g., MATH101"
                                        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="dark:text-gray-200">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                        placeholder="Enter subject description..."
                                        rows={3}
                                        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 border-t pt-4 dark:border-gray-700">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                        className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
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

                {/* Subjects Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedSubjects.length === 0 ? (
                        <div className="col-span-full py-12 text-center">
                            <Book className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-600" />
                            <p className="text-gray-500 dark:text-gray-400">No subjects found</p>
                        </div>
                    ) : (
                        paginatedSubjects.map((subject) => (
                            <div
                                key={subject.id}
                                className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{subject.name}</h3>
                                        {subject.code && <p className="text-sm text-muted-foreground dark:text-gray-400">Code: {subject.code}</p>}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(subject)}
                                            className="dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog open={deleteDialogOpen && subjectToDelete?.id === subject.id}>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(subject)}
                                                    className="dark:bg-red-900 dark:hover:bg-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete <b>{subjectToDelete?.name}</b>? This action cannot be undone.
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
                                {subject.description && (
                                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground dark:text-gray-400">{subject.description}</p>
                                )}
                                <p className="mt-2 text-xs text-muted-foreground dark:text-gray-500">Created: {formatDate(subject.created_at)}</p>
                            </div>
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Previous
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === currentPage ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className={`min-w-[2.5rem] px-3 py-2 ${
                                        page === currentPage
                                            ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2"
                            >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <Toaster position="top-right" richColors closeButton />
        </AppLayout>
    );
}
