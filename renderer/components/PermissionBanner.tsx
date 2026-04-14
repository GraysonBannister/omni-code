import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import './PermissionBanner.css';

interface Permission {
  name: string;
  granted: boolean;
  required: boolean;
  description: string;
  macosSetting?: string;
  windowsSetting?: string;
  linuxSetting?: string;
}

interface PermissionCheckResult {
  platform: string;
  allGranted: boolean;
  permissions: Permission[];
  error?: string;
}

// Permissions that can be auto-requested without navigating to Settings manually
const AUTO_GRANTABLE: Record<string, boolean> = {
  'Accessibility': true,           // macOS: triggers native dialog via isTrustedAccessibilityClient
  'PowerShell Execution Policy': true, // Windows: can be set via PowerShell
  'Windows Firewall': true,        // Windows: can add rule (needs admin)
};

// Whether a permission benefits from showing a "Grant" button vs just "Open Settings"
function canAutoGrant(name: string): boolean {
  return !!AUTO_GRANTABLE[name];
}

interface PermissionBannerProps {
  onPermissionsChange?: (allGranted: boolean) => void;
}

export const PermissionBanner: React.FC<PermissionBannerProps> = ({ onPermissionsChange }) => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [grantingPermission, setGrantingPermission] = useState<string | null>(null);

  const checkPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI!.system.checkPermissions();
      setPermissionStatus(result);
      onPermissionsChange?.(result.allGranted);
    } catch (err) {
      setError('Failed to check permissions');
      console.error('Error checking permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [onPermissionsChange]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const grantPermission = async (permission: Permission) => {
    setGrantingPermission(permission.name);
    try {
      await window.electronAPI!.system.requestPermission(permission.name);
      // Re-check after granting
      await checkPermissions();
    } catch (err) {
      console.error('Error requesting permission:', err);
    } finally {
      setGrantingPermission(null);
    }
  };

  const openGeneralSettings = async () => {
    try {
      await window.electronAPI!.system.openSettings();
    } catch (err) {
      console.error('Error opening settings:', err);
    }
  };

  if (loading) {
    return (
      <div className="permission-banner loading">
        <RefreshCw size={16} className="spin" />
        <span>Checking system permissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="permission-banner error">
        <AlertTriangle size={16} />
        <span>{error}</span>
        <button onClick={checkPermissions} className="permission-retry-btn">
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  if (!permissionStatus) {
    return null;
  }

  const missingRequired = permissionStatus.permissions.filter((p) => p.required && !p.granted);
  const missingOptional = permissionStatus.permissions.filter((p) => !p.required && !p.granted);

  // If all permissions are granted, show success message (collapsed by default)
  if (permissionStatus.allGranted && !expanded) {
    return (
      <div className="permission-banner success">
        <CheckCircle size={16} />
        <span>All system permissions are properly configured</span>
        <button onClick={() => setExpanded(true)} className="permission-expand-btn">
          View Details
        </button>
      </div>
    );
  }

  return (
    <div className={`permission-banner ${permissionStatus.allGranted ? 'success' : 'warning'}`}>
      <div className="permission-banner-header">
        <div className="permission-banner-title">
          {permissionStatus.allGranted ? (
            <>
              <CheckCircle size={18} />
              <span>System Permissions</span>
            </>
          ) : (
            <>
              <Shield size={18} />
              <span>System Permissions Required</span>
            </>
          )}
        </div>
        <div className="permission-banner-actions">
          <button onClick={checkPermissions} className="permission-refresh-btn" title="Refresh">
            <RefreshCw size={14} />
          </button>
          {permissionStatus.allGranted && (
            <button onClick={() => setExpanded(false)} className="permission-collapse-btn">
              Collapse
            </button>
          )}
        </div>
      </div>

      {!permissionStatus.allGranted && (
        <p className="permission-banner-description">
          For the best remote access experience, please grant the following permissions on your host computer:
        </p>
      )}

      <div className="permission-list">
        {permissionStatus.permissions.map((permission) => (
          <div
            key={permission.name}
            className={`permission-item ${permission.granted ? 'granted' : 'missing'} ${permission.required ? 'required' : 'optional'}`}
          >
            <div className="permission-item-status">
              {permission.granted ? (
                <CheckCircle size={16} className="status-icon granted" />
              ) : (
                <AlertTriangle size={16} className="status-icon missing" />
              )}
            </div>
            <div className="permission-item-content">
              <div className="permission-item-name">
                {permission.name}
                {permission.required && <span className="required-badge">Required</span>}
                {!permission.required && !permission.granted && (
                  <span className="optional-badge">Recommended</span>
                )}
              </div>
              <div className="permission-item-description">{permission.description}</div>
              {!permission.granted && (
                <div className="permission-action-row">
                  {canAutoGrant(permission.name) ? (
                    <button
                      onClick={() => grantPermission(permission)}
                      className="permission-grant-btn"
                      disabled={grantingPermission === permission.name}
                    >
                      {grantingPermission === permission.name ? (
                        <>
                          <RefreshCw size={12} className="spin" />
                          Granting...
                        </>
                      ) : (
                        <>
                          <Zap size={12} />
                          Grant Permission
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => grantPermission(permission)}
                        className="permission-open-settings-btn"
                        disabled={grantingPermission === permission.name}
                      >
                        {grantingPermission === permission.name ? (
                          <>
                            <RefreshCw size={12} className="spin" />
                            Opening...
                          </>
                        ) : (
                          <>
                            <ExternalLink size={12} />
                            Open Settings
                          </>
                        )}
                      </button>
                      <span className="permission-action-hint">
                        Find <strong>{permission.name}</strong> and add Omni Code
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!permissionStatus.allGranted && missingRequired.length > 0 && (
        <div className="permission-banner-footer">
          <button onClick={openGeneralSettings} className="permission-open-all-btn">
            <ExternalLink size={14} />
            Open System Settings
          </button>
          <span className="permission-help-text">
            Click "Open Settings" buttons above or manually configure in System Settings
          </span>
        </div>
      )}

      {permissionStatus.allGranted && (
        <div className="permission-banner-footer">
          <span className="permission-help-text">
            All permissions are properly configured for remote access
          </span>
        </div>
      )}
    </div>
  );
};
