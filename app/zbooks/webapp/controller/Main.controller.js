sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("zbooks.controller.Main", {
        onInit: function () {
            var oJSONModel = this.initSampleDataModel();
            this.getView().setModel(oJSONModel);
        },

        // Tạo dữ liệu Books thay vì dùng products.json
        initSampleDataModel : function() {
            var oModel = new JSONModel();
            var oData = {
                Books: [
                    { ID: "B001", title: "Book A", author: "Author A", stock: 10 },
                    { ID: "B002", title: "Book B", author: "Author B", stock: 5 },
                    { ID: "B003", title: "Book C", author: "Author C", stock: 7 }
                ],
                headerExpanded: true
            };
            oModel.setData(oData);
            return oModel;
        },

        // Ví dụ hàm xử lý khi chọn chi tiết
        handleDetailsPress : function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var sBookId = oContext.getProperty("ID");
            MessageToast.show("Details for book with ID " + sBookId);
        }
    });
});
