import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { feedbackApi, type FeedbackResponse } from "@/lib/api";
import { mapStatus } from "@/lib/status";
import {
  X, FileText, MapPin, User, Calendar, Tag, Clock,
  CheckCircle, AlertCircle, RefreshCw, Image as ImageIcon,
  ExternalLink, Phone, Mail, Building, Hash, MessageSquare,
  Flag, ChevronRight, Download, Share2, Edit3, Workflow, UserCheck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED:            "bg-slate-100 text-slate-600 border-slate-200",
  PENDING_RECEIVE:      "bg-yellow-50 text-yellow-700 border-yellow-200",
  PENDING:              "bg-yellow-50 text-yellow-700 border-yellow-200",
  NEED_LOCATION_REVIEW: "bg-orange-50 text-orange-700 border-orange-200",
  IN_PROGRESS:          "bg-blue-50 text-blue-700 border-blue-200",
  WAITING_INFO:         "bg-purple-50 text-purple-700 border-purple-200",
  RESOLVED:             "bg-green-50 text-green-700 border-green-200",
  REJECTED:             "bg-red-50 text-red-700 border-red-200",
};

interface Props {
  feedbackId: number | null;
  onClose: () => void;
}

export function FeedbackDetailModal({ feedbackId, onClose }: Props) {
  const [activeImg, setActiveImg] = useState(0);

  const { data: fbFromApi, isLoading: isLoadingApi } = useQuery<FeedbackResponse>({
    queryKey: ["admin", "feedback", "detail", feedbackId],
    queryFn: () => feedbackApi.getById(feedbackId!),
    enabled: feedbackId !== null,
    staleTime: 30_000,
    retry: false, // Don't retry API calls to avoid delays
  });

  const fb = useMemo(() => {
    if (feedbackId === null) return null;
    return fbFromApi ?? null;
  }, [feedbackId, fbFromApi]);

  const isLoading = isLoadingApi;

  if (feedbackId === null) return null;

  const attachments = fb?.attachments ?? [];
  const statusColor = fb ? (STATUS_COLORS[fb.status] ?? "bg-slate-100 text-slate-600 border-slate-200") : "";

  const Field = ({ icon: Icon, label, value, isClickable = false, onClick }: { 
    icon: any; 
    label: string; 
    value?: string | null;
    isClickable?: boolean;
    onClick?: () => void;
  }) => (
    <div 
      className={`flex items-start gap-3 ${isClickable ? 'cursor-pointer hover:bg-slate-50 -m-2 p-2 rounded-xl transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-semibold text-slate-800 mt-0.5 break-words ${isClickable ? 'text-[#0B4FC4] hover:underline' : ''}`}>
          {value || "—"}
        </p>
      </div>
      {isClickable && <ChevronRight size={14} className="text-slate-400 mt-2" />}
    </div>
  );

  // Priority display helper
  const getPriorityDisplay = (priority: string) => {
    switch (priority) {
      case "HIGH": return { text: "Khẩn cấp", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
      case "MEDIUM": return { text: "Quan trọng", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
      case "LOW": return { text: "Thông thường", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
      default: return { text: "Chưa xác định", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText size={16} className="text-[#0B4FC4]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1D2939]">
                {isLoading ? <Skeleton className="h-4 w-32" /> : (fb?.trackingCode || `#${feedbackId}`)}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Chi tiết phản ánh</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full max-w-xs" />
                  </div>
                </div>
              ))}
            </div>
          ) : !fb ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-600 mb-2">Không tìm thấy phản ánh</h3>
              <p className="text-sm text-slate-400">ID phản ánh không tồn tại hoặc đã bị xóa</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              
              {/* Title Section with Status and Priority */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${statusColor}`}>
                    {mapStatus(fb.status)}
                  </span>
                  {fb.priority && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getPriorityDisplay(fb.priority).bg} ${getPriorityDisplay(fb.priority).color} ${getPriorityDisplay(fb.priority).border}`}>
                      <Flag size={10} className="inline mr-1" />
                      {getPriorityDisplay(fb.priority).text}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                    <Hash size={10} className="inline mr-1" />
                    {fb.trackingCode || `#${fb.id}`}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#1D2939] leading-tight">{fb.title}</h2>
              </div>

              {/* Description */}
              {fb.description && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-slate-500" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả chi tiết</p>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{fb.description}</p>
                </div>
              )}

              {/* Citizen Information */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <User size={14} className="text-blue-600" />
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Thông tin người gửi</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={User} label="Họ tên" value={fb.citizenName} />
                  <Field 
                    icon={Phone} 
                    label="Số điện thoại" 
                    value={fb.citizenPhone} 
                    isClickable={!!fb.citizenPhone}
                    onClick={() => fb.citizenPhone && window.open(`tel:${fb.citizenPhone}`)}
                  />
                  <Field 
                    icon={Mail} 
                    label="Email" 
                    value={fb.citizenEmail}
                    isClickable={!!fb.citizenEmail}
                    onClick={() => fb.citizenEmail && window.open(`mailto:${fb.citizenEmail}`)}
                  />
                </div>
              </div>

              {/* Location & Category Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={14} className="text-green-600" />
                    <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Địa điểm</p>
                  </div>
                  <div className="space-y-3">
                    <Field icon={Building} label="Quận/Phường" value={fb.wardName} />
                    <Field icon={MapPin} label="Địa chỉ cụ thể" value={fb.addressDetails} />
                    {(fb.latitude && fb.longitude) && (
                      <Field 
                        icon={MapPin} 
                        label="Tọa độ GPS" 
                        value={`${fb.latitude?.toFixed(6)}, ${fb.longitude?.toFixed(6)}`}
                        isClickable={true}
                        onClick={() => window.open(`https://maps.google.com/?q=${fb.latitude},${fb.longitude}`)}
                      />
                    )}
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag size={14} className="text-purple-600" />
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Phân loại</p>
                  </div>
                  <div className="space-y-3">
                    <Field icon={Tag} label="Lĩnh vực" value={fb.categoryName} />
                    <Field icon={Calendar} label="Ngày gửi" value={fb.createdAt ? new Date(fb.createdAt).toLocaleString("vi-VN") : undefined} />
                    <Field icon={Clock} label="Cập nhật lần cuối" value={fb.updatedAt ? new Date(fb.updatedAt).toLocaleString("vi-VN") : undefined} />
                  </div>
                </div>
              </div>

              {/* Assignee Information */}
              {(fb.assigneeName || fb.assigneeId) && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Workflow size={14} className="text-orange-600" />
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Cán bộ xử lý</p>
                  </div>
                  <Field icon={UserCheck} label="Được phân công cho" value={fb.assigneeName} />
                </div>
              )}

              {/* Attachments */}
              {attachments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon size={14} className="text-slate-500" /> 
                      Hình ảnh đính kèm ({attachments.length})
                    </p>
                    <button 
                      onClick={() => window.open(attachments[activeImg].fileUrl, '_blank')}
                      className="text-xs font-bold text-[#0B4FC4] hover:underline flex items-center gap-1"
                    >
                      <Download size={12} />
                      Tải xuống
                    </button>
                  </div>
                  <div className="space-y-4">
                    {/* Main image with better styling */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 group">
                      <img
                        src={attachments[activeImg].fileUrl}
                        alt={attachments[activeImg].fileName || "Attachment"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="px-3 py-1.5 bg-black/70 backdrop-blur text-white text-xs font-bold rounded-full">
                          {activeImg + 1} / {attachments.length}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-black/70 backdrop-blur text-white text-xs font-medium rounded">
                            {attachments[activeImg].fileName}
                          </span>
                          <button 
                            onClick={() => window.open(attachments[activeImg].fileUrl, '_blank')}
                            className="p-1.5 bg-black/70 backdrop-blur hover:bg-black/80 text-white rounded transition"
                          >
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Thumbnails */}
                    {attachments.length > 1 && (
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {attachments.map((attachment, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                              i === activeImg ? "border-[#0B4FC4] shadow-lg" : "border-transparent hover:border-slate-300"
                            }`}
                          >
                            <img 
                              src={attachment.fileUrl} 
                              alt={`Thumbnail ${i + 1}`}
                              className="w-full h-full object-cover" 
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Processing History */}
              {fb.logs && fb.logs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={14} className="text-slate-500" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Lịch sử xử lý ({fb.logs.length})
                    </p>
                  </div>
                  <div className="space-y-3 relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
                    
                    {fb.logs.slice(0, 10).map((log: any, i: number) => (
                      <div key={log.id || i} className="flex gap-4 items-start relative">
                        <div className="w-8 h-8 rounded-full bg-[#0B4FC4] flex items-center justify-center shrink-0 relative z-10 border-2 border-white shadow-sm">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <span className="font-bold text-sm text-slate-800">{log.actorName || "Hệ thống"}</span>
                            <span className="text-xs text-slate-400 font-medium shrink-0">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : ""}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{log.note || log.action}</p>
                          {log.action && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded">
                              {log.action}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#0B4FC4] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
                  <Edit3 size={14} />
                  Cập nhật trạng thái
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition">
                  <MessageSquare size={14} />
                  Thêm ghi chú
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition">
                  <Share2 size={14} />
                  Chia sẻ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
