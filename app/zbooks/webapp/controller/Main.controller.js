sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel" 
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox, JSONModel) {
    "use strict"

    return Controller.extend("zbooks.controller.Main", {
        onInit: function () {
            // Khởi tạo JSONModel để quản lý trạng thái ẩn/hiện nút và chỉnh sửa
            var oViewModel = new JSONModel({
                isEditing: false // Mặc định ban đầu chưa ở chế độ edit
            });
            this.getView().setModel(oViewModel, "ui");

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

        // --- BỔ SUNG THÊM 2 HÀM NÀY ĐỂ ĐIỀU KHIỂN ẨN/HIỆN KHI EDIT ---
        formatNotEditing: function (bIsEditing) {
            return !bIsEditing; // Trả về true khi chưa bấm Edit -> Hiện ObjectStatus (ảnh 2)
        },

        formatIsEditing: function (bIsEditing) {
            return !!bIsEditing; // Trả về true khi bấm Edit -> Hiện ô Input để sửa
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

            var oBinding = oTable.getBinding("rows");
            if (oBinding) {
                var oModel = this.getView().getModel();
                if (oModel && oModel.hasPendingChanges && oModel.hasPendingChanges()) {
                    oModel.submitBatch("$auto");
                }
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
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pAddDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onSaveBook: function () {
            var oView = this.getView();
            var oModel = oView.getModel(); // OData V4 Model
            var oNewBookData = oView.getModel("newBook").getData();

            if (!oNewBookData.title || !oNewBookData.title.trim()) {
                MessageToast.show("Please enter a book title!");
                return;
            }

            var oTable = this.byId("booksTable");
            var oBinding = oTable ? oTable.getBinding("rows") : null;

            if (oBinding && oBinding.create) {
                var oPayload = {
                    title: oNewBookData.title.trim(),
                    author: oNewBookData.author ? oNewBookData.author.trim() : "",
                    stock: parseInt(oNewBookData.stock, 10) || 0
                };

                var oContext = oBinding.create(oPayload, false, false);

                oContext.created().then(function () {
                    MessageToast.show("New book saved successfully!");

                    if (oBinding.refresh) {
                        oBinding.refresh();
                    }
                }).catch(function (oError) {
                    MessageBox.error("Error saving book: " + (oError.message || "Unknown error"));
                });

                if (oModel && oModel.submitBatch) {
                    oModel.submitBatch("$auto").catch(function(oErr) {
                        console.error("Submit batch failed", oErr);
                    });
                }

                this.onCloseAddDialog();
            } else {
                MessageToast.show("Table binding not found for creation!");
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
            // Chuyển sang trạng thái chỉnh sửa: ẩn Add, Delete, hiện Save, Cancel
            var oModel = this.getView().getModel("ui");
            oModel.setProperty("/isEditing", true);
        },

        onSave: function () {
            var oView = this.getView();
            var oODataModel = oView.getModel(); // OData V4 Model hiện tại
            var oTable = this.byId("booksTable");

            // 1. Kiểm tra xem có thay đổi nào chưa lưu trên model hay không
            var bHasChanges = oODataModel && oODataModel.hasPendingChanges && oODataModel.hasPendingChanges();

            if (bHasChanges) {
                // 2. Nếu có, tiến hành submit batch để lưu dữ liệu
                oODataModel.submitBatch("$auto").then(function () {
                    MessageToast.show("Changes saved successfully!");
                }).catch(function (oError) {
                    MessageBox.error("Failed to save changes: " + (oError.message || "Unknown error"));
                });
            } else {
                // Trường hợp người dùng vừa gõ xong nhưng ô input chưa mất tiêu điểm (chưa commit binding)
                // Ta có thể ép submit trực tiếp để cố gắng đẩy dữ liệu
                oODataModel.submitBatch("$auto").then(function () {
                    MessageToast.show("Saved successfully!");
                }).catch(function () {
                    MessageToast.show("No changes detected. Please ensure you modified a field and clicked outside of it.");
                });
            }

            // 3. Đưa giao diện về lại chế độ bình thường (hiện Add/Edit/Delete, ẩn Save/Cancel, khóa lại các Input)
            oView.getModel("ui").setProperty("/isEditing", false);
        },

        onCancel: function () {
            var oView = this.getView();
            var oODataModel = oView.getModel();

            // Reset lại các thay đổi chưa lưu trên OData Model
            if (oODataModel && oODataModel.resetChanges) {
                oODataModel.resetChanges();
            }

            // Chuyển lại trạng thái bình thường
            oView.getModel("ui").setProperty("/isEditing", false);
            MessageToast.show("Edit cancelled.");
        },

        onDelete: function () {
            var oTable = this.byId("booksTable");
            var iSelectedIndex = oTable ? oTable.getSelectedIndex() : -1;

            if (iSelectedIndex === -1) {
                MessageToast.show("Please select a book to delete!");
                return;
            }

            var oContext = oTable.getContextByIndex(iSelectedIndex);
            if (!oContext) { return; }

            MessageBox.confirm("Are you sure you want to delete this book?", {
                title: "Confirm Delete",
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        oContext.delete().then(function () {
                            MessageToast.show("Deleted successfully!");
                        }).catch(function (oError) {
                            MessageBox.error("Delete failed!");
                        });
                    }
                }
            });
        },

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
            var oBindingContext = oEvent.getSource().getBindingContext() 
                || oEvent.getParameter("rowBindingContext");

            if (!oBindingContext) {
                var iRowIndex = oEvent.getParameter("rowIndex");
                var oTable = this.byId("booksTable");
                if (iRowIndex !== undefined && iRowIndex !== -1 && oTable) {
                    oBindingContext = oTable.getContextByIndex(iRowIndex);
                }
            }

            if (oBindingContext) {
                var sBookId = oBindingContext.getProperty("ID");
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteDetail", {
                    bookId: sBookId
                });
            }
        },

        onRefresh: function () {
            var oTable = this.byId("booksTable");
            var oFilterBar = this.byId("filterbar");
            var oBinding = oTable ? oTable.getBinding("rows") : null;
            
            // 1. Xóa sạch các lựa chọn trong các ô lọc (MultiComboBox / Input trên FilterBar)
            if (oFilterBar) {
                var aFilterGroupItems = oFilterBar.getFilterGroupItems();
                aFilterGroupItems.forEach(function (oFilterGroupItem) {
                    var oControl = oFilterGroupItem.getControl();
                    if (oControl) {
                        if (oControl.clearSelection) {
                            oControl.clearSelection(); // Dành cho MultiComboBox
                        } else if (oControl.setValue) {
                            oControl.setValue("");     // Dành cho Input thông thường
                        }
                    }
                });
            }

            // 2. Xóa bộ lọc đang gắn trên bảng và tiến hành refresh dữ liệu gốc
            if (oBinding) {
                oBinding.filter([]); // Xóa filter để bảng hiển thị lại toàn bộ danh sách
                oBinding.refresh();  // Tải lại dữ liệu mới nhất từ server
                MessageToast.show("Table refreshed and filters cleared!");
            } else {
                MessageToast.show("Could not find table binding to refresh.");
            }
        }
    });
});