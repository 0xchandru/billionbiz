import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Clock, ArrowLeft, Sparkles } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  moduleName?: string;
  description: string;
  icon: LucideIcon;
  backUrl?: string;
  backLabel?: string;
  badgeText?: string;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  moduleName,
  description,
  icon: Icon,
  backUrl = '/dashboard',
  backLabel = 'Back to Dashboard',
  badgeText = 'Under Active Development'
}) => {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px', fontFamily: 'inherit' }}>
      {/* Back button */}
      <Link
        to={backUrl}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#64748b',
          fontSize: '13px',
          fontWeight: 600,
          textDecoration: 'none',
          marginBottom: '24px'
        }}
      >
        <ArrowLeft size={16} />
        <span>{backLabel}</span>
      </Link>

      {/* Main card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '56px 36px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Module Icon Container */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            backgroundColor: 'rgba(8, 62, 71, 0.08)',
            color: '#083e47',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}
        >
          <Icon size={34} />
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '9999px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '16px'
          }}
        >
          <Sparkles size={13} />
          <span>{badgeText}</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 700,
            color: '#083e47',
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em'
          }}
        >
          {title}
        </h1>

        {moduleName && (
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2563eb', marginBottom: '12px' }}>
            {moduleName}
          </div>
        )}

        {/* Description */}
        <p
          style={{
            fontSize: '15px',
            color: '#64748b',
            maxWidth: '520px',
            margin: '0 auto 28px',
            lineHeight: 1.6
          }}
        >
          {description}
        </p>

        {/* Timeline Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            color: '#475569',
            marginBottom: '32px'
          }}
        >
          <Clock size={15} style={{ color: '#083e47' }} />
          <span>Scheduled for release in the next platform update</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to={backUrl}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#083e47',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(8, 62, 71, 0.2)'
            }}
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;

