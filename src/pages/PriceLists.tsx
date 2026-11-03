import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Tag, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../api/services';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';

export const PriceLists: FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'wholesale' | 'vip' | 'retail'>('all');
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tierType, setTierType] = useState('WHOLESALE');
  const currency = 'INR';
  const [discountPct, setDiscountPct] = useState('10.00');

  const fetchPriceLists = async () => {
    setLoading(true);
    try {
      const res = await api.getPriceLists();
      setPriceLists(res.priceLists || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch price lists:', err);
      setError(err.message || 'Unable to load price lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceLists();
  }, []);

  const handleCreatePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await api.createPriceList({
        name: name.trim(),
        description: description.trim(),
        currency,
        tierType,
        discountPct: parseFloat(discountPct) || 0
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setDiscountPct('10.00');
      fetchPriceLists();
    } catch (err: any) {
      alert(err.message || 'Failed to create price list');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price list?')) return;
    try {
      await api.deletePriceList(id);
      fetchPriceLists();
    } catch (err: any) {
      alert(err.message || 'Failed to delete price list');
    }
  };

  const filteredLists = priceLists.filter((pl) => {
    const matchesSearch =
      pl.name.toLowerCase().includes(search.toLowerCase()) ||
      (pl.description && pl.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'wholesale') return pl.tier_type === 'WHOLESALE';
    if (activeTab === 'vip') return pl.tier_type === 'VIP';
    if (activeTab === 'retail') return pl.tier_type === 'RETAIL';
    return true;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>
            <span>Catalogue</span>
            <span>/</span>
            <span style={{ color: '#38bdf8' }}>Price Lists</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>Price Lists & Wholesale Tiers</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Manage custom wholesale rates, B2B volume pricing tiers, and VIP discounts across your catalog.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
        >
          <Plus size={16} />
          Create Price List
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total Price Lists</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>{priceLists.length}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Wholesale Tiers</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>
            {priceLists.filter(p => p.tier_type === 'WHOLESALE').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>VIP Discount Lists</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#a855f7', marginTop: '6px' }}>
            {priceLists.filter(p => p.tier_type === 'VIP').length}
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Price Lists' },
            { id: 'wholesale', label: 'Wholesale B2B' },
            { id: 'vip', label: 'VIP Customer Rates' },
            { id: 'retail', label: 'Custom Retail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                backgroundColor: activeTab === tab.id ? '#334155' : 'transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search price lists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader count={4} height={70} />
      ) : error ? (
        <div style={{ backgroundColor: '#ef444415', border: '1px solid #ef444450', borderRadius: '8px', padding: '16px', color: '#f87171' }}>
          {error}
        </div>
      ) : filteredLists.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No Price Lists Found"
          description={
            search
              ? 'No price lists match your filter query.'
              : 'You have not created any price lists yet. Price lists allow you to define tiered discounts or wholesale rates.'
          }
          actionLabel="Create First Price List"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>PRICE LIST NAME</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>TIER TYPE</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>DISCOUNT %</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>CURRENCY</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLists.map((pl) => (
                <tr key={pl.id} style={{ borderBottom: '1px solid #33415550', transition: 'background-color 0.15s ease' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{pl.name}</div>
                    {pl.description && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{pl.description}</div>}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: pl.tier_type === 'WHOLESALE' ? '#0284c720' : '#a855f720',
                        color: pl.tier_type === 'WHOLESALE' ? '#38bdf8' : '#c084fc',
                        border: `1px solid ${pl.tier_type === 'WHOLESALE' ? '#0284c740' : '#a855f740'}`
                      }}
                    >
                      {pl.tier_type}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#4ade80', fontWeight: 600 }}>
                    {parseFloat(pl.discount_pct) > 0 ? `${pl.discount_pct}% OFF` : 'Standard Base'}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>{pl.currency}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '12px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
                      Active
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(pl.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '4px',
                        transition: 'color 0.15s'
                      }}
                      title="Delete Price List"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>Create Price List</h2>
            <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '13px' }}>
              Define pricing tiers for specific merchant channels or customer segments.
            </p>

            <form onSubmit={handleCreatePriceList}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Price List Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Wholesale B2B Tier 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Tier Type
                  </label>
                  <select
                    value={tierType}
                    onChange={(e) => setTierType(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="VIP">VIP Customer</option>
                    <option value="RETAIL">Custom Retail</option>
                    <option value="CONTRACT">Corporate Contract</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Description / Channel Terms
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Applicable for minimum order quantities above 50 units."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#0284c7',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Creating...' : 'Create Price List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceLists;
