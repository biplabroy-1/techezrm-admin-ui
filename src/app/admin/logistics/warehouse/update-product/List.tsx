'use client';

import React, { useMemo, useState } from "react"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { TableComponent, TableRowData } from "../../../../../components/TableComponent"
import { warehouseStockService } from "@/api/services/warehouseStock"

// ProductRowData extends TableRowData
interface ProductRowData extends TableRowData {
  name: string
  inventory: string
  category: string
  price: string
  quality: string
}

/**
 * Warehouse stock list.
 *
 * This page previously rendered ten hardcoded rows - `description: "loreal
 * ipsum"`, `loreal: "Black"` - with no API call whatsoever, and started on page 2
 * for no reason. It is linked from the admin nav, so it showed fabricated stock
 * to anyone who opened it.
 *
 * It now reads GET /private/warehouse-stock, the same data the transfer
 * endpoints operate on. The `loreal` column, another template leftover, is gone;
 * it was rendering the literal strings "Black"/"White" from the old fixture.
 */
export default function UpdateList() {
  const router = useRouter()
  const [filter, setFilter] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ["warehouseStock", page],
    queryFn: () => warehouseStockService.getWarehouseStock({ page, limit: 9 }),
  })

  // Verified shape: { success, data: WarehouseStock[], page, limit, total, totalPages }.
  const rows: any[] = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data])

  const tableData: ProductRowData[] = rows.map((s: any) => {
    const p = s.productId ?? s.product
    const name = typeof p === "object" && p ? p.name : p?.name ?? "Unknown product"
    const total = s.quantityTotal ?? 0
    const reserved = s.quantityReserved ?? 0
    return {
      id: s._id ?? s.id,
      name: String(name ?? "Unknown product"),
      // Real figures from the record. Previously this column read
      // `${Math.floor(Math.random() * 100)} in stock` on the sibling inventory
      // page, and here it read a hardcoded "In Stock"/"Out of Stock".
      inventory: `${total - reserved} available (${total} total)`,
      category: typeof p === "object" && p?.category ? String(p.category.name ?? "") : "-",
      price: p && typeof p === "object" && p.price != null ? `$${Number(p.price).toFixed(2)}` : "-",
      quality: s.qcPassed === false ? "QC failed" : s.qcPassed === true ? "QC passed" : "-",
    }
  })

  const columns = [
    { id: "name", label: "Product", width: "30%" },
    { id: "inventory", label: "Inventory", width: "25%" },
    { id: "category", label: "Category", width: "20%" },
    { id: "quality", label: "Quality", width: "15%" },
    { id: "price", label: "Price", width: "10%" },
  ]

  const filterOptions = {
    value: filter,
    onChange: (e: { target: { value: string } }) => setFilter(e.target.value),
    options: [
      { value: "", label: "All Quality" },
      { value: "QC passed", label: "QC passed" },
      { value: "QC failed", label: "QC failed" },
    ],
  }

  // TableRowData, not ProductRowData: onRowClick is typed (row: TableRowData)
  // => void, and a handler taking the narrower type is not assignable.
  const handleRowClick = (row: TableRowData) => {
    router.push(
      `/admin/logistics/warehouse/update-product/detail?id=${row.id}&name=${encodeURIComponent(String(row.name))}&inventory=${encodeURIComponent(String(row.inventory ?? ""))}`
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Warehouse Stock
      </Typography>

      {isLoading ? (
        <Typography>Loading stock...</Typography>
      ) : error ? (
        <Typography color="error">
          Could not load warehouse stock: {(error as any)?.message || "Unknown error"}
        </Typography>
      ) : (
        <TableComponent
          columns={columns}
          data={tableData}
          totalResults={data?.total ?? tableData.length}
          currentPage={page}
          onPageChange={setPage}
          onRowClick={handleRowClick}
          showCheckboxes={false}
          showHeader={true}
          rowsPerPage={9}
          searchOptions={{
            value: filter,
            onChange: setFilter,
            placeholder: "Search stock...",
          }}
          filterOptions={filterOptions as any}
        />
      )}
    </Box>
  )
}
