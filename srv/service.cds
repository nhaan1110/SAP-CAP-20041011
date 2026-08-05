using my.bookshop from '../db/schema';

service CatalogService {
    entity Books as projection on bookshop.Books;
    entity Orders as projection on bookshop.Orders; }