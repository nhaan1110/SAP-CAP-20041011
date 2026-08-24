sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/comp/library",       // Bổ sung để hỗ trợ ValueHelpDialog
    "sap/ui/model/type/String"  // Bổ sung để cấu hình kiểu dữ liệu lọc
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox, compLibrary, TypeString) {
    "use strict";

    return Controller.extend("zbooks_sapm.controller.Main", {
        onInit: function () {},

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

            var oNewBookModel = new sap.ui.model.json.JSONModel({
                title: "",
                author: "",
                stock: 10
            });
            oView.setModel(oNewBookModel, "newBook");

            if (!this._pAddDialog) {
                this._pAddDialog = this.loadFragment({
                    name: "zbooks_sapm.view.AddBookDialog"
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

        // --- EDIT ---
        onEdit: function () {
            var oTable = this.byId("booksTable");
            var oSelectedItem = oTable ? oTable.getSelectedItem() : null;

            if (!oSelectedItem) {
                MessageToast.show("Please select a book from the table to edit!");
                return;
            }

            var oContext = oSelectedItem.getBindingContext();
            var oBook = oContext ? oContext.getObject() : null;
            if (oBook) {
                MessageToast.show("Selected book for editing: " + (oBook.title || oBook.ID));
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

        // --- VALUE HELP DIALOG (POPUUP DEFINE CONDITIONS) ---
     onAuthorVHRequested: function () {
    var oMultiInput = this.byId("authorFilter");
    var oView = this.getView();

    if (!this._pAuthorVHDialog) {
        this._pAuthorVHDialog = this.loadFragment({
            name: "zbooks_sapm.view.AuthorValueHelp"
        }).then(function (oDialog) {
            oView.addDependent(oDialog);

            // 1. Cấu hình cột hiển thị danh sách Tác giả (Tab Search List)
            var oTable = oDialog.getTable();
            oTable.setModel(oView.getModel());

            if (oTable.bindRows) { // Dành cho sap.ui.table.Table
                oTable.addColumn(new sap.ui.table.Column({
                    label: new sap.m.Label({ text: "Author" }),
                    template: new sap.m.Text({ text: "{author}" })
                }));
                oTable.bindRows("/Books");
            } else if (oTable.bindItems) { // Dành cho sap.m.Table
                oTable.bindAggregation("items", "/Books", new sap.m.ColumnListItem({
                    cells: [new sap.m.Label({ text: "{author}" })]
                }));
            }

            // 2. Cấu hình cho Tab Define Conditions
            oDialog.setRangeKeyFields([{
                label: "Author",
                key: "author",
                type: "string",
                typeInstance: new TypeString({}, { maxLength: 100 })
            }]);

            // Chỉ cho phép toán tử lọc văn bản
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

        onAuthorCancelPress: function (oEvent) {
            oEvent.getSource().close();
        },

        // --- SEARCH FILTERBAR ---
        onSearch: function () {
            var oFilterBar = this.getView().byId("filterbar");
            var oTable = this.getView().byId("booksTable");

            if (!oFilterBar || !oTable) { return; }

            var aTableFilters = [];

            oFilterBar.getFilterGroupItems().forEach(function (oFilterGroupItem) {
                var oControl = oFilterGroupItem.getControl();
                var sPath = oFilterGroupItem.getName();

                if (!oControl) { return; }

                // 1. MultiComboBox (Title)
                if (typeof oControl.getSelectedItems === "function") {
                    var aSelectedItems = oControl.getSelectedItems();
                    if (aSelectedItems.length > 0) {
                        var aTitleFilters = aSelectedItems.map(function (oItem) {
                            return new Filter({
                                path: sPath,
                                operator: FilterOperator.Contains,
                                value1: oItem.getText()
                            });
                        });
                        aTableFilters.push(new Filter({ filters: aTitleFilters, and: false }));
                    }
                } 
                // 2. MultiInput (Author Token từ ValueHelp)
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
                            return new Filter({
                                path: sPath,
                                operator: FilterOperator.Contains,
                                value1: oToken.getText().replace("=", "")
                            });
                        });
                        aTableFilters.push(new Filter({ filters: aAuthorFilters, and: false }));
                    }
                }
            });

            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                var oModel = this.getView().getModel();
                if (oModel && oModel.hasPendingChanges && oModel.hasPendingChanges()) {
                    oModel.submitBatch("$auto");
                }
                oBinding.filter(aTableFilters);
            }
        }
    });
});