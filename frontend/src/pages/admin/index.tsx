import React from "react"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { AdminDashboard } from "@/components/admin-dashboard/AdminDashboard"

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  )
} 