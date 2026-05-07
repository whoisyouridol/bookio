# I18N Plan — Hardcoded String Extraction Report

## 1. i18n Library

No i18n library is currently installed. **Recommendation:** `react-i18next` + `i18next` + `i18next-browser-languagedetector`.

A `LanguageContext` already exists (`src/contexts/LanguageContext.tsx`) with a language switcher UI (`src/components/GlobalToolbar.tsx`). After i18next is wired up, the context will delegate to `i18n.changeLanguage()` and the switcher will work end-to-end.

Supported languages: `en` (default), `ka` (Georgian), `ru` (Russian).

---

## 2. Key Naming Convention

Flat dot-notation, grouped by feature/page:

| Prefix | Scope |
|---|---|
| `common.*` | Shared buttons, labels, statuses used across pages |
| `nav.*` | Navigation labels (sidebar, bottom nav) |
| `auth.*` | Login, register, password flows |
| `home.*` | HomePage |
| `salon.*` | SalonDetailsPage, SalonLandingPage |
| `master.*` | MasterProfilePage |
| `booking.*` | BookingFlowPage, BookingConfirmationPage, ViewBookingPage |
| `myBookings.*` | MyBookingsPage |
| `admin.dashboard.*` | Admin DashboardPage |
| `admin.salons.*` | SalonsPage, SalonFormPage |
| `admin.masters.*` | MastersPage, MasterFormPage |
| `admin.services.*` | ServicesPage |
| `admin.bookings.*` | BookingsAdminPage, BookingDetailAdminPage, SalonAdminBookingsPage |
| `admin.users.*` | UsersPage, UserDetailPage |
| `admin.availability.*` | AvailabilityPage |
| `admin.salonDashboard.*` | SalonAdminDashboardPage |
| `admin.salonMasters.*` | SalonAdminMastersPage |
| `admin.layout.*` | AdminLayout (sidebar, roles, preferences) |
| `components.*` | Reusable components (DatePicker, DragDropUpload, TimeSlotGrid, etc.) |
| `errors.*` | Shared error/not-found messages |

Within each group, keys are alphabetical and semantic: `auth.emailLabel`, `auth.passwordLabel`, `auth.signInButton`.

---

## 3. Files & Strings Inventory

### Auth Pages

#### `src/pages/auth/LoginPage.tsx`
- "Sign in"
- "Welcome back to BookVisit"
- "Email"
- "Password"
- "Forgot password?"
- "Signing in…"
- "Sign in" (button)
- "or continue with"
- "Continue with Google"
- "Continue with Facebook"
- "Don't have an account?"
- "Sign up"
- "Own a salon or work as a specialist?"
- "Join as a Professional"
- "Invalid credentials"
- "Google sign-in failed"

#### `src/pages/auth/RegisterPage.tsx`
- "Create account"
- "Join BookVisit"
- "I am a…"
- "Client"
- "Book appointments at salons"
- "Salon Owner"
- "Manage your salon, masters and bookings"
- "Master / Specialist"
- "Manage your services and bookings"
- "Your salon"
- "Join existing"
- "Create new"
- "Search by name or address…"
- "No salons found"
- "First name"
- "Last name"
- "Email"
- "Phone (optional)"
- "Password"
- "Confirm password"
- "Creating account…"
- "Create account" (button)
- "Continue to Master Registration"
- "Passwords do not match"
- "Please select a salon"
- "Please fill in salon name and address"
- "Please select at least one working day"
- "Registration failed"
- "Account created!"
- "Salon name *"
- "Address *"
- "Opens at"
- "Closes at"
- "Working days"
- "Already have an account?"
- "Sign in"
- "Registration Submitted"

#### `src/pages/auth/MasterRegisterPage.tsx`
- "Professional Registration"
- "I am a..."
- "Specialist"
- "I work at a salon"
- "Salon Owner"
- "I manage a salon"
- "Profile setup"
- "Create account"
- "Select your salon"
- "Search salons..."
- "No salons match your search"
- "No salons available"
- "Your salon"
- "Join existing"
- "Create new"
- "Salon name *"
- "Address *"
- "Opens at"
- "Closes at"
- "Working days"
- "Continue"
- "Registering as a specialist at"
- "your new salon"
- "Registering as salon owner of"
- "Registering as salon owner at"
- "First name"
- "Last name"
- "Email"
- "Password"
- "Phone (optional)"
- "Please use email registration when creating a new salon"
- "Min. 6 characters"
- "Submitting..."
- "Create account" (button)
- "or continue with"
- "Continue with Google"
- "Continue with Facebook"
- "Back"
- "Registration submitted!"
- "Your application to join ... is pending review. An administrator will activate your account shortly."
- "Your salon and account have been submitted for review. An administrator will activate your account shortly."
- "Your application to manage ..."
- "Back to Sign in"
- "Google sign-in failed"
- "Already have an account?"
- "Sign in"

#### `src/pages/auth/ForgotPasswordPage.tsx`
- "Reset password"
- "Enter your email and we'll send you a reset link."
- "Email"
- "Sending…"
- "Send reset link"
- "Back to sign in"
- "Check your email"
- "If an account with ... exists, we've sent a password reset link."

#### `src/pages/auth/ResetPasswordPage.tsx`
- "Set new password"
- "Choose a strong password for your account."
- "New password"
- "Confirm new password"
- "Resetting…"
- "Reset password" (button)
- "Passwords do not match"
- "Password reset successfully"
- "Reset failed. The link may have expired."
- "Invalid or expired reset link."
- "Request a new one"

#### `src/pages/auth/ForceChangePasswordPage.tsx`
- "Set your password"
- "You were assigned a temporary password. Please choose a new one to continue."
- "Temporary password"
- "New password"
- "Confirm new password"
- "Saving…"
- "Set password & continue"
- "Passwords do not match"
- "Password changed. Welcome!"
- "Failed to change password"

#### `src/pages/auth/GooglePopupRedirectPage.tsx`
- "Sign in with Google"
- "Click below to continue"
- "Google sign-in failed"

---

### Client Pages

#### `src/pages/client/HomePage.tsx`
- "Find Your Style"
- "Book with top beauty professionals"
- "No salons yet"
- "Check back soon!"

#### `src/pages/client/SalonDetailsPage.tsx`
- "Address"
- "Working Hours"
- "Working Days"
- "Google Maps"
- "Our Masters"
- "No masters available."
- "Salon not found."

#### `src/pages/client/MasterProfilePage.tsx`
- "Master Profile"
- "Services"
- "No services listed."
- "Reviews"
- "Continue" (with count interpolation)
- "Master not found."

#### `src/pages/client/BookingFlowPage.tsx`
- "Book Appointment"
- "No services selected. Please go back and select services."
- "Select Date"
- "Select Time"
- "Continue"
- "Your Details"
- "Full Name *"
- "Your name"
- "Phone *"
- "+7 000 000 00 00"
- "Email (optional)"
- "your@email.com"
- "Back"
- "Review"
- "Review Booking"
- "Confirm Booking"
- "Failed to create booking. Please try again."

#### `src/pages/client/BookingConfirmationPage.tsx`
- "Booking Requested"
- "Booking Confirmed"
- "Awaiting approval"
- "You're booked!"
- "The master will confirm your booking shortly."
- "Your appointment is confirmed."
- "Booking"
- "Services"
- "min total"
- "View Booking Details"
- "Book Another Appointment"
- "Booking not found."

#### `src/pages/client/MyBookingsPage.tsx`
- "My Bookings"
- "Sign in to see your bookings"
- "Create an account or sign in to track your appointments"
- "Sign in →"
- "No bookings yet"
- "Book your first appointment to get started"
- "Browse salons →"

#### `src/pages/client/ViewBookingPage.tsx`
- "Booking Details"
- "Services"
- "min"
- "Cancel Booking"
- "Cancel this booking?"
- "Booking cancelled."
- "Failed to cancel."
- "Back to Home"
- "Booking not found."

#### `src/pages/client/NotFoundPage.tsx`
- "404"
- "Page not found"
- "The page you're looking for doesn't exist or has been moved."
- "Back to Home"

---

### Subdomain Pages

#### `src/pages/subdomain/SalonLandingPage.tsx`
- "Our Masters"
- "No masters available."
- "Google Maps"
- "Address"
- "Working Hours"
- "Working Days"

---

### Admin Pages

#### `src/pages/admin/AdminLayout.tsx`
- "Dashboard"
- "Salons"
- "Masters"
- "Availability"
- "Services"
- "Bookings"
- "Accounts"
- "My Profile"
- "My Salon"
- "Logged out"
- "Preferences"
- "← Back to client view"
- "Log out"
- "Client →"
- Role labels: "Super Admin", "Salon Admin", "Master", "Client"

#### `src/pages/admin/DashboardPage.tsx`
- "Dashboard"
- "Salons"
- "Masters"
- "Today"
- "Total"
- "Recent Bookings"
- "No bookings yet."

#### `src/pages/admin/SalonFormPage.tsx`
- "New Salon"
- "Edit Salon"
- "Name *"
- "Slug"
- "my-salon (auto-generated if empty)"
- "Address *"
- "Google Maps URL"
- "Opens at"
- "Closes at"
- "Working Days"
- "Subdomain Theming"
- "Primary Color"
- "#8B5CF6"
- "Accent Color"
- "#7C3AED"
- "Border Radius"
- "12px"
- "Logo URL"
- "https://..."
- "Photos"
- "Videos"
- "Cancel"
- "Create"
- "Save Changes"
- "Masters"
- "+ Add Master"
- "No masters linked yet."
- "Add Master to Salon"
- "The master will inherit the salon's working hours and days. Schedule can be customized on the master's profile page."
- "Master"
- "Search by name…"
- "No masters found"
- "Adding…"
- "Add Master"

#### `src/pages/admin/SalonsPage.tsx`
- "Salons"
- "New Salon"
- "No salons yet"
- "Create first"
- "Active"
- "Inactive"
- "Delete \"{name}\"? This is a soft delete."
- "Salon deleted."
- "Failed to delete."

#### `src/pages/admin/MasterFormPage.tsx`
- "New Master"
- "Edit Master"
- "Email *"
- "First Name *"
- "Last Name *"
- "Phone *"
- "Photo"
- "Description"
- "Auto-approve bookings"
- "New bookings are confirmed automatically."
- "New bookings require manual approval by the master."
- "Cancel"
- "Create"
- "Save Changes"
- "Master created!"
- "Master updated!"
- "Failed to save."
- "Master added to salon."
- "Failed to add master."
- "Master removed from salon."
- "Failed to remove master."
- "Salons & Schedule"
- "Works from"
- "Works until"
- "Working Days"
- "Saving…"
- "Save Schedule"
- "Services"
- "Add Service"
- "Custom photo"
- "Default service photo:"
- "If no photo is uploaded, the default service photo will be used:"
- "Custom photo for this master (optional)"
- "Default photo:"
- "Includes wash, cut and blow-dry…"
- "Price ₾"
- "Duration min"
- "Select service…"
- "Service added."
- "Failed to add service."
- "Service updated."
- "Failed to update service."
- "Service removed."

#### `src/pages/admin/MastersPage.tsx`
- "Masters"
- "New Master"
- "No masters yet"
- "Add first"
- "Delete \"{firstName} {lastName}\"?"
- "Master deleted."
- "Failed to delete."
- "Active"
- "Pending"
- "Deleted"

#### `src/pages/admin/ServicesPage.tsx`
- "Service Catalog"
- "New Service"
- "No services yet"
- "Add first"
- "Edit Service"
- "New Service"
- "Name *"
- "Description"
- "Photo"
- "Cancel"
- "Save"
- "Delete \"{name}\"?"
- "Service created."
- "Service updated."
- "Service deleted."
- "Failed to save."
- "Failed to delete."

#### `src/pages/admin/BookingsAdminPage.tsx`
- "Bookings"
- "All Salons"
- "All Masters"
- "All Statuses"
- "From"
- "To"
- "No bookings found"
- "Date & Time"
- "Client"
- "Salon"
- "Master"
- "Services"
- "Total"
- "Status"
- "Details"

#### `src/pages/admin/BookingDetailAdminPage.tsx`
- "← Back"
- "Booking Details"
- "Reference"
- "Date"
- "Time"
- "Duration"
- "Salon"
- "Master"
- "Client"
- "Name"
- "Phone"
- "Email"
- "Services"
- "Total"
- "Cancellation Reason"
- "Actions"
- "Confirm"
- "Mark Complete"
- "Cancellation reason (optional)"
- "Cancel Booking"
- "Booking confirmed."
- "Failed."
- "Booking completed."
- "Booking cancelled."
- "Failed to cancel."
- "Booking not found."

#### `src/pages/admin/SalonAdminBookingsPage.tsx`
- "Bookings"
- "Cancel selected"
- "All Masters"
- "All Statuses"
- "From"
- "To"
- "No bookings found"
- "Date & Time"
- "Client"
- "Master"
- "Services"
- "Total"
- "Status"
- "Actions"
- "Confirm"
- "Complete"
- "Cancel this booking?"
- "Cancel N booking(s)?"
- "Booking confirmed"
- "Booking completed"
- "Booking cancelled"
- "Failed"
- "N booking(s) cancelled"

#### `src/pages/admin/SalonAdminDashboardPage.tsx`
- "Salon Dashboard"
- "Active Masters"
- "Today"
- "This Week"
- "Avg Rating"
- "Revenue Today"
- "Revenue Week"
- "Cancel Rate (30d)"
- "Today's Bookings"
- "View all"
- "No bookings today."
- "Dashboard unavailable"

#### `src/pages/admin/SalonAdminMastersPage.tsx`
- "Masters"
- "Add Existing"
- "Create New"
- "No masters linked to your salon"
- "Deleted"
- "Active"
- "Pending"
- "Remove"
- "Remove {name} from your salon?"
- "Master removed from salon"
- "Failed to remove master"
- "Add Existing Master"
- "Search by name, email or phone (min 2 chars)..."
- "Type at least 2 characters to search"
- "No available masters found"
- "Add"
- "Create New Master"
- "A temporary password will be generated and sent to the master's email."
- "First name *"
- "Last name *"
- "Email *"
- "Phone *"
- "Cancel"
- "Creating…"
- "Create Master"
- "Master created! A temporary password has been sent to their email."
- "Failed to create master"

#### `src/pages/admin/UsersPage.tsx`
- "Accounts"
- "total"
- "Add new account"
- "Search by name or email…"
- "All"
- "Account"
- "Role"
- "Status"
- "Provider"
- "Joined"
- "No name"
- "Active"
- "Pending"
- "Email"
- "Approve"
- "Approve (activates account + salon)"
- "No accounts found"
- "Add new account"
- "Client"
- "Master"
- "Regular customer who can book appointments"
- "Specialist who provides services and accepts bookings"
- "Email *"
- "First Name"
- "Last Name"
- "Phone"
- "First Name *"
- "Last Name *"
- "Phone *"
- "Auto-approve bookings"
- "A temporary password will be auto-generated and logged to the console."
- "Cancel"
- "Create Client"
- "Create Master"
- Role labels: "Super Admin", "Salon Admin", "Master", "Client"
- "Delete account \"{email}\"? This cannot be undone."
- "Their master profile will also be deactivated."
- "Client account created — temporary password sent to console"
- "Master account created — temporary password sent to console"
- "Failed to create account"
- "Failed to create master"
- "Status updated"
- "Failed to update status"
- "Account deleted"
- "Failed to delete account"

#### `src/pages/admin/UserDetailPage.tsx`
- "Account"
- "Master Profile"
- "Profile"
- "First Name"
- "Last Name"
- "Email"
- "Phone"
- "Linked via"
- "— password login not available"
- "Save Profile"
- "User ID:"
- "Created:"
- "Account not found."
- "Photo"
- "Description"
- "Auto-approve bookings"
- "New bookings are confirmed automatically."
- "New bookings require manual approval."
- "Services"
- "Add Service"
- "Select service…"
- "Default photo:"
- "Custom photo (optional)"
- "Description (optional)"
- "Price ₾"
- "Duration min"
- "Reset to default"
- "Service added"
- "Service updated"
- "Service removed"
- "Failed to save."
- "Profile updated"
- "User activated"
- "User deactivated"
- "Master profile updated"

#### `src/pages/admin/AvailabilityPage.tsx`
- "Availability"
- "Configure your working schedule, day overrides, and time off."
- "No master profile linked."
- "You are not linked to any salon yet."
- "Weekly Schedule"
- "Set your regular working hours for each day of the week."
- "Add time window"
- "Save"
- "Cancel"
- "No weekly schedule configured."
- "Set up schedule"
- "Edit schedule"
- "Date Overrides"
- "Override your schedule for specific dates (e.g. shorter day, day off)."
- "Day off"
- "Date override saved"
- "Failed to save override"
- "Override removed"
- "Failed to remove override"
- "Date"
- "Add window"
- "Add override"
- "Time Off"
- "Block date ranges when you're unavailable (vacations, sick leave, etc.)."
- "Time off added"
- "Failed to add time off"
- "Time off removed"
- "Failed to remove time off"
- "Start date"
- "End date"
- "Reason (optional)"
- "e.g. Vacation, Sick leave..."
- "Add time off"
- Day names: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"

---

### Shared Components

#### `src/components/BottomNav.tsx`
- "Home"
- "My Bookings"
- "Admin"
- "Logout"
- "Login"

#### `src/components/GlobalToolbar.tsx`
- "Switch to light mode"
- "Switch to dark mode"
- "Light mode"
- "Dark mode"
- "Change language"
- "Language"

#### `src/components/Header.tsx`
- "Go back"

#### `src/components/BookingSummary.tsx`
- "Services"
- "Total"

#### `src/components/ServiceCard.tsx`
- "Back"
- "Remove"
- "Add to booking"

#### `src/components/TimeSlotGrid.tsx`
- "No available slots for this date."

#### `src/components/DragDropUpload.tsx`
- "Dragging..."
- "Uploading..."
- "Drag & drop or click to upload"
- "PNG, JPG, WebP up to 5MB"
- "Only image files allowed"
- "File is too large"
- "Failed to upload"

#### `src/components/ui/DatePicker.tsx`
- "Previous month"
- "Next month"
- "Today"

#### `src/components/DevRoleSwitcher.tsx`
- "Dev: Role Switcher"
- "Switch your role (development only)"
- "SuperAdmin"
- "Salon Owner"
- "Master"
- "Regular User"

---

### Contexts (user-visible error messages)

#### `src/contexts/SalonSubdomainContext.tsx`
- "Salon not found"
- "The salon \"{slug}\" does not exist or is no longer active."

#### `src/contexts/LanguageContext.tsx`
- "English"
- "Русский"
- "ქართული"

---

## 4. Summary

| Category | Files | Approx. Strings |
|---|---|---|
| Auth pages | 7 | ~140 |
| Client pages | 8 | ~80 |
| Subdomain pages | 1 | ~7 |
| Admin pages | 15 | ~350 |
| Components | 10 | ~35 |
| Contexts | 2 | ~5 |
| **Total** | **43** | **~617** |

---

## 5. Next Steps (pending confirmation)

1. Install `i18next`, `react-i18next`, `i18next-browser-languagedetector`
2. Create `src/i18n/i18n.ts` config (default `en`, fallback `en`, supported `en`/`ka`/`ru`)
3. Create `src/i18n/locales/en.json` with all ~617 strings organized by the key structure above
4. Create placeholder `ka.json` and `ru.json` (copies of `en.json`)
5. Wire `LanguageContext` to call `i18n.changeLanguage()`
6. Wrap app root with `I18nextProvider`
7. Replace all hardcoded strings with `t()` calls file by file
