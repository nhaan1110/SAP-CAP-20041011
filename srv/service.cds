using my.bookshop from '../db/schema';

service CatalogService {
    // Projection cho entity Books (managed) → CAP tự động thêm audit fields
    entity Books as projection on bookshop.Books;

    // Projection cho entity Orders (unmanaged) → audit fields tự xử lý trong service.js
    entity Orders as projection on bookshop.Orders;

    // Projection cho entity Chapters (composition) → vòng đời phụ thuộc Books
    entity Chapters as projection on bookshop.Chapters;
}
