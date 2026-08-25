sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/Label",
    "sap/m/Input"
], function (Controller, History, MessageToast, MessageBox, Dialog, Button, VBox, Label, Input) {
    "use strict";

    return Controller.extend("zbooks_sapm.controller.Detail", {

        /**
         * Initialize Controller
         */
       onInit: function () {
    var oRouter = this.getOwnerComponent().getRouter();
    oRouter.getRoute("RouteDetail").attachPatternMatched(this._onObjectMatched, this);
},

_onObjectMatched: function (oEvent) {
    var sBookId = oEvent.getParameter("arguments").bookId;
    this.getView().bindElement({
        path: "/Books(" + sBookId + ")"
    });
},

        /**
         * Navigate back to previous page
         */
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteMain", {}, true);
            }
        },

        /**
         * Handle Book Edit
         */
        onEditPress: function () {
            var oView = this.getView();
            var oContext = oView.getBindingContext();

            if (!oContext) {
                MessageToast.show("Book data not found!");
                return;
            }

            if (!this._oEditDialog) {
                this._oEditDialog = new Dialog({
                    title: "Edit Book Details",
                    contentWidth: "400px",
                    content: [
                        new VBox({
                            class: "sapUiSmallMargin",
                            items: [
                                new Label({ text: "Title" }),
                                new Input({ value: "{title}" }),
                                new Label({ text: "Author", class: "sapUiSmallMarginTop" }),
                                new Input({ value: "{author}" }),
                                new Label({ text: "Stock Quantity", class: "sapUiSmallMarginTop" }),
                                new Input({ value: "{stock}", type: "Number" })
                            ]
                        })
                    ],
                    beginButton: new Button({
                        text: "Save",
                        type: "Emphasized",
                        press: function () {
                            oView.getModel().submitBatch("$auto").then(function () {
                                MessageToast.show("Updated database successfully!");
                                
                                if (oView.getModel() && oView.getModel().refresh) {
                                    oView.getModel().refresh();
                                }

                                this._oEditDialog.close();
                            }.bind(this)).catch(function (oError) {
                                MessageBox.error("Save failed: " + (oError.message || "Unknown error"));
                            });
                        }.bind(this)
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: function () {
                            if (oContext && oContext.getBinding() && oContext.getBinding().resetChanges) {
                                oContext.getBinding().resetChanges();
                            }
                            this._oEditDialog.close();
                        }.bind(this)
                    })
                });
                oView.addDependent(this._oEditDialog);
            }

            this._oEditDialog.open();
        },

        /**
         * Handle Book Delete
         */
        onDeletePress: function () {
            var oView = this.getView();
            var oContext = oView.getBindingContext();

            if (!oContext) {
                return;
            }

            MessageBox.confirm("Are you sure you want to delete this book?", {
                title: "Confirm Delete",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oContext.delete().then(function () {
                            MessageToast.show("Book deleted successfully!");

                            if (oView.getModel() && oView.getModel().refresh) {
                                oView.getModel().refresh();
                            }

                            this.onNavBack();
                        }.bind(this)).catch(function (oError) {
                            MessageBox.error("Delete failed: " + (oError.message || "Unknown error"));
                        });
                    }
                }.bind(this)
            });
        }

    });
});