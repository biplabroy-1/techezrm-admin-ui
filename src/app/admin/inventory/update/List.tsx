"use client"
import type React from "react"
import { useState } from "react"
import { Box, Typography, Alert, CircularProgress } from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { TableComponent } from "../../../../components/TableComponent"
import { useProducts } from "@/api/handlers"

// Define the base TableRowData interface that matches what TableComponent expects
interface TableRowData {
  id: string
  [key: string]: string | number | boolean | null | undefined | React.ReactNode
}

// ProductRowData extends TableRowData
interface ProductRowData extends TableRowData {
  name: string
  description: string
  inventory: string
  category: string
  price: string
  rating: string
}

export default function UpdateList() {
  const router = useRouter()
  const [filter, setFilter] = useState("")
  const [page, setPage] = useState(1)
 

  // Build query parameters based on filter type
  const queryParams = {
    page,
    limit: 9, // Match your rowsPerPage
  }

  // Fetch products with current filters
  const { data: productsData, isLoading, error, isFetching } = useProducts(queryParams)

  // Transform API data to table format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processRowData = (product: any): ProductRowData => ({
    id: product.id || product._id,
    name: `${product.name}`, // Combine name and description
    description: product.description,
    // Product.inStock is a boolean; there is no quantity on the model, so the
    // old `${Math.floor(Math.random() * 100)} in stock` invented a number that
    // changed on every render and that no record supported.
    inventory: product.inStock ? "In Stock" : "Out of Stock",
    // Was `loreal: product.category` - a leftover field name from a template
    // that also passed the whole populated category OBJECT into a table cell,
    // so it rendered as the string "[object Object]".
    category: product.category?.name ?? "Uncategorized",
    price: `$${product.price.toFixed(2)}`,
    // Real average from published reviews, aggregated server-side. This was a
    // literal "5.0 (32 Votes)" / "4.5 (12 Votes)" chosen by whether the product
    // happened to be in stock - the two columns were inversely related fictions.
    rating:
      product.ratingCount > 0
        ? `${product.rating.toFixed(1)} (${product.ratingCount} vote${product.ratingCount === 1 ? "" : "s"})`
        : "No reviews",
  })

  const tableData: ProductRowData[] = productsData?.products?.map(processRowData) || []

  const columns = [
    { id: "name", label: "Product", width: "25%" },
    { id: "inventory", label: "Inventory", width: "20%" },
    { id: "category", label: "Category", width: "20%" },
    { id: "price", label: "Price", width: "15%" },
    { id: "rating", label: "Rating", width: "15%" },
  ]

  const filterOptions = {
    value: filter,
    onChange: setFilter,
    options: [
      { value: "", label: "All Products" },
      { value: "Product Name", label: "Product Name" },
      { value: "Category", label: "Category" },
    ],
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleRowClick = (row: TableRowData) => {
    const productRow = row as ProductRowData

    // Find the original product data to get all fields
    const originalProduct = productsData?.products?.find((p) => (p.id || p._id) === productRow.id)

    if (originalProduct) {
      const query = new URLSearchParams({
        id: productRow.id,
        name: originalProduct.name,
        description: originalProduct.description,
        inventory: productRow.inventory,
        category: originalProduct.category?._id,
        price: originalProduct.price.toString(),
        inStock: originalProduct.inStock.toString(),
      }).toString()

      router.push(`/admin/inventory/update/detail?${query}`)
    }
  }


  return (
    <Box sx={{ p: 1, backgroundColor: "#F9FAFB", minHeight: "85vh", fontFamily: "Poppins, sans-serif" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => router.back()}>
          <Image src="/backArrow.png" alt="Back" width={13} height={13} />
          <Typography sx={{ ml: 1, color: "#737791", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
            Back
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{ fontSize: "24px", fontWeight: "bold", color: "#1F2A44", mb: 2, fontFamily: "Poppins, sans-serif" }}
      >
        Update Product
      </Typography>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load products. Please try again.
        </Alert>
      )}

      {/* Results Summary */}
      {productsData && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: "14px", color: "#737791", fontFamily: "Poppins, sans-serif" }}>
            Showing {tableData.length} of {productsData.total} products
            {isFetching && " (Loading...)"}
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && tableData.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ fontSize: "16px", color: "#737791", fontFamily: "Poppins, sans-serif" }}>
           
          </Typography>
        </Box>
      )}

      {/* Table Component */}
      {!isLoading && !error && tableData.length > 0 && (
        <TableComponent
          columns={columns}
          data={tableData}
          totalResults={productsData?.pagination?.total || 0}
          currentPage={page}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          filterOptions={filterOptions}
          showCheckboxes={true}
          showHeader={true}
          rowsPerPage={9}
        />
      )}
    </Box>
  )
}
