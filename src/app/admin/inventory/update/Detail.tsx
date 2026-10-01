"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  FormControl,
  Checkbox,
  ThemeProvider,
  createTheme,
  CssBaseline,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useUpdateProduct } from "@/api/handlers"
import { useUIStore } from "@/store/uiStore"
import type { CreateProductRequest } from "@/api/services"
import { useQuery } from "@tanstack/react-query"
import { categoryService } from "@/api/services/categories"

// Create a custom styled Switch component
const CustomSwitch = styled(Switch)(() => ({
  width: 42,
  height: 22,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(20px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "#073E54",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    width: 18,
    height: 18,
    borderRadius: "50%",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.1)",
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: "rgba(217, 228, 255, 1)",
    borderRadius: 32,
  },
}))

// Create a theme with Poppins font
const theme = createTheme({
  typography: {
    fontFamily: '"Poppins", sans-serif',
    allVariants: {
      fontFamily: '"Poppins", sans-serif',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@global": {
          "*": {
            fontFamily: '"Poppins", sans-serif',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: '"Poppins", sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Poppins", sans-serif',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        label: {
          fontFamily: '"Poppins", sans-serif',
        },
      },
    },
  },
})

/**
 * The product as this form receives it: every field arrives as a query-string value,
 * hence strings rather than the numbers and booleans the API's Product carries.
 * Exported so the page that assembles it from searchParams is typed against this
 * shape rather than the service's unrelated Product.
 */
export interface Product {
  id: string
  name: string
  description: string
  inventory: string
  category: string
  price: string
  inStock: string
}

interface DetailProps {
  product?: Product
}

export default function UpdateProductDetail({ product }: DetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get product data from URL params if not passed as prop
const productData = {
  id: product?.id ?? searchParams.get("id") ?? "",
  name: product?.name ?? searchParams.get("name") ?? "",
  description: product?.description ?? searchParams.get("description") ?? "",
  inventory: product?.inventory ?? searchParams.get("inventory") ?? "",
  category: product?.category ?? searchParams.get("category") ?? "",
  price: product?.price ?? searchParams.get("price") ?? "",
  inStock: product?.inStock ?? searchParams.get("inStock") ?? "true",
};


  console.log("=== COMPONENT INITIALIZATION ===")
  console.log(searchParams,"Product data from URL/props:", productData)

  // Hooks
  const { notifications, addNotification } = useUIStore()
  const updateProductMutation = useUpdateProduct()

  console.log("=== MUTATION STATUS ===")
  console.log("Mutation object:", updateProductMutation)
  console.log("Is pending:", updateProductMutation.isPending)

  // State management
  const [includeTax, setIncludeTax] = useState(true)
  const [tags, setTags] = useState<string[]>(["trend", "instagram"])
  const [tagInput, setTagInput] = useState("")
  const [hasMultipleOptions, setHasMultipleOptions] = useState(true)
  const [isDigitalItem, setIsDigitalItem] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [inStock, setInStock] = useState(productData.inStock === "true")

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Category state
  // const [categories, setCategories] = useState(["Amino Acidsss", "Vitamins", "Supplements", "Protein", "Pre-workout"])
    // Fetch categories
  const {
    data: categoriesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.fetchAllCategories(),
  });


  type CategoryItem = {
    _id: string;
    name: string;
  };

  const categories: CategoryItem[] =
    // Top-level `categories`, not `data.categories`: /private/categories/all
    // returns { success, categories }. The nested read always yielded undefined,
    // so this list was always empty.
    categoriesData?.categories?.map((cat: any) => ({
      _id: cat._id,
      name: cat.name,
    })) ?? [];

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  const [formData, setFormData] = useState({
    name: productData.name || "",
    description: productData.description || "",
    price: productData.price?.replace("$", "") || "",
    category: productData.category || "",
  })

  console.log("=== INITIAL FORM DATA ===")
  console.log("Form data:", formData)
  console.log("Selected categories:", selectedCategories)
  console.log("In stock:", inStock)

  // Initialize form with existing product data
// useEffect(() => {
//   console.log("=== USEEFFECT RUNNING ===")
//   console.log("Product category:", productData.category)

//   // Set form data if not already set
//   if (productData.name && !formData.name) {
//     setFormData(prev => ({
//       ...prev,
//       name: productData.name,
//       description: productData.description || "",
//       price: productData.price?.replace("$", "") || "",
//       category: productData.category || "",
//     }))
//   }

//   // Set initial category selection
//   if (productData.category) {
//     // Add category to categories list if it doesn't exist
//     setCategories(prev => {
//       if (!prev.includes(productData.category)) {
//         console.log("Adding category to list:", productData.category)
//         return [...prev, productData.category]
//       }
//       return prev
//     })

//     // Set selected categories if not already set
//     setSelectedCategories(prev => {
//       if (!prev.includes(productData.category)) {
//         console.log("Setting initial category:", productData.category)
//         return [productData.category]
//       }
//       return prev
//     })
//   }

//   // Set stock status
//   setInStock(productData.inStock === "true")
// }, [productData]) 

useEffect(() => {
  console.log("=== USEEFFECT RUNNING ===")
  console.log("Product category:", productData)

  // Set form data once
  if (productData.name && !formData.name) {
    setFormData(prev => ({
      ...prev,
      name: productData.name,
      description: productData.description || "",
      price: productData.price?.replace("$", "") || "",
      category: productData.category || "",
    }))
  }

  // Set initial selected category (DO NOT TOUCH categories list)
  if (productData.category) {
    setSelectedCategories(prev => {
      if (!prev.includes(productData.category)) {
        return [productData.category] // single-select
      }
      return prev
    })
  }

  // Stock status
  setInStock(productData.inStock === "true")
}, [productData])


  // Form validation with detailed logging
  const validateForm = (): boolean => {
    console.log("=== FORM VALIDATION START ===")
    const errors: Record<string, string> = {}

    console.log("Validating name:", `"${formData.name}"`, "Trimmed:", `"${formData.name.trim()}"`)
    if (!formData.name.trim()) {
      errors.name = "Product name is required"
      console.log("❌ Name validation FAILED")
    } else {
      console.log("✅ Name validation PASSED")
    }

    console.log("Validating description:", `"${formData.description}"`, "Trimmed:", `"${formData.description.trim()}"`)
    if (!formData.description.trim()) {
      errors.description = "Product description is required"
      console.log("❌ Description validation FAILED")
    } else {
      console.log("✅ Description validation PASSED")
    }

    console.log(
      "Validating price:",
      `"${formData.price}"`,
      "Number:",
      Number(formData.price),
      "IsNaN:",
      isNaN(Number(formData.price)),
    )
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.price = "Valid price is required"
      console.log("❌ Price validation FAILED")
    } else {
      console.log("✅ Price validation PASSED")
    }

    console.log("Validating categories:", selectedCategories, "Length:", selectedCategories.length)
    if (selectedCategories.length === 0) {
      errors.categories = "Please select at least one category"
      console.log("❌ Categories validation FAILED")
    } else {
      console.log("✅ Categories validation PASSED")
    }

    console.log("=== VALIDATION SUMMARY ===")
    console.log("Errors found:", errors)
    console.log("Validation result:", Object.keys(errors).length === 0 ? "PASSED" : "FAILED")

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Form submission handler with extensive logging
  const handleUpdate = async () => {
    console.log("🚀 =========================")
    console.log("🚀 UPDATE BUTTON CLICKED!")
    console.log("🚀 =========================")

    try {
      console.log("📋 Current form state:")
      console.log("  - Form data:", formData)
      console.log("  - Selected categories:", selectedCategories)
      console.log("  - In stock:", inStock)
      console.log("  - Product ID:", productData.id)

      console.log("🔍 Starting form validation...")
      const isValid = validateForm()

      if (!isValid) {
        console.log("❌ VALIDATION FAILED - Stopping execution")
        console.log("❌ Form errors:", formErrors)
        return
      }
      console.log("✅ VALIDATION PASSED")

      console.log("🔍 Checking product ID...")
      if (!productData.id) {
        console.log("❌ PRODUCT ID MISSING")
        addNotification({
          type: "error",
          message: "Product ID is missing. Cannot update product.",
        })
        return
      }
      console.log("✅ PRODUCT ID FOUND:", productData.id)

      // Prepare API payload
      const updatePayload: Partial<CreateProductRequest> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: selectedCategories[0],
        inStock: inStock,
      }

      console.log("📤 PREPARED API PAYLOAD:")
      console.log(JSON.stringify(updatePayload, null, 2))

      console.log("🔍 Checking mutation function...")
      console.log("Mutation function exists:", typeof updateProductMutation.mutateAsync === "function")
      console.log("Mutation status:", {
        isPending: updateProductMutation.isPending,
        isError: updateProductMutation.isError,
        isSuccess: updateProductMutation.isSuccess,
      })

      console.log("🚀 CALLING API MUTATION...")

      const result = await updateProductMutation.mutateAsync({
        productId: productData.id,
        data: updatePayload,
      })

      console.log("✅ API CALL SUCCESSFUL!")
      console.log("✅ Result:", result)

      // Navigate back after successful update
      setTimeout(() => {
        console.log("🔄 Navigating back...")
        router.back()
      }, 1500)
    } catch (error) {
      console.log("❌ ERROR IN HANDLE UPDATE:")
      console.error(error)

      // Additional error details
      if (error instanceof Error) {
        console.log("Error message:", error.message)
        console.log("Error stack:", error.stack)
      }
    }
  }

  // File upload handlers
  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Tag handlers
  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Category handlers
  const handleCategoryChange = (category: CategoryItem) => {
    console.log("Category changed:", category)
    setSelectedCategories((prev) => {
      const newSelection = prev.includes(category?._id) ? prev.filter((c) => c !== category._id) : [...prev, category._id]
      console.log("New category selection:", newSelection)
      return newSelection
    })

    // Clear category error when user selects a category
    if (formErrors.categories) {
      setFormErrors((prev) => ({ ...prev, categories: "" }))
    }
  }

  // const handleCreateCategory = () => {
  //   if (newCategoryName && !categories.includes(newCategoryName)) {
  //     setCategories([...categories, newCategoryName])
  //     setNewCategoryName("")
  //     setShowCreateCategory(false)
  //   }
  // }

  // Get the latest notification for display
  const latestNotification = notifications[notifications.length - 1]

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => router.back()}>
            <Image src="/back.png?height=13&width=13" alt="Back" width={13} height={13} />
            <Typography sx={{ ml: 1, color: "#737791", fontSize: "14px" }}>Back</Typography>
          </Box>
        </Box>

        <Typography sx={{ fontSize: "24px", fontWeight: "bold", color: "#1F2A44", mb: 2 }}>Update Product</Typography>

        {/* Show latest notification */}
        {latestNotification && (
          <Alert severity={latestNotification.type} sx={{ mb: 2 }}>
            {latestNotification.message}
          </Alert>
        )}

        
        <Box sx={{ display: "flex", p: 2, minHeight: "100vh", alignItems: "flex-start", gap: 3, mt: -2 }}>
          {/* Left Section */}
          <Box sx={{ flex: 1, pr: 2, bgcolor: "#fff", m: 2, p: 6, pt: 2, pb: 2 }}>
            {/* Information Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "black" }}>
                Information
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                  Product Name *
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ mb: 2 }}
                  value={formData.name}
                  onChange={(e) => {
                    console.log("Name changed to:", e.target.value)
                    setFormData({ ...formData, name: e.target.value })
                    if (formErrors.name) {
                      setFormErrors((prev) => ({ ...prev, name: "" }))
                    }
                  }}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
                <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                  Product Description *
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={4}
                  placeholder="Product description"
                  sx={{ mb: 1 }}
                  value={formData.description}
                  onChange={(e) => {
                    console.log("Description changed to:", e.target.value)
                    setFormData({ ...formData, description: e.target.value })
                    if (formErrors.description) {
                      setFormErrors((prev) => ({ ...prev, description: "" }))
                    }
                  }}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Paper>
            </Box>

            {/* Images Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "black" }}>
                Images
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box
                  sx={{
                    border: "1px dashed #ccc",
                    borderRadius: 1,
                    p: 3,
                    textAlign: "center",
                    bgcolor: "#fff",
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{ mb: 1, textTransform: "none" }}
                    onClick={handleFileUpload}
                  >
                    Add File
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Or drag and drop files
                  </Typography>
                </Box>
                {uploadedFiles.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                      Uploaded Files:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {uploadedFiles.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() => handleRemoveFile(index)}
                          deleteIcon={<CloseIcon style={{ fontSize: 14 }} />}
                          sx={{ bgcolor: "#f0f0f0" }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Price Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "black" }}>
                Price
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                      Product Price *
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => {
                        console.log("Price changed to:", e.target.value)
                        setFormData({ ...formData, price: e.target.value })
                        if (formErrors.price) {
                          setFormErrors((prev) => ({ ...prev, price: "" }))
                        }
                      }}
                      error={!!formErrors.price}
                      helperText={formErrors.price}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                      Discount Price
                    </Typography>
                    <TextField fullWidth variant="outlined" size="small" placeholder="Price at checkout" />
                  </Box>
                </Box>
                <FormControlLabel
                  control={<CustomSwitch checked={includeTax} onChange={(e) => setIncludeTax(e.target.checked)} />}
                  label="Add tax for this product"
                  sx={{
                    mt: 1,
                    "& .MuiFormControlLabel-label": { fontSize: 14 },
                    "& .MuiSwitch-root": { mr: 2 },
                  }}
                />
              </Paper>
            </Box>

            {/* Stock Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "black" }}>
                Stock Status
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <CustomSwitch
                      checked={inStock}
                      onChange={(e) => {
                        console.log("Stock status changed to:", e.target.checked)
                        setInStock(e.target.checked)
                      }}
                    />
                  }
                  label="Product is in stock"
                  sx={{
                    "& .MuiFormControlLabel-label": { fontSize: 14 },
                    "& .MuiSwitch-root": { mr: 2 },
                  }}
                />
              </Paper>
            </Box>

            {/* Different Options */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "black" }}>
                Different Options
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <FormControlLabel
                  control={
                    <CustomSwitch
                      checked={hasMultipleOptions}
                      onChange={(e) => setHasMultipleOptions(e.target.checked)}
                    />
                  }
                  label="This product has multiple options"
                  sx={{
                    "& .MuiFormControlLabel-label": { fontSize: 14 },
                    "& .MuiSwitch-root": { mr: 2 },
                  }}
                />
                {hasMultipleOptions && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Option 1
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                          Name
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select value="brand" displayEmpty>
                            <MenuItem value="brand">brand</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                          Values
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          size="small"
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ display: "flex", gap: 2 }}>
                                {["1", "2", "3", "4"].map((size) => (
                                  <Chip
                                    key={size}
                                    label={size}
                                    size="small"
                                    variant="outlined"
                                    deleteIcon={<CloseIcon style={{ fontSize: 14 }} />}
                                    onDelete={() => {}}
                                    sx={{ borderRadius: 0, bgcolor: "rgba(217, 228, 255, 1)", width: "80%" }}
                                  />
                                ))}
                              </Box>
                            ),
                          }}
                        />
                      </Box>
                    </Box>
                    <Button
                      startIcon={<AddIcon />}
                      sx={{
                        mt: 2,
                        color: "primary.main",
                        textTransform: "none",
                        p: 0,
                      }}
                    >
                      Add More
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Shipping */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "black" }}>
                Shipping
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                      Weight
                    </Typography>
                    <TextField fullWidth variant="outlined" size="small" placeholder="Enter Weight" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                      Country
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select value="" displayEmpty renderValue={() => "Select Country"}>
                        <MenuItem value="">Select Country</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <CustomSwitch checked={isDigitalItem} onChange={(e) => setIsDigitalItem(e.target.checked)} />
                  }
                  label="This is digital item"
                  sx={{
                    mt: 2,
                    "& .MuiFormControlLabel-label": { fontSize: 14 },
                    "& .MuiSwitch-root": { mr: 2 },
                  }}
                />
              </Paper>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <Button
                variant="text"
                sx={{ color: "#000" }}
                disabled={updateProductMutation.isPending}
                onClick={() => router.back()}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                sx={{
                  bgcolor: "#FFA500",
                  color: "#fff",
                  "&:hover": { bgcolor: "#FF8C00" },
                  px: 4,
                  position: "relative",
                }}
                onClick={(e) => {
                  console.log("🔘 UPDATE BUTTON CLICKED - Event:", e)
                  handleUpdate()
                }}
                disabled={updateProductMutation.isPending}
              >
                {updateProductMutation.isPending && (
                  <CircularProgress
                    size={20}
                    sx={{
                      color: "#fff",
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      marginLeft: "-10px",
                      marginTop: "-10px",
                    }}
                  />
                )}
                {updateProductMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </Box>
          </Box>

          {/* Right Section */}
          <Box sx={{ width: 250 }}>
            {/* Categories */}
            <Box sx={{ mb: 4 }}>
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "black" }}>
                  Categories *
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {/* Same three states the Add Product form now has - a failed
                      fetch must not look like "this store has no categories". */}
                  {isLoading && (
                    <Typography variant="body2" color="text.secondary">
                      Loading categories…
                    </Typography>
                  )}

                  {!isLoading && error && (
                    <Typography variant="body2" color="error">
                      Could not load categories:{" "}
                      {(error as Error)?.message ?? "request failed"}
                    </Typography>
                  )}

                  {!isLoading && !error && categories.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No categories exist yet. Create one under Data Management →
                      Categories, then reload this page.
                    </Typography>
                  )}

                  {categories.map((category) => (
                    <Box key={category?._id} sx={{ display: "flex", alignItems: "center" }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedCategories.includes(category?._id)}
                            onChange={() => handleCategoryChange(category)}
                          />
                        }
                        label=""
                        sx={{ m: 0, mr: -1 }}
                      />
                      <Typography variant="body2">{category.name}</Typography>
                    </Box>
                  ))}
                  {/* <Button
                    variant="text"
                    onClick={() => setShowCreateCategory(true)}
                    sx={{
                      color: "#1976d2",
                      textTransform: "none",
                      justifyContent: "flex-start",
                      p: 0,
                      mt: 1,
                    }}
                  >
                    Create New
                  </Button> */}
                </Box>
                {formErrors.categories && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                    {formErrors.categories}
                  </Typography>
                )}
              </Paper>
            </Box>

            {/* Tags */}
            <Box>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "black" }}>
                  Tags
                </Typography>
                <Button
                  variant="text"
                  sx={{
                    color: "#1976d2",
                    textTransform: "none",
                    justifyContent: "flex-start",
                    p: 0,
                    mb: 1,
                  }}
                >
                  Add Tags
                </Button>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Enter tag name"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      onDelete={() => handleRemoveTag(tag)}
                      deleteIcon={<CloseIcon style={{ fontSize: 14 }} />}
                      sx={{
                        bgcolor: tag === "trend" ? "#f0f0f0" : "#e6e6fa",
                        borderRadius: 0,
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>

        {/* Create Category Dialog */}
        <Dialog open={showCreateCategory} onClose={() => setShowCreateCategory(false)}>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Category Name"
              fullWidth
              variant="outlined"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateCategory(false)}>Cancel</Button>
            {/* <Button onClick={handleCreateCategory} variant="contained">
              Create
            </Button> */}
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}
