import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, X, Box } from 'lucide-react';
import { api } from '../api/services';

const formatCurrency = (minor: number) => {
  return '₹' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New product form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('1999');
  const [sku, setSku] = useState('');
  const [initialStock, setInitialStock] = useState('20');
  const [description, setDescription] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({ search: search || undefined });
      setProducts(res.products || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const priceMinor = Math.round(parseFloat(price) * 100);
      await api.createProduct({
        name,
        description,
        priceMinor,
        initialStock: parseInt(initialStock, 10) || 0,
        variants: [
          {
            sku: sku || `${name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-DEF`,
            priceMinor,
            initialStock: parseInt(initialStock, 10) || 0
          }
        ]
      });
      setIsCreateOpen(false);
      setName('');
      setDescription('');
      setSku('');
      await loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1f36', margin: 0 }}>Product Catalogue</h1>
          <p style={{ color: '#697386', marginTop: '4px', fontSize: '14px' }}>
            Manage sellable SKUs, options, variant matrices, and location inventory.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadProducts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #dcdfe4',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#0066cc',
              color: '#fff',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#8792a2' }} />
          <input
            type="text"
            placeholder="Search products by title, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: '6px',
              border: '1px solid #dcdfe4',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e3e8ee', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e3e8ee', color: '#4f566b' }}>
              <th style={{ padding: '12px 16px' }}>Product</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Variants</th>
              <th style={{ padding: '12px 16px' }}>Price</th>
              <th style={{ padding: '12px 16px' }}>Available Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#697386' }}>
                  Loading product catalogue...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#697386' }}>
                  No products in catalog. Click "Add Product" to create your first item.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const primaryVariant = p.variants?.[0] || {};
                const totalStock = (p.variants || []).reduce((acc: number, v: any) => acc + (v.stock_available || 0), 0);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '6px',
                          background: '#f4f5f7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#697386'
                        }}>
                          <Box size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1a1f36' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: '#8792a2' }}>SKU: {primaryVariant.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4f566b' }}>
                      {p.category_name || 'General Catalog'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: p.status === 'ACTIVE' ? '#e6f7ec' : '#f0f2f5',
                        color: p.status === 'ACTIVE' ? '#0d8a3e' : '#4f566b'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4f566b' }}>
                      {p.variants?.length || 1} variant(s)
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                      {formatCurrency(primaryVariant.price_minor || 0)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: totalStock > 5 ? '#e6f7ec' : totalStock > 0 ? '#fff8e6' : '#fbeae9',
                        color: totalStock > 5 ? '#0d8a3e' : totalStock > 0 ? '#b25e00' : '#d9381e'
                      }}>
                        {totalStock} in stock
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleCreate} style={{ background: '#fff', borderRadius: '8px', width: '500px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Create New Product</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsCreateOpen(false)} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Handmade Ceramic Mug"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Price (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Initial Stock Units</label>
                <input
                  type="number"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Primary SKU Code</label>
              <input
                type="text"
                placeholder="e.g. MUG-CER-01 (Auto-generated if blank)"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Description</label>
              <textarea
                rows={3}
                placeholder="Key product attributes and dimensions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dcdfe4' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #dcdfe4', background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0066cc',
                  color: '#fff',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {submitting ? 'Creating...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
