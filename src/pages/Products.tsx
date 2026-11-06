import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  X, 
  Box
} from 'lucide-react';
import { api } from '../api/services';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { buildVariantMatrix, buildVariantSku, normalizeVariantOptions } from '../utils/catalog/variantMatrix';
import { formatProductSpecifications, formatSizeChart, parseProductSpecifications, parseSizeChart } from '../utils/catalog/productMetadata';
import { BarcodePreview } from '../components/catalog/BarcodePreview';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import './Products.css';

const formatCurrency = (minor: number) => {
  return '₹' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const ProductsPage: React.FC = () => {
  type VariantDraft = { id?: string; sku: string; barcode: string; cost: string; weightGrams: string; optionValues: Record<string, string>; price: string; compareAt: string; initialStock?: string };
  type MetafieldDraft = { namespace: string; key: string; value: string; type: string };
  const location = useLocation();
  const navigate = useNavigate();
  const isDedicatedProductEditor = location.pathname === '/products/new';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // New product form
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPerItem, setCostPerItem] = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [requiresShipping, setRequiresShipping] = useState(true);
  const [isTaxable, setIsTaxable] = useState(true);
  const [trackInventory, setTrackInventory] = useState(true);
  const [continueSellingWhenOutOfStock, setContinueSellingWhenOutOfStock] = useState(false);
  const [inventoryLocationId, setInventoryLocationId] = useState('');
  const [productType, setProductType] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [productMetafields, setProductMetafields] = useState<MetafieldDraft[]>([]);
  const [categoryMetafields, setCategoryMetafields] = useState<MetafieldDraft[]>([]);
  const [shippingLength, setShippingLength] = useState('');
  const [shippingWidth, setShippingWidth] = useState('');
  const [shippingHeight, setShippingHeight] = useState('');
  const [dimensionUnit, setDimensionUnit] = useState('cm');
  const [shippingPackageId, setShippingPackageId] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('IN');
  const [hsCode, setHsCode] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [description, setDescription] = useState('');
  const [keyFeaturesText, setKeyFeaturesText] = useState('');
  const [specificationsText, setSpecificationsText] = useState('');
  const [sizeChartText, setSizeChartText] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [sellingUnit, setSellingUnit] = useState('pcs');
  const [minimumQuantity, setMinimumQuantity] = useState('1');
  const [quantityStep, setQuantityStep] = useState('1');
  const [comparePrice, setComparePrice] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [variantOptions, setVariantOptions] = useState<{ name: string; values: string }[]>([]);
  const [visibility, setVisibility] = useState('ACTIVE');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([]);
  const [newVariantOverrides, setNewVariantOverrides] = useState<Record<string, Partial<VariantDraft>>>({});
  const descriptionEditorRef = useRef<HTMLDivElement>(null);

  const createVariantMatrix = useMemo(() => {
    try { return buildVariantMatrix(variantOptions); }
    catch { return []; }
  }, [variantOptions]);
  const filteredProducts = useMemo(() => statusFilter === 'ALL'
    ? products
    : products.filter((product) => String(product.status || '').toUpperCase() === statusFilter), [products, statusFilter]);
  const productStatusCount = (status: 'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED') => status === 'ALL'
    ? products.length
    : products.filter((product) => String(product.status || '').toUpperCase() === status).length;
  const variantKey = (optionValues: Record<string, string>) => Object.entries(optionValues)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join('|') || '__default__';
  const getNewVariantDraft = (combination: { optionValues: Record<string, string>; skuSuffix: string }, variantCount: number): VariantDraft => ({
    sku: buildVariantSku(sku || name, combination, variantCount),
    barcode: variantCount === 1 ? barcode : '',
    cost: costPerItem,
    weightGrams,
    optionValues: combination.optionValues,
    price,
    compareAt: comparePrice,
    initialStock,
    ...newVariantOverrides[variantKey(combination.optionValues)],
  });
  const updateNewVariant = (optionValues: Record<string, string>, patch: Partial<VariantDraft>) => {
    const key = variantKey(optionValues);
    setNewVariantOverrides((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const prodRes = await api.getProducts({ search: search || undefined });
      setProducts(prodRes.products || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load products.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductOptions = async () => {
    const [categoryResult, unitResult, warehouseResult] = await Promise.allSettled([api.getCategories(), api.getSellingUnits(), api.getWarehouses()]);
    if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value.categories || []);
    if (unitResult.status === 'fulfilled') setUnits((unitResult.value.units || []).filter((unit: any) => unit.is_enabled));
    if (warehouseResult.status === 'fulfilled') {
      const availableWarehouses = warehouseResult.value.warehouses || [];
      setWarehouses(availableWarehouses);
      setInventoryLocationId((current) => current || availableWarehouses.find((warehouse: any) => warehouse.is_default)?.id || availableWarehouses[0]?.id || '');
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null); setName(''); setBrand(''); setPrice(''); setInitialStock('0'); setDescription(''); setSku(''); setBarcode(''); setCostPerItem(''); setWeightGrams(''); setRequiresShipping(true); setKeyFeaturesText(''); setSpecificationsText(''); setSizeChartText(''); setCategoryIds([]);
    setIsTaxable(true); setTrackInventory(true); setContinueSellingWhenOutOfStock(false); setProductType(''); setSeoTitle(''); setSeoDescription(''); setTagsText(''); setProductMetafields([]); setCategoryMetafields([]);
    setShippingLength(''); setShippingWidth(''); setShippingHeight(''); setDimensionUnit('cm'); setShippingPackageId(''); setCountryOfOrigin('IN'); setHsCode(''); setInventoryLocationId((current) => current || warehouses.find((warehouse: any) => warehouse.is_default)?.id || warehouses[0]?.id || '');
    setSellingUnit('pcs'); setMinimumQuantity('1'); setQuantityStep('1'); setComparePrice('');
    setImageUrls(''); setVariantOptions([]); setVisibility('ACTIVE'); setVariantDrafts([]); setNewVariantOverrides({}); setIsDirty(false);
  };

  const openProduct = (product?: any) => {
    if (!product && !isDedicatedProductEditor) {
      navigate('/products/new');
      return;
    }
    void loadProductOptions();
    resetProductForm();
    if (product) {
      setEditingProduct(product); setName(product.name || ''); setBrand(product.brand || ''); setDescription(product.description || '');
      setProductType(product.product_type === 'PHYSICAL' ? '' : product.product_type || '');
      setIsTaxable(product.is_taxable !== false);
      setSeoTitle(product.seo_title || ''); setSeoDescription(product.seo_description || '');
      const storedAttributes = product.custom_attributes && typeof product.custom_attributes === 'object' ? product.custom_attributes : {};
      setTagsText(Array.isArray(storedAttributes.tags) ? storedAttributes.tags.join(', ') : '');
      setProductMetafields(Array.isArray(storedAttributes.metafields) ? storedAttributes.metafields.map((field: any) => ({ namespace: String(field.namespace || 'custom'), key: String(field.key || ''), value: String(field.value || ''), type: String(field.type || 'single_line_text_field') })) : []);
      setCategoryMetafields(Array.isArray(storedAttributes.categoryMetafields) ? storedAttributes.categoryMetafields.map((field: any) => ({ namespace: String(field.namespace || 'category'), key: String(field.key || ''), value: String(field.value || ''), type: String(field.type || 'single_line_text_field') })) : []);
      const productVariants = product.variants || [];
      const firstVariant = productVariants[0];
      setSku(firstVariant?.sku || ''); setPrice(String(((firstVariant?.price_minor ?? 0) / 100).toFixed(2)));
      setInitialStock('0');
      setVariantDrafts(productVariants.map((variant: any) => ({
        id: variant.id,
        sku: variant.sku || '',
        barcode: variant.barcode || '',
        cost: variant.cost_minor == null ? '' : String((variant.cost_minor / 100).toFixed(2)),
        weightGrams: String(variant.weight_grams ?? 0),
        optionValues: variant.option_values || {},
        price: String(((variant.price_minor ?? 0) / 100).toFixed(2)),
        compareAt: variant.compare_at_minor == null ? '' : String((variant.compare_at_minor / 100).toFixed(2)),
      })));
      const productOptions = Array.isArray(product.options) ? product.options : [];
      const inferredOptionName = Object.keys(firstVariant?.option_values || {})[0];
      setVariantOptions(productOptions.length
        ? productOptions.map((option: any) => ({ name: String(option.name || ''), values: Array.isArray(option.values) ? option.values.join(', ') : '' }))
        : inferredOptionName ? [{ name: inferredOptionName, values: [...new Set(productVariants.map((variant: any) => variant.option_values?.[inferredOptionName]).filter(Boolean))].join(', ') }] : []);
      setCategoryIds((product.categories || []).map((category: any) => category.id));
      setSellingUnit(product.selling_unit || 'pcs'); setMinimumQuantity(String(product.minimum_quantity || 1));
      setQuantityStep(String(product.quantity_step || 1)); setComparePrice(firstVariant?.compare_at_minor == null ? '' : String((firstVariant.compare_at_minor / 100).toFixed(2)));
      setBarcode(firstVariant?.barcode || ''); setCostPerItem(firstVariant?.cost_minor == null ? '' : String((firstVariant.cost_minor / 100).toFixed(2)));
      setWeightGrams(String(firstVariant?.weight_grams ?? product.shipping_profile?.weightGrams ?? 0));
      setRequiresShipping(product.shipping_profile?.requiresShipping !== false);
      setTrackInventory(firstVariant?.track_inventory !== false);
      setContinueSellingWhenOutOfStock(firstVariant?.continue_selling_when_out_of_stock === true);
      setShippingLength(product.shipping_profile?.dimensions?.length == null ? '' : String(product.shipping_profile.dimensions.length));
      setShippingWidth(product.shipping_profile?.dimensions?.width == null ? '' : String(product.shipping_profile.dimensions.width));
      setShippingHeight(product.shipping_profile?.dimensions?.height == null ? '' : String(product.shipping_profile.dimensions.height));
      setDimensionUnit(product.shipping_profile?.dimensions?.unit || 'cm');
      setShippingPackageId(product.shipping_profile?.packageId || '');
      setCountryOfOrigin(product.shipping_profile?.countryOfOrigin || 'IN');
      setHsCode(product.shipping_profile?.hsCode || '');
      setKeyFeaturesText(Array.isArray(product.key_features) ? product.key_features.join('\n') : '');
      setSpecificationsText(formatProductSpecifications(product.specifications));
      setSizeChartText(formatSizeChart(product.size_chart));
      setImageUrls((product.media || []).map((media: any) => typeof media === 'string' ? media : media.url).filter(Boolean).join('\n'));
      setVisibility(product.status || 'ACTIVE');
    }
    setIsCreateOpen(true);
  };

  const closeProductEditor = () => {
    setIsCreateOpen(false);
    setIsDirty(false);
    if (isDedicatedProductEditor) navigate('/products');
  };

  useEffect(() => {
    if (isDedicatedProductEditor) {
      resetProductForm();
      void loadProductOptions();
      setIsCreateOpen(true);
    } else {
      setIsCreateOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isCreateOpen && descriptionEditorRef.current) {
      descriptionEditorRef.current.innerHTML = sanitizeHtml(description);
    }
  }, [isCreateOpen, editingProduct?.id]);

  useEffect(() => {
    loadData();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const priceMinor = Math.round(Number(price) * 100);
      if (!Number.isFinite(priceMinor) || priceMinor < 0) throw new Error('Enter a valid product price.');
      if (!Number.isFinite(Number(minimumQuantity)) || Number(minimumQuantity) <= 0 || !Number.isFinite(Number(quantityStep)) || Number(quantityStep) <= 0) throw new Error('Minimum quantity and quantity step must be greater than zero.');
      const normalizedOptions = normalizeVariantOptions(variantOptions);
      const variantMatrix = buildVariantMatrix(variantOptions);
      const hasVariants = normalizedOptions.length > 0;
      const normalizedSpecifications = parseProductSpecifications(specificationsText);
      const normalizedSizeChart = parseSizeChart(sizeChartText);
      const normalizedKeyFeatures = keyFeaturesText.split(/\r?\n/).map((feature) => feature.trim()).filter(Boolean);
      const normalizedDescription = sanitizeHtml(description);
      const normalizedTags = [...new Set(tagsText.split(',').map((tag) => tag.trim()).filter(Boolean))];
      const normalizeMetafields = (fields: MetafieldDraft[], namespaceDefault: string) => fields
        .map((field) => ({ namespace: field.namespace.trim() || namespaceDefault, key: field.key.trim(), value: field.value.trim(), type: field.type || 'single_line_text_field' }))
        .filter((field) => field.key && field.value);
      const normalizedMetafields = normalizeMetafields(productMetafields, 'custom');
      const normalizedCategoryMetafields = normalizeMetafields(categoryMetafields, 'category');
      const metafieldKeys = normalizedMetafields.map((field) => `${field.namespace}.${field.key}`.toLowerCase());
      if (new Set(metafieldKeys).size !== metafieldKeys.length) throw new Error('Metafield namespace and key combinations must be unique.');
      const dimensions = { length: shippingLength.trim() ? Number(shippingLength) : null, width: shippingWidth.trim() ? Number(shippingWidth) : null, height: shippingHeight.trim() ? Number(shippingHeight) : null, unit: dimensionUnit };
      for (const [label, value] of [['Length', dimensions.length], ['Width', dimensions.width], ['Height', dimensions.height]] as const) {
        if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error(`${label} must be zero or greater.`);
      }
      const normalizedCostMinor = costPerItem.trim() ? Math.round(Number(costPerItem) * 100) : null;
      const normalizedWeightGrams = Number(weightGrams) || 0;
      if (normalizedCostMinor !== null && (!Number.isFinite(normalizedCostMinor) || normalizedCostMinor < 0)) throw new Error('Enter a valid cost per item.');
      if (!Number.isFinite(normalizedWeightGrams) || normalizedWeightGrams < 0) throw new Error('Shipping weight must be zero or greater.');
      const createdVariants = editingProduct ? variantDrafts.map((variant) => ({
        id: variant.id,
        sku: variant.sku || undefined,
        barcode: variant.barcode || null,
        costMinor: variant.cost ? Math.round(Number(variant.cost) * 100) : null,
        weightGrams: Number(variant.weightGrams) || 0,
        optionValues: variant.optionValues,
        priceMinor: Math.round(Number(variant.price) * 100),
        compareAtMinor: variant.compareAt ? Math.round(Number(variant.compareAt) * 100) : null,
        trackInventory,
        continueSellingWhenOutOfStock,
      })) : (hasVariants ? variantMatrix : [{ optionValues: {}, skuSuffix: '' }]).map((combination, index, combinations) => {
        const draft = getNewVariantDraft(combination, combinations.length);
        const variantPrice = draft.price.trim() ? Math.round(Number(draft.price) * 100) : priceMinor;
        const variantCost = draft.cost.trim() ? Math.round(Number(draft.cost) * 100) : null;
        const variantWeight = Number(draft.weightGrams) || 0;
        if (!Number.isFinite(variantPrice) || variantPrice < 0) throw new Error(`Enter a valid price for ${Object.values(combination.optionValues).join(' / ') || 'the default variant'}.`);
        if (variantCost !== null && (!Number.isFinite(variantCost) || variantCost < 0)) throw new Error(`Enter a valid cost for ${Object.values(combination.optionValues).join(' / ') || 'the default variant'}.`);
        if (!Number.isFinite(variantWeight) || variantWeight < 0) throw new Error('Variant shipping weight must be zero or greater.');
        return {
          sku: draft.sku || buildVariantSku(sku || name, combination, combinations.length),
          barcode: draft.barcode || undefined,
          costMinor: variantCost,
          weightGrams: variantWeight,
          optionValues: combination.optionValues,
          priceMinor: variantPrice,
          compareAtMinor: draft.compareAt ? Math.round(Number(draft.compareAt) * 100) : null,
          initialStock: Math.max(0, Number(draft.initialStock) || 0),
          trackInventory,
          continueSellingWhenOutOfStock,
          position: index,
        };
      });
      const existingAttributes = editingProduct?.custom_attributes && typeof editingProduct.custom_attributes === 'object' && !Array.isArray(editingProduct.custom_attributes) ? editingProduct.custom_attributes : {};
      const payload = {
        name,
        brand,
        description: normalizedDescription,
        productType: productType.trim() || 'PHYSICAL',
        seoTitle: seoTitle.trim() || name.trim(),
        seoDescription: seoDescription.trim() || normalizedDescription.replace(/<[^>]*>/g, '').slice(0, 320),
        isTaxable,
        customAttributes: { ...existingAttributes, tags: normalizedTags, metafields: normalizedMetafields, categoryMetafields: normalizedCategoryMetafields },
        inventoryLocationId: inventoryLocationId || undefined,
        priceMinor,
        initialStock: Number(initialStock) || 0, categoryIds, sellingUnit, minimumQuantity: Number(minimumQuantity), quantityStep: Number(quantityStep),
        shippingProfile: {
          requiresShipping,
          weightGrams: normalizedWeightGrams,
          dimensions: Object.values(dimensions).some((value) => value !== null && value !== dimensionUnit) ? dimensions : null,
          packageId: shippingPackageId || null,
          countryOfOrigin: countryOfOrigin || null,
          hsCode: hsCode.trim() || null,
        }, specifications: normalizedSpecifications,
        keyFeatures: normalizedKeyFeatures, sizeChart: normalizedSizeChart,
        media: imageUrls.split('\n').map((url) => url.trim()).filter(Boolean).map((url) => ({ url })), status: visibility,
        options: normalizedOptions,
        variants: createdVariants
      };
      if (editingProduct) await api.updateProduct(editingProduct.id, payload);
      else await api.createProduct(payload);
      setIsCreateOpen(false);
      resetProductForm();
      await loadData();
      if (isDedicatedProductEditor) navigate('/products');
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (product: any) => {
    if (!window.confirm(`Deactivate ${product.name}? It will no longer be available in the storefront.`)) return;
    try { await api.deactivateProduct(product.id); await loadData(); } catch (err: any) { alert(err.message || 'Could not deactivate product.'); }
  };
  const reorderImage = (index: number, offset: number) => {
    const items = imageUrls.split('\n').map((value) => value.trim()).filter(Boolean);
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
    setImageUrls(items.join('\n'));
  };

  const formatProductDescription = (command: string) => {
    descriptionEditorRef.current?.focus();
    document.execCommand(command);
    setDescription(descriptionEditorRef.current?.innerHTML || '');
  };

  const generateUniqueSku = async () => {
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    try {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const randomPart = new Uint32Array(1);
        window.crypto.getRandomValues(randomPart);
        const candidate = `SKU-${date}-${String(randomPart[0] % 1000).padStart(3, '0')}`;
        const result = await api.getProducts({ search: candidate });
        const exists = (result.products || []).some((product: any) => (product.variants || []).some((variant: any) => String(variant.sku || '').toLowerCase() === candidate.toLowerCase()));
        if (!exists) { setSku(candidate); return; }
      }
      throw new Error('Could not find an unused SKU. Try again.');
    } catch (error: any) {
      alert(error.message || 'Could not generate an SKU right now.');
    }
  };

  const handleAdjustInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;
    try {
      setSubmitting(true);
      await api.adjustInventory({
        variantId: selectedVariant.id,
        locationId: 'loc-default',
        adjustmentQty: Number(adjustQty),
        movementType: 'MANUAL_COUNT',
        note: 'Admin manual count reconciliation'
      });
      setIsAdjustOpen(false);
      setSelectedVariant(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust inventory');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`products-page ${isDedicatedProductEditor ? 'products-page-editor' : 'products-page-list'}`} style={{ padding: isDedicatedProductEditor ? '24px clamp(16px, 3vw, 40px)' : '24px 32px', maxWidth: isDedicatedProductEditor ? 'none' : '1440px', margin: '0 auto', fontFamily: 'inherit' }}>
      {!isDedicatedProductEditor && <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>
            <span style={{ color: '#202223', fontWeight: 600 }}>Products</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Products
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Manage your products, pricing, variants, and inventory.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => openProduct()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#1a1a1a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Plus size={15} />
            <span>Add product</span>
          </button>
        </div>
      </div>

      <nav className="product-list-tabs" aria-label="Filter products by status">
        {([
          ['ALL', 'All'],
          ['ACTIVE', 'Active'],
          ['DRAFT', 'Draft'],
          ['ARCHIVED', 'Archived'],
        ] as const).map(([status, label]) => (
          <button
            key={status}
            type="button"
            className={statusFilter === status ? 'product-list-tab product-list-tab-active' : 'product-list-tab'}
            aria-pressed={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          >
            {label}<span>{productStatusCount(status)}</span>
          </button>
        ))}
      </nav>

      {/* Search Bar */}
      <div className="product-list-tools">
        <div className="product-list-search">
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search products by title, SKU, or category..."
            aria-label="Search products by title, SKU, or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="product-list-result-count">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</span>
      </div>

      <div className="product-list-table-card">
        {loading ? (
          <div style={{ padding: '24px' }}>
            <TableSkeleton rows={5} columns={7} />
          </div>
        ) : loadError && products.length === 0 ? (
          <ErrorState title="Products couldn’t load" message={loadError} onRetry={() => void loadData()} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={Box}
            title={products.length === 0 ? 'Add your products' : 'No products found'}
            description={search || statusFilter !== 'ALL' ? 'Try changing your search or status filter.' : 'Start by adding the products you want to sell in your store.'}
            actionLabel={products.length === 0 ? 'Add product' : undefined}
            onAction={products.length === 0 ? () => openProduct() : undefined}
          />
        ) : (
          <>
          {loadError && <div role="status" style={{ padding: '10px 16px', color: '#92400e', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: 13 }}>Showing saved results. Refresh failed: {loadError} <button type="button" onClick={() => void loadData()} style={{ marginLeft: 8, border: 0, background: 'transparent', color: '#0f766e', fontWeight: 700, cursor: 'pointer' }}>Retry</button></div>}
          <table style={{ minWidth: 920, width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 18px' }}>Product</th>
                <th style={{ padding: '14px 18px' }}>Category</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Variants</th>
                <th style={{ padding: '14px 18px' }}>Price</th>
                <th style={{ padding: '14px 18px' }}>Stock Available</th>
                <th style={{ padding: '14px 18px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const primaryVariant = p.variants?.[0] || {};
                const totalStock = (p.variants || []).reduce((acc: number, v: any) => acc + (v.stock_available || 0), 0);
                const inventoryNotTracked = (p.variants || []).length > 0 && p.variants.every((variant: any) => variant.track_inventory === false);
                const primaryImage = typeof p.media?.[0] === 'string' ? p.media[0] : p.media?.[0]?.url;
                const categoryNames = (p.categories || []).map((category: any) => category.name).filter(Boolean);
                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {primaryImage ? <img src={primaryImage} alt="" loading="lazy" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', background: '#f0fdfa' }} /> : <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#f0fdfa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0d9488'
                        }}>
                          <Box size={20} />
                        </div>}
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>SKU: {primaryVariant.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      {categoryNames.length ? categoryNames.join(', ') : p.category_name || 'General Catalog'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: p.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                        color: p.status === 'ACTIVE' ? '#15803d' : '#475569'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748b' }}>
                      {p.variants?.length || 1} variant{(p.variants?.length || 1) === 1 ? '' : 's'}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                      {formatCurrency(primaryVariant.price_minor || 0)}{p.selling_unit && p.selling_unit !== 'pcs' ? <span style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}> / {p.selling_unit}</span> : null}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: inventoryNotTracked ? '#f1f5f9' : totalStock > 5 ? '#dcfce7' : totalStock > 0 ? '#fef3c7' : '#fee2e2',
                        color: inventoryNotTracked ? '#475569' : totalStock > 5 ? '#15803d' : totalStock > 0 ? '#b45309' : '#b91c1c'
                      }}>
                        {inventoryNotTracked ? 'Not tracked' : `${totalStock} in stock`}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <button type="button" onClick={() => openProduct(p)} style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '5px 9px', background: '#fff', cursor: 'pointer', marginRight: 6 }}>Edit</button>
                      {p.status === 'ACTIVE' && <button type="button" onClick={() => void handleDeactivate(p)} style={{ border: '1px solid #fecaca', borderRadius: 6, padding: '5px 9px', background: '#fff7f7', color: '#b91c1c', cursor: 'pointer' }}>Deactivate</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </>
        )}
      </div>
      </>}

      {/* Product editor: modal for edits, dedicated page for creation */}
      {isCreateOpen && (
        <div className={isDedicatedProductEditor ? 'product-create-page' : 'product-create-backdrop'}>
          <form className={isDedicatedProductEditor ? 'product-create-form product-create-form-page' : 'product-create-form'} role={isDedicatedProductEditor ? undefined : 'dialog'} aria-modal={isDedicatedProductEditor ? undefined : true} aria-labelledby="product-form-title" onSubmit={handleCreate} onChange={() => setIsDirty(true)} onInput={() => setIsDirty(true)} onClick={(event) => { if ((event.target as HTMLElement).closest('button[type="button"]')) setIsDirty(true); }}>
            <div className="product-editor-heading">
              {isDedicatedProductEditor && <div className="product-editor-breadcrumb"><button type="button" onClick={closeProductEditor} aria-label="Back to products">‹</button><span>Products</span><span aria-hidden="true">/</span><strong>Add product</strong></div>}
              <div className="product-editor-title-row">
              <div><h3 id="product-form-title" style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{editingProduct ? 'Edit Product' : 'Create New Product'}</h3><p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Organize product details, pricing, variants, and media.</p></div>
              {!isDedicatedProductEditor && <button type="button" aria-label="Close product editor" onClick={closeProductEditor} style={{ cursor: 'pointer', color: '#64748b', background: 'transparent', border: 0, padding: 6 }}><X size={20} /></button>}
              </div>
            </div>

            {isDedicatedProductEditor && isDirty && <div className="product-editor-savebar"><span>{submitting ? 'Saving product…' : editingProduct ? 'Unsaved changes' : 'Unsaved product'}</span><button type="button" onClick={closeProductEditor} disabled={submitting}>Discard</button><button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button></div>}

            <div className="product-editor-title-field product-editor-card">
              <label className={isDedicatedProductEditor ? 'product-editor-sr-only' : ''} style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Product Title *</label>
              <input
                type="text"
                required
                placeholder={isDedicatedProductEditor ? 'Add product title' : 'e.g. Handmade Ceramic Mug'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
            </div>

            <label className="product-editor-vendor product-editor-card" style={{ display: 'block', marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#334155' }}>Vendor / brand (optional)
              <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Brand or maker" style={{ display: 'block', width: '100%', marginTop: 6, padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
            </label>

            <div className="product-editor-category product-editor-card" style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#334155' }}>Categories (first selected is primary)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 96, overflow: 'auto', padding: 8, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                {categories.map((category) => <label key={category.id} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={(event) => setCategoryIds((current) => event.target.checked ? [...current, category.id] : current.filter((id) => id !== category.id))} />{category.name}</label>)}
                {!categories.length && <span style={{ color: '#64748b', fontSize: 12 }}>No categories yet. Create one in Catalogue → Categories.</span>}
              </div>
            </div>

            <div className="product-editor-status product-editor-card">
              <div className="product-editor-status-indicator"><span className={visibility === 'ACTIVE' ? 'is-active' : ''} />{visibility === 'ACTIVE' ? 'Active' : visibility === 'DRAFT' ? 'Draft' : 'Archived'}</div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Status
                <select value={visibility} onChange={(event) => setVisibility(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 9, borderRadius: 8, border: '1px solid #e2e8f0' }}><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select>
              </label>
              <p className="product-editor-muted">Active products can appear in your storefront when a store is published.</p>
              <div className="product-editor-side-divider" />
              <strong className="product-editor-small-heading">Publishing</strong>
              <span className="product-editor-publishing-state">Online storefront · {visibility === 'ACTIVE' ? 'Available' : 'Hidden'}</span>
              <p className="product-editor-muted">Additional sales channels and catalogs are not connected to product publishing yet.</p>
            </div>

            <div className="product-editor-unit product-editor-card">
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Selling unit
                <select value={sellingUnit} onChange={(event) => setSellingUnit(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 9, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  {(units.length ? units : [{ code: 'pcs', label: 'Pieces' }]).map((unit) => <option key={unit.code} value={unit.code}>{unit.label} ({unit.code})</option>)}
                </select>
              </label>
            </div>

            <div className="product-editor-type product-editor-card">
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Product type
                <input maxLength={64} value={productType} onChange={(event) => setProductType(event.target.value)} placeholder="e.g. Bath soap" style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: 9, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </label>
              <p className="product-editor-muted">Product type is a merchant-defined label. Category is managed separately above.</p>
            </div>

            {sellingUnit !== 'pcs' && <div className="product-editor-quantity product-editor-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Minimum quantity ({sellingUnit})<input type="number" min="0.001" step="0.001" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 9, border: '1px solid #e2e8f0', borderRadius: 8 }} /></label>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Quantity step ({sellingUnit})<input type="number" min="0.001" step="0.001" value={quantityStep} onChange={(event) => setQuantityStep(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 9, border: '1px solid #e2e8f0', borderRadius: 8 }} /></label>
            </div>}

            <section className="product-editor-organize product-editor-card" aria-label="Product organization">
              <div><h4>Collections</h4><button type="button" disabled aria-disabled="true">＋ Add collections</button><p>Collection assignment is not available in the current catalog API.</p></div>
              <div><h4>Tags</h4><label className="product-editor-tag-label">Comma-separated tags<input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="seasonal, handmade, featured" /></label><p>Tags are saved as product metadata and can be used for catalog organization.</p></div>
            </section>

            <section className="product-editor-shipping product-editor-card" aria-label="Shipping details" style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 14, background: '#fbfdff' }}>
              <strong style={{ fontSize: 14, color: '#0f172a' }}>Shipping</strong>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13, color: '#334155' }}><input type="checkbox" checked={requiresShipping} onChange={(event) => setRequiresShipping(event.target.checked)} /> This is a physical product and requires shipping</label>
              <div className="product-editor-shipping-grid">
                <label>Product weight (grams)<input disabled={!requiresShipping} type="number" min="0" step="1" value={weightGrams} onChange={(event) => setWeightGrams(event.target.value)} placeholder="0" /></label>
                <div className="product-editor-dimensions"><span>Packed dimensions ({dimensionUnit})</span><div><label>Length<input disabled={!requiresShipping} type="number" min="0" step="0.1" value={shippingLength} onChange={(event) => setShippingLength(event.target.value)} placeholder="0" /></label><label>Width<input disabled={!requiresShipping} type="number" min="0" step="0.1" value={shippingWidth} onChange={(event) => setShippingWidth(event.target.value)} placeholder="0" /></label><label>Height<input disabled={!requiresShipping} type="number" min="0" step="0.1" value={shippingHeight} onChange={(event) => setShippingHeight(event.target.value)} placeholder="0" /></label><select aria-label="Dimension unit" disabled={!requiresShipping} value={dimensionUnit} onChange={(event) => setDimensionUnit(event.target.value)}><option value="cm">cm</option><option value="mm">mm</option><option value="in">in</option></select></div></div>
                <label>Package profile reference<input disabled={!requiresShipping} value={shippingPackageId} onChange={(event) => setShippingPackageId(event.target.value)} placeholder="Optional package name" /></label>
                <label>Country of origin<select disabled={!requiresShipping} value={countryOfOrigin} onChange={(event) => setCountryOfOrigin(event.target.value)}><option value="IN">India</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="CN">China</option><option value="AE">United Arab Emirates</option><option value="OTHER">Other / not specified</option></select></label>
                <label>HS code<input disabled={!requiresShipping} value={hsCode} onChange={(event) => setHsCode(event.target.value)} maxLength={16} placeholder="Optional customs code" /></label>
              </div>
              <p style={{ margin: '9px 0 0', fontSize: 11, color: '#64748b' }}>These product shipping details are saved. Carrier labels and customs calculations still require a shipping integration.</p>
            </section>

            <section className="product-editor-price product-editor-card" aria-label="Price and inventory" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>{sellingUnit === 'pcs' ? 'Price (INR)' : `Price per ${sellingUnit} (INR)`} {editingProduct ? '' : '*'}</label>
                <input type="number" min="0" step="0.01" required={!editingProduct} value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Compare price (INR)</label>
                <input type="number" min="0" step="0.01" value={comparePrice} onChange={(event) => setComparePrice(event.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Cost per item (INR)</label>
                <input type="number" min="0" step="0.01" value={costPerItem} onChange={(event) => setCostPerItem(event.target.value)} placeholder="Optional" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
              </div>
              <label className="product-editor-tax-toggle"><input type="checkbox" checked={isTaxable} onChange={(event) => setIsTaxable(event.target.checked)} /> Charge tax on this product</label>
              <div className="product-editor-muted">Taxability is saved on the product. Checkout tax calculation still depends on store configuration and is not connected yet.</div>
            </section>

            <section className="product-editor-inventory product-editor-card" aria-label="Inventory details">
              <div className="product-editor-section-title"><strong>Inventory</strong><span>Stock is tracked per variant at a selected location</span></div>
              <label className="product-editor-toggle"><input type="checkbox" checked={trackInventory} onChange={(event) => setTrackInventory(event.target.checked)} /> Track quantity</label>
              <label className="product-editor-toggle"><input type="checkbox" checked={continueSellingWhenOutOfStock} disabled={!trackInventory} onChange={(event) => setContinueSellingWhenOutOfStock(event.target.checked)} /> Continue selling when out of stock</label>
              {warehouses.length > 0 ? <label className="product-editor-location">Inventory location
                <select value={inventoryLocationId} onChange={(event) => setInventoryLocationId(event.target.value)}><option value="">Use default location</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}{warehouse.is_default ? ' · Default' : ''}</option>)}</select>
              </label> : <p className="product-editor-muted">No active inventory locations were returned. Initial stock will use the store default location.</p>}
              {!editingProduct && <label className="product-editor-initial-stock">Initial stock for a single-variant product<input disabled={!trackInventory || createVariantMatrix.length > 0} type="number" min="0" step={sellingUnit === 'pcs' ? '1' : '0.001'} value={initialStock} onChange={(event) => setInitialStock(event.target.value)} /><span>For products with options, set starting stock in each variant row below.</span></label>}
            </section>

            {editingProduct && variantDrafts.length > 0 && <section className="product-editor-existing-variants product-editor-card" aria-label="Variant details" style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ marginBottom: 10 }}><strong style={{ fontSize: 14, color: '#0f172a' }}>Variant details</strong><p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>SKU, barcode, price, cost, stock policy and shipping weight are stored per variant. Inventory is managed in Catalogue → Inventory.</p></div>
              <div style={{ display: 'grid', gap: 8 }}>
                {variantDrafts.map((variant, index) => <div key={variant.id || index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, alignItems: 'end', padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', paddingBottom: 8 }}>{Object.values(variant.optionValues).filter(Boolean).join(' / ') || `Variant ${index + 1}`}</div>
                  <label style={{ fontSize: 11, color: '#64748b' }}>SKU<input aria-label={`SKU for variant ${index + 1}`} value={variant.sku} onChange={(event) => setVariantDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, sku: event.target.value } : item))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} /></label>
                  <label style={{ fontSize: 11, color: '#64748b' }}>Barcode<input aria-label={`Barcode for variant ${index + 1}`} value={variant.barcode} onChange={(event) => setVariantDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, barcode: event.target.value } : item))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} />{variant.barcode && <div style={{ marginTop: 5 }}><BarcodePreview value={variant.barcode} compact /></div>}</label>
                  <label style={{ fontSize: 11, color: '#64748b' }}>Price (₹)<input aria-label={`Price for variant ${index + 1}`} type="number" min="0" step="0.01" required value={variant.price} onChange={(event) => setVariantDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} /></label>
                  <label style={{ fontSize: 11, color: '#64748b' }}>Compare (₹)<input aria-label={`Compare price for variant ${index + 1}`} type="number" min="0" step="0.01" value={variant.compareAt} onChange={(event) => setVariantDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, compareAt: event.target.value } : item))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} /></label>
                  <label style={{ fontSize: 11, color: '#64748b' }}>Cost (₹)<input aria-label={`Cost for variant ${index + 1}`} type="number" min="0" step="0.01" value={variant.cost} onChange={(event) => setVariantDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, cost: event.target.value } : item))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} /></label>
                  <label style={{ fontSize: 11, color: '#64748b' }}>Weight (g)<input aria-label={`Weight in grams for variant ${index + 1}`} type="number" min="0" step="1" value={variant.weightGrams} onChange={(event) => setVariantDrafts((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, weightGrams: event.target.value } : item))} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }} /></label>
                </div>)}
              </div>
            </section>}

            {!editingProduct && <div className="product-editor-sku product-editor-card" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}><label htmlFor="product-primary-sku" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>SKU base</label><button type="button" onClick={() => void generateUniqueSku()} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#334155', borderRadius: 7, padding: '6px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Generate unique SKU</button></div>
              <input id="product-primary-sku" type="text" placeholder="SKU-YYYYMMDD-000 (generated when blank)" value={sku} onChange={(e) => setSku(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginTop: 10 }}>Barcode (optional)
                <input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="UPC, EAN or other barcode" style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: 9, border: '1px solid #e2e8f0', borderRadius: 8 }} />
              </label>
            </div>}

            {(!editingProduct || variantOptions.length > 0) && <section className="product-editor-variants product-editor-card" aria-label="Product variants" style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 14, background: '#fbfdff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div><strong style={{ fontSize: 14, color: '#0f172a' }}>Variants</strong>{variantOptions.length > 0 && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>Set options such as size or color, then manage each variant’s price and inventory.</p>}</div>
                {!editingProduct && variantOptions.length > 0 && variantOptions.length < 3 && <button type="button" onClick={() => setVariantOptions((items) => [...items, { name: items.length === 1 ? 'Color' : 'Material', values: '' }])} style={{ border: '1px solid #cbd5cf', background: '#fff', borderRadius: 7, padding: '7px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>＋ Add another option</button>}
              </div>
              {!editingProduct && variantOptions.length === 0 && <button className="product-editor-add-options" type="button" onClick={() => setVariantOptions([{ name: 'Size', values: '' }])}>＋ <span>Add options like size and color</span></button>}
              <div style={{ display: 'grid', gap: 8 }}>
                {variantOptions.map((option, index) => <div className="product-editor-option-row" key={`${index}-${option.name}`}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Option name<input disabled={Boolean(editingProduct)} aria-label={`Variant option ${index + 1} name`} value={option.name} onChange={(event) => setVariantOptions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder={index === 0 ? 'Size' : 'Color'} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: 8, border: '1px solid #e2e8f0', borderRadius: 7 }} /></label>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Values, comma separated<input disabled={Boolean(editingProduct)} aria-label={`Variant option ${index + 1} values`} value={option.values} onChange={(event) => setVariantOptions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, values: event.target.value } : item))} placeholder={index === 0 ? 'Small, Medium, Large' : 'Black, White'} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: 8, border: '1px solid #e2e8f0', borderRadius: 7 }} /></label>
                  {!editingProduct ? <button type="button" aria-label={`Remove variant option ${index + 1}`} onClick={() => setVariantOptions((items) => items.filter((_, itemIndex) => itemIndex !== index))} style={{ height: 34, border: '1px solid #e1e3e5', background: '#fff', color: '#5c6166', borderRadius: 7, padding: '0 9px', cursor: 'pointer' }}>Remove</button> : <span />}
                </div>)}
              </div>

              {!editingProduct && variantOptions.length > 0 && <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div><strong style={{ fontSize: 13, color: '#0f172a' }}>Variant inventory and pricing</strong><div style={{ marginTop: 3, fontSize: 11, color: '#64748b' }}>Set unique SKU, barcode, price, cost, starting stock, and shipping weight for each combination.</div></div>
                  <span style={{ whiteSpace: 'nowrap', borderRadius: 999, padding: '4px 8px', background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 700 }}>{Math.max(1, createVariantMatrix.length)} variant{Math.max(1, createVariantMatrix.length) === 1 ? '' : 's'}</span>
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid #dbe3ee', borderRadius: 9, background: '#fff' }}>
                  <table style={{ width: '100%', minWidth: 1040, borderCollapse: 'separate', borderSpacing: 0, fontSize: 11 }}>
                    <thead><tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                      {['Variant', 'SKU', 'Barcode', 'Price (₹)', 'Compare (₹)', 'Cost (₹)', `Stock (${sellingUnit})`, 'Weight (g)'].map((heading) => <th key={heading} style={{ padding: '9px 8px', borderBottom: '1px solid #dbe3ee', whiteSpace: 'nowrap' }}>{heading}</th>)}
                    </tr></thead>
                    <tbody>{(createVariantMatrix.length ? createVariantMatrix : [{ optionValues: {}, skuSuffix: '' }]).map((combination, index, rows) => {
                      const draft = getNewVariantDraft(combination, rows.length);
                      const fieldStyle: React.CSSProperties = { width: '100%', minWidth: 90, boxSizing: 'border-box', padding: '7px 8px', border: '1px solid #dbe3ee', borderRadius: 6, fontSize: 11 };
                      return <tr key={variantKey(combination.optionValues)} style={{ verticalAlign: 'top' }}>
                        <td style={{ padding: 8, borderBottom: '1px solid #edf2f7', minWidth: 110, fontWeight: 700, color: '#334155' }}>{Object.values(combination.optionValues).filter(Boolean).join(' / ') || 'Default'}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #edf2f7' }}><input aria-label={`SKU for new variant ${index + 1}`} value={draft.sku} onChange={(event) => updateNewVariant(combination.optionValues, { sku: event.target.value })} style={fieldStyle} /></td>
                        <td style={{ padding: 8, borderBottom: '1px solid #edf2f7' }}><input aria-label={`Barcode for new variant ${index + 1}`} value={draft.barcode} onChange={(event) => updateNewVariant(combination.optionValues, { barcode: event.target.value })} placeholder="Optional" style={fieldStyle} />{draft.barcode && <div style={{ marginTop: 5 }}><BarcodePreview value={draft.barcode} compact /></div>}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #edf2f7' }}><input aria-label={`Price for new variant ${index + 1}`} type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateNewVariant(combination.optionValues, { price: event.target.value })} style={fieldStyle} /></td>
                        <td style={{ padding: 8, borderBottom: '1px solid #edf2f7' }}><input aria-label={`Compare price for new variant ${index + 1}`} type="number" min="0" step="0.01" value={draft.compareAt} onChange={(event) => updateNewVariant(combination.optionValues, { compareAt: event.target.value })} style={fieldStyle} /></td>
                        <td style={{ padding: 8, borderBottom: '1px solid #edf2f7' }}><input aria-label={`Cost for new variant ${index + 1}`} type="number" min="0" step="0.01" value={draft.cost} onChange={(event) => updateNewVariant(combination.optionValues, { cost: event.target.value })} style={fieldStyle} /></td>
                        <td style={{ padding: 8, borderBottom: '1px solid #edf2f7' }}><input aria-label={`Initial stock for new variant ${index + 1}`} type="number" min="0" step={sellingUnit === 'pcs' ? '1' : '0.001'} value={draft.initialStock} onChange={(event) => updateNewVariant(combination.optionValues, { initialStock: event.target.value })} style={fieldStyle} /></td>
                        <td style={{ padding: 8, borderBottom: '1px solid #edf2f7' }}><input aria-label={`Weight in grams for new variant ${index + 1}`} type="number" min="0" step="1" disabled={!requiresShipping} value={draft.weightGrams} onChange={(event) => updateNewVariant(combination.optionValues, { weightGrams: event.target.value })} style={fieldStyle} /></td>
                      </tr>;
                    })}</tbody>
                  </table>
                </div>
                {!createVariantMatrix.length && normalizeVariantOptions(variantOptions).length > 0 && <p style={{ margin: '6px 0 0', color: '#b45309', fontSize: 11 }}>The variant combination count is above the 250 variant limit. Reduce option values to continue.</p>}
              </div>}
            </section>}

            <div className="product-editor-media product-editor-card" style={{ marginBottom: 14 }}>
              <div className="product-editor-section-title"><strong>Media</strong><span>Add product photos</span></div>
              <div className="product-editor-upload-zone">
                <span className="product-editor-upload-icon">＋</span>
                <strong>Upload images</strong>
                <span>JPEG, PNG, WebP, GIF, or AVIF</span>
                <input aria-label="Upload product images" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple disabled={uploadingImages} onChange={async (event) => { const files = Array.from(event.target.files || []); if (!files.length) return; setUploadingImages(true); try { const uploaded = await Promise.all(files.map((file) => api.uploadStoreMedia(file))); const current = imageUrls.split('\n').map((value) => value.trim()).filter(Boolean); setImageUrls([...current, ...uploaded.map((image) => image.url)].join('\n')); } catch (error: any) { alert(error.message || 'Image upload failed.'); } finally { setUploadingImages(false); event.target.value = ''; } }} />
              </div>
              {uploadingImages && <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>Uploading product images…</span>}
              {imageUrls.split('\n').map((url) => url.trim()).filter(Boolean).length > 0 && <div className="product-editor-image-grid">{imageUrls.split('\n').map((url) => url.trim()).filter(Boolean).map((url, index, list) => <div className="product-editor-image-tile" key={`${url}-${index}`}><img src={url} alt={`Product image ${index + 1}`} /><button type="button" disabled={index === 0} onClick={() => reorderImage(index, -1)} aria-label="Move image up">↑</button><button type="button" disabled={index === list.length - 1} onClick={() => reorderImage(index, 1)} aria-label="Move image down">↓</button><button type="button" onClick={() => setImageUrls(list.filter((_, imageIndex) => imageIndex !== index).join('\n'))} aria-label={`Remove image ${index + 1}`}>×</button></div>)}</div>}
              <details className="product-editor-image-url"><summary>Add image by URL</summary>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', margin: '10px 0 6px' }}>Image URLs (one per line; first image is primary)</label>
              <textarea rows={2} value={imageUrls} onChange={(event) => setImageUrls(event.target.value)} placeholder="https://cdn.example.com/product.jpg" style={{ width: '100%', padding: 9, border: '1px solid #e2e8f0', borderRadius: 8, resize: 'vertical' }} />
              </details>
            </div>

            <div className="product-editor-description product-editor-card" style={{ marginBottom: '20px' }}>
              <div className="product-editor-section-title"><strong>Description</strong><span>Describe what makes this product special</span></div>
              <div className="product-editor-rich-toolbar" role="toolbar" aria-label="Description formatting">
                <button type="button" aria-label="Bold" onClick={() => formatProductDescription('bold')}><strong>B</strong></button>
                <button type="button" aria-label="Italic" onClick={() => formatProductDescription('italic')}><em>I</em></button>
                <button type="button" aria-label="Underline" onClick={() => formatProductDescription('underline')}><u>U</u></button>
                <span />
                <button type="button" aria-label="Bulleted list" onClick={() => formatProductDescription('insertUnorderedList')}>• List</button>
                <button type="button" aria-label="Numbered list" onClick={() => formatProductDescription('insertOrderedList')}>1. List</button>
                <button type="button" aria-label="Clear formatting" onClick={() => formatProductDescription('removeFormat')}>Clear</button>
              </div>
              <div
                ref={descriptionEditorRef}
                role="textbox"
                aria-label="Description"
                aria-multiline="true"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Add a product description"
                onInput={(event) => setDescription(event.currentTarget.innerHTML)}
                className="product-editor-description-input"
              />
            </div>

            <section className="product-editor-details product-editor-card" aria-label="Product information for customers" style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 18, background: '#fbfdff' }}>
              <strong style={{ display: 'block', marginBottom: 10, fontSize: 14, color: '#0f172a' }}>Product information</strong>
              <label style={{ display: 'block', marginBottom: 12, fontSize: 12, fontWeight: 600, color: '#475569' }}>Key features (one per line)
                <textarea rows={3} value={keyFeaturesText} onChange={(event) => setKeyFeaturesText(event.target.value)} placeholder={'Soft, breathable fabric\nMachine washable\nMade in India'} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: 9, border: '1px solid #e2e8f0', borderRadius: 7, resize: 'vertical' }} />
              </label>
              <label style={{ display: 'block', marginBottom: 12, fontSize: 12, fontWeight: 600, color: '#475569' }}>Specifications (one “Name: value” per line)
                <textarea rows={4} value={specificationsText} onChange={(event) => setSpecificationsText(event.target.value)} placeholder={'Material: 100% cotton\nFit: Regular\nCare: Machine wash'} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: 9, border: '1px solid #e2e8f0', borderRadius: 7, resize: 'vertical' }} />
              </label>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569' }}>Size chart (columns and rows separated by |)
                <textarea rows={4} value={sizeChartText} onChange={(event) => setSizeChartText(event.target.value)} placeholder={'Size | Chest | Length\nS | 86 cm | 60 cm\nM | 92 cm | 64 cm'} style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 5, padding: 9, border: '1px solid #e2e8f0', borderRadius: 7, resize: 'vertical' }} />
              </label>
            </section>

            <section className="product-editor-metafields product-editor-card" aria-label="Product metafields">
              <div className="product-editor-section-title"><strong>Category metafields</strong><span>Optional values associated with the selected category</span></div>
              {categoryMetafields.map((field, index) => <div className="product-editor-metafield-row" key={`category-${index}`}>
                <input aria-label={`Category metafield ${index + 1} name`} value={field.key} onChange={(event) => setCategoryMetafields((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value } : item))} placeholder="Name" />
                <input aria-label={`Category metafield ${index + 1} value`} value={field.value} onChange={(event) => setCategoryMetafields((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder="Value" />
                <button type="button" aria-label={`Remove category metafield ${index + 1}`} onClick={() => setCategoryMetafields((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
              </div>)}
              <button className="product-editor-add-metafield" type="button" onClick={() => setCategoryMetafields((items) => [...items, { namespace: 'category', key: '', value: '', type: 'single_line_text_field' }])}>＋ Add category metafield</button>

              <div className="product-editor-metafield-divider" />
              <div className="product-editor-section-title"><strong>Product metafields</strong><span>Custom values saved with this product</span></div>
              {productMetafields.map((field, index) => <div className="product-editor-metafield-row" key={`product-${index}`}>
                <input aria-label={`Product metafield ${index + 1} namespace`} value={field.namespace} onChange={(event) => setProductMetafields((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, namespace: event.target.value } : item))} placeholder="Namespace" />
                <input aria-label={`Product metafield ${index + 1} name`} value={field.key} onChange={(event) => setProductMetafields((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value } : item))} placeholder="Name" />
                <input aria-label={`Product metafield ${index + 1} value`} value={field.value} onChange={(event) => setProductMetafields((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder="Value" />
                <button type="button" aria-label={`Remove product metafield ${index + 1}`} onClick={() => setProductMetafields((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
              </div>)}
              <button className="product-editor-add-metafield" type="button" onClick={() => setProductMetafields((items) => [...items, { namespace: 'custom', key: '', value: '', type: 'single_line_text_field' }])}>＋ Add product metafield</button>
              <p className="product-editor-muted">Metafields are stored as merchant-defined product attributes. Shopify category suggestions and typed validation are not connected.</p>
            </section>

            <section className="product-editor-seo product-editor-card" aria-label="Search engine listing">
              <div className="product-editor-section-title"><strong>Search engine listing</strong><span>Preview how this product can appear in search</span></div>
              <label>Page title<input maxLength={70} value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder={name || 'Product title'} /></label>
              <label>Meta description<textarea maxLength={320} rows={3} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="Describe this product for search results" /></label>
              <div className="product-editor-seo-preview"><strong>{seoTitle || name || 'Product title'}</strong><span>BillionBiz storefront</span><p>{seoDescription || description.replace(/<[^>]*>/g, '').slice(0, 160) || 'Your product description will appear here.'}</p><small>The product URL is generated when you save.</small></div>
            </section>

            <div className="product-editor-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={closeProductEditor}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0d9488',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {submitting ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECONCILE STOCK MODAL */}
      {isAdjustOpen && selectedVariant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <form onSubmit={handleAdjustInventory} style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Reconcile Stock</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setIsAdjustOpen(false)} />
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
              Adjust inventory for SKU: <strong style={{ color: '#0d9488' }}>{selectedVariant.sku}</strong>
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Stock Adjustment (+ / - units)
              </label>
              <input
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#0d9488', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                {submitting ? 'Updating...' : 'Confirm Count'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
