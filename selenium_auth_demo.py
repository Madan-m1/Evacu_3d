import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

def run_evacu3d_automation():
    # 1. Setup - Using Chrome as default. Ensure chromedriver is in PATH.
    # For demo purposes, we'll keep the browser open after the test.
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Uncomment for headless mode
    driver = webdriver.Chrome(options=options)
    
    # Configuration
    SITE_URL = "https://evacu3d.vercel.app"
    LOGIN_URL = f"{SITE_URL}/login"
    EMAIL = "user@gmail.com"
    PASSWORD = "User@123"
    
    try:
        print(f"🚀 Starting automation for: {SITE_URL}")
        
        # 2. Step: Open the website
        driver.get(SITE_URL)
        print("✅ Website opened successfully.")
        
        # 3. Step: Navigate to Login Page
        # We look for a link that contains '/login' in the href, or has the text 'Login'
        wait = WebDriverWait(driver, 10)
        login_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/login')]")))
        login_link.click()
        print("✅ Navigated to Login page.")
        
        # 4. Step: Wait for Login Page Rendering
        # Ensure the URL is correct and the email field is present
        wait.until(EC.url_contains("/login"))
        email_inp = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        password_inp = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        # 5. Step: Enter Credentials
        print(f"👤 Entering credentials for {EMAIL}...")
        email_inp.send_keys(EMAIL)
        password_inp.send_keys(PASSWORD)
        
        # 6. Step: Submit Login Form
        print("🖱️ Submitting login form...")
        submit_btn.click()
        
        # 7. Step: Verify Successful Login
        # After login, the user should be redirected (to home '/' for standard users or '/dashboard' for admins)
        # We'll check for the presence of a 'Logout' button which only appears when authenticated.
        print("⏳ Waiting for authentication redirect...")
        try:
            # Wait for URL to change away from /login or for the Logout button to appear
            wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Logout')]")))
            print("🎉 Login successful! 'Logout' button detected.")
        except TimeoutException:
            print("❌ Login verification failed: 'Logout' button not found within 10 seconds.")
            return

        # 8. Step: Navigate further (e.g., Simulator)
        print("🛰️ Navigating to Simulator...")
        simulator_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/simulator')]")))
        simulator_link.click()
        
        wait.until(EC.url_contains("/simulator"))
        print("✅ Successfully arrived at the Simulator page.")
        
        print("\n✨ Automation Workflow Completed Successfully! ✨")
        
    except TimeoutException as e:
        print(f"🛑 Error: A timeout occurred while waiting for an element. ({e})")
    except NoSuchElementException as e:
        print(f"🛑 Error: An element could not be found. ({e})")
    except Exception as e:
        print(f"🛑 An unexpected error occurred: {e}")
    finally:
        # Keep the browser open for a few seconds for demo observation
        print("⌛ Keeping browser open for 5 seconds for observation...")
        time.sleep(5)
        driver.quit()
        print("🏁 Browser closed.")

if __name__ == "__main__":
    run_evacu3d_automation()
