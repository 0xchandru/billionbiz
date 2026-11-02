import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  DollarSign, 
  ShoppingCart, 
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api, type DashboardMetricsResponse } from '../api/services';
import { useAuthStore } from '../store/authStore';
import { useRealtime } from '../hooks/useRealtime';
import styles from './Dashboard.module.css';

const formatCurrency = (minor: number) => {
  return '₹' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getStatusBadgeClass = (status: string) => {
  switch(status.toUpperCase()) {
    case 'COMPLETED':
    case 'CAPTURED':
    case 'FULFILLED': return styles.badgeSuccess;
    case 'PROCESSING':
    case 'OPEN': return styles.badgeProcessing;
    case 'PENDING': return styles.badgePending;
    case 'CANCELLED': return styles.badgeCancelled;
    default: return '';
  }
};

const Dashboard = () => {
  const { storeName, onboardingChecklist: storeChecklist } = useAuthStore();
  const [data, setData] = useState<DashboardMetricsResponse | null>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await api.getDashboardMetrics();
      setData(metrics);

      // Load checklist
      const chk = await api.getOnboardingChecklist().catch(() => ({ checklist: [] }));
      setChecklist(chk.checklist?.length > 0 ? chk.checklist : storeChecklist);
    } catch (err: any) {
      console.error('[Dashboard] Error fetching real metrics:', err);
      setError(err.message || 'Unable to fetch dashboard telemetry. Please check server connectivity.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  useRealtime((event) => {
    if (['order.created', 'order.fulfilled', 'booking.created', 'payment.captured', 'inventory.updated'].includes(event.type)) {
      loadMetrics();
    }
  });

  const totalOrders = data?.metrics?.totalOrders || 0;
  const totalRevenue = data?.metrics?.totalRevenueMinor || 0;
  const avgOrderValue = data?.metrics?.avgOrderValueMinor || 0;
  const totalBookings = data?.metrics?.totalBookings || 0;

  const metricCards = [
    {
      title: 'Gross Orders',
      value: totalOrders.toString(),
      subtext: totalOrders === 0 ? 'No orders placed yet' : 'Total lifetime orders',
      icon: ShoppingBag,
      color: '#064652',
      bgColor: '#e6fffa'
    },
    {
      title: 'Net Revenue',
      value: formatCurrency(totalRevenue),
      subtext: totalRevenue === 0 ? 'Honest zero state' : 'Excluding refunds',
      icon: DollarSign,
      color: '#447515',
      bgColor: '#f0fdf4'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(avgOrderValue),
      subtext: totalOrders === 0 ? '₹0.00 baseline' : 'Per settled cart',
      icon: ShoppingCart,
      color: '#0369a1',
      bgColor: '#e0f2fe'
    },
    {
      title: 'Appointments Booked',
      value: totalBookings.toString(),
      subtext: totalBookings === 0 ? 'No bookings scheduled' : 'Confirmed reservations',
      icon: Clock,
      color: '#b45309',
      bgColor: '#fef3c7'
    }
  ];

  const pieColors: Record<string, string> = {
    COMPLETED: '#10b981',
    OPEN: '#0284c7',
    PENDING: '#f59e0b',
    CANCELLED: '#ef4444'
  };

  const pieData = (data?.orderStatusDistribution || []).map(item => ({
    name: item.status,
    value: parseInt(item.count, 10),
    color: pieColors[item.status] || '#64748b'
  }));

  // Completed steps calculation
  const completedSteps = checklist.filter(c => c.is_completed).length;

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Merchant Workspace: {storeName || 'My Store'}</h1>
          <p className={styles.subtitle}>
            Live operational telemetry from PostgreSQL. Real-time WebSocket sync enabled.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.datePickerBtn} onClick={loadMetrics} disabled={loading} title="Refresh Live Data">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error state if API fails (Never show fake data) */}
      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#991b1b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error}</span>
          </div>
          <button onClick={loadMetrics} style={{ backgroundColor: '#991b1b', color: '#fff', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            Retry Telemetry
          </button>
        </div>
      )}

      {/* Guided Onboarding Checklist Banner (Honest Milestone Progress) */}
      {checklist && checklist.length > 0 && completedSteps < checklist.length && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.75rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="#064652" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#064652', margin: 0 }}>
                Store Setup Checklist ({completedSteps} of {checklist.length} completed)
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
              {Math.round((completedSteps / checklist.length) * 100)}% complete
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            {checklist.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: item.is_completed ? '#f0fdf4' : '#f8fafc',
                  border: item.is_completed ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                }}
              >
                <CheckCircle2 size={18} color={item.is_completed ? '#22c55e' : '#cbd5e1'} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: item.is_completed ? '#166534' : '#334155' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {item.description || item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        {metricCards.map((metric, index) => (
          <div key={index} className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ backgroundColor: metric.bgColor, color: metric.color }}>
              <metric.icon size={24} />
            </div>
            <div className={styles.metricContent}>
              <p className={styles.metricTitle}>{metric.title}</p>
              <div className={styles.metricValues}>
                <h2 className={styles.metricValue}>{metric.value}</h2>
                <div className={styles.metricChange}>
                  <span style={{ color: '#64748b' }}>{metric.subtext}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts / Visuals Section */}
      <div className={styles.chartsGrid}>
        {/* Revenue Tile */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>Gross Revenue Timeline</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Store Currency: INR (₹)</span>
          </div>
          <div className={styles.chartContainer}>
            {totalRevenue === 0 ? (
              <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <DollarSign size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Zero Revenue Recorded</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Orders placed online or at the POS counter will render here.
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[{ name: 'Today', revenue: totalRevenue / 100 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `₹${val}`} />
                  <RechartsTooltip formatter={(val: any) => [`₹${val}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#064652" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>Order Status Breakdown</h3>
          </div>
          <div className={styles.donutContainer}>
            {pieData.length === 0 ? (
              <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <Package size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>No Orders Recorded</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Awaiting first checkout transaction
                </span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.donutCenter}>
                  <span className={styles.donutTotal}>{totalOrders}</span>
                  <span className={styles.donutLabel}>Orders</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className={styles.tablesGrid}>
        {/* Recent Orders */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h3>Recent Orders</h3>
            <Link to="/orders" className={styles.viewAll}>View all orders</Link>
          </div>
          <div className={styles.tableWrapper}>
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className={styles.orderNumber}>{order.order_number}</td>
                      <td>{order.customer_name}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={styles.orderTotal}>{formatCurrency(order.total_minor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <ShoppingBag size={32} color="#cbd5e1" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>No orders placed yet</p>
                <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '0.85rem' }}>
                  Orders placed through your online store or counter POS will appear here in real time.
                </p>
                <Link
                  to="/products"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#064652',
                    color: '#ffffff',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Add your first product
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h3>Top Performing Items</h3>
            <Link to="/products" className={styles.viewAll}>View catalog</Link>
          </div>
          <div className={styles.tableWrapper}>
            {data?.topProducts && data.topProducts.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((prod, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{prod.name}</td>
                      <td>{prod.orders_count}</td>
                      <td className={styles.orderTotal}>{formatCurrency(prod.revenue_minor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <Package size={32} color="#cbd5e1" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>No product sales recorded</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                  Best sellers will automatically rank here based on settled line items.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
