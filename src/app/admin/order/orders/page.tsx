"use client"
import { useState } from "react"
import { Box, Typography, Alert, CircularProgress } from "@mui/material"
import { useRouter } from "next/navigation"
import { TableComponent, type TableRowData } from "../../../../components/TableComponent"
import { useOrders } from "@/api/handlers"
import Image from "next/image"

interface OrderRowData extends TableRowData {
  customer: string
  orderId: string
  orderNumber: string
  status: string
  items: string
  totalAmount: string
  paymentStatus: string
}

export default function OrderList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)

  // Fetch orders data using the API
  const {
    data: ordersData,
    isLoading,
    error,
    isFetching,
  } = useOrders({
    page,
    limit: 9,
    search: searchTerm,
    status: statusFilter,
  })


  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
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
    { id: "customer", label: "Customer", width: "20%" },
    { id: "orderId", label: "Order ID", width: "12%" },
    { id: "orderNumber", label: "Unique ID", width: "12%", align: "center" },
    { id: "status", label: "Order Status", width: "12", type: "status", align: "center" },
    { id: "items", label: "Items", width: "8%", align: "center" },
    { id: "totalAmount", label: "Total Amount", width: "12%", align: "center" },
    { id: "paymentStatus", label: "Payment", width: "12%", type: "status", align: "center" },
    {
      id: "trackOrder",
      label: "View Details",
      width: "12%",
      type: "link",
      align: "center",
    },
  ]

  // Transform API data to table format
  const transformedData: OrderRowData[] =
    ordersData?.orders?.map((order) => {
      try {
        // Get order status display text
        const getStatusDisplay = (status: string) => {
          const statusMap: Record<string, string> = {
            pending: "Pending",
            confirmed: "Confirmed",
            processing: "Processing",
            shipped: "Shipped",
            delivered: "Delivered",
            cancelled: "Cancelled",
          }
          return statusMap[status] || status
        }

        // Get payment status display text
        const getPaymentStatusDisplay = (status: string) => {
          const statusMap: Record<string, string> = {
            pending: "Pending",
            processing: "Processing",
            completed: "Completed",
            failed: "Failed",
            refunded: "Refunded",
          }
          return statusMap[status] || status
        }

        // Format total amount
        const formatAmount = (amount: number) => {
          return `₹${amount.toLocaleString('en-IN', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`
        }

        return {
          id: order._id,
          customer: `${order.customer.name}\n${order.customer.email}`,
          orderId: order._id.slice(-8).toUpperCase(),
          orderNumber: order.uniqueId,
          status: getStatusDisplay(order.orderStatus),
          items: order.items.length.toString(),
          totalAmount: formatAmount(order.totalAmount),
          paymentStatus: getPaymentStatusDisplay(order.paymentStatus),
          trackOrder: order._id,
        }
      } catch (err) {
        console.error("Error transforming order data:", err, order)
        return {
          id: order._id || "unknown",
          customer: "Error loading data",
          orderId: "N/A",
          orderNumber: "N/A",
          status: "error",
          items: "0",
          totalAmount: "₹0.00",
          paymentStatus: "error",
          trackOrder: "N/A",
        }
      }
    }) || []

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleRowClick = (row: TableRowData) => {
    router.push(`/admin/order/orders/detail/${row.id}`)
  }

  const handleLinkClick = (row: TableRowData) => {
    router.push(`/admin/order/orders/detail/${row.id}`)
  }

  const handleSearchChange = (searchValue: string) => {
    setSearchTerm(searchValue)
    setPage(1)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
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
    return "Failed to load customer orders. Please try again."
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
        Customer Orders Management
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
      {ordersData && !error && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: "14px", color: "#737791", fontFamily: "Poppins, sans-serif" }}>
            Showing {transformedData.length} of {ordersData.total} customer orders
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
            {searchTerm || statusFilter
              ? "No customer orders found matching your criteria"
              : "No customer orders available"}
          </Typography>
        </Box>
      )}

      {/* Table Component */}
      {!isLoading && !error && transformedData.length > 0 && (
        <TableComponent
          columns={columns}
          data={transformedData}
          totalResults={ordersData?.total || 0}
          currentPage={page}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          onLinkClick={handleLinkClick}
          showCheckboxes={false}
          showHeader={true}
          rowsPerPage={9}
          searchOptions={{
            value: searchTerm,
            onChange: handleSearchChange,
            placeholder: "Search by Customer Name, Email, or Order ID",
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
