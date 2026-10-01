'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Grid,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Close as CloseIcon,
  Image as ImageIcon,
  Info as InfoIcon,
  ViewList as VariantsIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/api/services/products';
import { productVariantService } from '@/api/services/productVariants';
import Image from 'next/image';

interface ProductDetailsModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `product-tab-${index}`,
    'aria-controls': `product-tabpanel-${index}`,
  };
}

export default function ProductDetailsModal({
  open,
  onClose,
  productId,
}: ProductDetailsModalProps) {
  const [tabValue, setTabValue] = useState(0);

  // Fetch product details
  const {
    data: productData,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: open && !!productId,
  });

  // Fetch product variants
  const {
    data: variantsData,
    isLoading: variantsLoading,
    error: variantsError,
  } = useQuery({
    queryKey: ['productVariants', productId],
    queryFn: () => productVariantService.getVariantsByProductId(productId),
    enabled: open && !!productId,
  });

  const product = productData?.data;
  const variants = variantsData?.data || [];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleClose = () => {
    setTabValue(0);
    onClose();
  };

  const renderBasicDetails = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
            >
              Product Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontWeight: 600 }}
                >
                  Product Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {product?.name || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontWeight: 600 }}
                >
                  Unique ID
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 500, color: '#1976d2' }}
                >
                  {product?.uniqueId || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontWeight: 600 }}
                >
                  Description
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {product?.description || 'No description available'}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontWeight: 600 }}
                >
                  Price
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', color: '#2e7d32' }}
                >
                  ${product?.price || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
            >
              Product Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontWeight: 600 }}
                >
                  Category
                </Typography>
                <Chip
                  label={product?.category?.name || 'Uncategorized'}
                  color="primary"
                  variant="outlined"
                  icon={<CategoryIcon />}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontWeight: 600 }}
                >
                  Unit
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {product?.unit || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontWeight: 600 }}
                >
                  Minimum Order Quantity (MOQ)
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {product?.moq || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontWeight: 600 }}
                >
                  Appearance
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {product?.appearance || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
            >
              Status & Stock Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Status
                  </Typography>
                  <Chip
                    label={product?.status || 'Unknown'}
                    color={product?.status === 'active' ? 'success' : 'default'}
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Stock Status
                  </Typography>
                  <Chip
                    label={product?.inStock ? 'In Stock' : 'Out of Stock'}
                    color={product?.inStock ? 'success' : 'error'}
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Created Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {product?.createdAt
                      ? new Date(product.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )
                      : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Last Updated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {product?.updatedAt
                      ? new Date(product.updatedAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )
                      : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {product?.tags && product.tags.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
              >
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {product.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    variant="outlined"
                    color="primary"
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderImages = () => (
    <Grid container spacing={3}>
      {/* Banner Image */}
      {product?.bannerImage && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
              >
                Banner Image
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 300,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={product.bannerImage}
                  alt="Banner"
                  width={600}
                  height={300}
                  style={{
                    objectFit: 'contain',
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Product Images */}
      {product?.images && product.images.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
              >
                Product Images ({product.images.length})
              </Typography>
              <Grid container spacing={2}>
                {product.images.map((image, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: 200,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      <Image
                        src={image}
                        alt={`Product ${index + 1}`}
                        fill
                        style={{
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      {!product?.bannerImage &&
        (!product?.images || product.images.length === 0) && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 6,
                    color: '#999',
                  }}
                >
                  <ImageIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    No Images Available
                  </Typography>
                  <Typography variant="body2">
                    This product doesn't have any images uploaded yet.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
    </Grid>
  );

  const renderVariants = () => (
    <Box>
      <Typography
        variant="h6"
        sx={{ mb: 3, fontWeight: 'bold', color: '#1F2A44' }}
      >
        Product Variants ({variants.length})
      </Typography>

      {variantsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : variantsError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load product variants.
        </Alert>
      ) : variants.length === 0 ? (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 4,
                color: '#999',
              }}
            >
              <VariantsIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No Variants Found
              </Typography>
              <Typography variant="body2">
                This product doesn't have any variants yet.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                >
                  Variant ID
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                >
                  Price
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                >
                  Unit
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                >
                  Unit Size
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}
                >
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant._id} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: '#1976d2' }}
                    >
                      {variant.uniqueId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: '#2e7d32' }}
                    >
                      ${variant.price}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">{variant.unit}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">{variant.unitSize}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={variant.isActive ? 'Active' : 'Inactive'}
                      color={variant.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {variant.createdAt
                        ? new Date(variant.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );

  const renderOtherDetails = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
            >
              System Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontWeight: 600 }}
                  >
                    Product ID
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 500, fontFamily: 'monospace' }}
                  >
                    {/* The human-facing identifier (EZ-PI-00001), not the
                        Mongo ObjectId. The modal already used uniqueId
                        elsewhere (the header and the variant table), so showing
                        the raw _id here was inconsistent as well as ugly - and
                        the _id is what customers end up quoting in support
                        threads. */}
                    {product?.uniqueId || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontWeight: 600 }}
                  >
                    Sequence Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {product?.seq || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {product?.dietaryAttributes && product.dietaryAttributes.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 'bold', color: '#1F2A44' }}
              >
                Dietary Attributes
              </Typography>
              <Grid container spacing={2}>
                {product.dietaryAttributes.map((attr, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          {attr.title}
                        </Typography>
                        {attr.logo && (
                          <Box sx={{ mb: 1 }}>
                            <Image
                              src={attr.logo}
                              alt={attr.title}
                              width={40}
                              height={40}
                              style={{ objectFit: 'contain' }}
                            />
                          </Box>
                        )}
                        {attr.certificateLink && (
                          <Typography variant="caption" color="primary">
                            <a
                              href={attr.certificateLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Certificate
                            </a>
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', color: '#1F2A44' }}
          >
            Product Details
          </Typography>
          {product && (
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              {product.name} - {product.uniqueId}
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {productLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : productError ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              Failed to load product details. Please try again.
            </Alert>
          </Box>
        ) : product ? (
          <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="product details tabs"
              >
                <Tab
                  label="Basic Details"
                  icon={<InfoIcon />}
                  iconPosition="start"
                  {...a11yProps(0)}
                />
                <Tab
                  label="Images"
                  icon={<ImageIcon />}
                  iconPosition="start"
                  {...a11yProps(1)}
                />
                <Tab
                  label="Variants"
                  icon={<VariantsIcon />}
                  iconPosition="start"
                  {...a11yProps(2)}
                />
                <Tab
                  label="Other Details"
                  icon={<CategoryIcon />}
                  iconPosition="start"
                  {...a11yProps(3)}
                />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {renderBasicDetails()}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderImages()}
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              {renderVariants()}
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              {renderOtherDetails()}
            </TabPanel>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
