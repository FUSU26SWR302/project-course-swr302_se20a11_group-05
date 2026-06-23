Thành Phố Kết Nối (Citizen Connection System) - Nền Tảng Phản Ánh Đô Thị Thông Minh

Hệ thống điều phối số tập trung thuộc mô hình Thành phố thông minh (Smart City), đóng vai trò cầu nối trực tiếp giữa người dân và chính quyền thành phố Đà Nẵng (UBND Phường, Cơ quan Công an) nhằm tiếp nhận phản ánh sự cố đô thị theo thời gian thực và tự động điều phối xử lý. Giúp quá trình chuyển đổi số của thành phố Đà Nẵng rỗng rãi hơn trong tương lai.

---

##  1. Hàm Lượng Nghiên Cứu Hệ Thống (Research-Based Learning - RBL Focus)

Ngoài các chức năng thông thường dự án còn tập trung nghiên cứu sâu vào hai trụ cột công nghệ chính: **Kiến trúc Hệ thống Nâng cao (Hybrid RAG)** và **Tự động hóa Xử lý Dữ liệu Biên (Computer Vision & OCR)**.

### A. Kiến trúc Hệ thống & Trí tuệ nhân tạo (Hợp phần Hybrid RAG Engine)
* **Nội dung nghiên cứu:** Giải quyết bài toán hạn chế hiện tượng "ảo tưởng dữ liệu" (AI hallucination) của các mô hình ngôn ngữ lớn (LLM) và đảm bảo tính an toàn dữ liệu ranh giới trong khối hành chính công.
* **Triển khai:** Hệ thống xây dựng một đường ống (pipeline) **Hybrid RAG (Retrieval-Augmented Generation)** kết hợp giữa **Gemini API** @ **Grok API**  và Cơ sở dữ liệu Vector (Vector Database) nội bộ.


### B. Thị giác máy tính & Tự động phân loại (Hợp phần OCR Subsystem)
* **Nội dung nghiên cứu:** Tự động hóa quy trình tiếp nhận, kiểm định dữ liệu đa phương tiện (multimedia) và xử lý gộp trùng lặp dữ liệu không gian (Geo-spatial deduplication).
* **Triển khai:** Tích hợp một **OCR Engine (Nhận dạng ký tự quang học)** chạy bất đồng bộ thông qua Google Vision API ngay bên trong đường ống xử lý của Java Spring Boot.
* **Cơ chế vận hành:** * *Trích xuất thông tin:* Hệ thống tự động phân tích hình ảnh/video do người dân tải lên để nhận diện và bóc tách các chuỗi ký tự (như biển số xe vi phạm hoặc tên biển báo đường phố) nhằm lưu trữ làm bằng chứng số phục vụ công tác an ninh.
    * *Ràng buộc tính toàn vẹn dữ liệu:* Áp dụng các thuật toán kiểm tra dữ liệu nhị phân để tự động từ chối các tệp tin video có độ dài dưới **10 giây**, giúp ngăn chặn tin rác (spam) và tối ưu hóa dung lượng lưu trữ trên các tầng cloud (Cloudinary/Firebase).


---

##  2. Công Nghệ Sử Dụng (Tech Stack)

* **Backend Core:** Java Spring Boot (v3.x), Spring Data JPA, Spring Security JWT
* **Frontend:** ReactJS, TailwindCSS
* **Cơ sở dữ liệu:** SQL Sever (Thiết kế hệ quản trị cơ sở dữ liệu quan hệ)
* **Hệ thống API bên thứ ba:** Gemini API (Xử lý RAG Engine), Google Maps API (Tính toán Geofencing / Reverse Geocoding)
* **DevOps & Vận hành:** Docker, Docker Compose

---

## 3. Hướng Dẫn Cài Đặt (Installation Guide)

Hãy tuân thủ các bước cấu hình sau để thiết lập và chạy toàn bộ hệ thống dưới môi trường local.

### Điều kiện tiên quyết (Prerequisites)
Đảm bảo máy tính của bạn đã cài đặt sẵn các gói sau:
* Java Development Kit (JDK 17 trở lên)
* Node.js (v18.x trở lên) & npm
* Docker & Docker Compose

## 4. Quản lý task dự án ( Jira )
link: https://vitm2511.atlassian.net/jira/software/projects/TM/boards/36?atlOrigin=eyJpIjoiZGM0OGU5YzdkZjFmNDAyMWE3NDY5ZTgyOTU5M2RlN2MiLCJwIjoiaiJ9

