# Getting Started

Welcome to your new CAP project.

It contains these folders and files, following our recommended project layout:

File or Folder | Purpose
---------|----------
`app/` | content for UI frontends goes here
`db/` | your domain models and data go here
`srv/` | your service models and code go here
`readme.md` | this getting started guide

## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start with your domain model, in a CDS file in `db/`

## Learn More

Learn more at <https://cap.cloud.sap>.
# SAP CAP OData Project Demo (`sap-cap-demo`)
---

## 1. Các Entity trong dự án

Dự án được định nghĩa tại file `db/schema.cds` bao gồm 2 Entities chính thuộc namespace `my.bookshop`:

1. **`Books`** (Danh mục sách):
   - `ID`: Mã định danh sách (Integer - Primary Key).
   - `title`: Tên sách (String).
   - `author`: Tên tác giả (String).
   - `stock`: Số lượng tồn kho (Integer).

2. **`Orders`** (Đơn hàng):
   - `ID`: Mã định danh đơn hàng (Integer - Primary Key).
   - `quantity`: Số lượng sách đặt mua (Integer).
   - `book`: Liên kết đến thông tin chi tiết của sách trong bảng `Books`.

---

## 2. Quan hệ giữa các Entity

* **Mối quan hệ:** `Orders` có quan hệ **`Association`** 1-1 tới `Books` (`book : Association to Books`).
* **Ý nghĩa:** Mỗi đơn hàng (`Orders`) sẽ tham chiếu đến chính xác 1 cuốn sách trong danh mục (`Books`) thông qua trường khóa ngoại `book_ID`. Cách thiết kế này giúp chuẩn hóa dữ liệu, tránh trùng lặp thông tin sách ở bảng đơn hàng.

---

## 3. Danh sách các API đã tạo

Các API được công khai (expose) thông qua Service `CatalogService` tại đường dẫn `/odata/v4/catalog/`:

### 🔹 Truy vấn dữ liệu (GET Methods)
* **Lấy danh sách tất cả các sách:**
  `GET http://localhost:4004/odata/v4/catalog/Books`
* **Lấy danh sách tất cả đơn hàng:**
  `GET http://localhost:4004/odata/v4/catalog/Orders`
* **Lấy đơn hàng kèm thông tin chi tiết của Sách (Expand):**
  `GET http://localhost:4004/odata/v4/catalog/Orders?$expand=book`
* **Lọc danh sách sách có số lượng tồn kho > 5 (Filter):**
  `GET http://localhost:4004/odata/v4/catalog/Books?$filter=stock gt 5`
* **Sắp xếp tên sách theo thứ tự từ A-Z (Sort):**
  `GET http://localhost:4004/odata/v4/catalog/Books?$orderby=title asc`
* **Chỉ lấy trường tiêu đề và tồn kho của sách (Select):**
  `GET http://localhost:4004/odata/v4/catalog/Books?$select=title,stock`

### 🔹 Thao tác biến đổi dữ liệu (Mutation Methods)
Các request này có thể kiểm thử trực tiếp thông qua file `test.http` bằng extension **REST Client**:

* **Tạo đơn hàng mới (POST):**
  * **URL:** `POST http://localhost:4004/odata/v4/catalog/Orders`
  * **Header:** `Content-Type: application/json`
  * **Body:** `{"ID": 4, "quantity": 10, "book_ID": 1}`
* **Cập nhật số lượng đơn hàng (PATCH):**
  * **URL:** `PATCH http://localhost:4004/odata/v4/catalog/Orders(4)`
  * **Header:** `Content-Type: application/json`
  * **Body:** `{"quantity": 25}`
* **Xóa đơn hàng (DELETE):**
  * **URL:** `DELETE http://localhost:4004/odata/v4/catalog/Orders(4)`

---

## 4. Hướng dẫn cách chạy Project

### Yêu cầu môi trường
* Node.js (phiên bản 18/20/22 trở lên)
* Đã cài đặt `@sap/cds-dk` toàn cục (`npm i -g @sap/cds-dk`)

### Các bước khởi chạy

1. **Cài đặt các thư viện phụ thuộc (Dependencies):**
   ```bash
   npm install