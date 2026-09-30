"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Box, Typography, Button, TextField, InputAdornment, Alert } from "@mui/material"
import Image from "next/image"
import { TableComponent, ConfirmationDialog } from "../../../../components/TableComponent"
import { useRouter } from "next/navigation"
import { useProducts, useDeleteProduct } from "@/api/handlers"
import { useUIStore } from "@/store/uiStore"
import SearchIcon from "@mui/icons-material/Search"
import ClearIcon from "@mui/icons-material/Clear"

// Define the base TableRowData interface that matches what TableComponent expects
interface TableRowData {
  id: string
  [key: string]: string | number | boolean | null | undefined | React.ReactNode
}

// ProductRow extends TableRowData and includes the index signature
interface ProductRow extends TableRowData {
  product: string
  inventory: string
  category: string
  price: string
  rating: string
}

export default function DeleteProductPage() {
  const [openDialog, setOpenDialog] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [productRows, setProductRows] = useState<ProductRow[]>([])
  const [deleteCount, setDeleteCount] = useState(0)

  const router = useRouter()
  const { notifications, addNotification } = useUIStore()

  // API hooks
  const { data: productsData, isLoading, error } = useProducts({ page, limit: 10, search })
  const deleteProductMutation = useDeleteProduct()

  const columns = [
    { id: "product", label: "Product", width: "30%" },
    { id: "inventory", label: "Inventory", width: "20%" },
    { id: "category", label: "Category", width: "20%" },
    { id: "price", label: "Price", width: "15%" },
    { id: "rating", label: "Stock Status", width: "10%" },
  ]

  // Transform API data to table format
  useEffect(() => {
    if (productsData?.products) {
      const transformedData: ProductRow[] = productsData.products.map((product) => {
        const productId = product.id || product._id
        return {
          id: productId,
          product: product.name,
          // Two defects, identical to inventory/update/List.tsx: a random
          // inventory number that changed every render and corresponded to no
          // record (Product has an inStock boolean, no quantity), and the
          // populated category object dumped straight into a cell, which
          // rendered as the string "[object Object]".
          inventory: product.inStock ? "In Stock" : "Out of Stock",
          category: product.category?.name ?? "Uncategorized",
          price: `$${product.price.toFixed(2)}`,
          rating: product.inStock ? "In Stock" : "Out of Stock",
        }
      })
      setProductRows(transformedData)
    }
  }, [productsData])

  const handleDeleteConfirm = async () => {
    setOpenDialog(false)
    const productsToDelete = [...selectedProducts]
    const countToDelete = deleteCount

    try {
      addNotification({
        type: "info",
        message: `Deleting ${countToDelete} product${countToDelete > 1 ? "s" : ""}...`,
      })

      for (const productId of productsToDelete) {
        await deleteProductMutation.mutateAsync({ productId })
      }

      setSelectedProducts([])

      addNotification({
        type: "success",
        message: `Successfully deleted ${countToDelete} product${countToDelete > 1 ? "s" : ""}!`,
      })
    } catch (error) {
      console.error("Delete failed:", error)
      addNotification({
        type: "error",
        message: "Failed to delete products. Please try again.",
      })
    }
  }

  const handleSearchClear = () => {
    setSearch("")
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const latestNotification = notifications[notifications.length - 1]

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, mt: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => router.back()}>
          <Image src="/placeholder.svg?height=13&width=13" alt="Back" width={13} height={13} />
          <Typography sx={{ ml: 1, color: "#737791", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
            Back
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{ fontSize: "24px", fontWeight: "bold", color: "#1F2A44", mb: 2, fontFamily: "Poppins, sans-serif" }}
      >
        Delete Product 
      </Typography>

      {latestNotification && (
        <Alert severity={latestNotification.type} sx={{ mb: 2 }}>
          {latestNotification.message}
        </Alert>
      )}

      <Box
        sx={{
          mb: 3,
          backgroundColor: "#fff",
          p: 2,
          borderRadius: 1,
          border: "1px solid #e0e0e0",
        }}
      >
        <TextField
          fullWidth
          placeholder="Search products to delete..."
          value={search}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "rgba(16, 63, 90, 1)" }} />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <ClearIcon sx={{ color: "rgba(16, 63, 90, 1)", cursor: "pointer" }} onClick={handleSearchClear} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontFamily: "Poppins, sans-serif",
            },
          }}
        />
      </Box>

      {selectedProducts.length > 0 && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography sx={{ fontFamily: "Poppins, sans-serif", color: "#1F2A44" }}>
            {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} selected for deletion
          </Typography>
        </Box>
      )}

      {isLoading && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography sx={{ fontFamily: "Poppins, sans-serif" }}>Loading products...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load products. Please try again.
        </Alert>
      )}

      {!isLoading && !error && (
        <>
          <TableComponent
            columns={columns}
            data={productRows}
            totalResults={productsData?.pagination?.total || 0}
            currentPage={page}
            onPageChange={setPage}
            showCheckboxes={true}
            selected={selectedProducts}
            onSelectionChange={setSelectedProducts}
            actionButtons={
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 4, width: "100%" }}>
                <Button
                  onClick={() => router.back()}
                  sx={{
                    fontSize: "14px",
                    color: "rgba(21, 27, 38, 1)",
                    fontWeight: 600,
                    textTransform: "none",
                    fontFamily: "Poppins, sans-serif",
                    width: "15vw",
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setDeleteCount(selectedProducts.length)
                    setOpenDialog(true)
                  }}
                  disabled={selectedProducts.length === 0 || deleteProductMutation.isPending}
                  sx={{
                    backgroundColor: selectedProducts.length === 0 ? "#ccc" : "rgba(246, 57, 24, 1)",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    px: 3,
                    py: 1,
                    borderRadius: "16px",
                    textTransform: "none",
                    width: "15vw",
                    "&:hover": {
                      backgroundColor: selectedProducts.length === 0 ? "#ccc" : "#E55050",
                    },
                    "&:disabled": {
                      backgroundColor: "#ccc",
                      color: "#666",
                    },
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {deleteProductMutation.isPending
                    ? "Deleting..."
                    : `Delete${selectedProducts.length > 0 ? ` (${selectedProducts.length})` : ""}`}
                </Button>
              </Box>
            }
          />
        </>
      )}

      <ConfirmationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Products"
        content={`Are you sure you want to delete ${deleteCount} selected product${
          deleteCount > 1 ? "s" : ""
        }? This action cannot be undone.`}
      />
    </Box>
  )
}
