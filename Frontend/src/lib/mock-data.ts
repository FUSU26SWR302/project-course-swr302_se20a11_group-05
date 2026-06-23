import potholeImg from "@/assets/report-pothole.jpg";
import trashImg from "@/assets/report-trash.jpg";
import streetlightImg from "@/assets/report-streetlight.jpg";

import { type ReportStatus } from "@/types/status";
import { type WardPerformance } from "@/types/api";
export type Category = "infra" | "env" | "traffic" | "safety";

export interface Report {
  id: string;
  title: { vi: string; en: string };
  description: { vi: string; en: string };
  image: string;
  status: ReportStatus;
  category: Category;
  district: string;
  ward: string;
  address: { vi: string; en: string };
  reporter: string;
  createdAt: string;
  licensePlate?: string;
  timeline: { status: ReportStatus; label: { vi: string; en: string }; at: string }[];
}

export const reports: Report[] = [
  {
    id: "DN-2410-0142",
    title: {
      vi: "[DỮ LIỆU MẪU] Ổ gà lớn gây nguy hiểm giao thông",
      en: "[MOCK DATA] Large pothole creating traffic hazard",
    },
    description: {
      vi: "Gần ngã tư Hùng Vương - Phan Chu Trinh, kích thước khoảng 50cm, rất sâu gây nguy hiểm cho người đi xe máy.",
      en: "Near Hung Vuong & Phan Chu Trinh intersection, ~50cm wide, dangerously deep for motorbikes.",
    },
    image: potholeImg,
    status: "inProgress",
    category: "infra",
    district: "Hải Châu",
    ward: "Hải Châu I",
    address: {
      vi: "Ngã tư Hùng Vương – Phan Chu Trinh, Đà Nẵng",
      en: "Hung Vuong & Phan Chu Trinh, Da Nang",
    },
    reporter: "Nguyễn Văn A",
    createdAt: "14:20 — Hôm nay",
    timeline: [
      {
        status: "pending",
        label: { vi: "Tiếp nhận hệ thống", en: "Received by system" },
        at: "14:20",
      },
      {
        status: "inProgress",
        label: { vi: "Đã chuyển đội duy tu", en: "Dispatched to repair crew" },
        at: "15:02",
      },
    ],
  },
  {
    id: "DN-2410-0141",
    title: {
      vi: "[DỮ LIỆU MẪU] Ô nhiễm rác thải tại kênh thoát nước",
      en: "[MOCK DATA] Trash pollution in drainage canal",
    },
    description: {
      vi: "Người dân đổ rác xuống kênh tại phường Hòa Khánh Nam gây mùi hôi nồng nặc.",
      en: "Residents dump trash into canal in Hoa Khanh Nam ward, producing strong odors.",
    },
    image: trashImg,
    status: "resolved",
    category: "env",
    district: "Liên Chiểu",
    ward: "Hòa Khánh Nam",
    address: { vi: "Kênh thoát nước, Hòa Khánh Nam", en: "Drainage canal, Hoa Khanh Nam" },
    reporter: "Lê Thị B",
    createdAt: "09:15 — 12/10/2025",
    timeline: [
      { status: "pending", label: { vi: "Tiếp nhận hệ thống", en: "Received" }, at: "09:15 12/10" },
      {
        status: "inProgress",
        label: { vi: "Đội vệ sinh ra hiện trường", en: "Sanitation team dispatched" },
        at: "11:40 12/10",
      },
      {
        status: "resolved",
        label: { vi: "Đã dọn dẹp hoàn tất", en: "Cleaned & resolved" },
        at: "16:20 13/10",
      },
    ],
  },
  {
    id: "DN-2410-0140",
    title: { vi: "[DỮ LIỆU MẪU] Đèn đường hỏng tại Liên Chiểu", en: "[MOCK DATA] Street light failure in Lien Chieu" },
    description: {
      vi: "Đèn đường khu vực Tôn Đức Thắng không sáng từ tối qua, gây mất an toàn.",
      en: "Street lights on Ton Duc Thang have been out since last night.",
    },
    image: streetlightImg,
    status: "pending",
    category: "infra",
    district: "Liên Chiểu",
    ward: "Hòa Minh",
    address: { vi: "Đường Tôn Đức Thắng, Hòa Minh", en: "Ton Duc Thang St, Hoa Minh" },
    reporter: "Trần Văn C",
    createdAt: "22:05 — Hôm qua",
    timeline: [
      { status: "pending", label: { vi: "Tiếp nhận hệ thống", en: "Received" }, at: "22:05" },
    ],
  },
  {
    id: "DN-2410-0139",
    title: { vi: "[DỮ LIỆU MẪU] Tai nạn giao thông gần cầu Rồng", en: "[MOCK DATA] Traffic accident near Dragon Bridge" },
    description: {
      vi: "Va chạm giữa xe máy và ô tô con, có người bị thương nhẹ, cần lực lượng Công an.",
      en: "Collision between a motorcycle and a car, minor injuries, police assistance required.",
    },
    image: "https://images.unsplash.com/photo-1541416410408-01314df08803?auto=format&fit=crop&q=80&w=800",
    status: "inProgress",
    category: "traffic",
    district: "Hải Châu",
    ward: "Thạch Thang",
    address: { vi: "Đầu cầu Rồng, Hải Châu", en: "Dragon Bridge approach, Hai Chau" },
    reporter: "Phạm Thị D",
    createdAt: "2 phút trước",
    timeline: [
      {
        status: "pending",
        label: { vi: "Người dân đã gửi", en: "Submitted by citizen" },
        at: "10 mins ago",
      },
      {
        status: "inProgress",
        label: { vi: "Phường Thạch Thang tiếp nhận", en: "Accepted by Thach Thang Ward" },
        at: "5 mins ago",
      },
      {
        status: "urgent",
        label: { vi: "Khẩn cấp — chuyển Công an", en: "Urgent — routed to police" },
        at: "Just now",
      },
    ],
  },
  {
    id: "DN-2410-0138",
    title: { vi: "[DỮ LIỆU MẪU] Đậu đỗ xe sai quy định gây ùn tắc", en: "[MOCK DATA] Illegal parking causing traffic jam" },
    description: {
      vi: "Nhiều xe ô tô đậu đỗ ngược chiều trên đường Bạch Đằng cản trở giao thông nghiêm trọng.",
      en: "Multiple cars parked in reverse direction on Bach Dang st causing severe congestion.",
    },
    image: "https://images.unsplash.com/photo-1506526615949-bb11c1d0630b?auto=format&fit=crop&q=80&w=800",
    status: "pending",
    category: "traffic",
    licensePlate: "43A-123.45",
    district: "Hải Châu",
    ward: "Hải Châu I",
    address: { vi: "Đường Bạch Đằng, Hải Châu", en: "Bach Dang St, Hai Chau" },
    reporter: "Lê Văn E",
    createdAt: "15 phút trước",
    timeline: [
      {
        status: "pending",
        label: { vi: "Tiếp nhận hệ thống", en: "Received by system" },
        at: "15 mins ago",
      }
    ],
  },
  {
    id: "DN-2410-0137",
    title: { vi: "[DỮ LIỆU MẪU] Tụ tập gây rối trật tự công cộng", en: "[MOCK DATA] Public disturbance and gathering" },
    description: {
      vi: "Nhóm thanh niên tụ tập đua xe, nẹt bô gây ồn ào khu vực biển Mỹ Khê đêm khuya.",
      en: "Group of youths gathering, street racing and causing noise at My Khe beach area.",
    },
    image: "https://images.unsplash.com/photo-1605338167385-0210e7bbaeb4?auto=format&fit=crop&q=80&w=800",
    status: "urgent",
    category: "safety",
    district: "Sơn Trà",
    ward: "Phước Mỹ",
    address: { vi: "Đường Võ Nguyên Giáp, Sơn Trà", en: "Vo Nguyen Giap St, Son Tra" },
    reporter: "Nguyễn Thị F",
    createdAt: "30 phút trước",
    timeline: [
      {
        status: "pending",
        label: { vi: "Tiếp nhận hệ thống", en: "Received by system" },
        at: "30 mins ago",
      },
      {
        status: "urgent",
        label: { vi: "Báo động Công an trực ban", en: "Alerted Police duty officer" },
        at: "25 mins ago",
      }
    ],
  }
];

export const kpis = {
  total: 1284,
  resolved: 942,
  pending: 156,
  avgHours: 48,
};

export const wardPerformance: WardPerformance[] = [
  { name: "Hải Châu I", resolved: 312, satisfactionPct: 94, avgHrs: 36 },
  { name: "Hòa Khánh Nam", resolved: 248, satisfactionPct: 91, avgHrs: 41 },
  { name: "Hòa Minh", resolved: 189, satisfactionPct: 88, avgHrs: 52 },
  { name: "Thanh Khê Tây", resolved: 173, satisfactionPct: 90, avgHrs: 44 },
  { name: "An Hải Bắc", resolved: 152, satisfactionPct: 92, avgHrs: 39 },
];
