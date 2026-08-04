namespace my.bookshop;

entity Books {
  key ID: Integer;
  title: String;
  author: String;
  stock: Integer;
}

entity Orders {
  key ID    : Integer;
  quantity  : Integer;
  book      : Association to Books;
}