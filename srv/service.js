const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Books } = this.entities;

  // Xử lý trước khi tạo Order mới
  this.before('CREATE', 'Orders', async (req) => {
    const order = req.data;

    // 1. Kiểm tra số lượng đặt hàng
    if (!order.quantity || order.quantity <= 0) {
      return req.error(400, 'Số lượng đặt hàng phải lớn hơn 0.');
    }

    // 2. Lấy ID sách
    const bookId = order.book_ID || (order.book && order.book.ID);
    if (!bookId) {
      return req.error(400, 'Vui lòng cung cấp ID của sách cần đặt.');
    }

    // 3. Lấy thông tin tồn kho sách từ DB
    const book = await SELECT.one.from(Books).where({ ID: bookId });

    if (!book) {
      return req.error(404, `Không tìm thấy sách có ID = ${bookId}`);
    }

    // 4. Kiểm tra số lượng tồn kho
    if (book.stock < order.quantity) {
      return req.error(400, `Số lượng tồn kho không đủ. Hiện tại còn: ${book.stock}, Yêu cầu: ${order.quantity}`);
    }

    // 5. Trừ số lượng tồn kho trong database
    await UPDATE(Books)
      .where({ ID: bookId })
      .with({ stock: book.stock - order.quantity });
  });
});