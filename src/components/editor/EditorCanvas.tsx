import React, { useRef, useState, useEffect, Suspense, lazy } from 'react';
import { useLandingEditorStore } from '../../store/landingEditorStore';
import { useSiteStore } from '../../store/siteStore';
import { PageRenderer } from './PageRenderer';
import styles from '../../pages/editor/EditorLayout.module.css';

const SettingsRenderer = lazy(() => import('./SettingsRenderer').then(m => ({ default: m.SettingsRenderer })));
const StoreBrandRenderer = lazy(() => import('./StoreBrandRenderer').then(m => ({ default: m.StoreBrandRenderer })));
const SeoGrowthRenderer = lazy(() => import('./SeoGrowthRenderer').then(m => ({ default: m.SeoGrowthRenderer })));

import { AddComponentModal } from './engine/AddComponentModal';
import { PresetModal } from './engine/PresetModal';
import { WebsitePreview } from './WebsitePreview';

import { useEditorContextStore } from '../../store/editorContextStore';
import { scrollPreviewToHeaderSection, scrollPreviewToFooterSection, scrollPreviewToSection } from './utils/previewScroll';

export const EditorCanvas: React.FC = () => {
   const { 
     isRightSidebarOpen, 
     isLeftSidebarCollapsed,
     isFullPageMode,
     setFullPageMode,
     activePanel, 
     device, 
     setDevice,
     selectedPageId, 
     selectedSectionId,
     designSection, 
     pagesNavLevel 
   } = useLandingEditorStore();
   const { selectedTarget } = useEditorContextStore();
   const { pages, theme, settings } = useSiteStore();
   const containerRef = useRef<HTMLDivElement>(null);
   const [containerSize, setContainerSize] = useState({ 
      width: typeof window !== 'undefined' ? window.innerWidth : 1280, 
      height: typeof window !== 'undefined' ? window.innerHeight : 800 
   });
   const [isScrolled, setIsScrolled] = useState(false);

   useEffect(() => {
      const resizeObserver = new ResizeObserver((entries) => {
         for (const entry of entries) {
            setContainerSize({
               width: entry.contentRect.width,
               height: entry.contentRect.height
            });
         }
      });

      if (containerRef.current) {
         resizeObserver.observe(containerRef.current);
      }

      return () => resizeObserver.disconnect();
   }, []);

   // Scroll preview intelligently when switching or opening a particular page editor
   useEffect(() => {
      if (selectedPageId === 'footer-global') {
         const targetId = selectedSectionId || (selectedTarget?.type === 'row' ? selectedTarget.rowId : undefined);
         scrollPreviewToFooterSection(targetId || 'footer-main');
         return;
      }
      if (selectedPageId === 'header-global') {
         const targetId = selectedSectionId || (selectedTarget?.type === 'row' ? selectedTarget.rowId : undefined);
         scrollPreviewToHeaderSection(targetId || 'header-main');
         return;
      }
      if (selectedSectionId && selectedPageId === 'landing-page') {
         scrollPreviewToSection(selectedSectionId);
         return;
      }
      const wrappers = document.querySelectorAll(`.${styles.canvasWrapper}`);
      wrappers.forEach((el) => {
         el.scrollTop = 0;
         el.classList.remove(styles.isScrolled);
      });
      setIsScrolled(false);
   }, [selectedPageId, pagesNavLevel, activePanel]);

   const renderPreviewContent = (deviceType: 'desktop' | 'tablet' | 'mobile', availableWidth: number, availableHeight: number) => {
      let targetWidth: number;
      let scale = 1;

      if (deviceType === 'mobile') {
         targetWidth = 375;
         scale = Math.min(1, availableWidth / targetWidth);
      } else if (deviceType === 'tablet') {
         targetWidth = 768;
         scale = Math.min(1, availableWidth / targetWidth);
      } else {
         // Desktop sizing rule:
         // 1. Min width is 1280px (even on screens < 1280px, it renders at 1280px and scales down).
         // 2. Max width is 1440px (on screens > 1440px, capped at 1440px max).
         // 3. Between 1280px and 1440px: preview expands to screen size (targetWidth = availableWidth, scale = 1).
         const MIN_DESKTOP_WIDTH = 1280;
         const MAX_DESKTOP_WIDTH = 1440;

         if (availableWidth >= MAX_DESKTOP_WIDTH) {
            targetWidth = MAX_DESKTOP_WIDTH;
            scale = 1;
         } else if (availableWidth >= MIN_DESKTOP_WIDTH) {
            targetWidth = Math.floor(availableWidth);
            scale = 1;
         } else {
            targetWidth = MIN_DESKTOP_WIDTH;
            scale = Math.min(1, availableWidth / MIN_DESKTOP_WIDTH);
         }
      }

      const paddingY = isFullPageMode ? 0 : 20;
      const visualHeight = Math.max(availableHeight - paddingY, 360);
      const domHeight = visualHeight / scale;
      const isEdgeToEdge = isFullPageMode && targetWidth >= availableWidth;
      const isGlobalComponent = Boolean(selectedPageId && selectedPageId.endsWith('-global'));
      const homePage = pages.find(p => p.id === 'landing-page') || pages[0];
      // If viewing All Pages list, or design panel, or global component, or no page selected -> always preview homePage
      const previewPage = (pagesNavLevel === 'list' || !selectedPageId || activePanel === 'design' || activePanel === 'design-experience' || isGlobalComponent)
         ? homePage
         : (pages.find(p => p.id === selectedPageId) || homePage);

      return (
         <div style={{
            width: `${availableWidth}px`,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            padding: isFullPageMode ? 0 : `${paddingY / 2}px 0`,
         }}>
            <div style={{
               width: `${targetWidth * scale}px`,
               height: `${domHeight * scale}px`,
               overflow: 'hidden'
            }}>
               <div style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: `${targetWidth}px`,
                  height: `${domHeight}px`,
               }}>
                  <div 
                     key={`${deviceType}-${previewPage?.id || 'home'}`}
                     id="editor-preview-scroll-container"
                     data-preview-scroll-container="true"
                     className={`${styles.canvasWrapper} ${isScrolled ? styles.isScrolled : ''}`}
                     onClickCapture={(e) => {
                        const target = e.target as HTMLElement;
                        const link = target.closest('a');
                        if (link) {
                           e.preventDefault();
                        }
                     }}
                     onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const scrolled = target.scrollTop > 10;
                        setIsScrolled(scrolled);
                        target.classList.toggle(styles.isScrolled, scrolled);
                     }}
                     style={{
                        width: '100%',
                        height: '100%',
                        margin: '0',
                        position: 'relative',
                        overflowY: 'auto',
                        borderRadius: isEdgeToEdge ? 0 : undefined,
                        boxShadow: isEdgeToEdge ? 'none' : undefined,
                     }}
                  >
               <PageRenderer page={previewPage} overrideDevice={deviceType} />

               {/* Live Loader Animation Overlay when in Loader editor */}
               {(activePanel === 'design' || activePanel === 'design-experience') && designSection === 'loader' && (
                  <div style={{
                     position: 'absolute',
                     inset: 0,
                     zIndex: 99999,
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     backdropFilter: settings.loaderBg === 'blur' ? 'blur(12px)' : 'none',
                     backgroundColor: settings.loaderBg === 'solid'
                        ? (settings.loaderCustomBg || '#ffffff')
                        : settings.loaderBg === 'transparent'
                           ? 'transparent'
                           : 'rgba(255, 255, 255, 0.85)',
                     transition: 'all 0.2s ease',
                  }}>
                     <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '28px 36px',
                        borderRadius: '16px',
                        background: settings.loaderBg === 'transparent' ? 'rgba(255,255,255,0.92)' : 'transparent',
                        boxShadow: settings.loaderBg === 'transparent' ? '0 10px 25px -5px rgba(0,0,0,0.1)' : 'none',
                     }}>
                        {settings.loaderShowLogo && (
                           <div style={{
                              width: settings.loaderSize === 'large' ? '54px' : settings.loaderSize === 'small' ? '34px' : '44px',
                              height: settings.loaderSize === 'large' ? '54px' : settings.loaderSize === 'small' ? '34px' : '44px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, var(--theme-primary, #2563eb), #7c3aed)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: settings.loaderSize === 'large' ? '22px' : settings.loaderSize === 'small' ? '14px' : '18px',
                              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                           }}>
                              {settings.storeName ? settings.storeName.charAt(0).toUpperCase() : 'S'}
                           </div>
                        )}

                        {(settings.loaderStyle || 'spinner') === 'spinner' && (
                           <div style={{
                              width: settings.loaderSize === 'large' ? '52px' : settings.loaderSize === 'small' ? '24px' : '38px',
                              height: settings.loaderSize === 'large' ? '52px' : settings.loaderSize === 'small' ? '24px' : '38px',
                              border: '3.5px solid #e2e8f0',
                              borderTopColor: 'var(--theme-primary, #2563eb)',
                              borderRadius: '50%',
                              animation: 'canvasSpin 0.8s linear infinite',
                           }} />
                        )}

                        {settings.loaderStyle === 'dots' && (
                           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--theme-primary, #2563eb)', animation: 'canvasPulse 1s infinite 0s' }} />
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--theme-primary, #2563eb)', animation: 'canvasPulse 1s infinite 0.2s' }} />
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--theme-primary, #2563eb)', animation: 'canvasPulse 1s infinite 0.4s' }} />
                           </div>
                        )}

                        {settings.loaderStyle === 'pulse' && (
                           <div style={{
                              width: settings.loaderSize === 'large' ? '56px' : settings.loaderSize === 'small' ? '28px' : '42px',
                              height: settings.loaderSize === 'large' ? '56px' : settings.loaderSize === 'small' ? '28px' : '42px',
                              borderRadius: '50%',
                              background: 'rgba(37, 99, 235, 0.2)',
                              border: '2px solid var(--theme-primary, #2563eb)',
                              animation: 'canvasPing 1.2s cubic-bezier(0, 0, 0.2, 1) infinite'
                           }} />
                        )}

                        {settings.loaderStyle === 'progress' && (
                           <div style={{ width: '160px', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: '50%', height: '100%', background: 'var(--theme-primary, #2563eb)', borderRadius: '999px', animation: 'canvasIndeterminate 1.5s infinite ease-in-out' }} />
                           </div>
                        )}

                        {settings.loaderShowText !== false && (
                           <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600, letterSpacing: '0.01em' }}>
                              {settings.loaderLoadingText || 'Loading...'}
                           </span>
                        )}
                     </div>
                     <style>{`
                        @keyframes canvasSpin { to { transform: rotate(360deg); } }
                        @keyframes canvasPulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
                        @keyframes canvasPing { 75%, 100% { transform: scale(1.6); opacity: 0; } }
                        @keyframes canvasIndeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
                     `}</style>
                  </div>
               )}
            </div>
         </div>
      </div>
      </div>
   );
   };

   // ─── Determine what to render in the canvas ───
   const renderCanvasContent = () => {

      const renderFallback = (
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: '#64748b', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: 'var(--primary, #2563eb)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
               <span>Loading view...</span>
            </div>
         </div>
      );

      switch (activePanel) {
         case 'settings':
            return (
               <Suspense fallback={renderFallback}>
                  <SettingsRenderer />
               </Suspense>
            );
         case 'brand':
         case 'store-brand':
            return (
               <Suspense fallback={renderFallback}>
                  <StoreBrandRenderer />
               </Suspense>
            );
         case 'seo-growth':
            return (
               <Suspense fallback={renderFallback}>
                  <SeoGrowthRenderer />
               </Suspense>
            );
         case 'pages': {
            const isGlobalHeader = selectedPageId === 'header-global';
            const isGlobalFooter = selectedPageId === 'footer-global';

            return (
               <div style={{ width: '100%', height: '100%', overflowX: 'hidden', overflowY: 'auto' }}>
                  <WebsitePreview
                     highlightSection={isGlobalHeader ? 'header' : isGlobalFooter ? 'footer' : null}
                  />
               </div>
            );
         }
         case 'design':
         case 'design-experience':
         default: {
            return (
               <div style={{ width: '100%', height: '100%', overflowX: 'hidden', overflowY: 'auto' }}>
                  <WebsitePreview />
               </div>
            );
            /* Legacy preview fallback */
            const isExpandedMode = isFullPageMode || (!isRightSidebarOpen && isLeftSidebarCollapsed);
            // When focus mode is enabled or sidebars are collapsed & hidden, use the full container width
            // Otherwise leave a subtle 24px gutter around the canvas
            const availableCanvasWidth = isExpandedMode
               ? containerSize.width
               : Math.max(containerSize.width - (containerSize.width <= 1024 ? 12 : 24), 320);

            // Page preview with device switching
            return (
               <div style={{ width: '100%', height: '100%', overflowY: 'hidden' }}>
                   {device === 'all' ? (
                      <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center', padding: '0 16px', height: '100%' }}>
                         {(() => {
                            const netAvailableWidth = containerSize.width - 80; // 32px padding + 48px gaps
                            const totalTargetWidth = 1280 + 768 + 375;
                            const scale = Math.min(1, netAvailableWidth / totalTargetWidth);
                            
                            return (
                               <>
                                  <div 
                                     style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                                     onClick={() => {
                                        setDevice('desktop');
                                        setFullPageMode(false);
                                     }}
                                     title="Click to switch to Desktop view (normal mode)"
                                  >
                                     <div style={{ padding: '4px 12px', marginBottom: '8px', fontSize: '11px', fontWeight: 600, color: '#475569', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', userSelect: 'none' }}>
                                        <span>Desktop (1280px)</span>
                                     </div>
                                     {renderPreviewContent('desktop', 1280 * scale, containerSize.height - 36)}
                                  </div>
                                  <div 
                                     style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                                     onClick={() => {
                                        setDevice('tablet');
                                        setFullPageMode(false);
                                     }}
                                     title="Click to switch to Tablet view (normal mode)"
                                  >
                                     <div style={{ padding: '4px 12px', marginBottom: '8px', fontSize: '11px', fontWeight: 600, color: '#475569', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', userSelect: 'none' }}>
                                        <span>Tablet (768px)</span>
                                     </div>
                                     {renderPreviewContent('tablet', 768 * scale, containerSize.height - 36)}
                                  </div>
                                  <div 
                                     style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                                     onClick={() => {
                                        setDevice('mobile');
                                        setFullPageMode(false);
                                     }}
                                     title="Click to switch to Mobile view (normal mode)"
                                  >
                                     <div style={{ padding: '4px 12px', marginBottom: '8px', fontSize: '11px', fontWeight: 600, color: '#475569', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', userSelect: 'none' }}>
                                        <span>Mobile (375px)</span>
                                     </div>
                                     {renderPreviewContent('mobile', 375 * scale, containerSize.height - 36)}
                                  </div>
                               </>
                            );
                         })()}
                      </div>
                   ) : (
                     renderPreviewContent(device as any, availableCanvasWidth, containerSize.height)
                  )}
               </div>
            );
         }
      }
   };

   return (
      <div
         ref={containerRef}
         className={`${styles.canvasArea} ${isRightSidebarOpen ? styles.canvasShrink : ''}`}
         style={{
            '--theme-primary': theme?.colors?.primary || '#198754',
            '--theme-secondary': theme?.colors?.secondary || '#ff6b00',
            '--theme-bg': theme?.colors?.background || '#ffffff',
            '--theme-text': theme?.colors?.text || '#0f172a'
         } as React.CSSProperties}
      >
         {renderCanvasContent()}
         {/* Phase 1: Section authoring widget safely retired from active editor */}
         <AddComponentModal />
         <PresetModal />
      </div>
   );
};
