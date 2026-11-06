import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  ExternalLink,
  Edit3,
  Layers,
  Palette,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  Sliders
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { getStoreUrl } from '../utils/subdomain';
import { Skeleton } from '../components/common/SkeletonLoader';
import styles from './OnlineStoreOverview.module.css';

export const OnlineStoreOverview: React.FC = () => {
  const navigate = useNavigate();
  const rootDomain = (import.meta.env.VITE_ROOT_DOMAIN || 'chandraprakash.codes').toLowerCase();
  const storeSlug = useAuthStore((s) => s.storeSlug) || (typeof window !== 'undefined' ? localStorage.getItem('billionbiz_store_slug') : null) || 'chandru';
  const platformDomain = `${storeSlug}.${rootDomain}`;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const [storeDataLoaded, setStoreDataLoaded] = useState(false);
  const [pagesCount, setPagesCount] = useState<{ total: number; system: number; custom: number } | null>(null);
  const [provisioning, setProvisioning] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);
  const [validation, setValidation] = useState<{ canPublish: boolean; issues: any[] } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [renderRes, pagesRes, valRes, provisioningRes] = await Promise.allSettled([
        apiClient<any>('/storefront/render'),
        apiClient<any>('/storefront/pages'),
        apiClient<any>('/storefront/validate-publish'),
        apiClient<any>('/storefront/provisioning/status')
      ]);

      if (renderRes.status === 'fulfilled' && renderRes.value && renderRes.value.store) {
        setStoreData(renderRes.value);
      } else {
        try {
          const bySlug = await apiClient<any>(`/storefront/by-slug/${storeSlug}`);
          if (bySlug && bySlug.store) setStoreData(bySlug);
        } catch (e) {
          console.warn('Fallback by-slug failed:', e);
        }
      }
      setStoreDataLoaded(true);

      if (pagesRes.status === 'fulfilled' && Array.isArray(pagesRes.value?.pages)) {
        const pages = pagesRes.value.pages;
        setPagesCount({ total: pages.length, system: pages.filter((p: any) => p.is_system).length, custom: pages.filter((p: any) => !p.is_system).length });
      } else setPagesCount(null);

      if (provisioningRes.status === 'fulfilled') setProvisioning(provisioningRes.value);
      else setProvisioning(null);

      if (valRes.status === 'fulfilled' && valRes.value) {
        setValidation(valRes.value);
      }
      if ([renderRes, pagesRes, valRes, provisioningRes].every((result) => result.status === 'rejected')) {
        setLoadError('Store status could not be loaded. Check your connection and retry.');
      }
    } catch (err) {
      console.error('Failed to load online store overview data:', err);
      setLoadError(err instanceof Error ? err.message : 'Store status could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeSlug]);

  const liveStoreUrl = getStoreUrl(storeSlug);
  const liveReady = provisioning?.status === 'LIVE' && provisioning?.domainStatus === 'ACTIVE' && provisioning?.httpsStatus === 'ACTIVE';
  const localHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const localSharedPreviewUrl = localHost ? `/store/${encodeURIComponent(storeSlug)}` : null;
  const storefrontUrl = liveReady ? liveStoreUrl : provisioning?.previewUrl || localSharedPreviewUrl;
  const previewAvailable = Boolean(provisioning?.previewUrl || localSharedPreviewUrl);
  const policyWarnings = validation?.issues.some((issue) => issue.code === 'INCOMPLETE_POLICIES') ?? false;
  const showStatusSkeleton = loading && !provisioning;
  const showStoreSkeleton = loading && !storeDataLoaded;
  const showPagesSkeleton = loading && !pagesCount;
  const retryProvisioning = async () => {
    setRetrying(true);
    try { await apiClient('/storefront/provisioning/retry', { method: 'POST', body: JSON.stringify({}) }); await loadData(); }
    catch (error) {
      console.error('Store provisioning retry failed:', error);
      setLoadError(error instanceof Error ? error.message : 'Could not retry storefront checks.');
    }
    finally { setRetrying(false); }
  };

  return (
    <div className={styles.overviewContainer}>
      {/* Top Banner & Header */}
      <div className={styles.topBanner}>
        <div className={styles.headerTextGroup}>
          <div className={styles.headerTitleRow}>
            <h1 className={styles.pageTitle}>Online Store</h1>
            <span className={styles.liveBadge} style={!liveReady ? { background: '#fff7ed', color: '#9a3412', borderColor: '#fed7aa' } : undefined}>
              <span className={styles.liveDot} style={!liveReady ? { background: '#d97706' } : undefined} />
              {showStatusSkeleton ? 'Checking storefront status…' : liveReady ? 'Live · DNS & HTTPS verified' : provisioning?.status === 'LOCAL_READY' ? 'Preview ready · domain pending' : provisioning ? 'Store setup needs attention' : 'Store status unavailable'}
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            Manage your customer-facing website, branding, themes, pages, and domain resolution.
          </p>
        </div>

        <div className={styles.headerActions}>
          {!liveReady && provisioning && <button type="button" onClick={() => void retryProvisioning()} disabled={retrying} className={styles.btnOutline}>
            <RefreshCw size={15} className={retrying ? 'animate-spin' : ''} />
            <span>{retrying ? 'Checking…' : 'Retry domain check'}</span>
          </button>}
          {storefrontUrl ? <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnOutline}
          >
            <Globe size={16} />
            <span>{liveReady ? 'View Live Store' : 'Open Store Preview'}</span>
            <ExternalLink size={14} style={{ color: '#94a3b8' }} />
          </a> : <button type="button" disabled className={styles.btnOutline} title="Configure the shared storefront preview runtime URL to open a preview here."><Globe size={16} /><span>Preview runtime unavailable</span></button>}
          <button
            onClick={() => navigate('/editor/pages')}
            className={styles.btnPrimary}
          >
            <Edit3 size={16} />
            <span>Open Store Editor</span>
          </button>
        </div>
      </div>

      {/* Primary KPI & Health Cards */}
      <div className={styles.kpiGrid}>
        {/* Domain Status */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Subdomain</span>
            {liveReady ? <ShieldCheck size={16} style={{ color: '#059669' }} /> : <AlertTriangle size={16} style={{ color: '#d97706' }} />}
          </div>
          <div className={styles.kpiValue} title={platformDomain}>
            {showStatusSkeleton ? <Skeleton width="85%" height={24} /> : platformDomain}
          </div>
          <div className={styles.kpiSub}>
            {liveReady ? <CheckCircle2 size={13} style={{ color: '#059669' }} /> : <Clock size={13} style={{ color: '#d97706' }} />}
            <span className={liveReady ? styles.kpiSuccess : ''}>{showStatusSkeleton ? 'Checking DNS and HTTPS…' : provisioning?.error || (provisioning ? 'Waiting for DNS and HTTPS verification' : 'Store status unavailable')}</span>
          </div>
        </div>

        {/* Publication Status */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Publication</span>
            <Clock size={16} style={{ color: '#2563eb' }} />
          </div>
          <div className={styles.kpiValue}>
            {showStoreSkeleton ? <Skeleton width={130} height={26} /> : storeData?.releaseNumber ? `Release #${storeData.releaseNumber}` : storeDataLoaded && storeData ? 'No live release' : 'Publication status unavailable'}
          </div>
          <div className={styles.kpiSub}>
            <span>{showStoreSkeleton ? <Skeleton width={150} height={14} /> : storeData?.releaseNumber ? 'Saved release snapshot' : storeDataLoaded && storeData ? 'Publish your store to create a release' : 'Published store data could not be loaded'}</span>
          </div>
        </div>

        {/* Active Theme */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Active Theme</span>
            <Palette size={16} style={{ color: '#7c3aed' }} />
          </div>
          <div className={styles.kpiValue} style={{ textTransform: 'capitalize' }}>
            {showStoreSkeleton ? <Skeleton width={100} height={26} /> : storeData?.theme?.preset_name || (storeDataLoaded && storeData ? 'Custom styles' : 'Theme unavailable')}
          </div>
          <div className={styles.kpiSub}>
            <span>Customizable in Design tab</span>
          </div>
        </div>

        {/* Total Page Catalog */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Page Catalog</span>
            <Layers size={16} style={{ color: '#083e47' }} />
          </div>
          <div className={styles.kpiValue}>
            {showPagesSkeleton ? <Skeleton width={100} height={26} /> : pagesCount ? `${pagesCount.total} Pages` : 'Page catalog unavailable'}
          </div>
          <div className={styles.kpiSub}>
            <span>{showPagesSkeleton ? <Skeleton width={130} height={14} /> : pagesCount ? `${pagesCount.system} system locked · ${pagesCount.custom} custom` : 'Page catalog could not be loaded'}</span>
          </div>
        </div>
      </div>

      {loadError && <div role="alert" className={styles.sectionCard} style={{ borderColor: '#fed7aa', color: '#9a3412' }}>
        <strong>Some store information is unavailable.</strong> {loadError} <button type="button" onClick={() => void loadData()} className={styles.btnOutline} style={{ marginLeft: 8 }}>Retry</button>
      </div>}

      {/* Pre-Publish Checklist & Setup Warnings */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Sparkles size={18} style={{ color: '#d97706' }} />
            Storefront Launch Readiness Checklist
          </h2>
          <button
            onClick={loadData}
            className={styles.refreshBtn}
            title="Refresh status"
          >
            <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
        </div>

        <div className={styles.checklistGrid}>
          <div className={styles.checklistItem}>
            {showStatusSkeleton ? <Skeleton width={18} height={18} borderRadius="50%" /> : liveReady ? <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />}
            <div>
              <p className={styles.checklistTitle}>Wildcard Store Address</p>
              <p className={styles.checklistDesc}>{showStatusSkeleton ? <Skeleton width={220} height={13} /> : liveReady ? 'Hostname resolves to the shared runtime and HTTPS is ready.' : provisioning?.domain ? 'Hostname is assigned; DNS and HTTPS checks have not both passed yet.' : 'Store hostname status is unavailable.'}</p>
            </div>
          </div>

          <div className={styles.checklistItem}>
            {showPagesSkeleton ? <Skeleton width={18} height={18} borderRadius="50%" /> : pagesCount?.system ? <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />}
            <div>
              <p className={styles.checklistTitle}>System Page Catalog</p>
              <p className={styles.checklistDesc}>{showPagesSkeleton ? <Skeleton width={260} height={13} /> : pagesCount ? pagesCount.system ? `${pagesCount.system} system pages are available for commerce, checkout, policies, and account workflows.` : 'No system pages are configured.' : 'Page catalog could not be verified.'}</p>
            </div>
          </div>

          <div className={styles.checklistItem}>
            {!validation ? <Skeleton width={18} height={18} borderRadius="50%" /> : validation.canPublish && !policyWarnings ? <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />}
            <div>
              <p className={styles.checklistTitle}>Policy Content Check</p>
              <p className={styles.checklistDesc}>{!validation ? <Skeleton width={230} height={13} /> : policyWarnings ? 'Complete the required Privacy, Terms, and Refund policy content in Pages manager.' : 'Automated publish checks passed. Review the policy text before launch.'}</p>
            </div>
          </div>

          <div className={styles.checklistItem}>
            {showStatusSkeleton ? <Skeleton width={18} height={18} borderRadius="50%" /> : previewAvailable ? <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />}
            <div>
              <p className={styles.checklistTitle}>Storefront Preview Runtime</p>
              <p className={styles.checklistDesc}>{showStatusSkeleton ? <Skeleton width={250} height={13} /> : previewAvailable ? 'A preview address is configured for this store.' : 'Preview runtime URL is unavailable in this environment.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className={styles.navGrid}>
        {/* Pages Manager */}
        <div
          onClick={() => navigate('/online-store/pages')}
          className={styles.navCard}
        >
          <div className={`${styles.navIconWrap} ${styles.navIconBlue}`}>
            <Layers size={22} />
          </div>
          <div>
            <h3 className={styles.navCardTitle}>
              Pages Manager
            </h3>
            <p className={styles.navCardDesc}>
              Browse system locked pages, manage custom content pages, duplicate, and edit SEO.
            </p>
          </div>
          <div className={styles.navCardLink}>
            <span>Manage Pages</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Store Editor */}
        <div
          onClick={() => navigate('/editor/pages')}
          className={styles.navCard}
        >
          <div className={`${styles.navIconWrap} ${styles.navIconPurple}`}>
            <Edit3 size={22} />
          </div>
          <div>
            <h3 className={styles.navCardTitle}>
              Visual Store Editor
            </h3>
            <p className={styles.navCardDesc}>
              Four tab experience: Pages, Brand, Design tokens, and Online Store Settings.
            </p>
          </div>
          <div className={styles.navCardLink}>
            <span>Open 4-Tab Editor</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Header & Footer Editor */}
        <div
          onClick={() => navigate('/editor/pages?pageId=header-global')}
          className={styles.navCard}
        >
          <div className={`${styles.navIconWrap} ${styles.navIconGreen}`}>
            <Sliders size={22} />
          </div>
          <div>
            <h3 className={styles.navCardTitle}>
              Header &amp; Footer
            </h3>
            <p className={styles.navCardDesc}>
              Customize universal navigation bars, announcers, columns, and brand badges.
            </p>
          </div>
          <div className={styles.navCardLink}>
            <span>Customize Chrome</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineStoreOverview;
