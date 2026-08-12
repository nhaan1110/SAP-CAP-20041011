sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("zbooks.controller.Main", {
        onInit: function () {
           
        },

        //  (Nút Go) 
        onSearch: function () {
            var oFilterBar = this.getView().byId("filterbar");
            var oTable = this.getView().byId("booksTable");

            var aTableFilters = oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                var oControl = oFilterGroupItem.getControl(),
                    aSelectedItems = oControl.getSelectedItems(),
                    aFilters = aSelectedItems.map(function (oItem) {
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

                return aResult;
            }, []);

            oTable.getBinding("items").filter(aTableFilters);
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
            oEvent.getSource().getBinding("items").filter([oFilter]);
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