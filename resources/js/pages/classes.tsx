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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { debounce } from 'lodash';
import { BookOpen, ChevronLeft, ChevronRight, Edit, Loader2, Plus, QrCode, Search, Trash2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';

// Format function for the countdown timer
const formatRemainingTime = (timeInSeconds: number) => {
    if (timeInSeconds <= 0) return 'Expired';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Classes',
        href: '/classes',
    },
];

interface ClassItem {
    id: string;
    subject: { id: string; name: string; code?: string };
    teacher: { id: string; name: string };
    location: { id: string; name: string };
    registration_code: string;
    subject_id: string;
    user_id: string;
    location_id: string;
    start_time: string;
    end_time: string;
    created_at: string;
}

// Enhanced Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
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

interface Props {
    classes: {
        data: ClassItem[];
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
    };
    subjects: {
        id: string;
        name: string;
        code?: string;
    }[];
    users: {
        id: string;
        name: string;
    }[];
    locations: {
        id: string;
        name: string;
    }[];
    auth: {
        user: {
            id: string;
            name: string;
            role: 'teacher' | 'student';
        };
    };
}

export default function Classes({ classes: initialClasses, filters, subjects, users, locations, auth }: Props) {
    const [classes, setClasses] = useState<ClassItem[]>(initialClasses.data);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [currentPage, setCurrentPage] = useState(initialClasses.current_page);
    const [totalPages, setTotalPages] = useState(initialClasses.last_page);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [qrData, setQRData] = useState<string | null>(null);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrExpiryTime, setQrExpiryTime] = useState<Date | null>(null);
    const [remainingTime, setRemainingTime] = useState<string>('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
    const [currentQRClass, setCurrentQRClass] = useState<ClassItem | null>(null);
    // Countdown timer effect with auto-regeneration
    useEffect(() => {
        if (!qrExpiryTime || !isQRModalOpen || !currentQRClass) return;

        const updateRemainingTime = async () => {
            const now = new Date();
            const diffInSeconds = Math.floor((qrExpiryTime.getTime() - now.getTime()) / 1000);

            if (diffInSeconds <= 0) {
                setRemainingTime('Expired');

                // Auto regenerate if enabled and dialog is still open
                if (isQRModalOpen && currentQRClass) {
                    await handleGenerateQR(currentQRClass);
                    toast.info('QR code has expired. Generated a new one automatically.', {
                        duration: 4000,
                    });
                }
                return true; // Time has expired
            } else {
                setRemainingTime(formatRemainingTime(diffInSeconds));
                return false;
            }
        };

        // Update immediately
        updateRemainingTime();

        // Then update every second
        const timer = setInterval(() => {
            updateRemainingTime();
        }, 1000);

        return () => clearInterval(timer);
    }, [qrExpiryTime, isQRModalOpen, currentQRClass]);

    const [formData, setFormData] = useState({
        subject_id: '',
        user_id: '',
        location_id: '',
        start_time: '',
        end_time: '',
    });

    const loadClasses = async (page: number, search?: string) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (page) params.append('page', page.toString());
            if (search) params.append('search', search);

            const response = await fetch(`/classes?${params.toString()}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to load classes');

            const data = await response.json();
            setClasses(data.data);
            setTotalPages(data.last_page);
            setCurrentPage(data.current_page);
        } catch (error) {
            console.error('Error loading classes:', error);
            toast.error('Failed to load classes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = debounce((value: string) => {
        setSearchTerm(value);
        loadClasses(1, value);
    }, 300);

    const handlePageChange = (page: number) => {
        loadClasses(page, searchTerm);
    };

    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const validateForm = () => {
        const newErrors: Record<string, string[]> = {};
        if (!formData.subject_id) newErrors.subject_id = ['Please select a subject'];
        if (!formData.user_id) newErrors.user_id = ['Please select a teacher'];
        if (!formData.location_id) newErrors.location_id = ['Please select a location'];
        if (!formData.start_time) newErrors.start_time = ['Please select a start time'];
        if (!formData.end_time) newErrors.end_time = ['Please select an end time'];
        const startTimeParts = formData.start_time?.split(' ')[0]?.split(':').map(Number);
        const endTimeParts = formData.end_time?.split(' ')[0]?.split(':').map(Number);

        if (startTimeParts && startTimeParts.length === 2 && endTimeParts && endTimeParts.length === 2) {
            const startMinutes = startTimeParts[0] * 60 + startTimeParts[1];
            const endMinutes = endTimeParts[0] * 60 + endTimeParts[1];

            if (startMinutes >= endMinutes) {
                newErrors.end_time = ['End time must be after start time'];
            }
        } else {
            if (!formData.start_time) newErrors.start_time = ['Please select a valid start time'];
            if (!formData.end_time) newErrors.end_time = ['Please select a valid end time'];
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setProcessing(true);
        setErrors({});

        try {
            const url = isEditing ? `/classes/${editingClass?.id}` : '/classes';
            const method = isEditing ? 'PUT' : 'POST';

            const formattedData = {
                ...formData,
                start_time: formData.start_time,
                end_time: formData.end_time,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify(formattedData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422) {
                    setErrors(data.errors);

                    if (data.errors.time) {
                        // Show scheduling conflict error in toast
                        toast.error(String(data.errors.time[0]), {
                            duration: 5000, // Show for 8 seconds since it's a longer message
                        });
                    } else {
                        // Handle other validation errors
                        Object.entries(data.errors).forEach(([_, messages]) => {
                            if (Array.isArray(messages)) {
                                messages.forEach((message) => {
                                    toast.error(String(message), { duration: 5000 });
                                });
                            }
                        });
                    }
                    return;
                }
                throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} class`);
            }

            if (isEditing) {
                setClasses((prev) => prev.map((cls) => (cls.id === editingClass?.id ? data.class : cls)));
                toast.success('Class updated successfully');
            } else {
                await loadClasses(1, searchTerm);
                toast.success('Class created successfully');
            }

            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error(`Failed to ${isEditing ? 'update' : 'create'} class:`, error);
            toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} class`);
        } finally {
            setProcessing(false);
        }
    };

    const handleEdit = (classItem: ClassItem) => {
        setEditingClass(classItem);
        setIsEditing(true);
        setFormData({
            subject_id: classItem.subject_id,
            user_id: classItem.user_id,
            location_id: classItem.location_id,
            start_time: classItem.start_time,
            end_time: classItem.end_time,
        });
        setIsDialogOpen(true);
    };

    const openDeleteDialog = (classItem: ClassItem) => {
        setClassToDelete(classItem);
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setClassToDelete(null);
    };

    const confirmDelete = async () => {
        if (!classToDelete) return;

        try {
            const response = await fetch(`/classes/${classToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete class');
            }

            setClasses((prev) => prev.filter((cls) => cls.id !== classToDelete.id));
            toast.success('Class deleted successfully');
        } catch (error) {
            console.error('Failed to delete class:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete class');
        } finally {
            setDeleteDialogOpen(false);
            setClassToDelete(null);
        }
    };

    const handleGenerateQR = async (classItem: ClassItem) => {
        try {
            // Show loading toast
            const loadingToastId = toast.loading('Generating QR code...');
            setCurrentQRClass(classItem);

            const response = await fetch(`/classes/${classItem.id}/generate-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });

            const data = await response.json();
            // Dismiss loading toast
            toast.dismiss(loadingToastId);

            if (!response.ok) {
                if (response.status === 422) {
                    throw new Error(data.message || 'Invalid request. Please check your data and try again.');
                } else if (response.status === 409) {
                    throw new Error(data.message || 'An active QR code already exists for this class.');
                } else if (response.status === 500) {
                    console.error('Server error details:', data);
                    throw new Error(data.error || 'Server error. Please try again later.');
                } else {
                    throw new Error(data.message || 'Failed to generate QR code. Please try again.');
                }
            }

            setQRData(data.qr_token);
            setIsQRModalOpen(true);
            setQrExpiryTime(new Date(data.expires_at));

            // Success message based on whether it's a new or existing QR code
            if (data.message.includes('exists')) {
                toast.success('Using existing QR code that is still valid');
            }

            // Show expiration time in toast
            const expiresAt = new Date(data.expires_at);
            const now = new Date();
            const minutesRemaining = Math.round((expiresAt.getTime() - now.getTime()) / 60000);

            if (minutesRemaining > 0) {
                toast.info(
                    `QR code generated successfully! 
                    QR code will expire in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}. ` +
                        'Students can scan it to record their attendance.',
                    { duration: 6000 },
                );
            }
        } catch (error) {
            console.error('Failed to generate QR code:', error);

            setQRData(null);
            setIsQRModalOpen(false);

            // Show appropriate error message
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to generate QR code. Please try again.');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            subject_id: '',
            user_id: '',
            location_id: '',
            start_time: '',
            end_time: '',
        });
        setIsEditing(false);
        setEditingClass(null);
        setErrors({});
    };

    const formatTimeToAMPM = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const ClassCard = ({ classItem }: { classItem: ClassItem }) => {
        return (
            <div className="group relative rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50 dark:hover:bg-gray-800/70">
                <div className="flex flex-col space-y-4">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                                {classItem.subject.name}
                                {classItem.subject.code && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground dark:text-gray-400">
                                        ({classItem.subject.code})
                                    </span>
                                )}
                            </h3>
                            <div className="text-sm text-muted-foreground dark:text-gray-400">
                                Teaching of {classItem.subject.name} by {classItem.teacher?.name}
                            </div>
                        </div>

                        <div className="grid gap-2 text-sm text-muted-foreground dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                <span>{classItem.teacher?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>
                                    {formatTimeToAMPM(classItem.start_time)} - {formatTimeToAMPM(classItem.end_time)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <circle
                                        cx="12"
                                        cy="10"
                                        r="3"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <span>{classItem.location.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect 
                                        x="4" 
                                        y="4" 
                                        width="16" 
                                        height="16" 
                                        rx="2"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                    <path
                                        d="M8 12h8M12 8v8"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span>{classItem.registration_code}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(classItem)} className="flex-1">
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Edit
                        </Button>
                        <AlertDialog open={deleteDialogOpen && classToDelete?.id === classItem.id}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                                    onClick={() => openDeleteDialog(classItem)}
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete <b>{classToDelete?.subject.name}</b> class? This will also delete all
                                        attendance records and QR sessions. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="outline" size="sm" onClick={() => handleGenerateQR(classItem)} className="flex-1">
                            <QrCode className="mr-2 h-3.5 w-3.5" />
                            QR Code
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Classes" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header with Search and Create */}
                <div className="flex items-center justify-between">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search classes..."
                            defaultValue={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {auth.user.role === 'teacher' && (
                        <Dialog
                            open={isDialogOpen}
                            onOpenChange={(open) => {
                                setIsDialogOpen(open);
                                if (!open) resetForm();
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button variant="default">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Class
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>{isEditing ? 'Edit Class' : 'Create New Class'}</DialogTitle>
                                    <DialogDescription>
                                        {isEditing
                                            ? 'Update the class details below.'
                                            : 'Fill in the details below to create a new class. All fields are required.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="subject_id">Subject</Label>
                                            <Select
                                                value={formData.subject_id}
                                                onValueChange={(value) => {
                                                    setFormData((prev) => ({ ...prev, subject_id: value }));
                                                    setErrors((prev) => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.subject_id;
                                                        return newErrors;
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className={errors.subject_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select a subject" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {subjects.map((subject) => (
                                                        <SelectItem key={subject.id} value={subject.id}>
                                                            {subject.name} {subject.code && `(${subject.code})`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.subject_id?.map((error, index) => (
                                                <p key={index} className="text-sm text-red-500">
                                                    {error}
                                                </p>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="user_id">Teacher</Label>
                                            <Select
                                                value={formData.user_id}
                                                onValueChange={(value) => {
                                                    setFormData((prev) => ({ ...prev, user_id: value }));
                                                    setErrors((prev) => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.user_id;
                                                        return newErrors;
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className={errors.user_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select a teacher" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {users.map((user) => (
                                                        <SelectItem key={user.id} value={user.id}>
                                                            {user.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.user_id?.map((error, index) => (
                                                <p key={index} className="text-sm text-red-500">
                                                    {error}
                                                </p>
                                            ))}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="location_id">Location</Label>
                                            <Select
                                                value={formData.location_id}
                                                onValueChange={(value) => {
                                                    setFormData((prev) => ({ ...prev, location_id: value }));
                                                    setErrors((prev) => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.location_id;
                                                        return newErrors;
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className={errors.location_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select a location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((location) => (
                                                        <SelectItem key={location.id} value={location.id}>
                                                            {location.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.location_id?.map((error, index) => (
                                                <p key={index} className="text-sm text-red-500">
                                                    {error}
                                                </p>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <TimePicker
                                                label="Start Time"
                                                id="start_time"
                                                value={formData.start_time}
                                                onChange={(value) => {
                                                    setFormData((prev) => ({ ...prev, start_time: value }));
                                                    setErrors((prev) => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.start_time;
                                                        return newErrors;
                                                    });
                                                }}
                                                error={errors.start_time}
                                            />

                                            <TimePicker
                                                label="End Time"
                                                id="end_time"
                                                value={formData.end_time}
                                                onChange={(value) => {
                                                    setFormData((prev) => ({ ...prev, end_time: value }));
                                                    setErrors((prev) => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.end_time;
                                                        return newErrors;
                                                    });
                                                }}
                                                error={errors.end_time}
                                            />
                                        </div>
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
                                                'Update Class'
                                            ) : (
                                                'Create Class'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Stats Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border bg-card p-6 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                            <h3 className="text-lg font-medium">Total Classes</h3>
                        </div>
                        <p className="mt-2 text-3xl font-bold">{classes.length}</p>
                    </div>
                </div>

                {/* Classes Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <div className="col-span-full flex min-h-[400px] items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Loading classes...</p>
                            </div>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="col-span-full flex min-h-[400px] items-center justify-center">
                            <div className="text-center">
                                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-lg font-medium">No classes found</p>
                                <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new class.</p>
                            </div>
                        </div>
                    ) : (
                        classes.map((classItem) => <ClassCard key={classItem.id} classItem={classItem} />)
                    )}
                </div>

                {/* Pagination */}
                {!isLoading && classes.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}

                {/* QR Code Modal */}
                <Dialog
                    open={isQRModalOpen}
                    onOpenChange={(open) => {
                        setIsQRModalOpen(open);
                        if (!open) {
                            setQRData(null);
                            setQrExpiryTime(null);
                            setRemainingTime('');
                            setCurrentQRClass(null);
                        }
                    }}
                >
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Class QR Code</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                                Students can scan this QR code to mark their attendance.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center py-6">
                            {qrData && (
                                <>
                                    <div className="flex justify-center rounded-lg bg-white py-8">
                                        <QRCodeCanvas value={qrData} size={400} level="M" includeMargin={true} />
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className="text-lg font-medium text-gray-900">Time Remaining</p>
                                        <p className="mt-1 text-3xl font-bold text-primary">{remainingTime || '--:--'}</p>
                                        <p className="mt-2 text-sm text-gray-500">
                                            {remainingTime === 'Expired' ? 'Generating new QR code...' : 'Will automatically regenerate when expired'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Toaster position="top-right" richColors closeButton />
        </AppLayout>
    );
}
