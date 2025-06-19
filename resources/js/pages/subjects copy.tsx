"use client"

import type React from "react"
import { useMemo } from "react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { Head, useForm, router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Edit, Trash2, BookOpen, Calendar, Users } from "lucide-react"
import { debounce } from "lodash"
import { toast } from "sonner"
import { useState, useEffect } from "react"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Subjects",
    href: "/subjects",
  },
]

interface Subject {
  id: string
  name: string
  created_at: string
  updated_at: string
  classes_count?: number
  students_count?: number
}

interface SubjectsPageProps {
  subjects: {
    data: Subject[]
    links: Array<{
      url?: string
      label: string
      active: boolean
    }>
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
      from: number
      to: number
    }
  }
  filters: {
    search?: string
  }
  flash?: {
    success?: string
    error?: string
  }
}

export default function Subjects({ subjects, filters, flash }: SubjectsPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  const { data, setData, processing, errors, reset } = useForm({
    name: "",
    search: filters?.search || "",
  })

  // Show flash messages
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success)
    }
    if (flash?.error) {
      toast.error(flash.error)
    }
  }, [flash])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = subjects?.data?.length || 0
    const totalClasses = subjects?.data?.reduce((sum, subject) => sum + (subject.classes_count || 0), 0) || 0
    const totalStudents = subjects?.data?.reduce((sum, subject) => sum + (subject.students_count || 0), 0) || 0
    const avgStudentsPerSubject = total > 0 ? Math.round(totalStudents / total) : 0

    return { total, totalClasses, totalStudents, avgStudentsPerSubject }
  }, [subjects])

  const handleSearch = debounce((value: string) => {
    router.get(
      route("subjects.index"),
      { search: value },
      {
        preserveState: true,
        preserveScroll: true,
      },
    )
  }, 300)

  const handleCreateSubject = () => {
    setIsEditing(false)
    setEditingSubject(null)
    reset()
    setIsDialogOpen(true)
  }

  const handleEditSubject = (subject: Subject) => {
    setIsEditing(true)
    setEditingSubject(subject)
    setData("name", subject.name)
    setIsDialogOpen(true)
  }

  const handleDeleteSubject = (subjectId: string, subjectName: string) => {
    if (confirm(`Are you sure you want to delete "${subjectName}"? This action cannot be undone.`)) {
      router.delete(route("subjects.destroy", subjectId), {
        onSuccess: () => {
          // Success message will be handled by flash message
        },
        onError: () => {
          toast.error("Failed to delete subject")
        },
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && editingSubject) {
      // Update subject
      router.put(
        route("subjects.update", editingSubject.id),
        { name: data.name },
        {
          onSuccess: () => {
            setIsDialogOpen(false)
            reset()
            // Success message will be handled by flash message
          },
          onError: () => {
            // Errors will be shown in form validation
          },
        },
      )
    } else {
      // Create new subject
      router.post(
        route("subjects.store"),
        { name: data.name },
        {
          onSuccess: () => {
            setIsDialogOpen(false)
            reset()
            // Success message will be handled by flash message
          },
          onError: () => {
            // Errors will be shown in form validation
          },
        },
      )
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Subjects" />
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Active subjects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
              <p className="text-xs text-muted-foreground">Across all subjects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgStudentsPerSubject}</div>
              <p className="text-xs text-muted-foreground">Per subject</p>
            </CardContent>
          </Card>
        </div>

        {/* Subjects Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subject Management</CardTitle>
                <CardDescription>Manage academic subjects and their details</CardDescription>
              </div>
              <Button onClick={handleCreateSubject}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  className="pl-8 w-[300px]"
                  defaultValue={filters?.search || ""}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {subjects?.data?.length || 0} subjects
                {subjects?.meta && ` (${subjects.meta.total} total)`}
              </div>
            </div>

            {/* Subjects Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {!subjects?.data || subjects.data.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  {filters?.search ? "No subjects found matching your search" : "No subjects found"}
                </div>
              ) : (
                subjects.data.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{subject.name}</CardTitle>
                          <CardDescription>Created {new Date(subject.created_at).toLocaleDateString()}</CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Button onClick={() => handleEditSubject(subject)} variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteSubject(subject.id, subject.name)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{subject.classes_count || 0} classes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{subject.students_count || 0} students</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {subjects?.links && subjects.links.length > 3 && (
              <div className="mt-6 flex items-center justify-center space-x-2">
                {subjects.links.map((link, i) => (
                  <Button
                    key={i}
                    disabled={!link.url}
                    onClick={() => link.url && router.get(link.url)}
                    variant={link.active ? "default" : "outline"}
                    size="sm"
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Subject Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Subject" : "Create New Subject"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="Enter subject name"
                  required
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={processing}>
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? "Saving..." : isEditing ? "Update Subject" : "Create Subject"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
