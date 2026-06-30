/**
 * Campaign Store - shared in-memory + localStorage state.
 *
 * Trang my-reports và các route campaigns.* dùng store này làm fallback khi
 * backend chưa có dữ liệu, đồng thời giữ phản hồi UI nhanh cho dữ liệu local.
 */

export type CampaignCategory =
  | "environment"
  | "infrastructure"
  | "public_safety"
  | "construction"
  | "fire_safety";

export type CampaignStatus = "pending_review" | "recruiting" | "inProgress" | "completed";

export interface Campaign {
  id: string;
  name: string;
  nameEn: string;
  category: CampaignCategory;
  status: CampaignStatus;
  ward: string;
  createdBy: string;
  createdByEn: string;
  participants: number;
  target: number;
  progress: number;
  reports: number;
  daysLeft: number;
  impactScore: number;
  affectedCitizens: number;
  cover: string;
  desc: string;
  descEn: string;
  featured: boolean;
  linkedFeedbackId?: string | number | null;
  linkedFeedbackCode?: string | null;
  linkedFeedbackTitle?: string | null;
  startTime?: string;
  endTime?: string;
  locationText?: string;
  privateLocationText?: string;
  requiredTools?: string;
  organizerContact?: string;
  currentUserJoinStatus?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  privateDetailsVisible?: boolean;
  canJoin?: boolean;
  canManage?: boolean;
  canComment?: boolean;
  canFeedback?: boolean;
  createdAt: string;
}

const COVER_BY_CATEGORY: Record<CampaignCategory, string> = {
  environment:
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
  infrastructure:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
  public_safety:
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
  construction:
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=600&q=80",
  fire_safety:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
};

const SEED_CREATED_AT = "2026-06-17T00:00:00.000Z";

const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: "green-hoa-xuan",
    name: "Chiến dịch Xanh Hòa Xuân",
    nameEn: "Green Hoa Xuan Campaign",
    category: "environment",
    status: "inProgress",
    ward: "Hòa Xuân",
    createdBy: "Đoàn TN & UBND Phường",
    createdByEn: "Youth Union & Ward Authority",
    participants: 42,
    target: 50,
    progress: 68,
    reports: 18,
    daysLeft: 12,
    impactScore: 8.5,
    affectedCitizens: 1245,
    cover: COVER_BY_CATEGORY.environment,
    desc: "Dọn dẹp các điểm xả rác tự phát, cải tạo mương thoát nước và tôn tạo không gian xanh.",
    descEn: "Cleanup illegal dumping sites, restore drainage canals, and improve green spaces.",
    featured: true,
    createdAt: SEED_CREATED_AT,
  },
  {
    id: "beach-cleanup-my-khe",
    name: "Làm sạch bãi biển Mỹ Khê",
    nameEn: "Beach Cleanup My Khe",
    category: "environment",
    status: "recruiting",
    ward: "Mỹ An",
    createdBy: "Hội Liên hiệp Thanh niên",
    createdByEn: "Youth Federation",
    participants: 18,
    target: 80,
    progress: 22,
    reports: 11,
    daysLeft: 21,
    impactScore: 9.1,
    affectedCitizens: 2800,
    cover: COVER_BY_CATEGORY.environment,
    desc: "Vệ sinh đường bờ biển Mỹ Khê, thu gom rác nhựa và nâng cao ý thức bảo vệ biển.",
    descEn: "Clean My Khe shoreline, collect plastic waste and raise ocean protection awareness.",
    featured: false,
    createdAt: SEED_CREATED_AT,
  },
  {
    id: "drainage-restoration",
    name: "Cải tạo hệ thống thoát nước Hải Châu",
    nameEn: "Drainage Restoration Hai Chau",
    category: "infrastructure",
    status: "inProgress",
    ward: "Hải Châu 1",
    createdBy: "UBND Q. Hải Châu",
    createdByEn: "Hai Chau District Authority",
    participants: 35,
    target: 45,
    progress: 78,
    reports: 24,
    daysLeft: 7,
    impactScore: 7.8,
    affectedCitizens: 4150,
    cover: COVER_BY_CATEGORY.infrastructure,
    desc: "Khơi thông, nạo vét cống rãnh tại các điểm ngập lụt nghiêm trọng khu vực nội đô.",
    descEn: "Dredge and restore blocked drains at severe flood-prone areas in the city centre.",
    featured: false,
    createdAt: SEED_CREATED_AT,
  },
  {
    id: "community-safety",
    name: "An toàn cộng đồng Thanh Khê",
    nameEn: "Community Safety Awareness Thanh Khe",
    category: "public_safety",
    status: "recruiting",
    ward: "Thanh Khê Đông",
    createdBy: "Công an Phường",
    createdByEn: "Ward Police",
    participants: 9,
    target: 30,
    progress: 30,
    reports: 8,
    daysLeft: 28,
    impactScore: 6.9,
    affectedCitizens: 1860,
    cover: COVER_BY_CATEGORY.public_safety,
    desc: "Tuyên truyền phòng chống tội phạm, lắp camera an ninh và nâng cao ý thức dân cư.",
    descEn: "Crime prevention outreach, security camera installation and community awareness.",
    featured: false,
    createdAt: SEED_CREATED_AT,
  },
  {
    id: "tree-planting",
    name: "Chương trình Trồng cây Đà Nẵng Xanh",
    nameEn: "Da Nang Tree Planting Program",
    category: "environment",
    status: "completed",
    ward: "Hòa Khánh Bắc",
    createdBy: "Sở Tài nguyên Môi trường",
    createdByEn: "Dept. of Natural Resources",
    participants: 120,
    target: 100,
    progress: 100,
    reports: 6,
    daysLeft: 0,
    impactScore: 9.7,
    affectedCitizens: 6200,
    cover: COVER_BY_CATEGORY.environment,
    desc: "Trồng 4,500 cây xanh bóng mát dọc các tuyến đường chính và công viên thành phố.",
    descEn: "Planted 4,500 shade trees along main roads and city parks.",
    featured: false,
    createdAt: SEED_CREATED_AT,
  },
  {
    id: "illegal-ads-removal",
    name: "Xóa biển quảng cáo sai phép Ngũ Hành Sơn",
    nameEn: "Illegal Advertising Removal Ngu Hanh Son",
    category: "infrastructure",
    status: "inProgress",
    ward: "Ngũ Hành Sơn",
    createdBy: "Thanh tra Xây dựng",
    createdByEn: "Construction Inspectorate",
    participants: 22,
    target: 25,
    progress: 88,
    reports: 15,
    daysLeft: 4,
    impactScore: 7.2,
    affectedCitizens: 3200,
    cover: COVER_BY_CATEGORY.infrastructure,
    desc: "Tháo dỡ toàn bộ biển quảng cáo không phép gây mất mỹ quan đô thị khu du lịch.",
    descEn: "Remove unlicensed banners and billboards degrading the urban and tourism landscape.",
    featured: false,
    createdAt: SEED_CREATED_AT,
  },
  {
    id: "neighborhood-beautification",
    name: "Làm đẹp Khu phố Liên Chiểu",
    nameEn: "Neighborhood Beautification Lien Chieu",
    category: "environment",
    status: "recruiting",
    ward: "Liên Chiểu",
    createdBy: "Tổ dân phố số 7",
    createdByEn: "Neighborhood Team No.7",
    participants: 5,
    target: 40,
    progress: 12,
    reports: 9,
    daysLeft: 35,
    impactScore: 6.5,
    affectedCitizens: 980,
    cover: COVER_BY_CATEGORY.environment,
    desc: "Sơn tường ngõ hẻm, trồng hoa dọc vỉa hè và lắp đèn chiếu sáng trang trí.",
    descEn: "Paint alleyway murals, plant flowers along sidewalks, and install decorative lighting.",
    featured: false,
    createdAt: SEED_CREATED_AT,
  },
  {
    id: "public-facility-repair",
    name: "Sửa chữa cơ sở hạ tầng công cộng Cẩm Lệ",
    nameEn: "Public Facility Repair Cam Le",
    category: "infrastructure",
    status: "completed",
    ward: "Cẩm Lệ",
    createdBy: "UBND Q. Cẩm Lệ",
    createdByEn: "Cam Le District Authority",
    participants: 56,
    target: 50,
    progress: 100,
    reports: 31,
    daysLeft: 0,
    impactScore: 8.9,
    affectedCitizens: 5400,
    cover: COVER_BY_CATEGORY.infrastructure,
    desc: "Sửa chữa đèn đường hỏng, nắp cống, vỉa hè sụt lún và biển chỉ đường mờ nhạt.",
    descEn: "Repaired broken streetlights, manhole covers, sunken pavements and faded road signs.",
    featured: false,
    createdAt: SEED_CREATED_AT,
  },
];

const STORAGE_KEY = "dn_campaigns_v1";
const STORE_EVENT = "dn_campaigns_updated";

function readStorage(): Campaign[] {
  if (typeof window === "undefined") return SEED_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CAMPAIGNS;
    const parsed = JSON.parse(raw) as Campaign[];
    const seedIds = new Set(SEED_CAMPAIGNS.map((campaign) => campaign.id));
    const userCreated = parsed.filter((campaign) => !seedIds.has(campaign.id));
    return [...SEED_CAMPAIGNS, ...userCreated];
  } catch {
    return SEED_CAMPAIGNS;
  }
}

function writeStorage(campaigns: Campaign[]) {
  if (typeof window === "undefined") return;
  const seedIds = new Set(SEED_CAMPAIGNS.map((campaign) => campaign.id));
  const userCreated = campaigns.filter((campaign) => !seedIds.has(campaign.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userCreated));
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function getCampaigns(): Campaign[] {
  return readStorage();
}

export function getCampaignById(id: string): Campaign | undefined {
  return readStorage().find((campaign) => campaign.id === id);
}

export function createCampaign(params: {
  title: string;
  description: string;
  category: CampaignCategory;
  locationText?: string;
  privateLocationText?: string;
  requiredTools?: string;
  organizerContact?: string;
  maxParticipants?: string;
  startTime?: string;
  endTime?: string;
  linkedFeedbackId?: string | number | null;
  linkedFeedbackCode?: string | null;
  linkedFeedbackTitle?: string | null;
  wardName?: string;
}): Campaign {
  const id = `user-${Date.now()}`;
  const target = Number.parseInt(params.maxParticipants || "30", 10) || 30;

  let daysLeft = 30;
  if (params.endTime) {
    const diff = new Date(params.endTime).getTime() - Date.now();
    daysLeft = Math.max(0, Math.round(diff / 86_400_000));
  }

  const newCampaign: Campaign = {
    id,
    name: params.title,
    nameEn: params.title,
    category: params.category,
    status: "pending_review",
    ward: params.wardName || "Đà Nẵng",
    createdBy: "Cán bộ phường",
    createdByEn: "Ward staff",
    participants: 0,
    target,
    progress: 0,
    reports: params.linkedFeedbackId ? 1 : 0,
    daysLeft,
    impactScore: 0,
    affectedCitizens: 0,
    cover: COVER_BY_CATEGORY[params.category],
    desc: params.description,
    descEn: params.description,
    featured: false,
    linkedFeedbackId: params.linkedFeedbackId,
    linkedFeedbackCode: params.linkedFeedbackCode,
    linkedFeedbackTitle: params.linkedFeedbackTitle,
    startTime: params.startTime,
    endTime: params.endTime,
    locationText: params.locationText,
    privateLocationText: params.privateLocationText,
    requiredTools: params.requiredTools,
    organizerContact: params.organizerContact,
    createdAt: new Date().toISOString(),
  };

  writeStorage([...readStorage(), newCampaign]);
  return newCampaign;
}

export interface CampaignComment {
  id: string;
  author: string;
  role: string;
  avatar: string;
  time: string;
  text: string;
  likes: number;
  replies: {
    id: string;
    author: string;
    role: string;
    avatar: string;
    time: string;
    text: string;
  }[];
}

const COMMENT_KEY_PREFIX = "dn_comments_";

const SEED_COMMENTS: Record<string, CampaignComment[]> = {
  "green-hoa-xuan": [
    {
      id: "c-ghx-1",
      author: "Nguyễn Văn Hùng",
      role: "Trưởng nhóm tình nguyện viên",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      time: "10 phút trước",
      text: "Bên mình đã dọn xong đoạn kênh hở số 2. Lượng rác nhựa ở đây khá nhiều, cần thêm bao tải lớn.",
      likes: 14,
      replies: [],
    },
  ],
};

export function getComments(campaignId: string): CampaignComment[] {
  if (typeof window === "undefined") return SEED_COMMENTS[campaignId] ?? [];
  try {
    const raw = localStorage.getItem(`${COMMENT_KEY_PREFIX}${campaignId}`);
    if (raw) return JSON.parse(raw) as CampaignComment[];
  } catch {
    return SEED_COMMENTS[campaignId] ?? [];
  }
  return SEED_COMMENTS[campaignId] ?? [];
}

export function saveComments(campaignId: string, comments: CampaignComment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${COMMENT_KEY_PREFIX}${campaignId}`, JSON.stringify(comments));
  window.dispatchEvent(new CustomEvent("dn_comments_updated", { detail: { campaignId } }));
}

export function onCommentsChanged(campaignId: string, cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (!detail || detail.campaignId === campaignId) cb();
  };
  window.addEventListener("dn_comments_updated", handler);
  return () => window.removeEventListener("dn_comments_updated", handler);
}

export function getCampaignByFeedbackId(feedbackId: string | number | null | undefined): Campaign | undefined {
  if (!feedbackId) return undefined;
  return readStorage().find((campaign) => String(campaign.linkedFeedbackId) === String(feedbackId));
}

export function onCampaignsChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(STORE_EVENT, cb);
  return () => window.removeEventListener(STORE_EVENT, cb);
}
