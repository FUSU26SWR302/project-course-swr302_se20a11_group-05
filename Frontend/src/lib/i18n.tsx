import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "vi" | "en";

type Dict = Record<string, { vi: string; en: string }>;

export const dict: Dict = {
  "brand.name": { vi: "Đà Nẵng Kết Nối", en: "Da Nang Listens" },
  "brand.tag": { vi: "Cổng phản ánh chính quyền thành phố", en: "Municipal Reporting Portal" },
  "nav.home": { vi: "Trang chủ", en: "Home" },
  "nav.report": { vi: "Gửi phản ánh", en: "Submit report" },
  "nav.myReports": { vi: "Báo cáo của tôi", en: "My reports" },
  "nav.assistant": { vi: "Trợ lý AI", en: "AI Assistant" },
  "nav.ward": { vi: "Cổng cán bộ phường", en: "Ward portal" },
  "nav.police": { vi: "Cổng công an", en: "Police portal" },
  "nav.cityAdmin": { vi: "Lãnh đạo thành phố", en: "City leadership" },
  "nav.login": { vi: "Đăng nhập", en: "Sign in" },
  "a11y.fontSmaller": { vi: "Cỡ chữ nhỏ hơn", en: "Smaller text" },
  "a11y.fontLarger": { vi: "Cỡ chữ lớn hơn", en: "Larger text" },
  "lang.vi": { vi: "Tiếng Việt", en: "Vietnamese" },
  "lang.en": { vi: "Tiếng Anh", en: "English" },

  "home.title": { vi: "Thành Phố Kết Nối ", en: "A City Connect" },
  "home.subtitle": {
    vi: "Gửi phản ánh về hạ tầng đô thị, môi trường, an ninh trật tự — cùng xây dựng Đà Nẵng văn minh, an toàn.",
    en: "Report urban infrastructure, environment, and safety issues — together we build a better Da Nang.",
  },
  "home.cta.report": { vi: "Gửi phản ánh ngay", en: "Submit a report" },
  "home.cta.reportHint": {
    vi: "Chụp ảnh hoặc quay video dưới 1 phút",
    en: "Take a photo or short video",
  },
  "home.kpi.total": { vi: "Tổng số phản ánh", en: "Total reports" },
  "home.kpi.resolved": { vi: "Đã xử lý", en: "Resolved" },
  "home.kpi.pending": { vi: "Đang chờ duyệt", en: "Awaiting review" },
  "home.kpi.avg": { vi: "Thời gian trung bình", en: "Avg response" },
  "home.recent": { vi: "Phản ánh gần đây", en: "Recent reports" },
  "home.filter.all": { vi: "Tất cả", en: "All" },
  "home.filter.env": { vi: "Môi trường", en: "Environment" },
  "home.filter.traffic": { vi: "Giao thông", en: "Traffic" },
  "home.filter.infra": { vi: "Hạ tầng", en: "Infrastructure" },
  "home.map.title": { vi: "Bản đồ phản ánh trực tuyến", en: "Live reports map" },
  "home.map.cta": { vi: "Xem bản đồ toàn thành phố", en: "View full city map" },
  "home.hotline.title": { vi: "Tổng đài 1022", en: "Hotline 1022" },
  "home.hotline.body": {
    vi: "Mọi thắc mắc cần hỗ trợ trực tiếp, vui lòng gọi đường dây nóng của thành phố.",
    en: "For direct help, please call the city's 24/7 hotline.",
  },

  "status.pending": { vi: "Đang chờ duyệt", en: "Pending" },
  "status.inProgress": { vi: "Đang xử lý", en: "In progress" },
  "status.resolved": { vi: "Đã hoàn thành", en: "Resolved" },
  "status.urgent": { vi: "Khẩn cấp", en: "Urgent" },

  "report.title": { vi: "Gửi phản ánh mới", en: "New report" },
  "report.step": { vi: "Bước", en: "Step" },
  "report.step1": { vi: "Hình ảnh & video", en: "Photo & video" },
  "report.step2": { vi: "Vị trí GPS", en: "Location" },
  "report.step3": { vi: "Mô tả bằng giọng nói", en: "Voice description" },
  "report.takePhoto": { vi: "Chụp ảnh", en: "Take photo" },
  "report.recordVideo": { vi: "Quay video (≥ 10s)", en: "Record video (≥ 10s)" },
  "report.locationConfirm": {
    vi: "Bạn có đang ở: 123 Nguyễn Văn Linh, Đà Nẵng?",
    en: "Are you at: 123 Nguyen Van Linh, Da Nang?",
  },
  "report.useLocation": { vi: "Đúng, dùng vị trí này", en: "Yes, use this location" },
  "report.changeLocation": { vi: "Chọn vị trí khác", en: "Pick another location" },
  "report.tapToSpeak": { vi: "Nhấn để nói", en: "Tap to speak" },
  "report.recording": { vi: "Đang ghi âm…", en: "Recording…" },
  "report.next": { vi: "Tiếp tục", en: "Continue" },
  "report.back": { vi: "Quay lại", en: "Back" },
  "report.submit": { vi: "Gửi phản ánh", en: "Submit report" },
  "report.submitted": { vi: "Đã gửi phản ánh thành công!", en: "Report submitted successfully!" },

  "my.title": { vi: "Báo cáo của tôi", en: "My reports" },
  "my.subtitle": {
    vi: "Theo dõi tiến độ tất cả phản ánh bạn đã gửi.",
    en: "Track every report you've submitted.",
  },
  "my.timeline.submitted": { vi: "Đã tiếp nhận", en: "Submitted" },
  "my.timeline.inProgress": { vi: "Đang xử lý", en: "In progress" },
  "my.timeline.resolved": { vi: "Đã hoàn thành", en: "Resolved" },

  "assistant.title": { vi: "Trợ lý AI Khẩn cấp", en: "Emergency AI Assistant" },
  "assistant.subtitle": {
    vi: "Hỏi về hỗ trợ khẩn cấp, quy trình hành chính, hoặc đường dây nóng.",
    en: "Ask about emergencies, civic procedures, or hotlines.",
  },
  "assistant.placeholder": {
    vi: "Ví dụ: Nhà tôi ngập, tôi cần đi đâu?",
    en: "e.g. My house is flooded, where can I go?",
  },
  "assistant.send": { vi: "Gửi", en: "Send" },

  "ward.title": {
    vi: "Bảng điều khiển — UBND Phường Hải Châu I",
    en: "Dashboard — Hai Chau I Ward",
  },
  "ward.incoming": { vi: "Phản ánh đến", en: "Incoming reports" },
  "ward.accept": { vi: "Tiếp nhận", en: "Accept" },
  "ward.reject": { vi: "Từ chối", en: "Reject" },
  "ward.resolve": { vi: "Đánh dấu hoàn thành", en: "Mark resolved" },

  "police.title": { vi: "Cổng Công an", en: "Police Portal" },
  "police.licensePlate": { vi: "Biển số nhận diện (OCR)", en: "Detected license plate (OCR)" },
  "police.broadcast": { vi: "Phát cảnh báo khu vực", en: "Broadcast area alert" },

  "city.title": { vi: "Bảng điều hành Lãnh đạo Thành phố", en: "City Leadership Dashboard" },
  "city.kpi.wardPerf": { vi: "Hiệu suất theo phường", en: "Performance by ward" },
  "city.export": { vi: "Xuất báo cáo CSV", en: "Export CSV report" },

  "login.title": { vi: "Đăng nhập", en: "Sign in" },
  "login.phone": { vi: "Số điện thoại", en: "Phone number" },
  "login.password": { vi: "Mật khẩu", en: "Password" },
  "login.submit": { vi: "Đăng nhập", en: "Sign in" },
  "login.register": { vi: "Tạo tài khoản mới", en: "Create an account" },

  "footer.org": {
    vi: "Cơ quan chủ quản: Ủy ban Nhân dân Thành phố Đà Nẵng. Vận hành bởi Trung tâm IOC.",
    en: "Operated by Da Nang City People's Committee — IOC.",
  },

  /* ──────────── Header extras ──────────── */
  "header.brand": { vi: "ĐÀ NẴNG KẾT NỐI", en: "DA NANG CONNECT" },
  "header.brandSub": { vi: "CỔNG THÔNG TIN PHẢN ÁNH HIỆN TRƯỜNG", en: "FIELD REPORT PORTAL" },
  "header.login": { vi: "Đăng nhập / Đăng ký", en: "Sign in / Register" },
  "header.loginShort": { vi: "Đăng nhập", en: "Sign in" },
  "header.staffArea": { vi: "Khu vực cán bộ", en: "Staff area" },
  "header.langLabel": { vi: "Ngôn ngữ / Language:", en: "Language:" },
  "header.profile": { vi: "Thông tin cá nhân", en: "Personal info" },
  "header.myReports": { vi: "Phản ánh của tôi", en: "My reports" },
  "header.myNotifications": { vi: "Thông báo của tôi", en: "My notifications" },
  "header.logout": { vi: "Đăng xuất", en: "Log out" },

  /* ──────────── Homepage — Hero ──────────── */
  "home.hero.line1": { vi: "Cùng xây dựng", en: "Together building" },
  "home.hero.line2": { vi: "Đà Nẵng văn minh, hiện đại", en: "A civilized, modern Da Nang" },
  "home.hero.desc": {
    vi: "Nền tảng kết nối người dân với chính quyền thành phố. Tiếp nhận, xử lý và phản hồi nhanh chóng các vấn đề đô thị, an ninh trật tự, môi trường, hạ tầng...",
    en: "Platform connecting citizens with city government. Quickly receive, process and respond to urban, security, environment, and infrastructure issues...",
  },
  "home.cta.guide": { vi: "Hướng dẫn sử dụng", en: "User guide" },

  /* ──────────── Homepage — Search ──────────── */
  "home.search.title": { vi: "Tìm kiếm thông tin", en: "Search information" },
  "home.search.placeholder": {
    vi: "Nhập từ khóa, mã phản ánh, địa điểm...",
    en: "Enter keyword, report code, location...",
  },
  "home.search.popular": { vi: "Tìm kiếm phổ biến", en: "Popular searches" },
  "home.search.label": { vi: "Tìm kiếm", en: "Search" },

  /* ──────────── Homepage — Category ──────────── */
  "home.category.title": { vi: "Phản ánh theo lĩnh vực", en: "Reports by category" },
  "home.category.traffic": { vi: "Giao thông", en: "Traffic" },
  "home.category.trafficDesc": { vi: "Kẹt xe, đèn tín hiệu hỏng, vi phạm giao thông...", en: "Traffic jams, broken signals, traffic violations..." },
  "home.category.env": { vi: "Môi trường", en: "Environment" },
  "home.category.envDesc": { vi: "Rác thải, ô nhiễm tiếng ồn, nước thải...", en: "Waste, noise pollution, wastewater..." },
  "home.category.infra": { vi: "Hạ tầng đô thị", en: "Urban infrastructure" },
  "home.category.infraDesc": { vi: "Đường hỏng, nắp cống mất, đèn đường hỏng...", en: "Broken roads, missing manholes, broken streetlights..." },
  "home.category.security": { vi: "An ninh trật tự", en: "Public safety" },
  "home.category.securityDesc": { vi: "Trộm cắp, gây rối trật tự công cộng...", en: "Theft, public disturbance..." },
  "home.category.order": { vi: "Trật tự đô thị", en: "Urban order" },
  "home.category.orderDesc": { vi: "Lấn chiếm lòng đường, vỉa hè...", en: "Encroachment on roads, sidewalks..." },
  "home.category.other": { vi: "Khác", en: "Other" },
  "home.category.otherDesc": { vi: "Các vấn đề khác chưa được phân loại...", en: "Other uncategorized issues..." },

  "category.official.TRAFFIC.name": { vi: "Giao thông", en: "Traffic" },
  "category.official.TRAFFIC.desc": { vi: "Kẹt xe, tai nạn, đèn tín hiệu hỏng...", en: "Traffic congestion, accidents, damaged traffic signals..." },
  "category.official.URBAN_INFRASTRUCTURE.name": { vi: "Hạ tầng đô thị", en: "Urban Infrastructure" },
  "category.official.URBAN_INFRASTRUCTURE.desc": { vi: "Đường hỏng, nắp cống mất, đèn đường hỏng...", en: "Road damage, missing manhole covers, broken street lights..." },
  "category.official.ENVIRONMENT.name": { vi: "Môi trường", en: "Environment" },
  "category.official.ENVIRONMENT.desc": { vi: "Rác thải bừa bãi, ô nhiễm nguồn nước, cây xanh gãy đổ, tiếng ồn...", en: "Illegal dumping, water pollution, overgrown trees, noise disturbance..." },
  "category.official.PUBLIC_SECURITY.name": { vi: "An ninh trật tự", en: "Public Security" },
  "category.official.PUBLIC_SECURITY.desc": { vi: "Trộm cắp, gây rối trật tự công cộng, đối tượng nghi vấn, cần hỗ trợ khẩn cấp...", en: "Theft, public disturbance, suspicious activities, emergency assistance..." },
  "category.official.CONSTRUCTION.name": { vi: "Xây dựng", en: "Construction" },
  "category.official.CONSTRUCTION.desc": { vi: "Xây dựng không phép, công trình mất an toàn, rơi vãi vật liệu xây dựng...", en: "Unauthorized building, unsafe construction sites, building material spills..." },
  "category.official.FIRE_SAFETY.name": { vi: "Phòng cháy chữa cháy", en: "Fire Safety" },
  "category.official.FIRE_SAFETY.desc": { vi: "Nguy cơ cháy nổ, lối thoát hiểm bị chặn, thiết bị PCCC hỏng hoặc thiếu...", en: "Fire hazards, blocked escape routes, missing or broken fire equipment..." },

  /* ──────────── Homepage — Statistics ──────────── */
  "home.stats.title": { vi: "Thống kê toàn thành phố", en: "City-wide statistics" },
  "home.stats.total": { vi: "Tổng phản ánh", en: "Total Feedback" },
  "home.stats.resolved": { vi: "Đã xử lý", en: "Processed" },
  "home.stats.inProgress": { vi: "Đang xử lý", en: "Processing" },
  "home.stats.overdue": { vi: "Quá hạn", en: "Overdue" },
  "home.stats.last24h": { vi: "24 giờ qua", en: "Last 24 hours" },
  "home.stats.last7days": { vi: "7 ngày qua", en: "Last 7 days" },
  "home.stats.last1month": { vi: "1 tháng qua", en: "Last 1 month" },
  "home.stats.last3months": { vi: "3 tháng qua", en: "Last 3 months" },
  "home.stats.last1year": { vi: "1 năm qua", en: "Last 1 year" },

  /* ──────────── Homepage — Recent reports ──────────── */
  "home.recent.viewAll": { vi: "Xem tất cả", en: "View all" },
  "home.recent.empty": { vi: "Không có phản ánh nào gần đây.", en: "No recent reports." },
  "home.map.viewOnMap": { vi: "Xem trên bản đồ", en: "View on map" },

  /* ──────────── Homepage — Hotline ──────────── */
  "home.hotline.support": { vi: "Tổng đài hỗ trợ", en: "Support hotline" },
  "home.hotline.desc": { vi: "Mọi thắc mắc cần hỗ trợ, vui lòng gọi", en: "For support, please call" },
  "home.hotline.free": { vi: "Miễn phí", en: "Free" },
  "home.hotline.chat": { vi: "Chat với trợ lý ảo", en: "Chat with AI assistant" },
  "home.hotline.email": { vi: "Gửi email hỗ trợ", en: "Send support email" },

  /* ──────────── Homepage — Process steps ──────────── */
  "home.process.title": { vi: "Quy trình gửi phản ánh", en: "Report submission process" },
  "home.process.step1": { vi: "Chụp ảnh / quay video", en: "Take photo / record video" },
  "home.process.step1Desc": { vi: "Ghi lại hiện trạng vấn đề cần phản ánh.", en: "Capture the current state of the issue." },
  "home.process.step2": { vi: "Nhập thông tin", en: "Enter information" },
  "home.process.step2Desc": { vi: "Cung cấp nội dung, địa điểm và thông tin liên hệ.", en: "Provide content, location and contact info." },
  "home.process.step3": { vi: "Gửi phản ánh", en: "Submit report" },
  "home.process.step3Desc": { vi: "Hệ thống tiếp nhận và chuyển đến cơ quan xử lý.", en: "System receives and forwards to the relevant agency." },
  "home.process.step4": { vi: "Theo dõi kết quả", en: "Track results" },
  "home.process.step4Desc": { vi: "Nhận thông báo và theo dõi tiến độ xử lý phản ánh.", en: "Receive notifications and track processing progress." },

  /* ──────────── Homepage — News & FAQ ──────────── */
  "home.news.title": { vi: "Tin tức & thông báo", en: "News & announcements" },
  "home.news.empty": { vi: "Chưa có tin tức hoặc thông báo mới.", en: "No news or announcements yet." },
  "home.faq.title": { vi: "Câu hỏi thường gặp", en: "Frequently asked questions" },
  "home.faq.viewAll": { vi: "Xem tất cả câu hỏi", en: "View all questions" },

  /* ──────────── Homepage — Trust strip ──────────── */
  "home.trust.security": { vi: "Bảo mật thông tin", en: "Data security" },
  "home.trust.securityDesc": { vi: "Thông tin của bạn được bảo mật tuyệt đối", en: "Your information is kept absolutely secure" },
  "home.trust.transparent": { vi: "Xử lý minh bạch", en: "Transparent processing" },
  "home.trust.transparentDesc": { vi: "Quy trình xử lý công khai, minh bạch", en: "Open and transparent processing procedures" },
  "home.trust.fast": { vi: "Phản hồi nhanh chóng", en: "Quick response" },
  "home.trust.fastDesc": { vi: "Cam kết phản hồi trong thời gian sớm nhất", en: "Committed to responding as soon as possible" },
  "home.trust.better": { vi: "Vì một Đà Nẵng tốt đẹp hơn", en: "For a better Da Nang" },
  "home.trust.betterDesc": { vi: "Chung tay xây dựng thành phố đáng sống", en: "Together building a livable city" },

  /* ──────────── Status labels (shared) ──────────── */
  "status.resolvedLabel": { vi: "Đã xử lý", en: "Resolved" },
  "status.inProgressLabel": { vi: "Đang xử lý", en: "In progress" },
  "status.rejected": { vi: "Từ chối", en: "Rejected" },
  "status.pendingReview": { vi: "Chờ tiếp nhận", en: "Awaiting review" },

  /* ──────────── Category labels (shared) ──────────── */
  "category.infra": { vi: "Hạ tầng", en: "Infrastructure" },
  "category.env": { vi: "Môi trường", en: "Environment" },
  "category.traffic": { vi: "Giao thông", en: "Traffic" },
  "category.security": { vi: "An ninh", en: "Safety" },
  "category.other": { vi: "Khác", en: "Other" },

  /* ──────────── Report form ──────────── */
  "report.form.titleLabel": { vi: "Tiêu đề phản ánh", en: "Report title" },
  "report.form.titlePlaceholder": { vi: "VD: Ổ gà lớn trên đường Hùng Vương", en: "E.g.: Large pothole on Hung Vuong road" },
  "report.form.category": { vi: "Loại phản ánh", en: "Report category" },
  "report.form.media": { vi: "Ảnh / Video", en: "Photos / Videos" },
  "report.form.uploadPhoto": { vi: "Upload ảnh", en: "Upload photos" },
  "report.form.uploadVideo": { vi: "Upload video", en: "Upload video" },
  "report.form.content": { vi: "Nội dung phản ánh", en: "Report details" },
  "report.form.contentPlaceholder": {
    vi: "Mô tả rõ sự cố, mức độ ảnh hưởng và thông tin cần cơ quan chức năng biết...",
    en: "Describe the issue, its impact, and information the authorities need to know...",
  },
  "report.form.submitting": { vi: "Đang gửi...", en: "Submitting..." },

  /* ──────────── Report location ──────────── */
  "report.loc.title": { vi: "Vị trí của bạn", en: "Your location" },
  "report.loc.loading": { vi: "Đang lấy vị trí...", en: "Getting location..." },
  "report.loc.confirmed": { vi: "Đã xác định vị trí", en: "Location confirmed" },
  "report.loc.none": { vi: "Chưa có vị trí", en: "No location set" },
  "report.loc.refresh": { vi: "Lấy lại vị trí", en: "Refresh location" },
  "report.loc.mapTitle": { vi: "Bản đồ vị trí", en: "Location map" },
  "report.loc.mapHint": { vi: "Kiểm tra ghim vị trí hiện tại trước khi gửi.", en: "Check the location pin before submitting." },
  "report.loc.loadingMap": { vi: "Đang tải bản đồ...", en: "Loading map..." },
  "report.loc.gpsLoading": { vi: "Đang lấy vị trí GPS hiện tại...", en: "Getting current GPS location..." },
  "report.loc.gpsRequest": { vi: "Đang yêu cầu vị trí GPS hiện tại...", en: "Requesting current GPS location..." },
  "report.loc.addressLoading": { vi: "Đang xác định địa chỉ...", en: "Determining address..." },
  "report.loc.noAddress": { vi: "Đã lấy được GPS nhưng chưa xác định được địa chỉ.", en: "GPS acquired but address could not be determined." },
  "report.loc.clickRefresh": { vi: "Bấm Lấy lại vị trí để xác định vị trí của bạn.", en: "Click Refresh location to determine your location." },
  "report.loc.expectedWard": { vi: "Phường/Xã xử lý dự kiến:", en: "Expected processing ward:" },
  "report.loc.gpsSuccess": { vi: "Đã lấy vị trí GPS hiện tại.", en: "Current GPS location acquired." },

  /* ──────────── Report success ──────────── */
  "report.success.codeLabel": { vi: "Mã phản ánh / Report ID:", en: "Report ID:" },
  "report.success.viewReports": { vi: "Xem báo cáo của tôi", en: "View my reports" },
  "report.success.goHome": { vi: "Về trang chủ", en: "Back to home" },
  "report.success.toast": { vi: "Gửi phản ánh thành công!", en: "Report submitted successfully!" },

  /* ──────────── Report errors ──────────── */
  "report.err.login": { vi: "Vui lòng đăng nhập để gửi phản ánh.", en: "Please sign in to submit a report." },
  "report.err.category": { vi: "Vui lòng chọn loại phản ánh.", en: "Please select a report category." },
  "report.err.photo": { vi: "Vui lòng tải lên ít nhất 1 ảnh.", en: "Please upload at least 1 photo." },
  "report.err.video": { vi: "Vui lòng tải lên ít nhất 1 video.", en: "Please upload at least 1 video." },
  "report.err.description": { vi: "Vui lòng nhập nội dung phản ánh.", en: "Please enter report details." },
  "report.err.gps": { vi: "Chưa có tọa độ GPS. Vui lòng bấm Lấy lại vị trí.", en: "No GPS coordinates. Please click Refresh location." },
  "report.err.generic": { vi: "Không thể gửi phản ánh. Vui lòng thử lại.", en: "Unable to submit report. Please try again." },
  "report.err.notImage": { vi: "không phải file ảnh.", en: "is not an image file." },
  "report.err.notVideo": { vi: "không phải file video.", en: "is not a video file." },
  "report.err.maxPhotos": { vi: "Chỉ được upload tối đa 5 ảnh.", en: "Maximum 5 photos allowed." },
  "report.err.removeFile": { vi: "Xóa tệp đã chọn", en: "Remove selected file" },
  "report.err.removeVideo": { vi: "Xóa video đã chọn", en: "Remove selected video" },
  "report.err.fileSizeExceeded": { vi: "vượt quá", en: "exceeds" },
  "report.err.geocodeFailed": { vi: "Đã lấy được GPS nhưng chưa xác định được địa chỉ.", en: "GPS acquired but address could not be resolved." },

  /* ──────────── Report GPS errors ──────────── */
  "report.gps.unsupported": { vi: "Trình duyệt của bạn không hỗ trợ GPS.", en: "Your browser does not support GPS." },
  "report.gps.denied": { vi: "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền GPS để gửi phản ánh.", en: "You have denied location access. Please grant GPS permission to submit a report." },
  "report.gps.unavailable": { vi: "Không thể xác định vị trí hiện tại. Vui lòng kiểm tra GPS hoặc kết nối mạng.", en: "Unable to determine current location. Please check GPS or network connection." },
  "report.gps.timeout": { vi: "Yêu cầu lấy vị trí đã hết thời gian chờ. Vui lòng thử lại.", en: "Location request timed out. Please try again." },
  "report.gps.generic": { vi: "Không thể lấy vị trí hiện tại. Vui lòng thử lại.", en: "Unable to get current location. Please try again." },

  /* ──────────── Footer ──────────── */
  "footer.brand": { vi: "ĐÀ NẴNG KẾT NỐI", en: "DA NANG CONNECT" },
  "footer.brandSub": { vi: "CỔNG THÔNG TIN PHẢN ÁNH HIỆN TRƯỜNG", en: "FIELD REPORT PORTAL" },
  "footer.intro": {
    vi: "Hệ thống kết nối người dân với chính quyền thành phố Đà Nẵng, tiếp nhận và xử lý các phản ánh hiện trường nhằm xây dựng thành phố văn minh, hiện đại.",
    en: "A system connecting citizens with Da Nang city government, receiving and processing field reports to build a civilized, modern city.",
  },
  "footer.nav": { vi: "ĐIỀU HƯỚNG", en: "NAVIGATION" },
  "footer.navHome": { vi: "Trang chủ", en: "Home" },
  "footer.navMyReports": { vi: "Phản ánh của tôi", en: "My reports" },
  "footer.navSearch": { vi: "Tra cứu", en: "Search" },
  "footer.navNotif": { vi: "Thông báo", en: "Notifications" },
  "footer.navGuide": { vi: "Hướng dẫn", en: "Guide" },
  "footer.navAbout": { vi: "Về chúng tôi", en: "About us" },
  "footer.contact": { vi: "LIÊN HỆ", en: "CONTACT" },
  "footer.hotlineLabel": { vi: "Đường dây nóng:", en: "Hotline:" },
  "footer.callNow": { vi: "Gọi ngay 1022", en: "Call 1022 now" },
  "footer.copyright": { vi: "© 2026 UBND Thành phố Đà Nẵng. Bảo lưu mọi quyền.", en: "© 2026 Da Nang City People's Committee. All rights reserved." },
};

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof typeof dict) => string;
}
const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("vi");
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? (localStorage.getItem("locale") as Locale | null) : null;
    if (saved === "vi" || saved === "en") setLocale(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("locale", locale);
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);
  const t = (key: keyof typeof dict) => dict[key]?.[locale] ?? String(key);
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/* ---------- Font scale (A+ / A-) ---------- */
interface FontScaleCtx {
  scale: number;
  inc: () => void;
  dec: () => void;
}
const FontScaleContext = createContext<FontScaleCtx | null>(null);

export function FontScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? Number(localStorage.getItem("fontScale") || "1") : 1;
    if (!Number.isNaN(saved) && saved >= 0.85 && saved <= 1.45) setScale(saved);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--font-scale", String(scale));
    }
    if (typeof window !== "undefined") localStorage.setItem("fontScale", String(scale));
  }, [scale]);
  const inc = () => setScale((s) => Math.min(1.45, +(s + 0.1).toFixed(2)));
  const dec = () => setScale((s) => Math.max(0.85, +(s - 0.1).toFixed(2)));
  return (
    <FontScaleContext.Provider value={{ scale, inc, dec }}>{children}</FontScaleContext.Provider>
  );
}
export function useFontScale() {
  const ctx = useContext(FontScaleContext);
  if (!ctx) throw new Error("useFontScale must be used inside FontScaleProvider");
  return ctx;
}
