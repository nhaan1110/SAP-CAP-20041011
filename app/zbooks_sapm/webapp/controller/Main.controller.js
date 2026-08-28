sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/comp/library",
    "sap/ui/model/type/String",
    "sap/ui/model/json/JSONModel"
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox, compLibrary, TypeString, JSONModel) { // 2. Đã thêm tham số JSONModel
    "use strict";

    return Controller.extend("zbooks_sapm.controller.Main", {
        onInit: function () { },



        onPressItem: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sBookId = oContext.getProperty("ID");

            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                bookId: sBookId
            });
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

        // --- ADD ---
        onAdd: function () {
            var oView = this.getView();

            var oNewBookModel = new JSONModel({
                title: "",
                author: "",
                stock: 10
            });
            oView.setModel(oNewBookModel, "newBook");

            if (!this._pAddDialog) {
                this._pAddDialog = this.loadFragment({
                    name: "zbooks_sapm.view.AddBookDialog",
                    controller: this
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
            var oModel = oView.getModel();
            var oNewBookData = oView.getModel("newBook").getData();

            if (!oNewBookData.title || !oNewBookData.title.trim()) {
                MessageToast.show("Please enter a book title!");
                return;
            }

            var oTable = this.byId("booksTable");
            var oBinding = oTable ? oTable.getBinding("items") : null;

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
                    oModel.submitBatch("$auto").catch(function (oErr) {
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

        // --- EDIT ---
        onEdit: function () {
            var oTable = this.byId("booksTable");
            var oSelectedItem = oTable ? oTable.getSelectedItem() : null;

            if (!oSelectedItem) {
                sap.m.MessageToast.show("Please select a book to edit!");
                return;
            }

            // 1. Lấy dữ liệu dòng được chọn
            var oContext = oSelectedItem.getBindingContext();
            var oSelectedData = oContext.getObject();

            // Lưu lại context để dùng khi Save
            this._oEditContext = oContext;

            // 2. Mở Pop-up
            var oView = this.getView();

            // Copy dữ liệu sang model tạm 'editBook' để sửa trên Pop-up
            var oEditModel = new sap.ui.model.json.JSONModel(Object.assign({}, oSelectedData));
            oView.setModel(oEditModel, "editBook");

            if (!this._pEditDialog) {
                this._pEditDialog = this.loadFragment({
                    name: "zbooks_sapm.view.EditBookDialog"
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pEditDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onSaveEditDialog: function () {
            var oEditData = this.getView().getModel("editBook").getData();
            var oContext = this._oEditContext;

            if (!oEditData.title || !oEditData.title.trim()) {
                sap.m.MessageToast.show("Please enter a book title!");
                return;
            }

            if (oContext) {
                // Cập nhật giá trị từ Pop-up vào OData Model gốc
                oContext.setProperty("title", oEditData.title.trim());
                oContext.setProperty("author", oEditData.author ? oEditData.author.trim() : "");
                oContext.setProperty("stock", parseInt(oEditData.stock, 10) || 0);

                // Đẩy thay đổi xuống Backend/DB
                var oModel = this.getView().getModel();
                if (oModel && oModel.submitBatch) {
                    oModel.submitBatch("$auto");
                } else if (oModel && oModel.submitChanges) {
                    oModel.submitChanges();
                }

                sap.m.MessageToast.show("Updated successfully!");
            }

            this.onCloseEditDialog();
        },

        // Nút Cancel trong Pop-up
        onCloseEditDialog: function () {
            if (this._pEditDialog) {
                this._pEditDialog.then(function (oDialog) {
                    oDialog.close();
                });
            }
        },

        // --- DELETE ---
        onDelete: function () {
            var oTable = this.byId("booksTable");
            var oSelectedItem = oTable ? oTable.getSelectedItem() : null;

            if (!oSelectedItem) {
                MessageToast.show("Please select a book to delete!");
                return;
            }

            var oContext = oSelectedItem.getBindingContext();
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

        onRefreshTable: function () {

            // 1. Xóa sạch dữ liệu trên ô lọc Book Title (MultiComboBox)
            var oTitleFilter = this.byId("filterbar").getFilterGroupItems()[0].getControl();
            if (oTitleFilter && oTitleFilter.removeAllSelectedKeys) {
                oTitleFilter.removeAllSelectedKeys();
            }

            // 2. Xóa sạch dữ liệu trên ô lọc Author (MultiInput)
            var oAuthorFilter = this.byId("authorFilter");
            if (oAuthorFilter && oAuthorFilter.removeAllTokens) {
                oAuthorFilter.removeAllTokens();
                oAuthorFilter.setValue("");
            }

            // 3. Reset bộ lọc của bảng để hiển thị lại toàn bộ danh sách
            var oTable = this.byId("booksTable");
            var oBinding = oTable ? oTable.getBinding("items") : null;
            if (oBinding) {
                oBinding.filter([]);
            }

            // 4. Làm mới dữ liệu từ OData Model
            var oModel = this.getView().getModel();
            if (oModel && oModel.refresh) {
                oModel.refresh();
            }
        },

        onAuthorVHRequested: function () {
            var oMultiInput = this.byId("authorFilter");
            var oView = this.getView();

            if (!this._pAuthorVHDialog) {
                this._pAuthorVHDialog = this.loadFragment({
                    name: "zbooks_sapm.view.AuthorValueHelp",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);

                    oDialog.setKey("author");
                    oDialog.setDescriptionKey("author");

                    var oColModel = new JSONModel({
                        cols: [
                            { label: "Author", template: "author" }
                        ]
                    });
                    oDialog.setModel(oColModel, "columns");

                    var oTable = new sap.m.Table({
                        mode: "MultiSelect",
                        columns: [
                            new sap.m.Column({
                                header: new sap.m.Label({ text: "Author" })
                            })
                        ]
                    });

                    oTable.bindItems({
                        path: "/Books",
                        template: new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: "{author}" })
                            ]
                        })
                    });

                    oDialog.setTable(oTable);

                    oDialog.setRangeKeyFields([{
                        label: "Author",
                        key: "author",
                        type: "string",
                        typeInstance: new TypeString({}, { maxLength: 100 })
                    }]);

                    if (oDialog.setIncludeRangeOperations) {
                        oDialog.setIncludeRangeOperations([
                            FilterOperator.Contains,
                            FilterOperator.EQ,
                            FilterOperator.StartsWith
                        ], "string");
                    }

                    return oDialog;
                }.bind(this));
            }

            this._pAuthorVHDialog.then(function (oDialog) {
                oDialog.setTokens(oMultiInput.getTokens());
                oDialog.open();
            });
        },

        onAuthorValueHelpOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            var oMultiInput = this.byId("authorFilter");

            oMultiInput.setTokens(aTokens);
            oEvent.getSource().close();
        },

        onTableValueHelpRequest: function (oEvent) {
            var oInput = oEvent.getSource();
            this._oCurrentTableInput = oInput;

            if (!this._pTableSelectDialog) {
                this._pTableSelectDialog = this.loadFragment({
                    name: "zbooks_sapm.view.TableAuthorValueHelp",
                    controller: this
                });
            }

            this._pTableSelectDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onTableValueHelpSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("author", FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");

            if (sValue) {
                oBinding.filter([oFilter]);
            } else {
                oBinding.filter([]);
            }
        },

        onTableValueHelpConfirm: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem && this._oCurrentTableInput) {
                var sSelectedAuthor = oSelectedItem.getTitle();

                this._oCurrentTableInput.setValue(sSelectedAuthor);
            }
        },

        onTableValueHelpCancel: function () {
            this._oCurrentTableInput = null;
        },

        onAuthorCancelPress: function (oEvent) {
            oEvent.getSource().close();
        },

        onSearch: function () {
            var oFilterBar = this.getView().byId("filterbar");
            var oTable = this.getView().byId("booksTable");

            if (!oFilterBar || !oTable) { return; }

            var aTableFilters = [];

            oFilterBar.getFilterGroupItems().forEach(function (oFilterGroupItem) {
                var oControl = oFilterGroupItem.getControl();
                var sPath = oFilterGroupItem.getName();

                if (!oControl) { return; }

                if (typeof oControl.getSelectedItems === "function") {
                    var aSelectedItems = oControl.getSelectedItems();
                    if (aSelectedItems.length > 0) {
                        var aTitleFilters = aSelectedItems.map(function (oItem) {
                            return new Filter({
                                path: "ID",
                                operator: FilterOperator.EQ,
                                value1: oItem.getKey()
                            });
                        });
                        aTableFilters.push(new Filter({ filters: aTitleFilters, and: false }));
                    }
                }
                else if (typeof oControl.getTokens === "function") {
                    var aTokens = oControl.getTokens();
                    if (aTokens.length > 0) {
                        var aAuthorFilters = aTokens.map(function (oToken) {
                            var oRangeData = oToken.data("range");

                            if (oRangeData) {
                                return new Filter({
                                    path: sPath,
                                    operator: oRangeData.operation || FilterOperator.Contains,
                                    value1: oRangeData.value1,
                                    value2: oRangeData.value2
                                });
                            }

                            var sCleanValue = oToken.getKey() || oToken.getText();
                            sCleanValue = sCleanValue.replace(/^[=]/, "").trim();

                            return new Filter({
                                path: sPath,
                                operator: FilterOperator.EQ,
                                value1: sCleanValue
                            });
                        });
                        aTableFilters.push(new Filter({ filters: aAuthorFilters, and: false }));
                    }
                }
            });

            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                if (aTableFilters.length > 0) {
                    oBinding.filter(new Filter({ filters: aTableFilters, and: true }));
                } else {
                    oBinding.filter([]);
                }
            }
        }
    });
});