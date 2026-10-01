'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import TableFilter from './TableFilter';

// Example usage of TableFilter component
const TableFilterExample: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // TableFilter's date props are nullable, and its own clear button calls
  // onDateChange(null) - so null is the right empty state here.
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });
  const [location, setLocation] = useState<any>(null);

  const handleReset = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
    setDateFilter(null);
    setDateRange({ startDate: null, endDate: null });
    setLocation(null);
  };

  const handleExport = () => {
  };

  const handleAddNew = () => {
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          color: '#1F2A44',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 'bold',
        }}
      >
        Table Filter Component Example
      </Typography>

      <TableFilter
        // Basic search fields
        search={[
          {
            key: 'search',
            label: 'Search Products',
            placeholder: 'Search by name, SKU...',
            value: searchTerm,
            handleChange: setSearchTerm,
          },
        ]}
        // Static search fields (with search button)
        staticSearch={[
          {
            key: 'sku',
            placeholder: 'Enter SKU',
            onSearch: () => {},
          },
          {
            key: 'barcode',
            placeholder: 'Enter Barcode',
            onSearch: () => {},
          },
        ]}
        // Dropdown filters
        dropDowns={[
          {
            key: 'category',
            placeholder: 'All Categories',
            options: [
              { value: '', label: 'All Categories' },
              { value: 'electronics', label: 'Electronics' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'books', label: 'Books' },
              { value: 'home', label: 'Home & Garden' },
            ],
            value: categoryFilter,
            handleChange: (value) => setCategoryFilter(value?.value || ''),
          },
          {
            key: 'status',
            placeholder: 'All Status',
            options: [
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
            ],
            value: statusFilter,
            handleChange: (value) => setStatusFilter(value?.value || ''),
          },
        ]}
        // Date picker
        datePickers={[
          {
            key: 'createdDate',
            label: 'Created Date',
            dateValue: dateFilter,
            onDateChange: setDateFilter,
          },
        ]}
        // Date range picker
        dateRangePickers={[
          {
            key: 'dateRange',
            label: 'Date Range',
            dateRangeValue: dateRange,
            onDateRangeChange: setDateRange,
          },
        ]}
        // Location search (Google Places)
        searchPlace={{
          label: 'Location',
          value: location,
          onLocationSelect: setLocation,
        }}
        // Action buttons
        buttons={[
          {
            key: 'export',
            label: 'Export',
            onClick: handleExport,
            backgroundColor: '#06A561',
            hoverBackgroundColor: '#059669',
          },
          {
            key: 'addNew',
            label: 'Add New',
            onClick: handleAddNew,
            backgroundColor: '#1976d2',
            hoverBackgroundColor: '#1565c0',
          },
        ]}
        // Reset handler
        onReset={handleReset}
      />

      {/* Display current filter values */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#FFFFFF', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#1F2A44' }}>
          Current Filter Values:
        </Typography>
        <Typography variant="body2" sx={{ color: '#737791' }}>
          Search Term: {searchTerm || 'None'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#737791' }}>
          Category: {categoryFilter || 'None'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#737791' }}>
          Status: {statusFilter || 'None'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#737791' }}>
          Date: {dateFilter || 'None'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#737791' }}>
          Date Range:{' '}
          {dateRange.startDate && dateRange.endDate
            ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
            : 'None'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#737791' }}>
          Location: {location?.formatted_address || 'None'}
        </Typography>
      </Box>
    </Box>
  );
};

export default TableFilterExample;
