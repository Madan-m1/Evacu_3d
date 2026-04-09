# Evacu3D Automation Testing Guide

This document provides instructions on how to use the comprehensive Selenium automation suite for the Evacu3D platform. This suite is designed for academic demonstration and verifies the full end-to-end functionality of the system.

## 📋 Automation Overview

The test suite ([selenium_full_suite.py](file:///c:/Users/Madan%20Kumar%20M/AppData/Local/antigravity/scratch/evacu3d/selenium_full_suite.py)) is built using Python's `unittest` framework and covers four major modules:

### 1. Public Interface Module
| Test Case | Objective | Selectors Used |
| :--- | :--- | :--- |
| **Landing Page** | Verify home content and accessibility. | `//*[contains(text(), 'Prepare')]` |
| **Contact Form** | Submit a live message and verify success. | `input[type='text']`, `input[type='email']` |

### 2. User Experience Module
| Test Case | Objective | Objective |
| :--- | :--- | :--- |
| **Auth Flow** | Authenticate as a standard user. | `input[type='password']`, `//*[contains(text(), 'Logout')]` |
| **3D Simulator** | Select building and calculate safest exit path. | `//button[descendant::div]`, `//*[contains(text(), 'Route Found')]` |

### 3. Admin Operations Module
| Test Case | Objective | Objective |
| :--- | :--- | :--- |
| **Admin Access** | Authenticate with elevated privileges. | Admin Credentials Logic |
| **Dashboard** | Audit Users, Buildings, and Messages. | `//button[contains(., 'Messages')]` |
| **Data Integrity** | Verify user contact form submission in admin view. | `//*[contains(text(), 'Automation User')]` |

### 4. Security & Cleanup
| Test Case | Objective | Logic |
| :--- | :--- | :--- |
| **Session Control** | Full logout and session clearance. | Header logout logic |
| **Restricted Access**| Verify `/dashboard` is inaccessible to guests. | URL redirection check |

---

## 🚀 How to Run the Demo

### Prerequisites
1. **Python 3.x**
2. **Selenium Package**:
   ```bash
   pip install selenium
   ```
3. **Chrome Browser**: The script uses `webdriver.Chrome()` which automatically manages the driver in modern Selenium versions.

### Execution
Run the following command in your terminal:
```bash
python selenium_full_suite.py
```

## 🛠️ Design Philosophy for Academic Demo
- **Robust Selectors**: The script avoids using dynamic React IDs. Instead, it relies on semantic attributes (like `[type='email']`) and visible text, mirroring how a real user interacts with the app.
- **Explicit Synchronization**: Uses `WebDriverWait` for every transition, ensuring the demo doesn't fail due to slow network speeds or rendering delays.
- **Modular Reports**: Each test case prints a "✅" status to the console, providing clear visual evidence of the system's health during the presentation.
