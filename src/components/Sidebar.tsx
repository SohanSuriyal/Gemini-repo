import React, { useEffect, useState, useRef } from 'react';
import {
  Home,
  LayoutGrid,
  SquarePen,
  Clock,
  Star,
  Settings,
  Moon,
  Sun,
  ChevronsLeft,
  ChevronsRight,
  X,
  Upload,
} from 'lucide-react';
import { NavPage } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { loadBrandingSettings, BrandingSettingsData, DEFAULT_THUNDER_CHARACTER } from './BrandingSettings';
import { removeImageBackground } from '../utils/imageProcessing';

export interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  compact?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  darkMode,
  onToggleDarkMode,
  compact = false,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [branding, setBranding] = useState<BrandingSettingsData>(loadBrandingSettings);
  const [imgError, setImgError] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refreshBranding = () => {
      setBranding(loadBrandingSettings());
      setImgError(false);
    };
    window.addEventListener('ns-branding-updated', refreshBranding);
    return () => window.removeEventListener('ns-branding-updated', refreshBranding);
  }, []);

  const navItems = [
    { id: 'dashboard' as NavPage, label: 'Dashboard', icon: Home },
    { id: 'subjects' as NavPage, label: 'Subjects', icon: LayoutGrid },
    { id: 'notes' as NavPage, label: 'Notes', icon: SquarePen },
    { id: 'recent' as NavPage, label: 'Recent', icon: Clock },
    { id: 'favorites' as NavPage, label: 'Favorites', icon: Star },
    { id: 'settings' as NavPage, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (pageId: NavPage) => {
    onSelectPage(pageId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleQuickUpload = async (file: File) => {
    if (!file) return;
    setIsProcessingUpload(true);
    try {
      const transparentPng = await removeImageBackground(file);
      const newBranding: BrandingSettingsData = {
        ...branding,
        dataUrl: transparentPng,
        fileName: file.name,
      };
      localStorage.setItem('ns_branding', JSON.stringify(newBranding));
      setBranding(newBranding);
      window.dispatchEvent(new Event('ns-branding-updated'));
    } catch (e) {
      console.error('Failed to process image:', e);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Determine current image source (PNG with transparent background)
  const mascotSrc = imgError
    ? `${import.meta.env.BASE_URL || '/'}thunder-character.png`
    : branding.dataUrl || DEFAULT_THUNDER_CHARACTER;

  const mascotSize = Math.min(Math.max(branding.size || 96, 56), 130);

  return (
    <>
      {/* Hidden file input to allow quick replacement of the character PNG */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleQuickUpload(f);
          e.target.value = '';
        }}
      />

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        id="app-main-sidebar"
        className={`
          flex flex-col border-r select-none z-50
          transition-all duration-200 ease-in-out
          ${
            darkMode
              ? 'bg-[#18181b] border-zinc-800 text-zinc-200'
              : 'bg-white border-[#EAECF0] text-gray-700'
          }
          /* Desktop layout: in-flow sticky/static */
          md:relative md:translate-x-0 md:h-screen md:min-h-screen
          ${collapsed ? 'md:w-[72px] md:px-2' : 'md:w-[240px] md:px-3.5'}
          /* Mobile layout: overlay drawer */
          fixed inset-y-0 left-0 h-full w-[260px] px-3.5 shadow-2xl md:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${compact ? 'py-2' : 'py-3'}
          flex-shrink-0 overflow-y-auto overflow-x-hidden
        `}
      >
        {/* Top Character Section (Only girl appears, no background box, no text) */}
        <div
          id="sidebar-branding-header"
          className="relative flex flex-col items-center justify-center transition-all duration-200 mb-3 pt-1"
        >
          {/* Mobile close button (visible only on mobile) */}
          {onCloseMobile && (
            <button
              id="sidebar-mobile-close-btn"
              onClick={onCloseMobile}
              className={`md:hidden absolute top-0 right-0 p-1.5 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  : 'border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700'
              }`}
              title="Close navigation"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Desktop Collapse Toggle Button */}
          <button
            id="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden md:flex absolute right-0 top-0 p-1 rounded-lg border transition-colors z-10 ${
              darkMode
                ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>

          {/* Expanded View: Transparent Girl Mascot Only (No background, No text) */}
          <div
            className={`w-full flex flex-col items-center text-center cursor-pointer group ${
              collapsed ? 'md:hidden' : 'flex'
            }`}
            onClick={() => handleNavClick('dashboard')}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (file) handleQuickUpload(file);
            }}
            title="Dashboard"
          >
            <div
              style={{
                width: mascotSize,
                height: mascotSize,
              }}
              className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            >
              {isProcessingUpload ? (
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <img
                  id="sidebar-mascot-image-expanded"
                  src={mascotSrc}
                  alt="Character"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain filter drop-shadow-sm select-none"
                />
              )}

              {/* Subtle hover upload hint to easily switch to any new character PNG */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                title="Change Character PNG (Background auto-removed)"
              >
                <Upload className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Collapsed View: Transparent Girl Mascot Only (No background box) */}
          <div
            className={`hidden ${
              collapsed ? 'md:flex' : 'hidden'
            } flex-col items-center cursor-pointer group`}
            onClick={onToggleCollapse}
            title="Click to expand"
          >
            <div className="w-10 h-10 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <img
                id="sidebar-mascot-image-collapsed"
                src={mascotSrc}
                alt="Character"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-contain filter drop-shadow-sm select-none"
              />
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav id="sidebar-nav-items" className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 px-3 ${compact ? 'py-1.5' : 'py-2'} rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? darkMode
                      ? 'bg-[#27272a] text-amber-400 shadow-xs'
                      : 'bg-amber-50 text-amber-800 shadow-xs'
                    : darkMode
                    ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${collapsed ? 'md:justify-center md:px-2' : ''}`}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <Icon
                  className={`w-[19px] h-[19px] flex-shrink-0 ${
                    isActive
                      ? darkMode
                        ? 'text-amber-400'
                        : 'text-amber-600'
                      : darkMode
                      ? 'text-zinc-400'
                      : 'text-gray-500'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
                <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: PWA Install & Theme Switcher */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
          {/* PWA Install Button */}
          <div className={collapsed ? 'md:hidden' : 'px-1'}>
            <PWAInstallButton variant="sidebar" darkMode={darkMode} />
          </div>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleDarkMode}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              darkMode
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${collapsed ? 'md:justify-center md:px-2' : ''}`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="w-[19px] h-[19px] text-amber-400 flex-shrink-0" strokeWidth={1.75} />
            ) : (
              <Moon className="w-[19px] h-[19px] text-gray-500 flex-shrink-0" strokeWidth={1.75} />
            )}
            <span className={collapsed ? 'md:hidden' : ''}>
              {darkMode ? 'Light mode' : 'Dark mode'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
