export interface StaticNewsItem {
  id: string;
  badge: "Thông báo" | "Chính sách" | "Hoạt động" | "Hạ tầng - Đô thị" | "Kinh tế - Xã hội" | "An ninh - Trật tự" | "Khác" | "Hướng dẫn" | "Tin tức";
  date: string;
  title: string;
  summary: string;
  image: string;
  link: string;
  views: number;
}

export const staticNews: StaticNewsItem[] = [
  {
    id: "news-1",
    badge: "Thông báo",
    date: "30/05/2026",
    title: "Hội nghị triển khai nhiệm vụ phát triển kinh tế - xã hội 6 tháng cuối năm 2026",
    summary: "Ngày 30/5, UBND thành phố Đà Nẵng tổ chức hội nghị triển khai nhiệm vụ phát triển kinh tế - xã hội 6 tháng cuối năm 2026 với sự tham dự của lãnh đạo Thành ủy, HĐND, UBND và các sở ngành...",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
    link: "/notifications",
    views: 1245,
  },
  {
    id: "news-2",
    badge: "Hạ tầng - Đô thị",
    date: "28/05/2026",
    title: "Đà Nẵng khởi công dự án cải tạo, nâng cấp tuyến đường ven biển Hoàng Sa - Võ Nguyên Giáp",
    summary: "Dự án có tổng mức đầu tư hơn 1.200 tỷ đồng, nhằm hoàn thiện hạ tầng giao thông, chỉnh trang đô thị và thúc đẩy phát triển du lịch biển...",
    image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=600&q=80",
    link: "/my-reports",
    views: 2034,
  },
  {
    id: "news-3",
    badge: "Chính sách",
    date: "27/05/2026",
    title: "Chính sách hỗ trợ người dân, doanh nghiệp trong chuyển đổi số giai đoạn 2026 - 2030",
    summary: "UBND thành phố ban hành chính sách hỗ trợ người dân, doanh nghiệp tiếp cận và ứng dụng công nghệ số, hướng tới xây dựng chính quyền số, kinh tế số và xã hội số...",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
    link: "/my-reports",
    views: 1560,
  },
  {
    id: "news-4",
    badge: "Hoạt động",
    date: "26/05/2026",
    title: "Đà Nẵng phát động Tháng hành động vì trẻ em năm 2026",
    summary: "Nhiều hoạt động thiết thực, ý nghĩa được tổ chức nhằm chăm lo, bảo vệ trẻ em, tạo môi trường an toàn, lành mạnh để trẻ em phát triển toàn diện...",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80",
    link: "/my-reports",
    views: 980,
  },
  {
    id: "news-5",
    badge: "Thông báo",
    date: "25/05/2026",
    title: "Thông báo về việc tiếp nhận và xử lý phản ánh hiện trường",
    summary: "Cổng thông tin tiếp nhận phản ánh hiện trường về trật tự đô thị, vệ sinh môi trường, hạ tầng kỹ thuật trên địa bàn thành phố Đà Nẵng.",
    image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80",
    link: "/my-reports",
    views: 3245,
  },
  {
    id: "news-6",
    badge: "Kinh tế - Xã hội",
    date: "24/05/2026",
    title: "Kế hoạch phát triển kinh tế - xã hội thành phố Đà Nẵng năm 2026",
    summary: "Tập trung các giải pháp trọng tâm nhằm duy trì đà tăng trưởng, hỗ trợ tháo gỡ khó khăn cho doanh nghiệp và đảm bảo an sinh xã hội.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
    link: "/my-reports",
    views: 2890,
  },
  {
    id: "news-7",
    badge: "Khác",
    date: "23/05/2026",
    title: "Hướng dẫn sử dụng Cổng thông tin phản ánh hiện trường",
    summary: "Hướng dẫn chi tiết các bước gửi phản ánh và theo dõi kết quả xử lý qua website và ứng dụng di động cho người dân.",
    image: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=600&q=80",
    link: "/my-reports",
    views: 2156,
  },
  {
    id: "news-8",
    badge: "An ninh - Trật tự",
    date: "22/05/2026",
    title: "Đà Nẵng tăng cường công tác đảm bảo trật tự an toàn giao thông",
    summary: "Tăng cường tuần tra kiểm soát, xử lý nghiêm các hành vi vi phạm trật tự an toàn giao thông, lấn chiếm lòng lề đường đô thị.",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
    link: "/my-reports",
    views: 1845,
  },
  {
    id: "news-9",
    badge: "Kinh tế - Xã hội",
    date: "21/05/2026",
    title: "Chương trình hỗ trợ thanh niên khởi nghiệp đổi mới sáng tạo năm 2026",
    summary: "Tạo điều kiện thuận lợi về cơ chế, chính sách và nguồn vốn để phát triển các dự án khởi nghiệp sáng tạo của thế hệ trẻ thành phố.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
    link: "/my-reports",
    views: 1632,
  },
];

export interface StaticFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const staticFaqs: StaticFaqItem[] = [
  {
    id: "faq-1",
    question: "Làm thế nào để gửi phản ánh?",
    answer:
      "Công dân gửi phản ánh qua 4 bước đơn giản: Chụp ảnh hoặc quay video sự việc thực tế, nhập nội dung mô tả, chọn vị trí chính xác trên bản đồ, rồi nhấn gửi. Hệ thống sẽ ngay lập tức tiếp nhận và chuyển giao tới cơ quan có thẩm quyền liên quan giải quyết.",
  },
  {
    id: "faq-2",
    question: "Làm thế nào để theo dõi phản ánh của tôi?",
    answer:
      "Mỗi phản ánh gửi đi sẽ được cấp một mã số theo dõi (Ví dụ: PA-2024-0001). Bạn có thể nhập mã này tại ô tìm kiếm của trang chủ, hoặc truy cập vào mục 'Phản ánh của tôi' để cập nhật nhanh chóng tiến trình xử lý chi tiết của cơ quan chức năng.",
  },
  {
    id: "faq-3",
    question: "Những lĩnh vực nào được tiếp nhận phản ánh?",
    answer:
      "Chúng tôi tiếp nhận mọi phản ánh thuộc các lĩnh vực đô thị bao gồm: Giao thông đường bộ, Vấn đề vệ sinh môi trường, Sự cố hạ tầng kỹ thuật (đường sá, cống rãnh, đèn chiếu sáng), Trật tự an ninh xã hội, và các hành vi lấn chiếm lòng lề đường đô thị.",
  },
  {
    id: "faq-4",
    question: "Thời gian xử lý phản ánh là bao lâu?",
    answer:
      "Thời gian giải quyết và phản hồi thông tin sẽ tuân thủ nghiêm ngặt theo quy chế tiếp nhận của UBND Thành phố Đà Nẵng, tùy thuộc vào tính chất khẩn cấp và mức độ phức tạp của từng loại phản ánh thực tế.",
  },
];
