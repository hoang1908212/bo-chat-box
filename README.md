# Bơ chat box – Chatbot (web app cài được)

Cách đưa lên mạng (miễn phí với Vercel):
1. Lấy khóa API tại console.anthropic.com, rồi đặt hạn mức chi tiêu hằng tháng để tránh bị trừ tiền ngoài ý muốn.
2. Đưa thư mục này lên GitHub, rồi vào vercel.com, chọn Add New > Project và chọn kho vừa tạo.
3. Ở bước cấu hình, thêm biến môi trường ANTHROPIC_API_KEY với giá trị là khóa của bạn.
4. Bấm Deploy. Vercel cho bạn một đường link công khai.
5. Cài lên màn hình chính: iPhone mở link bằng Safari > Chia sẻ > Thêm vào Màn hình chính. Android mở bằng Chrome > menu > Cài đặt ứng dụng.

Lưu ý: ai có link đều dùng được và chi phí tính vào khóa của bạn.

## Dùng khóa miễn phí của Google Gemini
1. Vào aistudio.google.com, đăng nhập bằng tài khoản Google, tạo khóa API (không cần thẻ).
2. Trên Vercel, thêm biến môi trường GEMINI_API_KEY với giá trị là khóa đó.
3. Nếu bị báo lỗi model, thêm biến GEMINI_MODEL với tên model có gói miễn phí hiện ra trong AI Studio.
Nếu có cả hai khóa thì app ưu tiên Gemini.
