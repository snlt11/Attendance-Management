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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { debounce } from 'lodash';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    GraduationCap,
    Hash,
    Loader2,
    MapPin,
    MoreVertical,
    Plus,
    QrCode,
    Search,
    Trash2,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import type React from 'react';
import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast, Toaster } from 'sonner';

// Format function for the countdown timer
const formatRemainingTime = (timeInSeconds: number) => {
    if (timeInSeconds <= 0) return 'Expired';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format time to HH:MM format (24-hour)
const formatTimeForBackend = (timeString: string): string => {
    if (!timeString) return '';

    // If it's already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
    }

    // Try to parse and format the time
    try {
        const date = new Date(`1970-01-01T${timeString}`);
        if (isNaN(date.getTime())) {
            return timeString; // Return original if parsing fails
        }
        return date.toTimeString().slice(0, 5); // Extract HH:MM
    } catch {
        return timeString; // Return original if anything fails
    }
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Classes',
        href: '/classes',
    },
];

interface ClassSchedule {
    id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
}

interface ClassItem {
    id: string;
    name: string;
    description?: string;
    subject: { id: string; name: string; code?: string };
    teacher: { id: string; name: string };
    location: { id: string; name: string };
    registration_code: string;
    subject_id: string;
    user_id: string;
    location_id: string;
    start_date: string;
    end_date: string;
    max_students: number;
    // For backward compatibility
    start_time: string;
    end_time: string;
    day_of_week: string;
    // New schedule structure
    class_schedules: ClassSchedule[];
    created_at: string;
    enrolled_students_count: number; // Add this field
}

interface Student {
    id: string;
    name: string;
    email: string;
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
            <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1">
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
                                    ? 'bg-primary text-primary-foreground dark:bg-blue-600 dark:text-white'
                                    : 'hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
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
                    className="px-3 py-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
        total: number;
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
    const [totalCount, setTotalCount] = useState(initialClasses.total);
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
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsClass, setDetailsClass] = useState<ClassItem | null>(null);
    const [classStudents, setClassStudents] = useState<Student[]>([]);
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [studentToAdd, setStudentToAdd] = useState<string | null>(null);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
    const [isRemovingStudent, setIsRemovingStudent] = useState(false);
    const [isRemoveStudentDialogOpen, setIsRemoveStudentDialogOpen] = useState(false);
    const [modalKey, setModalKey] = useState(0);

    console.log('class', classStudents);
    // Countdown timer effect with auto-regeneration
    useEffect(() => {
        if (!qrExpiryTime || !isQRModalOpen || !currentQRClass) return;

        const updateRemainingTime = async () => {
            const now = new Date();
            const expiry = new Date(qrExpiryTime);

            const diffInSeconds = Math.floor((expiry.getTime() - now.getTime()) / 1000);

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
        name: '',
        description: '',
        subject_id: '',
        user_id: '',
        location_id: '',
        start_date: '',
        end_date: '',
        max_students: 0,
        schedules: [
            {
                day_of_week: '',
                start_time: '',
                end_time: '',
            },
        ],
    });

    const handleViewDetails = async (classItem: ClassItem) => {
        setDetailsClass(classItem);
        setIsDetailsModalOpen(true);
        setIsFetchingStudents(true);
        setModalKey((prev) => prev + 1); // Force re-render

        // Clear previous data
        setClassStudents([]);
        setAvailableStudents([]);

        try {
            const response = await axios.get(`/classes/${classItem.id}/students`);
            setClassStudents(response.data.students);
            const availableResponse = await axios.get(`/classes/${classItem.id}/students/search`, {
                params: { search: '' },
            });
            setAvailableStudents(availableResponse.data.students);
        } catch (error: unknown) {
            console.error(error);
            const errorMessage =
                error instanceof Error &&
                'response' in error &&
                typeof error.response === 'object' &&
                error.response !== null &&
                'data' in error.response &&
                typeof error.response.data === 'object' &&
                error.response.data !== null &&
                'message' in error.response.data &&
                typeof error.response.data.message === 'string'
                    ? error.response.data.message
                    : 'Failed to load class details.';
            toast.error(errorMessage);
        } finally {
            setIsFetchingStudents(false);
        }
    };

    const handleAddStudent = async () => {
        if (!studentToAdd || !detailsClass) return;

        setIsAddingStudent(true);

        try {
            await axios.post(
                `/classes/${detailsClass.id}/students`,
                {
                    user_id: studentToAdd,
                },
                {
                    headers: {
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                    },
                },
            );

            // Update local state
            setClasses((prevClasses) =>
                prevClasses.map((cls) =>
                    cls.id === detailsClass.id ? { ...cls, enrolled_students_count: (cls.enrolled_students_count || 0) + 1 } : cls,
                ),
            );

            // Update class students list
            const selectedStudent = availableStudents.find((s) => s.id === studentToAdd);
            if (selectedStudent) {
                setClassStudents((prev) => [...prev, selectedStudent]);
            }

            // Update available students
            setAvailableStudents((prev) => prev.filter((s) => s.id !== studentToAdd));

            setStudentToAdd(null);
            toast.success('Student added successfully!');
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error &&
                'response' in error &&
                typeof error.response === 'object' &&
                error.response !== null &&
                'data' in error.response &&
                typeof error.response.data === 'object' &&
                error.response.data !== null &&
                'message' in error.response.data &&
                typeof error.response.data.message === 'string'
                    ? error.response.data.message
                    : 'Failed to add student.';
            toast.error(errorMessage);
        } finally {
            setIsAddingStudent(false);
        }
    };

    const openRemoveStudentDialog = (student: Student) => {
        setStudentToRemove(student);
        setIsRemoveStudentDialogOpen(true);
    };

    const closeRemoveStudentDialog = () => {
        setStudentToRemove(null);
        setIsRemoveStudentDialogOpen(false);
    };

    const handleRemoveStudent = async () => {
        if (!studentToRemove || !detailsClass) return;

        setIsRemovingStudent(true);

        try {
            await axios.delete(`/classes/${detailsClass.id}/students/${studentToRemove.id}`, {
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });

            // Update local state - decrease the enrolled students count
            setClasses((prevClasses) =>
                prevClasses.map((cls) =>
                    cls.id === detailsClass.id ? { ...cls, enrolled_students_count: Math.max((cls.enrolled_students_count || 0) - 1, 0) } : cls,
                ),
            );

            // Remove student from class students list
            setClassStudents((prev) => prev.filter((s) => s.id !== studentToRemove.id));

            // Add student back to available students
            setAvailableStudents((prev) => [...prev, studentToRemove]);

            toast.success('Student removed successfully!');
            closeRemoveStudentDialog();
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error &&
                'response' in error &&
                typeof error.response === 'object' &&
                error.response !== null &&
                'data' in error.response &&
                typeof error.response.data === 'object' &&
                error.response.data !== null &&
                'message' in error.response.data &&
                typeof error.response.data.message === 'string'
                    ? error.response.data.message
                    : 'Failed to remove student.';
            toast.error(errorMessage);
        } finally {
            setIsRemovingStudent(false);
        }
    };

    const loadClasses = async (page: number, search?: string) => {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (search) params.append('search', search);

        try {
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
            setTotalCount(data.total);
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

        if (!formData.name.trim()) newErrors.name = ['Class name is required'];
        if (!formData.subject_id) newErrors.subject_id = ['Please select a subject'];
        if (!formData.user_id) newErrors.user_id = ['Please select a teacher'];
        if (!formData.location_id) newErrors.location_id = ['Please select a location'];
        if (!formData.start_date) newErrors.start_date = ['Please select start date'];
        if (!formData.end_date) newErrors.end_date = ['Please select end date'];

        // Validate date range
        if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
            newErrors.end_date = ['End date must be after start date'];
        }

        // Validate schedules
        if (formData.schedules.length === 0) {
            newErrors.schedules = ['At least one schedule is required'];
        }

        formData.schedules.forEach((schedule, index) => {
            if (!schedule.day_of_week) {
                newErrors[`schedules.${index}.day_of_week`] = ['Please select a day'];
            }
            if (!schedule.start_time) {
                newErrors[`schedules.${index}.start_time`] = ['Please select start time'];
            }
            if (!schedule.end_time) {
                newErrors[`schedules.${index}.end_time`] = ['Please select end time'];
            }

            // Validate time range
            if (schedule.start_time && schedule.end_time && schedule.start_time >= schedule.end_time) {
                newErrors[`schedules.${index}.end_time`] = ['End time must be after start time'];
            }
        });

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
                start_date: formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 10) : '',
                end_date: formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 10) : '',
                schedules: formData.schedules.map((schedule) => ({
                    ...schedule,
                    start_time: formatTimeForBackend(schedule.start_time),
                    end_time: formatTimeForBackend(schedule.end_time),
                })),
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
                        Object.entries(data.errors).forEach(([field, messages]) => {
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
            name: classItem.name || '',
            description: classItem.description || '',
            subject_id: classItem.subject_id,
            user_id: classItem.user_id,
            location_id: classItem.location_id,
            start_date: classItem.start_date || '',
            end_date: classItem.end_date || '',
            max_students: classItem.max_students,
            schedules:
                classItem.class_schedules && classItem.class_schedules.length > 0
                    ? classItem.class_schedules.map((schedule) => ({
                          day_of_week: schedule.day_of_week,
                          start_time: schedule.start_time,
                          end_time: schedule.end_time,
                      }))
                    : [{ day_of_week: '', start_time: '', end_time: '' }],
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
                credentials: 'same-origin',
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

    const handleGenerateClassCode = async (classItem: ClassItem) => {
        try {
            // Show loading toast
            const loadingToastId = toast.loading('Generating new class code...');

            const response = await fetch(`/classes/${classItem.id}/generate-class-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                credentials: 'same-origin',
            });

            const data = await response.json();

            // Dismiss loading toast
            toast.dismiss(loadingToastId);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to generate new class code');
            }

            // Update the class in local state with new registration code
            setClasses((prevClasses) =>
                prevClasses.map((cls) => (cls.id === classItem.id ? { ...cls, registration_code: data.registration_code } : cls)),
            );

            // Additional info toast
            toast.info('New class code is valid for 30 days', {
                duration: 5000,
            });

            // Show success message with the new code
            toast.success(`New class code generated: ${data.registration_code}`, {
                duration: 1500,
            });
        } catch (error) {
            console.error('Failed to generate class code:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate new class code');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            subject_id: '',
            user_id: '',
            location_id: '',
            start_date: '',
            end_date: '',
            max_students: 0,
            schedules: [{ day_of_week: '', start_time: '', end_time: '' }],
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

    const handleScheduleChange = (index: number, field: keyof ClassSchedule, value: string) => {
        const newSchedules = [...formData.schedules];
        newSchedules[index] = {
            ...newSchedules[index],
            [field]: value,
        };
        setFormData({ ...formData, schedules: newSchedules });
    };

    // Schedule management functions
    const addSchedule = () => {
        setFormData((prev) => ({
            ...prev,
            schedules: [...prev.schedules, { day_of_week: '', start_time: '', end_time: '' }],
        }));
    };

    const removeSchedule = (index: number) => {
        if (formData.schedules.length > 1) {
            setFormData((prev) => ({
                ...prev,
                schedules: prev.schedules.filter((schedule, i) => i !== index),
            }));
        }
    };

    const updateSchedule = (index: number, field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            schedules: prev.schedules.map((schedule, i) => (i === index ? { ...schedule, [field]: value } : schedule)),
        }));

        // Clear errors for this field
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[`schedules.${index}.${field}`];
            return newErrors;
        });
    };

    // Group schedules by day for better display
    const groupSchedulesByDay = (schedules: ClassSchedule[]) => {
        if (!schedules || schedules.length === 0) return {};

        const grouped: { [key: string]: ClassSchedule[] } = {};
        schedules.forEach((schedule) => {
            const day = schedule.day_of_week;
            if (!grouped[day]) {
                grouped[day] = [];
            }
            grouped[day].push(schedule);
        });

        // Sort schedules within each day by start time
        Object.keys(grouped).forEach((day) => {
            grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return grouped;
    };

    // Component to display schedules in a clean format
    const ScheduleDisplay = ({ schedules }: { schedules: ClassSchedule[] }) => {
        const groupedSchedules = groupSchedulesByDay(schedules);
        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        if (Object.keys(groupedSchedules).length === 0) {
            return <span className="text-gray-500">No schedule</span>;
        }

        return (
            <div className="space-y-1">
                {dayOrder
                    .filter((day) => groupedSchedules[day])
                    .map((day) => (
                        <div key={day} className="flex items-start gap-2">
                            <span className="min-w-[45px] text-xs font-medium text-gray-600 capitalize dark:text-gray-400">{day.slice(0, 3)}:</span>
                            <div className="flex-1 space-y-0.5">
                                {groupedSchedules[day].map((schedule, index) => (
                                    <div key={index} className="text-xs text-gray-900 dark:text-gray-100">
                                        {formatTimeToAMPM(schedule.start_time)} - {formatTimeToAMPM(schedule.end_time)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
        );
    };

    const ClassCard = ({ classItem }: { classItem: ClassItem }) => {
        return (
            <div className="group relative overflow-visible rounded-xl border border-gray-200/50 bg-white/80 p-0 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50 dark:border-gray-800/50 dark:bg-gray-900/80 dark:hover:border-blue-800 dark:hover:shadow-blue-900/20">
                {/* Header with gradient background */}
                <div className="relative rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6 dark:from-blue-950/50 dark:to-indigo-950/50">
                    {/* Top actions */}
                    <div className="absolute top-4 right-4 z-20">
                        {auth.user.role === 'teacher' ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 rounded-full bg-white/80 p-0 shadow-sm backdrop-blur-sm hover:bg-white hover:shadow-md dark:bg-gray-800/80 dark:hover:bg-gray-800"
                                        onClick={(e) => {
                                            console.log('Dropdown trigger clicked');
                                            e.stopPropagation();
                                        }}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="z-50 w-44 border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                                >
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Manage Students clicked for:', classItem.name);
                                            handleViewDetails(classItem);
                                        }}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Users className="h-4 w-4" />
                                        <span>Manage Students</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Edit Class clicked for:', classItem.name);
                                            handleEdit(classItem);
                                        }}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Edit className="h-4 w-4" />
                                        <span>Edit Class</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Generate QR clicked for:', classItem.name);
                                            handleGenerateQR(classItem);
                                        }}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <QrCode className="h-4 w-4" />
                                        <span>Generate QR</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Generate Class Code clicked for:', classItem.name);
                                            handleGenerateClassCode(classItem); // Changed from handleGenerateQR
                                        }}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <Hash className="h-4 w-4" /> {/* Changed from QrCode to Hash icon */}
                                        <span>New Class Code</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Delete Class clicked for:', classItem.name);
                                            openDeleteDialog(classItem);
                                        }}
                                        className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span>Delete Class</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                onClick={() => handleGenerateQR(classItem)}
                                size="sm"
                                className="h-8 bg-blue-600 px-3 text-xs hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                <QrCode className="mr-1 h-3 w-3" />
                                Join
                            </Button>
                        )}
                    </div>

                    {/* Class title and subject */}
                    <div className="pr-12">
                        <div className="mb-2 flex items-center gap-2">
                            <div className="rounded-lg bg-blue-500 p-2 dark:bg-blue-600">
                                <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{classItem.name || classItem.subject.name}</h3>
                                {classItem.subject.code && (
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                        {classItem.subject.code}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{classItem.description || `${classItem.subject.name} course`}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 pt-4">
                    {/* Teacher info */}
                    <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                            <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Instructor</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{classItem.teacher?.name}</div>
                        </div>
                    </div>

                    {/* Details grid */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 text-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
                                <Clock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Schedule</div>
                                <div className="mt-1">
                                    <ScheduleDisplay schedules={classItem.class_schedules} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30">
                                <MapPin className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Location</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{classItem.location.name}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
                                <Hash className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Class Code</div>
                                <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{classItem.registration_code}</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer with enrollment info */}
                    <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200/50 bg-gray-50/50 p-3 dark:border-gray-700/50 dark:bg-gray-800/30">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Max: {classItem.max_students} students</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(classItem.start_date).toLocaleDateString()} - {new Date(classItem.end_date).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Hover effect gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Classes" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 dark:bg-gray-900/50">
                {/* Header with Search and Create */}
                <div className="flex items-center justify-between">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-gray-400" />
                        <Input
                            type="search"
                            placeholder="Search classes..."
                            defaultValue={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
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
                            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto dark:border-gray-700 dark:bg-gray-800">
                                <DialogHeader>
                                    <DialogTitle className="dark:text-white">{isEditing ? 'Edit Class' : 'Create New Class'}</DialogTitle>
                                    <DialogDescription className="dark:text-gray-300">
                                        {isEditing
                                            ? 'Update the class details below.'
                                            : 'Fill in the details below to create a new class. All fields are required.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-4">
                                        {/* Class Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Class Name</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => {
                                                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                                                    setErrors((prev) => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.name;
                                                        return newErrors;
                                                    });
                                                }}
                                                placeholder="Enter class name"
                                            />
                                            {errors.name?.map((error, index) => (
                                                <p key={index} className="text-sm text-red-600 dark:text-red-400">
                                                    {error}
                                                </p>
                                            ))}
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description (Optional)</Label>
                                            <Input
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                                placeholder="Enter class description"
                                            />
                                        </div>

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

                                        {/* Date Range */}
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label htmlFor="start_date">Start Date</Label>
                                                <div className="relative z-50">
                                                    <DatePicker
                                                        selected={formData.start_date ? new Date(formData.start_date) : null}
                                                        onChange={(date: Date | null) =>
                                                            setFormData({ ...formData, start_date: date ? date.toISOString().split('T')[0] : '' })
                                                        }
                                                        dateFormat="yyyy-MM-dd"
                                                        className="w-full"
                                                        customInput={<Input />}
                                                        popperPlacement="bottom-start"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="end_date">End Date</Label>
                                                <div className="relative z-50">
                                                    <DatePicker
                                                        selected={formData.end_date ? new Date(formData.end_date) : null}
                                                        onChange={(date: Date | null) =>
                                                            setFormData({ ...formData, end_date: date ? date.toISOString().split('T')[0] : '' })
                                                        }
                                                        dateFormat="yyyy-MM-dd"
                                                        className="w-full"
                                                        customInput={<Input />}
                                                        popperPlacement="bottom-start"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Max Students */}
                                        <div className="space-y-2">
                                            <Label htmlFor="max_students">Maximum Students</Label>
                                            <Input
                                                id="max_students"
                                                type="number"
                                                min="1"
                                                value={formData.max_students === 0 ? '' : formData.max_students}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData((prev) => ({ ...prev, max_students: value === '' ? 0 : parseInt(value) }));
                                                }}
                                                placeholder="Enter maximum students"
                                            />
                                            {errors.max_students?.map((error, index) => (
                                                <p key={index} className="text-sm text-red-600 dark:text-red-400">
                                                    {error}
                                                </p>
                                            ))}
                                        </div>

                                        {/* Schedules */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label>Class Schedule</Label>
                                                <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Schedule
                                                </Button>
                                            </div>

                                            {formData.schedules.map((schedule, index) => (
                                                <div key={index} className="space-y-4 rounded-lg border p-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-medium">Schedule {index + 1}</h4>
                                                        {formData.schedules.length > 1 && (
                                                            <Button type="button" variant="outline" size="sm" onClick={() => removeSchedule(index)}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <Label>Day of Week</Label>
                                                            <Select
                                                                value={schedule.day_of_week}
                                                                onValueChange={(value) => updateSchedule(index, 'day_of_week', value)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select day" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="monday">Monday</SelectItem>
                                                                    <SelectItem value="tuesday">Tuesday</SelectItem>
                                                                    <SelectItem value="wednesday">Wednesday</SelectItem>
                                                                    <SelectItem value="thursday">Thursday</SelectItem>
                                                                    <SelectItem value="friday">Friday</SelectItem>
                                                                    <SelectItem value="saturday">Saturday</SelectItem>
                                                                    <SelectItem value="sunday">Sunday</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            {errors[`schedules.${index}.day_of_week`]?.map((error, i) => (
                                                                <p key={i} className="text-sm text-red-600 dark:text-red-400">
                                                                    {error}
                                                                </p>
                                                            ))}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`start_time_${index}`}>Start Time</Label>
                                                            <div className="relative ">
                                                                <DatePicker
                                                                    selected={
                                                                        schedule.start_time ? new Date(`1970-01-01T${schedule.start_time}`) : null
                                                                    }
                                                                    onChange={(date: Date | null) =>
                                                                        handleScheduleChange(
                                                                            index,
                                                                            'start_time',
                                                                            date
                                                                                ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                                                                                : '',
                                                                        )
                                                                    }
                                                                    showTimeSelect
                                                                    showTimeSelectOnly
                                                                    timeIntervals={15}
                                                                    timeCaption="Time"
                                                                    dateFormat="h:mm aa"
                                                                    className="w-full"
                                                                    customInput={<Input />}
                                                                    popperPlacement="bottom-start"
                                                                />
                                                            </div>
                                                            {errors[`schedules.${index}.start_time`]?.map((error, i) => (
                                                                <p key={i} className="text-sm text-red-600 dark:text-red-400">
                                                                    {error}
                                                                </p>
                                                            ))}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`end_time_${index}`}>End Time</Label>
                                                            <div className="relative ">
                                                                <DatePicker
                                                                    selected={schedule.end_time ? new Date(`1970-01-01T${schedule.end_time}`) : null}
                                                                    onChange={(date: Date | null) =>
                                                                        handleScheduleChange(
                                                                            index,
                                                                            'end_time',
                                                                            date
                                                                                ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                                                                                : '',
                                                                        )
                                                                    }
                                                                    showTimeSelect
                                                                    showTimeSelectOnly
                                                                    timeIntervals={15}
                                                                    timeCaption="Time"
                                                                    dateFormat="h:mm aa"
                                                                    className="w-full"
                                                                    customInput={<Input />}
                                                                    popperPlacement="bottom-start"
                                                                />
                                                            </div>
                                                            {errors[`schedules.${index}.end_time`]?.map((error, i) => (
                                                                <p key={i} className="text-sm text-red-600 dark:text-red-400">
                                                                    {error}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {errors.schedules?.map((error, index) => (
                                                <p key={index} className="text-sm text-red-600 dark:text-red-400">
                                                    {error}
                                                </p>
                                            ))}
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

                {/* Modern Stats Section */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="group relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 dark:border-blue-800/50 dark:from-blue-950/50 dark:to-blue-900/30 dark:hover:shadow-blue-900/20">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-500 p-3 shadow-lg">
                                    <BookOpen className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Classes</h3>
                                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalCount}</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-blue-500/10" />
                    </div>

                    {auth.user.role === 'teacher' && (
                        <>
                            <div className="group relative overflow-hidden rounded-xl border border-green-200/50 bg-gradient-to-br from-green-50 to-green-100/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-green-100/50 dark:border-green-800/50 dark:from-green-950/50 dark:to-green-900/30 dark:hover:shadow-green-900/20">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-green-500 p-3 shadow-lg">
                                            <Users className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Active Students</h3>
                                            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                                                {classes.reduce((sum, cls) => sum + (cls.enrolled_students_count || 0), 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-green-500/10" />
                            </div>

                            <div className="group relative overflow-hidden rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-purple-100/50 dark:border-purple-800/50 dark:from-purple-950/50 dark:to-purple-900/30 dark:hover:shadow-purple-900/20">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-purple-500 p-3 shadow-lg">
                                            <QrCode className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">QR Sessions</h3>
                                            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                                                {classes.filter((cls) => cls.class_schedules?.length > 0).length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-purple-500/10" />
                            </div>
                        </>
                    )}
                </div>

                {/* Classes Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <div className="col-span-full flex min-h-[400px] items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground dark:text-gray-400" />
                                <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400">Loading classes...</p>
                            </div>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="col-span-full flex min-h-[400px] items-center justify-center">
                            <div className="text-center">
                                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground dark:text-gray-400" />
                                <p className="text-lg font-medium dark:text-gray-200">No classes found</p>
                                <p className="mt-1 text-sm text-muted-foreground dark:text-gray-400">Get started by creating a new class.</p>
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
                    <DialogContent className="max-w-lg dark:border-gray-700 dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">Class QR Code</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground dark:text-gray-400">
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
                                        <p className="text-lg font-medium text-gray-900 dark:text-gray-200">Time Remaining</p>
                                        <p className="mt-1 text-3xl font-bold text-primary dark:text-blue-400">{remainingTime || '--:--'}</p>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="dark:border-gray-700 dark:bg-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Delete Class</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-300">
                            Are you sure you want to delete <b>{classToDelete?.subject.name}</b> class? This will also delete all attendance records
                            and QR sessions. This action cannot be undone.
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

            {/* Modern View Details Modal */}
            <Dialog
                key={modalKey}
                open={isDetailsModalOpen}
                onOpenChange={(open) => {
                    setIsDetailsModalOpen(open);
                    if (!open) {
                        setStudentToAdd(null);
                        setAvailableStudents([]);
                        setClassStudents([]);
                        setDetailsClass(null);
                    }
                }}
            >
                <DialogContent className="flex h-[85vh] max-h-[85vh] w-full flex-col sm:max-w-4xl dark:border-gray-700 dark:bg-gray-800">
                    <DialogHeader className="flex-shrink-0 border-b pb-4 dark:border-gray-600">
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold dark:text-white">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            {detailsClass?.name}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-300">Manage students enrolled in this class</DialogDescription>
                    </DialogHeader>

                    {isFetchingStudents ? (
                        <div className="flex flex-1 items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Loading class details...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-hidden">
                            <div className="h-full space-y-4 overflow-y-auto p-4">
                                {/* Class Info */}
                                <div className="flex-shrink-0 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Subject</span>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{detailsClass?.subject.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Teacher</span>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{detailsClass?.teacher.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Location</span>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{detailsClass?.location.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-gray-500">Max Students</span>
                                            <p className="text-sm font-medium text-gray-900">{detailsClass?.max_students}</p>
                                        </div>
                                    </div>
                                    {/* Schedule Section */}
                                    <div className="mt-4 border-t border-gray-200 pt-3">
                                        <span className="text-xs font-medium text-gray-500">Schedule</span>
                                        <div className="mt-2">
                                            <ScheduleDisplay schedules={detailsClass?.class_schedules || []} />
                                        </div>
                                    </div>
                                </div>

                                {/* Add Student Section */}
                                <div className="flex-shrink-0 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                                    <div className="mb-3 flex items-center gap-2">
                                        <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">Add New Student</h3>
                                    </div>
                                    <div className="flex gap-3">
                                        <Select onValueChange={setStudentToAdd} value={studentToAdd || ''} key={`select-${availableStudents.length}`}>
                                            <SelectTrigger className="h-9 flex-1 bg-white text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                                <SelectValue placeholder="Select a student to add" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px] overflow-y-auto dark:border-gray-700 dark:bg-gray-800">
                                                {availableStudents.length === 0 ? (
                                                    <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        {isFetchingStudents ? 'Loading...' : 'All students are enrolled'}
                                                    </div>
                                                ) : (
                                                    availableStudents.map((student) => (
                                                        <SelectItem
                                                            key={student.id}
                                                            value={student.id}
                                                            className="dark:text-white dark:focus:bg-gray-700"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{student.name}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">{student.email}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            onClick={handleAddStudent}
                                            disabled={!studentToAdd || isAddingStudent}
                                            className="h-9 bg-blue-600 px-4 text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                        >
                                            {isAddingStudent ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Add
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Students List */}
                                <div className="flex min-h-[300px] flex-1 flex-col">
                                    <div className="mb-3 flex flex-shrink-0 items-center justify-between">
                                        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            Enrolled Students ({classStudents.length})
                                        </h3>
                                    </div>

                                    <div
                                        className="h-[350px] overflow-y-auto rounded-lg border-2 border-gray-200 p-4 dark:border-gray-600 dark:bg-gray-800/50"
                                        style={{
                                            transform: 'translateZ(0)',
                                            willChange: 'scroll-position',
                                            contain: 'layout style paint',
                                            overflowAnchor: 'none',
                                        }}
                                    >
                                        {classStudents.length > 0 ? (
                                            <div
                                                className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
                                                style={{
                                                    minHeight: 'min-content',
                                                    contain: 'layout style',
                                                    isolation: 'isolate',
                                                }}
                                            >
                                                {classStudents.map((student) => (
                                                    <div
                                                        key={student.id}
                                                        className="group relative flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 transition-all hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-900/40"
                                                        style={{
                                                            transform: 'translateZ(0)',
                                                            contain: 'layout style paint',
                                                            willChange: 'auto',
                                                        }}
                                                    >
                                                        <div
                                                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white"
                                                            style={{
                                                                backfaceVisibility: 'hidden',
                                                                contain: 'strict',
                                                            }}
                                                        >
                                                            <span className="text-sm font-medium">{student.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div
                                                            className="min-w-0 flex-1"
                                                            style={{
                                                                backfaceVisibility: 'hidden',
                                                                contain: 'layout style',
                                                            }}
                                                        >
                                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-200">
                                                                {student.name}
                                                            </p>
                                                            <p className="truncate text-xs text-gray-600 dark:text-gray-400">{student.email}</p>
                                                            <div className='flex flex-col'>
                                                                <span className="text-xs text-gray-600 dark:text-gray-400">Attendance - 90%</span>
                                                                <Link
                                                                    href={`/classes/${detailsClass?.id}/students/${student.id}/attendances`}
                                                                    className="cursor-pointer text-center mt-2 rounded-full bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                                                >
                                                                    View Attendance
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        {auth.user.role === 'teacher' && (
                                                            <button
                                                                onClick={() => openRemoveStudentDialog(student)}
                                                                className="flex-shrink-0 rounded-full p-1 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                                                                title="Remove student"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
                                                <Users className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
                                                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-200">No students enrolled</h3>
                                                <p className="text-gray-500">Add students to this class to get started.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={isRemoveStudentDialogOpen} onOpenChange={setIsRemoveStudentDialogOpen}>
                <AlertDialogContent className="dark:border-gray-700 dark:bg-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-300">
                            This will remove <span className="font-semibold text-gray-900 dark:text-gray-200">{studentToRemove?.name}</span> from the
                            class. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeRemoveStudentDialog}>Cancel</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleRemoveStudent} disabled={isRemovingStudent}>
                            {isRemovingStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Remove
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

// Add a portal container to the body
if (typeof document !== 'undefined' && document.getElementById('root-portal')) {
    document.getElementById('root-portal')?.remove();
}
