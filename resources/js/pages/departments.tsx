"use client"

import type React from "react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { Head } from "@inertiajs/react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { debounce } from "lodash"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Building2,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
} from "lucide-react"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Departments",
    href: "/departments",
  },
]

interface Department {
  id: number
  name: string
  code: string
  description: string
  head_of_department_id: string
  email: string
  phone?: string
  location_id: string
  established_year: number
  status: "active" | "inactive"
}

// Add this after the colors array
const fakeLocations = [
  { id: "1", name: "Main Campus Library" },
  { id: "2", name: "Science Building" },
  { id: "3", name: "Engineering Hall" },
  { id: "4", name: "Student Center" },
  { id: "5", name: "Arts & Humanities Building" },
  { id: "6", name: "Sports Complex" },
]

// Add this helper function
const getLocationById = (locationId: string) => {
  return fakeLocations.find((location) => location.id === locationId)
}

const fakeUsers = [
  { id: "1", name: "Dr. Sarah Johnson" },
  { id: "2", name: "Prof. Michael Chen" },
  { id: "3", name: "Dr. Emily Rodriguez" },
  { id: "4", name: "Prof. David Wilson" },
  { id: "5", name: "Dr. Lisa Thompson" },
  { id: "6", name: "Prof. James Anderson" },
  { id: "7", name: "Dr. Maria Garcia" },
]

const getUserById = (userId: string) => {
  return fakeUsers.find((user) => user.id === userId)
}

// Enhanced fake departments data
const initialDepartments: Department[] = [
  {
    id: 1,
    name: "Computer Science",
    code: "CS",
    description: "Department of Computer Science focuses on software development, algorithms, and technology research.",
    head_of_department_id: "1",
    email: "cs@university.edu",
    phone: "+1 (555) 123-4567",
    location_id: "1",
    established_year: 1985,
    status: "active",
  },
  {
    id: 2,
    name: "Mathematics",
    code: "MATH",
    description: "Department of Mathematics offers programs in pure and applied mathematics and statistics.",
    head_of_department_id: "2",
    email: "math@university.edu",
    phone: "+1 (555) 234-5678",
    location_id: "2",
    established_year: 1960,
    status: "active",
  },
  {
    id: 3,
    name: "Physics",
    code: "PHYS",
    description: "Department of Physics conducts research in theoretical and experimental physics.",
    head_of_department_id: "3",
    email: "physics@university.edu",
    phone: "+1 (555) 345-6789",
    location_id: "3",
    established_year: 1955,
    status: "active",
  },
  {
    id: 4,
    name: "Chemistry",
    code: "CHEM",
    description: "Department of Chemistry specializes in organic, inorganic, and physical chemistry.",
    head_of_department_id: "4",
    email: "chemistry@university.edu",
    phone: "+1 (555) 456-7890",
    location_id: "4",
    established_year: 1958,
    status: "active",
  },
  {
    id: 5,
    name: "Biology",
    code: "BIO",
    description: "Department of Biology covers molecular biology, genetics, and biotechnology.",
    head_of_department_id: "5",
    email: "biology@university.edu",
    phone: "+1 (555) 567-8901",
    location_id: "5",
    established_year: 1962,
    status: "active",
  },
  {
    id: 6,
    name: "English Literature",
    code: "ENG",
    description: "Department of English Literature offers programs in literature and creative writing.",
    head_of_department_id: "6",
    email: "english@university.edu",
    phone: "+1 (555) 678-9012",
    location_id: "6",
    established_year: 1950,
    status: "active",
  },
  {
    id: 7,
    name: "History",
    code: "HIST",
    description: "Department of History provides comprehensive study of world history and archaeology.",
    head_of_department_id: "7",
    email: "history@university.edu",
    phone: "+1 (555) 789-0123",
    location_id: "1",
    established_year: 1948,
    status: "active",
  },
]

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

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isEditing, setIsEditing] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    head_of_department_id: "",
    email: "",
    phone: "",
    location_id: "",
    established_year: "",
    status: "active",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter departments based on search term and status
  const filteredDepartments = useMemo(() => {
    let filtered = departments

    if (searchTerm) {
      filtered = filtered.filter(
        (dept) =>
          dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getUserById(dept.head_of_department_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dept.location_id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((dept) => dept.status === statusFilter)
    }

    return filtered
  }, [departments, searchTerm, statusFilter])

  // Paginate filtered departments
  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredDepartments.slice(startIndex, endIndex)
  }, [filteredDepartments, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage)

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

    if (!formData.name.trim()) newErrors.name = "Department name is required"
    if (!formData.code.trim()) newErrors.code = "Department code is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.head_of_department_id.trim()) newErrors.head_of_department_id = "Head of department is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.location_id.trim()) newErrors.location_id = "Location is required"
    if (!formData.established_year || Number.parseInt(formData.established_year) < 1900) {
      newErrors.established_year = "Valid established year is required"
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Check for duplicate code (excluding current department when editing)
    const existingDept = departments.find(
      (dept) =>
        dept.code.toLowerCase() === formData.code.toLowerCase() && (!isEditing || dept.id !== editingDepartment?.id),
    )
    if (existingDept) {
      newErrors.code = "Department code already exists"
    }

    // Check for duplicate name (excluding current department when editing)
    const existingName = departments.find(
      (dept) =>
        dept.name.toLowerCase() === formData.name.toLowerCase() && (!isEditing || dept.id !== editingDepartment?.id),
    )
    if (existingName) {
      newErrors.name = "Department name already exists"
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
          if (isEditing && editingDepartment) {
            // Update existing department
            setDepartments((prev) =>
              prev.map((dept) =>
                dept.id === editingDepartment.id
                  ? {
                      ...dept,
                      name: formData.name.trim(),
                      code: formData.code.trim().toUpperCase(),
                      description: formData.description.trim(),
                      head_of_department_id: formData.head_of_department_id.trim(),
                      email: formData.email.trim().toLowerCase(),
                      phone: formData.phone.trim(),
                      location_id: formData.location_id.trim(),
                      established_year: Number.parseInt(formData.established_year),
                      status: formData.status as Department["status"],
                    }
                  : dept,
              ),
            )
            toast.success("Department updated successfully.")
          } else {
            // Create new department
            const newDepartment: Department = {
              id: Math.max(...departments.map((d) => d.id), 0) + 1,
              name: formData.name.trim(),
              code: formData.code.trim().toUpperCase(),
              description: formData.description.trim(),
              head_of_department_id: formData.head_of_department_id.trim(),
              email: formData.email.trim().toLowerCase(),
              phone: formData.phone.trim(),
              location_id: formData.location_id.trim(),
              established_year: Number.parseInt(formData.established_year),
              status: formData.status as Department["status"],
            }
            setDepartments((prev) => [...prev, newDepartment])
            toast.success("Department created successfully.")
          }

          setIsEditing(false)
          setEditingDepartment(null)
          setIsDialogOpen(false)
          resetForm()
        } catch (error) {
          console.error("Failed to save department:", error)
          toast.error("Failed to save department. Please try again.")
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
      name: "",
      code: "",
      description: "",
      head_of_department_id: "",
      email: "",
      phone: "",
      location_id: "",
      established_year: "",
      status: "active",
    })
    setErrors({})
  }

  const handleEdit = (department: Department) => {
    try {
      setIsEditing(true)
      setEditingDepartment(department)
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description,
        head_of_department_id: department.head_of_department_id,
        email: department.email,
        phone: department.phone || "",
        location_id: department.location_id,
        established_year: department.established_year.toString(),
        status: department.status,
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to edit department:", error)
      toast.error("Failed to edit department. Please try again.")
    }
  }

  const handleDelete = (departmentId: number) => {
    try {
      if (confirm("Are you sure you want to delete this department?")) {
        setDepartments((prev) => prev.filter((dept) => dept.id !== departmentId))
        toast.success("Department deleted successfully.")

        // Adjust current page if necessary
        const newFilteredCount = filteredDepartments.length - 1
        const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage)
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages)
        }
      }
    } catch (error) {
      console.error("Failed to delete department:", error)
      toast.error("Failed to delete department. Please try again.")
    }
  }

  const handleCreateNew = () => {
    try {
      setIsEditing(false)
      setEditingDepartment(null)
      resetForm()
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to create new department:", error)
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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatBudget = (budget?: number) => {
    if (!budget) return "Not specified"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(budget)
  }

  // Statistics
  const stats = useMemo(() => {
    const total = departments.length
    const active = departments.filter((d) => d.status === "active").length

    return { total, active }
  }, [departments])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Departments" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-gray-500">Active Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header with Search and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="search"
                placeholder="Search departments..."
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
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Department" : "Add New Department"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Computer Science"
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Department Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., CS"
                    />
                    {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="head_of_department_id">Head of Department</Label>
                    <Select
                      value={formData.head_of_department_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, head_of_department_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select head of department" />
                      </SelectTrigger>
                      <SelectContent>
                        {fakeUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.head_of_department_id && (
                      <p className="text-sm text-red-600">{errors.head_of_department_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g., cs@university.edu"
                    />
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_id">Location</Label>
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
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.location_id && <p className="text-sm text-red-600">{errors.location_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="established_year">Established Year</Label>
                    <Input
                      id="established_year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.established_year}
                      onChange={(e) => setFormData((prev) => ({ ...prev, established_year: e.target.value }))}
                      placeholder="e.g., 1985"
                    />
                    {errors.established_year && <p className="text-sm text-red-600">{errors.established_year}</p>}
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter department description..."
                    rows={3}
                  />
                  {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
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
                      "Update Department"
                    ) : (
                      "Create Department"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedDepartments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No departments found matching your criteria</p>
            </div>
          ) : (
            paginatedDepartments.map((department) => (
              <Card key={department.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{department.name}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{department.code}</Badge>
                        <Badge className={getStatusColor(department.status)}>{department.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-3">{department.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {getUserById(department.head_of_department_id)?.name || "Unknown"}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="truncate">{department.email}</span>
                    </div>
                    {department.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {department.phone}
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="line-clamp-1">
                        {getLocationById(department.location_id)?.name || "Unknown Location"}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Est. {department.established_year}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button onClick={() => handleEdit(department)} variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button onClick={() => handleDelete(department.id)} variant="destructive" size="sm">
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
      </div>
    </AppLayout>
  )
}
