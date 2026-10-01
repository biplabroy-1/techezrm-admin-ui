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
  Chip,
  InputAdornment,
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
  Divider,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAddProduct } from "@/api/handlers"
import { useUIStore } from "@/store/uiStore"
import type { CreateProductFormData } from "@/api/services"
import { categoryService } from '@/api/services/categories';
import { useQuery } from "@tanstack/react-query"

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
 * This is a ROUTE component, reached only by `router.push('/admin/inventory/add-product')`.
 *
 * It used to take a `product?: Product` prop, which is what broke the build. Next
 * type-checks that a page's default export accepts exactly the router's
 * { params, searchParams }; any extra prop fails with
 * `Type "DetailProps" is not valid`, and its generated types said so plainly:
 * `Type 'DetailProps' has no properties in common with type 'PageProps'`.
 *
 * Nothing ever passed the prop anyway - updating a product has its own form at
 * inventory/update/Detail.tsx - so `product` was always undefined and the form always
 * started empty, which is correct for "Add Product".
 */
export default function Detail() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Hooks
  const { notifications } = useUIStore()
  const addProductMutation = useAddProduct()

  // Local state
  // Start EMPTY.
  //
  // This was hardcoded to ["trend", "instagram"], so every product created
  // through this form silently carried those two demo labels - the payload in
  // handleSubmit never even included them, so nothing saved, but they were shown
  // as if they were real. They are not part of the product taxonomy: the curated
  // list the server actually uses lives in `@constants/filter` (e.g.
  // "Natural / Synthetic", "Vegan / Vegetarian / Halal / Kosher").
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [minMaxTags, setMinMaxTags] = useState<string[]>([])
  const [minMaxInput, setMinMaxInput] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string>("")
  const [inStock, setInStock] = useState(true)
  const [includeTax, setIncludeTax] = useState(true)

  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  // Fetch categories
  const {
    data: categoriesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.fetchAllCategories(),
  });

  
  // Category state
type CategoryItem = {
  _id: string;
  name: string;
};

const categories: CategoryItem[] =
  categoriesData?.categories?.map((cat: any) => ({
    _id: cat._id,
    name: cat.name,
  })) ?? [];


  // const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  
 useEffect(() => {
  if (categoriesData) {
  }
}, [categoriesData]);


  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  })

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Product name is required"
    }
    if (!formData.description.trim()) {
      errors.description = "Product description is required"
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.price = "Valid price is required"
    }
    if (selectedCategories.length === 0) {
      errors.categories = "Please select at least one category"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Form submission handler
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    // Prepare API payload with files
    const productPayload: CreateProductFormData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      category: selectedCategories[0],
      inStock: inStock,
      bannerImage: bannerImage || undefined,
      images: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      // Was omitted entirely, so tags collected in the form went nowhere even
      // though the Product model declares `tags: [String]`.
      tags: tags.length > 0 ? tags : undefined,
    }

    try {
      await addProductMutation.mutateAsync(productPayload)

      // Reset form after successful submission
      setFormData({ name: "", description: "", price: "" })
      setSelectedCategories([])
      setUploadedFiles([])
      setBannerImage(null)
      setBannerPreview("")
      setTags([])
      setMinMaxTags([])
      setFormErrors({})

      // Navigate back after a short delay
      setTimeout(() => {
        router.back()
      }, 1500)
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  // Banner image handlers
  const handleBannerUpload = () => {
    bannerInputRef.current?.click()
  }

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setBannerImage(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setBannerPreview(previewUrl)
    }
  }

  const handleRemoveBanner = () => {
    setBannerImage(null)
    setBannerPreview("")
    if (bannerInputRef.current) {
      bannerInputRef.current.value = ""
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
      // Limit to 5 images maximum
      const remainingSlots = 5 - uploadedFiles.length
      const filesToAdd = newFiles.slice(0, remainingSlots)
      setUploadedFiles((prev) => [...prev, ...filesToAdd])
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

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Min Max orders handlers
  const handleAddMinMaxTag = () => {
    if (minMaxInput && !minMaxTags.includes(minMaxInput)) {
      setMinMaxTags([...minMaxTags, minMaxInput])
      setMinMaxInput("")
    }
  }

  const handleRemoveMinMaxTag = (tagToRemove: string) => {
    setMinMaxTags(minMaxTags.filter((tag) => tag !== tagToRemove))
  }

  const handleMinMaxKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddMinMaxTag()
    }
  }

  // Category handlers
 const handleCategoryChange = (category: CategoryItem) => {
  setSelectedCategories((prev) =>
    prev.includes(category._id)
      ? prev.filter((id) => id !== category._id)
      : [...prev, category._id]
  );

  if (formErrors.categories) {
    setFormErrors((prev) => ({ ...prev, categories: "" }));
  }
}

const handleCreateCategory = () => {
  if (!newCategoryName.trim()) return;
  const alreadyExists = categories.some(
    (cat) => cat.name.toLowerCase() === newCategoryName.toLowerCase()
  );

  if (alreadyExists) return;
  // createCategoryMutation.mutate({ name: newCategoryName });
};

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

        <Typography sx={{ fontSize: "24px", fontWeight: "bold", color: "#1F2A44", mb: 2 }}>Add Product</Typography>

        {/* Show latest notification */}
        {latestNotification && (
          <Alert severity={latestNotification.type} sx={{ mb: 2 }}>
            {latestNotification.message}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            p: 2,
            minHeight: "100vh",
            alignItems: "flex-start",
            gap: 3,
            mt: -2,
          }}
        >
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
              
              {/* Banner Image Section */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: "#666", fontWeight: 500 }}>
                  Banner Image
                </Typography>
                <Box
                  sx={{
                    border: "1px dashed #ccc",
                    borderRadius: 1,
                    p: 2,
                    textAlign: "center",
                    bgcolor: "#fff",
                    mb: 2,
                  }}
                >
                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={handleBannerChange}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  {bannerPreview ? (
                    <Box sx={{ position: "relative", display: "inline-block" }}>
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        style={{
                          width: "200px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                      <Button
                        onClick={handleRemoveBanner}
                        sx={{
                          position: "absolute",
                          top: -10,
                          right: -10,
                          minWidth: "auto",
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: "error.main",
                          color: "white",
                          "&:hover": { bgcolor: "error.dark" },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        color="primary"
                        sx={{ mb: 1, textTransform: "none" }}
                        onClick={handleBannerUpload}
                        startIcon={<PhotoCameraIcon />}
                      >
                        Upload Banner Image
                      </Button>
                      <Typography variant="body2" color="textSecondary">
                        Recommended size: 800x400px
                      </Typography>
                    </>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Multiple Images Section */}
                <Typography variant="body2" sx={{ mb: 1, color: "#666", fontWeight: 500 }}>
                  Product Images (Max 5)
                </Typography>
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
                    disabled={uploadedFiles.length >= 5}
                  >
                    Add Images
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Or drag and drop files ({uploadedFiles.length}/5)
                  </Typography>
                </Box>
                
                {uploadedFiles.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                      Uploaded Images:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {uploadedFiles.map((file, index) => (
                        <Box key={index} sx={{ position: "relative", display: "inline-block" }}>
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: 1,
                              overflow: "hidden",
                              border: "1px solid #ddd",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: "#f5f5f5",
                            }}
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Box>
                          <Button
                            onClick={() => handleRemoveFile(index)}
                            sx={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              minWidth: "auto",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              bgcolor: "error.main",
                              color: "white",
                              "&:hover": { bgcolor: "error.dark" },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 12 }} />
                          </Button>
                        </Box>
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
                  control={<CustomSwitch checked={inStock} onChange={(e) => setInStock(e.target.checked)} />}
                  label="Product is in stock"
                  sx={{
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
                disabled={addProductMutation.isPending}
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
                onClick={handleSubmit}
                disabled={addProductMutation.isPending}
              >
                {addProductMutation.isPending && (
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
                {addProductMutation.isPending ? "Adding..." : "Add Product"}
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
                    {/*
                      These three states were previously indistinguishable. With
                      no branching at all, a failed fetch rendered exactly the same
                      empty box as a store that genuinely has no categories, which
                      is why the missing route went unnoticed: the page reported
                      "no categories" rather than "the category request 404'd".
                    */}
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
                      <Box
                        key={category._id}
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedCategories.includes(category._id)}
                              onChange={() => handleCategoryChange(category)}
                            />
                          }
                          label=""
                          sx={{ m: 0, mr: -1 }}
                        />
                        <Typography variant="body2">{category.name}</Typography>
                      </Box>
                    ))}
                   {/*  <Button
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
            <Box sx={{ mb: 4 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: "black" }}>
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
                  onKeyPress={handleTagKeyPress}
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
                        // Was `tag === "trend" ? "#f0f0f0" : "#e6e6fa"`, a
                        // special case for one of the hardcoded demo tags.
                        bgcolor: "#e6e6fa",
                        borderRadius: 0,
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* Min Max Orders */}
            <Box>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: "black" }}>
                  Min Max orders
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
                  Add Orders
                </Button>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Enter order limit"
                  value={minMaxInput}
                  onChange={(e) => setMinMaxInput(e.target.value)}
                  onKeyPress={handleMinMaxKeyPress}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {minMaxTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      onDelete={() => handleRemoveMinMaxTag(tag)}
                      deleteIcon={<CloseIcon style={{ fontSize: 14 }} />}
                      sx={{
                        bgcolor: "#f0f8ff",
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
            <Button onClick={handleCreateCategory} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}
