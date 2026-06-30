import { z } from "zod";

// 1. Validate Input từ User (Chống spam, giới hạn độ dài)
export const ChatInputSchema = z.object({
  message: z.string().trim().min(1, "Tin nhắn không được để trống").max(1000, "Tin nhắn tối đa 1000 ký tự"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(20, "Lịch sử cuộc trò chuyện quá dài"), // Giới hạn context window
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

// 2. Schema trả về từ Gemini (Structured Output via JSON)
export const IntentSchema = z.discriminatedUnion("intent", [
  // Tra cứu mã sự cố
  z.object({
    intent: z.literal("LOOKUP"),
    trackingCode: z.string().optional(),
    reply: z.string().optional(),
    emotion: z.enum(["NEGATIVE", "NEUTRAL", "POSITIVE"]).optional(),
  }),
  // Hỏi đáp pháp luật (QA)
  z.object({
    intent: z.literal("QA_LEGAL"),
    query: z.string().optional(),
    reply: z.string().optional(),
    answer: z.string().optional(),
    citations: z.any().optional(),
  }),
  // Tạo báo cáo sự cố (Create Feedback)
  z.object({
    intent: z.literal("CREATE_FEEDBACK"),
    location: z.string().nullable().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    needsMoreInfo: z.array(z.string()).optional().default([]),
    confidence: z.number().optional(),
    emotion: z.string().optional(),
    reply: z.string().optional(),
    trackingCode: z.string().optional(),
  }),
  // Trò chuyện phiếm / Yêu cầu không xác định
  z.object({
    intent: z.literal("SMALLTALK"),
    reply: z.string(),
    emotion: z.enum(["NEGATIVE", "NEUTRAL", "POSITIVE"]).optional(),
  }),
]);

export type ChatIntent = z.infer<typeof IntentSchema>;

// 3. Schema cuối cùng để gửi Create Feedback lên DB
export const CreateFeedbackSchema = z.object({
  description: z.string().min(10, "Mô tả cần chi tiết hơn (ít nhất 10 ký tự)").max(2000),
  location: z.string().min(3, "Vui lòng cung cấp địa chỉ cụ thể"),
  category: z.enum(["ENVIRONMENT", "TRAFFIC", "INFRASTRUCTURE", "SECURITY", "OTHER"]),
  imageUrl: z.string().url("URL hình ảnh không hợp lệ").optional(),
});

export type CreateFeedbackRequest = z.infer<typeof CreateFeedbackSchema>;
