'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Grid,
  InputAdornment,
  Modal,
  Button,
  IconButton,
  InputBase,
  FormControl,
  // Select,
  MenuItem,
} from '@mui/material';
import Select from 'react-select';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Image from 'next/image';

// Types
interface SearchField {
  key: string;
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  handleChange?: (value: string) => void;
}

interface StaticSearchField {
  key: string;
  placeholder?: string;
  type?: string;
  onSearch: (value: string) => void;
}

interface DropdownField {
  key: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  value?: any;
  handleChange?: (value: any) => void;
  isMulti?: boolean;
  isHidden?: boolean;
}

interface DatePickerField {
  key: string;
  label?: string;
  /**
   * Nullable, matching onDateChange below - which this component itself calls with
   * `null` when the picker is cleared. `dateValue` was declared `string | undefined`
   * while the setter accepted `string | null`, so no caller could satisfy both: the
   * clear button was typed out of existence.
   */
  dateValue?: string | null;
  onDateChange?: (date: string | null) => void;
}

interface DateRangePickerField {
  key: string;
  label?: string;
  dateRangeValue?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  onDateRangeChange?: (range: any) => void;
}

interface SearchPlaceField {
  label?: string;
  value?: any;
  onLocationSelect?: (location: any) => void;
}

interface ButtonField {
  key: string;
  label: string;
  onClick: () => void;
  color?: string;
  backgroundColor?: string;
  hoverBackgroundColor?: string;
  hoverBorderColor?: string;
}

interface TableFilterProps {
  search?: SearchField[];
  staticSearch?: StaticSearchField[];
  dropDowns?: DropdownField[];
  datePickers?: DatePickerField[];
  dateRangePickers?: DateRangePickerField[];
  searchPlace?: SearchPlaceField;
  buttons?: ButtonField[];
  onReset?: () => void;
}

// Color constants matching project theme
const colors = {
  primary: '#1976d2',
  primaryHover: '#1565c0',
  secondary: '#1F2A44',
  text: '#737791',
  textDark: '#1F2A44',
  border: '#E5E7EB',
  background: '#F9FAFB',
  white: '#FFFFFF',
  success: '#06A561',
  warning: '#FFC327',
  error: '#DC2626',
  info: '#3B82F6',
};

const TableFilter: React.FC<TableFilterProps> = ({
  search = [],
  staticSearch = [],
  dropDowns = [],
  datePickers = [],
  dateRangePickers = [],
  searchPlace = {},
  buttons = [],
  onReset,
}) => {
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState({});
  const [staticSearchValues, setStaticSearchValues] = useState(
    staticSearch.reduce(
      (acc, item) => {
        // StaticSearchField declares no `value` - it is a filter definition, not a
        // saved value. Reading one yielded undefined, so every seeded entry was
        // "" anyway; say so directly.
        acc[item?.key] = '';
        return acc;
      },
      {} as Record<string, string>
    )
  );

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  const commonTextFieldStyles = useMemo(
    () => ({
      height: '40px !important',
      width: '100%',
      fontSize: '13px !important',
      fontFamily: 'Poppins, sans-serif',
      '& .MuiInputLabel-shrink': { fontSize: '16px !important' },
      '& .MuiFormLabel-root': { fontSize: '13px !important' },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: colors.border,
      },
      '& .MuiOutlinedInput-root': {
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.primary,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: colors.primary,
        },
      },
    }),
    []
  );

  // Handle Static Search input change
  const handleStaticSearchChange = useCallback((key: string, value: string) => {
    setStaticSearchValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Handle Static Search icon click
  const handleStaticSearchIconClick = useCallback(
    (item: StaticSearchField) => {
      const searchValue = staticSearchValues[item?.key] || '';
      item?.onSearch(searchValue);
    },
    [staticSearchValues]
  );

  const handleStaticClearIconClick = useCallback((item: StaticSearchField) => {
    setStaticSearchValues((prev) => ({
      ...prev,
      [item?.key]: '',
    }));
    item?.onSearch('');
  }, []);

  // Handle Reset
  const handleReset = useCallback(() => {
    setStaticSearchValues(
      staticSearch.reduce(
        (acc, item) => {
          acc[item?.key] = '';
          return acc;
        },
        {} as Record<string, string>
      )
    );
    onReset?.();
  }, [onReset, staticSearch]);

  // Date Picker Component
  const DatePickerComponent = ({
    value,
    onChange,
    label,
    format = 'DD-MM-YYYY',
    clearable = true,
    onClear,
  }: {
    value: string | null;
    onChange: (date: string | null) => void;
    label: string;
    format?: string;
    clearable?: boolean;
    onClear?: () => void;
  }) => (
    <TextField
      size="small"
      sx={commonTextFieldStyles}
      label={label}
      value={value || ''}
      type="date"
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        endAdornment:
          clearable && value ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onClear}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
      }}
    />
  );

  // Address Autocomplete Component (simplified version)
  const AddressAutocomplete = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: any;
    onChange: (location: any) => void;
  }) => (
    <TextField
      size="small"
      sx={commonTextFieldStyles}
      label={label}
      value={value?.formatted_address || ''}
      onChange={(e) => {
        // In a real implementation, this would integrate with Google Places API
        onChange({ formatted_address: e.target.value });
      }}
      placeholder="Enter location..."
    />
  );

  return (
    <Box sx={{ width: '100%', flexWrap: 'wrap', mb: 2 }}>
      <Grid container spacing={2} columns={12}>
        {/* Google Places Autocomplete */}
        {searchPlace?.label && (
          <Grid size={{ xs: 6, md: 4, lg: 2 }}>
            <AddressAutocomplete
              label={searchPlace?.label}
              value={searchPlace?.value}
              onChange={searchPlace?.onLocationSelect || (() => {})}
            />
          </Grid>
        )}

        {/* Static Search Fields */}
        {staticSearch?.map((item) => (
          <Grid size={{ xs: 5, md: 5, lg: 3 }} key={item?.key}>
            <Box
              sx={{
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                px: 1,
                backgroundColor: colors.white,
                '&:hover': {
                  borderColor: colors.primary,
                },
                '&:focus-within': {
                  borderColor: colors.primary,
                },
              }}
            >
              <InputBase
                sx={{
                  ...commonTextFieldStyles,
                  flex: 1,
                  '& .MuiInputBase-input': {
                    fontSize: '13px',
                    fontFamily: 'Poppins, sans-serif',
                  },
                }}
                type={item?.type || 'text'}
                onChange={(e) =>
                  handleStaticSearchChange(item?.key, e.target.value)
                }
                value={staticSearchValues[item?.key] || ''}
                placeholder={item?.placeholder || ''}
              />
              <IconButton
                onClick={() => handleStaticSearchIconClick(item)}
                size="small"
                sx={{ color: colors.primary }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              {staticSearchValues[item?.key] && (
                <IconButton
                  onClick={() => handleStaticClearIconClick(item)}
                  size="small"
                  sx={{ color: colors.text }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Grid>
        ))}

        {/* Search Inputs */}
        {search?.map((item) => (
          <Grid size={{ xs: 6, md: 4, lg: 2 }} key={item?.key}>
            <TextField
              sx={commonTextFieldStyles}
              size="small"
              type={item?.type || 'text'}
              onChange={(e) => item?.handleChange?.(e.target.value)}
              value={item?.value || ''}
              label={item?.label || 'Search'}
              placeholder={item?.placeholder || ''}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Image
                      src="/magnifier.svg"
                      alt="Search"
                      width={16}
                      height={16}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        ))}

        {/* Dropdown Fields */}
        {dropDowns?.map(
          (item) =>
            !item?.isHidden && (
              <Grid size={{ xs: 6, md: 4, lg: 2 }} key={item?.key}>
                <Select
                  onChange={item?.handleChange}
                  placeholder={item?.placeholder || 'Select'}
                  value={item?.value}
                  options={item?.options || []}
                  isClearable
                  isMulti={item?.isMulti}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      fontSize: '13px',
                      fontFamily: 'Poppins, sans-serif',
                      minHeight: '40px',
                      borderColor: colors.border,
                      '&:hover': {
                        borderColor: colors.primary,
                      },
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: colors.textDark,
                      fontFamily: 'Poppins, sans-serif',
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      color: state.isSelected ? colors.white : colors.textDark,
                      backgroundColor: state.isSelected
                        ? colors.primary
                        : colors.white,
                      fontSize: '12px',
                      fontFamily: 'Poppins, sans-serif',
                      '&:hover': {
                        backgroundColor: state.isSelected
                          ? colors.primary
                          : colors.background,
                      },
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: colors.white,
                      zIndex: 99,
                      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: colors.text,
                      fontFamily: 'Poppins, sans-serif',
                    }),
                  }}
                />
              </Grid>
            )
        )}

        {/* Date Pickers */}
        {datePickers?.map((item) => (
          <Grid size={{ xs: 6, md: 4, lg: 2 }} key={item?.key}>
            <DatePickerComponent
              value={item?.dateValue || null}
              onChange={(date) => item?.onDateChange?.(date)}
              label={item?.label || 'Select Date'}
              format="DD-MM-YYYY"
              clearable={true}
              onClear={() => {
                item?.onDateChange?.(null);
              }}
            />
          </Grid>
        ))}

        {/* Date Range Picker */}
        {dateRangePickers?.map((dateRangePicker, index) => (
          <Grid size={{ xs: 6, md: 4, lg: 3 }} key={index}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                sx={{ ...commonTextFieldStyles, flex: 1 }}
                label="Start Date"
                type="date"
                value={
                  dateRangePicker?.dateRangeValue?.startDate
                    ? new Date(dateRangePicker.dateRangeValue.startDate)
                        .toISOString()
                        .split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const startDate = e.target.value
                    ? new Date(e.target.value)
                    : null;
                  const endDate = dateRangePicker?.dateRangeValue?.endDate;
                  dateRangePicker?.onDateRangeChange?.({
                    startDate,
                    endDate,
                  });
                }}
              />
              <TextField
                size="small"
                sx={{ ...commonTextFieldStyles, flex: 1 }}
                label="End Date"
                type="date"
                value={
                  dateRangePicker?.dateRangeValue?.endDate
                    ? new Date(dateRangePicker.dateRangeValue.endDate)
                        .toISOString()
                        .split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const endDate = e.target.value
                    ? new Date(e.target.value)
                    : null;
                  const startDate = dateRangePicker?.dateRangeValue?.startDate;
                  dateRangePicker?.onDateRangeChange?.({
                    startDate,
                    endDate,
                  });
                }}
              />
            </Box>
          </Grid>
        ))}

        {/* Reset Button */}
        <Grid size={{ xs: 4, md: 3, lg: 1 }}>
          <Button
            variant="outlined"
            sx={{
              border: `2px solid ${colors.primary}`,
              color: colors.white,
              backgroundColor: colors.primary,
              lineHeight: 1,
              fontSize: '12px',
              height: '100%',
              maxHeight: 40,
              padding: '0px 10px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: colors.primaryHover,
                border: `2px solid ${colors.primaryHover}`,
              },
            }}
            onClick={handleReset}
          >
            Reset filter
          </Button>
        </Grid>

        {buttons?.map((button) => (
          <Grid size={{ xs: 4, md: 3, lg: 2 }} key={button?.key}>
            <Button
              variant="outlined"
              onClick={button?.onClick}
              sx={{
                color: button?.color || colors.white,
                backgroundColor: button?.backgroundColor || colors.primary,
                border: `2px solid ${button?.backgroundColor || colors.primary}`,
                fontSize: '12px',
                height: '100%',
                maxHeight: 40,
                padding: '0px 10px',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor:
                    button?.hoverBackgroundColor || colors.primaryHover,
                  border: `2px solid ${button?.hoverBorderColor || colors.primaryHover}`,
                },
              }}
            >
              {button?.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TableFilter;
