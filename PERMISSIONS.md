# Omni Code System Permissions Guide

This guide helps you configure system permissions for Omni Code to enable seamless remote access from the Omni Go mobile app. These steps only need to be completed **once** on each host computer.

## Table of Contents

- [Overview](#overview)
- [macOS Setup](#macos-setup)
- [Windows Setup](#windows-setup)
- [Linux Setup](#linux-setup)
- [Troubleshooting](#troubleshooting)

---

## Overview

When using Omni Go to execute commands remotely on your host computer, system permission prompts may appear on the host. These prompts block execution until physically clicked, preventing true remote operation.

### Why These Permissions Are Needed

- **Terminal/Shell Access**: Required to execute commands via `node-pty`
- **File System Access**: Required to read and write project files
- **Network Access**: Required for the mobile app to connect to the desktop server
- **Full Disk Access** (macOS): Required to access certain protected directories

### Important Note

Some permissions **cannot be granted programmatically** and require manual user interaction on the host computer. This guide documents all the one-time setup steps needed for each platform.

---

## macOS Setup

### Prerequisites

- macOS 10.15 (Catalina) or later
- Administrator access to the Mac

### Step 1: Grant Full Disk Access

Omni Code needs Full Disk Access to read and write files in protected locations.

1. Open **System Settings** (or System Preferences on older macOS)
2. Navigate to **Privacy & Security** > **Full Disk Access**
3. Click the **lock icon** and enter your administrator password
4. Click the **+** button
5. Navigate to **Applications** and select **Omni Code**
6. Ensure the checkbox next to Omni Code is **checked**
7. Restart Omni Code

### Step 2: Grant Accessibility Access

Accessibility access is required for window management and some terminal operations.

1. Open **System Settings** > **Privacy & Security** > **Accessibility**
2. Click the **lock icon** and enter your administrator password
3. Click the **+** button
4. Navigate to **Applications** and select **Omni Code**
5. Ensure the checkbox next to Omni Code is **checked**

### Step 3: Pre-authorize Common Directories

To prevent prompts when accessing common directories, run these commands in Terminal:

```bash
# Pre-authorize Desktop access
touch ~/Desktop/.omni-test && rm ~/Desktop/.omni-test

# Pre-authorize Documents access
touch ~/Documents/.omni-test && rm ~/Documents/.omni-test

# Pre-authorize Downloads access
touch ~/Downloads/.omni-test && rm ~/Downloads/.omni-test

# Pre-authorize Home directory subfolders
mkdir -p ~/Projects
touch ~/Projects/.omni-test && rm ~/Projects/.omni-test
```

If any prompts appear during these commands, click **Allow**.

### Step 4: Developer Tools Access

If you use Terminal for debugging:

1. Open **System Settings** > **Privacy & Security** > **Developer Tools**
2. Ensure **Terminal** is checked

### Step 5: Network Volumes (if applicable)

If you work with files on network drives:

1. Open **System Settings** > **Privacy & Security** > **Files and Folders**
2. Find Omni Code and ensure **Network Volumes** is checked

### Step 6: Verify node-pty Permissions

Omni Code uses `node-pty` for terminal emulation. The app includes entitlements to allow execution of the spawn-helper binary. If you encounter issues:

```bash
# Check if the spawn-helper has execute permissions
ls -la ~/Library/Application\ Support/Omni\ Code/

# If needed, manually fix permissions (rarely required)
chmod +x "/Applications/Omni Code.app/Contents/Resources/app.asar.unpacked/node_modules/node-pty/build/Release/spawn-helper"
```

### macOS Code Signing & Notarization

For the best experience (no Gatekeeper warnings), the app should be signed and notarized:

```bash
# If building from source, ensure you have a Developer ID certificate
export CSC_NAME="Developer ID Application: Your Name (Team ID)"
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"

# Build
npm run build:mac
```

**Note**: Pre-built releases from GitHub should already be signed and notarized.

---

## Windows Setup

### Prerequisites

- Windows 10 (version 1809) or Windows 11
- Administrator access

### Step 1: Configure PowerShell Execution Policy

If you use PowerShell commands through Omni Code:

1. Open **PowerShell as Administrator** (right-click PowerShell, select "Run as administrator")
2. Run the following command:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. Type `Y` and press Enter to confirm

**What this does**: Allows locally created scripts to run while requiring remote scripts to be signed.

### Step 2: Add Windows Defender Exclusion (Optional)

To prevent Windows Defender from scanning the app during operation (improves performance):

**Option A: PowerShell (Administrator)**

```powershell
Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\Programs\omni-code"
```

**Option B: Manual via Settings**

1. Open **Windows Security** (search in Start menu)
2. Click **Virus & threat protection**
3. Click **Manage settings** under "Virus & threat protection settings"
4. Scroll to **Exclusions** and click **Add or remove exclusions**
5. Click **Add an exclusion** > **Folder**
6. Navigate to `%LOCALAPPDATA%\Programs\omni-code` and select it

### Step 3: Configure Windows Firewall

Allow Omni Code through the firewall for network access:

**Option A: Command Prompt (Administrator)**

```cmd
netsh advfirewall firewall add rule name="Omni Code" dir=in action=allow program="%LOCALAPPDATA%\Programs\omni-code\Omni Code.exe" enable=yes
```

**Option B: Manual via Control Panel**

1. Open **Windows Defender Firewall** (search in Start menu)
2. Click **Allow an app or feature through Windows Defender Firewall**
3. Click **Change Settings** (administrator password may be required)
4. Click **Allow another app**
5. Click **Browse** and navigate to your Omni Code installation
   - Typically: `%LOCALAPPDATA%\Programs\omni-code\Omni Code.exe`
6. Click **Add**
7. Ensure both **Private** and **Public** checkboxes are checked for Omni Code
8. Click **OK**

### Step 4: Disable SmartScreen (Optional)

SmartScreen may warn about the app if it's not code-signed with an EV certificate.

**Option A: Via Settings (Recommended)**

1. Open **Windows Security** > **App & browser control**
2. Click **Reputation-based protection settings**
3. Turn off **Check apps and files**

**Option B: Via Registry (Administrator)**

```cmd
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer" /v "SmartScreenEnabled" /t REG_SZ /d "Off" /f
```

**Security Note**: Only disable SmartScreen if you trust the source of the application.

### Step 5: Enable Developer Mode (Optional)

Developer Mode enables additional features like symlink creation without elevation:

1. Open **Settings** > **Update & Security** > **For developers**
2. Toggle **Developer Mode** to **On**
3. Click **Yes** to confirm

### Step 6: Windows Code Signing (For Developers)

To avoid SmartScreen warnings entirely, sign the app with a code signing certificate:

```yaml
# In electron-builder.yml
win:
  certificateFile: "path/to/certificate.p12"
  certificatePassword: "password"  # Or use env var: WIN_CSC_KEY_PASSWORD
```

**Certificate Options**:
- Standard Code Signing Certificate (removes SmartScreen after reputation is built)
- EV (Extended Validation) Code Signing Certificate (immediate SmartScreen removal)
- Azure Trusted Signing (cloud-based signing)

---

## Linux Setup

### Prerequisites

- Linux distribution with systemd (Ubuntu 20.04+, Fedora 34+, Debian 11+, etc.)
- sudo or root access

### Step 1: Add User to Required Groups

Depending on your workflow, you may need to add your user to specific groups:

```bash
# For serial port access (embedded development, Arduino, etc.)
sudo usermod -a -G dialout $USER

# For Docker access (if using Docker commands through Omni Code)
sudo usermod -a -G docker $USER

# For video device access (if applicable)
sudo usermod -a -G video $USER
```

**Important**: Log out and log back in (or restart) for group changes to take effect.

### Step 2: Configure udev Rules (if needed)

If you work with USB devices that require special permissions:

```bash
# Create a udev rules file for your devices
sudo nano /etc/udev/rules.d/99-omnicode.rules

# Example rules (adjust for your devices):
# SUBSYSTEM=="usb", ATTR{idVendor}=="1234", ATTR{idProduct}=="5678", MODE="0666", GROUP="dialout"

# Reload udev rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### Step 3: Configure AppArmor (Ubuntu/Debian)

If AppArmor is blocking operations:

```bash
# Check AppArmor status
sudo aa-status

# If Omni Code operations are being blocked, you can:
# Option 1: Put AppArmor in complain mode for the profile
sudo aa-complain /etc/apparmor.d/path-to-profile

# Option 2: Create a custom AppArmor profile for Omni Code
# (Advanced - see AppArmor documentation)
```

### Step 4: Configure SELinux (Fedora/RHEL/CentOS)

If SELinux is enforcing and blocking operations:

```bash
# Check SELinux status
getenforce

# Option 1: Allow specific operations (recommended)
sudo setsebool -P domain_can_mmap_files 1

# Option 2: Generate a custom policy module
# Install audit2allow if not present:
sudo dnf install policycoreutils-python-utils  # Fedora
sudo apt install policycoreutils-python-utils  # Ubuntu/Debian

# Generate policy from audit logs
sudo ausearch -c 'omni-code' --raw | audit2allow -M omni-code-local
sudo semodule -i omni-code-local.pp

# Option 3: Temporarily set permissive mode (not recommended for production)
# sudo setenforce 0
```

### Step 5: Install Polkit Policy (Optional)

For seamless elevated operations without password prompts:

```bash
# Copy the polkit policy to system directory
sudo cp /path/to/omni-code/build/polkit/com.omnicode.policy /usr/share/polkit-1/actions/

# Verify it was installed
ls -la /usr/share/polkit-1/actions/com.omnicode.policy
```

### Step 6: Desktop Integration

For proper desktop entry integration when using AppImage or portable versions:

```bash
# Create desktop entry directory if not exists
mkdir -p ~/.local/share/applications

# Copy desktop entry
cp /path/to/omni-code/build/omni-code.desktop ~/.local/share/applications/

# Update desktop database
update-desktop-database ~/.local/share/applications/
```

### Step 7: Verify File Permissions

Ensure your user owns your home directory and common project locations:

```bash
# Check home directory ownership
ls -la ~

# Should show your username as owner, e.g.:
# drwxr-xr-x 25 username username 4096 Jan 15 10:00 .

# If needed, fix ownership (be careful!)
# sudo chown -R $USER:$USER ~
```

### Step 8: Firewall Configuration

If using a firewall (ufw, firewalld, etc.), allow Omni Code's remote access port:

```bash
# For ufw (Ubuntu/Debian)
sudo ufw allow 3000/tcp  # Default Omni Code port

# For firewalld (Fedora/RHEL)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# For iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

## Troubleshooting

### macOS Issues

#### "Omni Code cannot be opened because the developer cannot be verified"

**Solution**: Right-click the app and select "Open", then click "Open" in the dialog.

#### "node-pty failed to load" or terminal not opening

**Solution**: Check entitlements are properly set:

```bash
# Check if app is properly signed
codesign -dv --verbose=4 "/Applications/Omni Code.app"

# Check entitlements
codesign -d --entitlements - "/Applications/Omni Code.app"
```

#### Terminal commands hang or don't execute

**Solution**: Check Full Disk Access is granted (see Step 1 above).

### Windows Issues

#### "Windows protected your PC" (SmartScreen)

**Solution**: Click "More info" then "Run anyway", or disable SmartScreen (see Step 4 above).

#### PowerShell scripts fail to run

**Solution**: Check execution policy is set to RemoteSigned (see Step 1 above).

#### Cannot connect from mobile app

**Solution**: Check Windows Firewall settings (see Step 3 above) and ensure both Private and Public networks are allowed.

### Linux Issues

#### Permission denied when accessing serial ports

**Solution**: Add user to `dialout` group and restart (see Step 1 above).

#### AppArmor/SELinux blocking operations

**Solution**: Check audit logs and generate appropriate policies (see Steps 3-4 above).

#### Desktop entry not appearing

**Solution**: Update desktop database:

```bash
update-desktop-database ~/.local/share/applications/
```

---

## Security Considerations

### What These Permissions Enable

- **Full Disk Access** (macOS): Allows reading/writing all user-accessible files
- **Accessibility** (macOS): Allows controlling the UI and window management
- **Windows Defender Exclusion**: Prevents real-time scanning of app files
- **Linux Groups**: Access to hardware devices and Docker

### Security Best Practices

1. **Only download Omni Code from official sources** (GitHub releases or official website)
2. **Keep your OS updated** with the latest security patches
3. **Use a firewall** to limit remote access to trusted networks
4. **Enable API key authentication** in Omni Code settings when using remote access
5. **Regularly review** which apps have Full Disk Access/Accessibility permissions

### Revoking Permissions

If you want to revoke permissions:

- **macOS**: System Settings > Privacy & Security > [Permission Type]
- **Windows**: Windows Security > Virus & threat protection > Exclusions (for Defender)
- **Linux**: Remove user from groups with `sudo gpasswd -d $USER groupname`

---

## Quick Reference

| Platform | Critical Permissions | How to Revoke |
|----------|---------------------|---------------|
| macOS | Full Disk Access, Accessibility | System Settings > Privacy & Security |
| Windows | Firewall, Execution Policy | Windows Security, PowerShell |
| Linux | User groups, Polkit | `gpasswd`, remove polkit file |

---

## Support

If you encounter issues after following this guide:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Search existing issues on GitHub
3. Create a new issue with:
   - Your operating system and version
   - Omni Code version
   - Exact error message or behavior
   - Steps you've already tried

---

*Last updated: April 2025*
