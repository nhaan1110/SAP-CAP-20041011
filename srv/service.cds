using my.bookshop from '../db/schema';

service CatalogService {
  entity Books as projection on bookshop.Books;
}
