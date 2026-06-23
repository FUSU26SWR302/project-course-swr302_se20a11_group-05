import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi, type UserProfile } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Users, 
  Shield, 
  UserCheck, 
  User, 
  X, 
  Lock, 
  Unlock, 
  Download, 
  Upload,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Activity,
  CheckSquare,
  Square,
  AlertCircle,
  Settings,
  Key,
  FileText,
  TrendingUp,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface UserDTO {
  id: number;
  username: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  role: string;
  isActive: boolean;
  isMfaEnabled: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  wardAssignments?: string[];
}

const ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Người dân",
  WARD_STAFF: "Cán bộ phường",
  POLICE: "Công an",
  SUPER_ADMIN: "Lãnh đạo TP",
};

const ROLE_COLORS: Record<string, string> = {
  CITIZEN: "bg-blue-50 text-blue-700",
  WARD_STAFF: "bg-amber-50 text-amber-700",
  POLICE: "bg-red-50 text-red-700",
  SUPER_ADMIN: "bg-purple-50 text-purple-700",
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [changingStatus, setChangingStatus] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const PAGE_SIZE = 20;

  const handleChangeRole = async (userId: number, newRole: string) => {
    setChangingRole(userId);
    try {
      await userApi.changeRole(userId, newRole);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users", "all"] });
      toast.success("Đổi vai trò thành công");
    } catch {
      toast.error("Đổi vai trò thất bại");
    } finally {
      setChangingRole(null);
    }
  };

  const handleChangeStatus = async (userId: number, active: boolean) => {
    setChangingStatus(userId);
    try {
      await userApi.changeStatus(userId, active);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users", "all"] });
      toast.success(active ? "Mở khóa tài khoản thành công" : "Khóa tài khoản thành công");
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setChangingStatus(null);
    }
  };

  const { data: usersPage, isLoading } = useQuery({
    queryKey: ["admin", "users", "all"],
    queryFn: () => userApi.getAll(0, 200),
    staleTime: 60_000,
  });

  const allUsers = (usersPage?.content ?? []) as unknown as UserDTO[];

  const filtered = useMemo(() => {
    let data = [...allUsers];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(u =>
        u.username?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phoneNumber?.includes(q)
      );
    }
    if (roleFilter) data = data.filter(u => u.role === roleFilter);
    if (statusFilter === "active") data = data.filter(u => u.isActive);
    if (statusFilter === "inactive") data = data.filter(u => !u.isActive);
    if (wardFilter) {
      data = data.filter(u => u.wardAssignments?.includes(wardFilter));
    }
    return data;
  }, [allUsers, search, roleFilter, statusFilter, wardFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const roleCounts = useMemo(() => ({
    total: allUsers.length,
    active: allUsers.filter(u => u.isActive).length,
    inactive: allUsers.filter(u => !u.isActive).length,
    citizen: allUsers.filter(u => u.role === "CITIZEN").length,
    staff: allUsers.filter(u => u.role === "WARD_STAFF").length,
    police: allUsers.filter(u => u.role === "POLICE").length,
    admin: allUsers.filter(u => u.role === "SUPER_ADMIN").length,
  }), [allUsers]);

  const handleSelectUser = (userId: number, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginated.map(u => u.id));
      setSelectedUsers(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedUsers.size === 0) return;
    
    try {
      const promises = Array.from(selectedUsers).map(userId => {
        switch (action) {
          case "activate":
            return userApi.changeStatus(userId, true);
          case "deactivate":
            return userApi.changeStatus(userId, false);
          case "delete":
            return userApi.delete(userId);
          default:
            return Promise.resolve();
        }
      });
      
      await Promise.all(promises);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users", "all"] });
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      
      const actionText = action === "activate" ? "kích hoạt" : 
                       action === "deactivate" ? "vô hiệu hóa" : "xóa";
      toast.success(`Đã ${actionText} ${selectedUsers.size} tài khoản`);
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const exportUsers = () => {
    // Mock export functionality
    const csv = "username,fullName,email,role,status\n" + 
                filtered.map(u => `${u.username},${u.fullName},${u.email},${u.role},${u.isActive ? 'Active' : 'Inactive'}`).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Đã xuất dữ liệu người dùng");
  };

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1D2939] flex items-center gap-2">
            <Users className="text-[#0B4FC4]" size={24} />
            Quản lý tài khoản
          </h2>
          <p className="text-slate-500 mt-1">Quản lý thông tin tài khoản và vai trò cơ bản của người dùng</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportUsers}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all hover:scale-105"
          >
            <Download size={16} />
            Xuất Excel
          </button>
          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0B4FC4] hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all hover:scale-105 shadow-lg"
          >
            <UserPlus size={16} />
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Tổng người dùng", 
            value: roleCounts.total, 
            icon: Users, 
            color: "text-[#0B4FC4]", 
            bg: "bg-blue-50",
            trend: "+12%"
          },
          { 
            label: "Đang hoạt động", 
            value: roleCounts.active, 
            icon: Activity, 
            color: "text-green-600", 
            bg: "bg-green-50",
            trend: "+5%"
          },
          { 
            label: "Cán bộ & Công an", 
            value: roleCounts.staff + roleCounts.police, 
            icon: Shield, 
            color: "text-orange-600", 
            bg: "bg-orange-50",
            trend: "+2"
          },
          { 
            label: "Tài khoản bị khóa", 
            value: roleCounts.inactive, 
            icon: Lock, 
            color: "text-red-600", 
            bg: "bg-red-50",
            trend: "-8%"
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${stat.color}`}>
                    {isLoading ? "—" : stat.value.toLocaleString("vi-VN")}
                  </div>
                  <div className="text-xs text-slate-400 font-semibold mt-1">
                    {stat.trend && (
                      <span className="text-green-500 flex items-center gap-1">
                        <TrendingUp size={10} />
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-3">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="text-slate-500" size={18} />
          <h3 className="font-bold text-slate-700">Bộ lọc nâng cao</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:border-[#0B4FC4] transition-all"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="CITIZEN">👥 Người dân</option>
            <option value="WARD_STAFF">🏢 Cán bộ phường</option>
            <option value="POLICE">👮 Công an</option>
            <option value="SUPER_ADMIN">⭐ Lãnh đạo TP</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">✅ Đang hoạt động</option>
            <option value="inactive">❌ Đã bị khóa</option>
          </select>

          {/* Ward Filter */}
          <select
            value={wardFilter}
            onChange={e => { setWardFilter(e.target.value); setPage(0); }}
            className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer"
          >
            <option value="">Tất cả khu vực</option>
            <option value="Hải Châu">📍 Hải Châu</option>
            <option value="Thanh Khê">📍 Thanh Khê</option>
            <option value="Liên Chiểu">📍 Liên Chiểu</option>
            <option value="Sơn Trà">📍 Sơn Trà</option>
            <option value="Ngũ Hành Sơn">📍 Ngũ Hành Sơn</option>
            <option value="Cẩm Lệ">📍 Cẩm Lệ</option>
            <option value="Hòa Vang">📍 Hòa Vang</option>
          </select>
        </div>

        {/* Active Filters & Results */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {(search || roleFilter || statusFilter || wardFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setStatusFilter("");
                  setWardFilter("");
                  setPage(0);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition"
              >
                <X size={12} />
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
          
          <div className="text-sm text-slate-500 font-medium">
            <span className="font-bold text-[#0B4FC4]">{filtered.length}</span> / {allUsers.length} tài khoản
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-[#0B4FC4] text-white rounded-xl p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckSquare size={18} />
            <span className="font-semibold">
              Đã chọn {selectedUsers.size} người dùng
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction("activate")}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition"
            >
              Kích hoạt
            </button>
            <button
              onClick={() => handleBulkAction("deactivate")}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition"
            >
              Vô hiệu hóa
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition"
            >
              Xóa
            </button>
            <button
              onClick={() => {
                setSelectedUsers(new Set());
                setShowBulkActions(false);
              }}
              className="p-1.5 text-white/70 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modern Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr className="text-xs uppercase font-bold text-slate-600">
                <th className="px-6 py-4">
                  <button
                    onClick={(e) => handleSelectAll((e.target as HTMLInputElement).checked)}
                    className="flex items-center gap-2"
                  >
                    {selectedUsers.size === paginated.length && selectedUsers.size > 0 ? 
                      <CheckSquare size={16} className="text-[#0B4FC4]" /> : 
                      <Square size={16} className="text-slate-400" />
                    }
                    Tất cả
                  </button>
                </th>
                <th className="px-4 py-4">Thông tin người dùng</th>
                <th className="px-4 py-4">Liên hệ</th>
                <th className="px-4 py-4 text-center">Vai trò</th>
                <th className="px-4 py-4 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-center">Hoạt động gần nhất</th>
                <th className="px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-4">
                        <Skeleton className="h-12 w-full rounded" />
                      </td>
                    </tr>
                  ))
                : paginated.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="text-slate-300" size={48} />
                          <div>
                            <div className="text-sm font-semibold text-slate-600">Không tìm thấy người dùng</div>
                            <div className="text-xs text-slate-400 mt-1">Thử điều chỉnh bộ lọc hoặc thêm người dùng mới</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                  : paginated.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
                        {/* Checkbox */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleSelectUser(user.id, !selectedUsers.has(user.id))}
                            className="flex items-center gap-2"
                          >
                            {selectedUsers.has(user.id) ? 
                              <CheckSquare size={16} className="text-[#0B4FC4]" /> : 
                              <Square size={16} className="text-slate-400 hover:text-slate-600" />
                            }
                          </button>
                        </td>

                        {/* User Info */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {user.fullName?.charAt(0)?.toUpperCase() || user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{user.fullName || "—"}</div>
                              <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {user.email && (
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <Mail size={12} />
                                {user.email}
                              </div>
                            )}
                            {user.phoneNumber && (
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <Phone size={12} />
                                {user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4 text-center">
                          <select
                            value={user.role}
                            disabled={changingRole === user.id}
                            onChange={e => handleChangeRole(user.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 transition ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-600"} ${changingRole === user.id ? "opacity-50 cursor-wait" : ""}`}
                          >
                            <option value="CITIZEN">Người dân</option>
                            <option value="WARD_STAFF">Cán bộ phường</option>
                            <option value="POLICE">Công an</option>
                            <option value="SUPER_ADMIN">Lãnh đạo TP</option>
                          </select>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            <span className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                            {user.isActive ? "Hoạt động" : "Bị khóa"}
                          </span>
                        </td>

                        {/* Last Activity */}
                        <td className="px-4 py-4 text-center">
                          <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                            <Clock size={12} />
                            {user.lastLoginAt ? 
                              new Date(user.lastLoginAt).toLocaleDateString("vi-VN") : 
                              "Chưa đăng nhập"
                            }
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-[#0B4FC4] hover:bg-blue-50 transition"
                              title="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleChangeStatus(user.id, !user.isActive)}
                              disabled={changingStatus === user.id}
                              className={`p-2 rounded-lg transition disabled:opacity-50 ${user.isActive ? "text-red-400 hover:bg-red-50 hover:text-red-600" : "text-green-500 hover:bg-green-50 hover:text-green-700"}`}
                              title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            >
                              {user.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>

        {/* Modern Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Hiển thị <span className="font-semibold">{page * PAGE_SIZE + 1}</span> đến{" "}
                <span className="font-semibold">{Math.min((page + 1) * PAGE_SIZE, filtered.length)}</span> của{" "}
                <span className="font-semibold">{filtered.length}</span> tài khoản
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-white transition"
                  title="Trang đầu"
                >
                  ««
                </button>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-white transition"
                >
                  ← Trước
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const pageNum = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 text-xs font-bold rounded-lg transition ${
                          page === pageNum
                            ? "bg-[#0B4FC4] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-white transition"
                >
                  Tiếp →
                </button>
                <button
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-white transition"
                  title="Trang cuối"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail/Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {selectedUser ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {selectedUser.fullName?.charAt(0)?.toUpperCase() || selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {selectedUser.fullName || selectedUser.username}
                      </h3>
                      <p className="text-sm text-slate-500">Chi tiết tài khoản người dùng</p>
                    </div>
                  </>
                ) : (
                  <>
                    <UserPlus className="text-[#0B4FC4]" size={24} />
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Thêm người dùng mới</h3>
                      <p className="text-sm text-slate-500">Tạo tài khoản mới trong hệ thống</p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {selectedUser ? (
                /* View/Edit User */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                      <User size={16} />
                      Thông tin cơ bản
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Họ và tên</label>
                        <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm">{selectedUser.fullName || "—"}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tên đăng nhập</label>
                        <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm font-mono">{selectedUser.username}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Vai trò</label>
                        <div className="mt-1">
                          <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${ROLE_COLORS[selectedUser.role]}`}>
                            {ROLE_LABELS[selectedUser.role]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                      <Mail size={16} />
                      Thông tin liên hệ
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</label>
                        <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm">{selectedUser.email || "—"}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Số điện thoại</label>
                        <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm">{selectedUser.phoneNumber || "—"}</div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${selectedUser.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            <span className={`w-2 h-2 rounded-full ${selectedUser.isActive ? "bg-green-500" : "bg-red-500"}`} />
                            {selectedUser.isActive ? "Đang hoạt động" : "Bị khóa"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Info */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                      <Activity size={16} />
                      Hoạt động & Bảo mật
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Ngày tạo</div>
                        <div className="text-sm font-medium">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("vi-VN") : "—"}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Đăng nhập gần nhất</div>
                        <div className="text-sm font-medium">
                          {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString("vi-VN") : "Chưa đăng nhập"}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Xác thực 2FA</div>
                        <div className={`text-sm font-medium ${selectedUser.isMfaEnabled ? "text-green-600" : "text-slate-500"}`}>
                          {selectedUser.isMfaEnabled ? "✓ Đã bật" : "✗ Chưa bật"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ward Assignments */}
                  {selectedUser.wardAssignments && selectedUser.wardAssignments.length > 0 && (
                    <div className="md:col-span-2 space-y-4">
                      <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Settings size={16} />
                        Phân công khu vực
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.wardAssignments.map(ward => (
                          <span key={ward} className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg">
                            📍 {ward}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Add New User Form */
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Họ và tên *</label>
                      <input
                        type="text"
                        className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:border-[#0B4FC4]"
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tên đăng nhập *</label>
                      <input
                        type="text"
                        className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:border-[#0B4FC4]"
                        placeholder="Nhập tên đăng nhập"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email *</label>
                      <input
                        type="email"
                        className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:border-[#0B4FC4]"
                        placeholder="Nhập địa chỉ email"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Số điện thoại</label>
                      <input
                        type="tel"
                        className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:border-[#0B4FC4]"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Vai trò *</label>
                      <select className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 cursor-pointer">
                        <option value="CITIZEN">👥 Người dân</option>
                        <option value="WARD_STAFF">🏢 Cán bộ phường</option>
                        <option value="POLICE">👮 Công an</option>
                        <option value="SUPER_ADMIN">⭐ Lãnh đạo TP</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Mật khẩu tạm thời *</label>
                      <input
                        type="password"
                        className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B4FC4]/20 focus:border-[#0B4FC4]"
                        placeholder="Nhập mật khẩu tạm thời"
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50/50">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-white transition"
              >
                {selectedUser ? "Đóng" : "Hủy"}
              </button>
              {selectedUser ? (
                <button className="px-4 py-2.5 bg-[#0B4FC4] hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition">
                  Cập nhật thông tin
                </button>
              ) : (
                <button className="px-4 py-2.5 bg-[#0B4FC4] hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition">
                  Tạo tài khoản
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
