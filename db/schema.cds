using { managed } from '@sap/cds/common';  // Import aspect managed để tự động thêm audit fields
namespace my.bookshop;

// Entity Books có aspect managed → CAP tự động thêm createdAt, createdBy, modifiedAt, modifiedBy
entity Books : managed {
  key ID: Integer;     
  title: String;       
  author: String;      
  stock: Integer;      
  chapters: Composition of Chapters on chapters.book = $self; 
}

// Entity Orders là unmanaged → audit fields phải tự xử lý trong service.js
entity Orders {
  key ID    : Integer;              
  quantity  : Integer;              
  book      : Association to Books; 
}

// Entity Chapters để minh họa Composition
entity Chapters {
  key ID: Integer;                  
  book: Association to Books;       
  title: String;                    
  content: String;                 
}

