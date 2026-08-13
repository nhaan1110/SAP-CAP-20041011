sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("zbooks.controller.Main", {
        onInit: function () {

        },

        // --- FORMATTERS ---
        formatStockText: function (iStock) {
            var iValue = parseInt(iStock, 10);
            if (isNaN(iValue)) { return iStock || ""; }
            if (iValue <= 2) { return "Out of stock (" + iValue + ")"; }
            else if (iValue <= 5) { return "Low Stock (" + iValue + ")"; }
            else { return "In stock (" + iValue + ")"; }
        },

        formatStockState: function (iStock) {
            var iValue = parseInt(iStock, 10);
            if (isNaN(iValue)) { return "None"; }
            if (iValue <= 2) { return "Error"; }
            else if (iValue <= 5) { return "Warning"; }
            else { return "Success"; }
        },

        formatStockIcon: function (iStock) {
            var iValue = parseInt(iStock, 10);
            if (isNaN(iValue)) { return ""; }
            if (iValue <= 2) { return "sap-icon://error"; }
            else if (iValue <= 5) { return "sap-icon://alert"; }
            else { return "sap-icon://sys-enter-2"; }
        },

        // --- SEARCH ---
        onSearch: function () {
            var oFilterBar = this.getView().byId("filterbar");
            var oTable = this.getView().byId("booksTable");

            if (!oFilterBar || !oTable) { return; }

            var aTableFilters = oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                var oControl = oFilterGroupItem.getControl();
                if (oControl && oControl.getSelectedItems) {
                    var aSelectedItems = oControl.getSelectedItems();
                    var aFilters = aSelectedItems.map(function (oItem) {
                        return new Filter({
                            path: oFilterGroupItem.getName(),
                            operator: FilterOperator.Contains,
                            value1: oItem.getText()
                        });
                    });

                    if (aSelectedItems.length > 0) {
                        aResult.push(new Filter({
                            filters: aFilters,
                            and: false
                        }));
                    }
                }
                return aResult;
            }, []);

            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(aTableFilters);
            }
        },

        // --- LOGIC THÊM SÁCH (ADD BOOK) ---
        onAdd: function () {
            var oView = this.getView();

           
            var oNewBookModel = new sap.ui.model.json.JSONModel({
                title: "",
                author: "",
                stock: 10
            });
            oView.setModel(oNewBookModel, "newBook");

            // Load Fragment và gán addDependent
            if (!this._pAddDialog) {
                this._pAddDialog = this.loadFragment({
                    name: "zbooks.view.AddBookDialog"
                }).then(function (oDialog) {
                    oView.addDependent(oDialog); // Bắt buộc để Dialog nhận Model
                    return oDialog;
                });
            }

            this._pAddDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

       onSaveBook: function () {
    var oView = this.getView();
    var oNewBookData = oView.getModel("newBook").getData();

    // Validate dữ liệu
    if (!oNewBookData.title || !oNewBookData.title.trim()) {
        MessageToast.show("Vui lòng nhập tên sách!");
        return;
    }

    var oTable = this.byId("booksTable");
    var oBinding = oTable ? oTable.getBinding("items") : null;

    // --- ĐOẠN SỬA LẠI: TÍNH ID TỰ TĂNG NỐI TIẾP ---
    var aItems = oTable ? oTable.getItems() : [];
    var iMaxId = 0;

    aItems.forEach(function (oItem) {
        var oContext = oItem.getBindingContext();
        if (oContext) {
            var iId = parseInt(oContext.getProperty("ID"), 10);
            if (!isNaN(iId) && iId > iMaxId) {
                iMaxId = iId;
            }
        }
    });

    var iNewId = iMaxId + 1; // ID mới sẽ bằng ID lớn nhất hiện tại + 1
    // ----------------------------------------------

    var oPayload = {
        ID: iNewId, // Đã thay thế dòng Date.now() cũ
        title: oNewBookData.title.trim(),
        author: oNewBookData.author ? oNewBookData.author.trim() : "",
        stock: parseInt(oNewBookData.stock, 10) || 0
    };

    // Xử lý chuẩn cho OData V4 (dựa theo manifest.json)
    if (oBinding && oBinding.create) {
        var oContext = oBinding.create(oPayload);

        oContext.created().then(function () {
            MessageToast.show("Đã lưu sách mới vào CSDL thành công!");
        }).catch(function (oError) {
            MessageBox.error("Lỗi khi lưu sách: " + (oError.message || "Lỗi không xác định"));
        });

        this.onCloseAddDialog();
    } else {
        MessageToast.show("Không tìm thấy Binding của bảng để thêm mới!");
    }
},

        onCloseAddDialog: function () {
            if (this._pAddDialog) {
                this._pAddDialog.then(function (oDialog) {
                    oDialog.close();
                });
            }
        },

        // --- CÁC THAO TÁC KHÁC ---
        onEdit: function () {
            var oTable = this.byId("booksTable");
            var oSelectedItem = oTable ? oTable.getSelectedItem() : null;

            if (!oSelectedItem) {
                MessageToast.show("Vui lòng chọn 1 cuốn sách trong bảng để sửa!");
                return;
            }

            var oContext = oSelectedItem.getBindingContext();
            var oBook = oContext ? oContext.getObject() : null;
            if (oBook) {
                MessageToast.show("Đang chọn sửa sách: " + (oBook.title || oBook.ID));
            }
        },

        onCopy: function () {
            var oTable = this.byId("booksTable");
            var oSelectedItem = oTable ? oTable.getSelectedItem() : null;

            if (!oSelectedItem) {
                MessageToast.show("Vui lòng chọn 1 cuốn sách để sao chép!");
                return;
            }

            var oBinding = oTable.getBinding("items");
            var oContext = oSelectedItem.getBindingContext();
            var oSelectedBook = oContext ? oContext.getObject() : null;

            if (oSelectedBook && oBinding && oBinding.create) {
                var oNewBook = Object.assign({}, oSelectedBook);
                oNewBook.ID = parseInt(String(Date.now()).slice(-3), 10);
                oNewBook.title = (oSelectedBook.title || "") + " (Copy)";

                oBinding.create(oNewBook);
                MessageToast.show("Đã tạo bản sao cho cuốn sách: " + oSelectedBook.title);
            }
        },

        onDelete: function () {
            var oTable = this.byId("booksTable");
            var oSelectedItem = oTable ? oTable.getSelectedItem() : null;

            if (!oSelectedItem) {
                MessageToast.show("Vui lòng chọn 1 cuốn sách để xóa!");
                return;
            }

            var oContext = oSelectedItem.getBindingContext();
            if (!oContext) { return; }

            MessageBox.confirm("Bạn có chắc chắn muốn xóa cuốn sách này?", {
                title: "Xác nhận xóa",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        oContext.delete().then(function () {
                            MessageToast.show("Đã xóa thành công!");
                        }).catch(function (oError) {
                            MessageBox.error("Xóa thất bại!");
                        });
                    }
                }
            });
        },

        // --- VALUE HELP ---
        onValueHelpRequest: function (oEvent) {
            this._oInputSource = oEvent.getSource();

            if (!this._oValueHelpDialog) {
                this.loadFragment({
                    name: "zbooks.view.AuthorValueHelp"
                }).then(function (oDialog) {
                    this._oValueHelpDialog = oDialog;
                    this.getView().addDependent(this._oValueHelpDialog);
                    this._oValueHelpDialog.open();
                }.bind(this));
            } else {
                this._oValueHelpDialog.open();
            }
        },

        onValueHelpSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("author", FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            if (oBinding) {
                oBinding.filter([oFilter]);
            }
        },

        onValueHelpConfirm: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem && this._oInputSource) {
                this._oInputSource.setValue(oSelectedItem.getTitle());
            }
        },

        onValueHelpClose: function () {
            if (this._oValueHelpDialog) {
                this._oValueHelpDialog.close();
            }
        }
    });
});