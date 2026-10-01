"use client"
import { useParams, useRouter } from "next/navigation"
import type React from "react"

import { useEffect, useState } from "react"
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
} from "@mui/material"
import {
  ArrowBack,
  LocalShipping,
  LocationOn,
  Schedule,
  CheckCircle,
  RadioButtonUnchecked,
  DirectionsBoat,
} from "@mui/icons-material"
import { useShipmentById } from "@/api/handlers/shipmentsHandler"
import Image from "next/image"

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return { backgroundColor: "#e8f5e8", color: "#2e7d32" }
    case "in transit":
      return { backgroundColor: "#fff3e0", color: "#f57c00" }
    case "loaded":
      return { backgroundColor: "#e3f2fd", color: "#1976d2" }
    case "pending":
      return { backgroundColor: "#fce4ec", color: "#c2185b" }
    default:
      return { backgroundColor: "#f5f5f5", color: "#666" }
  }
}

const getTimelineIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return <CheckCircle sx={{ color: "#2e7d32" }} />
    case "in transit":
      return <LocalShipping sx={{ color: "#f57c00" }} />
    case "loaded":
      return <DirectionsBoat sx={{ color: "#1976d2" }} />
    default:
      return <RadioButtonUnchecked sx={{ color: "#666" }} />
  }
}

// Custom Timeline Components
const CustomTimeline = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ position: "relative", ml: 2 }}>{children}</Box>
)

const CustomTimelineItem = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ position: "relative", mb: 4, pl: 3 }}>{children}</Box>
)

const CustomTimelineDot = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      position: "absolute",
      left: -20,
      top: 0,
      width: 40,
      height: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "white",
      borderRadius: "50%",
      zIndex: 2,
    }}
  >
    {children}
  </Box>
)

const CustomTimelineConnector = () => (
  <Box
    sx={{
      position: "absolute",
      left: 0,
      top: 40,
      bottom: -40,
      width: 2,
      backgroundColor: "#e0e0e0",
      zIndex: 1,
    }}
  />
)

const ShipmentDetail = () => {
  const params = useParams()
  const router = useRouter()
  const shipmentId = params?.id as string
  const [mounted, setMounted] = useState(false)

  // Fix hydration issue
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch shipment data using the API
  const { data: shipmentData, isLoading, error } = useShipmentById(shipmentId)


  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load shipment details. Please try again.
        </Alert>
        <Button onClick={() => router.back()} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Box>
    )
  }

  // No data state
  if (!shipmentData) {
    return (
      <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Shipment not found.
        </Alert>
        <Button onClick={() => router.back()} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Box>
    )
  }

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Invalid Date"
    }
  }

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return "Invalid Date"
    }
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 2, bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => router.back()}>
          <Image src="/back.png?height=13&width=13" alt="Back" width={13} height={13} />
          <Typography sx={{ ml: 1, color: "#737791", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
            Back
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#1F2A44",
          mb: 3,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        Shipment Details
      </Typography>

      <Grid container spacing={9}>
        {/* Left Column - Shipment Information */}
        <Grid>
          {/* Basic Shipment Info */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              backgroundColor: "#fff",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "#f0f0f0",
                    color: "#666",
                    width: 56,
                    height: 56,
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  {shipmentData.carrier?.charAt(0) || "?"}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#333", mb: 0.5 }}>
                    {shipmentData.carrier}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                    BL Number: {shipmentData.blNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    Reference: {shipmentData.shipmentReference || "N/A"}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={shipmentData.status}
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  borderRadius: "16px",
                  px: 2,
                  py: 1,
                  ...getStatusColor(shipmentData.status),
                }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Shipment Details Grid */}
            <Grid container spacing={9}>
              <Grid>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5, fontWeight: 500 }}>
                    Container Number
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#333" }}>
                    {shipmentData.containerNumber || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5, fontWeight: 500 }}>
                    Departure Port
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#333" }}>
                    {shipmentData.departurePort || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5, fontWeight: 500 }}>
                    ETD (Estimated Time of Departure)
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#333" }}>
                    {formatDateShort(shipmentData.etd)}
                  </Typography>
                </Box>
              </Grid>
              <Grid>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5, fontWeight: 500 }}>
                    Shipment Reference
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#333" }}>
                    {shipmentData.shipmentReference || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5, fontWeight: 500 }}>
                    Arrival Port
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#333" }}>
                    {shipmentData.arrivalPort || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5, fontWeight: 500 }}>
                    ETA (Estimated Time of Arrival)
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#333" }}>
                    {formatDateShort(shipmentData.eta)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {shipmentData.deliveryDate && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5, fontWeight: 500 }}>
                    Actual Delivery Date
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#2e7d32", fontWeight: 600 }}>
                    {formatDate(shipmentData.deliveryDate)}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>

          {/* Tracking Timeline */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #e0e0e0",
              backgroundColor: "#fff",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#333", mb: 3 }}>
              Tracking Timeline
            </Typography>

            {shipmentData.trackingEvents && shipmentData.trackingEvents.length > 0 ? (
              <CustomTimeline>
                {shipmentData.trackingEvents.map((event, index) => (
                  <CustomTimelineItem key={index}>
                    <CustomTimelineDot>{getTimelineIcon(event.status)}</CustomTimelineDot>
                    {index < shipmentData.trackingEvents.length - 1 && <CustomTimelineConnector />}
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#333", mb: 0.5 }}>
                        {event.description}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <LocationOn sx={{ fontSize: 16, color: "#666" }} />
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          {event.location}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Schedule sx={{ fontSize: 16, color: "#666" }} />
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          {formatDate(event.date)}
                        </Typography>
                      </Box>
                      <Chip
                        label={event.status}
                        size="small"
                        sx={{
                          fontSize: "12px",
                          fontWeight: 500,
                          borderRadius: "12px",
                          ...getStatusColor(event.status),
                        }}
                      />
                    </Box>
                  </CustomTimelineItem>
                ))}
              </CustomTimeline>
            ) : (
              <Typography variant="body2" sx={{ color: "#666", textAlign: "center", py: 4 }}>
                No tracking events available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Additional Information */}
        <Grid>
          {/* Status Summary */}
          <Card sx={{ mb: 3, border: "1px solid #e0e0e0", boxShadow: "none" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#333", mb: 2 }}>
                Status Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                  Current Status
                </Typography>
                <Chip
                  label={shipmentData.status}
                  sx={{
                    fontSize: "14px",
                    fontWeight: 500,
                    borderRadius: "16px",
                    ...getStatusColor(shipmentData.status),
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                  Delivery Status
                </Typography>
                <Typography variant="body1" sx={{ color: shipmentData.isDelivered ? "#2e7d32" : "#f57c00" }}>
                  {shipmentData.isDelivered ? "✓ Delivered" : "⏳ In Transit"}
                </Typography>
              </Box>
              {shipmentData.lastSyncedAt && (
                <Box>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#333" }}>
                    {formatDate(shipmentData.lastSyncedAt)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {shipmentData.notes && (
            <Card sx={{ mb: 3, border: "1px solid #e0e0e0", boxShadow: "none" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#333", mb: 2 }}>
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.6 }}>
                  {shipmentData.notes}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          <Card sx={{ border: "1px solid #e0e0e0", boxShadow: "none" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#333", mb: 2 }}>
                Additional Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                  Created Date
                </Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  {formatDateShort(shipmentData.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                  Last Modified
                </Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  {formatDateShort(shipmentData.updatedAt)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                  Archive Status
                </Typography>
                <Typography variant="body2" sx={{ color: shipmentData.archived ? "#f57c00" : "#2e7d32" }}>
                  {shipmentData.archived ? "Archived" : "Active"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ShipmentDetail
