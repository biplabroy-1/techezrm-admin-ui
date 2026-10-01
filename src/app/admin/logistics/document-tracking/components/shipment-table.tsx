"use client"
import { useState } from "react"
import {
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
} from "@mui/material"
import { ChevronLeft, ChevronRight } from "@mui/icons-material"
import { useShipments } from "@/api/handlers/shipmentsHandler"
import { useRouter } from "next/navigation"

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return { backgroundColor: "#e8f5e8", color: "#2e7d32" }
    case "in transit":
      return { backgroundColor: "#fff3e0", color: "#f57c00" }
    case "pending":
      return { backgroundColor: "#fce4ec", color: "#c2185b" }
    case "error":
      return { backgroundColor: "#ffebee", color: "#d32f2f" }
    default:
      return { backgroundColor: "#f5f5f5", color: "#666" }
  }
}

interface ShipmentTableProps {
  filterValue?: string
  dateSort?: string
  searchTerm?: string
}

export default function ShipmentTable({ filterValue = "", searchTerm = "" }: ShipmentTableProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 10

  // Fetch shipments data using the API
  const {
    data: shipmentsData,
    isLoading,
    error,
    isFetching,
  } = useShipments({
    page: currentPage,
    limit,
    search: searchTerm,
    status: filterValue,
  })


  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Invalid Date"
    }
  }

  // Handle row click to navigate to detail page
  const handleRowClick = (shipmentId: string) => {
    router.push(`/admin/logistics/document-tracking/detail/${shipmentId}`)
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
    return "Failed to load shipments. Please try again."
  }

  const totalPages = shipmentsData?.totalPages || 1
  const shipments = shipmentsData?.shipments || []

  return (
    <Box sx={{ mt: 1 }}>
      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
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
      {shipmentsData && !error && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: "14px", color: "#666", fontFamily: "Poppins, sans-serif" }}>
            Showing {shipments.length} of {shipmentsData.total} shipments
            {searchTerm && ` for "${searchTerm}"`}
            {filterValue && ` with status "${filterValue}"`}
            {isFetching && " (Loading...)"}
          </Typography>
        </Box>
      )}

      {/* Table */}
      {!isLoading && (
        <TableContainer
          component={Paper}
          sx={{
            boxShadow: "none",
            border: "1px solid #e1e5e9",
            borderRadius: "12px",
            overflow: "auto",
            maxWidth: "80%",
          }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 120,
                  }}
                >
                  CARRIER
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 80,
                  }}
                >
                  BL NO
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 120,
                  }}
                >
                  TRACKING
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 120,
                  }}
                >
                  REFERENCE
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 150,
                  }}
                >
                  CONTAINER
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 120,
                  }}
                >
                  ORIGIN
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 120,
                  }}
                >
                  DESTINATION
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 100,
                  }}
                >
                  ETD
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 100,
                  }}
                >
                  ETA
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#666",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    py: 2,
                    minWidth: 180,
                  }}
                >
                  STATUS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shipments.length > 0 ? (
                shipments.map((shipment) => (
                  <TableRow
                    key={shipment.id || shipment._id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f8f9fa",
                      },
                      borderBottom: "1px solid #f0f0f0",
                      cursor: "pointer",
                    }}
                    onClick={() => handleRowClick(shipment.id || shipment._id)}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "#f0f0f0",
                            color: "#666",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {shipment.carrier?.charAt(0) || "?"}
                        </Avatar>
                        <Typography
                          sx={{
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "14px",
                            color: "#333",
                            fontWeight: 500,
                          }}
                        >
                          {shipment.carrier || "Unknown Carrier"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          color: "#333",
                          fontWeight: 600,
                        }}
                      >
                        {shipment.blNumber || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        {shipment.blNumber || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        {shipment.shipmentReference || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        {shipment.containerNumber || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        {shipment.departurePort || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        {shipment.arrivalPort || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        {formatDate(shipment.etd)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        {formatDate(shipment.eta)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={shipment.status || "Unknown"}
                        size="small"
                        sx={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "12px",
                          fontWeight: 500,
                          borderRadius: "16px",
                          ...getStatusColor(shipment.status || "unknown"),
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography
                      sx={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      {isFetching ? "Loading shipments..." : "No shipments found"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mt: 2,
            gap: 1,
          }}
        >
          <IconButton
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            sx={{
              width: 32,
              height: 32,
              backgroundColor: "#f8f9fa",
              "&:hover": {
                backgroundColor: "#e9ecef",
              },
              "&.Mui-disabled": {
                backgroundColor: "#f8f9fa",
                opacity: 0.5,
              },
            }}
          >
            <ChevronLeft sx={{ fontSize: 18 }} />
          </IconButton>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#FF8C42",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "14px",
                color: "white",
                fontWeight: 500,
              }}
            >
              {currentPage}
            </Typography>
          </Box>
          <IconButton
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            sx={{
              width: 32,
              height: 32,
              backgroundColor: "#f8f9fa",
              "&:hover": {
                backgroundColor: "#e9ecef",
              },
              "&.Mui-disabled": {
                backgroundColor: "#f8f9fa",
                opacity: 0.5,
              },
            }}
          >
            <ChevronRight sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}
