import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  DollarSign, 
  ShoppingCart, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Sparkles, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Bell, 
  ArrowRight, 
  Activity 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
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
import { DashboardSkeleton } from '../components/common/SkeletonLoader';
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

export const Dashboard = () => {
  const { storeName, onboardingChecklist: storeChecklist } = useAuthStore();
  const [data, setData] = useState<DashboardMetricsResponse | null>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const loadMetrics = async (period: '7d' | '30d' | '90d' | '1y' = selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await api.getDashboardMetrics(period);
      setData(metrics);

      // Load checklist
      const chk = await api.getOnboardingChecklist().catch(() => ({ checklist: [] }));
      setChecklist(chk.checklist?.length > 0 ? chk.checklist : storeChecklist || []);
    } catch (err: any) {
      console.error('[Dashboard] Error fetching real metrics:', err);
      setError(err.message || 'Unable to fetch dashboard telemetry. Please check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics(selectedPeriod);
  }, [selectedPeriod]);

  useRealtime((event) => {
    if (['order.created', 'order.fulfilled', 'booking.created', 'payment.captured', 'inventory.updated'].includes(event.type)) {
      loadMetrics(selectedPeriod);
    }
  });

  const m = data?.metrics;
  const totalOrders = m?.totalOrders || 0;
  const totalRevenue = m?.totalRevenueMinor || 0;
  const avgOrderValue = m?.avgOrderValueMinor || 0;
  const totalBookings = m?.totalBookings || 0;
  const totalCustomers = m?.totalCustomers || 0;
  const totalProducts = m?.totalProducts || 0;
  const pendingOrders = m?.pendingOrders || 0;
  const completedOrders = m?.completedOrders || 0;
  const cancelledOrders = m?.cancelledOrders || 0;
  const revenueGrowth = m?.revenueGrowth ?? 0;

  const metricCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      subtext: revenueGrowth !== 0 ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}% vs prev period` : 'Baseline revenue',
      icon: DollarSign,
      color: '#0d9488',
      bgColor: '#ccfbf1',
      trend: revenueGrowth
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      subtext: `${completedOrders} completed • ${pendingOrders} pending • ${cancelledOrders} cancelled`,
      icon: ShoppingBag,
      color: '#0284c7',
      bgColor: '#e0f2fe'
    },
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      subtext: 'Registered client profiles',
      icon: Users,
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    },
    {
      title: 'Total Bookings',
      value: totalBookings.toString(),
      subtext: 'Service appointments',
      icon: Calendar,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      title: 'Catalog Products',
      value: totalProducts.toString(),
      subtext: 'Active catalog items',
      icon: Package,
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(avgOrderValue),
      subtext: 'Per settled cart',
      icon: ShoppingCart,
      color: '#6366f1',
      bgColor: '#e0e7ff'
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
    value: parseInt(String(item.count), 10),
    color: pieColors[item.status] || '#64748b'
  }));

  // Chart data from real daily sales trends or fallback to current total
  const salesTrends = (data?.salesTrends && data.salesTrends.length > 0)
    ? data.salesTrends.map(t => ({
        date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: Math.round(t.revenue_minor / 100),
        orders: Number(t.orders_count)
      }))
    : [{ date: 'Current', revenue: Math.round(totalRevenue / 100), orders: totalOrders }];

  // Completed steps calculation
  const completedSteps = checklist.filter(c => c.is_completed).length;

  if (loading && !data) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: '1440px', margin: '0 auto' }}>
        <DashboardSkeleton />
      </div>
    );
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            {(['7d', '30d', '90d', '1y'] as const).map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: selectedPeriod === p ? '#ffffff' : 'transparent',
                  color: selectedPeriod === p ? '#0d9488' : '#64748b',
                  boxShadow: selectedPeriod === p ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <button className={styles.datePickerBtn} onClick={() => loadMetrics(selectedPeriod)} disabled={loading} title="Refresh Live Data">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error state if API fails */}
      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#991b1b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error}</span>
          </div>
          <button onClick={() => loadMetrics(selectedPeriod)} style={{ backgroundColor: '#991b1b', color: '#fff', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            Retry Telemetry
          </button>
        </div>
      )}

      {/* Guided Onboarding Checklist Banner */}
      {checklist && checklist.length > 0 && completedSteps < checklist.length && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#0d9488" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Store Setup Checklist ({completedSteps} of {checklist.length} completed)
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0d9488' }}>
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
                <CheckCircle2 size={16} color={item.is_completed ? '#10b981' : '#cbd5e1'} style={{ flexShrink: 0, marginTop: '2px' }} />
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

      {/* 6 Metric Cards Grid (3 per row) */}
      <div className={styles.metricsGrid}>
        {metricCards.map((metric, index) => (
          <div key={index} className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ backgroundColor: metric.bgColor, color: metric.color }}>
              <metric.icon size={20} />
            </div>
            <div className={styles.metricContent}>
              <p className={styles.metricTitle}>{metric.title}</p>
              <div className={styles.metricValues}>
                <h2 className={styles.metricValue}>{metric.value}</h2>
                <div className={styles.metricChange}>
                  {metric.trend !== undefined && metric.trend !== 0 && (
                    metric.trend > 0 ? (
                      <TrendingUp size={13} color="#10b981" style={{ marginRight: '4px' }} />
                    ) : (
                      <TrendingDown size={13} color="#ef4444" style={{ marginRight: '4px' }} />
                    )
                  )}
                  <span style={{ color: '#64748b' }}>{metric.subtext}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts / Visuals Section */}
      <div className={styles.chartsGrid}>
        {/* Sales & Revenue Trend Chart */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Sales & Revenue Trend</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Daily gross revenue ({selectedPeriod.toUpperCase()})</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: 600 }}>INR (₹)</span>
          </div>
          <div className={styles.chartContainer}>
            {totalRevenue === 0 && salesTrends.length <= 1 ? (
              <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <DollarSign size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Zero Revenue Recorded</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Orders placed online or at the POS counter will render here.
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={salesTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis tickFormatter={(val) => `₹${val}`} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(val: any) => [`₹${val}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>Order Status Breakdown</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{totalOrders} total</span>
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
          {pieData.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
              {pieData.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }} />
                  <span>{p.name}: {p.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tables Grid */}
      <div className={styles.tablesGrid}>
        {/* Recent Orders */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3>Recent Orders</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Latest customer transactions</span>
            </div>
            <Link to="/orders" className={styles.viewAll}>
              <span>View all</span>
              <ArrowRight size={13} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
            </Link>
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
                      <td className={styles.orderNumber}>
                        <Link to="/orders" style={{ color: '#0d9488', textDecoration: 'none', fontWeight: 600 }}>
                          {order.order_number}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#1e293b' }}>{order.customer_name}</div>
                        {order.customer_email && (
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{order.customer_email}</div>
                        )}
                      </td>
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
                    backgroundColor: '#0d9488',
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
            <div>
              <h3>Top Performing Items</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ranked by revenue</span>
            </div>
            <Link to="/products" className={styles.viewAll}>
              <span>Catalog</span>
              <ArrowRight size={13} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
            </Link>
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

      {/* Secondary Dashboard Sections: Recent Bookings & Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '24px' }}>
        {/* Recent Bookings */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#0d9488" />
                <span>Recent Bookings</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Client appointments</span>
            </div>
            <Link to="/appointments" className={styles.viewAll}>
              <span>All Bookings</span>
              <ArrowRight size={13} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
            </Link>
          </div>
          <div className={styles.tableWrapper} style={{ padding: '12px 16px' }}>
            {data?.recentBookings && data.recentBookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.recentBookings.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                        {b.customer_name} • {b.service_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Staff: {b.staff_name} • {new Date(b.start_time).toLocaleDateString()} at {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: b.status === 'CONFIRMED' ? '#e6fffa' : '#f1f5f9',
                          color: b.status === 'CONFIRMED' ? '#0d9488' : '#475569'
                        }}
                      >
                        {b.status}
                      </span>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                        {formatCurrency(b.total_minor)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <Calendar size={28} color="#cbd5e1" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#64748b', fontSize: '13px' }}>No bookings scheduled</p>
                <Link to="/appointments/new" style={{ color: '#0d9488', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: '6px' }}>
                  Create a new booking →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Notifications & Audit Activity */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#0d9488" />
                <span>Recent Activity & Alerts</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Store audit telemetry</span>
            </div>
          </div>
          <div className={styles.tableWrapper} style={{ padding: '12px 16px' }}>
            {data?.recentActivities && data.recentActivities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                      fontSize: '12px'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0d9488', marginTop: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{act.action}</span>
                      <span style={{ color: '#64748b' }}> on {act.target_type}</span>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {new Date(act.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <Bell size={28} color="#cbd5e1" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#64748b', fontSize: '13px' }}>All systems operational</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Audit events and important notifications will stream here automatically.
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
