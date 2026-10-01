"use client"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Box,
  Typography,
  Button,
  Avatar,
  Paper,
  Grid,
  TextField,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material"
import { Edit, LocationOn, Phone, Email, ArrowBack } from "@mui/icons-material"
import { useRFQById } from "@/api/handlers"
import Image from "next/image"
const RFQDetail = () => {
  const params = useParams()
  const router = useRouter()
  const rfqId = params?.id as string
  const [mounted, setMounted] = useState(false)

  // Fix hydration issue
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch RFQ data using the API
  const { data: rfqData, isLoading, error } = useRFQById(rfqId)


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
          Failed to load RFQ details. Please try again.
        </Alert>
        <Button onClick={() => router.back()} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Box>
    )
  }

  // No data state
  if (!rfqData) {
    return (
      <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          RFQ not found.
        </Alert>
        <Button onClick={() => router.back()} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Box>
    )
  }

  // Helper function to get customer initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 2, bgcolor: "#f8f9fa" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => router.back()}>
                  <Image src="/back.png?height=13&width=13" alt="Back" width={13} height={13} />
                  <Typography sx={{ ml: 1, color: "#737791", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
                    Back
                  </Typography>
                </Box>
              </Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#0f3b5c",
          }}
        >
          RFQ Requests
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            sx={{
              borderColor: "#ffc107",
              color: "#ffc107",
              textTransform: "none",
              borderRadius: "4px",
              px: 2,
              py: 0.5,
              fontSize: "0.875rem",
              "&:hover": {
                borderColor: "#e6af00",
                backgroundColor: "rgba(255, 193, 7, 0.04)",
              },
            }}
          >
            Send Follow up Email
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderColor: "#4caf50",
              color: "#4caf50",
              textTransform: "none",
              borderRadius: "4px",
              px: 2,
              py: 0.5,
              fontSize: "0.875rem",
              "&:hover": {
                borderColor: "#43a047",
                backgroundColor: "rgba(76, 175, 80, 0.04)",
              },
            }}
          >
            Approve RFQ
          </Button>
          <Button
            sx={{
              minWidth: "auto",
              p: 0.5,
              color: "#757575",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Edit fontSize="small" />
          </Button>
        </Box>
      </Box>

      <Box display={"flex"} gap={5}>
        <Grid>
          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Customer Info and Order Details */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 1,
                border: "1px solid #e0e0e0",
                backgroundColor: "#fff",
              }}
            >
              {/* Customer Info */}
              <Box sx={{ display: "flex", mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "#0f3b5c",
                    width: 50,
                    height: 50,
                    mr: 2,
                    fontSize: "1.25rem",
                  }}
                >
                  {getInitials(rfqData.customerName)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#333", mb: 0 }}>
                    {rfqData.customerName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0 }}>
                    India
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0 }}>
                    <span style={{ color: "#3f51b5" }}>5 Orders</span>
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    <span style={{ color: "#3f51b5" }}>Customer for 2 years</span>
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Order Details */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#333", mb: 2, mt: 2 }}>
                Order Details
              </Typography>

              <Box sx={{ mb: 2, display: "flex", gap: 10 }}>
                <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                  Product
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: "#f0f0f0",
                      mr: 2,
                      borderRadius: 1,
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 10 }}>
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      {rfqData.productName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      {rfqData?.description?.substring(0, 20)}...
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: 2, display: "flex", gap: 10 }}>
                <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                  Quantity
                </Typography>
                <Typography variant="body2">{rfqData.quantity}</Typography>
              </Box>

              <Box sx={{ mb: 3, display: "flex", gap: 10 }}>
                <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                  Location
                </Typography>
                <Typography variant="body2" sx={{ color: "#666" }}>
                  {rfqData.additionalRequirements?.substring(0, 50) || "Not specified"}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Right Column - Company Details */}
        <Grid>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 1,
              border: "1px solid #e0e0e0",
              backgroundColor: "#fff",
              maxHeight: "100%",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#333", mb: 2 }}>
              Company Details
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: "#333", mb: 2 }}>
              {rfqData.customerName} Company
            </Typography>
            <Box sx={{ display: "flex", mb: 2, alignItems: "flex-start" }}>
              <LocationOn sx={{ color: "#f57c00", mr: 1, fontSize: "1.2rem" }} />
              <Typography variant="body2" sx={{ color: "#666" }}>
                {rfqData.additionalRequirements || "Address not provided"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", mb: 2, alignItems: "center" }}>
              <Phone sx={{ color: "#666", mr: 1, fontSize: "1.2rem" }} />
              <Typography variant="body2" sx={{ color: "#666" }}>
                {rfqData.customerPhone}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Email sx={{ color: "#666", mr: 1, fontSize: "1.2rem" }} />
              <Typography variant="body2" sx={{ color: "#666" }}>
                {rfqData.customerEmail}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Box>

      {/* Customer Notes Section - Full Width */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#333", mb: 2 }}>
          Customer Notes
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
              Notes
            </Typography>
            <TextField
              multiline
              fullWidth
              rows={3}
              variant="outlined"
              value={rfqData.description || "No additional notes provided"}
              InputProps={{
                readOnly: true,
                sx: {
                  color: "#666",
                  fontSize: "0.875rem",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#e0e0e0",
                  },
                  "&:hover fieldset": {
                    borderColor: "#e0e0e0",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#e0e0e0",
                  },
                },
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default RFQDetail
