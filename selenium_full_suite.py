import unittest
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# ==============================================================================
# CONFIGURATION
# ==============================================================================
SITE_URL = "https://evacu3d.vercel.app"
USER_EMAIL = "user@gmail.com"
USER_PASS = "User@123"
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASS = "Admin123@"
SCREENSHOT_DIR = "selenium_debug_shots"

if not os.path.exists(SCREENSHOT_DIR):
    os.makedirs(SCREENSHOT_DIR)

class Evacu3DSystemTest(unittest.TestCase):
    def setUp(self):
        """Initialize a fresh browser for each test case."""
        options = webdriver.ChromeOptions()
        # options.add_argument("--headless")
        self.driver = webdriver.Chrome(options=options)
        self.driver.maximize_window()
        self.wait = WebDriverWait(self.driver, 25)

    def tearDown(self):
        """Cleanly close the browser after each test."""
        if hasattr(self, 'driver') and self.driver:
            time.sleep(2)
            self.driver.quit()

    def navigate_to_and_verify(self, path, wait_text=None):
        """
        CRITICAL: Navigates to a specific route and verifies page load 
        before any interaction occurs. Returns the page source for debug.
        """
        full_url = f"{SITE_URL}{path}"
        self.driver.get(full_url)
        
        # 1. Verify URL route
        self.wait.until(EC.url_contains(path.split('?')[0]))
        
        # 2. Verify unique page content to ensure hydration
        if wait_text:
            self.wait.until(EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{wait_text}')]")))
        
        print(f"📍 Navigation Verified: {path}")

    # --- MODULE 1: PUBLIC INTERFACE ---
    
    def test_01_home_page_load(self):
        """Verify the main landing page and branding."""
        print("\n🔍 Module 1: Testing Home Page Load...")
        # Home verification: Text 'Intelligent Building' is unique to Home.tsx
        self.navigate_to_and_verify("/", wait_text="Intelligent Building")
        
        try:
            self.assertEqual(self.driver.title, "Evacu3D | Preparing for Emergencies")
            print("✅ Landing page verified.")
        except Exception as e:
            self.driver.save_screenshot(f"{SCREENSHOT_DIR}/home_failure.png")
            raise e

    def test_02_contact_form_submission(self):
        """Navigate to /contact and submit form."""
        print("🔍 Module 1: Testing Professional Contact Form...")
        # Contact verification: Text 'Contact Us' is unique to Contact.tsx
        self.navigate_to_and_verify("/contact", wait_text="Contact Us")
        
        try:
            # Stabilized selectors
            self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='text']"))).send_keys("System Auditor")
            self.driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys("audit@evacu3d.com")
            self.driver.find_element(By.TAG_NAME, "textarea").send_keys("Automated end-to-end system validation successful.")
            
            # Action
            submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_btn.click()
            
            # Post-submission check
            success = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'received')]")))
            self.assertTrue(success.is_displayed())
            print("✅ Contact form submission successful.")
        except Exception as e:
            self.driver.save_screenshot(f"{SCREENSHOT_DIR}/contact_failure.png")
            raise e

    # --- MODULE 2: USER EXPERIENCE ---

    def test_03_ux_simulator_and_login(self):
        """Login and access the 3D simulator interactively."""
        print("🔍 Module 2: Testing User Authentication & Simulator...")
        # Login verification: Text 'Welcome back' is unique to Login.tsx
        self.navigate_to_and_verify("/login", wait_text="Welcome back")
        
        try:
            # Login Flow
            self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email']"))).send_keys(USER_EMAIL)
            self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(USER_PASS)
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            
            # Wait for Login Success (URL changes and Logout appears)
            self.wait.until(lambda d: d.current_url != f"{SITE_URL}/login")
            self.wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Logout')]")))
            print("🔓 Login successful.")
            
            # Simulator Navigation
            self.navigate_to_and_verify("/simulator", wait_text="Building")
            
            building = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[descendant::div[contains(@class, 'bg-blue')]] | //button[descendant::div[contains(text(), 'Building')]]")))
            building.click()
            
            # Verify 3D Controls
            self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Simulator')]")))
            print("✅ Simulator environment and user flow verified.")
        except Exception as e:
            self.driver.save_screenshot(f"{SCREENSHOT_DIR}/user_ux_failure.png")
            raise e

    # --- MODULE 3: ADMINISTRATIVE DASHBOARD ---

    def test_04_admin_dashboard_audit(self):
        """Admin login and data audit trail."""
        print("🔍 Module 3: Testing Administrative Control Panel...")
        self.navigate_to_and_verify("/login", wait_text="Welcome back")
        
        try:
            # Admin Login
            self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email']"))).send_keys(ADMIN_EMAIL)
            self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(ADMIN_PASS)
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            
            # Dashboard Redirection
            self.wait.until(EC.url_contains("/dashboard"))
            print("🔐 Admin access granted.")
            
            # Tab Verification
            self.wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(@class, 'capitalize')]")))
            tabs = self.driver.find_elements(By.XPATH, "//button[contains(@class, 'capitalize')]")
            for tab in tabs:
                if "Messages" in tab.text:
                    tab.click()
                    break
            
            # Verify Contact Message is indexed
            self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Auditor')]")))
            print("✅ Admin verified audit trail successfully.")
        except Exception as e:
            self.driver.save_screenshot(f"{SCREENSHOT_DIR}/admin_audit_failure.png")
            raise e

    # --- MODULE 4: SECURITY LOCKDOWN ---

    def test_05_session_security(self):
        """Verify session termination and route protection."""
        print("🔍 Module 4: Testing Security Protocols...")
        self.navigate_to_and_verify("/login", wait_text="Welcome back")
        
        try:
            # Auth Cycle
            self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='email']"))).send_keys(USER_EMAIL)
            self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(USER_PASS)
            self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            
            logout = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Logout')]")))
            logout.click()
            
            # Attempt Intrusion
            self.driver.get(f"{SITE_URL}/dashboard")
            # Wait for route settlement
            time.sleep(2) 
            
            current_url = self.driver.current_url
            self.assertTrue("/dashboard" not in current_url, "Security breach: accessed protected route without session.")
            print("✅ Session security verified.")
        except Exception as e:
            self.driver.save_screenshot(f"{SCREENSHOT_DIR}/security_failure.png")
            raise e

if __name__ == "__main__":
    print("\n" + "="*60)
    print("      EVACU3D END-TO-END SYSTEM TEST SUITE")
    print("="*60)
    unittest.main(verbosity=2)
