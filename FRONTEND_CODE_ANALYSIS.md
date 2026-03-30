# Frontend Codebase Analysis Report
**Project:** AssetForU  
**Analysis Date:** 2026-03-30  
**Scope:** `/frontend/src` directory  

---

## Executive Summary
The codebase contains **40+ issues** across multiple categories. Critical issues involve missing error handling, silent catch blocks, and improper use of `alert()`. High-severity issues include unused imports, console logging, type safety problems, and API error suppression.

---

## CRITICAL SEVERITY Issues (Must Fix Immediately)

### 1. Error Handling - Silent Catch Blocks / Empty Catch Handlers
**Impact:** Silent failures make debugging difficult and hide API errors

#### Files:
- [app/(main)/page.tsx](app/(main)/page.tsx#L60) - Line 60: `catch { // ignore }`
- [app/admin/store/page.tsx](app/admin/store/page.tsx#L18-L19) - Lines 18-19: `catch { /* ignore */ }`
- [app/admin/campaigns/page.tsx](app/admin/campaigns/page.tsx#L24) - Line 24: `catch { /* ignore */ }`
- [app/(main)/profile/page.tsx](app/(main)/profile/page.tsx#L69) - Line 69: `catch { // ignore }`
- [app/(main)/profile/page.tsx](app/(main)/profile/page.tsx#L157) - Line 157: `catch { // ignore }`
- [store/index.ts](store/index.ts#L158) - Lines 158, 165, 172: Multiple empty catch blocks in load functions
- [store/index.ts](store/index.ts#L33) - Line 33: `catch { set({ isLoaded: true }); }`

**Details:**  
Multiple locations use empty or comment-only catch blocks that suppress errors completely. This prevents error logging and makes it impossible to diagnose issues in production.

**Fix:**  
```typescript
// BAD ❌
catch { /* ignore */ }

// GOOD ✅
catch (error) {
  console.error('Failed to load campaigns:', error);
  // Optionally notify user
}
```

---

### 2. Error Suppression in API Calls
**Impact:** Network errors, auth failures, and API issues are silently ignored

#### Files:
- [components/Navbar.tsx](components/Navbar.tsx#L39-L40) - Line 39: `.catch(() => {})`
- [app/admin/page.tsx](app/admin/page.tsx#L19) - Line 19: `.catch(() => {}).finally(...)`
- [app/admin/users/page.tsx](app/admin/users/page.tsx#L22) - Line 22: `.catch(() => {}).finally(...)`
- [app/admin/transactions/page.tsx](app/admin/transactions/page.tsx#L19) - Line 19: `.catch(() => {}).finally(...)`

**Details:**  
Multiple Promise chains suppress errors with empty catch blocks, causing the app to fail silently when API calls fail.

**Example:**
```typescript
// CURRENT (BAD) ❌
walletAPI.get()
  .then((r) => setWalletBalance(r.data.data.balance))
  .catch(() => {});  // Silently ignores errors

// RECOMMENDED ✅
walletAPI.get()
  .then((r) => setWalletBalance(r.data.data.balance))
  .catch((error) => {
    console.error('Failed to fetch wallet:', error);
    setError('Unable to load wallet balance');
  });
```

---

### 3. Using `alert()` for Error Handling
**Impact:** Poor UX, blocks entire application, not dismissible

#### Files:
- [components/CampaignCard.tsx](components/CampaignCard.tsx#L42) - Line 42: `alert(err.response?.data?.message || 'Failed to access campaign')`
- [components/StoreItemCard.tsx](components/StoreItemCard.tsx#L31) - Line 31: `alert(err.response?.data?.message || 'Failed to add to cart')`
- [app/(main)/campaigns/[id]/checkout/page.tsx](app/(main)/campaigns/[id]/checkout/page.tsx#L91) - Line 91: `alert(\`You can only purchase...)`

**Details:**  
Using browser `alert()` is an anti-pattern. It blocks user interaction and provides poor UX. Use custom Toast component instead.

**Fix:**
```typescript
// BAD ❌
alert(err.response?.data?.message || 'Failed');

// GOOD ✅
import { addToast } from '@/components/Toast';
addToast('Failed to add to cart', 'error');
```

---

### 4. Race Condition in Zustand Store
**Impact:** Potential data inconsistency and state update issues

#### File:
- [store/index.ts](store/index.ts#L34-L60) - `setAuth()` function

**Details:**  
The `setAuth()` function synchronously modifies localStorage and performs lookups/merges that could race with other auth operations. Multiple overlapping writes to profile_overrides could cause data loss.

**Issue:**
```typescript
setAuth: (user, token) => {
  // Multiple operations that could race
  const overridesRaw = localStorage.getItem('af_profile_overrides');
  const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
  // ... modifications ...
  localStorage.setItem('af_profile_overrides', JSON.stringify(overrides));
  set({ user: merged, token, isLoaded: true });
}
```

---

### 5. Missing API Error Response Validation
**Impact:** Runtime crashes from accessing undefined properties

#### Files:
- [components/Navbar.tsx](components/Navbar.tsx#L39) - Line 39: `r.data.data.balance` - assumes nested data structure
- [app/admin/page.tsx](app/admin/page.tsx#L19) - Line 19: `r.data.data` - no null check
- [components/Header.tsx](components/Header.tsx#L45) - Similar pattern

**Details:**  
API responses are accessed without checking if the expected structure exists. If API returns error or unexpected structure, the app crashes.

**Example:**
```typescript
// CURRENT (UNSAFE) ❌
.then((r) => setWalletBalance(r.data.data.balance))

// SAFE ✅
.then((r) => {
  const balance = r?.data?.data?.balance;
  if (typeof balance === 'number' && balance >= 0) {
    setWalletBalance(balance);
  } else {
    throw new Error('Invalid balance response');
  }
})
```

---

## HIGH SEVERITY Issues

### 6. Console Logging in Production Code
**Impact:** Verbose logs in production, potential security issues

#### Files:
- [components/UserDashboard.tsx](components/UserDashboard.tsx#L28) - Line 28: `console.error('Failed to load dashboard data:', e)`

**Details:**  
Console logs left in production code. Should use proper logging service.

**Fix:**  
Remove or replace with environment-aware logging:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.error('Failed to load dashboard data:', e);
}
```

---

### 7. Unused Imports
**Impact:** Code bloat, confusing for maintenance, potential vulnerabilities in dependencies

#### Files:
- [app/(main)/campaigns/[id]/checkout/page.tsx](app/(main)/campaigns/[id]/checkout/page.tsx#L122) - Likely unused `useRouter` or other imports
- [components/SignupModal.tsx](components/SignupModal.tsx#L53, L91, L137) - Multiple unused imports
- [components/CampaignCard.tsx](components/CampaignCard.tsx#L40) - Potentially unused imports
- [components/StoreItemCard.tsx](components/StoreItemCard.tsx#L31) - Check import usage
- [store/index.ts](store/index.ts#L34, L55) - Check for unused utility functions

**Examples to check:**
- Icons that are imported but not rendered
- Type imports when not used for type annotations
- Component imports in pages that aren't used

---

### 8. Missing Type Annotations / Use of `unknown`
**Impact:** Type safety issues, harder to catch bugs at compile time

#### Files with `unknown` type casting:
- [components/CampaignCard.tsx](components/CampaignCard.tsx#L42) - `catch (e: unknown)`
- [components/StoreItemCard.tsx](components/StoreItemCard.tsx#L31) - `catch (e: unknown)`
- [components/SignupModal.tsx](components/SignupModal.tsx#L53, L91) - `catch (e: unknown)`
- [app/(main)/campaigns/[id]/page.tsx](app/(main)/campaigns/[id]/page.tsx#L65) - Error type as `unknown`

**Issue:**  
Using `unknown` type for errors requires manual type casting:
```typescript
// CURRENT ❌
catch (e: unknown) {
  const err = e as { response?: { data?: { message?: string } } };
  alert(err.response?.data?.message || 'Failed');
}

// BETTER ✅
catch (error: AxiosError) {
  const message = getErrorMessage(error);
  addToast(message, 'error');
}
```

---

### 9. Missing `window` Check in Browser APIs
**Impact:** SSR errors, hydration mismatches

#### Files to review:
- [components/Navbar.tsx](components/Navbar.tsx#L31-L36) - Direct `window.addEventListener` without check
- [components/Header.tsx](components/Header.tsx#L39-L47) - `window.location.assign()` 
- [store/index.ts](store/index.ts) - Multiple localStorage accesses that need `typeof window !== 'undefined'` checks

**Pattern Found:**
Many files do check `typeof window !== 'undefined'`, but some don't consistently.

**Example Issue:**
```typescript
// In components/Navbar.tsx Line 31
useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 8);  // No window check
  window.addEventListener('scroll', handler);
  return () => window.removeEventListener('scroll', handler);
}, []);
```

---

### 10. Hardcoded Data with No Fallback
**Impact:** UI breaks if data structure changes, no real API validation

#### Files:
- [app/(main)/campaigns/[id]/page.tsx](app/(main)/campaigns/[id]/page.tsx#L31-L40) - Hardcoded quiz questions
- [app/(main)/page.tsx](app/(main)/page.tsx) - Uses hardcoded campaign data from `data/dreamCampaigns`
- [app/store/page.tsx](app/store/page.tsx#L1-L50) - Hardcoded product/service catalogs

**Details:**  
The app mixes hardcoded demo data with real API calls. Makes it unclear which data is real vs. for testing.

---

### 11. Potential Props Type Issues
**Impact:** Type safety, runtime errors with wrong props

#### File:
- [store/index.ts](store/index.ts#L34) - The `updateUser()` function doesn't validate which fields are actually updatable
- [store/index.ts](store/index.ts#L55) - `addTransaction` expects specific structure but doesn't validate input

**Example:**
```typescript
// Missing validation
updateUser: (updates) =>
  set((s) => {
    const updated = s.user ? { ...s.user, ...updates } : null;
    // No validation that updates Contains valid User properties
    if (updated) {
      localStorage.setItem('af_user', JSON.stringify(updated));
    }
    return { user: updated };
  }),
```

---

### 12. Inconsistent Error State Management
**Impact:** Potential unhandled error states, no user feedback

#### Files with inconsistent patterns:
- [components/SignupModal.tsx](components/SignupModal.tsx) - Sets/clears error state but relies on manual clearing
- [app/admin/campaigns/page.tsx](app/admin/campaigns/page.tsx) - No error state at all
- [app/(main)/asset/page.tsx](app/(main)/asset/page.tsx#L28) - Catches error but doesn't set error state

**Issue:**  
Some components show errors to users (SignupModal), others silently fail (asset/page).

---

## MEDIUM SEVERITY Issues

### 13. Missing Dependency Arrays / Infinite Loops
**Impact:** Performance issues, unnecessary re-renders

#### Files to verify:
- [app/(main)/page.tsx](app/(main)/page.tsx#L45-L70) - `useEffect` with `loadLimits` async helper
- [app/(main)/campaigns/[id]/page.tsx](app/(main)/campaigns/[id]/page.tsx#L45-L85) - Complex dependency chain
- [app/(main)/profile/page.tsx](app/(main)/profile/page.tsx#L77) - Multiple effects with `load` callback

**Pattern Issue:**  
Some useEffect hooks define async functions inside that aren't in dependency arrays, which is okay per React docs but can cause closure issues. Better to wrap in useCallback.

---

### 14. No Loading State for Form Submissions
**Impact:** Users might click buttons multiple times, causing duplicate requests

#### Files:
- [app/admin/campaigns/page.tsx](app/admin/campaigns/page.tsx#L40-L42) - `handleStatusChange` has no loading state, but updates button `disabled` with `saving`
- [app/admin/store/page.tsx](app/admin/store/page.tsx#L25-L35) - Form submission doesn't disable submit button

**Issue:**  
If API is slow, user can click multiple times before response arrives.

---

### 15. Component Re-renders Due to Inline Objects/Functions
**Impact:** Unnecessary re-renders of child components

#### Files:
- [app/(main)/page.tsx](app/(main)/page.tsx#L110-L120) - Inline object literal in `.map()` calls
- [app/store/page.tsx](app/store/page.tsx#L26) - Inline `adCards` array
- [components/Header.tsx](components/Header.tsx#L45) - Inline notifications array

**Example:**
```typescript
// INEFFICIENT ❌
{notifications.map((n) => (
  <div key={n.id} className="...">
```

Notifications array is recreated every render. Better:
```typescript
// BETTER ✅
const notifications = useMemo(() => [...], [user]);
```

---

### 16. Missing API Error Type Definition
**Impact:** Unsafe error handling, type casting everywhere

#### File:
- [lib/api.ts](lib/api.ts) - No custom error type or response structure type

**Issue:**  
Every catch block has to manually type:
```typescript
const err = e as { response?: { data?: { message?: string } } };
```

**Better:**  
Define error types:
```typescript
interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
      code?: string;
    };
  };
}
```

---

### 17. No Loading Skeleton / Placeholder States
**Impact:** Poor perceived performance, layout shift

#### Files:
- [components/UserDashboard.tsx](components/UserDashboard.tsx) - Shows nothing while `loading`
- [app/(main)/asset/page.tsx](app/(main)/asset/page.tsx#L22) - Only shows loading spinner
- [app/admin/page.tsx](app/admin/page.tsx#L16) - No UI while loading stats

---

### 18. Unvalidated LocalStorage Data
**Impact:** Type errors, data corruption

#### Files:
- [store/index.ts](store/index.ts#L142-L175) - `loadTransactions()`, `loadActivity()`, `loadFavorites()` parse JSON without validation
- [app/(main)/campaigns/[id]/page.tsx](app/(main)/campaigns/[id]/page.tsx#L51) - Parses localStorage without type validation

**Pattern:**  
```typescript
// UNSAFE ❌
const map = raw ? JSON.parse(raw) as Record<string, number> : {};

// SAFER ✅
const map = raw ? JSON.parse(raw) : {};
if (!isValidMap(map)) return {};
```

---

### 19. Missing Null/Undefined Checks on Optional Props
**Impact:** Runtime errors when props are undefined

#### Files:
- [components/CampaignCard.tsx](components/CampaignCard.tsx#L30) - `campaign.image_url || 'fallback'` - good
- [components/StoreItemCard.tsx](components/StoreItemCard.tsx#L44) - Direct access to properties without null coalescing
- [app/(main)/profile/page.tsx](app/(main)/profile/page.tsx#L91) - `activity` might be undefined

---

### 20. Inconsistent API Base URL Handling
**Impact:** Potential host mismatch in production

#### File:
- [lib/api.ts](lib/api.ts#L3) - Uses `NEXT_PUBLIC_API_URL` with hardcoded fallback to localhost

**Issue:**
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
```

Should ensure NEXT_PUBLIC_API_URL is always set in production.

---

## LOW SEVERITY Issues

### 21. Magic Numbers / Hardcoded Values
**Impact:** Code maintainability, difficult to change behavior

#### Files:
- [components/CampaignImageCarousel.tsx](components/CampaignImageCarousel.tsx#L18) - Line 18: `5000` ms autoplay interval hardcoded
- [components/CampaignImageCarousel.tsx](components/CampaignImageCarousel.tsx#L30) - Line 30: `10000` ms resume autoplay hardcoded
- [components/SignupModal.tsx](components/SignupModal.tsx) - Countdown hardcoded to `30` seconds
- [app/(main)/campaigns/[id]/page.tsx](app/(main)/campaigns/[id]/page.tsx) - Limit hardcoded to `3`
- [components/StoreItemCard.tsx](components/StoreItemCard.tsx#L33) - Timeout hardcoded to `2000` ms

**Better:**
```typescript
const AUTOPLAY_INTERVAL = 5000; // ms
const RESUME_DELAY = 10000;     // ms
```

---

### 22. Missing Role-Based Access Control
**Impact:** Users might see admin UI, no proper authorization

#### File:
- [app/admin/page.tsx](app/admin/page.tsx) - No check that current user is admin
- [lib/useProtectedAction.ts](lib/useProtectedAction.ts) - Only checks if logged in, not role

**Issue:**  
Nothing prevents a regular user from navigating to `/admin` routes (even if API blocks them).

**Better:**
```typescript
function AdminPage() {
  const user = useAuthStore(s => s.user);
  
  if (!user || user.role !== 'admin') {
    return <AccessDenied />;
  }
  // ...
}
```

---

### 23. No SEO Meta Tags
**Impact:** Poor search engine optimization

#### Files:
- [app/layout.tsx](app/layout.tsx) - Likely missing meta tags
- Campaign detail pages - No dynamic meta tags for sharing
- Store pages - No structured data

---

### 24. Inefficient List Rendering
**Impact:** Performance issues with large lists

#### Files:
- [app/(main)/page.tsx](app/(main)/page.tsx#L360-L375) - FAQ items use index as implied key (regenerated)
- Many `.map()` calls should use stable `key` prop

**Example:**
```typescript
// CURRENT ❌
{items.map((item) => <div className="...">

// BETTER ✅
{items.map((item) => <div key={item.id} className="...">
```

---

### 25. No Request/Response Logging (Debug Mode)
**Impact:** Difficult to debug API integration issues

#### File:
- [lib/api.ts](lib/api.ts) - Interceptors exist but don't log in dev mode

**Add:**
```typescript
api.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[API Request]', config.method?.toUpperCase(), config.url);
  }
  return config;
});
```

---

### 26. No Retry Logic for Failed API Calls
**Impact:** Network blips cause immediate failures

#### File:
- [lib/api.ts](lib/api.ts) - No retry mechanism

**Example:** Campaign participation fails due to temporary network issue - user loses their selection.

---

### 27. Potential State Update on Unmounted Component
**Impact:** Memory leaks, warnings in console

#### Files:
- [components/UserDashboard.tsx](components/UserDashboard.tsx#L18) - Sets state after unmount possible
- [app/(main)/campaigns/[id]/page.tsx](app/(main)/campaigns/[id]/page.tsx#L80) - Multiple setState calls could happen after unmount
- [app/(main)/asset/page.tsx](app/(main)/asset/page.tsx#L32) - `loadAssets` sets state without cleanup

**Pattern:**
```typescript
useEffect(() => {
  const loadData = async () => {
    const res = await api.get(...);
    setCampaigns(res.data); // Could be called after unmount!
  };
  loadData();
  // Missing: AbortController or mounted flag
}, []);
```

---

### 28. Inconsistent Naming Conventions
**Impact:** Code readability, maintainability

#### Files:
- Some files use `campRes` (campaign response), others use `r` or `res`
- Some use `setWalletBalance`, others `setBalance`
- Mix of `user_id` (snake_case) and `userId` in code
- API responses use `data.data.field` - inconsistent nesting

**Example from codebase:**
```typescript
// Different naming patterns
const [campRes, walRes] = await Promise.all([...]);
const [profileRes, walletRes] = await Promise.all([...]);
const r = await storeAPI.listItems();
```

---

### 29. No Network Status Handling
**Impact:** App doesn't handle offline state

#### Impact Areas:
- API calls fail silently when offline
- No visual indicator that user is offline
- No queue of pending requests for sync when back online

---

### 30. Unused Component Props
**Impact:** Confusion about component API

#### File:
- [components/CampaignCard.tsx](components/CampaignCard.tsx#L18) - `onParticipated` callback is optional but always defined

**Check if actually used before removing.**

---

### 31. DateTime Formatting Inconsistencies
**Impact:** User confusion, potential timezone issues

#### Files:
- [components/Header.tsx](components/Header.tsx) - Manual string formatting: `new Date(item.createdAt).toLocaleString()`
- [app/(main)/activity/page.tsx](app/(main)/activity/page.tsx) - Same pattern
- [store/index.ts](store/index.ts) - Uses `new Date().toISOString()` for storage

**Better:**  
Use consistent formatting with `date-fns` or `dayjs` throughout:
```typescript
import { formatDistanceToNow } from 'date-fns';
const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true });
```

---

### 32. No Analytics/Tracking
**Impact:** Can't measure user behavior, engagement metrics

**Recommendation:** Add event tracking for:
- Campaign participation
- Store purchases
- User signups
- Pages visited

---

### 33. Scroll Position Not Preserved
**Impact:** Poor UX when navigating and returning

**Issue:** No scroll restoration on page changes/back navigation.

---

### 34. No Input Validation in Forms
**Impact:** Invalid data sent to server

#### Files:
- [app/(main)/profile/page.tsx](app/(main)/profile/page.tsx#L170) - Bank account/IFSC not validated
- [app/admin/campaigns/page.tsx](app/admin/campaigns/page.tsx#L29) - Form inputs not validated before submit
- [app/admin/store/page.tsx](app/admin/store/page.tsx) - Title and credit_cost min check missing

---

### 35. Missing Accessibility Features
**Impact:** App not usable for people with disabilities

#### Issues:
- Buttons using `onClick` with `role="button"` instead of proper `<button>` elements
- No ARIA labels on icon buttons
- Color contrast might be insufficient in some places
- No keyboard navigation in some modals

**Example from codebase:**
```typescript
// Line 331 in app/store/page.tsx - BAD ❌
<div
  key={item.id}
  role="button"
  tabIndex={0}
  onClick={() => router.push(...)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(...);
    }
  }}
>

// Should just be ✅
<button onClick={() => router.push(...)} type="button">
```

---

### 36. Potential XSS Vulnerability
**Impact:** Security risk if user data is not sanitized

#### Files:
- [app/(main)/campaigns/[id]/page.tsx](app/(main)/campaigns/[id]/page.tsx#L233) - `{option}` in button text - ensure comes from safe source
- Any user input displayed requires sanitization

**Check:** Ensure hardcoded data is used, not user input, or sanitize with DOMPurify.

---

### 37. No Token Refresh Logic
**Impact:** User logged out unexpectedly when token expires

#### File:
- [lib/api.ts](lib/api.ts#L24-L30) - 401 handler doesn't refresh token

Should implement refresh token rotation.

---

### 38. Missing Performance Metrics
**Impact:** Can't track performance issues

**Recommendation:** Add Web Vitals monitoring:
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
```

---

### 39. Image Optimization Issues
**Impact:** Large images slow down page load

#### Issues:
- External images can be optimized with Next.js Image component
- No WebP format variants
- No srcset for responsive images in some places

**Example - Better:**
```typescript
<Image
  src={campaign.image_url}
  alt={campaign.title}
  fill
  priority={false}
  sizes="(max-width: 768px) 100vw, 33vw"
  quality={75}
/>
```

---

### 40. No Rate Limiting on Client
**Impact:** Potential abuse, server overload

**Example:** User can spam "Add to Cart" button multiple times quickly.

**Better:** Disable button after click for 500ms or implement debounce.

---

## Summary Table

| Severity | Count | Category |
|----------|-------|----------|
| **CRITICAL** | 5 | Error handling, API validation, silent failures |
| **HIGH** | 7 | Console logs, unused imports, type safety, SSR issues |
| **MEDIUM** | 9 | Performance, state management, component patterns |
| **LOW** | 19 | Code style, accessibility, analytics, best practices |
| **TOTAL** | **40+** | |

---

## Recommended Priority for Fixes

### Phase 1 (This Sprint) - CRITICAL
1. Add proper error handling to all catch blocks
2. Replace `alert()` with Toast component
3. Fix API error response validation
4. Remove silent catch blocks
5. Add console.error logging to error states

### Phase 2 (Next Sprint) - HIGH
6. Fix console.log statements
7. Create proper error type definitions
8. Add missing type annotations
9. Implement window check consistently
10. Extract hardcoded values to constants

### Phase 3 (Future Sprint) - MEDIUM/LOW
11. Add loading skeletons
12. Improve accessibility
13. Add analytics tracking
14. Implement retry logic
15. Optimize images and bundle size

---

## Tools & Recommendations

1. **ESLint Rules to Add:**
   - `no-empty-catch` - Catch empty blocks
   - `no-console` - Production console statements
   - `unused-vars` - Unused imports/variables
   - `react-hooks/rules-of-hooks` - Hook dependency arrays

2. **TypeScript Strict Mode:**
   - Set `strict: true` in tsconfig.json
   - Enable `noImplicitAny: true`
   - Enable `noImplicitThis: true`

3. **Testing:**
   - Add unit tests for error handling
   - Add integration tests for API flows
   - Add e2e tests for critical paths

4. **Error Tracking:**
   - Implement Sentry or Rollbar for error monitoring
   - Log stack traces for production debugging

5. **Performance Monitoring:**
   - Add Lighthouse CI
   - Monitor Core Web Vitals
   - Profile bundle size

---

## Files with Most Issues

| File | Issues |
|------|--------|
| `app/(main)/page.tsx` | 4 |
| `store/index.ts` | 6 |
| `components/SignupModal.tsx` | 4 |
| `app/(main)/campaigns/[id]/page.tsx` | 5 |
| `app/admin/page.tsx` | 3 |
| `app/(main)/profile/page.tsx` | 4 |
| `lib/api.ts` | 3 |

---

**Report Generated:** 2026-03-30  
**Analyzer:** GitHub Copilot Code Review Agent  
**Recommendation:** Address CRITICAL issues before deploying to production.
