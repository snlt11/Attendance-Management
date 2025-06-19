"use client"

import type React from "react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { Head } from "@inertiajs/react"
import { useState, useMemo } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { debounce } from "lodash"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Clock,
  MapPin,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Classes",
    href: "/classes",
  },
]

interface ClassItem {
  id: number
  subject: { id: string; name: string }
  teacher: { id: string; name: string }
  subject_id: string
  teacher_id: string
  location_id: string
  start_time: string
  end_time: string
  capacity: number
  enrolled: number
  status: "active" | "inactive" | "completed"
  created_at: string
}

interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
  address?: string
}

interface Teacher {
  id: string
  name: string
  department: string
  email: string
}

interface Subject {
  id: string
  name: string
  code: string
  credits: number
  department: string
}

// Enhanced fake data with more realistic information
const fakeSubjects: Subject[] = [
  { id: "1", name: "Advanced Mathematics", code: "MATH301", credits: 4, department: "Mathematics" },
  { id: "2", name: "Quantum Physics", code: "PHYS401", credits: 3, department: "Physics" },
  { id: "3", name: "Organic Chemistry", code: "CHEM201", credits: 4, department: "Chemistry" },
  { id: "4", name: "Molecular Biology", code: "BIOL301", credits: 3, department: "Biology" },
  { id: "5", name: "Data Structures & Algorithms", code: "CS201", credits: 4, department: "Computer Science" },
  { id: "6", name: "Shakespeare Studies", code: "ENG301", credits: 3, department: "English" },
  { id: "7", name: "World War II History", code: "HIST201", credits: 3, department: "History" },
  { id: "8", name: "Environmental Geography", code: "GEOG301", credits: 3, department: "Geography" },
  { id: "9", name: "Macroeconomics", code: "ECON201", credits: 4, department: "Economics" },
  { id: "10", name: "Digital Marketing", code: "MKT301", credits: 3, department: "Business" },
  { id: "11", name: "Constitutional Law", code: "LAW201", credits: 4, department: "Law" },
  { id: "12", name: "Clinical Psychology", code: "PSY301", credits: 3, department: "Psychology" },
]

const fakeTeachers: Teacher[] = [
  { id: "1", name: "Dr. Sarah Johnson", department: "Mathematics", email: "s.johnson@university.edu" },
  { id: "2", name: "Prof. Michael Chen", department: "Physics", email: "m.chen@university.edu" },
  { id: "3", name: "Dr. Emily Rodriguez", department: "Chemistry", email: "e.rodriguez@university.edu" },
  { id: "4", name: "Prof. David Wilson", department: "Biology", email: "d.wilson@university.edu" },
  { id: "5", name: "Dr. Lisa Thompson", department: "Computer Science", email: "l.thompson@university.edu" },
  { id: "6", name: "Prof. James Anderson", department: "English", email: "j.anderson@university.edu" },
  { id: "7", name: "Dr. Maria Garcia", department: "History", email: "m.garcia@university.edu" },
  { id: "8", name: "Prof. Robert Taylor", department: "Geography", email: "r.taylor@university.edu" },
  { id: "9", name: "Dr. Jennifer Lee", department: "Economics", email: "j.lee@university.edu" },
  { id: "10", name: "Prof. Alex Morgan", department: "Business", email: "a.morgan@university.edu" },
  { id: "11", name: "Dr. Thomas Brown", department: "Law", email: "t.brown@university.edu" },
  { id: "12", name: "Prof. Sophie Williams", department: "Psychology", email: "s.williams@university.edu" },
]

// Fake locations data (matching the locations.tsx data)
const fakeLocations: Location[] = [
  {
    id: "1",
    name: "Main Campus Library",
    latitude: 40.7128,
    longitude: -74.006,
    address: "New York, NY, USA",
  },
  {
    id: "2",
    name: "Science Building",
    latitude: 40.7589,
    longitude: -73.9851,
    address: "Manhattan, NY, USA",
  },
  {
    id: "3",
    name: "Engineering Hall",
    latitude: 40.7505,
    longitude: -73.9934,
    address: "Times Square, NY, USA",
  },
  {
    id: "4",
    name: "Student Center",
    latitude: 40.7282,
    longitude: -73.7949,
    address: "Queens, NY, USA",
  },
  {
    id: "5",
    name: "Arts & Humanities Building",
    latitude: 40.6892,
    longitude: -74.0445,
    address: "Staten Island, NY, USA",
  },
  {
    id: "6",
    name: "Sports Complex",
    latitude: 40.7831,
    longitude: -73.9712,
    address: "Central Park, NY, USA",
  },
]

// Enhanced initial classes with more realistic data
const initialClasses: ClassItem[] = [
  {
    id: 1,
    subject: { id: "1", name: "Advanced Mathematics" },
    teacher: { id: "1", name: "Dr. Sarah Johnson" },
    subject_id: "1",
    teacher_id: "1",
    location_id: "1",
    start_time: "9:00",
    end_time: "10:30",
    capacity: 35,
    enrolled: 28,
    status: "active",
    created_at: "2024-01-15",
  },
  {
    id: 2,
    subject: { id: "2", name: "Quantum Physics" },
    teacher: { id: "2", name: "Prof. Michael Chen" },
    subject_id: "2",
    teacher_id: "2",
    location_id: "2",
    start_time: "11:00",
    end_time: "12:30",
    capacity: 25,
    enrolled: 22,
    status: "active",
    created_at: "2024-01-16",
  },
  {
    id: 3,
    subject: { id: "3", name: "Organic Chemistry" },
    teacher: { id: "3", name: "Dr. Emily Rodriguez" },
    subject_id: "3",
    teacher_id: "3",
    location_id: "3",
    start_time: "14:00",
    end_time: "15:30",
    capacity: 30,
    enrolled: 26,
    status: "active",
    created_at: "2024-01-17",
  },
  {
    id: 4,
    subject: { id: "4", name: "Molecular Biology" },
    teacher: { id: "4", name: "Prof. David Wilson" },
    subject_id: "4",
    teacher_id: "4",
    location_id: "4",
    start_time: "10:00",
    end_time: "11:30",
    capacity: 28,
    enrolled: 25,
    status: "active",
    created_at: "2024-01-18",
  },
  {
    id: 5,
    subject: { id: "5", name: "Data Structures & Algorithms" },
    teacher: { id: "5", name: "Dr. Lisa Thompson" },
    subject_id: "5",
    teacher_id: "5",
    location_id: "5",
    start_time: "13:00",
    end_time: "14:30",
    capacity: 40,
    enrolled: 35,
    status: "active",
    created_at: "2024-01-19",
  },
  {
    id: 6,
    subject: { id: "6", name: "Shakespeare Studies" },
    teacher: { id: "6", name: "Prof. James Anderson" },
    subject_id: "6",
    teacher_id: "6",
    location_id: "6",
    start_time: "15:00",
    end_time: "16:30",
    capacity: 30,
    enrolled: 24,
    status: "active",
    created_at: "2024-01-20",
  },
  {
    id: 7,
    subject: { id: "7", name: "World War II History" },
    teacher: { id: "7", name: "Dr. Maria Garcia" },
    subject_id: "7",
    teacher_id: "7",
    location_id: "1",
    start_time: "8:00",
    end_time: "9:30",
    capacity: 35,
    enrolled: 31,
    status: "active",
    created_at: "2024-01-21",
  },
  {
    id: 8,
    subject: { id: "8", name: "Environmental Geography" },
    teacher: { id: "8", name: "Prof. Robert Taylor" },
    subject_id: "8",
    teacher_id: "8",
    location_id: "2",
    start_time: "16:00",
    end_time: "17:30",
    capacity: 28,
    enrolled: 23,
    status: "active",
    created_at: "2024-01-22",
  },
  {
    id: 9,
    subject: { id: "9", name: "Macroeconomics" },
    teacher: { id: "9", name: "Dr. Jennifer Lee" },
    subject_id: "9",
    teacher_id: "9",
    location_id: "3",
    start_time: "12:00",
    end_time: "13:30",
    capacity: 50,
    enrolled: 42,
    status: "active",
    created_at: "2024-01-23",
  },
  {
    id: 10,
    subject: { id: "10", name: "Digital Marketing" },
    teacher: { id: "10", name: "Prof. Alex Morgan" },
    subject_id: "10",
    teacher_id: "10",
    location_id: "4",
    start_time: "17:00",
    end_time: "18:30",
    capacity: 32,
    enrolled: 29,
    status: "active",
    created_at: "2024-01-24",
  },
  {
    id: 11,
    subject: { id: "11", name: "Constitutional Law" },
    teacher: { id: "11", name: "Dr. Thomas Brown" },
    subject_id: "11",
    teacher_id: "11",
    location_id: "5",
    start_time: "18:00",
    end_time: "19:30",
    capacity: 25,
    enrolled: 20,
    status: "active",
    created_at: "2024-01-25",
  },
  {
    id: 12,
    subject: { id: "12", name: "Clinical Psychology" },
    teacher: { id: "12", name: "Prof. Sophie Williams" },
    subject_id: "12",
    teacher_id: "12",
    location_id: "6",
    start_time: "19:00",
    end_time: "20:30",
    capacity: 20,
    enrolled: 18,
    status: "active",
    created_at: "2024-01-26",
  },
]

// Enhanced Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) => {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        if (totalPages > 5) {
          pages.push("...")
          pages.push(totalPages)
        }
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        if (totalPages > 5) {
          pages.push("...")
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Showing page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                ...
              </span>
            )
          }

          const pageNum = page as number
          return (
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[2.5rem] px-3 py-2 ${
                pageNum === currentPage ? "bg-primary text-primary-foreground" : "hover:bg-gray-50"
              }`}
            >
              {pageNum}
            </Button>
          )
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

export default function Classes() {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [qrData, setQRData] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const [formData, setFormData] = useState({
    subject_id: "",
    teacher_id: "",
    location_id: "",
    start_time: "",
    end_time: "",
    capacity: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter classes based on search term and status
  const filteredClasses = useMemo(() => {
    let filtered = classes

    if (searchTerm) {
      filtered = filtered.filter(
        (classItem) =>
          classItem.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          classItem.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getLocationById(classItem.location_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((classItem) => classItem.status === statusFilter)
    }

    return filtered
  }, [classes, searchTerm, statusFilter])

  // Paginate filtered classes
  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredClasses.slice(startIndex, endIndex)
  }, [filteredClasses, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)

  // Convert time from "H:MM" to "HH:MM" format for HTML input
  const formatTimeForInput = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    return `${hours.padStart(2, "0")}:${minutes}`
  }

  // Convert time from "HH:MM" to "H:MM" format for display
  const formatTimeForDisplay = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    return `${Number.parseInt(hours)}:${minutes}`
  }

  const handleSearch = debounce((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, 300)

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.subject_id) newErrors.subject_id = "Subject is required"
    if (!formData.teacher_id) newErrors.teacher_id = "Teacher is required"
    if (!formData.location_id) newErrors.location_id = "Location is required"
    if (!formData.start_time) newErrors.start_time = "Start time is required"
    if (!formData.end_time) newErrors.end_time = "End time is required"
    if (!formData.capacity || Number.parseInt(formData.capacity) < 1) newErrors.capacity = "Valid capacity is required"

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = "End time must be after start time"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (!validateForm()) return

      setProcessing(true)

      // Simulate API call delay
      setTimeout(() => {
        try {
          const subject = fakeSubjects.find((s) => s.id === formData.subject_id)
          const teacher = fakeTeachers.find((t) => t.id === formData.teacher_id)

          if (isEditing && editingClass) {
            // Update existing class
            setClasses((prev) =>
              prev.map((classItem) =>
                classItem.id === editingClass.id
                  ? {
                      ...classItem,
                      subject: { id: formData.subject_id, name: subject?.name || "" },
                      teacher: { id: formData.teacher_id, name: teacher?.name || "" },
                      subject_id: formData.subject_id,
                      teacher_id: formData.teacher_id,
                      location_id: formData.location_id,
                      start_time: formatTimeForDisplay(formData.start_time),
                      end_time: formatTimeForDisplay(formData.end_time),
                      capacity: Number.parseInt(formData.capacity),
                    }
                  : classItem,
              ),
            )
            toast.success("Class updated successfully.")
          } else {
            // Create new class
            const newClass: ClassItem = {
              id: Math.max(...classes.map((c) => c.id), 0) + 1,
              subject: { id: formData.subject_id, name: subject?.name || "" },
              teacher: { id: formData.teacher_id, name: teacher?.name || "" },
              subject_id: formData.subject_id,
              teacher_id: formData.teacher_id,
              location_id: formData.location_id,
              start_time: formatTimeForDisplay(formData.start_time),
              end_time: formatTimeForDisplay(formData.end_time),
              capacity: Number.parseInt(formData.capacity),
              enrolled: 0,
              status: "active",
              created_at: new Date().toISOString().split("T")[0],
            }
            setClasses((prev) => [...prev, newClass])
            toast.success("Class created successfully.")
          }

          setIsEditing(false)
          setEditingClass(null)
          setIsDialogOpen(false)
          resetForm()
        } catch (error) {
          console.error("Failed to save class:", error)
          toast.error("Failed to save class. Please try again.")
        } finally {
          setProcessing(false)
        }
      }, 1000)
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("Failed to submit form. Please try again.")
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setFormData({
      subject_id: "",
      teacher_id: "",
      location_id: "",
      start_time: "",
      end_time: "",
      capacity: "",
    })
    setErrors({})
  }

  const handleEdit = (classItem: ClassItem) => {
    try {
      setIsEditing(true)
      setEditingClass(classItem)
      setFormData({
        subject_id: classItem.subject_id,
        teacher_id: classItem.teacher_id,
        location_id: classItem.location_id,
        start_time: formatTimeForInput(classItem.start_time),
        end_time: formatTimeForInput(classItem.end_time),
        capacity: classItem.capacity.toString(),
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to edit class:", error)
      toast.error("Failed to edit class. Please try again.")
    }
  }

  const handleDelete = (classId: number) => {
    try {
      if (confirm("Are you sure you want to delete this class?")) {
        setClasses((prev) => prev.filter((classItem) => classItem.id !== classId))
        toast.success("Class deleted successfully.")

        // Adjust current page if necessary
        const newFilteredCount = filteredClasses.length - 1
        const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage)
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages)
        }
      }
    } catch (error) {
      console.error("Failed to delete class:", error)
      toast.error("Failed to delete class. Please try again.")
    }
  }

  const generateQR = (classId: number) => {
    try {
      // Generate a fake QR token
      const qrToken = `class_${classId}_${Date.now()}`
      setQRData(qrToken)
      toast.success("QR code generated successfully.")
    } catch (error) {
      console.error("Failed to generate QR code:", error)
      toast.error("Failed to generate QR code. Please try again.")
    }
  }

  const handleCreateNew = () => {
    try {
      setIsEditing(false)
      setEditingClass(null)
      resetForm()
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to create new class:", error)
      toast.error("Failed to open create dialog. Please try again.")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getEnrollmentColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  const getLocationById = (locationId: string) => {
    return fakeLocations.find((location) => location.id === locationId)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Classes" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        {/* Header with Search and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="search"
                placeholder="Search classes, teachers, or locations..."
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter("inactive")}
              >
                Inactive
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter("completed")}
              >
                Completed
              </Button>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Class" : "Create New Class"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={formData.subject_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, subject_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {fakeSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            <div className="flex flex-col">
                              <span>{subject.name}</span>
                              <span className="text-xs text-gray-500">
                                {subject.code} • {subject.credits} credits
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subject_id && <p className="text-sm text-red-600">{errors.subject_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher">Teacher</Label>
                    <Select
                      value={formData.teacher_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, teacher_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {fakeTeachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            <div className="flex flex-col">
                              <span>{teacher.name}</span>
                              <span className="text-xs text-gray-500">{teacher.department}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.teacher_id && <p className="text-sm text-red-600">{errors.teacher_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                    />
                    {errors.start_time && <p className="text-sm text-red-600">{errors.start_time}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                    />
                    {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Class Capacity</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.capacity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                      placeholder="e.g., 30"
                    />
                    {errors.capacity && <p className="text-sm text-red-600">{errors.capacity}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={formData.location_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, location_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {fakeLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            <div className="flex flex-col">
                              <span>{location.name}</span>
                              <span className="text-xs text-gray-500">{location.address}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.location_id && <p className="text-sm text-red-600">{errors.location_id}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" disabled={processing}>
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isEditing ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedClasses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No classes found matching your criteria</p>
            </div>
          ) : (
            paginatedClasses.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{classItem.subject.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(classItem.status)}>{classItem.status}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {classItem.enrolled}/{classItem.capacity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      {classItem.teacher.name}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {classItem.start_time} - {classItem.end_time}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="line-clamp-1">
                        {getLocationById(classItem.location_id)?.name || "Unknown Location"}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span className={getEnrollmentColor(classItem.enrolled, classItem.capacity)}>
                        {classItem.enrolled} enrolled ({Math.round((classItem.enrolled / classItem.capacity) * 100)}%
                        full)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button onClick={() => handleEdit(classItem)} variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button onClick={() => generateQR(classItem.id)} variant="outline" size="sm" className="flex-1">
                      <QrCode className="w-4 h-4 mr-1" />
                      QR
                    </Button>
                    <Button onClick={() => handleDelete(classItem.id)} variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        )}

        {/* QR Code Modal */}
        {qrData && (
          <Dialog open={!!qrData} onOpenChange={() => setQRData(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>QR Code for Attendance</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                <QRCodeCanvas value={qrData} size={256} />
                <p className="text-sm text-gray-600 text-center">
                  Students can scan this QR code to mark their attendance
                </p>
                <Button onClick={() => setQRData(null)} className="w-full">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  )
}
