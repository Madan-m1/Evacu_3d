import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

import os

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
    @classmethod
    def setUpClass(cls):
        """Initialize the browser once for the entire test suite."""
        options = webdriver.ChromeOptions()
        # options.add_argument("--headless") # Uncomment for headless CI
        cls.driver = webdriver.Chrome(options=options)
        cls.driver.maximize_window()
        cls.wait = WebDriverWait(cls.driver, 15)

    @classmethod
    def tearDownClass(cls):
        """Close the browser after all tests have run."""
        time.sleep(3) # Short delay to observe final state
        cls.driver.quit()

    def navigate_to(self, path):
        """Helper to navigate to a path and wait for load."""
        self.driver.get(f"{SITE_URL}{path}")
        time.sleep(1) # Allow React to settle

    # --------------------------------------------------------------------------
    # MODULE 1: PUBLIC INTERFACE
    # --------------------------------------------------------------------------
    
    def test_01_home_page_load(self):
        """Verify the landing page and main call to action."""
        print("\n🔍 Testing Home Page...")
        try:
            self.navigate_to("/")
            # Check for updated title
            self.assertTrue("Evacu3D" in self.driver.title or "client" in self.driver.title)
            
            # Check for Hero text
            hero_text = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Prepare')]")))
            self.assertTrue(hero_text.is_displayed())
            print("✅ Home Page Loaded.")
        except Exception as e:
            self.driver.save_screenshot(f"{SCREENSHOT_DIR}/home_failure.png")
            print(f"❌ Home Page Load Failed. Screenshot saved. Error: {e}")
            raise e

    def test_02_contact_form_submission(self):
        """Automate the contact form and verify submission success."""
        print("🔍 Testing Contact Form...")
        self.navigate_to("/contact")
        
        # Selectors based on input types as requested
        name_input = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']")))
        email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        msg_input = self.driver.find_element(By.TAG_NAME, "textarea")
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        try:
            name_input.send_keys("Test Automation User")
            email_input.send_keys("test@automation.com")
            msg_input.send_keys("This is an automated system test for the Evacu3D platform demo.")
            
            submit_btn.click()
            
            # Wait for success message
            success_msg = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'received')]")))
            self.assertTrue(success_msg.is_displayed())
            print("✅ Contact form submitted successfully.")
        except Exception as e:
            self.driver.save_screenshot(f"{SCREENSHOT_DIR}/contact_failure.png")
            print(f"❌ Contact form failed. Screenshot saved.")
            raise e

    # --------------------------------------------------------------------------
    # MODULE 2: USER FLOW (SIMULATOR)
    # --------------------------------------------------------------------------

    def test_03_user_login_and_simulator(self):
        """User login and core simulation pathfinding."""
        print("🔍 Testing User Login & Simulator...")
        self.navigate_to("/login")
        
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))).send_keys(USER_EMAIL)
        self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(USER_PASS)
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Verify login redirect
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Logout')]")))
        
        # Go to Simulator
        self.navigate_to("/simulator")
        
        # Select a building (wait for buildings to load)
        building_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[descendant::div[contains(@class, 'text-white font-semibold')]]")))
        building_name = building_btn.text.split('\n')[0]
        print(f"🏢 Selecting Building: {building_name}")
        building_btn.click()
        
        # Wait for 3D Scene and Control Panel
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Simulation Controls')]")))
        
        # Select a starting location (e.g., first available room button)
        room_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(@class, 'border-gray-700')]")))
        room_btn.click()
        
        # Find safest path
        path_btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Safest Path')]")
        path_btn.click()
        
        # Verify simulation result
        result_alert = self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Route Found') or contains(text(), 'Refuge')]")))
        self.assertTrue(result_alert.is_displayed())
        print("✅ Simulator pathfinding tested.")

    # --------------------------------------------------------------------------
    # MODULE 3: ADMIN DASHBOARD
    # --------------------------------------------------------------------------

    def test_04_admin_dashboard_operations(self):
        """Admin features: Dashboard navigation, system overview."""
        print("🔍 Testing Admin Dashboard...")
        
        # Logout User first
        logout_btn = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Logout')]")
        logout_btn.click()
        
        # Login as Admin
        self.navigate_to("/login")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))).send_keys(ADMIN_EMAIL)
        self.driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(ADMIN_PASS)
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # Wait for Dashboard redirect
        self.wait.until(EC.url_contains("/dashboard"))
        print("✅ Admin Login successful.")
        
        # Test Tabs
        tabs = ["Hazards", "Active Users", "Manage Users", "Messages"]
        for tab in tabs:
            tab_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, f"//button[contains(., '{tab}')]")))
            tab_btn.click()
            time.sleep(0.5)
            print(f"📊 Tab '{tab}' is accessible.")
            
        # Verify Message from Module 1
        msg_tab = self.driver.find_element(By.XPATH, "//button[contains(., 'Messages')]")
        msg_tab.click()
        
        # Check if our automated message exists
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Automation User')]")))
        print("✅ Admin verified the contact message submission.")

    # --------------------------------------------------------------------------
    # MODULE 4: SECURITY & CLEANUP
    # --------------------------------------------------------------------------

    def test_05_security_and_logout(self):
        """Verify session lockdown and clean exit."""
        print("🔍 Testing Security & Session...")
        
        # Final Logout
        logout_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Logout')]")))
        logout_btn.click()
        
        # Try to access dashboard while logged out
        self.driver.get(f"{SITE_URL}/dashboard")
        time.sleep(1)
        
        # Should be redirected to home or login (depending on protected route logic)
        curr_url = self.driver.current_url
        self.assertTrue("/dashboard" not in curr_url or "/login" in curr_url)
        print("✅ Security redirect verified.")

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================
if __name__ == "__main__":
    print("\n" + "="*60)
    print("      EVACU3D END-TO-END SYSTEM TEST SUITE")
    print("="*60)
    unittest.main(verbosity=2)
