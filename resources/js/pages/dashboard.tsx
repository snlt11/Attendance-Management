"use client"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { Head } from "@inertiajs/react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, MapPin, Calendar, TrendingUp, Clock, ChevronLeft, ChevronRight, Search } from "lucide-react"

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
]

// Mock data for dashboard
const mockStats = {
  totalStudents: 1247,
  totalClasses: 45,
  totalLocations: 15,
  todayAttendance: 892,
  attendanceRate: 71.6,
  activeClasses: 12,
}

const mockRecentClasses = [
  {
    id: 1,
    subject: "Advanced Mathematics",
    teacher: "Dr. Sarah Johnson",
    time: "09:00 - 10:30",
    location: "Room 101",
    attendees: 28,
    capacity: 35,
    status: "ongoing",
  },
  {
    id: 2,
    subject: "Physics Laboratory",
    teacher: "Prof. Michael Chen",
    time: "11:00 - 12:30",
    location: "Lab 205",
    attendees: 22,
    capacity: 25,
    status: "completed",
  },
  {
    id: 3,
    subject: "Computer Science",
    teacher: "Dr. Lisa Thompson",
    time: "14:00 - 15:30",
    location: "Room 301",
    attendees: 31,
    capacity: 40,
    status: "upcoming",
  },
  {
    id: 4,
    subject: "English Literature",
    teacher: "Prof. James Anderson",
    time: "15:00 - 16:30",
    location: "Room 102",
    attendees: 25,
    capacity: 30,
    status: "upcoming",
  },
  {
    id: 5,
    subject: "Chemistry",
    teacher: "Dr. Emily Rodriguez",
    time: "16:00 - 17:30",
    location: "Lab 103",
    attendees: 19,
    capacity: 24,
    status: "upcoming",
  },
  {
    id: 6,
    subject: "History",
    teacher: "Dr. Maria Garcia",
    time: "08:00 - 09:30",
    location: "Room 201",
    attendees: 33,
    capacity: 35,
    status: "completed",
  },
  {
    id: 7,
    subject: "Biology",
    teacher: "Prof. David Wilson",
    time: "10:00 - 11:30",
    location: "Lab 304",
    attendees: 27,
    capacity: 30,
    status: "completed",
  },
  {
    id: 8,
    subject: "Geography",
    teacher: "Prof. Robert Taylor",
    time: "13:00 - 14:30",
    location: "Room 205",
    attendees: 24,
    capacity: 28,
    status: "ongoing",
  },
  {
    id: 9,
    subject: "Economics",
    teacher: "Dr. Jennifer Lee",
    time: "17:00 - 18:30",
    location: "Room 401",
    attendees: 29,
    capacity: 35,
    status: "upcoming",
  },
  {
    id: 10,
    subject: "Art & Design",
    teacher: "Prof. Alex Morgan",
    time: "09:30 - 11:00",
    location: "Studio 101",
    attendees: 18,
    capacity: 20,
    status: "completed",
  },
  {
    id: 11,
    subject: "Music Theory",
    teacher: "Dr. Sophie Williams",
    time: "12:00 - 13:30",
    location: "Music Hall",
    attendees: 15,
    capacity: 18,
    status: "ongoing",
  },
  {
    id: 12,
    subject: "Philosophy",
    teacher: "Prof. Thomas Brown",
    time: "18:00 - 19:30",
    location: "Room 501",
    attendees: 21,
    capacity: 25,
    status: "upcoming",
  },
]

// Enhanced Pagination Component with Page Numbers
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

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Show first 5 pages
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        if (totalPages > 5) {
          pages.push("...")
          pages.push(totalPages)
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 5 pages
        pages.push(1)
        if (totalPages > 5) {
          pages.push("...")
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Show pages around current page
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
        {/* Previous Button */}
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

        {/* Page Numbers */}
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

        {/* Next Button */}
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

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Filter classes based on search and status
  const filteredClasses = useMemo(() => {
    let filtered = mockRecentClasses

    if (searchTerm) {
      filtered = filtered.filter(
        (classItem) =>
          classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          classItem.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
          classItem.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((classItem) => classItem.status === statusFilter)
    }

    return filtered
  }, [searchTerm, statusFilter])

  // Paginate filtered classes
  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredClasses.slice(startIndex, endIndex)
  }, [filteredClasses, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)

  // Reset to first page when filters change
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAttendanceColor = (attendees: number, capacity: number) => {
    const percentage = (attendees / capacity) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalStudents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.activeClasses}</div>
              <p className="text-xs text-muted-foreground">{mockStats.totalClasses} total classes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalLocations}</div>
              <p className="text-xs text-muted-foreground">Campus-wide coverage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.todayAttendance}</div>
              <p className="text-xs text-muted-foreground">{mockStats.attendanceRate}% attendance rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Classes Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Classes</CardTitle>
                <CardDescription>Overview of today's class schedule and attendance</CardDescription>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Search classes, teachers, or locations..."
                  value={searchTerm}
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
                  variant={statusFilter === "ongoing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter("ongoing")}
                >
                  Ongoing
                </Button>
                <Button
                  variant={statusFilter === "upcoming" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter("upcoming")}
                >
                  Upcoming
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
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {paginatedClasses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No classes found matching your criteria</p>
                </div>
              ) : (
                paginatedClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{classItem.subject}</h3>
                        <Badge className={getStatusColor(classItem.status)}>{classItem.status}</Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {classItem.teacher}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {classItem.time}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {classItem.location}
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div
                        className={`text-lg font-semibold ${getAttendanceColor(classItem.attendees, classItem.capacity)}`}
                      >
                        {classItem.attendees}/{classItem.capacity}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round((classItem.attendees / classItem.capacity) * 100)}% attendance
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Enhanced Pagination with Page Numbers */}
            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
