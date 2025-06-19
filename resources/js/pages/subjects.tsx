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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { BookOpen, Clock, Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Subjects",
    href: "/subjects",
  },
]

interface Subject {
  id: number
  name: string
  code: string
  description: string
  credits: number
  department: string
  level: string
  color: string
}

// Fake subjects data
const initialSubjects: Subject[] = [
  {
    id: 1,
    name: "Advanced Mathematics",
    code: "MATH301",
    description: "Advanced calculus, linear algebra, and differential equations for engineering students.",
    credits: 4,
    department: "Mathematics",
    level: "Undergraduate",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: 2,
    name: "Quantum Physics",
    code: "PHYS401",
    description: "Introduction to quantum mechanics, wave functions, and quantum systems.",
    credits: 3,
    department: "Physics",
    level: "Graduate",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: 3,
    name: "Organic Chemistry",
    code: "CHEM201",
    description: "Study of carbon-based compounds, reactions, and molecular structures.",
    credits: 4,
    department: "Chemistry",
    level: "Undergraduate",
    color: "bg-green-100 text-green-800",
  },
  {
    id: 4,
    name: "Molecular Biology",
    code: "BIOL301",
    description: "Cellular processes, DNA replication, protein synthesis, and gene expression.",
    credits: 3,
    department: "Biology",
    level: "Undergraduate",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    id: 5,
    name: "Data Structures & Algorithms",
    code: "CS201",
    description: "Fundamental data structures, algorithm design, and computational complexity analysis.",
    credits: 4,
    department: "Computer Science",
    level: "Undergraduate",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    id: 6,
    name: "Shakespeare Studies",
    code: "ENG301",
    description: "Comprehensive analysis of Shakespeare's major works, themes, and literary techniques.",
    credits: 3,
    department: "English",
    level: "Undergraduate",
    color: "bg-rose-100 text-rose-800",
  },
  {
    id: 7,
    name: "World War II History",
    code: "HIST201",
    description: "Political, social, and economic factors leading to and during World War II.",
    credits: 3,
    department: "History",
    level: "Undergraduate",
    color: "bg-amber-100 text-amber-800",
  },
  {
    id: 8,
    name: "Environmental Geography",
    code: "GEOG301",
    description: "Human-environment interactions, climate change, and sustainable development.",
    credits: 3,
    department: "Geography",
    level: "Undergraduate",
    color: "bg-teal-100 text-teal-800",
  },
  {
    id: 9,
    name: "Macroeconomics",
    code: "ECON201",
    description: "National income, inflation, unemployment, fiscal and monetary policy analysis.",
    credits: 4,
    department: "Economics",
    level: "Undergraduate",
    color: "bg-orange-100 text-orange-800",
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
]

const levels = ["Undergraduate", "Graduate", "Postgraduate"]

const colors = [
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-green-100 text-green-800",
  "bg-emerald-100 text-emerald-800",
  "bg-indigo-100 text-indigo-800",
  "bg-rose-100 text-rose-800",
  "bg-amber-100 text-amber-800",
  "bg-teal-100 text-teal-800",
  "bg-orange-100 text-orange-800",
]

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    credits: "",
    department: "",
    level: "",
    color: colors[0],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filter subjects based on search term
  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return subjects
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.department.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [subjects, searchTerm])

  // Paginate filtered subjects
  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredSubjects.slice(startIndex, endIndex)
  }, [filteredSubjects, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage)

  const handleSearch = debounce((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, 300)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Subject name is required"
    if (!formData.code.trim()) newErrors.code = "Subject code is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    if (!formData.credits || Number.parseInt(formData.credits) < 1) newErrors.credits = "Credits must be at least 1"
    if (!formData.department) newErrors.department = "Department is required"
    if (!formData.level) newErrors.level = "Level is required"

    // Check for duplicate code (excluding current subject when editing)
    const existingSubject = subjects.find(
      (subject) =>
        subject.code.toLowerCase() === formData.code.toLowerCase() && (!isEditing || subject.id !== editingSubject?.id),
    )
    if (existingSubject) {
      newErrors.code = "Subject code already exists"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) return

    setProcessing(true)

    // Simulate API call delay
    setTimeout(() => {
      if (isEditing && editingSubject) {
        // Update existing subject
        setSubjects((prev) =>
          prev.map((subject) =>
            subject.id === editingSubject.id
              ? {
                  ...subject,
                  name: formData.name.trim(),
                  code: formData.code.trim().toUpperCase(),
                  description: formData.description.trim(),
                  credits: Number.parseInt(formData.credits),
                  department: formData.department,
                  level: formData.level,
                  color: formData.color,
                }
              : subject,
          ),
        )
        toast.success("Subject updated successfully.")
      } else {
        // Create new subject
        const newSubject: Subject = {
          id: Math.max(...subjects.map((s) => s.id)) + 1,
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim(),
          credits: Number.parseInt(formData.credits),
          department: formData.department,
          level: formData.level,
          color: formData.color,
        }
        setSubjects((prev) => [...prev, newSubject])
        toast.success("Subject created successfully.")
      }

      setIsEditing(false)
      setEditingSubject(null)
      setIsDialogOpen(false)
      resetForm()
      setProcessing(false)
    }, 1000)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      credits: "",
      department: "",
      level: "",
      color: colors[0],
    })
    setErrors({})
  }

  const handleEdit = (subject: Subject) => {
    setIsEditing(true)
    setEditingSubject(subject)
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      credits: subject.credits.toString(),
      department: subject.department,
      level: subject.level,
      color: subject.color,
    })
    setIsDialogOpen(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDelete = (subjectId: number) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      setSubjects((prev) => prev.filter((subject) => subject.id !== subjectId))
      toast.success("Subject deleted successfully.")
      
      // Adjust current page if necessary
      const newFilteredCount = filteredSubjects.length - 1
      const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
    }
  }

  const handleCreateNew = () => {
    setIsEditing(false)
    setEditingSubject(null)
    resetForm()
    setIsDialogOpen(true)
  }

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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Subjects" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <Input
            type="search"
            placeholder="Search subjects..."
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" onClick={handleCreateNew}>
                <BookOpen className="w-4 h-4 mr-2" />
                Create New Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Subject" : "Create New Subject"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Subject Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Advanced Mathematics"
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Subject Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g., MATH301"
                    />
                    {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    {errors.department && <p className="text-sm text-red-600">{errors.department}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <select
                      id="level"
                      value={formData.level}
                      onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select level</option>
                      {levels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    {errors.level && <p className="text-sm text-red-600">{errors.level}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.credits}
                      onChange={(e) => setFormData((prev) => ({ ...prev, credits: e.target.value }))}
                      placeholder="e.g., 3"
                    />
                    {errors.credits && <p className="text-sm text-red-600">{errors.credits}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color Theme</Label>
                    <select
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {colors.map((color, index) => (
                        <option key={color} value={color}>
                          Theme {index + 1}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" disabled={processing}>
                    {processing ? "Saving..." : isEditing ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedSubjects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No subjects found</p>
            </div>
          ) : (
            paginatedSubjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{subject.name}</h3>
                      <Badge variant="secondary" className={subject.color}>
                        {subject.code}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button onClick={() => handleEdit(subject)} variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button onClick={() => handleDelete(subject.id)} variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{subject.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {subject.department}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-2" />
                      {subject.level}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      {subject.credits} Credit{subject.credits !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>
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
