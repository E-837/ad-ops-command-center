# Known Issues

Track of known issues, limitations, and planned fixes for the Ad Ops Command Center.

**Last Updated:** Week 10, Day 47 (Production Hardening Complete)  
**Status:** Production Ready with Minor Caveats

---

## Critical Issues (Must Fix Before Production)

**Status:** ✅ NONE - All critical issues resolved

---

## High Priority (Should Fix Soon)

### 1. SSE Connection Limits on Some Browsers

**Issue:**  
Some browsers (specifically IE11) have SSE connection limits or don't support EventSource.

**Workaround:**  
- Modern browsers (Chrome, Firefox, Safari, Edge) fully supported
- IE11 users should upgrade to modern browser

**Planned Fix:**  
- Add polyfill for IE11 (if needed for enterprise clients)
- Or explicitly drop IE11 support (recommended)

**Priority:** Medium (if enterprise clients require IE11)

---

### 2. Large Dataset Pagination

**Issue:**  
Loading 10,000+ campaigns without pagination can slow UI rendering.

**Current Behavior:**  
- API returns all results
- UI may freeze momentarily with very large datasets

**Workaround:**  
- Use limit/offset query parameters
- Default limit is 50

**Planned Fix:**  
- Implement virtual scrolling for large lists
- Add server-side pagination by default
- Lazy load data as user scrolls

**Priority:** Medium

---

### 3. Mobile Touch Targets

**Issue:**  
Some buttons and interactive elements are smaller than recommended 44x44px touch target size on mobile.

**Current Behavior:**  
- Works but can be hard to tap accurately on small screens

**Workaround:**  
- Use desktop/tablet for primary access
- Zoom in on mobile

**Planned Fix:**  
- Increase touch target sizes for all buttons
- Add more padding on mobile breakpoints
- Improve mobile-specific layouts

**Priority:** Medium (if mobile is primary use case)

---

## Medium Priority (Nice to Have)

### 4. Workflow Timeout Configuration

**Issue:**  
Workflow timeout is hardcoded at 5 minutes. Some complex workflows may need longer.

**Current Behavior:**  
- Workflows timeout after 5 minutes
- Error message shown

**Workaround:**  
- Break complex workflows into smaller steps
- Increase timeout in code if needed

**Planned Fix:**  
- Add configurable timeout per workflow
- UI setting for timeout
- Better timeout handling with partial results

**Priority:** Low-Medium

---

### 5. Real-Time Chart Performance with High Frequency Updates

**Issue:**  
Charts may lag if receiving >100 updates per second.

**Current Behavior:**  
- Chart re-renders on every data point
- Can cause frame drops with very high frequency

**Workaround:**  
- Batch updates (implemented)
- Throttle chart re-renders to max 10 FPS

**Planned Fix:**  
- Implement canvas-based rendering for high-frequency charts
- Add data decimation for visualization
- Use web workers for data processing

**Priority:** Low (only affects high-frequency scenarios)

---

### 6. Email Notification Templating

**Issue:**  
Email notifications use basic HTML templates. No visual customization.

**Current Behavior:**  
- Plain HTML emails
- Limited styling

**Workaround:**  
- Customize template in code
- Use Discord/Slack for richer notifications

**Planned Fix:**  
- Visual email template builder
- Drag-and-drop customization
- HTML/CSS editor

**Priority:** Low

---

## Low Priority (Future Enhancements)

### 7. Offline Support

**Issue:**  
No offline capabilities. Requires internet connection.

**Planned Fix:**  
- Service worker for offline static assets
- IndexedDB for local data caching
- Sync when connection restored

**Priority:** Low

---

### 8. Dark Mode Only

**Issue:**  
UI only supports dark mode. No light mode option.

**Workaround:**  
- Dark mode is easier on eyes for long sessions
- Consistent with command center aesthetic

**Planned Fix:**  
- Add light mode toggle
- Use CSS custom properties for theming
- Save user preference

**Priority:** Low (dark mode preferred for this use case)

---

### 9. Browser Extension for Quick Actions

**Issue:**  
No browser extension for quick campaign creation/monitoring.

**Planned Fix:**  
- Chrome/Firefox extension
- Quick actions from toolbar
- Notifications in browser

**Priority:** Low (future enhancement)

---

### 10. Multi-Language Support

**Issue:**  
UI is English only.

**Planned Fix:**  
- i18n library integration
- Localization files
- Language switcher

**Priority:** Low (unless international expansion needed)

---

## Limitations (By Design)

### 1. SQLite for Default Database

**Limitation:**  
SQLite is single-writer, which limits concurrent write operations.

**Impact:**  
- Fine for <100 concurrent users
- May need PostgreSQL/MySQL for larger scale

**Mitigation:**  
- PostgreSQL/MySQL support already implemented
- Easy migration path documented

**Not a Bug:** This is by design for simplicity. SQLite is perfect for small-medium deployments.

---

### 2. Single Server Architecture

**Limitation:**  
Application runs on single server. No built-in clustering.

**Impact:**  
- Single point of failure
- Limited by single server resources

**Mitigation:**  
- PM2 cluster mode supported (multi-process)
- Horizontal scaling documented (load balancer + multiple servers)
- Database can be external (PostgreSQL cluster)

**Not a Bug:** Designed for simplicity. Enterprise users can deploy multiple instances behind load balancer.

---

### 3. Sandbox Mode for Untested Platforms

**Limitation:**  
Some platform operations run in sandbox mode until credentials are verified.

**Impact:**  
- No real campaigns created in sandbox
- Test data returned

**Mitigation:**  
- Configure platform credentials to exit sandbox
- Documentation provided for each platform

**Not a Bug:** Safety feature to prevent accidental real campaign creation during testing.

---

## Recently Fixed Issues

### ✅ Memory Leak in SSE Connections (Fixed Week 10)

**Was:**  
SSE connections not properly cleaned up, leading to memory growth.

**Fixed:**  
Added cleanup on disconnect, periodic connection sweep.

---

### ✅ Database Lock Errors (Fixed Week 9)

**Was:**  
SQLite "database is locked" errors under concurrent writes.

**Fixed:**  
Increased busy timeout, added connection pooling.

---

### ✅ Chart Flicker on Updates (Fixed Week 6)

**Was:**  
Charts would flicker/re-render completely on updates.

**Fixed:**  
Implemented incremental updates, only update changed data.

---

### ✅ Missing Error Messages (Fixed Week 10)

**Was:**  
Some errors showed generic "Something went wrong".

**Fixed:**  
Added comprehensive error messages, error boundary with helpful suggestions.

---

## Reporting Issues

If you encounter a new issue:

1. **Check this document** - It may already be known
2. **Check logs** - `pm2 logs` or `logs/error.log`
3. **Try workaround** - If available above
4. **Report it:**
   - GitHub Issues (if open source)
   - Email: support@example.com
   - Include:
     - Error message
     - Steps to reproduce
     - Browser/OS version
     - Screenshots (if UI issue)

---

## Version History

**Week 10 (v3.0.0)** - Production Hardening
- Fixed all critical issues
- Comprehensive error handling
- Production ready

**Week 9 (v2.5.0)** - Advanced Features
- Fixed database locking
- Added A/B testing

**Week 8 (v2.4.0)** - Integration Hub
- Fixed webhook retries
- Added notifications

**Week 7 (v2.3.0)** - Intelligence Layer
- Added agent memory
- Fixed analytics aggregation

**Week 6 (v2.2.0)** - Real-Time Dashboard
- Fixed SSE memory leak
- Added real-time charts

---

**Note:** This is a living document. Issues are tracked and prioritized continuously. Most issues are minor and have workarounds. The platform is production-ready with these known limitations.

---

*Last Review: Week 10, Day 47*  
*Critical Issues: 0*  
*Production Blockers: 0*  
*Status: Production Ready ✅*
