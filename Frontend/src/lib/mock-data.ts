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
      vi: "Ổ gà lớn gây nguy hiểm giao thông",
      en: "Large pothole creating traffic hazard",
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
    address: { vi: "Ngã tư Hùng Vương – Phan Chu Trinh, Đà Nẵng", en: "Hung Vuong & Phan Chu Trinh, Da Nang" },
    reporter: "Nguyễn Văn A",
    createdAt: "14:20 — Hôm nay",
    timeline: [
      { status: "pending", label: { vi: "Tiếp nhận hệ thống", en: "Received by system" }, at: "14:20" },
      { status: "inProgress", label: { vi: "Đã chuyển đội duy tu", en: "Dispatched to repair crew" }, at: "15:02" },
    ],
  },
  {
    id: "DN-2410-0141",
    title: {
      vi: "Ô nhiễm rác thải tại kênh thoát nước",
      en: "Trash pollution in drainage canal",
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
      { status: "inProgress", label: { vi: "Đội vệ sinh ra hiện trường", en: "Sanitation team dispatched" }, at: "11:40 12/10" },
      { status: "resolved", label: { vi: "Đã dọn dẹp hoàn tất", en: "Cleaned & resolved" }, at: "16:20 13/10" },
    ],
  },
  {
    id: "DN-2410-0140",
    title: { vi: "Đèn đường hỏng tại Liên Chiểu", en: "Street light failure in Lien Chieu" },
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
    title: { vi: "Tai nạn giao thông gần cầu Rồng", en: "Traffic accident near Dragon Bridge" },
    description: {
      vi: "Va chạm giữa xe máy và ô tô con, có người bị thương nhẹ, cần lực lượng CSGT.",
      en: "Motorbike-car collision near Dragon Bridge, minor injuries reported.",
    },
    image: potholeImg,
    status: "urgent",
    category: "traffic",
    district: "Hải Châu",
    ward: "Hải Châu I",
    address: { vi: "Đầu cầu Rồng, Hải Châu", en: "Dragon Bridge approach, Hai Chau" },
    reporter: "Phạm Thị D",
    licensePlate: "43A-678.91",
    createdAt: "2 phút trước",
    timeline: [
      { status: "urgent", label: { vi: "Khẩn cấp — chuyển CSGT", en: "Urgent — routed to traffic police" }, at: "Just now" },
    ],
  },
];

export const kpis = {
  total: 1284,
  resolved: 942,
  pending: 156,
  avgHours: 48,
};

export const wardPerformance: WardPerformance[] = [
  { ward: "Hải Châu I", resolved: 312, avgHrs: 36 },
  { ward: "Hòa Khánh Nam", resolved: 248, avgHrs: 41 },
  { ward: "Hòa Minh", resolved: 189, avgHrs: 52 },
  { ward: "Thanh Khê Tây", resolved: 173, avgHrs: 44 },
  { ward: "An Hải Bắc", resolved: 152, avgHrs: 39 },
];
