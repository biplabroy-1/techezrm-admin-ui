"use client"
import { useState } from "react"
import { Box, Typography, Alert, CircularProgress } from "@mui/material"
import { useRouter } from "next/navigation"
import { TableComponent, type TableRowData } from "../../../../components/TableComponent"
import { useRFQs } from "@/api/handlers"
import Image from "next/image"

interface OrderRowData extends TableRowData {
  customerName: string
  email: string
  phoneNumber: string
  quantity: string
  dateTime: string
  trackOrder?: string
  status?: string
}

export default function OrderList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)

  // Fetch RFQ data using the API
  const {
    data: rfqData,
    isLoading,
    error,
    isFetching,
  } = useRFQs({
    page,
    limit: 9,
    search: searchTerm,
    status: statusFilter,
  })

  console.log("RFQ Data:", rfqData)
  console.log("RFQ Error:", error)

  const statusOptions = [
    { value: "", label: "Status" },
    { value: "pending", label: "Pending" },
    { value: "in-process", label: "In-process" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ]

  interface TableColumnType {
    id: string
    label: string
    width?: string
    align?: "left" | "center" | "right"
    type?: "status" | "link" | "default"
  }

  const columns: TableColumnType[] = [
    { id: "customerName", label: "Customer Name", width: "18%" },
    { id: "email", label: "Email", width: "12%", align: "center" },
    { id: "phoneNumber", label: "Phone Number", width: "16%", align: "center" },
    { id: "quantity", label: "Quantity", width: "10%", align: "center" },
    { id: "dateTime", label: "Date/Time", width: "16%", type: "default", align: "center" },
    { id: "trackOrder", label: "View Details", width: "20%", type: "link", align: "center" },
  ]

  // Transform API data to table format with error handling
  const transformedData: OrderRowData[] =
    rfqData?.rfqs?.map((rfq) => {
      try {
        return {
          // TableRowData requires a string id, and an RFQ without one would render a
          // row keyed on undefined. Fall back explicitly rather than typing the gap
          // away.
          id: rfq?._id || "unknown",
          customerName: rfq.customerName || "N/A",
          email: rfq.customerEmail || "N/A",
          phoneNumber: rfq.customerPhone || "N/A",
          quantity: rfq.quantity?.toString() || "0",
          dateTime: rfq.createdAt ? new Date(rfq.createdAt).toLocaleString() : "N/A",
          trackOrder: rfq.uniqueId || rfq?._id,
          status: rfq.status || "pending",
        }
      } catch (err) {
        console.error("Error transforming RFQ data:", err, rfq)
        return {
          id: rfq?._id || "unknown",
          customerName: "Error loading data",
          email: "N/A",
          phoneNumber: "N/A",
          quantity: "0",
          dateTime: "N/A",
          trackOrder: "N/A",
          status: "error",
        }
      }
    }) || []

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleRowClick = (row: TableRowData) => {
    router.push(`/admin/order/rfq/detail/${row.id}`)
  }

  const handleLinkClick = (row: TableRowData) => {
    router.push(`/admin/order/rfq/detail/${row.id}`)
  }

  const handleSearchChange = (searchValue: string) => {
    setSearchTerm(searchValue)
    setPage(1) // Reset to first page when searching
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setPage(1) // Reset to first page when filtering
  }

  // Error message formatting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getErrorMessage = (error: any): string => {
    if (error?.response?.data?.message) {
      return error.response.data.message
    }
    if (error?.message) {
      return error.message
    }
    return "Failed to load RFQ data. Please try again."
  }

  return (
    <Box sx={{ p: 3, backgroundColor: "#F9FAFB", minHeight: "85vh", fontFamily: "Poppins, sans-serif" }}>
      {/* Header with Back button */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => router.back()}>
          <Image src="/back.png?height=13&width=13" alt="Back" width={13} height={13} />
          <Typography sx={{ ml: 1, color: "#737791", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
            Back
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#1F2A44",
          mb: 3,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        RFQ
      </Typography>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {getErrorMessage(error)}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results Summary */}
      {rfqData && !error && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: "14px", color: "#737791", fontFamily: "Poppins, sans-serif" }}>
            Showing {transformedData.length} of {rfqData.total} RFQs
            {searchTerm && ` for "${searchTerm}"`}
            {statusFilter && ` with status "${statusFilter}"`}
            {isFetching && " (Loading...)"}
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && !error && transformedData.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ fontSize: "16px", color: "#737791", fontFamily: "Poppins, sans-serif" }}>
            {searchTerm || statusFilter ? "No RFQs found matching your criteria" : "No RFQs available"}
          </Typography>
        </Box>
      )}

      {/* Table Component */}
      {!isLoading && !error && transformedData.length > 0 && (
        <TableComponent
          columns={columns}
          data={transformedData}
          totalResults={rfqData?.total || 0}
          currentPage={page}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          onLinkClick={handleLinkClick}
          showCheckboxes={false}
          showHeader={true}
          rowsPerPage={rfqData?.limit || 10}
          searchOptions={{
            value: searchTerm,
            onChange: handleSearchChange,
            placeholder: "Search by Customer Name or Product Name",
          }}
          filterOptions={{
            value: statusFilter,
            onChange: handleStatusFilterChange,
            options: statusOptions,
          }}
        />
      )}
    </Box>
  )
}
