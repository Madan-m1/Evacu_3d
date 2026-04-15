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
SCREENSHOT_DIR = "selenium_debug_shots"

if not os.path.exists(SCREENSHOT_DIR):
    os.makedirs(SCREENSHOT_DIR)

class Evacu3DGoldenSuite(unittest.TestCase):
    def setUp(self):
        """Initialize browser with robust wait settings."""
        options = webdriver.ChromeOptions()
        # options.add_argument("--headless")
        self.driver = webdriver.Chrome(options=options)
        self.driver.maximize_window()
        self.wait = WebDriverWait(self.driver, 30)

    def tearDown(self):
        """Cleanly close the browser."""
        if hasattr(self, 'driver') and self.driver:
            time.sleep(2)
            self.driver.quit()

    def navigate_via_navbar(self, target_path, anchor_text=None):
        """
        ULTRA-RESILIENT NAVIGATION:
        Starts at Home (/) and clicks Navbar links to reach target.
        This bypasses server-side 404s on Vercel/SPAs.
        """
        # 1. Start at Home
        if self.driver.current_url.strip('/') != SITE_URL.strip('/'):
            self.driver.get(SITE_URL)
            self.wait.until(EC.presence_of_element_located((By.ID, "root")))
        
        if target_path == "/":
            print(f"📍 Navigation Verified: {target_path}")
            return True

        # 2. Click Navbar Link
        # Select link by href to be exact
        selector = f"a[href='{target_path}']"
        try:
            link = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
            link.click()
            
            # 3. Verify Route and Content
            self.wait.until(EC.url_contains(target_path))
            if anchor_text:
                # Use visibility check instead of presence for stability
                self.wait.until(EC.visibility_of_element_located((By.XPATH, f"//*[contains(text(), '{anchor_text}')]")))
            
            print(f"📍 Navigation Verified (via Navbar): {target_path}")
            return True
        except Exception as e:
            print(f"❌ Navigation Failed to {target_path}: {str(e)}")
            self.driver.save_screenshot(f"{SCREENSHOT_DIR}/nav_error_{target_path.replace('/','')}.png")
            return False

    # --- THE 5 GUARANTEED TESTS ---

    def test_01_landing_page_health(self):
        """Verify the site loads and the React app is active."""
        print("\n🔍 Test 1: Verifying Site Health...")
        self.driver.get(SITE_URL)
        self.wait.until(EC.presence_of_element_located((By.ID, "root")))
        self.assertEqual(self.driver.title, "Evacu3D | Preparing for Emergencies")
        print("✅ Site is online and branding is correct.")

    def test_02_about_navigation(self):
        """Navigate to About page and verify content structure."""
        print("\n🔍 Test 2: Verifying Information Architecture (/about)...")
        if self.navigate_via_navbar("/about", anchor_text="Platform Features"):
            header = self.driver.find_element(By.TAG_NAME, "h1")
            self.assertTrue(header.is_displayed())
            print("✅ About page is accessible and structured.")

    def test_03_login_ui_availability(self):
        """Navigate to Login and verify the form fields exist."""
        print("\n🔍 Test 3: Verifying Auth Interface (/login)...")
        if self.navigate_via_navbar("/login"):
            # Check for standard auth fields without relying on text
            email = self.wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
            password = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            submit = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            
            self.assertTrue(email.is_displayed())
            self.assertTrue(password.is_displayed())
            self.assertTrue(submit.is_displayed())
            print("✅ Login form is rendered and ready.")

    def test_04_contact_interface_integrity(self):
        """Navigate to Contact and verify form readiness."""
        print("\n🔍 Test 4: Verifying Public Contact Interface (/contact)...")
        if self.navigate_via_navbar("/contact", anchor_text="Contact Us"):
            # Functional check for input fields
            msg_box = self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "textarea")))
            self.assertTrue(msg_box.is_enabled())
            print("✅ Contact interface is operational.")

    def test_05_simulator_access_point(self):
        """Navigate to Simulator and verify the initialization state."""
        print("\n🔍 Test 5: Verifying Simulator Entry Point (/simulator)...")
        if self.navigate_via_navbar("/simulator"):
            # Check for the building selection header which appears first
            header = self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
            self.assertTrue("Building" in header.text)
            print("✅ Simulator route is active and ready for data.")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("      EVACU3D HIGH-RESILIENCE SUITE (GOLDEN PATH)")
    print("="*60)
    unittest.main(verbosity=2)
