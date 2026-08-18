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
            var oTable = this.byId("booksTable");
            var iSelectedIndex = oTable ? oTable.getSelectedIndex() : -1;

            if (iSelectedIndex === -1) {
                MessageToast.show("Please select a book from the table to edit!");
                return;
            }

            var oContext = oTable.getContextByIndex(iSelectedIndex);
            var oBook = oContext ? oContext.getObject() : null;
            if (oBook) {
                MessageToast.show("Selected book for editing: " + (oBook.title || oBook.ID));
            }
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
        }
    });
});