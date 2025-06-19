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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GraduationCap,
  Briefcase,
  Search,
} from "lucide-react"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Users",
    href: "/users",
  },
]

interface UserItem {
  id: number
  name: string
  email: string
  phone?: string
  role: "teacher" | "student"
  department?: string
  status: "active" | "inactive" | "suspended"
  avatar?: string
  address?: string
  date_of_birth?: string
  student_id?: string
}

// Enhanced fake users data
const initialUsers: UserItem[] = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "s.johnson@university.edu",
    phone: "+1 (555) 123-4567",
    role: "teacher",
    department: "Mathematics",
    status: "active",
    address: "123 Academic Ave, University City",
    date_of_birth: "1975-03-15",
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    email: "m.chen@university.edu",
    phone: "+1 (555) 234-5678",
    role: "teacher",
    department: "Physics",
    status: "active",
    address: "456 Faculty St, University City",
    date_of_birth: "1980-07-22",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "e.rodriguez@student.edu",
    phone: "+1 (555) 345-6789",
    role: "student",
    department: "Chemistry",
    status: "active",
    address: "789 Student Dorm, University City",
    date_of_birth: "2002-11-08",
    student_id: "STU2023001",
  },
  {
    id: 4,
    name: "Prof. David Wilson",
    email: "d.wilson@university.edu",
    phone: "+1 (555) 456-7890",
    role: "teacher",
    department: "Biology",
    status: "active",
    address: "321 Research Blvd, University City",
    date_of_birth: "1978-05-12",
  },
  {
    id: 5,
    name: "James Anderson",
    email: "j.anderson@student.edu",
    phone: "+1 (555) 678-9012",
    role: "student",
    department: "English",
    status: "active",
    address: "987 Campus Housing, University City",
    date_of_birth: "2001-12-03",
    student_id: "STU2022001",
  },
  {
    id: 6,
    name: "Dr. Maria Garcia",
    email: "m.garcia@university.edu",
    phone: "+1 (555) 789-0123",
    role: "teacher",
    department: "History",
    status: "inactive",
    address: "147 Heritage Lane, University City",
    date_of_birth: "1982-04-18",
  },
  {
    id: 7,
    name: "Robert Taylor",
    email: "r.taylor@student.edu",
    phone: "+1 (555) 890-1234",
    role: "student",
    department: "Geography",
    status: "suspended",
    address: "258 Student Village, University City",
    date_of_birth: "2003-01-25",
    student_id: "STU2023002",
  },
  {
    id: 8,
    name: "Alex Morgan",
    email: "a.morgan@student.edu",
    phone: "+1 (555) 012-3456",
    role: "student",
    department: "Business",
    status: "active",
    address: "741 Business Hall, University City",
    date_of_birth: "2002-08-07",
    student_id: "STU2023003",
  },
  {
    id: 9,
    name: "Prof. Thomas Brown",
    email: "t.brown@university.edu",
    phone: "+1 (555) 123-0987",
    role: "teacher",
    department: "Law",
    status: "active",
    address: "852 Law School, University City",
    date_of_birth: "1976-10-11",
  },
  {
    id: 10,
    name: "Sophie Williams",
    email: "s.williams@student.edu",
    phone: "+1 (555) 234-1098",
    role: "student",
    department: "Psychology",
    status: "active",
    address: "963 Psychology Building, University City",
    date_of_birth: "2003-02-28",
    student_id: "STU2023004",
  },
  {
    id: 11,
    name: "Dr. Lisa Thompson",
    email: "l.thompson@university.edu",
    phone: "+1 (555) 567-8901",
    role: "teacher",
    department: "Computer Science",
    status: "active",
    address: "654 Tech Center, University City",
    date_of_birth: "1985-09-30",
  },
  {
    id: 12,
    name: "Jennifer Lee",
    email: "j.lee@student.edu",
    phone: "+1 (555) 901-2345",
    role: "student",
    department: "Economics",
    status: "active",
    address: "369 Economics Hall, University City",
    date_of_birth: "2002-06-14",
    student_id: "STU2023005",
  },
]

const departments = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Geography",
  "Economics",
  "Business",
  "Law",
  "Psychology",
]

const roles = [
  { value: "teacher", label: "Teacher", icon: GraduationCap },
  { value: "student", label: "Student", icon: Briefcase },
]

// Enhanced Pagination Component
const PaginationComponent = ({
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

export default function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isEditing, setIsEditing] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    status: "active",
    address: "",
    date_of_birth: "",
    student_id: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter users based on search term, role, and status
  const filteredUsers = useMemo(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.student_id?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    return filtered
  }, [users, searchTerm, roleFilter, statusFilter])

  // Paginate filtered users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredUsers.slice(startIndex, endIndex)
  }, [filteredUsers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const handleSearch = debounce((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, 300)

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role)
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.role) newErrors.role = "Role is required"

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Check for duplicate email (excluding current user when editing)
    const existingUser = users.find(
      (user) =>
        user.email.toLowerCase() === formData.email.toLowerCase() && (!isEditing || user.id !== editingUser?.id),
    )
    if (existingUser) {
      newErrors.email = "Email address already exists"
    }

    // Role-specific validations
    if (formData.role === "student" && !formData.student_id.trim()) {
      newErrors.student_id = "Student ID is required for students"
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
          if (isEditing && editingUser) {
            // Update existing user
            setUsers((prev) =>
              prev.map((user) =>
                user.id === editingUser.id
                  ? {
                      ...user,
                      name: formData.name.trim(),
                      email: formData.email.trim().toLowerCase(),
                      phone: formData.phone.trim(),
                      role: formData.role as UserItem["role"],
                      department: formData.department,
                      status: formData.status as UserItem["status"],
                      address: formData.address.trim(),
                      date_of_birth: formData.date_of_birth,
                      student_id: formData.student_id.trim(),
                    }
                  : user,
              ),
            )
            toast.success("User updated successfully.")
          } else {
            // Create new user
            const newUser: UserItem = {
              id: Math.max(...users.map((u) => u.id), 0) + 1,
              name: formData.name.trim(),
              email: formData.email.trim().toLowerCase(),
              phone: formData.phone.trim(),
              role: formData.role as UserItem["role"],
              department: formData.department,
              status: formData.status as UserItem["status"],
              address: formData.address.trim(),
              date_of_birth: formData.date_of_birth,
              student_id: formData.student_id.trim(),
            }
            setUsers((prev) => [...prev, newUser])
            toast.success("User created successfully.")
          }

          setIsEditing(false)
          setEditingUser(null)
          setIsDialogOpen(false)
          resetForm()
        } catch (error) {
          console.error("Failed to save user:", error)
          toast.error("Failed to save user. Please try again.")
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
      email: "",
      phone: "",
      role: "",
      department: "",
      status: "active",
      address: "",
      date_of_birth: "",
      student_id: "",
    })
    setErrors({})
  }

  const handleEdit = (user: UserItem) => {
    try {
      setIsEditing(true)
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        department: user.department || "",
        status: user.status,
        address: user.address || "",
        date_of_birth: user.date_of_birth || "",
        student_id: user.student_id || "",
      })
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to edit user:", error)
      toast.error("Failed to edit user. Please try again.")
    }
  }

  const handleDelete = (userId: number) => {
    try {
      if (confirm("Are you sure you want to delete this user?")) {
        setUsers((prev) => prev.filter((user) => user.id !== userId))
        toast.success("User deleted successfully.")

        // Adjust current page if necessary
        const newFilteredCount = filteredUsers.length - 1
        const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage)
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages)
        }
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast.error("Failed to delete user. Please try again.")
    }
  }

  const handleCreateNew = () => {
    try {
      setIsEditing(false)
      setEditingUser(null)
      resetForm()
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to create new user:", error)
      toast.error("Failed to open create dialog. Please try again.")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "teacher":
        return "bg-blue-100 text-blue-800"
      case "student":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleIcon = (role: string) => {
    const roleData = roles.find((r) => r.value === role)
    return roleData?.icon || Briefcase
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Statistics
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === "active").length
    const teachers = users.filter((u) => u.role === "teacher").length
    const students = users.filter((u) => u.role === "student").length

    return { total, active, teachers, students }
  }, [users])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Users" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-gray-500">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.teachers}</p>
                  <p className="text-xs text-gray-500">Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.students}</p>
                  <p className="text-xs text-gray-500">Students</p>
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
                placeholder="Search users by name, email, or ID..."
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., John Doe"
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g., john.doe@university.edu"
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
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center">
                              <role.icon className="w-4 h-4 mr-2" />
                              {role.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                    />
                  </div>

                  {formData.role === "student" && (
                    <div className="space-y-2">
                      <Label htmlFor="student_id">Student ID</Label>
                      <Input
                        id="student_id"
                        value={formData.student_id}
                        onChange={(e) => setFormData((prev) => ({ ...prev, student_id: e.target.value }))}
                        placeholder="e.g., STU2024001"
                      />
                      {errors.student_id && <p className="text-sm text-red-600">{errors.student_id}</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g., 123 University Ave, City, State"
                  />
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
                      "Update User"
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedUsers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No users found matching your criteria</p>
            </div>
          ) : (
            paginatedUsers.map((user) => {
              const RoleIcon = getRoleIcon(user.role)
              return (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{user.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getRoleColor(user.role)}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {user.role}
                            </Badge>
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {user.phone}
                        </div>
                      )}
                      {user.department && (
                        <div className="flex items-center text-gray-600">
                          <Shield className="w-4 h-4 mr-2" />
                          {user.department}
                        </div>
                      )}
                      {user.date_of_birth && (
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Born {formatDate(user.date_of_birth)}
                        </div>
                      )}
                      {user.student_id && (
                        <div className="flex items-center text-gray-600">
                          <Briefcase className="w-4 h-4 mr-2" />
                          ID: {user.student_id}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <Button onClick={() => handleEdit(user)} variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button onClick={() => handleDelete(user.id)} variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
