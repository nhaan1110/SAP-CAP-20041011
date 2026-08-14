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

        onAdd: function () {
            var oView = this.getView();

           
            var oNewBookModel = new sap.ui.model.json.JSONModel({
                title: "",
                author: "",
                stock: 10
            });
            oView.setModel(oNewBookModel, "newBook");

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

    if (!oNewBookData.title || !oNewBookData.title.trim()) {
        MessageToast.show("Vui lòng nhập tên sách!");
        return;
    }

    var oTable = this.byId("booksTable");
    var oBinding = oTable ? oTable.getBinding("items") : null;

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

    var iNewId = iMaxId + 1; 

    var oPayload = {
        ID: iNewId, 
        title: oNewBookData.title.trim(),
        author: oNewBookData.author ? oNewBookData.author.trim() : "",
        stock: parseInt(oNewBookData.stock, 10) || 0
    };

    // Xử lý OData V4 
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
        },
        onPressItem: function (oEvent) {
            // Lấy dòng (item) vừa được bấm
            var oItem = oEvent.getSource();
            // Lấy Binding Context của dòng đó
            var oBindingContext = oItem.getBindingContext();
            
            // Lấy thuộc tính khóa (ID cuốn sách). 
            var sBookId = oBindingContext.getProperty("ID");
           // Gọi Router để chuyển sang RouteDetail cùng tham số bookId
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDetail", {
                bookId: sBookId
            });
        }
    });
});

