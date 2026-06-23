import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  X, 
  Settings, 
  Shield, 
  MapPin, 
  Users, 
  UserCheck, 
  Eye, 
  Edit2, 
  Trash2,
  Plus,
  Copy,
  History,
  Filter,
  Download,
  Upload,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Grid3X3,
  List,
  RotateCcw,
  Save,
  Workflow
} from "lucide-react";
import { toast } from "sonner";

// Types for permissions system
interface Permission {
  id: number;
  name: string;
  description: string;
  category: "FEEDBACK" | "USER" | "ANALYTICS" | "SYSTEM";
  isActive: boolean;
  priority: number;
}

interface UserPermission {
  id: number;
  userId: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
  };
  permissions: Permission[];
  assignedWards: string[];
  isActive: boolean;
  assignedBy: string;
  assignedAt: string;
  lastModified: string;
}

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  targetRole: string;
  isDefault: boolean;
}

interface AuditLog {
  id: number;
  action: string;
  targetUserId: number;
  targetUserName: string;
  performedBy: string;
  timestamp: string;
  details: string;
  type: "PERMISSION_GRANTED" | "PERMISSION_REVOKED" | "WARD_ASSIGNED" | "WARD_UNASSIGNED" | "ROLE_CHANGED";
}

const PERMISSION_CATEGORIES = {
  FEEDBACK: { label: "Quản lý phản ánh", icon: Settings, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  USER: { label: "Quản lý người dùng", icon: Users, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  ANALYTICS: { label: "Báo cáo & Thống kê", icon: Shield, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  SYSTEM: { label: "Quản trị hệ thống", icon: UserCheck, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "ward_basic",
    name: "Cán bộ phường cơ bản",
    description: "Quyền xem và cập nhật phản ánh trong khu vực được phân công",
    permissions: ["VIEW_FEEDBACKS", "UPDATE_FEEDBACK_STATUS", "ADD_FEEDBACK_COMMENT"],
    targetRole: "WARD_STAFF",
    isDefault: true
  },
  {
    id: "ward_advanced", 
    name: "Cán bộ phường nâng cao",
    description: "Quyền đầy đủ quản lý phản ánh và xem báo cáo khu vực",
    permissions: ["VIEW_FEEDBACKS", "UPDATE_FEEDBACK_STATUS", "ADD_FEEDBACK_COMMENT", "ASSIGN_FEEDBACK", "VIEW_WARD_ANALYTICS"],
    targetRole: "WARD_STAFF",
    isDefault: false
  },
  {
    id: "police_basic",
    name: "Công an cơ bản", 
    description: "Quyền xử lý phản ánh liên quan đến an ninh trật tự",
    permissions: ["VIEW_SECURITY_FEEDBACKS", "UPDATE_SECURITY_STATUS", "VIEW_SECURITY_REPORTS"],
    targetRole: "POLICE",
    isDefault: true
  },
  {
    id: "supervisor",
    name: "Giám sát viên",
    description: "Quyền giám sát và phê duyệt các thao tác của cấp dưới",
    permissions: ["VIEW_ALL_FEEDBACKS", "APPROVE_ACTIONS", "VIEW_TEAM_ANALYTICS", "MANAGE_ASSIGNMENTS"],
    targetRole: "WARD_STAFF",
    isDefault: false
  }
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    action: "Cấp quyền VIEW_FEEDBACKS",
    targetUserId: 101,
    targetUserName: "Trần Văn Nam",
    performedBy: "admin",
    timestamp: "2024-01-20T14:30:00Z",
    details: "Cấp quyền xem phản ánh cho cán bộ phường",
    type: "PERMISSION_GRANTED"
  },
  {
    id: 2,
    action: "Phân công khu vực Hải Châu",
    targetUserId: 101, 
    targetUserName: "Trần Văn Nam",
    performedBy: "admin",
    timestamp: "2024-01-20T14:25:00Z",
    details: "Phân công phụ trách khu vực Hải Châu",
    type: "WARD_ASSIGNED"
  },
  {
    id: 3,
    action: "Thu hồi quyền MANAGE_USERS",
    targetUserId: 102,
    targetUserName: "Lê Thị Mai", 
    performedBy: "admin",
    timestamp: "2024-01-19T16:45:00Z",
    details: "Thu hồi quyền quản lý người dùng do vi phạm chính sách",
    type: "PERMISSION_REVOKED"
  }
];

const ROLE_COLORS: Record<string, string> = {
  CITIZEN: "bg-blue-50 text-blue-700",
  WARD_STAFF: "bg-amber-50 text-amber-700",
  POLICE: "bg-red-50 text-red-700",
  SUPER_ADMIN: "bg-purple-50 text-purple-700",
};

const WARD_LIST = [
  "Hải Châu", "Thanh Khê", "Liên Chiểu", "Sơn Trà", 
  "Ngũ Hành Sơn", "Cẩm Lệ", "Hòa Vang"
];

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserPermission | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [draggedPermission, setDraggedPermission] = useState<Permission | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [selectedWards, setSelectedWards] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  // Mock data - enhanced with more realistic permissions
  const mockUserPermissions: UserPermission[] = [
    {
      id: 1,
      userId: 101,
      user: {
        id: 101,
        username: "tran.van.nam",
        fullName: "Trần Văn Nam",
        email: "nam.tv@danang.gov.vn",
        role: "WARD_STAFF"
      },
      permissions: [
        { id: 1, name: "VIEW_FEEDBACKS", description: "Xem danh sách phản ánh", category: "FEEDBACK", isActive: true, priority: 1 },
        { id: 2, name: "UPDATE_FEEDBACK_STATUS", description: "Cập nhật trạng thái phản ánh", category: "FEEDBACK", isActive: true, priority: 2 },
        { id: 3, name: "ADD_FEEDBACK_COMMENT", description: "Thêm bình luận vào phản ánh", category: "FEEDBACK", isActive: true, priority: 1 },
        { id: 4, name: "VIEW_WARD_ANALYTICS", description: "Xem báo cáo khu vực", category: "ANALYTICS", isActive: true, priority: 2 }
      ],
      assignedWards: ["Hải Châu", "Thanh Khê"],
      isActive: true,
      assignedBy: "admin",
      assignedAt: "2024-01-15T09:00:00Z",
      lastModified: "2024-01-20T14:30:00Z"
    },
    {
      id: 2,
      userId: 102,
      user: {
        id: 102,
        username: "le.thi.mai",
        fullName: "Lê Thị Mai",
        email: "mai.lt@csgt.danang.gov.vn",
        role: "POLICE"
      },
      permissions: [
        { id: 5, name: "VIEW_SECURITY_REPORTS", description: "Xem báo cáo an ninh", category: "ANALYTICS", isActive: true, priority: 3 },
        { id: 6, name: "MANAGE_TRAFFIC_VIOLATIONS", description: "Quản lý vi phạm giao thông", category: "FEEDBACK", isActive: true, priority: 3 },
        { id: 7, name: "ACCESS_EMERGENCY_SYSTEM", description: "Truy cập hệ thống khẩn cấp", category: "SYSTEM", isActive: true, priority: 4 }
      ],
      assignedWards: ["Sơn Trà", "Ngũ Hành Sơn"],
      isActive: true,
      assignedBy: "admin", 
      assignedAt: "2024-01-10T08:00:00Z",
      lastModified: "2024-01-18T16:45:00Z"
    },
    {
      id: 3,
      userId: 103,
      user: {
        id: 103,
        username: "nguyen.van.duc",
        fullName: "Nguyễn Văn Đức",
        email: "duc.nv@danang.gov.vn",
        role: "WARD_STAFF"
      },
      permissions: [
        { id: 1, name: "VIEW_FEEDBACKS", description: "Xem danh sách phản ánh", category: "FEEDBACK", isActive: true, priority: 1 },
        { id: 8, name: "ASSIGN_FEEDBACK", description: "Phân công xử lý phản ánh", category: "FEEDBACK", isActive: true, priority: 3 }
      ],
      assignedWards: ["Liên Chiểu"],
      isActive: false,
      assignedBy: "admin",
      assignedAt: "2024-01-12T10:00:00Z", 
      lastModified: "2024-01-19T11:20:00Z"
    }
  ];

  // Drag and drop handlers
  const handleDragStart = (permission: Permission) => {
    setDraggedPermission(permission);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetUser: UserPermission) => {
    e.preventDefault();
    if (!draggedPermission) return;

    // Check if user already has this permission
    const hasPermission = targetUser.permissions.some(p => p.id === draggedPermission.id);
    if (hasPermission) {
      toast.error("Người dùng đã có quyền này");
      return;
    }

    // Mock assign permission
    toast.success(`Đã cấp quyền "${draggedPermission.description}" cho ${targetUser.user.fullName}`);
    setDraggedPermission(null);
  };

  const applyTemplate = async (userId: number, templateId: string) => {
    const template = ROLE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    try {
      // Mock API call
      toast.success(`Đã áp dụng template "${template.name}"`);
      setShowTemplateModal(false);
    } catch (error) {
      toast.error("Không thể áp dụng template");
    }
  };

  const { data: usersPage, isLoading } = useQuery({
    queryKey: ["admin", "users", "all"],
    queryFn: () => userApi.getAll(0, 200),
    staleTime: 60_000,
  });

  const allUsers = (usersPage?.content ?? []) as any[];
  
  // Filter logic
  const filtered = useMemo(() => {
    let data = [...mockUserPermissions];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(up =>
        up.user.username.toLowerCase().includes(q) ||
        up.user.fullName.toLowerCase().includes(q) ||
        up.user.email.toLowerCase().includes(q) ||
        up.assignedWards.some(w => w.toLowerCase().includes(q))
      );
    }
    if (roleFilter) data = data.filter(up => up.user.role === roleFilter);
    if (categoryFilter) {
      data = data.filter(up => 
        up.permissions.some(p => p.category === categoryFilter)
      );
    }
    return data;
  }, [mockUserPermissions, search, roleFilter, categoryFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Stats calculations
  const stats = useMemo(() => ({
    totalUsers: mockUserPermissions.length,
    activeUsers: mockUserPermissions.filter(up => up.isActive).length,
    totalPermissions: mockUserPermissions.reduce((sum, up) => sum + up.permissions.length, 0),
    wardCoverage: new Set(mockUserPermissions.flatMap(up => up.assignedWards)).size,
  }), [mockUserPermissions]);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setCategoryFilter("");
    setPage(0);
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1D2939] flex items-center gap-2">
            <Shield className="text-[#0B4FC4]" size={24} />
            Phân quyền & Ủy quyền
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              MỚI
            </span>
          </h2>
          <p className="text-slate-500 mt-1">Cấp phép truy cập chi tiết và phân công khu vực phụ trách</p>
        </div>
        <button
          onClick={() => setShowPermissionModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B4FC4] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition"
        >
          <Shield size={16} />
          Thêm phân quyền
        </button>
      </div>

      {/* Stats KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Người dùng được phân quyền", value: stats.totalUsers, icon: Users, color: "text-[#0B4FC4]", bg: "bg-blue-50" },
          { label: "Đang hoạt động", value: stats.activeUsers, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
          { label: "Tổng quyền được cấp", value: stats.totalPermissions, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Khu vực được phủ", value: stats.wardCoverage, icon: MapPin, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                <Icon size={18} />
              </div>
              <div>
                <div className={`text-xl font-extrabold ${s.color}`}>{isLoading ? "—" : s.value.toLocaleString("vi-VN")}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên, email, khu vực..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:border-[#0B4FC4]"
          />
        </div>
        
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
        >
          <option value="">Mọi vai trò</option>
          <option value="WARD_STAFF">Cán bộ phường</option>
          <option value="POLICE">Công an</option>
          <option value="SUPER_ADMIN">Lãnh đạo TP</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
        >
          <option value="">Mọi quyền</option>
          <option value="FEEDBACK">Quản lý phản ánh</option>
          <option value="USER">Quản lý người dùng</option>
          <option value="ANALYTICS">Báo cáo & Thống kê</option>
          <option value="SYSTEM">Quản trị hệ thống</option>
        </select>

        {(search || roleFilter || categoryFilter) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition cursor-pointer"
          >
            <X size={13} /> Xóa lọc
          </button>
        )}
        <span className="ml-auto text-xs font-bold text-slate-400">{filtered.length} kết quả</span>
      </div>

      {/* Action Bar with View Mode Toggle */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === "matrix" 
                  ? "bg-white text-[#0B4FC4] shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Grid3X3 size={14} />
              Ma trận quyền
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === "list" 
                  ? "bg-white text-[#0B4FC4] shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List size={14} />
              Danh sách
            </button>
          </div>

          {/* Quick Templates */}
          <div className="flex items-center gap-2">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
            >
              <option value="">Template phân quyền...</option>
              {ROLE_TEMPLATES.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-3 py-2 text-sm font-bold text-[#0B4FC4] border border-[#0B4FC4] bg-blue-50 rounded-xl hover:bg-blue-100 transition"
              >
                Áp dụng
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Export/Import */}
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            <Download size={14} />
            Xuất Excel
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            <Upload size={14} />
            Nhập Excel
          </button>

          {/* Audit Log */}
          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-orange-600 border border-orange-200 bg-orange-50 rounded-xl hover:bg-orange-100 transition"
          >
            <History size={14} />
            Lịch sử thay đổi
          </button>
        </div>
      </div>

      {/* Permission Matrix View */}
      {viewMode === "matrix" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Workflow size={20} className="text-[#0B4FC4]" />
              Ma trận phân quyền (Drag & Drop)
            </h3>
            <div className="text-xs text-slate-500">
              Kéo thả để phân quyền nhanh • {Object.keys(PERMISSION_CATEGORIES).length} danh mục quyền
            </div>
          </div>

          {/* Permission Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <div key={key} className={`${category.bg} ${category.border} border rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} className={category.color} />
                    <span className={`text-sm font-bold ${category.color}`}>{category.label}</span>
                  </div>
                  <div className="space-y-1">
                    {mockUserPermissions
                      .flatMap(up => up.permissions)
                      .filter(p => p.category === key)
                      .reduce((unique, p) => unique.find(u => u.id === p.id) ? unique : [...unique, p], [] as Permission[])
                      .map(permission => (
                        <div
                          key={permission.id}
                          draggable
                          onDragStart={() => handleDragStart(permission)}
                          className={`px-3 py-2 ${category.bg} border ${category.border} rounded-lg text-xs font-bold cursor-grab hover:cursor-grabbing transition hover:shadow-sm active:scale-95`}
                        >
                          {permission.description}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Drop Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map(userPerm => (
              <div
                key={userPerm.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, userPerm)}
                className={`border-2 border-dashed ${
                  draggedPermission ? 'border-[#0B4FC4] bg-blue-50' : 'border-slate-200 bg-slate-50'
                } rounded-xl p-4 transition-colors`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B4FC4] to-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {userPerm.user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">{userPerm.user.fullName}</div>
                    <div className="text-xs text-slate-500">{userPerm.user.role}</div>
                  </div>
                  <div className={`ml-auto w-2 h-2 rounded-full ${
                    userPerm.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-600 mb-2">Quyền hiện tại:</div>
                  <div className="flex flex-wrap gap-1">
                    {userPerm.permissions.map(perm => {
                      const category = PERMISSION_CATEGORIES[perm.category];
                      return (
                        <span
                          key={perm.id}
                          className={`px-2 py-1 rounded text-[9px] font-bold ${category.bg} ${category.color} border`}
                          title={perm.description}
                        >
                          {perm.name}
                        </span>
                      );
                    })}
                  </div>
                  
                  <div className="text-xs font-bold text-slate-600 mt-3 mb-2">Khu vực phụ trách:</div>
                  <div className="flex flex-wrap gap-1">
                    {userPerm.assignedWards.map(ward => (
                      <span key={ward} className="px-2 py-1 rounded text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                        {ward}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Table */}
      {viewMode === "list" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] uppercase font-bold text-slate-500">
                  <th className="px-5 py-3.5">Người dùng</th>
                  <th className="px-4 py-3.5">Vai trò</th>
                  <th className="px-4 py-3.5">Quyền được cấp</th>
                  <th className="px-4 py-3.5">Khu vực phụ trách</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Cập nhật gần nhất</th>
                  <th className="px-4 py-3.5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-5 py-3"><Skeleton className="h-10 w-full rounded" /></td></tr>
                    ))
                  : paginated.length === 0
                    ? <tr><td colSpan={7} className="py-16 text-center text-sm text-slate-400">Không có người dùng nào được phân quyền.</td></tr>
                    : paginated.map(userPerm => (
                        <tr key={userPerm.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B4FC4] to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                {userPerm.user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                  {userPerm.user.fullName}
                                  <button
                                    onClick={() => setExpandedUser(expandedUser === userPerm.id ? null : userPerm.id)}
                                    className="text-slate-400 hover:text-slate-600 transition"
                                  >
                                    {expandedUser === userPerm.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                </div>
                                <div className="text-xs text-slate-500">{userPerm.user.email}</div>
                                <div className="text-xs text-slate-400">@{userPerm.user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase ${ROLE_COLORS[userPerm.user.role] || "bg-slate-100 text-slate-600"}`}>
                              {userPerm.user.role === "WARD_STAFF" ? "Cán bộ" : 
                               userPerm.user.role === "POLICE" ? "Công an" : 
                               userPerm.user.role === "SUPER_ADMIN" ? "Lãnh đạo" : "Khác"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {userPerm.permissions.slice(0, 3).map(perm => {
                                const category = PERMISSION_CATEGORIES[perm.category];
                                return (
                                  <span
                                    key={perm.id}
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${category.bg} ${category.color} border`}
                                    title={perm.description}
                                  >
                                    {perm.category}
                                  </span>
                                );
                              })}
                              {userPerm.permissions.length > 3 && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 bg-slate-100">
                                  +{userPerm.permissions.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {userPerm.assignedWards.slice(0, 2).map(ward => (
                                <span key={ward} className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                                  {ward}
                                </span>
                              ))}
                              {userPerm.assignedWards.length > 2 && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 bg-slate-100">
                                  +{userPerm.assignedWards.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${userPerm.isActive ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                              {userPerm.isActive ? "Hoạt động" : "Tạm khóa"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right text-xs text-slate-500">
                            <div>{new Date(userPerm.lastModified).toLocaleDateString("vi-VN")}</div>
                            <div className="text-slate-400">bởi {userPerm.assignedBy}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedUser(userPerm)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B4FC4] hover:bg-blue-50 transition"
                                title="Xem chi tiết"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(userPerm);
                                  setShowPermissionModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition"
                                title="Chỉnh sửa quyền"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(userPerm);
                                  setShowWardModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
                                title="Quản lý khu vực"
                              >
                                <MapPin size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(userPerm);
                                  setShowTemplateModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                                title="Áp dụng template"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>

          {/* Expanded Row Details */}
          {expandedUser && paginated.find(up => up.id === expandedUser) && (
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
              {(() => {
                const userPerm = paginated.find(up => up.id === expandedUser)!;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Shield size={16} className="text-[#0B4FC4]" />
                        Chi tiết quyền ({userPerm.permissions.length})
                      </h4>
                      <div className="space-y-2">
                        {userPerm.permissions.map(perm => {
                          const category = PERMISSION_CATEGORIES[perm.category];
                          return (
                            <div key={perm.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                              <div className={`w-8 h-8 rounded-lg ${category.bg} ${category.color} flex items-center justify-center shrink-0`}>
                                <category.icon size={14} />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-800">{perm.description}</div>
                                <div className={`text-xs font-bold ${category.color} uppercase`}>{perm.category}</div>
                              </div>
                              <div className={`ml-auto w-2 h-2 rounded-full ${perm.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <MapPin size={16} className="text-orange-600" />
                        Khu vực phụ trách ({userPerm.assignedWards.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {userPerm.assignedWards.map(ward => (
                          <div key={ward} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                              <MapPin size={14} />
                            </div>
                            <div className="font-bold text-sm text-slate-800">{ward}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-xs font-bold text-slate-500 mb-2">Thông tin phân quyền</div>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div>Được cấp bởi: <span className="font-bold">{userPerm.assignedBy}</span></div>
                          <div>Ngày cấp: <span className="font-bold">{new Date(userPerm.assignedAt).toLocaleDateString("vi-VN")}</span></div>
                          <div>Lần sửa cuối: <span className="font-bold">{new Date(userPerm.lastModified).toLocaleDateString("vi-VN")}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Trang {page + 1} / {totalPages} ({filtered.length} kết quả)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Application Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Copy size={20} className="text-[#0B4FC4]" />
                Áp dụng Template Phân Quyền
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {selectedUser && (
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B4FC4] to-blue-600 text-white flex items-center justify-center font-bold">
                    {selectedUser.user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{selectedUser.user.fullName}</div>
                    <div className="text-sm text-slate-500">{selectedUser.user.email}</div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${ROLE_COLORS[selectedUser.user.role]}`}>
                      {selectedUser.user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {ROLE_TEMPLATES.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition ${
                    selectedTemplate === template.id
                      ? 'border-[#0B4FC4] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-slate-800">{template.name}</div>
                      <div className="text-sm text-slate-500 mt-1">{template.description}</div>
                    </div>
                    {template.isDefault && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-600">Quyền bao gồm:</div>
                    {template.permissions.map((perm, i) => (
                      <div key={i} className="text-xs text-slate-500">• {perm}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (selectedUser && selectedTemplate) {
                    applyTemplate(selectedUser.userId, selectedTemplate);
                  }
                }}
                disabled={!selectedTemplate}
                className="px-6 py-2 text-sm font-bold text-white bg-[#0B4FC4] rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Áp dụng Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History size={20} className="text-orange-600" />
                Lịch Sử Thay Đổi Phân Quyền
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {MOCK_AUDIT_LOGS.map(log => (
                <div key={log.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    log.type === 'PERMISSION_GRANTED' ? 'bg-green-100 text-green-700' :
                    log.type === 'PERMISSION_REVOKED' ? 'bg-red-100 text-red-700' :
                    log.type === 'WARD_ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {log.type === 'PERMISSION_GRANTED' ? <CheckCircle2 size={18} /> :
                     log.type === 'PERMISSION_REVOKED' ? <XCircle size={18} /> :
                     log.type === 'WARD_ASSIGNED' ? <MapPin size={18} /> :
                     <Clock size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-slate-800">{log.action}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(log.timestamp).toLocaleDateString("vi-VN")} {new Date(log.timestamp).toLocaleTimeString("vi-VN")}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      Đối tượng: <span className="font-bold">{log.targetUserName}</span> • 
                      Thực hiện bởi: <span className="font-bold">{log.performedBy}</span>
                    </div>
                    <div className="text-sm text-slate-500">{log.details}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Management Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield size={20} className="text-[#0B4FC4]" />
                Quản lý Phân Quyền Chi Tiết
              </h3>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {selectedUser && (
              <>
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B4FC4] to-blue-600 text-white flex items-center justify-center font-bold">
                      {selectedUser.user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{selectedUser.user.fullName}</div>
                      <div className="text-sm text-slate-500">{selectedUser.user.email}</div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${ROLE_COLORS[selectedUser.user.role]}`}>
                        {selectedUser.user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                    const Icon = category.icon;
                    const userHasCategory = selectedUser.permissions.some(p => p.category === key);
                    return (
                      <div key={key} className={`${category.bg} border ${category.border} rounded-xl p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon size={16} className={category.color} />
                          <span className={`text-sm font-bold ${category.color}`}>{category.label}</span>
                          {userHasCategory && (
                            <CheckCircle2 size={14} className="text-green-600 ml-auto" />
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {mockUserPermissions
                            .flatMap(up => up.permissions)
                            .filter(p => p.category === key)
                            .reduce((unique, p) => unique.find(u => u.id === p.id) ? unique : [...unique, p], [] as Permission[])
                            .map(permission => {
                              const hasPermission = selectedUser.permissions.some(p => p.id === permission.id);
                              return (
                                <label key={permission.id} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hasPermission}
                                    onChange={() => {
                                      const action = hasPermission ? "Thu hồi" : "Cấp";
                                      toast.success(`${action} quyền "${permission.description}"`);
                                    }}
                                    className="w-4 h-4 text-[#0B4FC4] border-slate-300 rounded focus:ring-[#0B4FC4]"
                                  />
                                  <span className="text-xs font-medium text-slate-700">{permission.description}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  toast.success("Đã lưu thay đổi phân quyền");
                  setShowPermissionModal(false);
                }}
                className="px-6 py-2 text-sm font-bold text-white bg-[#0B4FC4] rounded-lg hover:bg-blue-700 transition"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ward Assignment Modal */}
      {showWardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={20} className="text-orange-600" />
                Phân Công Khu Vực Phụ Trách
              </h3>
              <button
                onClick={() => setShowWardModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {selectedUser && (
              <>
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-bold">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{selectedUser.user.fullName}</div>
                      <div className="text-sm text-slate-500">Hiện tại phụ trách: {selectedUser.assignedWards.join(", ")}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {WARD_LIST.map(ward => {
                    const isAssigned = selectedUser.assignedWards.includes(ward);
                    return (
                      <label key={ward} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${
                        isAssigned ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => {
                            const action = isAssigned ? "Bỏ phân công" : "Phân công";
                            toast.success(`${action} khu vực ${ward}`);
                          }}
                          className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                        />
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                          <MapPin size={14} />
                        </div>
                        <span className="font-bold text-slate-800">{ward}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowWardModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  toast.success("Đã cập nhật phân công khu vực");
                  setShowWardModal(false);
                }}
                className="px-6 py-2 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition"
              >
                Lưu Phân Công
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}