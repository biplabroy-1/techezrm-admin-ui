"use client"

import { useMemo, useState } from "react"
import { Box, Typography, Tabs, Tab } from "@mui/material"
import { styled } from "@mui/material/styles"
import { useRouter } from "next/navigation"
import { TableComponent, type TableRowData } from "../../../../components/TableComponent"
import { useOrders } from "@/api/handlers/ordersHandler"

const StyledTab = styled(Tab)(() => ({
  textTransform: "none",
  fontWeight: 600,
  fontSize: "14px",
  minWidth: "auto",
  padding: "12px 16px",
  marginRight: "8px",
  color: "#000",
  "&.Mui-selected": { color: "#000" },
}))

const StyledTabs = styled(Tabs)(() => ({
  "& .MuiTabs-indicator": { backgroundColor: "#1976d2", height: "3px" },
  marginBottom: "0px",
}))

interface PaymentRowData extends TableRowData {
  invoiceId: string
  date: string
  customerName: string
  email: string
  phoneNumber: string
  amount: string
  method: string
  status: string
  orderDetails: string
}

/**
 * The real payment statuses on the CustomerOrder model:
 *   ["pending", "processing", "completed", "failed", "refunded"]
 *
 * The two tabs group them the way the screens are labelled. "Pending" is
 * everything not yet settled; "Completed" is money that has landed, plus refunds
 * which are also a settled outcome. Filtering happens on the server, so the
 * counts and the rows can never disagree.
 */
const PENDING_STATUSES = ["pending", "processing", "failed"]
const COMPLETED_STATUSES = ["completed", "refunded"]

const TAB_STATUSES: Record<number, string[]> = {
  0: PENDING_STATUSES,
  1: COMPLETED_STATUSES,
}

function formatCurrency(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return "-"
  return `₹${n.toFixed(2)}`
}

function formatDate(value: unknown): string {
  if (!value) return "-"
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function titleCase(value: unknown): string {
  const s = String(value ?? "").replace(/_/g, " ").trim()
  if (!s) return "-"
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Payment list.
 *
 * This rendered two hardcoded arrays of invented rows - "John Smith /
 * john@example.com / 987654321", "Sarah Johnson", "Robin Rosh", invoice
 * "#789012" - with no API call of any kind, and paginated them client-side by
 * slicing the array. Roughly 25 fabricated payments, reachable from the admin nav.
 *
 * It now reads GET /private/customer-orders, which is the real payment record
 * (CustomerOrder.paymentStatus / paymentMethod / totalAmount, with the customer
 * populated). Pagination is server-side, so the tab totals reflect what actually
 * exists rather than the length of a fixture.
 */
export default function Payments() {
  const router = useRouter()
  const [tabValue, setTabValue] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [method, setMethod] = useState("")

  const paymentStatuses = TAB_STATUSES[tabValue] ?? PENDING_STATUSES
  const isCompletedTab = tabValue === 1

  const { data, isLoading, isError, error } = useOrders({
    page,
    limit: 9,
    paymentStatus: paymentStatuses,
  })

  const orders = useMemo(() => data?.orders ?? [], [data])

  // Filtering happens client-side only for the two things the list endpoint does
  // not cover (free-text and payment method). Status is filtered server-side.
  const rows: PaymentRowData[] = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return orders
      .filter((o) => (method ? o.paymentMethod === method : true))
      .filter((o) => {
        if (!needle) return true
        const c: any = o.customer
        const haystack = [
          o.uniqueId,
          o.paymentStatus,
          o.paymentMethod,
          c?.name,
          c?.email,
          c?.phone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return haystack.includes(needle)
      })
      .map((o) => {
        const c: any = o.customer
        const items = o.items ?? []
        const itemNames = items
          .map((i: any) => {
            const p = i.product
            if (!p) return null
            return typeof p === "string" ? null : p.name
          })
          .filter(Boolean)
        return {
          id: String(o._id),
          invoiceId: o.uniqueId ?? "-",
          date: formatDate(o.createdAt),
          // The customer is a populated Customer document, which carries
          // name/email/phone. Guard anyway: a deleted customer leaves the raw id.
          customerName: (c && typeof c === "object" ? c.name : null) ?? "Unknown customer",
          email: (c && typeof c === "object" ? c.email : null) ?? "-",
          phoneNumber: (c && typeof c === "object" ? c.phone : null) ?? "-",
          amount: formatCurrency(o.totalAmount),
          method: titleCase(o.paymentMethod),
          status: titleCase(o.paymentStatus),
          orderDetails: itemNames.length
            ? itemNames.join(", ")
            : `${items.length} item${items.length === 1 ? "" : "s"}`,
        }
      })
  }, [orders, search, method])

  const columns = [
    { id: "invoiceId", label: "Invoice ID", width: "11%" },
    { id: "date", label: "Date", width: "14%" },
    { id: "customerName", label: "Customer", width: "14%" },
    { id: "email", label: "Email", width: "16%" },
    { id: "phoneNumber", label: "Phone", width: "12%" },
    { id: "orderDetails", label: "Order", width: "12%" },
    { id: "method", label: "Method", width: "10%" },
    { id: "status", label: "Status", width: "9%" },
    { id: "amount", label: "Amount", width: "10%", align: "right" as const },
  ]

  const handleRowClick = (row: TableRowData) => {
    const target = isCompletedTab ? "completed" : "pending"
    router.push(`/admin/payments/payment/detail/${target}/${row.id}`)
  }

  const handleTabChange = (_: unknown, next: number) => {
    setTabValue(next)
    setPage(1) // a page that exists on one tab need not exist on the other
  }

  const totalResults = data?.total ?? 0

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Payments
      </Typography>

      <StyledTabs value={tabValue} onChange={handleTabChange}>
        <StyledTab label="Pending Payments" />
        <StyledTab label="Completed Payments" />
      </StyledTabs>

      {isLoading ? (
        <Typography sx={{ mt: 3 }}>Loading payments…</Typography>
      ) : isError ? (
        <Typography color="error" sx={{ mt: 3 }}>
          Could not load payments: {(error as any)?.message ?? "Unknown error"}
        </Typography>
      ) : (
        <TableComponent
          columns={columns}
          data={rows}
          totalResults={totalResults}
          currentPage={page}
          onPageChange={setPage}
          onRowClick={handleRowClick}
          showCheckboxes={false}
          showHeader={true}
          rowsPerPage={9}
          searchOptions={{
            value: search,
            onChange: (v: string) => {
              setSearch(v)
              setPage(1)
            },
            placeholder: "Search invoice, customer or email",
          }}
          filterOptions={{
            value: method,
            onChange: (v: string) => {
              setMethod(v)
              setPage(1)
            },
            options: [
              { value: "", label: "All Methods" },
              { value: "credit_card", label: "Credit Card" },
              { value: "debit_card", label: "Debit Card" },
              { value: "upi", label: "UPI" },
              { value: "net_banking", label: "Net Banking" },
              { value: "cod", label: "Cash on Delivery" },
            ],
          }}
        />
      )}
    </Box>
  )
}
